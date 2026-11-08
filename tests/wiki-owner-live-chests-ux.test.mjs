import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function load(paths){
 const box={window:{}};
 for(const path of paths)vm.runInNewContext(file(path),box,{filename:path});
 return box.window;
}
const root=load(['pandora-studio-item-owner-editor.js',
 'pandora-studio-item-presentation.js','pandora-studio-owner-change-review.js',
 'pandora-studio-encyclopedia-data.js','pandora-studio-wiki-owner-data.js']);
test('Russian game bonuses display the in-game abbreviations without changing EP codes',()=>{
 const name=root.PandoraStudioItemOwnerEditor.effectDisplayLabel;
 assert.equal(name('EP_AGILITY_CONST'),'ПРВ');
 assert.equal(name('EP_DEXTERITY_CONST'),'ЛВК');
 assert.equal(name('EP_STRENGTH_CONST'),'СИЛ');
 assert.equal(name('EP_VITARITY_CONST'),'ВЫН');
 assert.equal(name('EP_SPIRITUAL_CONST'),'СД');
 assert.equal(name('EP_INTELIGENCE_CONST'),'ИНТ');
 assert.equal(name('EP_TOHIT_CONST'),'Меткость');
});
test('all known 12 real location chests and their reward sources appear in encyclopedia',()=>{
 const chests=JSON.parse(file('data/os/chests.json'));
 const items=JSON.parse(file('data/os/items.json'));
 assert.equal(chests.npc.length,12);
 assert.equal(chests.boxes.length,32);
 const a=chests.npc[0],reward=a.rolls.flat().find(x=>x.i!=null);
 const data={chests,items,monsters:{},drops:{},maps:{},instances:[],
  trades:{trades:[],npcs:{},mapNames:{}},skills:{},souls:{},tables:{}};
 const wiki=root.PandoraWikiData.build(data);
 const chest=wiki.records('chest')[String(a.i)];
 assert.equal(chest.i,a.i);
 assert.equal(chest.key,a.key);
 assert.equal(chest.rolls[0].length,a.rolls[0].length);
 const linked=wiki.sources(reward.i).filter(x=>x.type==='chest'&&x.id===String(a.i));
 assert.ok(linked.length>0);
 assert.equal(linked[0].percent,reward.p);
});
test('editing map chest rewards preserves it as NPC chest and keeps its key metadata',()=>{
 const items={52001:{id:52001,name:'Сундук'},52101:{id:52101,name:'Ключ'},
  101021:{id:101021,name:'Душа'},50001:{id:50001,name:'Материал'}};
 const base={items,monsters:{},drops:{},maps:{},instances:[],trades:{trades:[],npcs:{}},
  chests:{boxes:[],npc:[{i:52001,key:52101,rolls:[[{i:101021,n:1,p:2}]]}]}};
 const edited=root.PandoraWikiOwnerData.apply(base,{
  'chestedit.52001':JSON.stringify([[{i:50001,n:2,p:10}]])
 });
 assert.equal(edited.chests.npc.length,1);
 assert.equal(edited.chests.boxes.length,0);
 assert.equal(edited.chests.npc[0].key,52101);
 assert.equal(edited.chests.npc[0].rolls[0][0].p,10);
 assert.equal(base.chests.npc[0].rolls[0][0].p,2);
});
test('review presents readable location and real before/after item values',()=>{
 const inspect=root.PandoraOwnerChangeReview.inspect;
 const data={items:{1:{name:'Спата',effects:[{
  func:'EP_AGILITY_CONST',dir:'TARGET',exclusive:null,a:1,b:null}]}}};
 const rec=inspect('itemedit.1',JSON.stringify({effects:[{
  func:'EP_AGILITY_CONST',dir:'TARGET',exclusive:null,a:2,b:null}]}),{base:data});
 assert.equal(rec.title,'Предмет · Спата');
 assert.deepEqual(JSON.parse(JSON.stringify(rec.target)),{type:'item',id:'1'});
 assert.match(rec.changes[0].before,/ПРВ \+1/);
 assert.match(rec.changes[0].after,/ПРВ \+2/);
 const rename=inspect('item.1','Спата улучшенная',{base:data});
 assert.equal(rename.changes[0].before,'Спата');
 assert.equal(rename.changes[0].after,'Спата улучшенная');
});
test('Soul attributes share a single 2-column frame and show cautious price context',()=>{
 const app=file('pandora-studio-app.js');
 const css=file('pandora-studio-item-owner-editor.css');
 assert.match(app,/class:'wiki-soul-properties'/);
 assert.match(app,/class:'wiki-soul-properties-half wiki-soul-price-pane'/);
 assert.match(app,/Это не рыночная цена между игроками/);
 assert.match(css,/grid-template-columns:max-content max-content/);
});
test('admin text and search editors use contenteditable, not username inputs',()=>{
 const app=file('pandora-studio-app.js');
 assert.match(app,/function ownerPlainTextField/);
 assert.match(app,/contenteditable:'plaintext-only'/);
 assert.match(app,/const search=ownerPlainTextField\(/);
 assert.match(app,/const recipeSearch=ownerPlainTextField\(/);
 assert.match(app,/window\.PandoraOwnerChangeReview\.inspect/);
 assert.doesNotMatch(app,/const search=h\('input',\{type:'search',class:'wiki-inline-input'/);
});

test('all game-source NPC chest item and gold rows pass the owner editor schema',()=>{
 const data=JSON.parse(file('data/os/chests.json'));
 const valid=root.PandoraWikiOwnerData.validChest;
 for(const box of [...data.boxes,...data.npc])
  assert.equal(valid(box.rolls),true,'Game chest '+box.i+' should be editable');
 const npc=data.npc.find(row=>row.i===52002);
 assert.ok(npc?.rolls.flat().some(row=>Array.isArray(row.gold)));
});

test('NPC chest chance edit preserves every source gold range and its key',()=>{
 const chests=JSON.parse(file('data/os/chests.json'));
 const items=JSON.parse(file('data/os/items.json'));
 const base={items,monsters:{},drops:{},maps:{},instances:[],
  trades:{trades:[],npcs:{}},chests};
 const npc=chests.npc.find(row=>row.i===52002);
 const original=JSON.stringify(npc);
 const draft=structuredClone(npc.rolls);
 const goldIndex=draft[0].findIndex(row=>Array.isArray(row.gold));
 assert.ok(goldIndex>=0);
 const previous=draft[0][goldIndex].p;
 draft[0][goldIndex].p=4.5;
 const changed=root.PandoraWikiOwnerData.apply(base,{
  'chestedit.52002':JSON.stringify(draft)
 });
 const updated=changed.chests.npc.find(row=>row.i===52002);
 assert.equal(updated.rolls[0][goldIndex].p,4.5);
 assert.deepEqual(Array.from(updated.rolls[0][goldIndex].gold),draft[0][goldIndex].gold,
  'The VM-owned result preserves both numeric gold endpoints');
 assert.equal(updated.key,npc.key);
 assert.equal(changed.chests.boxes,chests.boxes,'Normal chests stay untouched');
 assert.equal(JSON.stringify(npc),original,'Source D1 game data must be immutable');
 assert.notEqual(previous,4.5);
});

test('NPC chest gold editor rejects malformed ranges and bogus item references',()=>{
 const valid=root.PandoraWikiOwnerData.validChest;
 const allowed=[{i:50002,n:30,p:30},{gold:[60000,100000],p:3}];
 assert.equal(valid([allowed]),true);
 for(const row of [
  {gold:[100000,60000],p:3},{gold:[-1,1000],p:3},
  {gold:['60000',100000],p:3},{gold:[1000],p:3},
  {i:50002,gold:[1,2],p:3},{gold:[1,2],n:1,p:3},
  {gold:[1,2],p:101}
 ])assert.equal(valid([[row]]),false,JSON.stringify(row));
 const app=file('pandora-studio-app.js');
 assert.match(app,/!Object\.hasOwn\(row,'i'\)\|\|/);
});
