import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const host={};
Function('window',readFileSync(new URL('../saved-build-autosave.js',import.meta.url),'utf8'))(host);
const update=host.PandoraSavedBuildAutosave.updatedSaved;
const A='a'.repeat(32);
const saved={id:A,name:'Original',at:100,data:{name:'Original',race:1,job:0,level:45}};
test('drafts and unknown IDs cannot auto-create builds or call the cloud',()=>{
 assert.equal(update({activeId:null,builds:[],state:{level:55}}),null);
 assert.equal(update({activeId:A,builds:[],state:{level:55}}),null);
 assert.equal(update({activeId:'not-a-build',builds:[saved],state:{level:55}}),null);
});
test('an already saved build receives a monotonic revision only after real changes',()=>{
 assert.equal(update({activeId:A,builds:[saved],state:saved.data,now:100}),null);
 const next=update({activeId:A,builds:[saved],state:{...saved.data,level:55},now:99});
 assert.equal(next.entry.id,A);
 assert.equal(next.entry.data.level,55);
 assert.equal(next.entry.at,101);
 assert.equal(saved.data.level,45);
 assert.equal(next.builds.length,1);
});
test('editing another saved build cannot affect the other originals',()=>{
 const B='b'.repeat(32),second={id:B,name:'Other',at:200,data:{level:40}};
 const result=update({activeId:B,builds:[saved,second],state:{level:50},now:230});
 assert.equal(result.builds.length,2);
 assert.equal(result.builds[0].id,B);
 assert.deepEqual(result.builds.find(x=>x.id===A),saved);
});
test('actual app invokes persisted-saved update only after direct user edit intent',()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(source,/function persist\(\)\{try\{localStorage\.setItem/);
 assert.doesNotMatch(source,/PandoraSavedBuildAutosave\.updatedSaved/);
 assert.match(source,/saveBuild\(state\.name,b\.id\)/);
 assert.match(source,/function saveBuild\(name=state\.name\|\|'Новый герой',overwriteId=null\)/);
});
