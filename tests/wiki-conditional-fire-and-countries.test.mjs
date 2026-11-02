import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const file=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const data=JSON.parse(file('data/os/items.json'));
const ctx={window:{}};
for(const source of ['pandora-studio-item-owner-editor.js','pandora-studio-conditional-item-bonuses.js'])
 vm.runInNewContext(file(source),ctx,{filename:source});
const editor=ctx.window.PandoraStudioItemOwnerEditor;
const parse=ctx.window.PandoraConditionalItemBonuses.parse;
const explain=ctx.window.PandoraConditionalItemBonuses.phoenixExplanation;
test('all real fire-gem weapons have correctly parsed +7 conditional rows',()=>{
 const fire=Object.values(data).filter(row=>row.slot==='weapon'&&
  /Закалка самоцветом огня, начиная с \+7/.test(row.desc||''));
 assert.ok(fire.length>=14);
 for(const item of fire){
  const p=parse(item);
  assert.ok(p,item.name);
  assert.ok(p.rows.length>0||p.phoenix,item.name);
  assert.match(p.condition,/\+7/);
 }
});
test('weapon-specific Phoenix proc chance and stat match current game descriptions',()=>{
 for(const [id,chance,stat] of [[252,5,'СИЛ'],[452,5,'СИЛ'],[1493,3,'СИЛ'],
   [1862,3,'ИНТ'],[2262,3,'СИЛ'],[2442,3,'СИЛ'],[2852,3,'ИНТ']]){
  const p=parse(data[id]).phoenix;
  assert.equal(p.chance,chance,data[id].name);
  assert.equal(p.stat,stat,data[id].name);
  assert.equal(p.damage,25);
  assert.equal(p.scale,25);
  assert.equal(p.cooldown,5);
  assert.ok(explain(p).includes('25% от '+stat));
 }
});
test('weapon with no Phoenix text does not gain an invented proc',()=>{
 for(const id of [1652,2652]){
  const p=parse(data[id]);assert.equal(p.phoenix,null);assert.ok(p.rows.length>0);
 }
 assert.equal(parse(data[1652]).rows.find(x=>x.name==='Сопротивляемость магии огня').value,3);
 assert.equal(parse(data[2652]).rows.find(x=>x.name==='СД').value,1);
});
test('real wearable cooldown/casting effects remain editable without box activation effects',()=>{
 const codes=editor.effectOptions(data,data[452]).map(x=>x.value);
 for(const x of ['EP_IMMUNE_BURN','EP_SKILL_BENCH','EP_SKILL_DELAY'])assert.ok(codes.includes(x));
 for(const x of ['EP_RANDOM_BOX','EP_SKILL_EXEC'])assert.ok(!codes.includes(x));
 const app=file('pandora-studio-app.js');
 assert.match(app,/EP_IMMUNE_BURN','EP_IMMUNE_VIT_TYPE','EP_SKILL_BENCH','EP_SKILL_DELAY/);
 assert.match(app,/wiki-conditional-term/);
});
test('color chests have known types but no official reward rates in current chests file',()=>{
 const chests=JSON.parse(file('data/os/chests.json'));
 const ids=new Set([...chests.boxes,...chests.npc].map(x=>x.i));
 for(const [id,term] of [[51038,'оружия или доспехов'],[51040,'аксессуаров'],[51042,'душ']]){
  assert.equal(ids.has(id),false);
  assert.match(data[id].desc,new RegExp(term,'i'));
 }
});
test('Astir city NPC zones are not mislabeled as the three sovereign nations',()=>{
 const source=JSON.parse(file('data/os/trades.json'));
 assert.equal(source.mapNames['1001004'].name,'Центральная площадь');
 assert.equal(source.mapNames['1002001'].name,'Территория Союза');
 assert.equal(source.mapNames['1003001'].name,'Территория Королевства');
 assert.equal(source.mapNames['1004001'].name,'Территория Империи');
 assert.notEqual(source.mapNames['1002001'].name,'Союз северных племен Ванриг');
 assert.notEqual(source.mapNames['1004001'].name,'Лотарская империя');
 const app=file('pandora-studio-app.js');
 for(const id of ['1002001','1003001','1004001'])assert.ok(app.includes(id));
 assert.match(app,/Культье/);
 assert.match(app,/Астир/);
 assert.match(app,/wiki-chest-opening-fields/);
 for(const id of ['2001001','2002001','2001002','2003001','2001003','2004001'])
  assert.ok(app.includes(id),'Missing road or connecting map '+id);
 assert.match(app,/Союз северных племён Ванриг/);
 assert.match(app,/Лотарская империя/);
 assert.match(app,/Королевство Сэнт-Фальстайн/);
});
test('numeric values align to right and Phoenix help term is dotted',()=>{
 const css=file('pandora-studio-item-owner-editor.css');
 assert.match(css,/\.wiki-owner-effect-value\{margin-left:auto/);
 assert.match(css,/justify-content:flex-end;text-align:right/);
 assert.match(css,/\.wiki-conditional-term\{text-decoration-line:underline/);
});

