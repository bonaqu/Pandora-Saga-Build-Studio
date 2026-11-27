import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json')),classes=JSON.parse(read('data/os/classes.json')),host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={str:70,dex:50,vit:50,agi:60,spi:80,int:45};
const combat={attack:{walkingBase:160},defense:{directRaw:80},accuracy:{base:100},dodge:{base:130}};
const cases=[
 {id:100058001,job:'JUGGERNAUT',group:'offense',rate:'EP_DAMAGERATE_SCALE',baseline:87,changed:90},
 {id:100057001,job:'WARRIOR',group:'defense',rate:'EP_DAMAGERATE_SCALE',baseline:-80,changed:-72}
];
const inspect=(c,source=skills,options={})=>{
 const result=C.scalingSkillPreview({skillCatalog:source,jobKey:c.job,level:45,
  stats,combat,hasShield:true,branchMasteries:{slash:40,brush:40,defense:40},
  branchCaps:classes[c.job].branchCaps,...options});
 return result[c.group].find(x=>x.id===c.id);
};
const change=(c,index,modify)=>{
 const draft=structuredClone(skills);
 const effect=draft[c.id].funcs[index];
 assert.ok(effect);
 modify(effect,draft[c.id]);
 return draft;
};
test('two full current OS roots preserve inherited Remaked arithmetic as unverified, source-gated models',()=>{
 const snapshot=JSON.stringify(skills),before=JSON.stringify(combat);
 for(const c of cases){
  const row=inspect(c);
  assert.ok(row,'current source '+c.id);
  assert.equal(row.amount,c.baseline);
  assert.equal(row.modelOnly,true);
  assert.equal(row.uncertain,true);
  assert.match(row.detailRu,/модел/i);
  assert.match(row.detailEn,/model/i);
 }
 assert.equal(JSON.stringify(combat),before);
 assert.equal(JSON.stringify(skills),snapshot);
});
test('Despair both favorable and adverse OS FV1 changes independently without gameplay activation',()=>{
 const despair=cases[0];
 const flat=inspect(despair,change(despair,0,fx=>{fx.fv1[3]+=2}));
 assert.equal(flat?.amount,despair.changed);
 const mastery=inspect(despair,change(despair,0,fx=>{fx.fv1[2]=40}));
 assert.equal(mastery?.amount,90);
 const incoming=inspect(despair,change(despair,1,fx=>{fx.fv1[3]=120}));
 assert.equal(incoming?.amount,despair.baseline);
 assert.match(incoming.detailRu,/120%/);
 assert.equal(incoming.modelOnly,true);
});
test('Painlessness negative attack-rate parameter follows source, protective states must remain exact',()=>{
 const painless=cases[1];
 const next=inspect(painless,change(painless,2,fx=>{fx.fv1[3]=-45}));
 assert.equal(next?.amount,-72);
 assert.match(next.detailEn,/45%/);
 for(const id of [0,1,3,4]){
  const modified=change(painless,id,fx=>{fx.fv1[3]+=1});
  assert.equal(inspect(painless,modified),undefined,'unverified side-state '+id);
 }
});
test('both multi-effect roots fail closed on changed targets, unknown FV lanes, new EP, missing loss',()=>{
 let rejected=0;
 for(const c of cases){
  const fxCount=skills[c.id].funcs.length;
  for(let i=0;i<fxCount;i++){
   for(const mutate of [
    fx=>{fx.dir='CASTER'},fx=>{fx.fv2[0]=1},
    fx=>{fx.ep='EP_UNKNOWN_NEW'}
   ]){
    assert.equal(inspect(c,change(c,i,mutate)),undefined,c.id+' effect '+i);
    rejected++;
   }
  }
  const expanded=structuredClone(skills);
  expanded[c.id].funcs.push({ep:'EP_EXTRA',dir:'TARGET',
   fv1:[0,0,0,1],fv2:[0,0,0,0]});
  assert.equal(inspect(c,expanded),undefined,'must validate exact full action set');
  rejected++;
  const wrongSign=change(c,c.id===100058001?1:2,fx=>{fx.fv1[3]*=-1});
  assert.equal(inspect(c,wrongSign),undefined);
  rejected++;
 }
 assert.equal(rejected,28);
});
test('all 28 jobs x level 1/35/45/55 retain availability gates while refusing unsupported self sources',()=>{
 let checks=0;
 for(const [job,entry] of Object.entries(classes))for(const level of [1,35,45,55]){
  const output=C.scalingSkillPreview({skillCatalog:skills,jobKey:job,level,
   stats,combat,hasShield:true,branchCaps:entry.branchCaps,
   branchMasteries:{slash:40,brush:40,defense:40}});
  for(const c of cases){
   const row=output[c.group].find(x=>x.id===c.id);
   if(row){
    assert.ok(skills[c.id].classes?.[job],'must not leak across unavailable classes');
    assert.equal(row.modelOnly,true);
    assert.ok(Number.isSafeInteger(row.amount));
    if(level<skills[c.id].charLevel)assert.equal(row.available,false);
   }
  }
  checks++;
 }
 assert.equal(checks,112);
});
test('Book RU/EN dynamic notes have no frozen Despair/Swift/Lightness/Iron Scale numerical strings',()=>{
 const book=read('pandora-studio-hero-book.js');
 const start=book.indexOf(' const readableBuffEffects=');
 const end=book.indexOf(' const selfModelRows=',start);
 assert.ok(start>0&&end>start);
 const captions=book.slice(start,end);
 assert.doesNotMatch(captions,/входящ.*на 100% больше урона/);
 assert.doesNotMatch(captions,/Crossbow attack speed \+30%/);
 assert.doesNotMatch(captions,/Movement speed \+30%/);
 assert.doesNotMatch(captions,/Evasion −50%/);
 assert.match(book,/id===100058001\|\|id===168052001/);
 assert.match(book,/id===213702001\|\|id===260002001/);
 assert.match(book,/choice\?\.counted/);
 assert.match(book,/modelOnly===true&&row\.available/);
});
