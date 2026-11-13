import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const locale=JSON.parse(read('data/os/strings.en.json')).skills;
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const calculator=host.PandoraOSCalculator;
const heal=(level,int,spi,benevolence,healingPercent=100,catalog=data)=>calculator.healingSpellsPreview({
 level,int,spi,benevolence,healingPercent,jobKey:'CLERIC',
 benevolenceCap:classes.CLERIC.branchCaps.benevolence,skillCatalog:catalog});
const periodic=(jobKey,level,spi,benevolence,catalog=data)=>
 calculator.periodicRecoveryPreview({jobKey,level,spi,benevolence,
  benevolenceCap:classes[jobKey].branchCaps.benevolence,skillCatalog:catalog});
const healIds=[[310001001,310001002],[310004001,310004002],
 [310021001,310021002],[310023001],[310022001]];

test('current OS healing vectors retain source ID/EN and unique TARGET operation',()=>{
 for(const pair of healIds){
  for(const id of pair){
   const source=data[String(id)];
   assert.equal(source.id,id);
   assert.equal(source.funcs.length,1);
   assert.equal(source.funcs[0].dir,'TARGET');
   assert.equal(typeof locale[String(id)]?.n,'string','English source '+id);
  }
 }
 assert.deepEqual(data['310004002'].funcs[0].fv1,[1000,300,500,50]);
 assert.deepEqual(data['310023002'].funcs[0].fv1,[200,0,200,100]);
 assert.deepEqual(data['310002001'].funcs[0].fv1,[10,10,10,10]);
 assert.deepEqual(data['310022001'].funcs[0].fv1,[20,5,5,5]);
 assert.deepEqual(data['330005001'].funcs[0].fv1,[0,10,0,0]);
});

test('Cleric level 50-54 uses OS level coefficient 300, never obsolete Remaked 200+105',()=>{
 for(let level=50;level<=54;level++){
  const out=heal(level,90,70,60,120);
  const expected=Math.floor((50+level*3+60*5+90*10)*1.20);
  const obsolete=Math.floor((105+level*2+60*5+90*10)*1.20);
  assert.equal(out.rows[1].amount,expected);
  assert.notEqual(expected,obsolete,'difference isolated at level '+level);
  assert.equal(out.rows[1].skillId,310004002);
  assert.equal(out.rows[1].available,true);
 }
 const lv55=heal(55,90,70,60,120);
 assert.equal(lv55.rows[1].amount,
  Math.floor((50+55*3+60*5+90*10)*1.20));
});

test('Sanctuary child is the healing source, not a Remaked-added hero-level bonus',()=>{
 const baseline=heal(45,50,70,60,100).rows[3];
 assert.equal(baseline.skillId,310023001);
 assert.equal(baseline.amount,100+2*60+2*50);
 for(const level of [45,46,49,50,55]){
  const row=heal(level,50,70,60,100).rows[3];
  assert.equal(row.amount,baseline.amount);
 }
 const forgery=structuredClone(data);
 forgery['310023002'].funcs[0].fv2[3]=10;
 assert.equal(heal(50,50,70,60,100,forgery).rows[3].available,false);
});

test('OS periodic FV1 restores level dependence with the Remaked two-second source model',()=>{
 const a=periodic('CLERIC',45,60,41).rows;
 assert.deepEqual(a.map(x=>[x.id,x.amount]),[[310002001,24],[310022001,21]]);
 const b=periodic('CLERIC',55,60,41).rows;
 assert.deepEqual(b.map(x=>[x.id,x.amount]),[[310002001,25],[310022001,21]]);
 const c=periodic('ASCETIC',20,60,0).rows;
 const natural=c.find(x=>x.id===330005001);
 assert.equal(natural?.amount,2);
 assert.equal(natural?.available,true);
 assert.match(calculator.periodicRecoveryPreview({
  level:55,spi:60,benevolence:41,jobKey:'CLERIC',
  benevolenceCap:classes.CLERIC.branchCaps.benevolence,skillCatalog:data}).source,
  /2-second LPsec\/MPsec model.*live timing not measured/);
});

test('source FV2 tampering invalidates specific healing/periodic skill, not whole hero',()=>{
 for(const id of [310001001,310004002,310021002,310023001,310022001]){
  const modified=structuredClone(data);
  modified[String(id)].funcs[0].fv2[3]+=5;
  const rows=heal(55,80,75,60,100,modified).rows;
  const idx=id===310001001?0:id===310004002?1:
   id===310021002?2:id===310023001?3:4;
  if(id!==310001001)assert.equal(rows[idx].available,false,String(id));
  else assert.equal(heal(45,80,75,60,100,modified).rows[0].available,false);
 }
 const altered=structuredClone(data);
 altered['330005001'].funcs[0].fv2[3]=5;
 assert.equal(periodic('ASCETIC',20,75,0,altered).rows
  .some(x=>x.id===330005001),false);
});

test('350 synthetic levels, INT, SPI, mastery and healing-percent vectors use OS coefficients',()=>{
 const before=JSON.stringify(data);
 let count=0;
 for(let i=0;i<350;i++){
  const level=1+(i*7)%55,int=(i*11)%201,spi=(i*19)%201;
  const benevolence=(i*17)%91,healingPercent=100+(i*13)%81;
  const out=heal(level,int,spi,benevolence,healingPercent);
  assert.ok(out&&out.rows.length===5);
  for(let j=0;j<3;j++){
   const id=healIds[j][level>=50?1:0];
   const vector=data[String(id)].funcs[0].fv1;
   const raw=vector[3]+int*vector[0]/100+
    level*vector[1]/100+benevolence*vector[2]/100;
   assert.equal(out.rows[j].amount,
    Math.floor(raw*healingPercent/100),'skill '+id+' scenario '+i);
   count++;
  }
  const sanctuary=data['310023002'].funcs[0].fv1;
  assert.equal(out.rows[3].amount,Math.floor((
   sanctuary[3]+int*sanctuary[0]/100+
   level*sanctuary[1]/100+benevolence*sanctuary[2]/100)*
   healingPercent/100));
  const restoration=data['310022001'].funcs[0].fv1;
  const expected=restoration[3]+Math.floor(spi*restoration[0]/100)+
   Math.floor(level*restoration[1]/100)+
   Math.floor(benevolence*restoration[2]/100);
  assert.equal(out.rows[4].amount,expected);
  for(const row of periodic('CLERIC',level,spi,benevolence).rows){
   const fv=data[String(row.id)].funcs[0].fv1;
   assert.equal(row.amount,fv[3]+Math.floor(spi*fv[0]/100)+
    Math.floor(level*fv[1]/100)+Math.floor(benevolence*fv[2]/100));
  }
 }
 assert.equal(count,1050);
 assert.equal(JSON.stringify(data),before,'read-only source catalog');
});
