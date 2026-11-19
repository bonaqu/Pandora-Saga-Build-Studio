import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {relayLocalAsset} from './helpers/local-asset-relay.mjs';

// Published-host Chromium path. D1 is mocked read-only and storage fails
// only AFTER the catalog and override validation, at the first local commit.
export async function runOnlineStartupStorage880Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const publicOrigin='http://pandora-startup-storage-880.test';
 for(const failedKey of ['ps-build-studio.v1','ps-build-library.v1']){
  const ctx=await browser.newContext({viewport:{width:1280,height:850}});
  let page,metaReads=0,apiWrites=0;
  const errors=[],cors={
   'access-control-allow-origin':'*',
   'access-control-allow-headers':'Authorization,Content-Type',
   'access-control-allow-methods':'GET,POST,OPTIONS',
   'access-control-expose-headers':'X-PS-Catalog-Snapshot,X-PS-Catalog'
  };
  await ctx.addInitScript(()=>localStorage.setItem('ps-build-lang','ru'));
  await ctx.route('**/*',async route=>{
   const request=route.request(),url=request.url(),method=request.method();
   if(url.startsWith(publicOrigin+'/'))return relayLocalAsset(route,base+url.slice(publicOrigin.length));
   if(url.startsWith(base+'/'))return route.continue();
   if(!url.startsWith(api+'/'))return route.abort();
   if(method==='OPTIONS')return route.fulfill({status:204,headers:cors});
   if(method!=='GET'){
    apiWrites++;
    return route.fulfill({status:403,headers:cors,
     contentType:'application/json',body:'{"error":"Read only test"}'});
   }
   const path=new URL(url).pathname;
   if(path==='/api/overrides')
    return route.fulfill({status:200,headers:cors,
     contentType:'application/json',body:'{"values":{}}'});
   if(path.startsWith('/api/catalog/')&&path.endsWith('.json')){
    const name=path.slice('/api/catalog/'.length,-5);
    const file=name==='stringsEn'?'strings.en':name;
    const body=readFileSync(new URL('../data/os/'+file+'.json',import.meta.url),'utf8');
    if(name==='meta'&&++metaReads===2){
     // A normal first load has already selected the guest storage owner.
     // The final D1 checkpoint completes successfully; only then should
     // the first persist() / persistBuilds() attempt fail.
     await page.evaluate(key=>{
      window.__startup880OriginalSetItem=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){
       if(name===key)throw new DOMException('Simulated full localStorage','QuotaExceededError');
       return window.__startup880OriginalSetItem.call(this,name,value);
      };
     },failedKey);
    }
    return route.fulfill({status:200,headers:{
     ...cors,'x-ps-catalog':'d1','x-ps-catalog-snapshot':'storage-880-a'
    },contentType:'application/json',body});
   }
   if(path==='/api/library')return route.fulfill({status:200,headers:cors,
    contentType:'application/json',body:'{"records":[]}'});
   return route.abort();
  });
  page=await ctx.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(publicOrigin+'/',{waitUntil:'domcontentloaded'});
   const overlay=page.locator('#startupOverlay');
   await page.locator('#startupOverlay[data-state="error"]').waitFor({
    state:'visible',timeout:30000
   });
   assert.equal(metaReads,2,'D1 initial load and final checkpoint succeeded');
   assert.match(await page.locator('#startupTitle').innerText(),
    /Не удалось сохранить изменения/);
   assert.match(await page.locator('#startupStatus').innerText(),
    /героя или библиотеку билдов/);
   assert.match(await page.locator('#startupRetry').innerText(),
    /Повторить сохранение/);
   assert.equal(await page.locator('body').evaluate(
    el=>el.classList.contains('studio-live-blocked')),true);
   assert.equal(apiWrites,0);
   const levelBefore=await page.locator('#level').inputValue();

   // A retry while the quota is still full must not claim success.
   await page.locator('#startupRetry').click();
   assert.equal(await overlay.isVisible(),true);
   assert.equal(await page.locator('#startupOverlay').getAttribute('data-state'),'error');
   assert.equal(metaReads,2,'A storage retry must not reload the D1 catalog');

   await page.evaluate(()=>{
    Storage.prototype.setItem=window.__startup880OriginalSetItem;
    delete window.__startup880OriginalSetItem;
   });
   await page.locator('#startupRetry').click();
   await overlay.waitFor({state:'hidden',timeout:15000});
   assert.equal(await page.locator('#level').inputValue(),levelBefore,
    'Same in-memory hero remains after storage recovery');
   const durable=await page.evaluate(()=>({
    hero:JSON.parse(localStorage.getItem('ps-build-studio.v1')||'null'),
    builds:JSON.parse(localStorage.getItem('ps-build-library.v1')||'null')
   }));
   assert.equal(durable.hero?.level,Number(levelBefore));
   assert.ok(Array.isArray(durable.builds));
   assert.equal(metaReads,2,'Local recovery must not start a new D1 boot');
   assert.equal(apiWrites,0,'Neither retry may PUT current draft to D1');
   assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
 }
 console.log('Chromium public D1 startup: both local draft and library write failures block until explicit storage recovery');
}
