import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const section=(from,to)=>{
 const a=app.indexOf(from),b=app.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'Missing startup contract: '+from);
 return app.slice(a,b);
};

test('verified D1 startup cannot claim ready until both local writes have succeeded',()=>{
 const boot=section('async function startStudio(', "$('startupRetry').onclick");
 const checkpoint=boot.indexOf("if(confirmed.status!=='ready')");
 const durable=boot.indexOf('const draftSaved=persist(),librarySaved=persistBuilds()');
 const gate=boot.indexOf("showLiveGate('storage',{saved:false})");
 const finish=boot.indexOf('}else startupDone()');
 assert.ok(checkpoint>=0&&durable>checkpoint&&gate>durable&&finish>gate);
 assert.match(boot,/if\(studioLiveReady&&\(!draftSaved\|\|!librarySaved\)\)/);
 assert.match(boot,/if\(studioLiveReady&&!liveGateReason\)resumeCloudLibrary\(\{force:true\}\)/);
 assert.doesNotMatch(boot,/if\(studioLiveReady\)resumeCloudLibrary\(\{force:true\}\)/);
});

test('initial local storage failure is not retried invisibly or labeled as a saved draft',()=>{
 const gate=section('function showLiveGate(', 'function leaveLiveGate()');
 assert.match(gate,/if\(saved===null\)liveLocalSaved=saveLiveDraft\(\)/);
 assert.match(gate,/else liveLocalSaved=saved/);
 assert.match(gate,/Не удалось сохранить черновик или библиотеку билдов/);
 const retry=section("$('startupRetry').onclick=", '// Local fixture mode');
 assert.match(retry,/if\(liveGateReason==='storage'\)\{leaveLiveGate\(\);return\}/);
 const resume=section('function leaveLiveGate()', 'async function checkLiveConnection()');
 assert.match(resume,/liveLocalSaved=saveLiveDraft\(\)/);
 assert.match(resume,/if\(!liveLocalSaved\)\{showLiveGate\('storage'\);return\}/);
 assert.match(resume,/resumeCloudLibrary\(\{force:true\}\)/);
});

test('a no-op storage readiness write preserves the original saved library order',()=>{
 const source=section('function persistBuilds()', 'const CLOUD_TOKEN_KEY=');
 const rows=[
  {id:'a'.repeat(32),createdAt:100,data:{name:'One'}},
  {id:'b'.repeat(32),createdAt:200,data:{name:'Two'}}
 ];
 const stored=JSON.stringify([...rows].reverse());
 let value=stored,writes=0;
 const libraryScopeId=()=> 'account:test';
 const window={PandoraBuildScope:{
  getOwned:()=>value,
  setOwned:(_storage,_owner,key,next)=>{
   assert.equal(key,'ps-build-library.v1');
   value=next;writes++;return true;
  }
 }};
 const orderByCreation=data=>[...data].sort((a,b)=>a.createdAt-b.createdAt);
 const buildFunction=Function('window','localStorage','libraryScopeId','builds',
  'safeStoredBuildRows',source+'\nreturn persistBuilds;');
 const persistBuilds=buildFunction(window,{},libraryScopeId,rows,orderByCreation);
 assert.equal(persistBuilds(),true);
 assert.equal(value,stored,'Readiness must never reverse the saved serialized rows');
 assert.equal(writes,1,'Still tests that localStorage accepts a real write');
 rows[0]={...rows[0],data:{name:'Updated'}};
 assert.equal(persistBuilds(),true);
 assert.notEqual(value,stored,'An actual library change must be persisted');
 assert.equal(JSON.parse(value)[0].data.name,'Updated');
});
