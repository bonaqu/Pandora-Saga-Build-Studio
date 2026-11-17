import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Real browser, real public-only startup path and mocked read-only D1.
// No requests are sent to production Worker or user accounts.
export async function runOnlineD1Required878Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const publicOrigin='http://pandora-online-required.test';
 const ctx=await browser.newContext({viewport:{width:1280,height:850}});
 let remoteUp=false,snapshot='snapshot-online-878-a',reads=0,apiWrites=0;
 const cors={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Content-Type,Authorization',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await ctx.addInitScript(()=>{localStorage.setItem('ps-build-lang','ru')});
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(publicOrigin+'/')){
   const original=url.slice(publicOrigin.length);
   const data=await route.fetch({url:base+original});
   return route.fulfill({response:data});
  }
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  if(method==='OPTIONS')return route.fulfill({status:204,headers:cors});
  if(method!=='GET'){apiWrites++;return route.fulfill({status:403,
   headers:cors,body:'{"error":"No writes in this smoke"}',
   contentType:'application/json'});}
  const path=new URL(url).pathname;
  if(path.startsWith('/api/catalog/')||path==='/api/overrides'){
   reads++;
   if(!remoteUp)return route.abort('failed');
   const name=path.startsWith('/api/catalog/')?
    path.slice('/api/catalog/'.length,-5):null;
   const body=name?readFileSync(new URL('../data/os/'+
    (name==='stringsEn'?'strings.en':name)+'.json',import.meta.url),'utf8'):
    JSON.stringify({values:{}});
   return route.fulfill({status:200,headers:{...cors,
    'access-control-expose-headers':'X-PS-Catalog-Snapshot,X-PS-Catalog',
    'x-ps-catalog':'d1','x-ps-catalog-snapshot':snapshot},
    contentType:'application/json',body});
  }
  if(path==='/api/library')return route.fulfill({status:200,headers:cors,
   contentType:'application/json',body:'{"records":[]}'});
  return route.abort();
 });
 const page=await ctx.newPage(),pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 const blocked=()=>page.locator('#startupOverlay[data-state="error"]');
 const waitReady=async()=>page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
 try{
  await page.goto(publicOrigin+'/',{waitUntil:'domcontentloaded'});
  await blocked().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('#startupArchive').count(),0);
  assert.equal(await page.locator('#startupRetry').count(),1);
  assert.match(await page.locator('#startupStatus').innerText(),/актуальные игровые данные/i);
  assert.equal(await page.locator('#catalogStatus').textContent(),'',
   'No partial or unverified game data must be exposed during failed startup');
  const firstReads=reads;
  remoteUp=true;
  await page.locator('#startupRetry').click();
  await waitReady();
  assert.ok(reads>=firstReads+10,'Retry must verify all D1 datasets and authorial copy');

  // Preserve an unsaved current character through a live network failure.
  await page.locator('#level').evaluate(input=>{
   input.value='35';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem(
   'ps-build-studio.v1')||'{}').level===35,null,{timeout:10000});
  remoteUp=false;
  await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
  await blocked().waitFor({state:'visible',timeout:12000});
  assert.match(await page.locator('#startupTitle').innerText(),/Соединение прервано/);
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('studio-live-blocked')),true);
  assert.match(await page.locator('#startupMicro').innerText(),/герой сохранён в браузере/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(
   'ps-build-studio.v1')).level),35);
  await page.locator('#startupRetry').click();
  await blocked().waitFor({state:'visible'});
  assert.equal(await page.locator('#startupOverlay').isVisible(),true,
   'A failed retry must not unlock a stale character planner');

  // A verified same-snapshot reconnect should return to the same local hero.
  remoteUp=true;
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await waitReady();
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('studio-live-blocked')),false);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(
   'ps-build-studio.v1')).level),35);
  assert.equal(await page.locator('#level').inputValue(),'35');
  assert.equal(apiWrites,0,'No offline retry should PUT a draft into D1');

  // New D1 snapshot is not silently swapped underneath the active hero.
  snapshot='snapshot-online-878-b';
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await blocked().waitFor({state:'visible',timeout:12000});
  assert.match(await page.locator('#startupTitle').innerText(),/Игровые данные обновились/);
  assert.match(await page.locator('#startupRetry').innerText(),/Сохранить и перезагрузить/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(
   'ps-build-studio.v1')).level),35);
  await Promise.all([
   page.waitForURL(url=>url.href.startsWith(publicOrigin+'/')&&
    !url.href.includes('ps-revision'),{timeout:20000}).catch(()=>{}),
   page.locator('#startupRetry').click()
  ]);
  await waitReady();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(
   'ps-build-studio.v1')).level),35,
   'Safe update must preserve the active unsaved current hero');
  assert.equal(await page.locator('#level').inputValue(),'35');
  assert.equal(apiWrites,0);
  assert.deepEqual(pageErrors,[]);
  console.log('Chromium online gate: offline startup, D1 retry, draft preservation, live reconnect, catalog version reload passed');
 }finally{await ctx.close()}
}
