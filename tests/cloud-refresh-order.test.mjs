import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function loadCloudBuilds(){');
const end=app.indexOf('\nfunction h(tag,attrs={}',start);
assert.ok(start>=0&&end>start);
const loader=app.slice(start,end);
const A='a'.repeat(32);
const build=(name,at)=>({id:A,name,at,data:{race:1,job:16,level:45}});
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {resolve,reject,promise}};
function scenario(){
 const pending=[],status=[],persisted=[];
 let serial=0;
 const run=Function('request','status','persisted',
  'let libraryChangeId=0,cloudLoadRequestId=0,builds=[],activeBuildId=null,activeTab="wiki",lang="ru";'+
  'const queuedDeletes=()=>[];'+
  'const cloudLibraryRequest=()=>request();'+
  'const acknowledgeDelete=()=>{};'+
  'const window={PandoraBuildLibraryMerge:{reconcile:({remote})=>({merged:remote.map(x=>x.entry),activeId:null,outgoing:[],copies:0,unavailable:0})}};'+
  'const persistBuilds=()=>{persisted.push(builds.map(b=>b.name));return true};'+
  'const reportCloudStatus=s=>status.push(s);'+
  'const putCloudBuild=async()=>true,showStudioToast=()=>{},renderDetails=()=>{};'+
  'const selectActiveBuild=id=>{activeBuildId=id},newId=()=>String(++serial);'+
  'const console={warn(){}};'+
  loader+'\nreturn {load:loadCloudBuilds,builds:()=>builds};')(
   ()=>{const p=defer();pending.push(p);return p.promise},status,persisted);
 return {...run,pending,status,persisted};
}
test('a slower obsolete refresh cannot replace a newer cloud revision',async()=>{
 const s=scenario(),first=s.load(),second=s.load();
 assert.equal(s.pending.length,2);
 s.pending[1].resolve({records:[{id:A,entry:build('New D1 revision',200)}]});
 await second;
 assert.deepEqual(s.builds().map(x=>x.name),['New D1 revision']);
 s.pending[0].resolve({records:[{id:A,entry:build('Old cached revision',100)}]});
 await first;
 assert.deepEqual(s.builds().map(x=>x.name),['New D1 revision']);
 assert.deepEqual(s.persisted,[['New D1 revision']]);
});
test('a rejected obsolete request cannot replace success with an offline warning',async()=>{
 const s=scenario(),first=s.load(),second=s.load();
 s.pending[1].resolve({records:[{id:A,entry:build('Latest',200)}]});
 await second;
 const before=[...s.status];
 s.pending[0].reject(Error('Network timeout'));
 await first;
 assert.deepEqual(s.status,before);
 assert.equal(s.builds()[0].name,'Latest');
});
