// Read-only, deterministic preparation for a FUTURE approved D1 defaults
// migration. Running this program NEVER connects to Cloudflare or writes D1.
// Existing guideedit overrides are not rewritten or deleted.
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const byCodepoint=(a,b)=>a<b?-1:a>b?1:0;
const sha256=text=>createHash('sha256').update(text,'utf8').digest('hex');
const sqlString=value=>"'"+String(value).replaceAll("'","''")+"'";

const DEFAULT_KEY=/^guideedit\.(?:book\.[a-z][a-zA-Z0-9._:-]{1,80}|honor\.(?:overview|rank\.(?:[0-9]|1[01]))|wiki\.labels)$/;
const DEFAULT_WIKI_FIELD=/^(?:chapter_(?:item|utility|monster|map|honor|npc|chest|instance|skill|soul)|honor_(?:overview|gain|victories|ranks|monthly)|skill_filter_(?:player|racial|guild|special|variants|other|unknown|all))_(?:ru|en)$/;
const DEFAULT_OVERVIEW_FIELD=/^(?:pvp(?:Intro|Daily|Weekly|Hunt)(?:Ru|En)|overview(?:Ru|En)|honor(?:Ru|En)|total(?:Ru|En)|gain(?:Ru|En)|loss(?:Ru|En)|current(?:Ru|En)|ranks(?:Ru|En)|joining(?:Ru|En)|cloaks(?:Ru|En)|monthlyNote(?:Ru|En))$/;
function allowedDefaultRow(row){
 if(!row||typeof row.recordKey!=='string'||!DEFAULT_KEY.test(row.recordKey)||
  typeof row.field!=='string'||typeof row.value!=='string'||
  !row.value.trim()||row.value.length>8000||
  /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(row.value))return false;
 if(row.recordKey==='guideedit.wiki.labels')
  return DEFAULT_WIKI_FIELD.test(row.field)&&row.value.length<=90;
 if(row.recordKey==='guideedit.honor.overview')
  return DEFAULT_OVERVIEW_FIELD.test(row.field)&&row.value.length<=2200;
 if(row.recordKey.startsWith('guideedit.honor.rank.'))
  return /^(?:nameRu|nameEn|benefitRu|benefitEn)$/.test(row.field)&&
   row.value.length<=500;
 return /^(?:ru|en|hintRu|hintEn)$/.test(row.field)&&row.value.length<=360;
}
// Guard exported SQL against a caller-supplied but self-consistent invalid
// manifest. The staging reader and frontend use this same closed namespace.
function assertVerifiedManifest(manifest){
 if(!manifest||!Array.isArray(manifest.records)||
  !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(manifest.release||''))
  throw Error('Invalid source-release or missing D1 default rows');
 const payload={schema:manifest.schema,release:manifest.release,
  records:manifest.records};
 const digest=sha256(JSON.stringify(payload));
 if(manifest.schema!==1||manifest.digest!==digest||
  manifest.snapshot!==manifest.release+'-'+digest.slice(0,16))
  throw Error('Manifest content or version does not match its SHA-256');
 if(!manifest.records.length||manifest.records.length>3000)
  throw Error('Invalid D1 default row count');
 let characters=0,previous=null;
 for(const row of manifest.records){
  if(!allowedDefaultRow(row))
   throw Error('Unallowlisted D1 default row: '+String(row?.recordKey)+'/'+String(row?.field));
  const identity=row.recordKey+'\u0000'+row.field;
  if(previous!==null&&identity<=previous)
   throw Error('Duplicate or unsorted D1 default identity: '+identity);
  previous=identity;
  characters+=row.value.length;
  if(characters>450000)throw Error('D1 default text exceeds reader limits');
 }
 return manifest.snapshot;
}


export function buildEditorialDefaultsManifest(){
 const scope={};
 const context={window:scope};
 for(const path of [
  'pandora-studio-hero-book.js',
  'pandora-studio-ui-locale.js',
  'pandora-studio-honor-guide.js',
  'pandora-studio-wiki-labels.js'
 ])runInNewContext(read(path),context,{filename:path,timeout:5000});
 const ui=scope.PandoraUILocale;
 const book=scope.PandoraStageAttributes;
 const guide=scope.PandoraHonorGuide;
 const wiki=scope.PandoraWikiLabels;
 if(!ui?.fieldKey||!book?.summaryRows||!guide?.validOverride||
  !wiki?.key||!wiki?.validField)
  throw Error('Required audited authorial catalogs did not initialize');

 const packageInfo=JSON.parse(read('package.json'));
 const release=packageInfo.version;
 if(!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(release))
  throw Error('Invalid pinned source release');
 const records=[],seen=new Set(),cohorts=Object.create(null);
 function append(recordKey,field,value,cohort){
  if(!/^guideedit\.(?:book\.[a-z][a-zA-Z0-9._:-]{1,80}|honor\.(?:overview|rank\.(?:[0-9]|1[01]))|wiki\.labels)$/.test(recordKey))
   throw Error('Unallowlisted authorial field: '+recordKey);
  if(recordKey==='guideedit.wiki.labels'?!wiki.validField(field):
   !/^(?:ru|en|hintRu|hintEn|[a-z][a-zA-Z]*Ru|[a-z][a-zA-Z]*En)$/.test(field))
   throw Error('Unallowlisted authorial subfield: '+field);
  if(typeof value!=='string'||!value.trim()||value.length>8000||
   /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))
   throw Error('Invalid source text for '+recordKey+'/'+field);
  const identity=recordKey+'\u0000'+field;
  if(seen.has(identity))throw Error('Duplicate D1 default identity: '+identity);
  seen.add(identity);
  records.push({recordKey,field,value});
  cohorts[cohort]=(cohorts[cohort]||0)+1;
 }

 // The exact same stable ids and fallback values that existing owner CAS
 // already uses for headings, status text, and the Hero Book text catalog.
 for(const key of ui.keys()){
  const id=ui.fieldKey(key);
  if(!id)throw Error('Missing existing bilingual owner field key: '+key);
  for(const lang of ['ru','en'])
   append('guideedit.book.'+id,lang,ui.baseText(key,lang),'ui-locale');
 }

 // The owner dock's fixed visible action captions, group headings and
 // instructions are also already editable via ownerCopy('owner-dock').
 // Extract only the audited literal dictionary, never execute the app's
 // startup logic, inspect player state, or guess text keys from a game UI.
 const app=read('pandora-studio-app.js');
 const match=app.match(/const ownerDockText=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!match)throw Error('Missing audited owner dock authorial source registry');
 const dock=runInNewContext('('+match[1]+')',{},{
  filename:'ownerDockText',timeout:5000
 });
 if(!dock||typeof dock!=='object'||Array.isArray(dock))
  throw Error('Invalid owner dock text dictionary');
 for(const [key,pair] of Object.entries(dock)){
  if(!/^[a-z][a-zA-Z0-9]{1,50}$/.test(key)||
   !Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid owner-dock authorial field: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.owner-dock.'+slug,lang,pair[i],'owner-dock');
 }

 // Item encyclopedia field labels and their independent hover explanations
 // share canonical guideedit.book.wiki.item-field.* records. Extract ONLY
 // their audited static RU/EN dictionaries, never source item values.
 const itemPresentation=read('pandora-studio-item-presentation.js');
 const itemDict=name=>{
  const source=itemPresentation.match(new RegExp(
   'const '+name+'=Object\\.freeze\\((\\{[\\s\\S]*?\\})\\);'));
  if(!source)throw Error('Missing reviewed item presentation '+name);
  return runInNewContext('('+source[1]+')',{},{
   filename:name,timeout:5000
  });
 };
 const itemLabels=itemDict('itemFieldLabels');
 const itemHints=itemDict('itemFieldHints');
 const expectedItemFields=['kind','level','W','PEN','AC','atkspeed','range','soulslot'];
 if(Object.keys(itemLabels).sort().join('|')!==[...expectedItemFields].sort().join('|')||
  Object.keys(itemHints).sort().join('|')!==[...expectedItemFields].sort().join('|'))
  throw Error('Source item fields changed: review migration map first');
 for(const key of expectedItemFields){
  const recordKey='guideedit.book.wiki.item-field.'+key.toLowerCase();
  for(const [pair,ruField,enField] of [
   [itemLabels,'ru','en'],[itemHints,'hintRu','hintEn']
  ]){
   if(!Array.isArray(pair[key])||pair[key].length!==2)
    throw Error('Invalid item field authorial copy: '+key);
   append(recordKey,ruField,pair[key][0],'item-field');
   append(recordKey,enField,pair[key][1],'item-field');
  }
 }

 // Three actual equipment settings tabs have existing owner-copy keys.
 // The remaining context-menu actions use different dynamic UI surfaces,
 // so never invent D1 identities for them in this partial inventory.
 const equipmentSrc=read('pandora-studio-equipment-ui.js');
 const equipmentMatch=equipmentSrc.match(
  /const actionLabels=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!equipmentMatch)throw Error('Missing existing equipment action labels');
 const gear=runInNewContext('('+equipmentMatch[1]+')',{},{
  filename:'equipment actionLabels',timeout:5000
 });
 for(const [tab,action] of [
  ['choose','replace'],['details','properties'],['souls','souls']
 ]){
  const pair=gear[action];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Unknown equipment tab authorial label: '+action);
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.equipment.tab.'+tab,lang,pair[i],'equipment-tabs');
 }

 // Preserve exact equipment CAS identities from the on-screen source registry.
 // This inventory is never generated from mutable item records or numeric
 // character state. A changed source registry requires deliberate review.
 const summaryMatch=equipmentSrc.match(
  /const equipmentSummaryCopy=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!summaryMatch)throw Error('Missing equipment summary source dictionary');
 const summary=runInNewContext('('+summaryMatch[1]+')',{},{
  filename:'equipmentSummaryCopy',timeout:5000
 });
 const expectedSummary=[
  'field.soulCompatible','field.type','field.level','field.attack',
  'field.magicAttack','field.defense','field.slots','field.speed',
  'field.range','field.gemType','field.element','field.specialEffect',
  'wearableBy','outfitNote','socketedSoulHeading'
 ];
 if(Object.keys(summary).sort().join('|')!==expectedSummary.sort().join('|'))
  throw Error('Equipment summary registry has new or missing keys');
 for(const key of expectedSummary){
  const pair=summary[key];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid equipment summary RU/EN: '+key);
  const ownerKey='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [i,lang] of ['ru','en'].entries())
   append(ownerKey,lang,pair[i],'equipment-summary');
 }
 // The three tab tooltips use distinct existing hint.{tab} CAS keys.
 const hintsMatch=equipmentSrc.match(
  /const equipmentTabHints=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!hintsMatch)throw Error('Missing equipment tooltip source registry');
 const tabHints=runInNewContext('('+hintsMatch[1]+')',{},{
  filename:'equipmentTabHints',timeout:5000
 });
 if(Object.keys(tabHints).sort().join('|')!=='choose|details|souls')
  throw Error('Equipment tooltip registry changed');
 for(const [tab,pair] of Object.entries(tabHints)){
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid equipment tooltip RU/EN: '+tab);
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.equipment.hint.'+tab,lang,pair[i],
    'equipment-hints');
 }

 // Source-authored equipment controls include fixed headings and ARIA
 // prefixes next to dynamic Soul counts. Only the pure literals are seeded.
 const controlsMatch=equipmentSrc.match(
  /const equipmentInterfaceCopy=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!controlsMatch)throw Error('Missing equipment interface copy registry');
 const controlCopy=runInNewContext('('+controlsMatch[1]+')',{},{
  filename:'equipmentInterfaceCopy',timeout:5000
 });
 const expectedControls=[
  'pickerSlotHeading','pickerItemClose','pickerItemSettings','chooseItemEmpty',
  'socketCapacityHeading','socketOverflowHint','refinementHeading',
  'gemTypeLabel','gemElementLabel','pickerSoulSlotAria','pickerEmptySoul',
  'pickerSoulSlotCaption','soulSlotsHeading','soulSearch','pickerSoulSearchAria',
  'soulShowMore','soulProgressLabel','soulSearchEmpty','soulRemove'
 ];
 if(Object.keys(controlCopy).sort().join('|')!==expectedControls.sort().join('|'))
  throw Error('Equipment interface copy registry has changed');
 for(const key of expectedControls){
  const pair=controlCopy[key];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid equipment interface RU/EN: '+key);
  const id='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [i,lang] of ['ru','en'].entries())
   append(id,lang,pair[i],'equipment-interface');
 }

 // Eight supported equipment families use exact, stable editor keys for
 // their zero-capacity and unknown-capacity Soul notices. Evaluate only the
 // audited source grammar and noun table; never inspect equipped user items.
 const nounsMatch=equipmentSrc.match(
  /const SOUL_SLOT_NOUNS=Object\.freeze\((\{[\s\S]*?\})\);/);
 const unavailableMatch=equipmentSrc.match(
  /function soulUnavailableCopy\(slot,capacity,english=false\)\{([\s\S]*?)\n\}/);
 if(!nounsMatch||!unavailableMatch)
  throw Error('Missing original Soul unavailable copy generator');
 const soulSlots=['weapon','shield','head','body','gloves','legs','feet','belt'];
 const nouns=runInNewContext('('+nounsMatch[1]+')',{},{
  filename:'SOUL_SLOT_NOUNS',timeout:5000
 });
 if(Object.keys(nouns).sort().join('|')!==[...soulSlots].sort().join('|'))
  throw Error('Soul slot noun families changed: review mapping');
 const unavailable=runInNewContext(
  'const SOUL_SLOT_NOUNS=Object.freeze('+nounsMatch[1]+');'+
  'function soulUnavailableCopy(slot,capacity,english=false){'+
   unavailableMatch[1]+'\n}\nsoulUnavailableCopy',{},{
    filename:'soulUnavailableCopy',timeout:5000
   });
 for(const slot of soulSlots){
  for(const [suffix,capacity] of [['zero',0],['unknown',null]]){
   const key='guideedit.book.equipment.soul-unavailable-'+suffix+'.'+slot;
   for(const [lang,english] of [['ru',false],['en',true]])
    append(key,lang,unavailable(slot,capacity,english),
     'equipment-soul-unavailable');
  }
 }

 // The existing right-click gear menu uses its own five editable
 // context.{action} keys, independent of the item settings tab captions.
 for(const action of ['choose','replace','properties','souls','remove']){
  const pair=gear[action];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Missing context menu RU/EN default: '+action);
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.equipment.context.'+action,lang,pair[i],
    'equipment-context-menu');
 }

 // The mounted picker/gear menu has a hand-curated, five-column panel
 // registry. Only key + RU/EN source text are copy; panel headings and
 // runtime level/slot values are NOT editor defaults.
 const metaMatch=app.match(
  /const equipmentPickerMetaCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!metaMatch)throw Error('Missing equipment picker meta source rows');
 const equipmentMeta=runInNewContext('('+metaMatch[1]+')',{},{
  filename:'equipmentPickerMetaCopyRows',timeout:5000
 });
 const expectedPickerMeta=[
  'gearMenuEquippedAria','gearMenuEmptyAria','gearMenuEmptyTitle',
  'gearMenuNoSoulSlots','gearMenuMissingItem','pickerNavGroup',
  'pickerPreviousSlot','pickerNextSlot','pickerEquipAction','pickerPlanAction',
  'pickerFutureLevel','pickerItemLevel','pickerItemSlots',
  'pickerFutureBadgePrefix','pickerFutureBadgeSuffix'
 ];
 if(!Array.isArray(equipmentMeta)||equipmentMeta.length!==expectedPickerMeta.length||
  equipmentMeta.map(r=>r[0]).sort().join('|')!==expectedPickerMeta.sort().join('|'))
  throw Error('Unexpected equipment picker source copy inventory');
 for(const entry of equipmentMeta){
  if(!Array.isArray(entry)||entry.length!==5)
   throw Error('Invalid equipment picker copy row');
  const [key,ru,en]=entry;
  const id='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(id,'ru',ru,'equipment-picker-meta');
  append(id,'en',en,'equipment-picker-meta');
 }

 // Origin headings are already editable on the live page by dblclick/F2
 // through origin.{semantic-key}. Exclude the "28 classes" counter even
 // though its current text happens to be a literal; it is gameplay data.
 const originMatch=app.match(/const originFixedLabels=(\[[\s\S]*?\]);/);
 if(!originMatch)throw Error('Missing audited origin owner copy registry');
 const originLabels=runInNewContext('('+originMatch[1]+')',{},{
  filename:'originFixedLabels',timeout:5000
 });
 const expectedOriginKeys=[
  'heading','tabRace','tabProfession','tabStats','raceHeading',
  'professionHeading','racePrompt','passiveHeading','classCount',
  'progressHeading','levelParameters','levelHeading','baseHeading',
  'distributeHeading'
 ];
 if(!Array.isArray(originLabels)||originLabels.length!==expectedOriginKeys.length||
  originLabels.map(r=>r[1]).sort().join('|')!==expectedOriginKeys.sort().join('|'))
  throw Error('Origin source copy set changed: review migration map');
 for(const entry of originLabels){
  if(!Array.isArray(entry)||entry.length!==4)
   throw Error('Invalid original Origin source label');
  const [selector,key,ru,en]=entry;
  if(typeof selector!=='string'||!selector.trim())throw Error('Missing Origin selector');
  if(key==='classCount')continue; // runtime/game catalog count
  const id='guideedit.book.origin.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(id,'ru',ru,'origin-headings');
  append(id,'en',en,'origin-headings');
 }

 // The two owner equipment picker surfaces reuse one frozen source catalog
 // for static labels. This selection-only half is separate from metadata,
 // source gear names, player-entered search queries and live item counts.
 const selectionMatch=app.match(
  /const equipmentPickerSelectionCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!selectionMatch)throw Error('Missing equipment picker selection copy registry');
 const selectionRows=runInNewContext('('+selectionMatch[1]+')',{},{
  filename:'equipmentPickerSelectionCopyRows',timeout:5000
 });
 const expectedSelection=[
  'pickerChoosePrefix','pickerDetails','pickerClose',
  'pickerSearchPlaceholder','pickerSearchAria','pickerUnequip',
  'pickerAvailableLabel','pickerAvailableAria','pickerMatchSuffix',
  'pickerShownSuffix','pickerMorePrefix','pickerOutfitNote','pickerLoading',
  'pickerOriginFirst','pickerNoMatches'
 ];
 if(!Array.isArray(selectionRows)||selectionRows.length!==expectedSelection.length||
  selectionRows.map(row=>row?.[0]).sort().join('|')!==expectedSelection.sort().join('|'))
  throw Error('Unexpected equipment selection copy registry');
 for(const entry of selectionRows){
  if(!Array.isArray(entry)||entry.length!==5)
   throw Error('Invalid equipment selection RU/EN source entry');
  const [key,ru,en]=entry;
  const recordKey='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(recordKey,'ru',ru,'equipment-picker-selection');
  append(recordKey,'en',en,'equipment-picker-selection');
 }

 // Existing Wiki map/dungeon captions are already editable through
 // ownerCopy('wiki.map.text') and one frozen bilingual source registry.
 // Safely seed only authorial display/actions. Exclude validated limits,
 // security/destructive confirmations, dynamic source truth and errors.
 const mapSource=app.match(/const wikiMapRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!mapSource)throw Error('Missing reviewed Wiki map editorial registry');
 const mapRows=runInNewContext('('+mapSource[1]+')',{},{
  filename:'wikiMapRows',timeout:5000
 });
 const excludedMapKeys=new Set([
  'chanceUnknown','tagLimit','tagDuplicate','tagRequired',
  'sectionLimit','sectionRequired','npcRequired','npcCreateFailure',
  'createMapRequired','createMapFailure','deleteRecordButton',
  'deleteRecordLinked','deleteRecordConfirm','deleteRecordFailure'
 ]);
 if(!Array.isArray(mapRows)||mapRows.length!==58||
  new Set(mapRows.map(row=>row?.[0])).size!==58||
  mapRows.filter(row=>excludedMapKeys.has(row[0])).length!==excludedMapKeys.size)
  throw Error('Wiki map safe authorial inventory drift');
 for(const entry of mapRows){
  if(!Array.isArray(entry)||entry.length!==3)
   throw Error('Unexpected Wiki map editorial entry');
  const [key,ru,en]=entry;
  if(excludedMapKeys.has(key))continue;
  if(!/^[a-z][a-zA-Z0-9]{1,55}$/.test(key))
   throw Error('Unreviewed Wiki map copy key: '+key);
  const recordKey='guideedit.book.wiki.map.text.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(recordKey,'ru',ru,'wiki-map-authorial');
  append(recordKey,'en',en,'wiki-map-authorial');
 }

 // The existing Wiki owner panels for monsters, NPC trade, chests and items
 // share original bilingual authorial registries. Their measured numbers,
 // catalog rows, drop probabilities, item identities and dynamic reasons are
 // deliberately NOT copied into the versioned D1 defaults.
 const wikiFamilies=[
  ['wikiMonsterRows','wiki.monster.text','wiki-monster-authorial',56,
   ['chanceMissing','limitReached','createLinkFailure','createMonsterRequired',
    'createMonsterFailure','deleteRecordButton','deleteRecordLinked',
    'deleteRecordConfirm','deleteRecordFailure']],
  ['wikiNpcTradeRows','wiki.npc.trade','wiki-npc-trade-authorial',40,
   ['sellerMissing','deleteTrade','deleteAria','deleteConfirm',
    'deleteRecordButton','deleteRecordLinked','deleteRecordConfirm',
    'deleteRecordFailure']],
  ['wikiChestDisplayRows','wiki.chest.text','wiki-chest-authorial',35,
   ['certainHeading','oneGold','oneItem','keyUnlisted','contentsMissing',
    'contentsUnlisted','goldMissing','rewardMissing','deleteGroup',
    'removeReward']],
  ['wikiItemDisplayRows','wiki.item.text','wiki-item-display-authorial',29,
   ['levelRewardAbove','sourcesMissing']]
 ];
 for(const [sourceName,section,cohort,expectedRows,excludedKeys] of wikiFamilies){
  const re=new RegExp('const '+sourceName+
   '=Object\\.freeze\\((\\[[\\s\\S]*?\\])\\);');
  const source=app.match(re);
  if(!source)throw Error('Missing Wiki source editorial registry '+sourceName);
  const rows=runInNewContext('('+source[1]+')',{},{
   filename:sourceName,timeout:5000
  });
  const excluded=new Set(excludedKeys);
  if(!Array.isArray(rows)||rows.length!==expectedRows||
   new Set(rows.map(row=>row?.[0])).size!==expectedRows||
   rows.filter(row=>excluded.has(row[0])).length!==excluded.size)
   throw Error('Wiki authorial review inventory drift: '+sourceName);
  for(const entry of rows){
   if(!Array.isArray(entry)||entry.length!==3)
    throw Error('Invalid Wiki authored bilingual row in '+sourceName);
   const [key,ru,en]=entry;
   if(excluded.has(key))continue;
   if(!/^[a-z][a-zA-Z0-9]{1,55}$/.test(key))
    throw Error('Unreviewed Wiki authorial field: '+sourceName+'/'+key);
   const recordKey='guideedit.book.'+section+'.'+
    key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
   append(recordKey,'ru',ru,cohort);
   append(recordKey,'en',en,cohort);
  }
 }

 // The Wiki chapters, all five Honor subchapters and skill filters are
 // one existing D1 JSON record. Preserve their exact field identities;
 // never reconstruct these labels from list position or save them as game IDs.
 for(const [group,registry] of [
  ['chapter',wiki.chapter],['honor',wiki.honor],['skillFilter',wiki.skillFilter]
 ]){
  for(const [id,names] of Object.entries(registry)){
   if(!Array.isArray(names)||names.length!==2)
    throw Error('Invalid bilingual Wiki label default: '+group+'/'+id);
   for(const [index,lang] of ['ru','en'].entries())
    append('guideedit.wiki.labels',wiki.key(group,id,lang),names[index],'wiki-labels');
  }
 }

 // Summary tooltip keys are position-defined in the existing public UI.
 // Only source-authored explanations are materialized, never live stats.
 const summaryRows=book.summaryRows({}).flatMap(group=>group.rows);
 const unmappedHints=[];
 for(const [caption,pair] of Object.entries(guide.hints)){
  const index=summaryRows.findIndex(row=>row.ru===caption);
  if(index<0){unmappedHints.push(caption);continue}
  for(const [offset,field] of ['hintRu','hintEn'].entries())
   if(pair[offset])append('guideedit.book.summary.'+index,field,pair[offset],
    'summary-hints');
 }

 // Semantic Book help fields may exist without a fixed heading literal.
 // These are independent hover explanations, not editable game parameters.
 for(const [key,pair] of Object.entries(guide.help))
  for(const [offset,field] of ['hintRu','hintEn'].entries())
   if(pair[offset])append('guideedit.book.'+key,field,pair[offset],
    'semantic-hints');

 // Honor overview has its own existing D1 data schema. Preserve each
 // authorial field and do not seed live rank thresholds or numeric rewards.
 for(const [field,value] of Object.entries(guide.intro))
  if(typeof value==='string'&&value.trim())
   append('guideedit.honor.overview',field,value,'honor-overview');
 for(const rank of guide.defaultRanks){
  if(!Number.isInteger(rank.id)||rank.id<0||rank.id>11)
   throw Error('Unexpected Honor rank identity');
  for(const field of ['nameRu','nameEn','benefitRu','benefitEn'])
   if(typeof rank[field]==='string'&&rank[field].trim())
    append('guideedit.honor.rank.'+rank.id,field,rank[field],
     'honor-rank-copy');
 }
 records.sort((a,b)=>byCodepoint(a.recordKey,b.recordKey)||
  byCodepoint(a.field,b.field));
 // The read-only Worker reader refuses oversized snapshots. A successful
 // planner must NEVER generate a version that the matching reader rejects.
 if(records.length>3000||
  records.reduce((sum,row)=>sum+row.value.length,0)>450000)
  throw Error('Authored defaults exceed versioned D1 reader limits');
 const payload={schema:1,release,records};
 const digest=sha256(JSON.stringify(payload));
 return Object.freeze({...payload,digest,
  snapshot:release+'-'+digest.slice(0,16),
  stats:Object.freeze({
   entries:records.length,recordKeys:new Set(records.map(r=>r.recordKey)).size,
   cohorts,unmappedHints:unmappedHints.sort(byCodepoint)
  })});
}

// Validate a complete readback from an isolated D1 import, not just the
// number of imported rows. No browser/Worker activity or persistence occurs.
export function verifyEditorialDefaultsReadback(manifest,metadata,readbackRows){
 const fail=reason=>({ok:false,reason});
 if(!metadata||!Array.isArray(readbackRows))return fail('missing-readback');
 if(metadata.snapshot!==manifest.snapshot||
  metadata.source_release!==manifest.release||
  metadata.sha256!==manifest.digest||
  metadata.expected_rows!==manifest.records.length)
  return fail('snapshot-metadata-mismatch');
 if(readbackRows.length!==manifest.records.length)
  return fail('row-count-mismatch');
 const seen=new Set(),rows=[];
 for(const input of readbackRows){
  if(!input||typeof input!=='object')return fail('invalid-record');
  const row={recordKey:input.record_key??input.recordKey,
   field:input.field,value:input.value};
  if(Object.values(row).some(value=>typeof value!=='string'))
   return fail('invalid-record');
  const key=row.recordKey+'\u0000'+row.field;
  if(seen.has(key))return fail('duplicate-record');
  seen.add(key);rows.push(row);
 }
 rows.sort((a,b)=>byCodepoint(a.recordKey,b.recordKey)||
  byCodepoint(a.field,b.field));
 const digest=sha256(JSON.stringify({
  schema:manifest.schema,release:manifest.release,records:rows
 }));
 if(digest!==manifest.digest)return fail('content-digest-mismatch');
 return {ok:true,checkedRows:rows.length,snapshot:manifest.snapshot,digest};
}

export function renderEditorialDefaultsSQL(manifest){
 // Refuse stale/corrupt caller-provided data before returning executable SQL.
 assertVerifiedManifest(manifest);
 const rows=manifest.records;
 const lines=[
  '-- DRY RUN SQL ONLY. Review and back up D1 before a separate authorized import.',
  '-- No deployment/import happens by running the planning script.',
  '-- Only a complete verified snapshot may be activated by a future reader.',
  'CREATE TABLE IF NOT EXISTS editorial_default_rows ('+
   'snapshot TEXT NOT NULL, record_key TEXT NOT NULL, field TEXT NOT NULL, '+
   'value TEXT NOT NULL, PRIMARY KEY(snapshot,record_key,field));',
  'CREATE TABLE IF NOT EXISTS editorial_default_snapshots ('+
   'snapshot TEXT PRIMARY KEY, source_release TEXT NOT NULL, sha256 TEXT NOT NULL, '+
   'expected_rows INTEGER NOT NULL, installed_at INTEGER NOT NULL);'
 ];
 for(const r of rows)lines.push(
  'INSERT INTO editorial_default_rows(snapshot,record_key,field,value) VALUES ('+
   [manifest.snapshot,r.recordKey,r.field,r.value].map(sqlString).join(',')+
   ') ON CONFLICT(snapshot,record_key,field) DO NOTHING;');
 // Insert the marker last. A partial upload has no completed snapshot entry.
 // A future reader MUST also verify exact count and digest before activation.
 lines.push('INSERT INTO editorial_default_snapshots('+
  'snapshot,source_release,sha256,expected_rows,installed_at) VALUES ('+
  [sqlString(manifest.snapshot),sqlString(manifest.release),
   sqlString(manifest.digest),String(rows.length),
   "unixepoch()"].join(',')+
  ') ON CONFLICT(snapshot) DO NOTHING;');
 lines.push('-- Readback check; mismatch means DO NOT activate:');
 lines.push('SELECT COUNT(*) AS actual_rows FROM editorial_default_rows WHERE snapshot='+
  sqlString(manifest.snapshot)+';');
 lines.push('SELECT snapshot,source_release,sha256,expected_rows '+
  'FROM editorial_default_snapshots WHERE snapshot='+
  sqlString(manifest.snapshot)+';');
 return lines.join('\n')+'\n';
}


// SELECT-only, one-row JSON export. Force JSON subtypes after SQLite\n// scalar-subquery boundaries to keep metadata/rows as objects/arrays.\n// Save the *column value* as a JSON file,
// then feed it to --verify-readback; never trust an import exit code alone.
export function renderEditorialDefaultsReadbackSQL(manifest){
 const snapshot=sqlString(assertVerifiedManifest(manifest));
 return [
  '-- STAGING READBACK ONLY. Returns one JSON document to verify offline.',
  "SELECT json_object("+
   "'metadata',json((SELECT json_object("+
    "'snapshot',snapshot,'source_release',source_release,"+
    "'sha256',sha256,'expected_rows',expected_rows)"+
    " FROM editorial_default_snapshots WHERE snapshot="+snapshot+")),"+
   "'rows',json((SELECT json_group_array(json_object("+
    "'record_key',record_key,'field',field,'value',value))"+
    " FROM (SELECT record_key,field,value FROM editorial_default_rows"+
    " WHERE snapshot="+snapshot+" ORDER BY record_key,field))))"+
   " AS staging_readback_json;"
 ].join('\n')+'\n';
}

// Explicit, snapshot-scoped STAGING rollback plan; it cannot touch CAS,
// accounts, game catalogs, builds, or any other release. The marker is
// deleted FIRST so even a partial rollback fails closed in the Worker.
export function renderEditorialDefaultsRollbackSQL(manifest){
 const snapshot=sqlString(assertVerifiedManifest(manifest));
 return [
  '-- STAGING ONLY. Requires a separate approved, backed-up D1 execution.',
  '-- NEVER run this SQL against production D1.',
  '-- Deactivate this exact version before removing its immutable rows.',
  'DELETE FROM editorial_default_snapshots WHERE snapshot='+snapshot+';',
  'DELETE FROM editorial_default_rows WHERE snapshot='+snapshot+';',
  'SELECT COUNT(*) AS remaining_markers FROM editorial_default_snapshots WHERE snapshot='+snapshot+';',
  'SELECT COUNT(*) AS remaining_rows FROM editorial_default_rows WHERE snapshot='+snapshot+';'
 ].join('\n')+'\n';
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const manifest=buildEditorialDefaultsManifest();
 const format=process.argv[2]||'--report';
 if(format==='--sql')process.stdout.write(renderEditorialDefaultsSQL(manifest));
 else if(format==='--readback-sql')process.stdout.write(renderEditorialDefaultsReadbackSQL(manifest));
 else if(format==='--staging-rollback-sql')process.stdout.write(renderEditorialDefaultsRollbackSQL(manifest));
 else if(format==='--json')process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
 else if(format==='--verify-readback'){
  const filename=process.argv[3];
  if(!filename){process.stderr.write('Missing staging readback JSON path\n');process.exitCode=2;}
  else {
   try{
    const data=JSON.parse(readFileSync(resolve(filename),'utf8'));
    const verdict=verifyEditorialDefaultsReadback(
     manifest,data?.metadata,data?.rows);
    process.stdout.write(JSON.stringify(verdict,null,2)+'\n');
    if(!verdict.ok)process.exitCode=1;
   }catch(error){
    process.stderr.write('Invalid staging readback file: '+error.message+'\n');
    process.exitCode=2;
   }
  }
 }
 else if(format==='--report')process.stdout.write(JSON.stringify({
  schema:manifest.schema,release:manifest.release,
  snapshot:manifest.snapshot,digest:manifest.digest,
  ...manifest.stats,note:'No D1 writes or network calls performed'
 },null,2)+'\n');
 else{
  process.stderr.write('Usage: node scripts/plan-editorial-d1-defaults.mjs '+
   '[--report|--json|--sql|--readback-sql|--staging-rollback-sql|--verify-readback <staging-readback.json>]\n');
  process.exitCode=2;
 }
}
