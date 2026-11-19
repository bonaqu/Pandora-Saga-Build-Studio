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
    'shared_builds','shared_build_limits','shared_build_sources','private_builds'].map(name=>({name}))})};
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
 assert.deepEqual(data.features,{sharing:true,catalog:true,library:true,accounts:false});
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

test('anonymous account checks and unsupported routes do not spend D1 reads',async()=>{
 const DB={prepare(){throw Error('Unexpected D1 query from an anonymous request')}};
 for(const [path,method,status] of [
  ['/api/account/me','GET',401],['/api/account/me','PUT',405],
  ['/api/account/login','GET',405],['/api/account/unknown','GET',404]
 ]){
  const response=await worker.fetch(request(path,{method}),{DB});
  assert.equal(response.status,status,path+' '+method);
  assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
 }
 const malformed=await worker.fetch(request('/api/account/me',{
  headers:{Authorization:'Bearer malformed'}
 }),{DB});
 assert.equal(malformed.status,401);
});
test('Cloudflare D1 daily limits return safe 503 with Retry-After rather than 500',async()=>{
 const token='Bearer '+'t'.repeat(43);
 for(const direction of ['read','write']){
  const wrapped=new Error('D1 query failed',{cause:new Error(
   "Your account has exceeded D1's free tier daily row "+direction+
   ' limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.'
  )});
  const response=await worker.fetch(request('/api/account/me',{
   headers:{Authorization:token}
  }),{DB:{prepare(){throw wrapped}}});
  assert.equal(response.status,503,direction);
  const payload=await response.json();
  assert.equal(payload.code,'D1_DAILY_QUOTA_EXCEEDED');
  assert.equal(payload.error,'Database temporarily unavailable');
  assert.ok(Number(response.headers.get('retry-after'))>=1);
  assert.ok(Number(response.headers.get('retry-after'))<=86400);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
  assert.doesNotMatch(JSON.stringify(payload),/sql|free tier|password|account_id/i);
 }
 const other=await worker.fetch(request('/api/account/me',{
  headers:{Authorization:token}
 }),{DB:{prepare(){throw Error('Unexpected unrelated D1 schema issue')}}});
 assert.equal(other.status,500);
 assert.deepEqual(await other.json(),{error:'Server error'});
});
