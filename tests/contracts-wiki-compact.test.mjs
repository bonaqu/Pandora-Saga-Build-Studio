// Compact Wiki, artwork, and UI-source contracts; original tests preserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

{
// Original: tests/honor-owner-locale-629.test.mjs
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const view=read('pandora-studio-honor-view.js');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);

test('Honor unavailable-war message reuses normal inline RU/EN D1 editor',()=>{
 assert.match(view,/editorial\('h3','wiki-honor-title','warNotFound'/);
 assert.equal(root.PandoraHonorGuide.validOverride('book.honor-view.war-not-found',
  JSON.stringify({ru:'Война пока недоступна',en:'War unavailable'})),true);
 assert.match(view,/if\(!editable\)return element/);
});
test('Honor create-war form localizes both input names without confusing their actual language',()=>{
 assert.match(view,/placeholder:tr\('Название на русском','Russian name'\)/);
 assert.match(view,/placeholder:tr\('Название на английском','English name'\)/);
 assert.match(view,/'aria-label':tr\('Название на русском','Russian name'\)/);
 assert.match(view,/'aria-label':tr\('Название на английском','English name'\)/);
 assert.match(view,/const nameRu=ru\.value\.trim\(\),nameEn=english\.value\.trim\(\)/);
});
test('Honor owner remove aria label follows currently displayed RU/EN record name',()=>{
 assert.match(view,/'aria-label':tr\('Удалить','Remove'\)\+' '\+\(value\|\|item\.nameRu\)/);
 assert.doesNotMatch(view,/'aria-label':tr\('Удалить','Remove'\)\+' '\+item\.nameRu,/);
 assert.match(view,/const value=\(linked\?\(en\?linked\.nameEn:linked\.nameRu\):item\[field\]\)\|\|''/);
});

}

{
// Original: tests/ux-equipment-wiki-799.test.mjs

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('equipment picker changes adjacent slots without equipping and retains level-only filter',()=>{
 const code=read('pandora-studio-app.js');
 assert.match(code,/function appendStageSlotNavigation\(root\)/);
 assert.match(code,/openStageEquipmentSlot\(next,'choose'\)/);
 assert.match(code,/\(selectedSlot\+direction\+slots\.length\)%slots\.length/);
 assert.match(code,/appendStageSlotNavigation\(root\);/);
 assert.match(code,/stagePickerOnlyAvailable=bootView\.slotOnlyAvailable===true/);
 assert.match(code,/stageSlotShown=Number\.isInteger\(bootView\.slotShown\)/,
  'Session view restores a bounded number of disclosed items');
 assert.match(code,/records\.filter\(rec=>!stagePickerOnlyAvailable\|\|/);
 assert.match(code,/stagePickerOnlyAvailable=event\.target\.checked;stageSlotShown=48;draw\(\)/);
 assert.match(code,/onlyAvailable\.hidden=!records\.some/);
 assert.match(read('pandora-studio-equipment-tooltip.css'),/\.stage-picker-slot-navigation/);
});

test('opening a wiki chapter list captures the departing article scroll and filters',()=>{
 const code=read('pandora-studio-app.js');
 const body=code.slice(code.indexOf('function openWikiChapterList()'),
  code.indexOf('function wikiBackButton()'));
 assert.match(body,/history\.replaceState\(\{\.\.\.previous,psWikiPosition:wikiPosition\(\)\}/);
 assert.match(body,/history\.pushState\(\{\.\.\.previous,psWikiPosition:null,psWikiEntry:false/);
 assert.match(code,/restoreWikiFilters\(event\.state,match\[1\],match\[2\]\)/);
 assert.match(code,/restoreWikiPosition\(event\.state\)/);
});

}

{
// Original: tests/wiki-skill-link-identity.test.mjs

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const begin=app.indexOf('function wikiLink(');
const end=app.indexOf('function guardEncyclopediaSearch(',begin);
assert.ok(begin>0&&end>begin,'Wiki link helper must be available');
const linkFn=app.slice(begin,end);
function createLink(id,type='skill'){
 const opened=[];
 const canonical=(kind,key)=>kind==='skill'?'161202001':'item-primary';
 const index={canonical};
 const h=(tag,attrs)=>({tag,...attrs});
 const wikilink=Function('wikiIndex','h','openWiki',
  linkFn+';return wikiLink;')(index,h,(...args)=>opened.push(args));
 return {link:wikilink('Open',type,id),opened};
}
test('skill links preserve the exact source record, even when canonical primary differs',()=>{
 const {link,opened}=createLink('161202050');
 assert.equal(link.href,'#wiki/skill/161202050');
 let prevented=false;
 link.onclick({button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,
  preventDefault(){prevented=true}});
 assert.equal(prevented,true);
 assert.deepEqual(opened,[['skill','161202050',null]]);
});
test('other wiki categories still use canonical link destinations',()=>{
 const {link,opened}=createLink('900001','item');
 assert.equal(link.href,'#wiki/item/item-primary');
 link.onclick({button:0,preventDefault(){}});
 assert.deepEqual(opened,[['item','item-primary',null]]);
});
test('prerequisite skill links preserve requested ID when optional variants exist',()=>{
 assert.match(app,/const prereq=String\(rec\.prereq\);/);
 assert.doesNotMatch(app,/wikiIndex\.canonical\('skill',rec\.prereq\)/);
});

}

{
// Original: tests/wiki-soul-sources.test.mjs
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const drops=JSON.parse(get('data/os/drops.json')),souls=JSON.parse(get('data/os/souls.json')),
 trades=JSON.parse(get('data/os/trades.json')),chests=JSON.parse(get('data/os/chests.json')),
 tables=JSON.parse(get('data/os/tables.json'));
test('multiple real soul IDs have confirmed sources in current OS datasets',()=>{
 const ids=new Set([
 ...Object.values(drops).flatMap(g=>[...(g.d||[]),...(g.s||[])].map(r=>String(r.i))),
 ...trades.trades.map(r=>String(r.i)),
 ...chests.boxes.flatMap(c=>c.rolls.flat().map(r=>String(r.i))),
 ...tables.zoneDrops.flatMap(z=>(z.rows||[]).flatMap(r=>(r.items||[]).map(x=>String(x.i))))
 ]);
 assert.ok(Object.keys(souls).filter(id=>ids.has(id)).length>=70);
});
test('soul detail uses the existing indexed source map and trusted chest/NPC names',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/Где получить душу/);
 assert.match(app,/const found=wikiIndex\.sources\(id\)/);
 assert.match(app,/type==='item'\?\(wikiData\.items\?\.\[id\]\|\|wikiData\.souls\?\.\[id\]\)/);
 assert.match(app,/const appendSourceFlow=/);
 assert.match(app,/wiki-source-locations/);
 assert.match(app,/wikiIcon\('chest',row\.id\)/);
});
test('settlement and battlefield maps show real NPC trader residents',()=>{
 const app=get('pandora-studio-app.js');
 assert.ok(Object.values(trades.npcs).some(x=>x.maps?.length));
 assert.match(app,/const residents=wikiIndex\.residents\(id\)/);
 assert.match(app,/NPC в локации/);
});

}

{
// Original: tests/shared-snapshot-integrity.test.mjs

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const begin=app.indexOf('function isVerifiedSharedBuild(');
const end=app.indexOf('async function createShared(',begin);
assert.ok(begin>=0&&end>begin,'share verification must exist');
const verify=Function(app.slice(begin,end)+'\nreturn isVerifiedSharedBuild;')();

const sample={race:2,job:13,level:55,
 points:{slash:90,defend:25},equipment:[{id:1234}],souls:{0:[{id:101001}]},
 masteryAuto:false,mastery:{slash:48},name:'55 build'};

test('readback matches the exact published build, including future equipment and mastery',()=>{
 const wire=JSON.parse(JSON.stringify(sample));
 assert.equal(verify({schema:1,type:'build',data:wire},sample),true);
});

test('a different level, soul, weapon or trained mastery must fail share verification',()=>{
 for(const other of [
  {...sample,level:45},
  {...sample,equipment:[{id:9999}]},
  {...sample,souls:{0:[{id:101002}]}},
  {...sample,mastery:{slash:47}}
 ]){
  assert.equal(verify({schema:1,type:'build',data:other},sample),false);
 }
});

test('malformed, obsolete, or unavailable share readback never advertises a valid URL',()=>{
 assert.equal(verify(null,sample),false);
 assert.equal(verify({schema:2,type:'build',data:sample},sample),false);
 assert.equal(verify({schema:1,type:'library',data:sample},sample),false);
 assert.equal(verify({schema:1,type:'build',data:null},sample),false);
 assert.equal(verify({schema:1,type:'build',data:[]},sample),false);
 const cyclic={};cyclic.self=cyclic;
 assert.equal(verify({schema:1,type:'build',data:cyclic},sample),false);
});

}

{
// Original: tests/readme-gear-layout-872.test.mjs
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('README stays a compact project entry point, with historical notes preserved',()=>{
 const original=read('README.md'),index=read('docs/history/README-ARCHIVE.md');
 assert.ok(original.length<12000,'The GitHub project homepage must remain compact');
 assert.match(original,/## Возможности/);
 assert.match(original,/docs\/history\/README-ARCHIVE\.md/);
 const parts=readdirSync(new URL('../docs/history/',import.meta.url))
  .filter(x=>/^README-legacy-\d+\.md$/.test(x)).sort();
 assert.ok(parts.length>=4);
 assert.ok(parts.every(p=>index.includes(p)));
 const content=parts.map(p=>read('docs/history/'+p));
 assert.ok(content.every(x=>x.length<17000));
 assert.ok(content.some(x=>x.includes('2026.10.31.86')));
 assert.ok(content.some(x=>x.includes('0.153.0')));
 assert.ok(content.some(x=>x.includes('Secure administrator mode')));
});
test('responsive gear tabs keep no-soul and soul variants balanced',()=>{
 const css=read('pandora-studio-workbench-guidance.css');
 assert.match(css,/\.stage-rich-tabs\.no-souls\{grid-template-columns:minmax\(0,1\.45fr\) minmax\(0,1fr\)/);
 assert.match(css,/\.stage-rich-settings-group\{display:grid;grid-template-columns:minmax\(0,\.76fr\) minmax\(0,1\.24fr\)/);
 assert.match(css,/scrollbar-color:#95734c transparent/);
 assert.match(css,/@media\(max-width:520px\)\{/);
 assert.match(css,/\.stage-rich-tabs\.has-souls\{grid-template-columns:minmax\(0,1fr\);gap:5px\}/);
 assert.match(css,/\.stage-rich-tabs\{gap:8px;align-items:stretch;padding-inline-end:8px/);
 assert.doesNotMatch(css,/\.stage-rich-choose-group\{[^}]*border-right:1px/);
});

}
