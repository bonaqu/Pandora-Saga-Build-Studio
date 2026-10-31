import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const C=scope.PandoraOSCalculator,items=JSON.parse(read('data/os/items.json')),
 souls=JSON.parse(read('data/os/souls.json')),skills=JSON.parse(read('data/os/skills.json'));
const preview=(record,id,kind='soul',grade=0)=>C.conditionalProcPreview({
 records:[[kind+':'+id,record,grade]],skills}).entries;
test('real source-defined trigger skills and percentages are displayed by category',()=>{
 for(const [id,kind,skill,trigger,chance] of [
  [101010,'soul','Оглушение','При ударе',4],
  [101022,'soul','Понижение скорости движения','При ударе',5],
  [422,'item','Падение','При ударе',9],
  [15082,'item','Порыв','При получении урона',8]
 ]){
  const row=preview((kind==='soul'?souls:items)[id],id,kind)[0];
  assert.equal(row.skillName,skill);
  assert.equal(row.trigger,trigger);
  assert.equal(row.chance,chance);
 }
});
test('Vampire Soul description and numeric chance disagree; avoid claiming either number',()=>{
 const source=souls[101009];
 assert.equal(source.effects[0].b,5);
 assert.match(source.desc,/4%/);
 const entry=preview(source,101009)[0];
 assert.equal(entry.skillName,'Кража жизни');
 assert.equal(entry.disputedChance,true);
 assert.equal(entry.chance,null);
});
test('Soul grade gates and unknown skill names are safe',()=>{
 assert.equal(preview(souls[101010],101010,'soul',11).length,0);
 assert.equal(preview(souls[101010],101010,'soul',10).length,1);
 const unknown=C.conditionalProcPreview({records:[['item:custom',{effects:[
  {func:'EP_ONHIT_SKILL_EXEC',a:123,b:10}]},0]]});
 assert.equal(unknown.entries[0].skillName,'Особый эффект');
 assert.equal(unknown.verified,false);
});
test('Proc preview is not applied as deterministic attack bonus',()=>{
 const src=read('os-calculator.js'),book=read('stage-attributes.js');
 assert.match(src,/const procPreview=conditionalProcPreview\(/);
 assert.match(src,/resistances,targetResistance,procPreview,experienceBonus,regeneration/);
 assert.match(book,/Срабатывания предметов и душ/);
});
