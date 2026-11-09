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
 async function check({register=false,accountDraft=false,viaBuilds=false}={}){
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const writes=[],errors=[];
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
    assert.equal(req.postDataJSON()?.legacyKey,guestKey);
    return send({account:{username},token,expires:Number.MAX_SAFE_INTEGER,
     recoveryCode:'r'.repeat(43)},201);
   }
   if(path==='/api/account/me')
    return send(req.headers().authorization==='Bearer '+token?
     {account:{username}}:{error:'Sign in required'},
     req.headers().authorization==='Bearer '+token?200:401);
   if(path==='/api/library'){
    if(method!=='GET')writes.push(req.postDataJSON());
    return send(method==='GET'?{records:[]}:{ok:true});
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
   },{key:guestKey,guest,account:accountDraft?account:null});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(key=>
    localStorage.getItem('ps-build-owner-scope.v1')==='guest:'+key&&
    document.querySelector('#raceGrid')?.children.length>0&&
    document.querySelector('#levelOut')?.textContent==='27',
    guestKey,{timeout:30000});
   if(viaBuilds){
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
   await page.waitForFunction(name=>
    localStorage.getItem('ps-build-owner-scope.v1')==='account:'+name,
    username,{timeout:20000});
   if(accountDraft){
    // Both drafts differ: only a deliberate choice may replace account work.
    const chooser=page.getByRole('dialog',{name:'Продолжить персонажа?'});
    await chooser.waitFor({state:'visible'});
    assert.equal(JSON.parse(await page.evaluate(()=>
     localStorage.getItem('ps-build-studio.v1'))).name,account.name);
    await chooser.getByRole('button',{name:'Продолжить гостевого героя'}).click();
   }
   await page.waitForFunction(name=>{
    const raw=localStorage.getItem('ps-build-studio.v1');
    if(!raw||localStorage.getItem('ps-build-owner-scope.v1')!=='account:'+name)
     return false;
    try{return JSON.parse(raw).name==='Guest progress'}catch{return false}
   },username,{timeout:20000});
   const active=JSON.parse(await page.evaluate(()=>
    localStorage.getItem('ps-build-studio.v1')));
   for(const property of ['race','job','level','branch','name'])
    assert.equal(active[property],guest[property],property);
   assert.equal(active.points.archery,21);
   assert.equal(active.mastery.archery,8);
   assert.equal(active.stats['Сноровка'],13);
   assert.equal(active.profile.guild,'Guests');
   assert.equal(await page.locator('#levelOut').textContent(),'27');
   assert.equal(await page.evaluate(()=>
    localStorage.getItem('ps-active-build-id.v1')),null,
    'Guest character is a draft, not an automatically saved library entry');
   const backup=await page.evaluate(key=>
    localStorage.getItem('ps-build-scope-cache.v1:guest:'+key),guestKey);
   assert.equal(JSON.parse(JSON.parse(backup)[1]).name,'Guest progress',
    'The original guest draft remains available on this device');
   assert.deepEqual(writes,[],'Sign-in or registration cannot auto-save a build');
   if(register){
    await panel.locator('.account-recovery').waitFor({state:'visible'});
    await panel.getByRole('button',{name:'Я сохранил код'}).click();
    assert.equal(await page.locator('#levelOut').textContent(),'27');
   }
   if(!viaBuilds&&!accountDraft){
    assert.equal(await page.locator('#profileTrigger')
     .getAttribute('aria-expanded'),'true',
     'Header sign-in should leave the profile accessible');
    await page.locator('#profileTrigger').click();
    assert.equal(await panel.getAttribute('aria-hidden'),'true');
    await panel.waitFor({state:'hidden'});
    await page.locator('#profileTrigger').click();
    await panel.waitFor({state:'visible'});
    assert.equal(await page.locator('#profileTrigger')
     .getAttribute('aria-expanded'),'true');
   }
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 }
 await check(); // Header login: empty account automatically continues guest.
 await check({accountDraft:true,viaBuilds:true}); // Choice protects existing work.
 await check({register:true}); // Registration keeps the guest working draft.
 console.log('Chromium guest draft continuity: header login, conflicting drafts and registration passed');
}
