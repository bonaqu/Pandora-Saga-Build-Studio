import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const racials=JSON.parse(read('data/os/racialPassives.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={vit:48,str:55,agi:65,dex:50,spi:70,int:40};
const empty={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const combat=(id=null,catalog=skills,job='WARRIOR')=>C.combatPreview({
 stats,level:45,jobKey:job,racialPassiveId:id,
 skillCatalog:catalog,weapon:{W:48,kind:'1H_AXE'}
});
const byPath=(o,p)=>p.split('.').reduce((n,k)=>n?.[k],o);
const cases=[
 {id:900040001,race:'MYLIN',ep:'EP_CRITICALRATE_CONST',value:5,path:'critical.known',sign:1},
 {id:900040002,race:'MYLIN',ep:'EP_TOHIT_SCALE',value:10,path:'racialRate.accuracy',sign:1},
 {id:900040003,race:'MYLIN',ep:'EP_AVOIDANCE_SCALE',value:5,path:'racialRate.dodge',sign:1},
 {id:900020001,race:'ELF',ep:'EP_RACE_MANA_COSTCUT',value:15,path:'manaCost.racial',sign:1},
 {id:900050003,race:'ENKIDU',ep:'EP_ONHIT_CRITICAL_DAMAGERATE',
  value:10,path:'criticalDamage',sign:1},
 {id:900030003,race:'DWARF',ep:'EP_CRITICAL_REGIST',
  value:5,path:'criticalIncoming',sign:-1},
 {id:900060003,race:'RAPIN',ep:'EP_CRITICAL_REGIST',
  value:10,path:'criticalIncomingDamage',sign:-1}
];
test('seven combat source channels preserve current OS numbers for all 28 jobs',()=>{
 const snapshot=JSON.stringify(skills),neutral=combat();
 assert.equal(Object.keys(classes).length,28);
 let count=0;
 for(const job of Object.keys(classes))for(const item of cases){
  assert.ok(racials[item.race].skills.includes(item.id));
  const source=skills[item.id];
  assert.equal(source.funcs[0].ep,item.ep);
  assert.equal(C.racialCombatSourcePreview({
   racialPassiveId:item.id,skillCatalog:skills
  }).amount,item.value);
  const base=combat(null,skills,job),active=combat(item.id,skills,job);
  assert.ok(base&&active);
  assert.equal(byPath(active,item.path)-byPath(base,item.path),
   item.value*item.sign,job+' / '+item.id);
  count++;
 }
 assert.equal(count,196);
 assert.equal(JSON.stringify(skills),snapshot);
 assert.equal(neutral.racialRate.accuracy,0);
});
test('all seven numbers change only with new complete supported source records',()=>{
 for(const item of cases){
  const local=structuredClone(skills),source=local[item.id].funcs[0];
  const target=item.id===900060003?source.fv2:source.fv1;
  target[3]=item.value+3;
  const proof=C.racialCombatSourcePreview({racialPassiveId:item.id,skillCatalog:local});
  assert.equal(proof.amount,item.value+3);
  const neutral=combat(null,local),active=combat(item.id,local);
  assert.equal(byPath(active,item.path)-byPath(neutral,item.path),
   (item.value+3)*item.sign);
  const tamper=structuredClone(local);
  tamper[item.id].funcs[0].fv1[0]=1;
  assert.equal(C.racialCombatSourcePreview({
   racialPassiveId:item.id,skillCatalog:tamper
  }),null);
  const rejected=combat(item.id,tamper);
  assert.equal(byPath(rejected,item.path),byPath(combat(null,tamper),item.path));
 }
 const critical=structuredClone(skills);
 critical[900060003].funcs[0].fv1[3]=9;
 assert.equal(C.racialCombatSourcePreview({
  racialPassiveId:900060003,skillCatalog:critical
 }),null,'Rapin critical modifier is in FV2, not FV1');
});
test('unknown FV2, new EP, changed direction or extra action fail closed for all nine',()=>{
 const ids=[...cases.map(x=>x.id),900060002,900010003];
 for(const id of ids){
  const existing=C.racialCombatSourcePreview({racialPassiveId:id,skillCatalog:skills});
  assert.ok(existing,id);
  const variants=[
   s=>s.funcs[0].fv1[0]=1,
   s=>s.funcs[0].fv2[0]=1,
   s=>s.funcs[0].dir='CASTER',
   s=>s.funcs[0].ep='EP_NEW_UNVERIFIED',
   s=>s.funcs.push(structuredClone(s.funcs[0])),
   s=>s.classes.WARRIOR=1,
   s=>s.branch='warding',
   s=>s.charLevel=20,
   s=>s.funcs[0].fv1[3]=101,
  ];
  for(const change of variants){
   const bad=structuredClone(skills);change(bad[id]);
   assert.equal(C.racialCombatSourcePreview({
    racialPassiveId:id,skillCatalog:bad
   }),null,'unsafe '+id);
  }
 }
 const altered=structuredClone(skills);
 altered['900010003'].funcs[0].fv2[3]=2;
 assert.equal(C.racialCombatSourcePreview({
  racialPassiveId:900010003,skillCatalog:altered
 }),null,'potion auxiliary channel must stay at 1');
});
test('Rapin MP recovery SPEED and Human potion modifier use official source, not historical constants',()=>{
 const opts=(id,catalog)=>({
  classData:classes.MAGE,raceData:stats,jobData:empty,
  allocation:empty,level:45,
  potionContext:{racialPassiveId:id},
  combatContext:{jobKey:'MAGE',skillCatalog:catalog}
 });
 const baseline=C.base(opts(null,skills));
 const normal=C.base(opts(900060002,skills));
 assert.equal(normal.regeneration.mp.racial,18);
 assert.equal(normal.regeneration.mp.total,baseline.regeneration.mp.total+18);
 const potion=C.base(opts(900010003,skills));
 assert.equal(potion.potion.racial,15);
 const edited=structuredClone(skills);
 edited['900060002'].funcs[0].fv1[3]=21;
 edited['900010003'].funcs[0].fv1[3]=19;
 const updMp=C.base(opts(900060002,edited)),updPot=C.base(opts(900010003,edited));
 assert.equal(updMp.regeneration.mp.racial,21);
 assert.equal(updPot.potion.racial,19);
 const corrupt=structuredClone(edited);
 corrupt['900060002'].funcs[0].fv2[3]=2;
 corrupt['900010003'].funcs[0].fv2[3]=2;
 const missMp=C.base(opts(900060002,corrupt)),missPot=C.base(opts(900010003,corrupt));
 assert.equal(missMp.regeneration.mp.racial??0,0);
 assert.equal(missPot.potion.racial,0);
 assert.equal(C.potionRecovery({vit:stats.vit,racialPassiveId:900010003}).racial,15);
});
