import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash,webcrypto} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {
 buildEditorialDefaultsManifest,renderEditorialDefaultsSQL,
 renderEditorialDefaultsReadbackSQL,renderEditorialDefaultsRollbackSQL,
 verifyEditorialDefaultsReadback,parseWranglerEditorialReadback
} from '../scripts/plan-editorial-d1-defaults.mjs';
import {readVerifiedEditorialSnapshot} from '../worker/pandora-studio-editorial-defaults.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const manifest=buildEditorialDefaultsManifest();

test('issue 390: source-authored D1 default snapshot is stable and uses exact existing keys',()=>{
 const repeated=buildEditorialDefaultsManifest();
 assert.equal(manifest.schema,1);
 assert.equal(manifest.release,JSON.parse(read('package.json')).version);
 assert.match(manifest.digest,/^[a-f0-9]{64}$/);
 assert.match(manifest.snapshot,/^0\.[0-9]+\.[0-9]+-[a-f0-9]{16}$/);
 assert.equal(manifest.digest,repeated.digest);
 assert.equal(manifest.snapshot,repeated.snapshot);
 assert.deepEqual(manifest.records,repeated.records);
 assert.ok(manifest.records.length>200,'Expected substantive bilingual UI authorial coverage');
 assert.equal(manifest.stats.entries,manifest.records.length);
 assert.ok(manifest.records.length<=3000,'Matches read-only Worker record limit');
 assert.ok(manifest.records.reduce((n,r)=>n+r.value.length,0)<=450000,
  'Matches read-only Worker total source-character limit');
 const identities=manifest.records.map(r=>r.recordKey+'\u0000'+r.field);
 assert.equal(new Set(identities).size,identities.length,'Duplicate D1 field');
 assert.deepEqual([...identities].sort(),identities,'Canonical deterministic row order');
 assert.ok(manifest.stats.cohorts['ui-locale']>100);
 assert.ok(manifest.stats.cohorts['semantic-hints']>10);
 assert.ok(manifest.stats.cohorts['honor-overview']>10);
 assert.equal(manifest.stats.cohorts['item-field'],32,
  'Eight exact item stat labels and hover descriptions, RU + EN');
 assert.equal(manifest.stats.cohorts['equipment-tabs'],6,
  'Three existing equipment setting tabs, RU + EN');
 for(const key of ['kind','level','w','pen','ac','atkspeed','range','soulslot']){
  const recordKey='guideedit.book.wiki.item-field.'+key;
  const fields=manifest.records.filter(r=>r.recordKey===recordKey)
   .map(r=>r.field).sort();
  assert.deepEqual(fields,['en','hintEn','hintRu','ru'],
   'Only source-authorial item copy may be staged for '+key);
 }
 for(const tab of ['choose','details','souls']){
  const key='guideedit.book.equipment.tab.'+tab;
  assert.deepEqual(manifest.records.filter(r=>r.recordKey===key)
   .map(r=>r.field).sort(),['en','ru']);
 }
 assert.ok(manifest.stats.cohorts['owner-dock']>=40,
  'The existing owner dock headings and instructions must be in the D1 plan');
 for(const [key,locale] of [
  ['title','ru'],['step1','en'],['groupToolsHint','ru'],['finishHelp','en']
 ]){
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  const recordKey='guideedit.book.owner-dock.'+slug;
  const match=manifest.records.filter(r=>r.recordKey===recordKey&&r.field===locale);
  assert.equal(match.length,1,'Missing owner-dock default '+recordKey+'/'+locale);
 }
 assert.ok(manifest.records.some(r=>
  r.recordKey.startsWith('guideedit.book.ui.label.book-')&&r.field==='en'));
 assert.ok(manifest.records.some(r=>
  r.recordKey==='guideedit.honor.overview'&&r.field==='overviewRu'));
});

test('issue #390: all exact Wiki label field identities enter the physical D1 defaults plan',()=>{
 const scope={};scope.window=scope;
 runInNewContext(read('pandora-studio-wiki-labels.js'),scope);
 const wiki=scope.PandoraWikiLabels;
 const expected=[];
 for(const [group,entries] of [
  ['chapter',wiki.chapter],['honor',wiki.honor],['skillFilter',wiki.skillFilter]
 ]){
  for(const [id,[ru,en]] of Object.entries(entries)){
   expected.push([wiki.key(group,id,'ru'),ru]);
   expected.push([wiki.key(group,id,'en'),en]);
  }
 }
 const rows=manifest.records.filter(row=>row.recordKey==='guideedit.wiki.labels');
 assert.equal(manifest.stats.cohorts['wiki-labels'],expected.length);
 assert.equal(rows.length,expected.length);
 assert.equal(wiki.honor.victories[0],'Победы в PvP');
 assert.equal(wiki.honor.victories[1],'PvP Victories');
 for(const [field,value] of expected){
  assert.equal(wiki.validField(field),true,field);
  assert.equal(rows.filter(row=>row.field===field&&row.value===value).length,1,
   'Unmapped or duplicate Wiki author-copy field '+field);
 }
 for(const field of ['honor_victories_points','chapter_42_ru','skill_filter_stats_en'])
  assert.equal(rows.some(row=>row.field===field),false,
   'Runtime/game-derived fields must never enter authorial defaults');
});

test('#390 actual equipment captions and independent hover hints are pinned to current CAS identities',()=>{
 const source=read('pandora-studio-equipment-ui.js');
 const match=source.match(/const equipmentSummaryCopy=Object\.freeze\((\{[\s\S]*?\})\);/);
 const hint=source.match(/const equipmentTabHints=Object\.freeze\((\{[\s\S]*?\})\);/);
 assert.ok(match&&hint,'Rendered equipment source copy registries are required');
 const summary=runInNewContext('('+match[1]+')',{});
 const hints=runInNewContext('('+hint[1]+')',{});
 assert.equal(Object.keys(summary).length,15);
 assert.equal(manifest.stats.cohorts['equipment-summary'],30);
 assert.equal(manifest.stats.cohorts['equipment-hints'],6);
 assert.match(source,/\.map\(summaryCopyField\)/);
 assert.match(source,/const hints=equipmentTabHints/);
 assert.match(source,/context\?\.editLabel\?\.\(dt,'field\.'\+field\[0\]/);
 for(const [key,pair] of Object.entries(summary)){
  const recordKey='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [i,lang] of ['ru','en'].entries())
   assert.equal(manifest.records.find(row=>
    row.recordKey===recordKey&&row.field===lang)?.value,pair[i],recordKey);
 }
 for(const [tab,pair] of Object.entries(hints)){
  for(const [i,lang] of ['ru','en'].entries())
   assert.equal(manifest.records.find(row=>
    row.recordKey==='guideedit.book.equipment.hint.'+tab&&row.field===lang)?.value,
    pair[i]);
 }
 assert.equal(manifest.records.some(row=>
  /guideedit\.book\.equipment\..*item\.[0-9]+/.test(row.recordKey)),false);
});

test('#390 equipment controls and exact Soul unavailable states use existing CAS identities',()=>{
 const source=read('pandora-studio-equipment-ui.js');
 const registry=source.match(/const equipmentInterfaceCopy=Object\.freeze\((\{[\s\S]*?\})\);/);
 assert.ok(registry);
 const pairs=runInNewContext('('+registry[1]+')',{});
 assert.equal(Object.keys(pairs).length,19);
 assert.equal(manifest.stats.cohorts['equipment-interface'],38);
 assert.equal(manifest.stats.cohorts['equipment-soul-unavailable'],32);
 for(const [key,pair] of Object.entries(pairs)){
  const recordKey='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [i,lang] of ['ru','en'].entries())
   assert.equal(manifest.records.find(row=>
    row.recordKey===recordKey&&row.field===lang)?.value,pair[i],recordKey);
 }
 for(const slot of ['weapon','shield','head','body','gloves','legs','feet','belt']){
  for(const state of ['zero','unknown']){
   const id='guideedit.book.equipment.soul-unavailable-'+state+'.'+slot;
   const matched=manifest.records.filter(r=>r.recordKey===id);
   assert.deepEqual(matched.map(r=>r.field).sort(),['en','ru']);
   assert.ok(matched.every(r=>!r.value.includes('undefined')&&!r.value.includes('NaN')));
  }
 }
 assert.match(source,/if\(equipmentInterfaceCopy\[key\]\)\[ru,en\]=equipmentInterfaceCopy\[key\]/);
 assert.match(source,/const key=\(zero\?'soulUnavailableZero\.':'soulUnavailableUnknown\.'\)\+slot/);
 assert.equal(manifest.records.some(r=>r.recordKey.includes('item.13041')),false);
});

test('#390 original gear context, picker and Origin copy registries preserve existing stable owner keys',()=>{
 const app=read('pandora-studio-app.js');
 const gear=read('pandora-studio-equipment-ui.js');
 const picker=app.match(/const equipmentPickerMetaCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 const origin=app.match(/const originFixedLabels=(\[[\s\S]*?\]);/);
 const actions=gear.match(/const actionLabels=Object\.freeze\((\{[\s\S]*?\})\);/);
 assert.ok(picker&&origin&&actions);
 const pickerRows=runInNewContext('('+picker[1]+')',{});
 const originRows=runInNewContext('('+origin[1]+')',{});
 const actionLabels=runInNewContext('('+actions[1]+')',{});
 assert.equal(pickerRows.length,15);
 assert.equal(originRows.length,14);
 assert.equal(manifest.stats.cohorts['equipment-picker-meta'],30);
 assert.equal(manifest.stats.cohorts['equipment-context-menu'],10);
 assert.equal(manifest.stats.cohorts['origin-headings'],26);
 assert.match(app,/equipmentCopy\('context\.'\+id,ru,en\)/);
 assert.match(app,/if\(adminEditing&&adminToken\)equipmentCopyLabel\(label,'context\.'\+id,ru,en\)/);
 for(const [key,ru,en] of pickerRows){
  const id='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [lang,value] of [['ru',ru],['en',en]])
   assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field===lang)?.value,
    value,id);
 }
 for(const [selector,key,ru,en] of originRows){
  assert.ok(selector);
  const id='guideedit.book.origin.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [lang,value] of [['ru',ru],['en',en]]){
   const saved=manifest.records.find(r=>r.recordKey===id&&r.field===lang);
   if(key==='classCount')assert.equal(saved,undefined);
   else assert.equal(saved?.value,value,id);
  }
 }
 for(const [key,values] of Object.entries(actionLabels)){
  const id='guideedit.book.equipment.context.'+key;
  for(const [i,lang] of ['ru','en'].entries())
   assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field===lang)?.value,
    values[i],id);
 }
});

test('#390 equipment picker owner selection registry seeds real direct-edit keys, not player search data',()=>{
 const app=read('pandora-studio-app.js');
 const match=app.match(
  /const equipmentPickerSelectionCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(match);
 const rows=runInNewContext('('+match[1]+')',{});
 assert.equal(rows.length,15);
 assert.equal(manifest.stats.cohorts['equipment-picker-selection'],30);
 assert.match(app,/\.\.\.equipmentPickerSelectionCopyRows/);
 for(const [key,ru,en] of rows){
  const id='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='ru')?.value,ru);
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='en')?.value,en);
 }
 assert.equal(manifest.records.some(r=>r.recordKey==='guideedit.book.equipment.picker-search-query'),false);
});

test('#390 original Wiki map authorial labels seed exact CAS fields, not validation/game truth',()=>{
 const source=read('pandora-studio-app.js');
 const sourceRegistry=source.match(/const wikiMapRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(sourceRegistry);
 const rows=runInNewContext('('+sourceRegistry[1]+')',{});
 assert.equal(rows.length,58);
 assert.equal(manifest.stats.cohorts['wiki-map-authorial'],88);
 assert.match(source,/ownerCopy\('wiki\.map\.text',key,row\[1\],row\[2\]\)/);
 const excluded=new Set([
  'chanceUnknown','tagLimit','tagDuplicate','tagRequired',
  'sectionLimit','sectionRequired','npcRequired','npcCreateFailure',
  'createMapRequired','createMapFailure','deleteRecordButton',
  'deleteRecordLinked','deleteRecordConfirm','deleteRecordFailure'
 ]);
 for(const [key,ru,en] of rows){
  const recordKey='guideedit.book.wiki.map.text.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  const records=manifest.records.filter(r=>r.recordKey===recordKey);
  if(excluded.has(key))assert.equal(records.length,0,'Unsafe source field '+key);
  else{
   assert.equal(records.length,2,recordKey);
   assert.equal(records.find(r=>r.field==='ru')?.value,ru);
   assert.equal(records.find(r=>r.field==='en')?.value,en);
  }
 }
});

test('#390 actual monster, NPC trade, chest and item owner registries exclude unsafe source/game copy',()=>{
 const app=read('pandora-studio-app.js');
 const families=[
  ['wikiMonsterRows','wiki.monster.text','wiki-monster-authorial',56,94,
   ['chanceMissing','limitReached','createLinkFailure','createMonsterRequired',
    'createMonsterFailure','deleteRecordButton','deleteRecordLinked',
    'deleteRecordConfirm','deleteRecordFailure']],
  ['wikiNpcTradeRows','wiki.npc.trade','wiki-npc-trade-authorial',40,64,
   ['sellerMissing','deleteTrade','deleteAria','deleteConfirm',
    'deleteRecordButton','deleteRecordLinked','deleteRecordConfirm',
    'deleteRecordFailure']],
  ['wikiChestDisplayRows','wiki.chest.text','wiki-chest-authorial',35,50,
   ['certainHeading','oneGold','oneItem','keyUnlisted','contentsMissing',
    'contentsUnlisted','goldMissing','rewardMissing','deleteGroup',
    'removeReward']],
  ['wikiItemDisplayRows','wiki.item.text','wiki-item-display-authorial',29,54,
   ['levelRewardAbove','sourcesMissing']]
 ];
 let count=0;
 for(const [registry,section,cohort,expectedSize,expectedEntries,excluded] of families){
  const match=app.match(new RegExp('const '+registry+
   '=Object\\.freeze\\((\\[[\\s\\S]*?\\])\\);'));
  assert.ok(match,registry);
  const rows=runInNewContext('('+match[1]+')',{});
  assert.equal(rows.length,expectedSize,registry);
  assert.equal(manifest.stats.cohorts[cohort],expectedEntries,cohort);
  const blocked=new Set(excluded);
  for(const [key,ru,en] of rows){
   const id='guideedit.book.'+section+'.'+
    key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
   const stored=manifest.records.filter(row=>row.recordKey===id);
   if(blocked.has(key))assert.equal(stored.length,0,'Unsafe '+id);
   else{
    assert.equal(stored.length,2,id);
    assert.equal(stored.find(r=>r.field==='ru')?.value,ru);
    assert.equal(stored.find(r=>r.field==='en')?.value,en);
    count+=2;
   }
  }
 }
 assert.equal(count,262);
 for(const section of ['wiki.monster.text','wiki.npc.trade','wiki.chest.text','wiki.item.text'])
  assert.match(app,new RegExp("ownerCopy\\('"+section.replaceAll('.','\\.')+"',key,"));
});

test('#390 profession count is derived from current class identities, never D1 authorial copy',()=>{
 const app=read('pandora-studio-app.js'),html=read('index.html');
 assert.match(app,/if\(key==='classCount'\)continue/);
 assert.match(app,/const n=jobKeys\.length/);
 assert.match(app,/const text=lang==='en'\?n\+' classes'/);
 assert.match(html,/id="classCount" data-derived-game-count="classes"/);
 assert.doesNotMatch(html,/id="classCount" data-i18n=/);
 for(const key of [
  'guideedit.book.origin.class-count','guideedit.book.ui.label.class-count'
 ])assert.equal(manifest.records.some(row=>row.recordKey===key),false,
   'Count must not be stored as authorial default: '+key);
});

test('#390 Hero Path and Honor source-authored labels have pinned semantic D1 defaults',()=>{
 const path=read('pandora-studio-hero-path.js');
 const honor=read('pandora-studio-honor-view.js');
 const app=read('pandora-studio-app.js');
 const authored=[...path.matchAll(
  /\bauthored\(\s*api\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'/g
 )].map(m=>[m[1],m[2],m[3]]);
 assert.equal(authored.length,14);
 assert.equal(manifest.stats.cohorts['hero-path-authorial'],28);
 assert.match(app,/copyLabel:\(key,ru,en\)=>ownerCopy\('path',key,ru,en\)/);
 for(const [key,ru,en] of authored){
  const id='guideedit.book.path.'+
   key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='ru')?.value,ru);
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='en')?.value,en);
 }
 const honorRows=[...honor.matchAll(
  /\beditorial\(\s*'[^']+'\s*,\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/g
 )].map(m=>[m[1],m[2],m[3]]);
 assert.equal(honorRows.length,9,'Exact deployed Honor editorial call inventory');
 const unique=new Map();
 for(const [key,ru,en] of honorRows){
  const previous=unique.get(key);
  if(previous)assert.deepEqual(previous,[ru,en]);
  unique.set(key,[ru,en]);
 }
 assert.equal(unique.size,8,'Search-empty key is reused by two routes');
 assert.equal(manifest.stats.cohorts['honor-view-authorial'],14);
 assert.match(app,/copy:\(key,ru,en\)=>ownerCopy\('honor-view',key,ru,en\)/);
 for(const [key,[ru,en]] of unique){
  const id='guideedit.book.honor-view.'+
   key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  const stored=manifest.records.filter(r=>r.recordKey===id);
  if(key==='pvpDoubleRewards'){
   assert.equal(stored.length,0,'Source-defined PvP schedule is not authorial content');
  }else{
   assert.equal(stored.length,2,id);
   assert.equal(stored.find(r=>r.field==='ru')?.value,ru);
   assert.equal(stored.find(r=>r.field==='en')?.value,en);
  }
 }
 for(const term of ['guideedit.book.path.skill.32001','guideedit.book.honor-view.rank.5'])
  assert.ok(!manifest.records.some(r=>r.recordKey===term),
   'Skill IDs and Honor rank mechanics never enter source-authored copy');
});

test('#390 real Honor PvP tables and generated rank phrases are copied without gameplay row values',()=>{
 const honor=read('pandora-studio-honor-view.js');
 const tables=[...honor.matchAll(
  /\baddTable\('([^']+)','([^']+)','([^']+)',\s*(\[\[[\s\S]*?\]\])\s*,/g
 )].map(m=>[m[1],m[2],m[3],m[4]]);
 assert.deepEqual(tables.map(row=>row[0]),['pvpDaily','pvpWeekly','pvpHunt']);
 assert.equal(manifest.stats.cohorts['honor-pvp-tables'],22);
 const values=[];
 for(const [key,ru,en,raw] of tables){
  const headers=runInNewContext('('+raw+')',{});
  values.push([key+'Heading',ru,en]);
  for(const [i,pair] of headers.entries())values.push([key+'Column'+i,...pair]);
 }
 assert.equal(values.length,11);
 const phrases=[...honor.matchAll(
  /\bphrase\('([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/g
 )].map(m=>[m[1],m[2],m[3]]);
 assert.equal(phrases.length,8);
 const unique=new Map();
 for(const [key,ru,en] of phrases){
  if(unique.has(key))assert.deepEqual(unique.get(key),[ru,en]);
  unique.set(key,[ru,en]);
 }
 assert.equal(unique.size,7);
 assert.equal(manifest.stats.cohorts['honor-rank-phrases'],14);
 assert.equal(manifest.stats.cohorts['honor-list-headings'],2);
 values.push(...[...unique].map(([key,pair])=>[key,...pair]));
 values.push(['zonesHeading','PvP-локации','PvP locations']);
 for(const [key,ru,en] of values){
  const id='guideedit.book.honor-view.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  assert.equal(manifest.records.find(row=>row.recordKey===id&&row.field==='ru')?.value,
   ru,id);
  assert.equal(manifest.records.find(row=>row.recordKey===id&&row.field==='en')?.value,
   en,id);
 }
 const original=manifest.records.find(row=>row.recordKey===
  'guideedit.book.honor-view.wars-heading'&&row.field==='ru');
 assert.equal(original?.value,'PvP-войны','No duplicate warsHeading D1 key');
 assert.equal(manifest.records.filter(row=>row.recordKey===
  'guideedit.book.honor-view.wars-heading').length,2);
 for(const suffix of ['pvp-daily-wins','rank-1-total-honor','pvp-weekly-limit-value'])
  assert.equal(manifest.records.some(row=>
   row.recordKey==='guideedit.book.honor-view.'+suffix),false);
});

test('#390 Path group, skill count, loading and metadata prose are versioned but numbers are not',()=>{
 const source=read('pandora-studio-hero-path.js');
 const expected=new Set([
  'pathGroupTrained','pathGroupLearned','pathGroupInvested',
  'pathPointsLoading','pathBranchCapZero','pathPointsUnavailable',
  'skillCountOne','skillCountFew','skillCountMany',
  'skillUpgradeCurrentBefore','skillUpgradeFutureBefore',
  'skillUpgradeCurrentAfter','skillUpgradeFutureAfter'
 ]);
 const states=[...source.matchAll(
  /\['([^']+)','([^']*)','([^']*)'\]/g
 )].filter(m=>expected.has(m[1])).map(m=>[m[1],m[2],m[3]]);
 const fieldRows=[...source.matchAll(
  /\bfield\('([^']+)','([^']+)','([^']+)',/g
 )].map(m=>[m[1],m[2],m[3]]);
 assert.equal(states.length,13);
 assert.equal(fieldRows.length,7);
 assert.equal(manifest.stats.cohorts['hero-path-states'],40);
 for(const [key,ru,en] of [...states,...fieldRows]){
  const id='guideedit.book.path.'+
   key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(manifest.records.filter(r=>r.recordKey===id).length,2,id);
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='ru')?.value,
   ru,id);
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='en')?.value,
   en,id);
 }
 assert.match(source,/class:'path-group-summary-value'/);
 assert.match(source,/class:'path-skill-count-value'/);
 assert.match(source,/class:'path-version-level',text:'50'/);
 for(const id of ['path.skill-320005001','path.level-50','path.group-trained-value'])
  assert.ok(!manifest.records.some(r=>r.recordKey==='guideedit.book.'+id));
});

test('#390 Hero Path aria/help source captions exclude dynamic branch names and points',()=>{
 const path=read('pandora-studio-hero-path.js');
 const binds=[...path.matchAll(
  /bindPathCopy\(api,\s*\w+,'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'/g
 )].map(m=>[m[1],m[2],m[3]]);
 const help=[...path.matchAll(
  /'(branchPointHelp|greenMasteryHelp)','([^']+)'\s*,\s*'([^']+)'/g
 )].map(m=>[m[1],m[2],m[3]]);
 const weapon=[...path.matchAll(
  /\['(skillWeaponRange)','([^']+)','([^']+)'\]/g
 )].map(m=>[m[1],m[2],m[3]]);
 assert.equal(binds.length,16);
 assert.equal(help.length,2);
 assert.equal(weapon.length,1);
 assert.equal(manifest.stats.cohorts['hero-path-accessible'],36);
 for(const [key,ru,en] of [...binds,...help,...weapon]){
  const id='guideedit.book.path.'+
   key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(manifest.records.filter(row=>row.recordKey===id).length,2,id);
  assert.equal(manifest.records.find(row=>row.recordKey===id&&row.field==='ru')?.value,
   ru,id);
  assert.equal(manifest.records.find(row=>row.recordKey===id&&row.field==='en')?.value,
   en,id);
 }
 assert.match(path,/bindPathCopy\(api,input,'pathMasteryAria'/);
 assert.match(path,/bindPathCopy\(api,button,'pathUnlockPoints'/);
 assert.ok(path.includes("bindPathCopy(api,title,helpKey,ruHelp,enHelp,'aria-label','',name+'. ');"));
 for(const key of ['path.branch-branch-name','path.skill-current-mp-value'])
  assert.ok(!manifest.records.some(row=>row.recordKey==='guideedit.book.'+key));
});

test('#390 Path requirements and unlock status copy never include thresholds or skill identities',()=>{
 const source=read('pandora-studio-hero-path.js');
 const rows=[...source.matchAll(
  /\['(pathReq[a-zA-Z]+)','([^']+)','([^']+)',(?:req\.amount|cap|available|mastered|base|value|green)\]/g
 )].map(m=>[m[1],m[2],m[3]]);
 const unique=new Map();
 for(const [key,ru,en] of rows){
  if(unique.has(key))assert.deepEqual(unique.get(key),[ru,en]);
  unique.set(key,[ru,en]);
 }
 assert.equal(rows.length,8);
 assert.equal(unique.size,6);
 assert.equal(manifest.stats.cohorts['hero-path-requirement-captions'],12);
 assert.equal(manifest.stats.cohorts['hero-path-unlock-states'],4);
 const status=source.match(
  /word=authored\(api,mark\.locked\?'pathUnlockOverCap':'pathUnlockReady',\s*mark\.locked\?'([^']+)':'([^']+)',\s*mark\.locked\?'([^']+)':'([^']+)'/
 );
 assert.ok(status,'Status selection still uses source readiness');
 unique.set('pathUnlockOverCap',[status[1],status[3]]);
 unique.set('pathUnlockReady',[status[2],status[4]]);
 for(const [key,[ru,en]] of unique){
  const id='guideedit.book.path.'+
   key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(manifest.records.filter(row=>row.recordKey===id).length,2,id);
  assert.equal(manifest.records.find(row=>row.recordKey===id&&row.field==='ru')?.value,
   ru,id);
  assert.equal(manifest.records.find(row=>row.recordKey===id&&row.field==='en')?.value,
   en,id);
 }
 assert.match(source,/class:'path-requirement-value',text:String\(value\)/);
 assert.match(source,/class:'path-unlock-status'/);
 for(const key of ['path.path-req-threshold-value','path.path-unlock-skill-id'])
  assert.ok(!manifest.records.some(row=>row.recordKey==='guideedit.book.'+key));
});

test('#390 Workbench catalog contains only five mounted hints, with old D1 CAS untouched',()=>{
 const app=read('pandora-studio-app.js');
 const source=app.match(/const WORKBENCH_HINTS=(\[[\s\S]*?\]);/);
 const excluded=app.match(
  /const SELF_EXPLANATORY_TABS=new Set\((\[[\s\S]*?\])\);/);
 assert.ok(source&&excluded);
 const hints=runInNewContext('('+source[1]+')',{});
 const suppressed=runInNewContext('('+excluded[1]+')',{});
 assert.equal(hints.length,5);
 assert.equal(suppressed.length,5);
 assert.equal(manifest.stats.cohorts['workbench-hover-hints'],10);
 assert.equal(hints.map(row=>row[1]).join('|'),
  'hintPortrait|hintWeapon|hintNewBuild|hintSaveBuild|hintReset');
 for(const [section,key,selector,ru,en] of hints){
  assert.ok(!suppressed.includes(selector));
  const recordKey='guideedit.book.'+section+'.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  const defaults=manifest.records.filter(row=>row.recordKey===recordKey);
  assert.equal(defaults.length,2,recordKey);
  assert.equal(defaults.find(row=>row.field==='ru')?.value,ru);
  assert.equal(defaults.find(row=>row.field==='en')?.value,en);
 }
 // Historical, no-longer-shown CAS overrides stay in D1 without becoming
 // this release's editable authorial defaults.
 for(const key of ['origin.hint-race','origin.hint-class','origin.hint-stats',
  'path.hint-growth','path.hint-skills'])
  assert.equal(manifest.records.some(row=>
   row.recordKey==='guideedit.book.'+key),false);
 assert.match(app,/WORKBENCH_HINTS\.filter\(row=>row\[0\]===section\)/);
 assert.match(app,/if\(!rows\.length\)continue; \/\/ The Origin tabs have no hover explanations/);
 assert.match(app,/window\.PandoraGuideTooltip\?\.attach\?\.\(node,hint,\{hoverDelay:350\}\)/);
 assert.doesNotMatch(app,/node\.dataset\.workbenchGuideBound='1'/);
 assert.match(app,/node\.removeAttribute\('aria-description'\)/);
});

test('#390 actual Wiki, Skill and Stats owner editors seed their exact fixed copy, not live numbers',()=>{
 const app=read('pandora-studio-app.js');
 const sets=[
  ['wikiCoreCopyRows','wiki-ui','wiki-core-authorial',17,34],
  ['skillUiCopyRows','skill-ui','skill-controls-authorial',2,4],
  ['statsUiCopyRows','stats-ui','hero-stats-authorial',2,4]
 ];
 for(const [name,section,cohort,count,rowsExpected] of sets){
  const match=app.match(new RegExp('const '+name+
   '=Object\\.freeze\\((\\[[\\s\\S]*?\\])\\);'));
  assert.ok(match,'Missing actual live registry '+name);
  const entries=runInNewContext('('+match[1]+')',{});
  assert.equal(entries.length,count,name);
  assert.equal(manifest.stats.cohorts[cohort],rowsExpected,name);
  for(const [key,ru,en] of entries){
   const recordKey='guideedit.book.'+section+'.'+
    key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
   assert.equal(manifest.records.filter(r=>r.recordKey===recordKey).length,2,
    recordKey);
   assert.equal(manifest.records.find(r=>r.recordKey===recordKey&&r.field==='ru')?.value,
    ru,recordKey);
   assert.equal(manifest.records.find(r=>r.recordKey===recordKey&&r.field==='en')?.value,
    en,recordKey);
  }
 }
 assert.match(app,/ownerInterfaceEditor\('wiki-ui',wikiCoreCopyRows/);
 assert.match(app,/ownerInterfaceEditor\('stats-ui',statsUiCopyRows/);
 assert.match(app,/reconcilePanel\('ownerSkillSearchCopy','skill-ui',skillUiCopyRows/);
 assert.match(app,/String\(visible\.length\)/);
 assert.match(app,/String\(results\.length\)/);
 for(const path of ['wiki-ui.results-total','stats-ui.remaining-number','skill-ui.search-query'])
  assert.equal(manifest.records.some(r=>r.recordKey==='guideedit.book.'+path),false);
});

test('#390 encyclopedia footer authorial D1 words stay separate from real catalog counts',()=>{
 const app=read('pandora-studio-app.js'),html=read('index.html');
 const m=app.match(/const catalogCountParts=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(m);
 const rows=runInNewContext('('+m[1]+')',{});
 assert.equal(rows.map(r=>r[0]).join('|'),'lead|skills|items|souls');
 assert.equal(manifest.stats.cohorts['catalog-footer-authorial'],8);
 for(const [key,ru,en] of rows){
  const id='guideedit.book.catalog-sync.catalog-count-'+key;
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='ru')?.value,ru);
  assert.equal(manifest.records.find(r=>r.recordKey===id&&r.field==='en')?.value,en);
 }
 const source=app.slice(app.indexOf('function renderCatalogStatus(){'),
  app.indexOf('// Only mounted, meaningful action help',app.indexOf('function renderCatalogStatus(){')));
 assert.match(source,/catalogSource\?\.meta\?\.counts/);
 assert.match(source,/ownerCopyLabel\(label,'catalog-sync',id,ru,en\)/);
 assert.match(source,/data-catalog-status-value/);
 assert.match(source,/data-catalog-status-copy/);
 assert.match(source,/target\.dataset\.catalogStatusOwner/);
 assert.match(source,/label\.querySelector\('\.wiki-inline-input,\[data-owner-text-field\]'\)/);
 assert.match(app,/refreshWorkbenchHints\(\);renderCatalogStatus\(\);updateAdminHint\(\)/);
 assert.match(html,/id="catalogStatus"/);
 assert.equal(manifest.records.some(r=>r.recordKey==='guideedit.book.catalog-sync.catalog-count-total'),false);
});

test('#390 profile owner copy defaults mirror live source labels, never player data',()=>{
 const source=read('pandora-studio-app.js');
 const match=source.match(/const profileAuthorialCopy=Object\.freeze\((\{[\s\S]*?\})\);/);
 assert.ok(match);
 const pairs=runInNewContext('('+match[1]+')',{});
 assert.equal(Object.keys(pairs).length,12);
 assert.equal(manifest.stats.cohorts['profile-authorial'],24);
 assert.match(source,/const authored=profileAuthorialCopy\[key\]/);
 assert.match(source,/\["name",\.\.\.profileAuthorialCopy\['field-name'\]/);
 assert.match(source,/placeholder:ownerCopy\('profile','bio-placeholder',\s*\.\.\.profileAuthorialCopy\['bio-placeholder'\]/);
 for(const [key,pair] of Object.entries(pairs)){
  const id='guideedit.book.profile.'+key;
  for(const [i,lang] of ['ru','en'].entries())
   assert.equal(manifest.records.find(row=>row.recordKey===id&&row.field===lang)?.value,pair[i],id);
 }
 for(const name of ['name','guild','nation','rank','about','level','racialPassiveId'])
  assert.equal(manifest.records.some(r=>r.recordKey==='guideedit.book.profile.'+name),
   false,'Profile data cannot become a static D1 authorial default: '+name);
});

test('issue 390: migration never materializes runtime values or rewrites an override',()=>{
 assert.equal(manifest.records.some(r=>
  /(?:^|\.)(?:character|item|soul|account|formula|amount|gold|points|chance)\.[0-9]+/.test(r.recordKey)),false);
 for(const row of manifest.records){
  assert.match(row.recordKey,/^guideedit\./);
  assert.doesNotMatch(row.value,/[\x00-\x08\x0b\x0c\x0e-\x1f]/);
 }
 // The default Honor rows intentionally exclude mutable progression
 // thresholds. They still have the original D1 keys for authorial copy.
 const rankEntries=manifest.records.filter(r=>r.recordKey.startsWith('guideedit.honor.rank.'));
 assert.ok(rankEntries.length>20);
 assert.ok(rankEntries.every(r=>['nameRu','nameEn','benefitRu','benefitEn'].includes(r.field)));
 const sql=renderEditorialDefaultsSQL(manifest);
 assert.equal((sql.match(/INSERT INTO editorial_default_rows\(/g)||[]).length,
  manifest.records.length);
 assert.equal((sql.match(/INSERT INTO editorial_default_snapshots\(/g)||[]).length,1);
 assert.ok(sql.lastIndexOf('INSERT INTO editorial_default_snapshots(')>
  sql.lastIndexOf('INSERT INTO editorial_default_rows('),
  'Completion marker is inserted only after all source text rows');
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE FROM|REPLACE INTO)\s+overrides\b/i);
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE FROM|REPLACE INTO)\s+editorial_default_rows\b/i);
 assert.match(sql,/ON CONFLICT\(snapshot,record_key,field\) DO NOTHING/);
 assert.match(sql,/SELECT COUNT\(\*\) AS actual_rows/);
});

test('issue 390: staging D1 readback is rejected on partial, stale or corrupted rows',()=>{
 const metadata={snapshot:manifest.snapshot,source_release:manifest.release,
  sha256:manifest.digest,expected_rows:manifest.records.length};
 const rows=manifest.records.map(r=>({
  record_key:r.recordKey,field:r.field,value:r.value
 })).reverse();
 const verified=verifyEditorialDefaultsReadback(manifest,metadata,rows);
 assert.deepEqual(verified,{ok:true,checkedRows:rows.length,
  snapshot:manifest.snapshot,digest:manifest.digest});
 assert.equal(verifyEditorialDefaultsReadback(manifest,metadata,
  rows.slice(1)).reason,'row-count-mismatch');
 assert.equal(verifyEditorialDefaultsReadback(manifest,metadata,
  [rows[0],...rows.slice(0,-1)]).reason,'duplicate-record');
 const corrupted=rows.map((row,i)=>i===1?{...row,value:'tampered'}:row);
 assert.equal(verifyEditorialDefaultsReadback(manifest,metadata,
  corrupted).reason,'content-digest-mismatch');
 assert.equal(verifyEditorialDefaultsReadback(manifest,
  {...metadata,sha256:'not-the-installed-source'},rows).reason,
  'snapshot-metadata-mismatch');
 assert.equal(verifyEditorialDefaultsReadback(manifest,metadata,
  [{record_key:null,field:'ru',value:'Unknown'},...rows.slice(1)])
  .reason,'invalid-record');
});

test('issue 390: snapshot tampering cannot produce an installable SQL plan',()=>{
 assert.throws(()=>renderEditorialDefaultsSQL({...manifest,digest:'0'.repeat(64)}),
  /SHA-256/);
 assert.throws(()=>renderEditorialDefaultsSQL({...manifest,records:[
  {...manifest.records[0],value:'Malicious substitution'},...manifest.records.slice(1)
 ]}),/SHA-256/);
 assert.throws(()=>renderEditorialDefaultsSQL({...manifest,snapshot:'current'}),
  /SHA-256/);
 assert.throws(()=>renderEditorialDefaultsSQL({...manifest,records:[]}),/SHA-256/);
});

test('issue 390: Windows-safe CLI reports sources and rejects damaged staging readback',()=>{
 const cli=fileURLToPath(new URL('../scripts/plan-editorial-d1-defaults.mjs',import.meta.url));
 const command=(...args)=>spawnSync(process.execPath,[cli,...args],
  {encoding:'utf8',maxBuffer:4*1024*1024});
 const report=command('--report');
 assert.equal(report.status,0,report.stderr);
 const summary=JSON.parse(report.stdout);
 assert.equal(summary.digest,manifest.digest);
 assert.equal(summary.snapshot,manifest.snapshot);
 assert.equal(summary.entries,manifest.records.length);
 const dir=mkdtempSync(join(tmpdir(),'pandora-editorial-'));
 const file=join(dir,'readback.json');
 try{
  const input={
   metadata:{snapshot:manifest.snapshot,source_release:manifest.release,
    sha256:manifest.digest,expected_rows:manifest.records.length},
   rows:manifest.records.map(r=>({
    record_key:r.recordKey,field:r.field,value:r.value
   }))
  };
  writeFileSync(file,JSON.stringify(input));
  const valid=command('--verify-readback',file);
  assert.equal(valid.status,0,valid.stderr);
  assert.equal(JSON.parse(valid.stdout).ok,true);
  input.rows[0].value+=' tampered';
  writeFileSync(file,JSON.stringify(input));
  const invalid=command('--verify-readback',file);
  assert.equal(invalid.status,1,'Readback hash mismatch must fail the CLI');
  assert.equal(JSON.parse(invalid.stdout).reason,'content-digest-mismatch');
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('#390 Wrangler D1 --json readback must be one successful, verified SELECT, not an import summary',()=>{
 const readback={metadata:{snapshot:manifest.snapshot,
  source_release:manifest.release,sha256:manifest.digest,
  expected_rows:manifest.records.length},
  rows:manifest.records.map(r=>({record_key:r.recordKey,field:r.field,value:r.value}))};
 const envelope=body=>JSON.stringify([{success:true,results:[
  {staging_readback_json:JSON.stringify(body)}],meta:{duration:5}}]);
 const parsed=parseWranglerEditorialReadback(envelope(readback));
 assert.equal(verifyEditorialDefaultsReadback(manifest,parsed.metadata,parsed.rows).ok,true);
 const malformed=[
  JSON.stringify([{success:false,results:[{staging_readback_json:'{}'}]}]),
  JSON.stringify([{success:true,results:[]}]),
  JSON.stringify([{success:true,results:[{not_readback:'{}'}]}]),
  JSON.stringify([{success:true,results:[{staging_readback_json:'{}',secret:'unexpected'}]}]),
  JSON.stringify([{success:true,results:[{staging_readback_json:'{}'}]},
   {success:true,results:[{staging_readback_json:'{}'}]}]),
  JSON.stringify({success:true,results:[]}),
  'not a JSON document',
  JSON.stringify([{success:true,results:[{staging_readback_json:'broken JSON'}]}])
 ];
 for(const input of malformed)
  assert.throws(()=>parseWranglerEditorialReadback(input),
   'Must reject malformed or ambiguous Wrangler D1 result');
 const tampered={...readback,rows:readback.rows.map(row=>({...row}))};
 tampered.rows[0].value+=' tampered';
 const damaged=parseWranglerEditorialReadback(envelope(tampered));
 assert.equal(verifyEditorialDefaultsReadback(manifest,damaged.metadata,damaged.rows).reason,
  'content-digest-mismatch');
 const dir=mkdtempSync(join(tmpdir(),'pandora-wrangler-readback-'));
 const file=join(dir,'wrangler-readback.json'),cli=fileURLToPath(
  new URL('../scripts/plan-editorial-d1-defaults.mjs',import.meta.url));
 const command=()=>spawnSync(process.execPath,[cli,'--verify-wrangler-readback',file],
  {encoding:'utf8',maxBuffer:4*1024*1024});
 try{
  writeFileSync(file,envelope(readback));
  const valid=command();
  assert.equal(valid.status,0,valid.stderr);
  assert.equal(JSON.parse(valid.stdout).checkedRows,manifest.records.length);
  writeFileSync(file,envelope(tampered));
  const damagedResult=command();
  assert.equal(damagedResult.status,1);
  assert.equal(JSON.parse(damagedResult.stdout).reason,'content-digest-mismatch');
  writeFileSync(file,malformed[0]);
  const invalid=command();
  assert.equal(invalid.status,2);
  assert.match(invalid.stderr,/Invalid staging readback file/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('issue 390: current public reads and CAS writes remain on the existing override protocol',()=>{
 const worker=read('worker/index.js');
 const locale=read('pandora-studio-ui-locale.js');
 assert.match(worker,/if\(path==='\/api\/overrides'&&method==='GET'\)/);
 assert.match(worker,/if\(path==='\/api\/admin\/override'&&method==='POST'\)/);
 assert.match(locale,/contentOverrides\['guideedit\.book\.'\+id\]/);
 assert.match(locale,/const fallback=defaults\[lang==='en'\?1:0\]/);
 assert.match(locale,/typeof saved==='string'&&saved\.trim\(\)&&saved\.length<=max\?saved:/);
 assert.match(locale,/typeof staged==='string'&&staged\.trim\(\)&&staged\.length<=max\?staged:fallback/);
 // A staged migration manifest is not an excuse to silently switch site
 // text reads or deploy a new default snapshot on the live Worker.
 assert.match(worker,/if\(path==='\/api\/editorial-defaults'&&method==='GET'\)/);
 assert.doesNotMatch(locale,/\/api\/editorial-defaults/);
 // The optional read-only backend endpoint is not a frontend activation.
 assert.match(worker,/readVerifiedEditorialSnapshot\(env\.DB,snapshot\)/);
});


test('issue 390: real SQLite rehearsal round-trips pinned import and isolated rollback',async(t)=>{
 // Node 22 is the mandatory CI runtime. Older supported Node 20 can run the
 // planner; only the extra local SQLite rehearsal is skipped there.
 if(Number(process.versions.node.split('.')[0])<22){
  t.skip('node:sqlite rehearsal needs Node 22');return;
 }
 const {DatabaseSync}=await import('node:sqlite');
 const db=new DatabaseSync(':memory:');
 // D1 uses the SQLite SQL dialect. Drive the real Worker SELECT reader
 // against the actual in-memory tables, not hard-coded mock rows.
 const adapter={prepare(sql){
  const statement=db.prepare(sql);
  return {
   all:async()=>({results:statement.all()}),
   bind(...params){return {
    first:async()=>statement.get(...params)??null,
    all:async()=>({results:statement.all(...params)})
   }}
  };
 }};
 const workerRead=()=>readVerifiedEditorialSnapshot(adapter,manifest.snapshot,
  {subtle:webcrypto.subtle});
 try{
  db.exec(renderEditorialDefaultsSQL(manifest));
  const before=await workerRead();
  assert.equal(before.status,200,'Materialized SQL must be readable by the real Worker code');
  assert.equal(before.payload.sha256,manifest.digest);
  assert.equal(before.payload.records.length,manifest.records.length);
  const exportQuery=renderEditorialDefaultsReadbackSQL(manifest);
  assert.match(exportQuery,/^-- STAGING READBACK ONLY/m);
  assert.doesNotMatch(exportQuery,/\b(?:INSERT|UPDATE|DELETE|CREATE|DROP)\b/i);
  let exported=JSON.parse(db.prepare(exportQuery).get().staging_readback_json);
  assert.equal(typeof exported.metadata,'object','Metadata must be a JSON object');
  assert.ok(Array.isArray(exported.rows),'Readback rows must be a JSON array');
  assert.deepEqual(verifyEditorialDefaultsReadback(manifest,exported.metadata,
   exported.rows),{ok:true,checkedRows:manifest.records.length,
    snapshot:manifest.snapshot,digest:manifest.digest});
  // Retrying a successful import must be idempotent: no rows are replaced.
  db.exec(renderEditorialDefaultsSQL(manifest));
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_rows').get().total,
   manifest.records.length);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_snapshots').get().total,1);

  // A source-data corruption must be caught before a staging reader is activated.
  db.prepare('UPDATE editorial_default_rows SET value=? WHERE snapshot=? AND record_key=? AND field=?')
   .run('corrupted',manifest.snapshot,manifest.records[0].recordKey,manifest.records[0].field);
  exported=JSON.parse(db.prepare(exportQuery).get().staging_readback_json);
  assert.equal(verifyEditorialDefaultsReadback(manifest,exported.metadata,
   exported.rows).reason,'content-digest-mismatch');
  const corruptedRead=await workerRead();
  assert.equal(corruptedRead.status,503);
  assert.equal(corruptedRead.payload.code,'EDITORIAL_DEFAULTS_DIGEST_MISMATCH');
  assert.equal(Object.hasOwn(corruptedRead.payload,'records'),false);

  // Other releases plus existing CAS overrides must survive this rollback.
  db.exec("CREATE TABLE overrides (key TEXT PRIMARY KEY,value TEXT NOT NULL);");
  db.prepare('INSERT INTO overrides(key,value) VALUES (?,?)')
   .run('guideedit.book.keep','owner edit');
  db.prepare('INSERT INTO editorial_default_rows(snapshot,record_key,field,value) VALUES (?,?,?,?)')
   .run('another-release-snapshot','guideedit.book.keep','ru','other release');
  db.prepare('INSERT INTO editorial_default_snapshots(snapshot,source_release,sha256,expected_rows,installed_at) VALUES (?,?,?,?,unixepoch())')
   .run('another-release-snapshot','0.946.0','f'.repeat(64),1);
  const rollback=renderEditorialDefaultsRollbackSQL(manifest);
  assert.doesNotMatch(rollback,/\b(?:DROP|UPDATE|REPLACE)\b/i);
  assert.doesNotMatch(rollback,/\boverrides\b/i);
  db.exec(rollback);
  db.exec(rollback); // repeat is safe and exact-version-scoped
  const afterRollback=await workerRead();
  assert.equal(afterRollback.status,404);
  assert.equal(afterRollback.payload.code,'EDITORIAL_DEFAULTS_SNAPSHOT_NOT_FOUND');
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_rows WHERE snapshot=?')
   .get(manifest.snapshot).total,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_snapshots WHERE snapshot=?')
   .get(manifest.snapshot).total,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_rows').get().total,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM editorial_default_snapshots').get().total,1);
  assert.equal(db.prepare('SELECT value FROM overrides WHERE key=?')
   .get('guideedit.book.keep').value,'owner edit');
 }finally{db.close()}
});

test('issue 390: staging SQL cannot be generated from a forged but self-consistent namespace',()=>{
 const rows=manifest.records.map(r=>({...r}));
 rows[0].field='playerId';
 const canonical={schema:1,release:manifest.release,records:rows};
 const digest=createHash('sha256')
  .update(JSON.stringify(canonical)).digest('hex');
 const forged={...manifest,records:rows,digest,
  snapshot:manifest.release+'-'+digest.slice(0,16)};
 for(const build of [
  renderEditorialDefaultsSQL,
  renderEditorialDefaultsReadbackSQL,
  renderEditorialDefaultsRollbackSQL
 ])assert.throws(()=>build(forged),/Unallowlisted D1 default row/);
});

test('issue 390: readback and rollback CLI emit the matching version-only SQL',()=>{
 const cli=fileURLToPath(new URL('../scripts/plan-editorial-d1-defaults.mjs',import.meta.url));
 const command=(format)=>spawnSync(process.execPath,[cli,format],
  {encoding:'utf8',maxBuffer:4*1024*1024});
 for(const [option,expected] of [
  ['--readback-sql','staging_readback_json'],
  ['--staging-rollback-sql','DELETE FROM editorial_default_snapshots']
 ]){
  const result=command(option);
  assert.equal(result.status,0,result.stderr);
  assert.ok(result.stdout.includes(expected),option);
  assert.ok(result.stdout.includes(manifest.snapshot),option);
 }
});
