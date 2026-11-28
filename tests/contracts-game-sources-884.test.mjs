// Small historical-source, catalog and visual fallback contracts.
// All checks are unchanged; each source module remains traceable by comment.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import vm,{runInNewContext} from 'node:vm';

// Original: tests/honor-pvp-selfhosted-843.test.mjs
{
const src=readFileSync(new URL('../pandora-studio-honor-view.js',import.meta.url),'utf8');
test('PvP victories illustration never accesses an external image host',()=>{
 assert.match(src,/src:'assets\/wiki\/honor-victories\.jpg'/);
 assert.match(src,/eventImage\.addEventListener\('error',\(\)=>eventImage\.remove\(\)\)/);
 assert.doesNotMatch(src,/pandorasaga-os\.com|officialScreenshot|originalTried/);
 assert.ok(statSync(new URL('../assets/wiki/honor-victories.jpg',import.meta.url)).size>10000);
});
}

// Original: tests/catalog-historical-legacy-20261115.test.mjs
{
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const historic='data/catalog-history/pre-2026-11-15/';
test('preserved historical skill and class signatures differ from published new catalog',()=>{
 const before=read(historic+'skills.json'),after=read('data/os/skills.json');
 assert.equal(Object.keys(before).length,569);
 assert.equal(Object.keys(after).length,571);
 assert.equal(before[320006001].funcs.length,2);
 assert.equal(after[320006001].funcs.length,1);
 assert.equal(before[240009001].learnable,false);
 assert.equal(after[240009001].learnable,true);
 assert.equal(read(historic+'classes.json').CONJURER.branchCaps.warding,5);
 assert.equal(read('data/os/classes.json').CONJURER.branchCaps.warding,10);
 assert.equal(read(historic+'tables.json').levelCap,45);
 assert.equal(read('data/os/tables.json').levelCap,50);
});
test('historical RU descriptions are carried into the candidate unmodified',()=>{
 const before=read(historic+'instances.json');
 const after=read('data/os/instances.json');
 for(const row of before)assert.deepEqual(after.find(x=>x.id===row.id),row);
});
}

// Original: tests/live-game-description-source-20261108.test.mjs
{
const read=name=>JSON.parse(readFileSync(
 new URL('../data/catalog-history/pre-2026-11-15/'+name+'.json',import.meta.url),'utf8'));
const items=read('items'),souls=read('souls'),en=read('strings.en');

test('game source item descriptions retain authoritative lore/bonus breaks',()=>{
 assert.equal(Object.keys(items).length,1116);
 assert.match(items['1'].desc,/кинжал\.<br><br>ПРВ \+1/);
 assert.match(items['13083'].desc,/<b>При усовершенствовании/);
 assert.match(items['51060'].desc,/<item 80100>/);
 assert.match(items['80100'].desc,/<item 300001>/);
});
test('game source soul and English descriptions retain original authored breaks',()=>{
 assert.equal(Object.keys(souls).length,112);
 assert.match(souls['101004'].desc,/<br>/);
 assert.match(en.items['1'].d,/dagger\.<br><br>AGI \+1/);
 assert.match(en.souls['101004'].d,/<br>/);
});
test('description-only restore preserves items, names and English record counts',()=>{
 assert.equal(items['1'].name,'Спата');
 assert.equal(items['13083'].name,'Золотые поножи');
 assert.equal(souls['101004'].id,101004);
 assert.equal(Object.keys(en.items).length,1115);
 assert.equal(Object.keys(en.souls).length,112);
});
}

// Original: tests/catalog-current-skill-census-20261115.test.mjs
{
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const current=read('data/os/skills.json');
const historical=read('data/catalog-history/pre-2026-11-15/skills.json');
const calc=skills=>({records:Object.keys(skills).length,
 effects:Object.values(skills).reduce((n,x)=>n+x.funcs.length,0),
 types:new Set(Object.values(skills).flatMap(x=>x.funcs.map(v=>v.ep))).size,
 learnableWithClass:Object.values(skills).filter(x=>x.learnable&&
  Object.values(x.classes||{}).some(Boolean)).length});
test('current published 571-skill/1076-effect graph is not historical 569/1070',()=>{
 assert.deepEqual(calc(historical),{records:569,effects:1070,types:283,learnableWithClass:232});
 assert.deepEqual(calc(current),{records:571,effects:1076,types:283,learnableWithClass:234});
 const added=Object.keys(current).filter(id=>!Object.hasOwn(historical,id));
 assert.deepEqual(added,['420007101','420007102']);
 assert.equal(current['420007101'].funcs[0].fv1[3],420007102);
 assert.equal(current['420007102'].learnable,false);
 assert.equal(current['240009001'].learnable,true);
 assert.equal(Object.values(current).filter(x=>x.learnable&&
  Object.values(x.classes||{}).some(Boolean)).length,234);
 assert.equal(historical['240009001'].learnable,false);
});
}

// Original: tests/live-game-monster-snapshot-20261108.test.mjs
{
const read=name=>JSON.parse(readFileSync(new URL('../data/catalog-history/pre-2026-11-15/'+name+'.json',
 import.meta.url),'utf8'));
const monsters=read('monsters'),meta=read('meta');

test('monster snapshot matches verified live OS game source on 2026-11-08',()=>{
 // Current public game API: https://pandorasaga-os.com/gamedata/monsters.json
 // Independent D1: https://ps-build-studio-cloud.bonaqu.workers.dev/api/catalog/monsters.json
 assert.equal(Object.keys(monsters).length,702);
 assert.equal(monsters['43650']?.name,'Восставший король');
 assert.equal(monsters['43650']?.life,1250000);
 assert.equal(monsters['43732']?.name,'Хранитель тлена');
 assert.equal(monsters['43732']?.life,1350000);
 assert.equal(meta.sha?.['monster/monster.csv'],'f637f83a84a49c74');
});
test('monster HP corrections preserve the independently confirmed non-HP fields',()=>{
 const king=monsters['43650'],decay=monsters['43732'];
 assert.deepEqual([king.level,king.vit,king.str,king.resists?.physical],
  [64,76,113,10]);
 assert.deepEqual([decay.level,decay.vit,decay.str,decay.resists?.physical],
  [70,91,136,20]);
 // This is a local source snapshot correction, not a runtime D1 overlay.
 assert.equal(Object.keys(monsters).length,meta.counts.monsters);
});
}

// Original: tests/remaked-mounted-release.test.mjs
{
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const h={};Function('window',read('pandora-os-character-calculator.js'))(h);
const calc=h.PandoraOSCalculator.mountedReleasePreview;
test('RelHorse job base values match legacy formula',()=>{
 for(const [job,n] of [['DRAGOON',50],['PALADIN',50],['PREDATOR',30],['CALAMITY',40],['WARRIOR',10],['PRIEST',10]])
  assert.equal(calc({jobKey:job}).known,n);
});
test('riding green adeptness and selected Honor contribute separately',()=>{
 const r=calc({jobKey:'DRAGOON',ridingMastery:24,honorTitle:7});
 assert.deepEqual([r.jobBase,r.mastery,r.honor,r.known],[50,24,10,84]);
 assert.equal(r.verified,false);
 assert.equal(calc({jobKey:'PREDATOR',honorTitle:1}).known,30);
});
test('bad inputs fail closed',()=>{
 for(const v of [{},{jobKey:'WARRIOR',ridingMastery:-1},{jobKey:'WARRIOR',ridingMastery:1.5},{jobKey:'WARRIOR',honorTitle:99}])assert.equal(calc(v),null);
});
test('riding is attached to character calculator and hero book',()=>{
 assert.match(read('pandora-studio-app.js'),/groupAdeptness\(snap,\['riding'\],initialBranches,caps\)/);
 assert.match(read('pandora-studio-hero-book.js'),/calc\?\.mountedRelease\?\.known/);
 assert.match(read('docs/REMAKED_FORMULA_INVENTORY.md'),/\| `RelHorse` \|[^\n]+\| PARTIAL \|/);
});
}

// Original: tests/wiki-location-expansion.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const maps=JSON.parse(read('data/os/maps.json')),
 trades=JSON.parse(read('data/os/trades.json')),
 tables=JSON.parse(read('data/os/tables.json'));
const app=read('pandora-studio-app.js');
test('wiki location list includes named NPC settlements even when mob map table omits them',()=>{
 const names=Object.keys(trades.mapNames||{});
 assert.ok(names.length>=10);
 const extra=names.filter(id=>!maps[id]);
 assert.ok(extra.length>=1);
 assert.match(app,/const knownMaps=wikiIndex\.records\('map'\)/);
 assert.match(app,/const records=wikiIndex\.records\(type\)/);
});
test('zone drops are presented as group probabilities, never fake per-item chance',()=>{
 assert.ok(tables.zoneDrops.length>0);
 assert.match(app,/const dropZones=wikiIndex\.zones\(id\)/);
 assert.match(app,/Шанс группы добычи/);
 assert.match(app,/Шанс отдельной вещи не указан/);
 assert.match(app,/itemLink\(reward\.i/);
});
test('monster encyclopedia exposes existing OS level HP AC and resistances',()=>{
 assert.match(app,/class:'wiki-monster-stats'/);
 assert.match(app,/rec\.magicProtection/);
 assert.match(app,/rec\.resists/);
 assert.match(app,/Сопротивления/);
 assert.match(app,/class:'wiki-monster-resist'/);
});
}

// Original: tests/official-game-patch-skill-notes-807.test.mjs
{
const catalog=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
const root={};
runInNewContext(readFileSync(new URL('../pandora-studio-wiki-skill-insights.js',
 import.meta.url),'utf8'),{window:root});
const official=root.PandoraWikiSkillInsights.officialPatchNotes;
test('official November patch action notes require exact actual skills',()=>{
 for(const id of [320006001,340001001,340003001,340004001,440009001,
  440011001,420004002,420005002,420007101]){
  const notes=official(catalog[id],catalog);
  assert.equal(notes.length,1,'Skill '+id+' must have one patch note');
  assert.ok(notes[0].ru&&notes[0].en);
 }
});
test('source-shape changes suppress out-of-date factual mechanics notes',()=>{
 for(const id of [420004002,420005002,420007101]){
  const changed=structuredClone(catalog[id]);changed.cast=99;
  assert.deepEqual(Array.from(official(changed,catalog)),[]);
 }
 const changed=structuredClone(catalog[440009001]);
 changed.funcs[0].fv1[3]=0;
 assert.deepEqual(Array.from(official(changed,catalog)),[]);
});
test('unrelated skills never receive the patch-specific claims',()=>{
 assert.equal(official(catalog['100000501'],catalog).length,0);
 assert.equal(official({id:999,name:'Чума'},catalog).length,0);
});
}

// Original: tests/rules.test.mjs
{
const sandbox={window:{}};
vm.runInNewContext(readFileSync(new URL('../pandora-studio-equipment-rules.js',import.meta.url),'utf8'),sandbox);
const r=sandbox.window.PandoraStudioRules;
test('known class and branch requirements',()=>{const s={id:310001002,learnable:true,reqLevel:0,prereq:null,classes:{CLERIC:1},charLevel:20,reqs:[{branch:'brush',amount:8}]};
assert.equal(r.readiness(s,{job:'CLERIC',level:50,points:{brush:7}}).status,'locked');
assert.equal(r.readiness(s,{job:'CLERIC',level:50,points:{brush:8}}).status,'eligible');
assert.equal(r.readiness(s,{job:'WARRIOR',level:50,points:{brush:8}}).status,'locked');
assert.equal(r.readiness({...s,prereq:'unknown'},{job:'CLERIC',level:50,points:{brush:8}}).status,'unknown')});
test('class caps and equipment compatibility',()=>{
assert.equal(r.branchCap({CLERIC:{branchCaps:{brush:15}}},'CLERIC','brush'),15);
assert.equal(r.equipment({slot:'weapon',level:40,classes:{WARRIOR:1}},{slot:'weapon',job:'WARRIOR',level:50}).allowed,true);
assert.equal(r.equipment({slot:'weapon',level:40,classes:{WARRIOR:1}},{slot:'weapon',job:'CLERIC',level:50}).allowed,false)});
}
