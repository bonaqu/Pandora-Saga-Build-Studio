import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {relayLocalAsset} from './helpers/local-asset-relay.mjs';

// Public-host real Chromium: 4 rapid page refreshes, transient 429/5xx and
// network aborts, then a prolonged outage that recovers without a fifth F5.
// Every Worker request is intercepted; never writes or reads production D1.
export async function runLiveD1Retry882Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const publicOrigin='http://pandora-repeat-f5-882.test';
 const ctx=await browser.newContext({viewport:{width:1280,height:850}});
 const errors=[],reads=new Map(),cache=new Map();
 let mode='flaky',writes=0,loads=0,transient=0;
 const initialFailures=new Map([
  ['meta',[429]],['skills',[503]],['items',['abort']],
  ['racialPassives',[504]],['overrides',[502]],['maps',[429]]
 ]);
 const headers={
  'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS',
  'access-control-expose-headers':'X-PS-Catalog-Snapshot,X-PS-Catalog',
  'x-ps-catalog':'d1','x-ps-catalog-snapshot':'f5-retry-882-a'
 };
 await ctx.addInitScript(()=>localStorage.setItem('ps-build-lang','ru'));
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(publicOrigin+'/'))return relayLocalAsset(route,base+url.slice(publicOrigin.length));
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(method!=='GET'){
   writes++;return route.fulfill({status:403,headers,
    contentType:'application/json',body:'{"error":"Test is read-only"}'});
  }
  const path=new URL(url).pathname;
  if(!path.startsWith('/api/catalog/')&&path!=='/api/overrides'){
   if(path==='/api/account/me')return route.fulfill({status:401,headers,
    contentType:'application/json',body:'{"error":"Sign in required"}'});
   return route.abort();
  }
  const name=path==='/api/overrides'?'overrides':
   path.slice('/api/catalog/'.length,-5);
  reads.set(name,(reads.get(name)||0)+1);
  if(mode==='down'){
   return route.fulfill({status:503,headers,contentType:'application/json',
    body:'{"error":"temporary failure"}'});
  }
  const failures=initialFailures.get(name);
  if(mode==='flaky'&&failures?.length){
   transient++;
   const failure=failures.shift();
   if(failure==='abort')return route.abort('failed');
   return route.fulfill({status:failure,headers,contentType:'application/json',
    body:'{"error":"simulated temporary failure"}'});
  }
  let body;
  if(name==='overrides')body='{"values":{}}';
  else{
   const file=name==='stringsEn'?'strings.en':name;
   if(!cache.has(file))cache.set(file,readFileSync(
    new URL('../data/os/'+file+'.json',import.meta.url),'utf8'));
   body=cache.get(file);
  }
  return route.fulfill({status:200,headers,contentType:'application/json',body});
 });
 const page=await ctx.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('load',()=>{loads++});
 // The 420-ms close animation can become visually hidden before native
 // inert is released. A ready editor requires the DOM's actual hidden flag.
 const ready=()=>page.waitForFunction(()=>
  document.querySelector('#startupOverlay')?.hidden===true,
  null,{timeout:50000});
 try{
  await page.goto(publicOrigin+'/',{waitUntil:'domcontentloaded'});
  for(let i=0;i<4;i++)await page.reload({waitUntil:'domcontentloaded'});
  await ready();
  assert.equal(await page.evaluate(()=>document.querySelector('main').inert),false);
  assert.match(await page.locator('#catalogStatus').innerText(),/навыков/);
  assert.ok(transient>=2,'Several transient D1/transport failures must be exercised');
  assert.ok((reads.get('meta')||0)>=2,
   'A fully verified load must still perform its independent final D1 checkpoint');
  assert.ok((reads.get('items')||0)>=1);
  assert.equal(writes,0);
  assert.equal(await page.locator('#startupArchive').count(),0);

  // A working page must keep a character draft through a prolonged failure.
  await page.locator('#level').evaluate(el=>{
   el.value='35';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>
   JSON.parse(localStorage.getItem('ps-build-studio.v1')||'{}').level===35,
   null,{timeout:10000});
  mode='down';
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay[data-state="error"]').waitFor({
   state:'visible',timeout:50000
  });
  assert.match(await page.locator('#startupTitle').innerText(),/Нет подключения/);
  assert.equal(await page.evaluate(()=>document.querySelector('main').inert),true);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(
   'ps-build-studio.v1')).level),35);
  const navigationCount=loads;
  mode='up';
  // The existing bounded backoff runs startStudio automatically. The user
  // should never need another F5 or to press Retry after the Worker recovers.
  await ready();
  assert.equal(loads,navigationCount,'Recovered D1 must not trigger a forced navigation');
  assert.equal(await page.locator('#level').inputValue(),'35');
  assert.equal(await page.evaluate(()=>document.querySelector('main').inert),false);
  assert.equal(writes,0,'The retry must never POST a hero or overwrite D1');
  assert.deepEqual(errors,[]);
  console.log('Chromium 0.882: repeated F5 + 429/5xx/abort, D1 checkpoint, background recovery without F5 and unchanged draft passed');
 }finally{await ctx.close()}
}
