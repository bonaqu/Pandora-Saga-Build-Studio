import assert from 'node:assert/strict';
export async function runAccountSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev',token='t'.repeat(43);
 let calls=[],username=null,passwd=null,offlineMe=false,expiredMe=false;
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
    return send({account:{username},token,expires:Date.now()+7200000,
      recoveryCode:'r'.repeat(43)},201);
   }
   if(action==='logout')return send({ok:true});
   if(action==='me'){
    if(expiredMe)return send({error:'Sign in required'},401);
    if(offlineMe)return send({error:'Cloud temporarily unavailable'},503);
    return send({account:{username}});
   }
   if(action==='login'){
    return body.username.toLowerCase()===username&&body.password===passwd?
      send({account:{username},token,expires:Date.now()+7200000}):
      send({error:'Invalid credentials'},401);
   }
   if(action==='password'){passwd=body.password;return send({ok:true})}
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
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await page.locator('#profileTrigger').getAttribute('aria-label'),'Sign in or register');
  assert.ok(await page.getByRole('button',{name:'Register',exact:true}).isVisible());
  await page.locator('#locale [data-locale="ru"]').click();
  // Choosing a language outside the account popover intentionally closes it.
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Регистрация',exact:true}).click();
  const inputs=page.locator('#accountPanel .account-form input');
  await inputs.nth(0).fill('TestPlayer_01');
  await inputs.nth(1).fill('An unusually long phrase for my builds');
  await inputs.nth(2).fill('An unusually long phrase for my builds');
  await page.getByRole('button',{name:'Создать аккаунт'}).click();
  await page.locator('.account-recovery input').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('.account-recovery input').inputValue(),'r'.repeat(43));
  assert.match(await page.locator('.account-user').innerText(),/testplayer_01/);
  assert.equal(calls.filter(x=>x.path==='/api/library'&&x.body).length,0,
   'Account creation may not auto-save an unsaved hero');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#profileTrigger').click();
  await page.locator('.account-user').waitFor({state:'visible'});
  assert.equal((await page.locator('.account-user').innerText()).trim(),'@testplayer_01');
  await page.getByRole('button',{name:'Выйти'}).click();
  await page.getByRole('button',{name:'Войти',exact:true}).first().click();
  const login=page.locator('#accountPanel .account-form input');
  await login.nth(0).fill('testplayer_01');
  await login.nth(1).fill('An unusually long phrase for my builds');
  await page.locator('#accountPanel .account-form button[type=submit]').click();
  await page.locator('.account-user').waitFor({state:'visible'});
  assert.equal(calls.filter(c=>c.action==='register').length,1);
  assert.ok(calls.some(c=>c.action==='login'));
  const change=page.locator('#accountPanel .account-form input');
  await change.nth(0).fill('An unusually long phrase for my builds');
  await change.nth(1).fill('A new long and secure passphrase 2026!');
  await change.nth(2).fill('Different confirmation phrase 2026!');
  await page.getByRole('button',{name:'Изменить пароль'}).click();
  assert.match(await page.locator('#accountPanel .account-feedback').innerText(),/Пароли не совпадают/);
  assert.equal(calls.filter(c=>c.action==='password').length,0,
    'Mismatched password confirmation must not send an API call');
  await change.nth(2).fill('A new long and secure passphrase 2026!');
  await page.getByRole('button',{name:'Изменить пароль'}).click();
  await page.waitForFunction(()=>document.querySelector('.account-feedback')?.textContent.includes('Пароль обновлён'));
  assert.equal(calls.filter(c=>c.action==='password').length,1);
  // A transient outage must not erase a valid saved session from this browser.
  offlineMe=true;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#profileTrigger').click();
  await page.locator('.account-user').waitFor({state:'visible'});
  assert.equal((await page.locator('.account-user').innerText()).trim(),'@testplayer_01');
  assert.equal(await page.evaluate(()=>Boolean(localStorage.getItem('ps-account-session.v1'))),true);
  // A confirmed server-side 401 must still clear the revoked session.
  offlineMe=false;expiredMe=true;
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
  assert.deepEqual(errors,[]);
  console.log('Chromium account UI passed: registration, password confirmation, recovery rotation, transient 503 retention and 401 logout');
 }finally{await context.close()}
}
