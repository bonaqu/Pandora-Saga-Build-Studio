import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import worker from '../worker/index.js';
import {readPublishedGameCatalog,createCatalogPullRequest}
 from '../worker/pandora-studio-github-catalog-pr.js';

const root=new URL('../',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL(name,root),'utf8'));
const importerContext={window:{}};
vm.runInNewContext(readFileSync(new URL('pandora-os-catalog-import.js',root),'utf8'),
 importerContext);
const importer=importerContext.window.PandoraCatalogImport;
const source=Object.fromEntries(importer.files.map(name=>[name,read('data/os/'+name+'.json')]));
const plan=importer.normalize(source,read('data/localization/legacy-approved.v1.json'));
const sha='a'.repeat(40),treeSha='b'.repeat(40),newTree='c'.repeat(40),newCommit='d'.repeat(40);
const snap='ps-test-snapshot';
const active={snapshot:snap,expected_counts:JSON.stringify(plan.counts)};
const token='t'.repeat(43);
const req=(path,method='GET',value=null,withAuth=true)=>
 new Request('https://ps-build-studio-cloud.bonaqu.workers.dev'+path,{
  method,headers:{Origin:'https://bonaqu.github.io',
   ...(withAuth?{Authorization:'Bearer '+token}:{}),
   ...(value?{'Content-Type':'application/json'}:{})},
  ...(value?{body:JSON.stringify(value)}:{})});
function db(){
 const queries=[];
 return {
  queries,
  prepare(sql){
   const bindings=[];
   const stmt={
    bind(...values){bindings.push(...values);return this},
    async first(){
     if(sql.includes('FROM sessions'))return {id:1};
     if(sql.includes('FROM catalog_current'))return active;
     throw Error('Unexpected SQL first: '+sql);
    },
    async all(){
     if(!sql.includes('FROM catalog_entries'))throw Error('Unexpected SQL all: '+sql);
     const [snapshot,name]=bindings;
     if(snapshot!==snap)throw Error('Wrong snapshot');
     const rows=plan.entries[name];
     if(!rows)throw Error('Unknown data: '+name);
     queries.push(name);
     return {results:rows.map(entry=>({
      record_key:entry.key,payload:JSON.stringify(entry.value)
     }))};
    }
   };
   return stmt;
  }
 };
}
const env=(configured=true)=>({DB:db(),...(configured?{GITHUB_CATALOG_TOKEN:'secure-example-'+ 'x'.repeat(35)}:{})});

test('reconstruct all 17 approved game files from one published D1 snapshot',async()=>{
 const environment=env();
 const game=await readPublishedGameCatalog(environment.DB,active);
 assert.deepEqual(Object.keys(game).sort(),[...importer.files].sort());
 for(const name of importer.files)
  assert.deepEqual(game[name],source[name],name);
 assert.equal(environment.DB.queries.length,18,'17 source groups + trade metadata');
});

test('PR integration is invisible to anonymous callers and off without a Worker Secret',async()=>{
 const plain=env(false);
 assert.equal((await worker.fetch(req('/api/admin/catalog/github-status','GET',null,false),plain)).status,401);
 const status=await worker.fetch(req('/api/admin/catalog/github-status'),plain);
 assert.deepEqual(await status.json(),{configured:false});
 const denied=await worker.fetch(req('/api/admin/catalog/github-pr','POST',{expectedActive:snap}),plain);
 assert.equal(denied.status,503);
});

test('administrator can create a narrow PR without sharing credentials with browser',async()=>{
 const environment=env(),requests=[];
 const original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;
  requests.push({path,method:options.method,body:options.body?JSON.parse(options.body):null});
  assert.ok(url.startsWith('https://api.github.com/repos/bonaqu/Pandora-Saga-Build-Studio/'));
  assert.equal(options.headers.Authorization,'Bearer '+environment.GITHUB_CATALOG_TOKEN);
  assert.equal(options.redirect,'manual','Cloudflare Workers cannot use redirect:error');
  const respond=(value,status=200)=>new Response(JSON.stringify(value),{status});
  if(path.endsWith('/git/ref/heads/catalog/snapshot-'+snap))return respond({message:'Not found'},404);
  if(path.endsWith('/git/ref/heads/bonaqu_projects'))return respond({object:{sha}});
  if(path.endsWith('/git/commits/'+sha))return respond({tree:{sha:treeSha}});
  if(path.endsWith('/git/blobs'))return respond({sha:'e'.repeat(40)});
  if(path.endsWith('/git/trees'))return respond({sha:newTree});
  if(path.endsWith('/git/commits'))return respond({sha:newCommit});
  if(path.endsWith('/git/refs'))return respond({ref:'refs/heads/catalog/snapshot-'+snap});
  if(path.endsWith('/pulls'))return respond({
   number:123,html_url:'https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/123'
  });
  throw Error('Unexpected GitHub operation: '+path);
 };
 try{
  const response=await worker.fetch(req('/api/admin/catalog/github-pr','POST',
   {expectedActive:snap}),environment);
  assert.equal(response.status,200,await response.text().catch(()=>'')); 
  // Clone response body before first read in an assertion.
 }finally{globalThis.fetch=original}
 assert.equal(requests.filter(x=>x.path.endsWith('/git/blobs')).length,17);
 const tree=requests.find(x=>x.path.endsWith('/git/trees'));
 assert.equal(tree.body.tree.length,17);
 assert.ok(tree.body.tree.every(x=>x.path.startsWith('data/os/')));
 const commit=requests.find(x=>x.path.endsWith('/git/commits')&&x.method==='POST');
 assert.deepEqual(commit.body.parents,[sha]);
 const pr=requests.find(x=>x.path.endsWith('/pulls'));
 assert.deepEqual([pr.body.head,pr.body.base],['catalog/snapshot-'+snap,'bonaqu_projects']);
 assert.ok(requests.every(x=>!JSON.stringify(x.body||'').includes(environment.GITHUB_CATALOG_TOKEN)));
});

test('stale snapshot lease refuses any GitHub writes',async()=>{
 const environment=env();
 const response=await worker.fetch(req('/api/admin/catalog/github-pr','POST',
  {expectedActive:'ps-wrong-old-snapshot'}),environment);
 assert.equal(response.status,409);
 assert.deepEqual(environment.DB.queries,[]);
});
