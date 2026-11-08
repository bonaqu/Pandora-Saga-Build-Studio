import assert from 'node:assert/strict';

// A successful HTTP login can still fail while switching browser-local
// owner caches. The UI must show a warning, never silently pretend that
// build recovery completed, and must recover on a later clean reload.
export async function runAccountLocalRecoveryFailureSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const username='tester_01',token='t'.repeat(43),errors=[];
 const context=await browser.newContext({viewport:{width:1280,height:850}});
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  const send=(body,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(body)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/account/login')
   return send({account:{username},token,expires:Date.now()+3600000});
  if(path==='/api/account/me')
   return send({account:{username}});
  if(path==='/api/library')return send({records:[]});
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
   document.querySelector('#profileTrigger')?.dataset.accountBootstrap==='guest');
  await page.evaluate(()=>{
   window.__testSetItem=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){
    if(String(key).startsWith('ps-build-scope-cache.v1:'))
     throw new DOMException('Simulated browser quota','QuotaExceededError');
    return window.__testSetItem.call(this,key,value);
   };
  });
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  const inputs=page.locator('#accountPanel .account-form input');
  await inputs.nth(0).fill(username);
  await inputs.nth(1).fill('An unusually long password for test 2026!');
  await page.locator('#accountPanel .account-form button[type=submit]').click();
  await page.locator('#accountPanel .account-user').waitFor({state:'visible'});
  await page.waitForFunction(()=>
   document.querySelector('#accountPanel .account-feedback')?.textContent
    .includes('Вход выполнен, но билды не открылись.'));
  assert.equal(await page.locator('#profileTrigger')
   .getAttribute('data-account-bootstrap'),'verified',
   'A local storage quota error must not revoke successful authentication');
  assert.match(await page.locator('.account-feedback').innerText(),/Проверь свободное место/);
  // Account warning survives a language switch and remains readable.
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.match(await page.locator('.account-feedback').innerText(),
   /Signed in, but your builds could not be opened/);
  await page.evaluate(()=>{Storage.prototype.setItem=window.__testSetItem;
   delete window.__testSetItem;});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(expected=>{
   const trigger=document.querySelector('#profileTrigger');
   return trigger?.dataset.accountBootstrap==='verified'&&
    localStorage.getItem('ps-build-owner-scope.v1')==='account:'+expected;
  },username,{timeout:20000});
  assert.deepEqual(errors,[]);
  console.log('Chromium account local recovery: visible warning, EN locale and reload repair passed');
 }finally{await context.close()}
}
