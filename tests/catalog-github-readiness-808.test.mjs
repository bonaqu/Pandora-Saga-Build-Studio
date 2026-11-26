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
test('reviewed catalog D1 publication never depends on GitHub being online',()=>{
 const start=source.indexOf('publish.onclick=async()=>');
 const end=source.indexOf('    // A separate, authenticated server operation.',start);
 assert.ok(start>=0&&end>start);
 const part=source.slice(start,end);
 const cas=part.indexOf("request('/api/admin/catalog/status',{})");
 const init=part.indexOf("request('/api/admin/catalog/initialize'");
 const batch=part.indexOf("request('/api/admin/catalog/batch'");
 const publish=part.indexOf("request('/api/admin/catalog/publish'");
 assert.ok(cas>=0&&cas<init&&init<batch&&batch<publish,
  'The existing D1 CAS + data review must precede publication');
 assert.doesNotMatch(part.slice(0,init),/github-status|github-pr|gitReady|GitHub-токен/);
 assert.doesNotMatch(part,/failure\.preflight|if\(error\?\.preflight\)/);
 assert.match(part,/expectedActive:activeSnapshot/);
 assert.match(part,/if\(current\.active!==activeSnapshot\)/);
});
test('published D1 result and background GitHub reserve are independent',()=>{
 const begin=source.indexOf('async function finalizePublication(');
 const end=source.indexOf('    function prepare()',begin);
 const part=source.slice(begin,end);
 assert.ok(begin>=0&&end>begin);
 assert.match(part,/startBackupTracking\(snapshot\)/);
 assert.match(part,/Каталог обновлён/);
 assert.doesNotMatch(part,/request\('\/api\/admin\/catalog\/github-pr'/);
 assert.doesNotMatch(part,/request\('\/api\/admin\/catalog\/github-status'/);
 // The manual advanced retry still requires an owner session and a matching
 // active revision; it is never required for the normal D1 publication.
 assert.match(source,/settings\.connected===true&&settings\.writeAccess===true/);
 assert.match(source,/github\.onclick=async/);
});
test('Worker schedules immediate nonblocking backup only after the atomic D1 pointer switch',()=>{
 const workerSource=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 const begin=workerSource.indexOf("if(path==='/api/admin/catalog/publish')");
 const end=workerSource.indexOf("return no('Unknown catalog operation',404)",begin);
 const part=workerSource.slice(begin,end);
 assert.ok(begin>=0&&end>begin);
 const tx=part.indexOf('env.DB.batch([statement,backup])');
 const status=part.indexOf("Published catalog changed during review");
 const delivery=part.indexOf('ctx.waitUntil(task)');
 assert.ok(tx>=0&&status>tx&&delivery>status,
  'Backup must never run before a committed CAS revision');
 assert.match(part,/queueBackupStatement\(env,data\.snapshot\)/);
 assert.match(part,/githubCatalogEnabled\(env\)/);
 assert.doesNotMatch(part,/await deliverCatalogBackupJob/);
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
