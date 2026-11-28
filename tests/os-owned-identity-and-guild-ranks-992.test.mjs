import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const forth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));

test('numeric item and Soul identities must be owned, not inherited',()=>{
 for(const [kind,id,record] of [['item',1862,items['1862']],
  ['soul',104002,souls['104002']]]){
  assert.ok(C.sourceEffects(kind+':'+id,record,0,forth).length);
  const fake=Object.assign(Object.create({id}),{
   effects:[{func:'EP_STRENGTH_CONST',a:200}]});
  assert.deepEqual(C.sourceEffects(kind+':'+id,fake,0,forth),[]);
  assert.equal(C.gatherEffects([[kind+':'+id,fake,0]],forth).flat.str,0);
  assert.deepEqual(C.sourceEffects(kind+':'+id,{...fake,id:id+1},0,forth),[]);
 }
});

test('inherited base armor or identity cannot inflate the Hero Book',()=>{
 const fake=Object.assign(Object.create({id:12081,AC:700}),{
  slot:'body',name:'Forged armor',effects:[]});
 assert.equal(C.defensePreview({records:[['item:12081',fake,0]]}).known,0);
 const inheritedAc=Object.assign(Object.create({AC:700}),{
  id:12081,slot:'body',name:'Forged armor',effects:[]});
 assert.equal(C.defensePreview({records:[['item:12081',inheritedAc,0]]}).known,0);
 const actual=items['12081'];
 assert.ok(Number.isFinite(actual.AC)&&actual.AC>0);
 assert.equal(C.defensePreview({records:[['item:12081',actual,0]]}).armor,actual.AC);
});

test('a set must own both its root identity and canonical equipped items',()=>{
 const members=[['item:14094',items['14094'],0],
  ['item:17034',items['17034'],0]];
 const real=C.unisonPreview({records:members,catalog:unison});
 assert.equal(real.active.find(row=>row.id===14094)?.companionCount,1);
 const disguised=Object.assign(Object.create({id:14094}),{
  members:unison['14094'].members,rows:unison['14094'].rows});
 assert.equal(C.unisonPreview({records:members,
  catalog:{14094:disguised}}).supplemental.length,0);
 const badItem=Object.assign(Object.create({id:17034}),{
  name:'Invented companion',slot:'cloak',effects:[]});
 const fakeMembers=[members[0],['item:17034',badItem,0]];
 assert.equal(C.unisonPreview({records:fakeMembers,
  catalog:unison}).supplemental.length,0);
});

test('guild enhancement ranks require explicit integer numbers',()=>{
 const effects={health:{hp:0,mp:0},percent:{hp:[],mp:[]}};
 for(const rank of [true,false,'2',[2],{value:2},NaN,2.5])
  assert.equal(C.bonusFor('hp',1000,effects,{guildHp:rank}),null,
   'false rank '+String(rank));
 for(let rank=0;rank<=6;rank++)
  assert.equal(C.bonusFor('hp',1000,effects,{guildHp:rank}).guildRate,
   C.guildRates[rank]);
 for(const rank of [true,false,'5',[5],{},NaN])
  assert.equal(C.attributeBuffBonus({guildAll:rank}),null,
   'false all-attribute rank '+String(rank));
 for(let rank=0;rank<=5;rank++)
  assert.equal(C.attributeBuffBonus({guildAll:rank}).flat.str,rank);
});

test('a malformed guild level cannot create character EXP rewards',()=>{
 const base={classData:classes.WARRIOR,raceData:tables.raceInit.ELF,
  jobData:tables.jobInit.WARRIOR,level:1,records:[],
  allocation:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},
  combatContext:{jobKey:'WARRIOR',skillCatalog:{}}};
 const exp=attrs=>C.base({...base,attributeBuffs:attrs}).experienceBonus.entries;
 assert.deepEqual(exp({guildLevel:'6'}),exp({guildLevel:0}));
 assert.deepEqual(exp({guildLevel:true}),exp({guildLevel:0}));
 assert.ok(exp({guildLevel:6}).some(e=>e.percent===4));
 for(const key of ['guildExperience','guildMagicReduction','guildPhysicalReduction']){
  const broken={[key]:[3]};
  assert.deepEqual(exp(broken),exp({guildLevel:0}));
 }
});

test('all 1255 canonical item/Soul records remain usable at +0..+10',()=>{
 let checked=0;
 for(const [kind,catalog] of [['item',items],['soul',souls]])
  for(const [id,rec] of Object.entries(catalog)){
   assert.equal(rec.id,Number(id));
   for(let grade=0;grade<=10;grade++){
    assert.ok(Array.isArray(C.sourceEffects(kind+':'+id,rec,grade,forth)));
    checked++;
   }
  }
 assert.equal(checked,13805);
});
