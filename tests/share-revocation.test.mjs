import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const OWNER='a'.repeat(64),OTHER='b'.repeat(64),ORIGIN='https://bonaqu.github.io';
function db(){
 const builds=new Map(),links=new Map(),sources=new Map();
 const tables=new Set(['private_builds','shared_builds','shared_build_limits','shared_build_sources']);
 return {peekLink:id=>links.get(id),prepare(sql){
  if(sql.includes('FROM sqlite_master'))return {all:async()=>({results:[...tables].map(name=>({name}))})};
  return {bind(...v){
   const one=async()=>{
    if(sql.startsWith('SELECT build_id,deleted_at FROM private_builds')){const x=builds.get(v[0]+':'+v[1]);return x?{build_id:v[1],deleted_at:x.deleted_at}:null}
    if(sql.startsWith('SELECT COUNT(*) AS total FROM private_builds'))return{total:[...builds.keys()].filter(k=>k.startsWith(v[0]+':')).length};
    if(sql.startsWith('SELECT deleted_at FROM private_builds')){const x=builds.get(v[0]+':'+v[1]);return x?{deleted_at:x.deleted_at}:null}
    if(sql.startsWith('SELECT payload FROM shared_builds'))return links.has(v[0])?{payload:links.get(v[0])}:null;
    if(sql.startsWith('SELECT owner_hash,build_id FROM shared_build_sources'))return sources.get(v[0])||null;
    throw Error('Unexpected first query '+sql);
   };
   const run=async()=>{
    if(sql.startsWith('INSERT INTO private_builds')){
     if(sql.includes("VALUES(?,?,'{}'"))builds.set(v[0]+':'+v[1],{deleted_at:v[3]});
     else builds.set(v[0]+':'+v[1],{deleted_at:null,payload:v[2]});
     return{meta:{changes:1}};
    }
    if(sql.startsWith('INSERT INTO shared_build_limits'))return{meta:{changes:1}};
    if(sql.startsWith('INSERT INTO shared_builds')){if(links.has(v[0]))throw Error('UNIQUE constraint failed');links.set(v[0],v[1]);return{meta:{changes:1}}}
    if(sql.startsWith('INSERT INTO shared_build_sources')){sources.set(v[0],{owner_hash:v[1],build_id:v[2]});return{meta:{changes:1}}}
    if(sql.startsWith('UPDATE shared_builds SET payload=')){
     for(const [sid,source] of sources)
      if(source.owner_hash===v[0]&&source.build_id===v[1])links.set(sid,'{}');
     return{meta:{changes:1}};
    }
    throw Error('Unexpected write query '+sql);
   };
   return {first:one,run};
  },run:async()=>{if(sql.startsWith('CREATE'))return{meta:{changes:1}};throw Error(sql)}};
 },async batch(statements){for(const statement of statements)await statement.run();return [{meta:{changes:1}}]}};
}
const url='https://ps-build-studio-cloud.bonaqu.workers.dev';
function req(path,method='GET',payload=null,token=null){
 return new Request(url+path,{method,headers:{Origin:ORIGIN,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
  ...(payload?{body:JSON.stringify(payload)}:{})});
}
async function call(DB,path,method='GET',payload=null,token=null){
 const response=await worker.fetch(req(path,method,payload,token),{DB});
 return {status:response.status,data:await response.json()};
}
test('two links become globally unavailable when the original is deleted, foreign library survives',async()=>{
 const DB=db(),id='a'.repeat(32),otherId='b'.repeat(32),character={race:3,job:0,level:55};
 assert.equal((await call(DB,'/api/library','POST',{action:'put',entry:{id,name:'Build',at:123,data:character}},OWNER)).status,200);
 assert.equal((await call(DB,'/api/library','POST',{action:'put',entry:{id:otherId,name:'Other',at:124,data:character}},OTHER)).status,200);
 const payload={schema:1,type:'build',buildId:id,data:character};
 const first=await call(DB,'/api/shared','POST',payload,OWNER);
 const second=await call(DB,'/api/shared','POST',payload,OWNER);
 assert.equal(first.status,201);assert.equal(second.status,201);
 assert.notEqual(first.data.id,second.data.id);
 const other=await call(DB,'/api/shared','POST',{...payload,buildId:otherId},OTHER);
 assert.equal(other.status,201);
 for(const share of [first,second])assert.equal((await call(DB,'/api/shared/'+share.data.id)).status,200);
 assert.equal((await call(DB,'/api/library','POST',{action:'delete',id},OWNER)).status,200);
 for(const share of [first,second]){
  assert.equal(DB.peekLink(share.data.id),'{}','Delete must scrub snapshot content');
  const response=await call(DB,'/api/shared/'+share.data.id);
  assert.equal(response.status,410);assert.equal(response.data.reason,'deleted');
 }
 assert.equal((await call(DB,'/api/shared/'+other.data.id)).status,200);
 const stale=await call(DB,'/api/library','POST',{action:'put',entry:{id,name:'Stale',at:125,data:character}},OWNER);
 assert.equal(stale.status,409);
 assert.equal((await call(DB,'/api/shared','POST',payload,OWNER)).status,409);
});
test('share creation checks owner and rejects anonymous, invented and library snapshots',async()=>{
 const DB=db(),id='c'.repeat(32),character={race:2,job:1,level:55};
 const payload={schema:1,type:'build',buildId:id,data:character};
 assert.equal((await call(DB,'/api/shared','POST',payload,OWNER)).status,409);
 assert.equal((await call(DB,'/api/library','POST',{action:'put',entry:{id,name:'Test',at:1,data:character}},OWNER)).status,200);
 assert.equal((await call(DB,'/api/shared','POST',payload,OTHER)).status,409);
 assert.equal((await call(DB,'/api/shared','POST',payload)).status,401);
 assert.equal((await call(DB,'/api/shared','POST',{...payload,type:'library'},OWNER)).status,400);
 assert.equal((await call(DB,'/api/shared/aaaaaaaaaaa')).status,404);
});
test('revocation toast and link creation remain inline; server has no destructive share migration',()=>{
 const app=read('app.js'),css=read('style.css'),sql=read('worker/migrations/0003_shares.sql');
 assert.match(app,/function showStudioToast\(/);
 assert.match(app,/error\.httpStatus===410/);
 assert.match(app,/setTimeout\(close,8500\)/);
 assert.match(app,/text:'ОК'/);
 assert.match(css,/\.studio-toast\{position:fixed/);
 assert.match(app,/createShared\(b,shareSlot\)/);
 assert.match(app,/function unsavedBuild\(/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS shared_build_sources/);
 assert.doesNotMatch(sql,/DROP TABLE/i);
 assert.match(app,/После удаления оригинального билда она перестанет работать/);
});
