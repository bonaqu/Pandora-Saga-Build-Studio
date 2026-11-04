import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/catalog/source/';
const origin='https://bonaqu.github.io';
const adminToken='a'.repeat(43);
const env={DB:{
 prepare(statement){
  assert.match(statement,/sessions WHERE token_hash/);
  return {bind(){return this},first:async()=>({id:1})};
 }
}};
function request(name,authorized=false){
 return new Request(endpoint+name+'.json',{
  method:'GET',headers:{
   Origin:origin,
   ...(authorized?{Authorization:'Bearer '+adminToken}:{})
  }
 });
}
test('anonymous callers cannot request a live game-data source',async()=>{
 const original=globalThis.fetch;
 let network=0;
 globalThis.fetch=async()=>{network++;throw Error('Unauthenticated request leaked')};
 try{
  const res=await worker.fetch(request('items'),{DB:{prepare(){throw Error('No DB access before auth')}}});
  assert.equal(res.status,401);
  assert.equal(network,0);
  assert.equal(res.headers.get('access-control-allow-origin'),origin);
 }finally{globalThis.fetch=original}
});
test('authorized game-data proxy uses allowlisted names and never forwards admin credentials',async()=>{
 const original=globalThis.fetch;
 let network=0;
 globalThis.fetch=async (url,options)=>{
  network++;
  assert.equal(url,'https://pandorasaga-os.com/gamedata/meta.json');
  assert.equal(options.redirect,'manual');
  assert.equal(options.headers.accept,'application/json');
  assert.equal(options.headers.authorization,undefined);
  return new Response(JSON.stringify({counts:{items:1}}),{
   status:200,headers:{'content-type':'application/json'}});
 };
 try{
  const ok=await worker.fetch(request('meta',true),env);
  assert.equal(ok.status,200);
  assert.deepEqual(await ok.json(),{counts:{items:1}});
  assert.equal(network,1);
  const forbidden=await worker.fetch(request('fake',true),env);
  assert.equal(forbidden.status,404);
  assert.equal(network,1);
 }finally{globalThis.fetch=original}
});
test('unavailable or invalid upstream responses stop safely without touching D1',async()=>{
 const original=globalThis.fetch;
 let called=0;
 globalThis.fetch=async()=>{called++;return new Response('Forbidden',{status:403})};
 try{
  const denied=await worker.fetch(request('skills',true),env);
  assert.equal(denied.status,502);
  assert.match((await denied.json()).error,/Game data source temporarily unavailable/);
  assert.equal(called,2,'Only the two known game host aliases may be tried');
 }finally{globalThis.fetch=original}
});


test('a failed canonical hostname tries its www alias without credentials',async()=>{
 const original=globalThis.fetch,requests=[];
 globalThis.fetch=async(url,options)=>{
  requests.push(url);
  assert.equal(options.headers.authorization,undefined);
  assert.equal(options.redirect,'manual');
  if(requests.length===1)throw TypeError('Network error');
  return new Response(JSON.stringify({source:'current-game'}),{status:200});
 };
 try{
  const response=await worker.fetch(request('meta',true),env);
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{source:'current-game'});
  assert.deepEqual(requests,[
   'https://pandorasaga-os.com/gamedata/meta.json',
   'https://www.pandorasaga-os.com/gamedata/meta.json'
  ]);
 }finally{globalThis.fetch=original}
});

test('unavailable hostnames give a private diagnostic code without publishing partial catalog',async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async()=>{throw TypeError('Network failure')};
 try{
  const response=await worker.fetch(request('meta',true),env);
  assert.equal(response.status,502);
  const payload=await response.json();
  assert.equal(payload.error,'Game data source temporarily unavailable');
  assert.equal(payload.code,'network');
  assert.equal(payload.sourceDataset,'meta.json');
  assert.equal(payload.attempts.length,2);
  assert.deepEqual(payload.attempts.map(row=>[row.host,row.code,row.stage]),[
   ['pandorasaga-os.com','network','fetch'],
   ['www.pandorasaga-os.com','network','fetch']
  ]);
  assert.ok(payload.attempts.every(row=>row.name==='TypeError'&&
   row.message==='Network failure'));
 }finally{globalThis.fetch=old}
});


test('public fixed upstream probe tests Cloudflare egress without exposing game records or writing D1',async()=>{
 const original=globalThis.fetch;
 const names=[];
 globalThis.fetch=async url=>{
  names.push(url);
  return new Response(JSON.stringify({schemaVersion:1,counts:{items:1116}}),{status:200});
 };
 try{
  const result=await worker.fetch(new Request('https://ps-build-studio-cloud.bonaqu.workers.dev/api/source-health'),
   {DB:{prepare(){throw Error('Read-only probe cannot access D1')}}});
  assert.equal(result.status,200);
  const data=await result.json();
  assert.equal(data.status,'ok');
  assert.equal(data.source,'game-site');
  assert.equal(data.value,undefined);
  assert.ok(Number.isFinite(data.checkedAt));
  assert.deepEqual(names,['https://pandorasaga-os.com/gamedata/meta.json']);
  const cached=await worker.fetch(new Request('https://ps-build-studio-cloud.bonaqu.workers.dev/api/source-health'),
   {DB:{prepare(){throw Error('No DB query in cached probe')}}});
  assert.equal(cached.status,200);
  assert.equal(names.length,1,'probe result should be cached to avoid upstream request floods');
 }finally{globalThis.fetch=original}
});

test('Cloudflare-compatible manual redirects never follow an offsite Location',async()=>{
 const previous=globalThis.fetch,targets=[];
 globalThis.fetch=async(url,options)=>{
  targets.push(url);
  assert.equal(options.redirect,'manual');
  return new Response('',{status:302,headers:{location:'https://untrusted.example/steal'}});
 };
 try{
  const result=await worker.fetch(request('meta',true),env);
  assert.equal(result.status,502);
  const payload=await result.json();
  assert.deepEqual(payload.attempts.map(x=>x.code),['http-302','http-302']);
  assert.deepEqual(targets,[
   'https://pandorasaga-os.com/gamedata/meta.json',
   'https://www.pandorasaga-os.com/gamedata/meta.json'
  ]);
 }finally{globalThis.fetch=previous}
});

test('all 17 allowlisted game JSON sources accept their original dataset shapes',async()=>{
 const previous=globalThis.fetch;
 const names=['meta','classes','skills','items','souls','monsters','drops','maps',
  'instances','racialPassives','itemForth','unison','trades','tables',
  'expertise','chests','strings.en'];
 const visited=[];
 globalThis.fetch=async(url,options)=>{
  const name=url.split('/').pop().slice(0,-5);
  visited.push(name);
  assert.equal(options.redirect,'manual');
  assert.equal(options.headers.authorization,undefined);
  const data=name==='instances'?[{id:20030040,name:'Dungeon',mobs:[]}]:
   {test:{id:1}};
  return new Response(JSON.stringify(data),{status:200});
 };
 try{
  for(const name of names){
   const response=await worker.fetch(request(name,true),env);
   assert.equal(response.status,200,name+' must accept the official JSON shape');
   const payload=await response.json();
   assert.equal(Array.isArray(payload),name==='instances');
  }
  assert.deepEqual(visited,names);
 }finally{globalThis.fetch=previous}
});
test('instances accepts an array only for instances and rejects malformed rows',async()=>{
 const original=globalThis.fetch;
 try{
  for(const [name,body] of [
   ['instances',{1:{id:1}}],
   ['instances',[null]],
   ['items',[{id:1}]]
  ]){
   globalThis.fetch=async()=>new Response(JSON.stringify(body),{status:200});
   const response=await worker.fetch(request(name,true),env);
   assert.equal(response.status,502,name+' should reject incorrect source shape');
   const payload=await response.json();
   assert.equal(payload.code,'invalid-format');
   assert.equal(payload.attempts.length,2);
  }
 }finally{globalThis.fetch=original}
});
