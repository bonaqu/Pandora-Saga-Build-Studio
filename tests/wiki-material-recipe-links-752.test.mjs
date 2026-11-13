import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-os-character-calculator.js'))(root);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(root);
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const items=JSON.parse(read('data/os/items.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const inspect=id=>root.PandoraWikiSkillInsights.inspect({
 skillCatalog:skills,classes,id,calculator:root.PandoraOSCalculator});
test('All four OS crafting recipes have complete item identities and quantities',()=>{
 const cases=[
  [220002001,[[50022,1],[65011,1]],[50056,1]],
  [220003001,[[50021,1],[65011,1]],[50057,1]],
  [220004001,[[50025,1],[50024,1],[65011,1]],[50061,1]],
  [320010001,[[65011,1]],[50059,1]]
 ];
 for(const [id,uses,produces] of cases){
  const extra=inspect(id)?.extra?.find(x=>x.type==='recipe');
  assert.ok(extra,'Missing OS recipe '+id);
  assert.deepEqual(extra.uses.map(x=>[x.id,x.quantity]),uses);
  assert.deepEqual([extra.produces.id,extra.produces.quantity],produces);
  for(const [itemId] of [...uses,produces]){
   assert.equal(items[String(itemId)]?.id,itemId);
   assert.ok(items[String(itemId)]?.name);
   assert.ok(english.items[String(itemId)]?.n);
  }
 }
});
test('OS consumable skill costs remain attached to the exact skill and item IDs',()=>{
 for(const [skillId,itemId,count] of [
  [310003001,50059,3],[220006001,50056,1]
 ]){
  const extra=inspect(skillId)?.extra?.find(e=>e.type==='requiredItem');
  assert.deepEqual(extra,{type:'requiredItem',count,itemId});
  assert.ok(items[String(itemId)]?.name);
 }
 const special=inspect(100059001)?.extra?.find(x=>x.type==='resource');
 assert.equal(special?.value,2);
 assert.equal(!!inspect(100059001)?.extra?.some(x=>x.type==='requiredItem'),false,
  'A special resource must not be mislabeled as an item');
});
test('Wiki uses the canonical navigation function and never invents material counts',()=>{
 const app=read('pandora-studio-app.js');
 const from=app.indexOf('const ingredientLink=itemId=>wikiLink(');
 const to=app.indexOf("if(extra.type==='resource')",from);
 assert.ok(from>0&&to>from);
 const rendering=app.slice(from,to);
 assert.match(rendering,/itemName\(itemId\),'item',String\(itemId\)/);
 assert.match(rendering,/extra\.uses\.forEach/);
 assert.match(rendering,/Number\.isSafeInteger\(x\.quantity\)/);
 assert.match(rendering,/extra\.produces\.quantity/);
 assert.match(rendering,/materialLine\(wt\('Для применения нужно:/);
 assert.doesNotMatch(rendering,/currentInventory|state\.equipment|\.count\|\|1/);
 const book=read('pandora-studio-hero-book.js');
 assert.doesNotMatch(book,/wiki-skill-source-recipe|wiki-skill-source-material/,
  'Recipes belong in Encyclopedia, not current-build stat calculations');
});
