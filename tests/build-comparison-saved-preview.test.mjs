import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const start=app.indexOf('function prepareSavedBuildSnapshot(raw){');
const end=app.indexOf('function openSavedBuild(b){',start);
assert.ok(start>=0&&end>start,'Shared saved-build preparation function exists');
const defaults=()=>({
 race:null,job:null,level:1,masteryFormat:2,masteryAuto:true,
 points:{slash:0},mastery:{},stats:{Выносливость:0},
 equipment:{},souls:{},soulOwners:{},socketCapacities:{},
 refinements:{},gems:{},vitalsBuffs:{guildHp:0},
 attributeBuffs:{priestEnabled:true,priestSpi:134},profile:{guild:''}
});
const prepare=Function('fresh',app.slice(start,end)+
 '\nreturn prepareSavedBuildSnapshot;')(defaults);

test('sparse saved builds inherit the same nested defaults when opened or compared',()=>{
 const legacy={race:1,job:16,level:40,
  points:{slash:12},stats:{Выносливость:20},
  attributeBuffs:{guildAll:3}};
 const before=JSON.stringify(legacy),ready=prepare(legacy);
 assert.equal(ready.level,40);
 assert.equal(ready.points.slash,12);
 assert.equal(ready.stats.Выносливость,20);
 assert.equal(ready.attributeBuffs.guildAll,3);
 assert.equal(ready.attributeBuffs.priestSpi,134);
 assert.equal(ready.masteryAuto,true);
 assert.deepEqual(ready.refinements,{});
 ready.points.slash=0;
 assert.equal(legacy.points.slash,12);
 assert.equal(JSON.stringify(legacy),before);
});
test('malformed builds fail before opening/calculating without editing their payload',()=>{
 for(const value of [null,[],7,'',true])assert.throws(()=>prepare(value));
 const damaged={points:['bad'],mastery:9,attributeBuffs:null};
 const prepared=prepare(damaged);
 assert.deepEqual(prepared.points,{slash:0});
 assert.deepEqual(prepared.mastery,{});
 assert.equal(prepared.attributeBuffs.priestSpi,134);
});
test('A/B calls shared read-only preparation instead of calculating incomplete saved data',()=>{
 assert.match(app,/a\.data,b\.data,snap=>previewBaseStats\(prepareSavedBuildSnapshot\(snap\)\)/);
 assert.match(app,/next=\{\.\.\.base,\.\.\.draft/);
 assert.match(app,/PandoraBuildComparison\.compactResults\(/);
});
