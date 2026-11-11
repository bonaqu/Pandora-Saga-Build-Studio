import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const extract=(start,end)=>{
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Missing actual production function: '+start);
 return source.slice(a,b);
};
const persistent=extract('function persistBuilds(){','\nconst CLOUD_TOKEN_KEY');
const loader=extract('async function loadCloudBuilds(){','\nfunction h(tag,attrs={}');
const first={id:'a'.repeat(32),name:'Local original',at:1,
 data:{race:1,job:16,level:45}};
const remote={id:'b'.repeat(32),name:'New cloud entry',at:2,
 data:{race:1,job:16,level:46}};
test('failed browser-storage reconciliation never overwrites the working local list or uploads',async()=>{
 const statuses=[],toasts=[],requests=[],uploads=[];
 const scope={PandoraBuildScope:{setOwned(){throw Error('Quota exceeded')}},
  PandoraBuildLibraryMerge:{reconcile(){
   return {merged:[remote],outgoing:[remote],activeId:null,copies:1,unavailable:0};
  }}};
 scope.PandoraAccountUI={isLoggedIn:()=>true};
 const app=Function('window','localStorage','libraryScopeId','queuedDeletes',
  'cloudLibraryRequest','reportCloudStatus','showStudioToast','putCloudBuild',
  'newId','console','renderDetails','selectActiveBuild',
  'let builds=[JSON.parse(JSON.stringify('+JSON.stringify(first)+'))],'+
  'activeBuildId=null,libraryChangeId=0,cloudLoadRequestId=0,lang="ru",activeTab="builds";\n'+
  persistent+'\n'+loader+'\nreturn {load:loadCloudBuilds,builds:()=>builds};')(
  scope,{},()=> 'account:alice_01',()=>[],
  async value=>{requests.push(value||null);return {records:[{id:remote.id,entry:remote}]}},
  x=>statuses.push(x),(...args)=>toasts.push(args),
  async value=>uploads.push(value),()=> 'c'.repeat(32),
  {warn:()=>{}},()=>{},()=>{}
 );
 await app.load();
 assert.deepEqual(app.builds(),[first]);
 assert.deepEqual(requests,[null],'Only a read may happen before durable local save');
 assert.deepEqual(uploads,[],'Never upload after a failed local merge');
 assert.ok(statuses.at(-1).includes('Не удалось сохранить'));
 assert.equal(toasts.at(-1)[1],'error');
});
test('deletion requires a successful persistent write before cloud revocation',()=>{
 const ui=extract('function renderBuilds(root){','\nfunction newId(){');
 const marker=ui.indexOf("text:tr('Удалить билд','Delete build'),onclick:()=>{");
 const commit=ui.indexOf('if(!persistBuilds())',marker);
 const revoke=ui.indexOf('void deleteCloudBuild(b.id)',marker);
 assert.ok(marker>=0&&commit>marker&&revoke>commit);
 const blocked=ui.slice(commit,revoke);
 assert.match(blocked,/builds=beforeDelete/);
 assert.match(blocked,/return;/);
 assert.match(blocked,/if\(activeBuildId===b.id\)selectActiveBuild\(null\)/);
});
