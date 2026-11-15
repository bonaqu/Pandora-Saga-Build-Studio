import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
const source=readFileSync(new URL('../pandora-os-catalog-workbench.js',import.meta.url),'utf8');
const token='x'.repeat(43);
const makeRequest=path=>new Request('https://ps-build-studio-cloud.bonaqu.workers.dev'+path,{
 headers:{Authorization:'Bearer '+token,Origin:'https://bonaqu.github.io'}
});
function env(){
 return {GITHUB_CATALOG_TOKEN:'source-secret-'+'y'.repeat(45),DB:{
  prepare(query){return {bind(){return this},async first(){if(query.includes('FROM sessions'))return {id:1};throw Error(query)}}}
 }};
}
test('readiness preflight is performed before any D1 initialization or catalog writing',()=>{
 const begin=source.indexOf('publish.onclick=async()=>');
 const end=source.indexOf('    // A separate, authenticated server operation.',begin);
 assert.ok(begin>=0&&end>begin);
 const part=source.slice(begin,end);
 const status=part.indexOf("request('/api/admin/catalog/github-status',null)");
 const init=part.indexOf("request('/api/admin/catalog/initialize'");
 const batch=part.indexOf("request('/api/admin/catalog/batch'");
 const pub=part.indexOf("request('/api/admin/catalog/publish'");
 assert.ok(status>=0&&status<init&&init<batch&&batch<pub);
 assert.match(part,/gitReady\?\.configured!==true\|\|gitReady\?\.connected!==true\|\|/);
 assert.match(part,/gitReady\?\.writeAccess!==true/);
 assert.match(part,/if\(error\?\.preflight\)/);
});
test('D1 post-publication copy and manual backup are disabled for unknown token permissions',()=>{
 assert.match(source,/integration\.connected!==true\|\|integration\.writeAccess!==true/);
 assert.match(source,/settings\.connected===true&&settings\.writeAccess===true/);
 assert.match(source,/автоматически, затем PR будет объединён при успехе/);
});
test('the Worker returns unknown write scope rather than claiming a configured secret is enough',async()=>{
 const environment=env(),previous=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  assert.equal(options.method,'GET');
  if(url.endsWith('/git/ref/heads/bonaqu_projects'))
   return new Response(JSON.stringify({object:{sha:'a'.repeat(40)}}));
  return new Response(JSON.stringify({full_name:'bonaqu/Pandora-Saga-Build-Studio'}));
 };
 try{
  const response=await worker.fetch(makeRequest('/api/admin/catalog/github-status'),environment);
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),
   {configured:true,connected:true,writeAccess:null});
 }finally{globalThis.fetch=previous}
});
