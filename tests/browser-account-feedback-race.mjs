import assert from 'node:assert/strict';

// Isolated real-Chromium stress for #115 and the pending-owner part of #253.
// Every iteration holds /me while the user edits a password form. We verify
// localized feedback, private field preservation, and zero password requests.
// No production requests or credentials are involved.
export async function runAccountFeedbackRaceSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const owner='alice_01',bearer='a'.repeat(43);
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 const errors=[],requests={password:0,guestLibrary:0,me:0};
 const deferred=()=>{
  let resolve;const promise=new Promise(done=>{resolve=done});
  return {promise,resolve};
 };
 let gate=null;
 await context.addInitScript(({bearer,owner})=>{
  localStorage.setItem('ps-account-session.v1',JSON.stringify({
   token:bearer,username:owner,expires:Date.now()+3600000
  }));
 },{bearer,owner});
 await context.route('**/*',async route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  const send=(status,payload)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(payload)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  const path=new URL(url).pathname;
  if(path==='/api/account/me'){
   requests.me++;
   const activeGate=gate;
   activeGate?.started.resolve();
   if(activeGate)await activeGate.released.promise;
   return send(200,{account:{username:owner}});
  }
  if(path==='/api/account/password'){
   requests.password++;
   return send(400,{error:'This request must never be sent'});
  }
  if(path==='/api/library'){
   if(req.headers().authorization!=='Bearer '+bearer)requests.guestLibrary++;
   return send(200,{records:[]});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',err=>errors.push(err.message));
 try{
  for(let i=0;i<3;i++){
   gate={started:deferred(),released:deferred()};
   const held=gate;
   const meObserved=page.waitForRequest(req=>
    req.method()==='GET'&&req.url().startsWith(api+'/api/account/me'),
    {timeout:20000});
   const nav=i===0?page.goto(base+'/',{waitUntil:'domcontentloaded'}):
    page.reload({waitUntil:'domcontentloaded'});
   try{
    await nav;
    await meObserved;
    await held.started.promise;
    assert.equal(await page.locator('#profileTrigger')
     .getAttribute('data-account-bootstrap'),'pending');
    await page.locator('#profileTrigger').click();
    await page.locator('.account-password-toggle').click();
    const fields=page.locator('.account-password-details input');
    const candidate='Round '+i+' unique phrase 2026!';
    await fields.nth(0).fill('Previous password of isolated test');
    await fields.nth(1).fill(candidate);
    await fields.nth(2).fill('Mismatch confirmation of isolated test');
    await page.locator('.account-password-details button.account-action.primary').click();
    const feedback=page.locator('#accountPanel .account-feedback');
    assert.match(await feedback.innerText(),/Пароли не совпадают/,
     'Mismatch must produce synchronous, localized feedback');
    // Locale re-render while /me is still delayed must preserve unsaved form
    // values and the actionable validation error.
    await page.locator('#locale [data-locale="en"]').click();
    await page.locator('#profileTrigger').click();
    await page.locator('#accountPanel').waitFor({state:'visible'});
    assert.equal(await fields.nth(1).inputValue(),candidate);
    assert.match(await feedback.innerText(),/Passwords do not match/);
    // Hide the profile before releasing verification: the pending callback
    // must not discard a hidden form, its private values or feedback.
    await page.locator('#profileTrigger').click();
    held.released.resolve();
    await page.waitForFunction(()=>document.querySelector('#profileTrigger')
     ?.dataset.accountBootstrap==='verified',null,{timeout:15000});
    await page.locator('#profileTrigger').click();
    await page.locator('#accountPanel').waitFor({state:'visible'});
    assert.equal(await fields.nth(1).inputValue(),candidate);
    assert.equal(await fields.nth(2).inputValue(),
     'Mismatch confirmation of isolated test');
    assert.match(await feedback.innerText(),/Passwords do not match/);
    await page.locator('#locale [data-locale="ru"]').click();
    await page.locator('#profileTrigger').click();
    await page.locator('#accountPanel').waitFor({state:'visible'});
    assert.match(await feedback.innerText(),/Пароли не совпадают/);
    assert.equal(await fields.nth(1).inputValue(),candidate);
    assert.equal(requests.password,0,
     'Password API must never receive mismatched confirmation');
    assert.equal(requests.guestLibrary,0,
     'Authenticated pending account must never request the guest library');
   }finally{held.released.resolve()}
  }
  assert.equal(requests.me,3);
  assert.deepEqual(errors,[]);
  console.log('Chromium account feedback race matrix passed: 3 held /me sessions, RU/EN, hidden forms');
 }finally{await context.close()}
}
