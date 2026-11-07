import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {readFileSync} from 'node:fs';

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

test('Save and Reset reuse the same allowlist for all owner-editable key families',()=>{
 const source=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 const prefix='const OWNER_EDITABLE_KEY_PATTERN=/';
 const start=source.indexOf(prefix);
 assert.ok(start>=0,'Shared owner key allowlist must exist');
 const end=source.indexOf('$/;',start);
 assert.ok(end>start,'Allowlist should have a closing anchor');
 const raw=source.slice(start+prefix.length,end+1);
 const pattern=new RegExp(raw);
 for(const key of [
  'site.title','race.0','job.15','branch.slash','item.armor',
  'itemdesc.123','itemslots.123','itemedit.123','acquireedit.123',
  'tradeedit.123','wikiedit.monster.123','wikiedit.map.astir-union',
  'wikiedit.map.custom-abc123','wikiedit.npc.owner-npc-1234567890abcdef',
  'wikiedit.monster.owner-monster-abcdefgh1234',
  'guideedit.book.origin.heading','guideedit.honor.overview',
  'guideedit.honor.rank.10','guideedit.honor.wars','guideedit.wiki.labels',
  'dropedit.123','chestedit.123','spawnedit.123','soul.foo',
  'skill.abc.123','skilldesc.abc.123','visual.logo',
  'visual.race.0.f','visual.skill.X1','visual.item.123','visual.soul.123'
 ])assert.ok(pattern.test(key),'Missing owner Save/Reset family '+key);
 for(const key of ['guideedit.wiki.invalid','guideedit.fake','visual.skill.','random.secret'])
  assert.equal(pattern.test(key),false,'Disallowed owner key '+key);
 assert.equal((source.match(/OWNER_EDITABLE_KEY_PATTERN\.test\(key\)/g)||[]).length,2,
  'The exact same key allowlist must be used for Save and Reset');
});
