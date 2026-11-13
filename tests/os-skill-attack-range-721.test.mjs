import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const items=JSON.parse(read('data/os/items.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const bow={slot:'weapon',kind:'BOW',range:1700};
const cb=items['2402'];
const inspect=(job,level,rank,weapon=cb,catalog=skills)=>
 C.skillAttackRangePreview({skillCatalog:catalog,jobKey:job,level,
  branchMasteries:{archery:rank},branchCaps:classes[job].branchCaps,weapon});
test('official RU/EN names, class and full range/carry source vectors',()=>{
 const proofs=[
  [213605001,'Точная стрельба','Sniper Nest','SNIPER','Стрелок',45,
   ['BOW','CROSSBOW'],[0,0,300,200]],
  [213703001,'Двойной выстрел','Arrow Fusillade','PREDATOR','Охотник',50,
   ['CROSSBOW'],[0,0,900,100]]
 ];
 for(const [id,ru,en,job,jobRu,level,weapons,vector] of proofs){
  const s=skills[id];
  assert.equal(s.name,ru);assert.equal(english.skills[id].n,en);
  assert.equal(classes[job].name,jobRu);
  assert.equal(s.charLevel,level);
  assert.deepEqual(s.weaponUse,weapons);
  assert.deepEqual(s.funcs.find(f=>f.ep==='EP_ATTACKRANGE_CONST').fv1,vector);
  assert.deepEqual(s.funcs.find(f=>f.ep==='EP_ATTACKCARRY_CONST').fv1,vector);
  assert.equal(inspect(job,level,0).rows[0].id,id);
 }
});
test('separate floor calculations do not alter permanent range',()=>{
 const snap=C.base({classData:classes.ARCHER,
  raceData:tables.raceInit.ELF,jobData:tables.jobInit.SCOUT,
  allocation:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},level:50,
  potionContext:{racialPassiveId:900020002},
  combatContext:{jobKey:'PREDATOR',weapon:cb,skillCatalog:skills,
   branchMasteries:{archery:55}}});
 assert.equal(snap.attackRange.totalRanged,1750);
 assert.equal(snap.skillAttackRange.rows[0].sourceBonus,595);
 assert.equal(snap.skillAttackRange.rows[0].finalSkillRange,null);
 assert.equal(snap.skillAttackRange.appliedToPermanentRange,false);
 const sniper=inspect('SNIPER',45,65,bow).rows[0];
 assert.equal(sniper.sourceBonus,395);
 assert.deepEqual([sniper.sourceConstant,sniper.sourceMasteryPart],[200,195]);
 assert.equal(sniper.mode,'toggle');
 assert.equal(inspect('PREDATOR',50,55).rows[0].mode,'use');
});
test('class, level, weapon, cap and unequip gates prevent false availability',()=>{
 assert.deepEqual(inspect('WARRIOR',55,40).rows,[]);
 assert.equal(inspect('SNIPER',44,65,bow).rows[0].available,false);
 assert.match(inspect('SNIPER',44,65,bow).rows[0].reasonRu,/45/);
 assert.equal(inspect('SNIPER',45,65,bow).rows[0].available,true);
 assert.equal(inspect('SNIPER',45,65,null).rows[0].available,false);
 assert.match(inspect('SNIPER',45,65,null).rows[0].reasonRu,/лук или арбалет/);
 assert.equal(inspect('PREDATOR',50,50,bow).rows[0].available,false);
 assert.match(inspect('PREDATOR',50,50,bow).rows[0].reasonRu,/арбалет/);
 assert.equal(inspect('PREDATOR',50,50,cb).rows[0].available,true);
 assert.equal(inspect('PREDATOR',50,90,cb).rows[0].sourceBonus,null);
 assert.equal(inspect('PREDATOR',50,90,cb).rows[0].available,false);
});
test('all altered source identities, paired channels and actions fail closed',()=>{
 for(const id of [213605001,213703001]){
  const original=skills[id];
  for(const change of [
   s=>s.charLevel++,
   s=>s.prereq=3,
   s=>s.learnable=false,
   s=>s.weaponUse=['SWORD'],
   s=>s.classes={WARRIOR:1},
   s=>s.funcs.push(structuredClone(s.funcs[0])),
   s=>s.funcs.find(f=>f.ep==='EP_ATTACKRANGE_CONST').fv1[3]++,
   s=>s.funcs.find(f=>f.ep==='EP_ATTACKCARRY_CONST').fv2[3]++,
   s=>s.funcs[0].fv1[0]++,
   s=>s.funcs[0].dir='CASTER'
  ]){
   const src={...skills,[id]:structuredClone(original)};
   change(src[id]);
   const job=id===213605001?'SNIPER':'PREDATOR';
   const result=inspect(job,55,50,cb,src);
   assert.equal(result.rows.length,0,id+' malformed effect');
   assert.ok(result.rejected.includes(id));
  }
 }
});
test('500 variable mastery projections retain distinct floor stages',()=>{
 const before=JSON.stringify(skills);
 for(let rank=0;rank<100;rank++){
  for(const job of ['SNIPER','PREDATOR']){
   const row=inspect(job,55,rank).rows[0];
   const cap=classes[job].branchCaps.archery;
   assert.equal(row.sourceBonus,rank<=cap?
    (job==='SNIPER'?200+Math.floor(rank*300/100):
     100+Math.floor(rank*900/100)):null);
   assert.equal(row.finalSkillRange,null);
  }
 }
 assert.equal(JSON.stringify(skills),before);
});
test('Attack chapter exposes skill-specific RU/EN explanations, not a new permanent stat',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/function appendSkillAttackRange/);
 assert.match(book,/Дальность при использовании умений/);
 assert.match(book,/Range while using skills/);
 assert.match(book,/Расчётная прибавка к дальности/);
 assert.match(book,/Только при включённом умении/);
 assert.match(book,/Только при применении умения/);
 assert.match(book,/Точная дальность при действии умения пока неизвестна/);
 assert.match(book,/appendSkillAttackRange\(body,calc,english,options\)/);
});
