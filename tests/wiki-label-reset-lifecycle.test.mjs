import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

// Test the actual HTTP handler with an isolated in-memory D1 adapter.
// No requests, credentials, or writes reach the production Worker.
function fixture(){
 const data=new Map(),calls=[];
 const DB={prepare(sql){
  let args=[];
  return{
   bind(...next){args=next;return this},
   async first(){return {id:1}},
   async run(){
    calls.push({sql,args});
    if(sql.includes('INSERT INTO overrides'))data.set(args[0],args[1]);
    if(sql.includes('DELETE FROM overrides')){
     const had=data.delete(args[0]);
     return {meta:{changes:had?1:0}};
    }
    return {meta:{changes:0}};
   }
  };
 }};
 const request=(path,body,authorization='Bearer '+'a'.repeat(43))=>
  worker.fetch(new Request('https://ps-build-studio-cloud.bonaqu.workers.dev'+path,{
   method:'POST',
   headers:{Origin:'https://bonaqu.github.io',Authorization:authorization},
   body:JSON.stringify(body)
  }),{DB});
 return {data,calls,request};
}

test('first owner edit of Wiki labels can be undone by deleting its D1 record',async()=>{
 const {data,request}=fixture();
 const key='guideedit.wiki.labels',value=JSON.stringify({
  skill_filter_other_ru:'Другие навыки',
  skill_filter_unknown_ru:'Неуточнённые'
 });
 const create=await request('/api/admin/override',{key,value});
 assert.equal(create.status,200,await create.clone().text());
 assert.equal(data.get(key),value);
 const undo=await request('/api/admin/reset',{key});
 assert.equal(undo.status,200,await undo.clone().text());
 assert.deepEqual(await undo.json(),{ok:true,key,deleted:true});
 assert.equal(data.has(key),false);
 // Idempotent fallback: no record to delete is not an error.
 const again=await request('/api/admin/reset',{key});
 assert.equal(again.status,200);
 assert.equal((await again.json()).deleted,false);
});
test('reset still rejects unsupported key categories and unauthenticated attempts',async()=>{
 const {request,data}=fixture();
 const bad=await request('/api/admin/reset',{key:'guideedit.wiki.unknown'});
 assert.equal(bad.status,400);
 const noToken=await request('/api/admin/reset',{key:'guideedit.wiki.labels'},'');
 assert.equal(noToken.status,401);
 assert.equal(data.size,0);
});
