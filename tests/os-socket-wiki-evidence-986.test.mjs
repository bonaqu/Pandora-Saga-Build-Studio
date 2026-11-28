import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-studio-equipment-plan.js'))(env);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(env);
const P=env.PandoraEquipmentPlan,W=env.PandoraWikiSkillInsights;
const items=JSON.parse(read('data/os/items.json'));
const skills=JSON.parse(read('data/os/skills.json'));

test('a Soul socket count requires an explicit source number, not JS coercion',()=>{
 for(const bad of ['2','0','32',true,false,[],[1],[2],{},NaN,Infinity,-1,1.5,33]){
  const item={id:13041,slot:'legs',soulslot:bad};
  assert.equal(P.socketCapacity(item),null,
   'corrupt slot count '+String(bad));
  assert.equal(P.canSocket('legs',item),false);
 }
 for(const count of [0,1,2,3,32]){
  const record={slot:'legs',soulslot:count};
  assert.equal(P.socketCapacity(record),count);
 }
 assert.equal(P.socketCapacity({slot:'ear',soulslot:3}),0,
  'unsupported jewelry must never gain Soul sockets');
 assert.equal(P.socketCapacity({slot:'legs',soulslot:null}),null);
 assert.equal(P.socketCapacity({slot:'legs'}),null);
});

test('Soul slot eligibility requires item slot identity and preserves manual override',()=>{
 const leggings={id:13041,slot:'legs',soulslot:1};
 const belt={id:21001,slot:'belt',soulslot:0};
 assert.equal(P.canSocket('belt',leggings),false);
 assert.equal(P.canSocket('legs',belt,2),false);
 assert.equal(P.canSocket('legs',leggings,2),true);
 assert.equal(P.canSocket('belt',belt,1),true);
 assert.equal(P.canSocket('belt',belt,0),false);
 assert.equal(P.canSocket('ear',{slot:'ear',soulslot:3},3),false);
 const hero={socketCapacities:{'5:13041':2,'11:21001':1}};
 assert.equal(P.equippedSocketCapacity(hero,5,{id:13041},leggings),2);
 assert.equal(P.equippedSocketCapacity(hero,11,{id:21001},belt),1);
 assert.equal(P.equippedSocketCapacity(hero,5,{id:13042},leggings),1);
});

test('Soul report does not imply known capacity from a corrupted cached value',()=>{
 const souls=[{id:101},null,{id:102}];
 for(const invalid of ['2',true,false,undefined,null,[],{},-1,33,1.5]){
  const result=P.socketReport(souls,invalid);
  assert.equal(result.unknown,true);
  assert.equal(result.capacity,null);
  assert.equal(result.count,2);
  assert.equal(result.excess,2);
  assert.equal(result.all.length,3,'no saved Soul position disappears');
 }
 const valid=P.socketReport(souls,2);
 assert.equal(valid.unknown,false);
 assert.equal(valid.capacity,2);
 assert.equal(valid.excess,1);
 assert.equal(valid.count,2);
 assert.equal(P.socketReport(souls,3).excess,0);
});

test('all 1140 source item capacities remain intact, including non-socketable slots',()=>{
 assert.equal(Object.keys(items).length,1140);
 let count=0;
 for(const [id,record] of Object.entries(items)){
  assert.equal(String(record.id),id);
  assert.ok(Number.isSafeInteger(record.soulslot)&&record.soulslot>=0&&
   record.soulslot<=3);
  const expected=record.slot&&!P.supportsSoulSlot(record.slot)?
   0:record.soulslot;
  assert.equal(P.socketCapacity(record),expected,'item '+id);
  count++;
 }
 assert.equal(count,1140);
});

test('all ten current source-pinned Wiki patch notes are preserved',()=>{
 const ids=Object.values(skills).filter(skill=>
  W.officialPatchNotes(skill,skills).length).map(skill=>skill.id).sort((a,b)=>a-b);
 assert.deepEqual(ids,[
  320006001,320006002,340001001,340003001,340004001,
  420004002,420005002,420007101,440009001,440011001
 ]);
 for(const id of ids){
  const [note]=W.officialPatchNotes(skills[id],skills);
  assert.equal(note.editorialKey,'osPatch'+id);
  assert.ok(note.ru&&note.en);
 }
});

test('Wiki linked notes fail closed on forged or missing child skill identities',()=>{
 const storm=skills['440009001'],plague=skills['440011001'];
 assert.equal(W.officialPatchNotes(storm,skills).length,1);
 assert.equal(W.officialPatchNotes(plague,skills).length,1);
 const fakeStorm={...skills,'440009002':{
  id:9,learnable:false,funcs:[{ep:'EP_DESTINED_KNOCKBACK'}]}};
 const fakePlague={...skills,'440011002':{
  id:440011002,learnable:false,funcs:[{ep:'EP_CAUSE_EVIL'}]}};
 assert.deepEqual(W.officialPatchNotes(storm,fakeStorm),[]);
 assert.deepEqual(W.officialPatchNotes(plague,fakePlague),[]);
 assert.deepEqual(W.officialPatchNotes(plague,{
  ...skills,'440011002':undefined
 }),[]);
});

test('Wiki comparisons do not advertise stale parent cast or cooldown times',()=>{
 const cases=[
  [420004002,420004001,{cast:4}],
  [420005002,420005001,{cast:4}],
  [420005002,420005001,{cooldown:11}],
  [420007101,420007001,{cast:6}]
 ];
 for(const [id,parentId,update] of cases){
  assert.equal(W.officialPatchNotes(skills[id],skills).length,1);
  const altered={...skills,[String(parentId)]:{
   ...skills[String(parentId)],...update}};
  assert.deepEqual(W.officialPatchNotes(skills[id],altered),[],
   'current skill '+id+' compared to changed '+parentId);
 }
});

test('invalid Wiki skill effect lists do not throw or create patch notes',()=>{
 const root={...skills['320006001'],funcs:'invalid'};
 assert.deepEqual(W.officialPatchNotes(root,skills),[]);
 assert.equal(W.inspect({skillCatalog:{...skills,'320006001':root},
  classes:{},id:320006001,calculator:{}}),null);
 const storm={...skills['440009001'],funcs:[null]};
 assert.doesNotThrow(()=>W.officialPatchNotes(storm,skills));
 assert.deepEqual(W.officialPatchNotes(storm,skills),[]);
 const nested={'440009001':{...skills['440009001'],classes:{}},
  '440009002':{...skills['440009002'],funcs:'broken'}};
 assert.doesNotThrow(()=>W.inspect({skillCatalog:nested,classes:{},
  id:440009001,calculator:{}}));
});
