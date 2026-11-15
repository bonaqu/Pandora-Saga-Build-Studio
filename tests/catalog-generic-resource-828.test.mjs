import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};
for(const script of [
 'pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js',
 'pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js',
 'pandora-studio-wiki-skill-insights.js'
])vm.runInNewContext(read(script),{window:host});
const calc=host.PandoraOSCalculator,check=host.PandoraCatalogSafety;
const data=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:data('skills'),items:data('items'),
 classes:data('classes'),tables:data('tables')};
const supported=new Set(['EP_CONSUME_ITEM','EP_CONSUME_AMMO']);
const sourceEffects=Object.entries(before.skills).flatMap(([id,r])=>
 (r.funcs||[]).map((effect,index)=>({id,index,effect}))
 .filter(x=>supported.has(x.effect.ep)));
const sources=new Map();
for(const {id,index} of sourceEffects){
 const list=sources.get(id)||[];list.push(index);sources.set(id,list);
}
const altered=(id,fn)=>{
 const candidate={...before,skills:{...before.skills}};
 candidate.skills[id]=structuredClone(before.skills[id]);
 fn(candidate.skills[id]);return candidate;
};
const row=(skill,ep)=>skill.funcs.find(x=>x.ep===ep);
const status=after=>check.compatibility(before,after);
const inspect=(skillCatalog,id)=>host.PandoraWikiSkillInsights.inspect({
 skillCatalog,classes:before.classes,id,calculator:calc
});

test('current real game source exposes 39 material and 8 ammunition counts on 43 unique skills',()=>{
 assert.equal(sourceEffects.length,47);
 assert.equal(sources.size,43);
 assert.equal(sourceEffects.filter(x=>x.effect.ep==='EP_CONSUME_ITEM').length,39);
 assert.equal(sourceEffects.filter(x=>x.effect.ep==='EP_CONSUME_AMMO').length,8);
 for(const {id,effect} of sourceEffects){
  assert.equal(Object.keys(effect).sort().join(','),'dir,ep,fv1,fv2',id);
  assert.deepEqual(effect.fv1.slice(0,3),[0,0,0]);
  assert.deepEqual(effect.fv2.slice(0,3),[0,0,0]);
  assert.ok(Number.isSafeInteger(effect.fv2[3])&&effect.fv2[3]>0);
  if(effect.ep==='EP_CONSUME_ITEM'){
   assert.ok(before.items[String(effect.fv1[3])],id+' item identity');
   assert.ok(['CASTER','TARGET'].includes(effect.dir));
  }else {
   assert.equal(effect.fv1[3],0);
   assert.equal(effect.dir,'CASTER');
  }
 }
});

test('the full 43-root resource batch remains source-valid without hardcoded skill IDs',()=>{
 const oldJson=JSON.stringify(before);
 const after={...before,skills:{...before.skills}};
 for(const [id,indices] of sources){
  const skill=structuredClone(before.skills[id]);
  for(const index of indices)skill.funcs[index].fv2[3]+=2;
  after.skills[id]=skill;
 }
 const newJson=JSON.stringify(after);
 const report=status(after);
 assert.equal(report.entries.filter(x=>x.key.startsWith('skill:')).length,43);
 assert.equal(report.totals.needsReview,0,
  'amount-only updates cannot be incorrectly treated as unknown EP changes');
 assert.equal(report.totals.sourceOnly+report.totals.verified,43);
 assert.ok(report.totals.sourceOnly>0,'unmodeled source counts remain source-only');
 assert.ok(report.totals.verified>0,'existing full inspector proofs keep verified priority');
 const graph=check.sourceGraphIntegrity(before,after);
 assert.equal(graph.ok,true);
 assert.equal(graph.newBroken,0);
 assert.equal(JSON.stringify(before),oldJson);
 assert.equal(JSON.stringify(after),newJson);
});

test('an unmodeled archery ammunition count updates encyclopedia source facts, not final damage',()=>{
 const id='213601001';
 const old=inspect(before.skills,id);
 const after=altered(id,s=>{row(s,'EP_CONSUME_AMMO').fv2[3]=7;});
 const next=inspect(after.skills,id);
 assert.ok(before.skills[id].learnable);
 assert.equal(status(after).totals.sourceOnly,1);
 assert.equal(status(after).totals.needsReview,0);
 assert.ok(old.extra.some(x=>x.type==='sourceAmmo'&&x.count===1));
 assert.ok(next.extra.some(x=>x.type==='sourceAmmo'&&x.count===7&&x.sourceOnly));
 assert.equal(next.finalAmount,null);
 assert.equal(check.sourceGraphIntegrity(before,after).ok,true);
});

test('unmodeled multi-material skill updates every TARGET-source amount independently',()=>{
 const id='220004001',old=before.skills[id];
 assert.equal(old.funcs.filter(x=>x.ep==='EP_CONSUME_ITEM').length,3);
 const after=altered(id,s=>{
  const resources=s.funcs.filter(x=>x.ep==='EP_CONSUME_ITEM');
  resources[0].fv2[3]=2;resources[1].fv2[3]=4;resources[2].fv2[3]=5;
 });
 assert.equal(status(after).totals.needsReview,0);
 const wiki=inspect(after.skills,id);
 assert.ok(wiki?.extra?.length);
 const explicit=wiki.extra.filter(x=>x.type==='sourceMaterial');
 const recipe=wiki.extra.find(x=>x.type==='recipe');
 if(recipe){
  assert.ok(recipe.uses.length>=3);
  for(const id of [50025,50024,65011])
   assert.ok(recipe.uses.some(x=>x.id===id),'modeled materials remain a recipe');
 }else {
  assert.equal(explicit.length,3);
  assert.deepEqual(explicit.map(x=>x.count),[2,4,5]);
 }
 assert.equal(wiki.finalAmount,null,'source-only knowledge is not a combat result');
});

test('unmodeled guild/special sources stay classified, without inventing playable skills',()=>{
 const id='600000201',after=altered(id,s=>{row(s,'EP_CONSUME_ITEM').fv2[3]+=1;});
 assert.equal(before.skills[id].learnable,false);
 assert.equal(status(after).totals.sourceOnly,1);
 assert.equal(check.sourceGraphIntegrity(before,after).ok,true);
 assert.equal(inspect(after.skills,id),null,
  'nonlearnable game-source entries must not become player-accessible skills');
});

test('unknown direction, item ID, reserved vector, EP and cooldown remain unverified',()=>{
 const id='213601001';
 for(const change of [
  s=>{row(s,'EP_CONSUME_AMMO').fv2[3]=0;},
  s=>{row(s,'EP_CONSUME_AMMO').fv2[3]=-2;},
  s=>{row(s,'EP_CONSUME_AMMO').fv2[3]=1.2;},
  s=>{row(s,'EP_CONSUME_AMMO').fv2[2]=1;},
  s=>{row(s,'EP_CONSUME_AMMO').fv1[3]=111;},
  s=>{row(s,'EP_CONSUME_AMMO').dir='TARGET';},
  s=>{row(s,'EP_CONSUME_AMMO').ep='EP_UNKNOWN_AMMO';},
  s=>{row(s,'EP_CONSUME_AMMO').additionalEffect=100;},
  s=>{row(s,'EP_CONSUME_AMMO').fv2[3]+=1;s.cooldown+=1;},
  s=>{row(s,'EP_CONSUME_AMMO').fv2[3]+=1;s.funcs.push({
   ep:'EP_UNKNOWN',dir:'CASTER',fv1:[0,0,0,0],fv2:[0,0,0,0]});}
 ]){
  const after=altered(id,change);
  assert.equal(status(after).totals.needsReview,1);
  assert.equal(status(after).totals.verified,0);
 }
 for(const change of [
  s=>{row(s,'EP_CONSUME_ITEM').fv2[3]=-1;},
  s=>{row(s,'EP_CONSUME_ITEM').fv1[3]=999999991;},
  s=>{row(s,'EP_CONSUME_ITEM').fv1[0]=1;},
  s=>{row(s,'EP_CONSUME_ITEM').dir='SELF';},
  s=>{row(s,'EP_CONSUME_ITEM').newFlag=true;},
  s=>{row(s,'EP_CONSUME_ITEM').fv2[3]+=1;s.mana+=1;}
 ]){
  const after=altered('220004001',change);
  assert.equal(status(after).totals.needsReview,1);
 }
});

test('known numeric/source guards never lose priority to generic source-only classification',()=>{
 const id='310003001';
 const after=altered(id,s=>{row(s,'EP_CONSUME_ITEM').fv2[3]=9;});
 assert.equal(status(after).totals.verified,1);
 assert.equal(status(after).totals.sourceOnly,0);
 const replay=check.replaySkills(before,after);
 assert.equal(replay.ok,true);
 assert.equal(replay.lost,0);
 const trap=altered('240005001',s=>{row(s,'EP_CONSUME_ITEM').fv2[3]=7;});
 assert.equal(status(trap).totals.verified,1);
 assert.equal(check.replaySkills(before,trap).ok,true);
});

test('a changed item identity cannot reuse the source-only quantity contract',()=>{
 const id='220004001';
 const after=altered(id,s=>{row(s,'EP_CONSUME_ITEM').fv2[3]=10;});
 const changed={...after,items:{...before.items}};
 delete changed.items['50025'];
 assert.equal(status(changed).totals.needsReview>=1,true);
 assert.equal(check.sourceGraphIntegrity(before,changed).ok,false);
});

test('both source-only amount types have readable Russian and English wiki labels',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/extra\.type==='sourceAmmo'/);
 assert.match(app,/extra\.type==='sourceMaterial'/);
 assert.match(app,/Боеприпасы в игровых данных/);
 assert.match(app,/Материал в игровых данных/);
 assert.match(app,/Ammunition in game data/);
 assert.match(app,/Material in game data/);
 assert.match(read('pandora-studio-wiki-skill-insights.js'),
  /type:'sourceAmmo'/);
 assert.match(read('pandora-studio-catalog-safety.js'),
  /sourceOnlyResourceQuantityChange/);
});
