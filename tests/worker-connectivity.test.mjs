import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const ORIGIN='https://bonaqu.github.io';
const request=(path,opts={})=>new Request('https://ps-build-studio-cloud.bonaqu.workers.dev'+path,{
 headers:{Origin:ORIGIN,...(opts.headers||{})},method:opts.method||'GET'
});
function database(catalog=true){
 return{prepare(sql){
  if(sql.includes('FROM sqlite_master')){
   return {all:async()=>({results:['admins','sessions','overrides','login_attempts',
    'shared_builds','shared_build_limits'].map(name=>({name}))})};
  }
  if(sql.includes('FROM catalog_current')){
   return {first:async()=>catalog?{snapshot:'sample',published_at:1,expected_counts:'{}'}:null};
  }
  throw Error('Unexpected query: '+sql);
 }};
}
test('health reports own D1, published catalog and sharing readiness with CORS',async()=>{
 const response=await worker.fetch(request('/api/health'),{DB:database(true)});
 const data=await response.json();
 assert.equal(response.status,200);
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal(data.storage,'d1');
 assert.equal(data.status,'ok');
 assert.deepEqual(data.features,{sharing:true,catalog:true});
});
test('health differentiates configured D1 from unpublished catalog',async()=>{
 const response=await worker.fetch(request('/api/health'),{DB:database(false)});
 assert.equal(response.status,200);
 assert.equal((await response.json()).features.catalog,false);
});
test('sharing route returns 503 rather than 500 if D1 binding is missing',async()=>{
 const response=await worker.fetch(request('/api/shared/abcdefghijk'),{});
 const data=await response.json();
 assert.equal(response.status,503);
 assert.match(data.error,/Database not configured/);
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
});
test('CORS preflight requires no D1 and does not change state',async()=>{
 const response=await worker.fetch(request('/api/health',{method:'OPTIONS'}),{});
 assert.equal(response.status,204);
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
 assert.match(response.headers.get('access-control-allow-methods'),/GET/);
});
