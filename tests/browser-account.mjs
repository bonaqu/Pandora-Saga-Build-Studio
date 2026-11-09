import assert from 'node:assert/strict';
export async function runAccountSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev',token='t'.repeat(43);
 let calls=[],username=null,passwd=null,offlineMe=false,malformedMe=false,expiredMe=false,misidentifiedMe=false;
 let holdNextMe=false,releaseHeldMe=null,notifyHeldMe=null;
 let holdNextRegister=false,releaseHeldRegister=null,notifyHeldRegister=null;
 let holdNextPassword=false,releaseHeldPassword=null,notifyHeldPassword=null;
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=route.request().method();
  const headers={'access-control-allow-origin':'*',
    'access-control-allow-headers':'Content-Type,Authorization',
    'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const send=(value,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(value)});
  if(path==='/api/library'){
   if(method==='GET')return send({records:[]});
   calls.push({path,body:route.request().postDataJSON()});return send({ok:true});
  }
  if(path.startsWith('/api/account/')){
   const action=path.split('/').pop(),body=method==='POST'?route.request().postDataJSON():{};
   calls.push({path,action});
   if(action==='register'){
    username=body.username.toLowerCase();passwd=body.password;
    assert.match(body.legacyKey,/^[a-f0-9]{64}$/);
    if(holdNextRegister){
     holdNextRegister=false;
     await new Promise(resolve=>{releaseHeldRegister=resolve;notifyHeldRegister?.()});
    }
    return send({account:{username},token,expires:Date.now()+7200000,
      recoveryCode:'r'.repeat(43)},201);
   }
   if(action==='logout')return send({ok:true});
   if(action==='me'){
    if(holdNextMe){
     holdNextMe=false;
     await new Promise(resolve=>{releaseHeldMe=resolve;notifyHeldMe?.()});
    }
    if(expiredMe)return send({error:'Sign in required'},401);
    if(offlineMe)return send({error:'Cloud temporarily unavailable'},503);
    if(malformedMe)return send({account:{}});
    if(misidentifiedMe)return send({account:{username:'bob_222'}});
    return send({account:{username}});
   }
   if(action==='login'){
    return body.username.toLowerCase()===username&&body.password===passwd?
      send({account:{username},token,expires:Date.now()+7200000}):
      send({error:'Invalid credentials'},401);
   }
   if(action==='password'){
    if(holdNextPassword){
     holdNextPassword=false;
     await new Promise(resolve=>{releaseHeldPassword=resolve;notifyHeldPassword?.()});
    }
    passwd=body.password;return send({ok:true});
   }
   if(action==='recover'){
    if(body.recoveryCode!=='r'.repeat(43)||body.username.toLowerCase()!==username)
     return send({error:'Invalid recovery code'},401);
    passwd=body.password;
    return send({account:{username},token,expires:Date.now()+7200000,
      recoveryCode:'s'.repeat(43)});
   }
   return send({error:'Unknown route'},404);
  }
  return route.abort();
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await page.locator('#profileTrigger').getAttribute('aria-label'),'Sign in or register');
  assert.ok(await page.getByRole('button',{name:'Register',exact:true}).isVisible());
  await page.locator('#locale [data-locale="ru"]').click();
  // Choosing a language outside the account popover intentionally closes it.
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  // A queued Enter/autofill submit on a detached login form must not be
  // interpreted as registration after mode switches. The old handler used
  // global mode with stale local fields, which could throw or send a request.
  const guestForm=page.locator('#accountPanel .account-form');
  const oldLoginForm=await guestForm.elementHandle();
  await guestForm.locator('input').nth(0).fill('TestPlayer_01');
  await guestForm.locator('input').nth(1).fill('An unusually long phrase for my builds');
  await page.getByRole('button',{name:'Регистрация',exact:true}).click();
  await oldLoginForm.evaluate(el=>el.dispatchEvent(
   new Event('submit',{bubbles:true,cancelable:true})));
  await oldLoginForm.dispose();
  assert.equal(calls.filter(c=>['login','register','recover'].includes(c.action)).length,0,
   'Detached login must not submit to the new registration mode');
  assert.deepEqual(errors,[],'Detached login must not access a missing confirmation input');

  const inputs=page.locator('#accountPanel .account-form input');
  await inputs.nth(0).fill('TestPlayer_01');
  await inputs.nth(1).fill('An unusually long phrase for my builds');
  await inputs.nth(2).fill('An unusually long phrase for my builds');
  const oldRegisterForm=await guestForm.elementHandle();
  await page.getByRole('button',{name:'Войти',exact:true}).first().click();
  await oldRegisterForm.evaluate(el=>el.dispatchEvent(
   new Event('submit',{bubbles:true,cancelable:true})));
  await oldRegisterForm.dispose();
  await page.waitForTimeout(120);
  assert.equal(calls.filter(c=>['login','register','recover'].includes(c.action)).length,0,
   'Detached registration must not send credentials to the login API');
  await page.getByRole('button',{name:'Регистрация',exact:true}).click();
  await inputs.nth(0).fill('TestPlayer_01');
  await inputs.nth(1).fill('An unusually long phrase for my builds');
  await inputs.nth(2).fill('An unusually long phrase for my builds');
  holdNextRegister=true;
  const registerSent=new Promise(resolve=>{notifyHeldRegister=resolve});
  await page.getByRole('button',{name:'Создать аккаунт'}).click();
  await registerSent;
  // A slow registration cannot lose its one-time recovery secret when the
  // user switches language. New buttons must not submit a second request.
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await page.getByRole('button',{name:'Register',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Sign in',exact:true}).isDisabled(),true);
  assert.equal(await page.locator('#accountPanel .account-form button[type=submit]').isDisabled(),true);
  assert.equal(await inputs.nth(0).inputValue(),'TestPlayer_01');
  assert.equal(calls.filter(c=>c.action==='register').length,1);
  await page.locator('#locale [data-locale="ru"]').click();
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  const registerResponse=page.waitForResponse(response=>response.url().endsWith('/api/account/register'));
  releaseHeldRegister();
  await registerResponse;
  await page.locator('.account-recovery input').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('.account-recovery input').inputValue(),'r'.repeat(43));
  assert.match(await page.locator('.account-user').innerText(),/testplayer_01/);
  // One-time secret is not lost on popover close and can be dismissed by its owner.
  await page.locator('#profileTrigger').click();
  assert.equal(await page.locator('#accountPanel').isVisible(),false);
  await page.locator('#profileTrigger').click();
  assert.equal(await page.locator('.account-recovery input').inputValue(),'r'.repeat(43));
  await page.getByRole('button',{name:'Я сохранил код'}).click();
  assert.equal(await page.locator('.account-recovery').count(),0);
  assert.equal(calls.filter(x=>x.path==='/api/library'&&x.body).length,0,
   'Account creation may not auto-save an unsaved hero');
  // Delayed session bootstrap must not erase an already-open password form.
  holdNextMe=true;
  const heldMe=new Promise(resolve=>{notifyHeldMe=resolve});
  await page.reload({waitUntil:'domcontentloaded'});
  await heldMe;
  // Verification is informative, not a lock on the saved account form.
  assert.equal(await page.locator('#profileTrigger').getAttribute('data-account-bootstrap'),'pending');
  await page.locator('#profileTrigger').click();
  await page.locator('.account-bootstrap-pending').waitFor({state:'visible'});
  await page.locator('.account-user').waitFor({state:'visible'});
  await page.locator('.account-password-toggle').click();
  const pendingChange=page.locator('.account-password-details input');
  await pendingChange.nth(0).fill('An unusually long phrase for my builds');
  await pendingChange.nth(1).fill('An example new password 2026');
  await pendingChange.nth(2).fill('Different confirmation value');
  await page.locator('.account-password-details button.account-action.primary').click();
  assert.match(await page.locator('#accountPanel .account-feedback').innerText(),
   /Пароли не совпадают/);
  const verifiedMe=page.waitForResponse(response=>
   response.url().endsWith('/api/account/me'));
  // Closing the popover while /me is still in flight must not discard the
  // passwords or the validation error from the same verified account.
  await page.locator('#profileTrigger').click();
  assert.equal(await page.locator('#accountPanel').isVisible(),false);
  releaseHeldMe();
  await verifiedMe;
  await page.locator('.account-bootstrap-pending').waitFor({state:'detached'});
  assert.equal(await page.locator('#profileTrigger').getAttribute('data-account-bootstrap'),'verified');
  await page.evaluate(()=>new Promise(resolve=>
   requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await pendingChange.nth(1).inputValue(),'An example new password 2026',
   'Background /me must not replace the DOM of a temporarily hidden form');
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await pendingChange.nth(1).inputValue(),'An example new password 2026',
   'Late /me verification must preserve the filled form even if its popover was closed');
  assert.match(await page.locator('#accountPanel .account-feedback').innerText(),
   /Пароли не совпадают/,'Late /me must preserve confirmation feedback');
  assert.equal(calls.filter(c=>c.action==='password').length,0);
  assert.equal((await page.locator('.account-user').innerText()).trim(),'@testplayer_01');
  // Switching RU/EN in the header used to recreate the profile and erase
  // password inputs plus feedback, even though the account had not changed.
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await page.locator('.account-password-details').getAttribute('open'),'');
  assert.equal(await pendingChange.nth(1).inputValue(),'An example new password 2026');
  assert.equal(await pendingChange.nth(2).inputValue(),'Different confirmation value');
  assert.match(await page.locator('#accountPanel .account-feedback').innerText(),/Passwords do not match/);
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await pendingChange.nth(1).inputValue(),'An example new password 2026');
  assert.match(await page.locator('#accountPanel .account-feedback').innerText(),/Пароли не совпадают/);
  // A same-owner forced panel remount must keep confirmation feedback even
  // when the previous feedback DOM node has already been discarded.
  await page.locator('#accountPanel').evaluate(panel=>panel.replaceChildren());
  await page.locator('#profileTrigger').click();
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.match(await page.locator('#accountPanel .account-feedback').innerText(),
   /Пароли не совпадают/,'Same-identity remount preserves feedback');
  await page.getByRole('button',{name:'Выйти из аккаунта'}).click();
  await page.getByRole('button',{name:'Войти',exact:true}).first().click();
  const login=page.locator('#accountPanel .account-form input');
  await login.nth(0).fill('testplayer_01');
  await login.nth(1).fill('An unusually long phrase for my builds');
  await page.locator('#accountPanel .account-form button[type=submit]').click();
  await page.locator('.account-user').waitFor({state:'visible'});
  assert.equal(calls.filter(c=>c.action==='register').length,1);
  assert.ok(calls.some(c=>c.action==='login'));
  assert.equal(await page.locator('.account-password-details').getAttribute('open'),null);
  assert.equal(await page.locator('.account-password-details input').first().isVisible(),false);
  await page.locator('.account-password-toggle').click();
  // A queued click or Enter on an old form must not submit passwords after
  // RU/EN has replaced the DOM. Test only with fake local API credentials.
  const retiredForm=await page.locator('.account-password-details form').elementHandle();
  const retiredButton=await page.locator('.account-password-details button.account-action.primary').elementHandle();
  const retiredInputs=page.locator('.account-password-details input');
  await retiredInputs.nth(0).fill('An unusually long phrase for my builds');
  await retiredInputs.nth(1).fill('Unused old password 2026!');
  await retiredInputs.nth(2).fill('Unused old password 2026!');
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  const callsBeforeRetired=calls.filter(c=>c.action==='password').length;
  await retiredButton.evaluate(button=>button.click());
  await retiredForm.evaluate(form=>form.dispatchEvent(
   new Event('submit',{bubbles:true,cancelable:true})));
  await page.waitForTimeout(100);
  assert.equal(calls.filter(c=>c.action==='password').length,callsBeforeRetired,
   'Removed password controls must not submit after a locale remount');
  assert.equal(await page.locator('#accountPanel .account-feedback').innerText(),'',
   'Removed form events must not overwrite the visible account feedback');
  await retiredButton.dispose();
  await retiredForm.dispose();
  const change=page.locator('#accountPanel .account-form input');
  await change.nth(0).fill('An unusually long phrase for my builds');
  await change.nth(1).fill('A new long and secure passphrase 2026!');
  await change.nth(2).fill('Different confirmation phrase 2026!');
  await page.locator('.account-password-details button.account-action.primary').click();
  await page.waitForFunction(()=>document.querySelector('#accountPanel .account-feedback')
   ?.textContent.includes('Пароли не совпадают.'));
  assert.match(await page.locator('#accountPanel .account-feedback').innerText(),/Пароли не совпадают/);
  assert.equal(calls.filter(c=>c.action==='password').length,0,
    'Mismatched password confirmation must not send an API call');
  await change.nth(2).fill('A new long and secure passphrase 2026!');
  await page.locator('.account-password-details button.account-action.primary').click();
  await page.waitForFunction(()=>document.querySelector('.account-feedback')?.textContent.includes('Пароль обновлён'));
  assert.equal(calls.filter(c=>c.action==='password').length,1);
  assert.equal(await page.locator('.account-password-details').getAttribute('open'),null);
  // The pending change finishes after a RU -> EN locale rerender, which
  // creates new password inputs. Its success must scrub the LIVE form.
  holdNextPassword=true;
  const localePasswordSent=new Promise(resolve=>{notifyHeldPassword=resolve});
  await page.locator('.account-password-toggle').click();
  const changing=page.locator('.account-password-details input');
  await changing.nth(0).fill('A new long and secure passphrase 2026!');
  await changing.nth(1).fill('After account language change 2026!');
  await changing.nth(2).fill('After account language change 2026!');
  await page.locator('.account-password-details button.account-action.primary').click();
  await localePasswordSent;
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await page.locator('.account-password-details').getAttribute('open'),'');
  const remounted=page.locator('.account-password-details input');
  assert.equal(await remounted.nth(1).inputValue(),'After account language change 2026!');
  const inFlightButton=page.locator('.account-password-details button.account-action.primary');
  assert.equal(await inFlightButton.isDisabled(),true,
   'A remounted form cannot launch a second in-flight password change');
  const localePasswordResponse=page.waitForResponse(response=>
   response.url().endsWith('/api/account/password'));
  releaseHeldPassword();
  await localePasswordResponse;
  await page.waitForFunction(()=>document.querySelector('.account-feedback')
   ?.textContent.includes('Password updated.'));
  assert.equal(await page.locator('.account-password-details').getAttribute('open'),null,
   'Success must close the current remounted password form');
  assert.deepEqual(await remounted.evaluateAll(inputs=>inputs.map(x=>x.value)),['','',''],
   'Current password inputs must be cleared after the delayed success');
  assert.equal(await inFlightButton.isDisabled(),false);
  await page.locator('#locale [data-locale="ru"]').click();
  // A transient outage must not erase a valid saved session from this browser.
  offlineMe=true;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#profileTrigger').click();
  await page.locator('.account-user').waitFor({state:'visible'});
  assert.equal((await page.locator('.account-user').innerText()).trim(),'@testplayer_01');
  assert.equal(await page.evaluate(()=>Boolean(localStorage.getItem('ps-account-session.v1'))),true);
  // Some proxies return HTTP 200 with incomplete JSON while recovering.
  // That is not evidence that this account's bearer has been revoked.
  offlineMe=false;malformedMe=true;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
   document.querySelector('#profileTrigger')?.dataset.accountBootstrap==='offline',
   null,{timeout:15000});
  assert.equal(await page.evaluate(()=>
   JSON.parse(localStorage.getItem('ps-account-session.v1'))?.username),
   'testplayer_01','Incomplete /me must not erase a persisted owner');
  await page.locator('#profileTrigger').click();
  await page.locator('.account-user').waitFor({state:'visible'});
  assert.match(await page.locator('.account-user').innerText(),/testplayer_01/);
  // A confirmed server-side 401 must still clear the revoked session.
  malformedMe=false;expiredMe=true;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#profileTrigger').click();
  await page.locator('.account-tabs').waitFor({state:'visible'});
  assert.equal(await page.locator('.account-user').count(),0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('ps-account-session.v1')),null);
  await page.getByRole('button',{name:'Восстановить'}).click();
  const recoveryInputs=page.locator('#accountPanel .account-form input');
  await recoveryInputs.nth(0).fill('testplayer_01');
  await recoveryInputs.nth(1).fill('Yet another long secret for recovery!');
  await recoveryInputs.nth(2).fill('A mismatched recovery confirmation!');
  await recoveryInputs.nth(3).fill('r'.repeat(43));
  await page.getByRole('button',{name:'Восстановить пароль'}).click();
  assert.match(await page.locator('#accountPanel .account-feedback').innerText(),/Пароли не совпадают/);
  assert.equal(calls.filter(c=>c.action==='recover').length,0,
    'Recovery code must never be consumed with an unconfirmed new password');
  await recoveryInputs.nth(2).fill('Yet another long secret for recovery!');
  await page.getByRole('button',{name:'Восстановить пароль'}).click();
  await page.locator('.account-recovery input').waitFor({state:'visible'});
  assert.equal(await page.locator('.account-recovery input').inputValue(),'s'.repeat(43));
  assert.equal(calls.filter(c=>c.action==='recover').length,1);
  // A delayed password reply is bound to the login that sent it. A sign-out
  // followed by a NEW login must make that reply stale even if the mock
  // returns exactly the same bearer token for both sessions.
  holdNextPassword=true;
  const passwordSent=new Promise(resolve=>{notifyHeldPassword=resolve});
  await page.locator('.account-recovery input').waitFor({state:'visible'});
  await page.locator('.account-password-toggle').click();
  const delayed=page.locator('.account-password-details input');
  await delayed.nth(0).fill('Yet another long secret for recovery!');
  await delayed.nth(1).fill('Delayed password for isolated race 2026!');
  await delayed.nth(2).fill('Delayed password for isolated race 2026!');
  await page.locator('.account-password-details button.account-action.primary').click();
  await passwordSent;
  await page.getByRole('button',{name:'Выйти из аккаунта'}).click();
  await page.locator('.account-tabs').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Войти',exact:true}).click();
  const afterRace=page.locator('#accountPanel .account-form input');
  await afterRace.nth(0).fill('testplayer_01');
  // The server has not finished rotating the password, so the old secret
  // still authenticates this separate session with the same mock bearer.
  await afterRace.nth(1).fill('Yet another long secret for recovery!');
  await page.locator('#accountPanel .account-form button[type=submit]').click();
  await page.locator('.account-user').waitFor({state:'visible'});
  await page.locator('.account-password-toggle').click();
  const newSessionPassword=page.locator('.account-password-details input');
  await newSessionPassword.nth(1).fill('New account draft must survive');
  // Install the response listener before releasing the held request.
  const passwordResponse=page.waitForResponse(response=>
   response.url().endsWith('/api/account/password'));
  releaseHeldPassword();
  await passwordResponse;
  assert.match(await page.locator('.account-user').innerText(),/testplayer_01/);
  assert.equal(await page.locator('.account-password-details').getAttribute('open'),'',
   'Late old-session success may not close the new session form');
  assert.equal(await newSessionPassword.nth(1).inputValue(),
   'New account draft must survive','Old response must not scrub another login');
  assert.doesNotMatch(await page.locator('#accountPanel .account-feedback').innerText(),
   /Пароль обновлён/,'Old response must not announce success in a new session');
  // A valid bearer that unexpectedly resolves to a different owner must not
  // be allowed to keep that token while attaching the saved-build guest scope.
  expiredMe=false;misidentifiedMe=true;
  const cloudWritesBefore=calls.filter(c=>c.path==='/api/library'&&c.body).length;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>localStorage.getItem('ps-account-session.v1')===null);
  await page.locator('#profileTrigger').click();
  await page.locator('.account-tabs').waitFor({state:'visible'});
  assert.equal(await page.locator('.account-user').count(),0);
  assert.equal(calls.filter(c=>c.path==='/api/library'&&c.body).length,cloudWritesBefore,
   'Mismatched /me identity must not create a new cross-owner saved-build PUT');
  assert.deepEqual(errors,[]);
  console.log('Chromium account UI passed: registration, recovery rotation, 503/incomplete-200 retention, 401 logout, mismatched 200 identity rejection');
 }finally{await context.close()}
}
