import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';
import worker from '../worker/index.js';

// A real, fully mounted Chromium page must consume the exact authenticated
// output of the real Worker reader, never a hand-written partial payload.
// All API replies are mocked; neither staging nor production D1 is accessed.
export async function runEditorialD1Bootstrap390Smoke(browser,base){
 const manifest=buildEditorialDefaultsManifest();
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 // HTTPS is mandatory: SubtleCrypto digest is unavailable on insecure origins.
 const origin='https://pandora-editorial-bootstrap.test';
 const key='guideedit.book.ui.label.wiki';
 const sourceOnly='Исходный текст QA';
 const original=manifest.records.find(row=>row.recordKey===key&&row.field==='ru');
 assert.ok(original,'Pinned Wiki source label must exist');
 const metadata={snapshot:manifest.snapshot,source_release:manifest.release,
  sha256:manifest.digest,expected_rows:manifest.records.length};
 const rows=manifest.records.map(x=>({record_key:x.recordKey,field:x.field,value:x.value}));
 const db={prepare(sql){
  if(sql.includes('sqlite_master'))return {all:async()=>({results:[
   {name:'editorial_default_rows'},{name:'editorial_default_snapshots'}
  ]})};
  if(sql.includes('FROM editorial_default_snapshots'))
   return {bind:snapshot=>({first:async()=>snapshot===manifest.snapshot?metadata:null})};
  if(sql.includes('FROM editorial_default_rows'))
   return {bind:snapshot=>({all:async()=>({results:snapshot===manifest.snapshot?rows:[]})})};
  throw Error('Unrecognized Worker SQL');
 }};
 const response=await worker.fetch(new Request(api+'/api/editorial-defaults?snapshot='+
  manifest.snapshot),{DB:db,EDITORIAL_DEFAULTS_PREVIEW:'enabled'},{});
 assert.equal(response.status,200,'Real server reader must verify whole manifest');
 const verifiedPayload=await response.json();
 assert.equal(verifiedPayload.records.length,2734);
 assert.equal(verifiedPayload.sha256,manifest.digest);
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 const runPage=async(mode,values={})=>{
  const context=await browser.newContext({viewport:{width:1366,height:850}});
  const errors=[];
  let endpointHits=0;
  await context.addInitScript(()=>localStorage.setItem('ps-build-lang','ru'));
  await context.route('**/*',async route=>{
   const request=route.request(),url=request.url();
   if(url.startsWith(origin+'/')){
    const publicPath=url.slice(origin.length),target=base+publicPath;
    if(mode==='missing-client'&&new URL(url).pathname.endsWith(
     '/pandora-studio-editorial-defaults-client.js'))
     return route.fulfill({status:404,body:''});
    const response=await route.fetch({url:target});
    if(new URL(url).pathname.endsWith('/pandora-studio-ui-locale.js')){
     const originalJS=await response.text();
     const before="wiki:['📜 Энциклопедия','📜 Encyclopedia']";
     const after="wiki:['"+sourceOnly+"','QA source text']";
     assert.ok(originalJS.includes(before),'Source rewrite anchor must be exact');
     return route.fulfill({response,
      body:originalJS.replace(before,after),
      contentType:'text/javascript'});
    }
    return route.fulfill({response});
   }
   if(url.startsWith(base+'/'))return route.continue();
   if(!url.startsWith(api+'/'))return route.abort();
   const path=new URL(url).pathname;
   const send=(value,status=200)=>route.fulfill({status,headers,
    contentType:'application/json',body:JSON.stringify(value)});
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(path==='/api/editorial-defaults'){
    endpointHits++;
    assert.equal(request.method(),'GET');
    assert.equal(new URL(url).searchParams.get('snapshot'),manifest.snapshot);
    assert.equal(request.headers().authorization,undefined);
    if(mode==='disabled')return send({error:'Not found'},404);
    if(mode==='bad-digest'){
     const corrupt=structuredClone(verifiedPayload);
     corrupt.records[0].value+=' corrupted';
     return send(corrupt);
    }
    return send(verifiedPayload);
   }
   if(path==='/api/overrides'&&request.method()==='GET')
    return send({values:{...values}});
   if(path.startsWith('/api/catalog/')&&path.endsWith('.json')&&
    request.method()==='GET'){
    const name=path.slice('/api/catalog/'.length,-5);
    const file=name==='stringsEn'?'strings.en':name;
    const body=readFileSync(new URL('../data/os/'+file+'.json',import.meta.url),'utf8');
    return route.fulfill({status:200,headers:{...headers,
     'access-control-expose-headers':'X-PS-Catalog-Snapshot,X-PS-Catalog',
     'x-ps-catalog-snapshot':'qa-d1-snapshot-bootstrap',
     'x-ps-catalog':'d1'},contentType:'application/json',body});
   }
   if(path==='/api/library')return send({records:[]});
   if(path==='/api/runtime-capabilities')return send({ownerProgressionD1:true});
   return send({error:'Not found'},404);
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  const state=()=>page.evaluate(()=>({
   status:window.PandoraEditorialDefaults?.status?.()||{active:false,snapshot:null},
   secure:window.isSecureContext,subtle:typeof window.crypto?.subtle?.digest==='function',
   source:window.PandoraUILocale.baseText('wiki','ru'),
   rendered:window.PandoraUILocale.text('wiki','ru'),
   nav:document.querySelector('#nav [data-tab="wiki"]')?.textContent?.trim()
  }));
  return {context,page,state,hits:()=>endpointHits,errors};
 };
 const active=await runPage('enabled');
 try{
  const result=await active.state();
  assert.equal(result.secure,true,'SHA verifier requires real browser secure context');
  assert.equal(result.subtle,true,'SHA-256 must be available in Chromium');
  assert.equal(result.status.active,true,'Real browser must activate verified D1: '+
   JSON.stringify({result,fetches:active.hits(),errors:active.errors}));
  assert.equal(result.status.snapshot,manifest.snapshot);
  assert.equal(result.source,sourceOnly,'Synthetic code fallback must differ');
  assert.equal(result.rendered,original.value,'D1 caption must outrank code text');
  assert.equal(result.nav,original.value,'Mounted navigation must use D1 default');
  assert.equal(active.hits(),1,'Only one optional snapshot request on boot');
  assert.deepEqual(active.errors,[]);
 }finally{await active.context.close()}
 const ownerLabel='Правка владельца QA';
 const owner=await runPage('enabled',{[key]:JSON.stringify({ru:ownerLabel})});
 try{
  const result=await owner.state();
  assert.equal(result.status.active,true);
  assert.equal(result.rendered,ownerLabel,'Owner D1 CAS must outrank staged defaults');
  assert.equal(result.nav,ownerLabel);
  assert.deepEqual(owner.errors,[]);
 }finally{await owner.context.close()}
 for(const mode of ['disabled','bad-digest','missing-client']){
  const fallback=await runPage(mode);
  try{
   const result=await fallback.state();
   assert.equal(result.status.active,false,'Unverified D1 must not activate: '+mode);
   assert.equal(result.rendered,sourceOnly,'Source must survive: '+mode);
   assert.equal(result.nav,sourceOnly,'Visible UI must survive: '+mode);
   assert.equal(fallback.hits(),mode==='missing-client'?0:1,
    'No optional fetch without client; exactly one otherwise: '+mode);
   assert.deepEqual(fallback.errors,[]);
  }finally{await fallback.context.close()}
 }
 console.log('Chromium #390 pinned D1 defaults: full Worker SHA, live UI, CAS, disabled/invalid fallback passed');
}
