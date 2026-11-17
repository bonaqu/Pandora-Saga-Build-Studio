import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
runInNewContext(read('pandora-studio-catalog-safety.js'),{window:host});
const safety=host.PandoraCatalogSafety;
const json=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={
 skills:json('skills'),items:json('items'),souls:json('souls'),
 classes:json('classes'),tables:json('tables'),maps:json('maps'),
 monsters:json('monsters')
};
const called=new Set([
 'EP_SKILL_EXEC','EP_SKILL_EXEC_BALM','EP_ONHIT_SKILL_EXEC',
 'EP_ONDAMAGE_SKILL_EXEC','EP_ONHIT_SKILL_EXEC_ATTACKER',
 'EP_ONDAMAGE_SKILL_EXEC_ATTACKER','EP_ONDAMAGE_ELEM_SKILL_EXEC',
 'EP_SKILL_EXEC_MAPIN'
]);
const links=(dataset)=>Object.entries(before[dataset]).flatMap(([id,record])=>
 (record.effects||[]).map((effect,index)=>({id,index,effect})).filter(x=>called.has(x.effect.func)));
const itemLinks=links('items'),soulLinks=links('souls');
const update=(dataset,id,index,mutate)=>{
 const now={...before,[dataset]:{...before[dataset]}};
 now[dataset][id]=structuredClone(before[dataset][id]);
 mutate(now[dataset][id].effects[index]);return now;
};

test('complete current item and Soul action inventory has valid source skill targets',()=>{
 assert.equal(itemLinks.length,68);
 assert.equal(soulLinks.length,6);
 assert.equal(itemLinks.length+soulLinks.length,74);
 assert.deepEqual(new Set([...itemLinks,...soulLinks].map(x=>x.effect.func)),called);
 for(const {effect} of [...itemLinks,...soulLinks]){
  assert.ok(Number.isSafeInteger(effect.a)&&effect.a>0);
  assert.ok(before.skills[String(effect.a)],
   'source called skill must exist, not a guessed final effect');
 }
 const unchanged=safety.sourceGraphIntegrity(before,before);
 assert.equal(unchanged.ok,true);
 assert.equal(unchanged.newBroken,0);
});

test('all eight source-confirmed item trigger families fail closed on a new invalid child ID',()=>{
 const initial=JSON.stringify(before.items);
 for(const family of called){
  const match=itemLinks.find(x=>x.effect.func===family);
  assert.ok(match,'expected in the current item source: '+family);
  const candidate=update('items',match.id,match.index,effect=>{
   effect.a=999999991;
  });
  const graph=safety.sourceGraphIntegrity(before,candidate);
  assert.equal(graph.ok,false,'broken skill trigger in '+family);
  assert.ok(graph.newBroken>0);
  assert.ok(graph.samples.some(row=>row.kind==='item'&&row.owner===match.id&&
   row.field===family&&row.target==='999999991'),family);
 }
 assert.equal(JSON.stringify(before.items),initial,'read-only source inventory');
});

test('all six actual on-hit Souls reject missing skills, without changing their D1 definition',()=>{
 const saved=JSON.stringify(before.souls);
 assert.equal(soulLinks.every(x=>x.effect.func==='EP_ONHIT_SKILL_EXEC'),true);
 for(const {id,index} of soulLinks){
  const candidate=update('souls',id,index,effect=>{effect.a=999999992});
  const graph=safety.sourceGraphIntegrity(before,candidate);
  assert.equal(graph.ok,false,'Soul '+id+' must not lose its child action');
  assert.ok(graph.samples.some(row=>row.kind==='soul'&&row.owner===id&&
   row.field==='EP_ONHIT_SKILL_EXEC'&&row.target==='999999992'));
 }
 assert.equal(JSON.stringify(before.souls),saved);
});

test('source b coefficient is not treated as a skill ID or fabricated proc chance',()=>{
 const soul=soulLinks[0];
 const next=update('souls',soul.id,soul.index,effect=>{effect.b=777});
 const old=JSON.stringify(next);
 const result=safety.sourceGraphIntegrity(before,next);
 assert.equal(result.ok,true,'b is a coefficient, never a skill pointer');
 assert.equal(result.newBroken,0);
 assert.equal(JSON.stringify(next),old);
 const item=itemLinks.find(x=>x.effect.func==='EP_ONHIT_SKILL_EXEC');
 const itemNext=update('items',item.id,item.index,effect=>{effect.b=99999});
 assert.equal(safety.sourceGraphIntegrity(before,itemNext).ok,true);
});

test('deleting a called child skill is also blocked without making up target mechanics',()=>{
 const soul=soulLinks[0],child=soul.effect.a;
 const after={...before,skills:{...before.skills}};
 delete after.skills[String(child)];
 const graph=safety.sourceGraphIntegrity(before,after);
 assert.equal(graph.ok,false);
 assert.ok(graph.samples.some(row=>row.kind==='soul'&&row.owner===soul.id&&
  row.field===soul.effect.func&&row.target===String(child)));
});

test('new unrecognized EP stays a semantic review, not an invented skill link',()=>{
 const soul=soulLinks[0];
 const candidate=update('souls',soul.id,soul.index,effect=>{
  effect.func='EP_FUTURE_UNKNOWN_ACTION';
  effect.a=999999993;
 });
 const graph=safety.sourceGraphIntegrity(before,candidate);
 assert.equal(graph.ok,true);
 const semantic=safety.compatibility(before,candidate);
 assert.equal(semantic.totals.needsReview,1);
 assert.equal(semantic.totals.verified,0);
});
