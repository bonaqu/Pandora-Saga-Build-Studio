import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
for(const file of ['pandora-studio-target-damage.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(file),{window:host});
const S=host.PandoraCatalogSafety,T=host.PandoraOSTargetDamage;
const load=name=>JSON.parse(read('data/os/'+name+'.json'));
const current={monsters:load('monsters'),classes:load('classes'),
 skills:load('skills'),tables:load('tables'),items:load('items'),
 itemForth:load('itemForth'),unison:load('unison'),souls:load('souls')};
const updatedMonsters=change=>{
 const monsters=structuredClone(current.monsters);
 change(monsters);
 return {...current,monsters};
};
const trap=snapshot=>T.crawlingTrap({
 skillCatalog:snapshot.skills,classes:snapshot.classes,
 monsters:snapshot.monsters,tables:snapshot.tables,
 itemForth:snapshot.itemForth,unison:snapshot.unison,
 jobKey:'DISTURBANCE',level:45,targetMonsterId:22104,
 masteries:{trap:41},branchCaps:snapshot.classes.DISTURBANCE.branchCaps,
 stats:{dex:70,int:20},equipment:[],
 modifiers:{combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}}
});
test('unchanged current D1-backed monster snapshot has no fabricated target regression',()=>{
 assert.equal(Object.keys(current.monsters).length,load('meta').counts.monsters);
 assert.ok(Object.keys(current.monsters).length>=707,
  'Previously reviewed monster records must not silently disappear');
 const report=S.replayMonsterTargets(current,current);
 assert.equal(report.ok,true);
 assert.equal(report.changedMonsters,0);
 assert.equal(report.scenarios,0);
 assert.equal(report.lost,0);
});
test('valid server HP/resistance updates keep the calculated target and use NEW numbers',()=>{
 const before=JSON.stringify(current);
 const after=updatedMonsters(monsters=>{
  monsters['22104'].life*=2;
  monsters['22104'].resists.fire=-25;
 });
 const report=S.replayMonsterTargets(current,after);
 assert.equal(report.ok,true,JSON.stringify(report));
 assert.equal(report.changedMonsters,1);
 assert.equal(report.inspected,1);
 assert.ok(report.scenarios>0);
 assert.equal(report.lost,0);
 assert.equal(trap(after)?.targetMaxLife,trap(current).targetMaxLife*2);
 assert.equal(trap(after)?.targetElementResistance,-25);
 assert.equal(JSON.stringify(current),before,'preflight must be read-only');
});
test('admin status signs validated target numbers, not arbitrary monster changes',()=>{
 const numbers=updatedMonsters(monsters=>{monsters['22104'].life++});
 const signed=S.compatibility(current,numbers);
 assert.equal(signed.totals.verified,1);
 assert.equal(signed.entries[0].contract,'monster.target-source-parameters');
 assert.equal(signed.entries[0].key,'monsters:22104');
 assert.ok(S.sourceContractRegistry.some(x=>x.id===signed.entries[0].contract));
 const textual=updatedMonsters(monsters=>{monsters['22104'].name+=' •'});
 const sourceOnly=S.compatibility(current,textual);
 assert.equal(sourceOnly.totals.sourceOnly,1);
 assert.equal(sourceOnly.totals.verified,0);
 const unsupported=updatedMonsters(monsters=>{monsters['22104'].warding++});
 assert.equal(S.compatibility(current,unsupported).totals.needsReview,1,
  'warding must not be certified as covered by target hit model');
 const extraResistance=updatedMonsters(monsters=>{
  monsters['22104'].resists.futureUnmodeled=30;
  monsters['22104'].resists.fire=-5;
 });
 const future=S.compatibility(current,extraResistance);
 assert.equal(future.totals.verified,0);
 assert.equal(future.totals.needsReview,1,
  'unknown resistance key must not borrow proof from modeled fire resistance');
 const invalid=updatedMonsters(monsters=>{monsters['22104'].life=0});
 assert.equal(S.compatibility(current,invalid).totals.needsReview,1);
});
test('corrupt current target HP or resistance cannot make a Book target disappear',()=>{
 for(const mutate of [
  m=>{m.life=0;},m=>{m.life='6126';},
  m=>{delete m.resists.fire;},m=>{m.resists.magic='17';}
 ]){
  const after=updatedMonsters(monsters=>mutate(monsters['22104']));
  const report=S.replayMonsterTargets(current,after);
  assert.equal(report.ok,false,JSON.stringify(report));
  assert.ok(report.lostEntries.some(x=>x.id==='22104'&&
   x.module==='target-source-shape'));
 }
});
test('a new malformed monster is rejected instead of being silently absent from target picker',()=>{
 const after=updatedMonsters(monsters=>{
  monsters['999991']={...structuredClone(monsters['22104']),id:999991,
   name:'Test target',resists:{...monsters['22104'].resists,fire:'unknown'}};
 });
 const report=S.replayMonsterTargets(current,after);
 assert.equal(report.ok,false);
 assert.ok(report.lostEntries.some(x=>x.id==='999991'&&
  x.module==='target-source-shape'));
});
test('every prior target is tested against changed level-gap table, not just changed monsters',()=>{
 const after={...current,tables:structuredClone(current.tables)};
 const row=after.tables.lvModify.find(x=>x.diff===8);
 assert.ok(row,'current signed game gap +8 exists');
 row.magicDef='invalid';
 const report=S.replayMonsterTargets(current,after);
 assert.equal(report.ok,false,JSON.stringify(report));
 assert.equal(report.changedMonsters,0);
 assert.equal(report.gapChanged,true);
 assert.ok(report.lostEntries.some(x=>x.id==='22104'&&
  x.module==='target-level-gap'));
 assert.ok(report.scenarios>100);
});
test('intentionally removed target is handled as a selected catalog removal, not corrupted retained data',()=>{
 const after=updatedMonsters(monsters=>delete monsters['22104']);
 const report=S.replayMonsterTargets(current,after);
 assert.equal(report.ok,true,JSON.stringify(report));
 assert.equal(report.lost,0);
});
test('missing target calculation engine fails closed for changed monster data',()=>{
 const plain={};vm.runInNewContext(read('pandora-studio-catalog-safety.js'),{window:plain});
 const after=updatedMonsters(monsters=>{monsters['22104'].life++});
 const report=plain.PandoraCatalogSafety.replayMonsterTargets(current,after);
 assert.equal(report.ok,false);
 assert.match(report.errors.join(' '),/модель расчёта/);
});
test('admin preview and final CAS publication independently replay targets before D1',()=>{
 const workbench=read('pandora-os-catalog-workbench.js'),
  html=read('index.html');
 assert.match(workbench,/safety\.replayMonsterTargets\(baseline,selected\)/);
 assert.match(workbench,/safety\.replayMonsterTargets\(baseline,combined\)/);
 assert.match(workbench,/if\(targets&&!targets\.ok\)throw Error/);
 assert.ok(html.indexOf('pandora-studio-target-damage.js')<
  html.indexOf('pandora-studio-catalog-safety.js'));
});
