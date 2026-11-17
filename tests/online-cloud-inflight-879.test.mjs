import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const extract=(from,to)=>{
 const a=app.indexOf(from),b=app.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'source function '+from);
 return app.slice(a,b);
};

test('a delayed cloud GET cannot reconcile or PUT records after D1 goes offline',async()=>{
 const script=extract('async function loadCloudBuilds(){','\nconst controlGlyphIcon');
 const window={PandoraAccountUI:{isLoggedIn:()=>true}};
 let available=true,reads=0,pendingResolve;
 const pending=new Promise(resolve=>{pendingResolve=resolve});
 const request=async()=>{
  reads++;
  if(reads>1)throw Error('Unexpected retry during offline gate');
  return pending;
 };
 const create=Function('window','cloudOperationsAllowed','queuedDeletes',
  'cloudLibraryRequest',
  'let libraryChangeId=0,cloudLoadRequestId=0;\n'+script+
  '\nreturn loadCloudBuilds;');
 const load=create(window,()=>available,()=>[],request);
 const job=load();
 await Promise.resolve();
 assert.equal(reads,1);
 available=false;
 pendingResolve({records:[{id:'f'.repeat(32),entry:{name:'Remote'}}]});
 await job;
 assert.equal(reads,1,'In-flight GET is ignored once online gate is closed');
 await load();
 assert.equal(reads,1,'A new cloud GET cannot begin during D1 recovery');
});

test('no cloud PUT or DELETE may start behind the mandatory online gate',async()=>{
 const window={PandoraAccountUI:{isLoggedIn:()=>true}};
 const blocked=()=>false;
 const putCode=extract('async function putCloudBuild(entry){','\n// A batch must report');
 const delCode=extract('async function deleteCloudBuild(id){','\nasync function loadCloudBuilds(){');
 const put=Function('window','cloudOperationsAllowed',putCode+'\nreturn putCloudBuild;')
  (window,blocked);
 const del=Function('window','cloudOperationsAllowed',delCode+'\nreturn deleteCloudBuild;')
  (window,blocked);
 assert.equal(await put({id:'a'.repeat(32)}),false);
 assert.equal(await del('a'.repeat(32)),false);
 const batch=extract('async function uploadSharedBuildBatch(','\nasync function deleteCloudBuild(');
 assert.match(batch,/if\(!cloudOperationsAllowed\(\)\|\|libraryScopeId\(\)!==owner/);
 const loader=extract('async function loadCloudBuilds(){','\nconst controlGlyphIcon');
 assert.match(loader,/if\(!cloudOperationsAllowed\(\)\)return;\s*const response=await cloudLibraryRequest\(\);\s*if\(!cloudOperationsAllowed\(\)\)return/);
 assert.match(loader,/for\(const entry of outgoing\)\{\s*if\(!cloudOperationsAllowed\(\)/);
});

test('account cloud gate depends on verified site readiness, not a misleading online icon',()=>{
 const snippet=extract('function cloudOperationsAllowed(){','\nasync function putCloudBuild(entry){');
 assert.match(snippet,/return localCatalogHost\|\|studioLiveReady&&!liveGateReason/);
 assert.doesNotMatch(snippet,/navigator\.onLine/);
});
