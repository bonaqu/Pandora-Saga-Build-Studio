import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
const code=readFileSync(new URL('../pandora-os-catalog-workbench.js',import.meta.url),'utf8');
const url='https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/catalog/test-owner-cas';
function database({failAfterCreate=false,switchSnapshot=false}={}){
 const values=new Map(),commands=[];
 let changed=false,reads=0;
 return {values,commands,prepare(sql){
  let args=[];
  return {
   bind(...v){args=v;return this},
   async first(){
    if(sql.startsWith('SELECT id FROM sessions'))return{id:1};
    if(sql.startsWith('SELECT snapshot,published_at,expected_counts FROM catalog_current'))
     return {snapshot:switchSnapshot&&reads++?'new':'stable',published_at:1,expected_counts:'{}'};
    if(sql.startsWith('SELECT value FROM overrides WHERE key=?'))
     return values.has(args[0])?{value:values.get(args[0])}:null;
    throw Error('Unsupported query '+sql);
   },
   async run(){
    commands.push({sql,args});
    if(sql.startsWith('INSERT INTO overrides')){
     if(values.has(args[0]))return{meta:{changes:0}};
     values.set(args[0],args[1]);
     if(failAfterCreate&&!changed){changed=true;throw Error('Applied insert, lost response')}
     return{meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE overrides')){
     const [value,,key,old]=args;
     if(values.get(key)!==old)return{meta:{changes:0}};
     values.set(key,value);return{meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM overrides WHERE key=? AND value=?')){
     const [key,old]=args;
     if(values.get(key)!==old)return{meta:{changes:0}};
     values.delete(key);return{meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM overrides WHERE key=?')){
     return{meta:{changes:Number(values.delete(args[0]))}};
    }
    throw Error('Unexpected write '+sql);
   }
  };
 }};
}
async function call(db,authorized=true){
 const r=await worker.fetch(new Request(url,{method:'POST',headers:{
  Origin:'https://bonaqu.github.io',...(authorized?{Authorization:'Bearer '+'a'.repeat(43)}:{})
 },body:'{}'}),{DB:db});
 return{status:r.status,body:await r.json()};
}
test('manual CAS probe validates stale 409 semantics using disposable keys',async()=>{
 const db=database(),r=await call(db);
 assert.equal(r.status,200);
 assert.deepEqual(r.body,{ok:true,casVerified:true,qaCleaned:true,activeCatalogUnchanged:true});
 assert.equal(db.values.size,0);
 const inserted=db.commands.filter(v=>v.sql.startsWith('INSERT INTO overrides'));
 assert.equal(inserted.length,2);
 assert.ok(inserted.every(v=>/^__qa\.(cas|peer)\.[a-f0-9]{32}$/.test(v.args[0])));
 assert.equal(db.commands.filter(v=>v.sql.startsWith('UPDATE overrides')).length,2);
 assert.equal(db.commands.filter(v=>v.sql.startsWith('DELETE FROM overrides')).length,5);
 assert.equal(db.commands.some(v=>/catalog_entries|catalog_current/.test(v.sql)),false);
});
test('anonymous request cannot write, partial errors and changed snapshots clean up',async()=>{
 const unauthorized=database(),denied=await call(unauthorized,false);
 assert.equal(denied.status,401);assert.equal(unauthorized.commands.length,0);
 for(const args of [{failAfterCreate:true},{switchSnapshot:true}]){
  const db=database(args),result=await call(db);
  assert.equal(result.status,502,JSON.stringify(args));
  assert.equal(db.values.size,0);
 }
});
test('only a confirmed owner action invokes the CAS route in the advanced panel',()=>{
 assert.match(code,/text:'Проверить конфликты правок'/);
 assert.match(code,/testCAS\.onclick=async/);
 assert.match(code,/await request\('\/api\/admin\/catalog\/test-owner-cas',\{\}\)/);
 const setup=code.slice(0,code.indexOf('testCAS.onclick=async'));
 assert.doesNotMatch(setup,/request\('\/api\/admin\/catalog\/test-owner-cas'/);
});
