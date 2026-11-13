import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json')),
 classes=JSON.parse(read('data/os/classes.json'));
const book=read('pandora-studio-hero-book.js');
const strike=(branch,rank,skill=142002001,weapon='1H_AXE',level=45,catalog=skills)=>{
 const rows=C.directStrikeCoefficientPreview({
  skillCatalog:catalog,jobKey:'JUGGERNAUT',level,
  branchMasteries:{[branch]:rank},branchCaps:classes.JUGGERNAUT.branchCaps,
  weaponKind:weapon});
 return rows.find(x=>x.id===skill);
};
test('Current hero strike coefficient grows at the exact next mastery step',()=>{
 const x=strike('brush',40);
 assert.equal(x.amount,null,'Coefficient is not final enemy damage');
 assert.equal(x.coefficientModels[0].amount,20);
 assert.deepEqual(x.nextMastery,
  {branch:'brush',value:42,remaining:2,gain:1,effect:'strike'});
 assert.equal(strike('brush',41).coefficientModels[0].amount,20);
 assert.equal(strike('brush',42).coefficientModels[0].amount,21);
});
test('Never offer a breakpoint beyond the class cap or after a skill upgrade',()=>{
 assert.equal(strike('brush',90).nextMastery,null);
 const old=strike('slash',69,110101001,'1H_SWORD');
 assert.deepEqual(old.nextMastery,
  {branch:'slash',value:70,remaining:1,gain:1,effect:'strike'});
 assert.equal(strike('slash',70,110101001,'1H_SWORD').nextMastery,null,
  'Double Slash is replaced by Cut at mastery 71');
 assert.equal(strike('slash',71,110101001,'1H_SWORD'),undefined);
 assert.ok(strike('slash',71,110101002,'1H_SWORD'));
 assert.equal(strike('brush',7).nextMastery,null,'Locked skill has no preview promise');
});
test('Every exposed strike step increases exactly the current source coefficient',()=>{
 let count=0;
 for(let m=8;m<=90;m++){
  const row=strike('brush',m);
  if(!row?.nextMastery)continue;
  const next=row.nextMastery;
  assert.ok(next.value>m&&next.value<=90);
  const gained=strike('brush',next.value);
  assert.equal(gained.coefficientModels[0].amount,
   row.coefficientModels[0].amount+1);
  for(let rank=m+1;rank<next.value;rank++)
   assert.equal(strike('brush',rank).coefficientModels[0].amount,
    row.coefficientModels[0].amount);
  count++;
 }
 assert.ok(count>60);
});
test('Current INT and trained mastery separately project the next spell coefficient',()=>{
 const options={skillCatalog:skills,jobKey:'WARLOCK',level:45,
  branchMasteries:{element:40},branchCaps:classes.WARLOCK.branchCaps,
  stats:{int:60}};
 const row=C.elementalSpellCoefficientPreview(options).find(x=>x.id===410001001);
 assert.equal(row.available,true);
 assert.equal(row.amount,null);
 assert.equal(row.coefficientModels[0].amount,120);
 assert.deepEqual(row.nextStat,
  {stat:'int',value:61,remaining:1,gain:1});
 assert.deepEqual(row.nextMastery,
  {branch:'element',value:42,remaining:2,gain:1,effect:'spell'});
 const withInt=C.elementalSpellCoefficientPreview({
  ...options,stats:{int:61}}).find(x=>x.id===410001001);
 const withMastery=C.elementalSpellCoefficientPreview({
  ...options,branchMasteries:{element:42}}).find(x=>x.id===410001001);
 assert.equal(withInt.coefficientModels[0].amount,121);
 assert.equal(withMastery.coefficientModels[0].amount,121);
});
test('Bad source vectors and unavailable skills never promise a future step',()=>{
 const bad=structuredClone(skills);
 bad['142002001'].funcs.find(f=>f.ep==='EP_ONHIT_DAMAGE_SCALE').fv1[2]=1000;
 assert.equal(strike('brush',40,142002001,'1H_AXE',45,bad),undefined);
 const rankTooLow=C.elementalSpellCoefficientPreview({
  skillCatalog:skills,jobKey:'WARLOCK',level:1,
  branchMasteries:{element:0},branchCaps:classes.WARLOCK.branchCaps,
  stats:{int:60}}).find(x=>x.id===410002001);
 if(rankTooLow&&!rankTooLow.available){
  assert.equal(rankTooLow.nextMastery,null);
  assert.equal(rankTooLow.nextStat,null);
 }
});
test('Book shows one primary coefficient without duplicate rows, and hints stay in More details',()=>{
 const block=book.slice(book.indexOf('// Only effects calculable for this hero remain here.'),
  book.indexOf('// Effects from party skills are not abilities learned'));
 assert.match(block,/const singlePart=/);
 assert.match(block,/stage-skill-primary-coefficient/);
 assert.match(block,/if\(!singlePart\)/);
 assert.match(block,/skill\.nextStat/);
 assert.match(block,/skill\.nextMastery/);
 assert.match(block,/more\.append\(make\('small',\{class:'stage-skill-next-mastery'/);
 assert.doesNotMatch(block,/Расчётная модель по игровым данным|не подтверждённый итоговый результат/);
});
