import assert from 'node:assert/strict';

// Account transitions must never silently replace the character a guest was editing.
// All Worker calls are mocked; the production catalog remains read-only.
export async function runGuestDraftContinuitySmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const guestKey='e'.repeat(64),token='a'.repeat(43),username='alice_01';
 const guest={race:1,gender:0,job:8,level:27,branch:'brush',
  name:'Guest progress',stats:{'Сноровка':13},
  points:{archery:21},mastery:{archery:8},
  profile:{guild:'Guests'}};
 const account={race:1,gender:0,job:8,level:33,
  name:'Existing account draft',points:{archery:9}};
 async function check({register=false,accountDraft=false,viaBuilds=false,link=false,keepAccount=false,quotaFail=false,unnamedAccount=false}={}){
  const scenario={register,accountDraft,viaBuilds,link,keepAccount,quotaFail,unnamedAccount};
  console.log('Guest draft acceptance case:',JSON.stringify(scenario));
  const currentAccount=unnamedAccount?{...account,name:''}:account;
  const savedAccountName=currentAccount.name||'Новый герой';
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const writes=[],errors=[],savedRecords=new Map();
  await context.route('**/*',route=>{
   const req=route.request(),url=req.url();
   if(url.startsWith(base+'/'))return route.continue();
   if(!url.startsWith(api+'/'))return route.abort();
   const path=new URL(url).pathname,method=req.method();
   const headers={'access-control-allow-origin':'*',
    'access-control-allow-headers':'Authorization,Content-Type',
    'access-control-allow-methods':'GET,POST,OPTIONS'};
   const send=(value,status=200)=>route.fulfill({
    status,headers,contentType:'application/json',body:JSON.stringify(value)});
   if(method==='OPTIONS')return route.fulfill({status:204,headers});
   if(path==='/api/account/login'&&method==='POST')
    return send({account:{username},token,expires:Number.MAX_SAFE_INTEGER});
   if(path==='/api/account/register'&&method==='POST'){
    assert.equal(Object.hasOwn(req.postDataJSON(),'legacyKey'),false,
     'Registration must not upload a guest library credential');
    return send({account:{username},token,expires:Number.MAX_SAFE_INTEGER,
     recoveryCode:'r'.repeat(43)},201);
   }
   if(path==='/api/account/me')
    return send(req.headers().authorization==='Bearer '+token?
     {account:{username}}:{error:'Sign in required'},
     req.headers().authorization==='Bearer '+token?200:401);
   if(path==='/api/shared/A1234567890'&&method==='GET')
    return send({schema:1,share:{schema:1,type:'build',
     data:{race:1,gender:0,job:8,level:22,name:'Friend shared hero'}}});
   if(path==='/api/library'){
    if(method!=='GET'){
     const data=req.postDataJSON();writes.push(data);
     // A successful Worker PUT must be visible to later GETs; otherwise
     // reconciliation sees a phantom empty cloud and retries the same save.
     if(data.action==='put'&&data.entry?.id)savedRecords.set(data.entry.id,data.entry);
     if(data.action==='delete')savedRecords.delete(data.id);
    }
    return send(method==='GET'?{records:[...savedRecords.values()]}:{ok:true});
   }
   return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>
    document.querySelector('#raceGrid')?.children.length>0,
    null,{timeout:30000});
   // Seed a guest owner with a complete working character, not a saved build.
   // The optional pre-existing account draft must remain isolated until login.
   await page.evaluate(({key,guest,account})=>{
    localStorage.setItem('ps-build-library-secret.v1',key);
    localStorage.setItem('ps-build-owner-scope.v1','guest:'+key);
    localStorage.setItem('ps-build-studio.v1',JSON.stringify(guest));
    if(account)localStorage.setItem('ps-build-scope-cache.v1:account:alice_01',
     JSON.stringify(['[]',JSON.stringify(account),'[]','']));
   },{key:guestKey,guest,account:accountDraft?currentAccount:null});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(key=>
    localStorage.getItem('ps-build-owner-scope.v1')==='guest:'+key&&
    document.querySelector('#raceGrid')?.children.length>0&&
    document.querySelector('#levelOut')?.textContent==='27',
    guestKey,{timeout:30000});
   if(link){
    await page.evaluate(()=>{location.hash='#b/A1234567890'});
    const gate=page.getByRole('dialog',{name:'Вход для открытия билда'});
    await gate.waitFor({state:'visible'});
    await gate.getByRole('button',{name:'Войти'}).click();
   }else if(viaBuilds){
    await page.locator('#nav [data-tab="builds"]').click();
    await page.locator('.build-signin-gate').waitFor({state:'visible'});
    await page.locator('.build-signin-gate')
     .getByRole('button',{name:register?'Регистрация':'Войти'}).click();
   }else await page.locator('#profileTrigger').click();
   const panel=page.locator('#accountPanel');
   await panel.waitFor({state:'visible'});
   if(register&&!viaBuilds)
    await panel.getByRole('button',{name:'Регистрация'}).click();
   const inputs=panel.locator('.account-form input');
   await inputs.nth(0).fill(username);
   await inputs.nth(1).fill('long passphrase for draft continuity 2026!');
   if(register)await inputs.nth(2).fill('long passphrase for draft continuity 2026!');
   await panel.locator('.account-form button[type=submit]').click();
   console.log('Guest draft acceptance: awaiting account scope');
   await page.waitForFunction(name=>
    localStorage.getItem('ps-build-owner-scope.v1')==='account:'+name,
    username,{timeout:20000});
   if(register){
    // A new account cannot complete the guest-draft switch until its one-time
    // recovery code is acknowledged. Confirm it before checking the draft.
    await panel.locator('.account-recovery').waitFor({state:'visible'});
    await panel.getByRole('button',{name:'Я сохранил код'}).click();
   }
   if(accountDraft){
    // Both drafts differ: only a deliberate choice may replace account work.
    const chooser=page.getByRole('dialog',{name:'Продолжить персонажа?'});
    await chooser.waitFor({state:'visible'});
    assert.equal(JSON.parse(await page.evaluate(()=>
     localStorage.getItem('ps-build-studio.v1'))).name,currentAccount.name);
    assert.match(await chooser.innerText(),/Гостевой|гостевого|аккаунта/);
    assert.match(await chooser.innerText(),/Guest progress/);
    if(!unnamedAccount)assert.match(await chooser.innerText(),/Existing account draft/);
    else assert.match(await chooser.innerText(),/Герой аккаунта/);
    if(quotaFail){
     await page.evaluate(()=>{
      window.__restoreDraftSetItem=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){
       if(String(key)==='ps-build-scope-cache.v1:account:alice_01')
        throw new DOMException('Simulated full browser','QuotaExceededError');
       return window.__restoreDraftSetItem.call(this,key,value);
      };
     });
    }
    const savedResponse=accountDraft&&!keepAccount&&!quotaFail?
     page.waitForResponse(response=>response.url().endsWith('/api/library')&&
      response.request().method()==='POST'&&
      response.request().postDataJSON()?.entry?.name===savedAccountName):null;
    await chooser.getByRole('button',{name:keepAccount?
     'Оставить героя аккаунта':'Сохранить героя аккаунта и продолжить гостевого'}).click();
    if(quotaFail){
     const toast=page.locator('#studioToast');
     await toast.waitFor({state:'visible'});
     assert.match(await toast.innerText(),/Билд не сохранён/);
     assert.equal(await page.evaluate(()=>JSON.parse(
      localStorage.getItem('ps-build-studio.v1')).name),currentAccount.name,
      'Failed save must not replace the account character');
     assert.equal(await chooser.isVisible(),true,
      'Keep both choices visible when a save fails');
     await page.evaluate(()=>{
      Storage.prototype.setItem=window.__restoreDraftSetItem;
      delete window.__restoreDraftSetItem;
     });
     await chooser.getByRole('button',{name:'Оставить героя аккаунта'}).click();
    }
    if(savedResponse)await savedResponse;
   }
   console.log('Guest draft acceptance: awaiting selected hero');
   await page.waitForFunction(({name,expected})=>{
    const raw=localStorage.getItem('ps-build-studio.v1');
    if(!raw||localStorage.getItem('ps-build-owner-scope.v1')!=='account:'+name)
     return false;
    try{return JSON.parse(raw).name===expected}catch{return false}
   },{name:username,expected:keepAccount||quotaFail?currentAccount.name:guest.name},{timeout:20000});
   const active=JSON.parse(await page.evaluate(()=>
    localStorage.getItem('ps-build-studio.v1')));
   if(keepAccount||quotaFail){
    assert.equal(active.name,currentAccount.name);
    assert.equal(active.level,33);
    assert.equal(active.points.archery,9);
    assert.equal(await page.locator('#levelOut').textContent(),'33');
   }else{
    for(const property of ['race','job','level','branch','name'])
     assert.equal(active[property],guest[property],property);
    assert.equal(active.points.archery,21);
    assert.equal(active.mastery.archery,8);
    assert.equal(active.stats['Сноровка'],13);
    assert.equal(active.profile.guild,'Guests');
    assert.equal(await page.locator('#levelOut').textContent(),'27');
   }
   assert.equal(await page.evaluate(()=>
    localStorage.getItem('ps-active-build-id.v1')),null,
    'Guest character is a draft, not an automatically saved library entry');
   const backup=await page.evaluate(key=>
    localStorage.getItem('ps-build-scope-cache.v1:guest:'+key),guestKey);
   assert.equal(JSON.parse(JSON.parse(backup)[1]).name,'Guest progress',
    'The original guest draft remains available on this device');
   if(accountDraft&&!keepAccount&&!quotaFail){
    assert.equal(writes.length,1,'Explicit draft choice saves one account build');
    assert.equal(writes[0].entry.name,savedAccountName);
    // The async cloud write may complete before the client library cache
    // receives its update. Verify eventual persistence, not an arbitrary
    // race at the same moment the network recorder sees the POST.
    await page.waitForFunction(name=>{
     try{return JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')
      .some(row=>row.name===name)}catch{return false}
    },savedAccountName,{timeout:12000});
    const saved=JSON.parse(await page.evaluate(()=>
     localStorage.getItem('ps-build-library.v1')||'[]'));
    assert.equal(saved.filter(row=>row.name===savedAccountName).length,1);
    assert.equal(saved.find(row=>row.name===savedAccountName).data.level,33);
   }else assert.deepEqual(writes,[],
    'Signing in, registration and choosing the existing draft cannot auto-save');
   if(register){
    assert.equal(await page.locator('#levelOut').textContent(),'27');
    assert.equal(writes.length,0,'Registration does not auto-upload old or current builds');
   }
   if(link){
    const preview=page.getByRole('dialog',{name:'Открыть билд по ссылке?'});
    await preview.waitFor({state:'visible'});
    await preview.getByRole('button',{name:'Отмена'}).click();
    assert.equal((await page.evaluate(()=>JSON.parse(
     localStorage.getItem('ps-build-studio.v1')).name)),
     keepAccount||quotaFail?currentAccount.name:guest.name,
     'Rejecting a friend link must retain the explicitly selected draft');
   }
   if(!viaBuilds&&!accountDraft&&!link){
    assert.equal(await page.locator('#profileTrigger')
     .getAttribute('aria-expanded'),'true',
     'Header sign-in should leave the profile accessible');
    await page.locator('#profileTrigger').click();
    // During its 170ms closing animation aria-hidden is temporarily true,
    // then intentionally removed when the hidden attribute takes over.
    // Assert the stable closed state instead of racing that transition.
    await page.waitForFunction(()=>
     document.querySelector('#accountPanel')?.hidden===true&&
     document.querySelector('#profileTrigger')?.getAttribute('aria-expanded')==='false',
     null,{timeout:12000});
    await panel.waitFor({state:'hidden'});
    await page.locator('#profileTrigger').click();
    await panel.waitFor({state:'visible'});
    // Account rendering and focus restoration can finish after the panel
    // first becomes visible; check the final accessible expanded state.
    await page.waitForFunction(()=>
     document.querySelector('#profileTrigger')?.getAttribute('aria-expanded')==='true',
     null,{timeout:12000});
    assert.equal(await page.locator('#profileTrigger')
     .getAttribute('aria-expanded'),'true');
   }
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 }
 await check(); // Header login: empty account automatically continues guest.
 await check({accountDraft:true,viaBuilds:true}); // Choice protects existing work.
 await check({register:true}); // Registration keeps the guest working draft.
 await check({link:true}); // Friend link preserves the guest hero.
 await check({accountDraft:true,link:true}); // Choose guest, then preview friend link.
 await check({accountDraft:true,link:true,keepAccount:true}); // Choose account draft instead.
 await check({accountDraft:true,quotaFail:true}); // Full storage never replaces an unsaved account hero.
 await check({accountDraft:true,unnamedAccount:true}); // Unnamed account hero is saved with a readable default title.
 console.log('Chromium guest draft continuity: explicit save, quota failure, registration and shared links passed');
}
