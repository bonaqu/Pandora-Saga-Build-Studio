import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const begin=src.indexOf('async function connectCloudLibrary(secret,feedback){');
const end=src.indexOf('\nfunction buildLibraryTransfer(){',begin);
assert.ok(begin>=0&&end>begin,'Use the actual production guest transfer handler');
const production=src.slice(begin,end);
const oldKey='a'.repeat(64),newKey='b'.repeat(64);

function scenario({failSwitch=false,failPersist=false}={}){
 const events=[],saved=new Map([['ps-build-library-secret.v1',oldKey]]);
 const store={
  getItem:key=>saved.get(key)??null,
  setItem:(key,value)=>{
   if(key==='ps-build-library-secret.v1'&&value===newKey&&failPersist)
    throw Error('QuotaExceededError');
   events.push(['persist',key,value===newKey?'new':'old']);
   saved.set(key,value);
  },
  removeItem:key=>saved.delete(key)
 };
 const environment=[
  "let tabGuestSecret=oldKey,activeOwner='guest:'+oldKey,selected='unchanged',loads=0,libraryChangeId=0,lang='ru';",
  "const CLOUD_TOKEN_KEY='ps-build-library-secret.v1';",
  "const localStorage=store,console={warn(){}};",
  "const window={PandoraAccountUI:{isLoggedIn:()=>false},PandoraBuildScope:{owner:(_username,key)=>'guest:'+key}};",
  "const libraryScopeId=()=> 'guest:'+tabGuestSecret;",
  "const queuedDeletes=()=>[];",
  "const cloudLibraryRequest=async()=>({records:[{id:'x',entry:{id:'x',data:{}}}]});",
  "const activateLibraryScope=()=>{events.push(['activate',tabGuestSecret]);activeOwner='guest:'+tabGuestSecret;if(failSwitch&&tabGuestSecret===newKey)throw Error('Scope failed')};",
  "const selectActiveBuild=id=>{selected=id};",
  "const loadCloudBuilds=()=>{loads++};",
  production,
  "return {connect:feedback=>connectCloudLibrary(newKey,feedback),owner:()=>activeOwner,secret:()=>tabGuestSecret,key:()=>localStorage.getItem(CLOUD_TOKEN_KEY),selected:()=>selected,loaded:()=>loads};"
 ].join('\n');
 return {...Function('store','events','oldKey','newKey','failSwitch',environment)(
  store,events,oldKey,newKey,failSwitch),events};
}

test('failed owner switch cannot persist a different guest library secret',async()=>{
 const x=scenario({failSwitch:true}),feedback={textContent:''};
 assert.equal(await x.connect(feedback),false);
 assert.equal(x.key(),oldKey,'A failed transfer must not change the durable recovery code');
 assert.equal(x.secret(),oldKey,'The current tab must restore the original guest key');
 assert.equal(x.owner(),'guest:'+oldKey);
 assert.equal(x.loaded(),0,'No cloud GET may start for an uncommitted transfer');
 assert.match(feedback.textContent,/Не удалось подключить библиотеку/);
 assert.deepEqual(x.events.map(e=>e[0]),['activate','activate'],
  'The old scope must be recovered without writing the new secret');
});

test('quota failure committing the new transfer key rolls back visible scope',async()=>{
 const x=scenario({failPersist:true}),feedback={textContent:''};
 assert.equal(await x.connect(feedback),false);
 assert.equal(x.key(),oldKey);
 assert.equal(x.secret(),oldKey);
 assert.equal(x.owner(),'guest:'+oldKey);
 assert.equal(x.loaded(),0);
 assert.match(feedback.textContent,/QuotaExceededError/);
 assert.deepEqual(x.events.map(e=>e[0]),['activate','activate']);
});

test('successful transfer writes the new key only after owner activation',async()=>{
 const x=scenario(),feedback={textContent:''};
 assert.equal(await x.connect(feedback),true);
 assert.equal(x.key(),newKey);
 assert.equal(x.secret(),newKey);
 assert.equal(x.owner(),'guest:'+newKey);
 assert.equal(x.loaded(),1);
 assert.equal(x.selected(),null);
 assert.match(feedback.textContent,/Подключено/);
 assert.deepEqual(x.events.map(e=>[e[0],e[2]||'']),[
  ['activate',''],['persist','new']
 ]);
});
