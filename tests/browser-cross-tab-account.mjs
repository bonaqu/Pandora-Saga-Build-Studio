import assert from 'node:assert/strict';

export async function runCrossTabAccountIsolationSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const tokenA='a'.repeat(43),tokenB='b'.repeat(43),guestKey='9'.repeat(64);
 const usernames={[tokenA]:'alice_01',[tokenB]:'bob_222'},puts=[];
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.route('**/*',async route=>{
  const url=route.request().url(),request=route.request();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const method=request.method(),path=new URL(url).pathname;
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  const send=(status,body)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(body)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const bearer=request.headers().authorization?.slice(7);
  if(path==='/api/account/me')
   return usernames[bearer]?send(200,{account:{username:usernames[bearer]}}):
    send(401,{error:'Sign in required'});
  if(path==='/api/account/logout'&&method==='POST')
   return send(200,{ok:true});
  if(path==='/api/library'){
   if(method==='GET')return send(200,{records:[]});
   const payload=request.postDataJSON();puts.push({bearer,payload});
   return send(200,{ok:true});
  }
  return route.abort();
 });
 const tabA=await context.newPage(),tabB=await context.newPage(),errors=[];
 for(const page of [tabA,tabB])page.on('pageerror',err=>errors.push(err.message));
 async function login(page,token,username){
  const meStatuses=[];
  const onMeResponse=response=>{
   if(response.url().startsWith(api+'/api/account/me'))
    meStatuses.push(response.status());
  };
  page.on('response',onMeResponse);
  try{
  await page.evaluate(({token,username,guestKey})=>{
   localStorage.setItem('ps-build-library-secret.v1',guestKey);
   localStorage.setItem('ps-account-session.v1',JSON.stringify({
    username,token,expires:Date.now()+3600000
   }));
  },{token,username,guestKey});
  await page.reload({waitUntil:'domcontentloaded'});
  // The owner marker changes before the account and OS catalog finish
  // rendering. A save issued mid-render can lose the typed name.
  // Count text is locale-dependent and may re-render while D1 snapshots
  // refresh. The editor bootstrap condition is the real race choices and
  // hero portrait, alongside the account's own owner-scope/profile marker.
  try{
   await page.waitForFunction(expected=>{
    const profile=document.querySelector('#profileTrigger')?.title||'';
    return localStorage.getItem('ps-build-owner-scope.v1')==='account:'+expected&&
     document.querySelector('#raceGrid')?.children.length>0&&
     !!document.querySelector('#hero')?.getAttribute('src')&&
     profile.includes(expected)&&
     document.querySelector('#profileTrigger')?.dataset.accountBootstrap==='verified';
   },username,{timeout:25000});
  }catch(error){
   const diagnostic=await page.evaluate(()=>({
    ownerType:(localStorage.getItem('ps-build-owner-scope.v1')||'').split(':',1)[0]||'none',
    raceCount:document.querySelector('#raceGrid')?.children.length||0,
    hasHero:!!document.querySelector('#hero')?.getAttribute('src'),
    profile:document.querySelector('#profileTrigger')?.title||'',
    accountBootstrap:document.querySelector('#profileTrigger')?.dataset.accountBootstrap||'unknown',
    catalogStatus:document.querySelector('#catalogStatus')?.textContent||'',
    readyState:document.readyState
   }));
   // Diagnostic contains HTTP status codes only, never secret-bearing headers.
   diagnostic.meStatuses=meStatuses.slice(-5);
   // No session tokens, passwords or private keys in CI logs.
   throw Error('Cross-tab account bootstrap for '+username+
    ' did not complete: '+JSON.stringify(diagnostic)+'; '+error.message);
  }
  }finally{page.off('response',onMeResponse)}
 }
 async function save(page,name,expectedToken){
  if(!await page.locator('.build-name-input').isVisible())
   await page.locator('#nav [data-tab="builds"]').click();
  const input=page.locator('.build-name-input');
  await input.fill(name);
  assert.equal(await input.inputValue(),name,'Save form must retain typed name');
  // The local card can appear before the Worker save is acknowledged. Require
  // the intended account's bearer token and the actual POST response.
  const persisted=page.waitForResponse(response=>{
   if(!response.url().startsWith(api+'/api/library')||
    response.request().method()!=='POST'||!response.ok())return false;
   try{return response.request().headers().authorization==='Bearer '+expectedToken&&
    response.request().postDataJSON()?.entry?.name===name}
   catch{return false}
  },{timeout:20000});
  await page.getByRole('button',{name:'Сохранить новый билд'}).click();
  await page.locator('.build-card h3').filter({hasText:name}).waitFor({state:'visible'});
  await persisted;
 }
 try{
  await tabA.goto(base+'/',{waitUntil:'domcontentloaded'});
  await login(tabA,tokenA,'alice_01');
  await save(tabA,'Alice first',tokenA);
  assert.equal(await tabA.locator('.build-transfer').count(),1,
   'Signed-in players may explicitly import older builds without exposing a guest secret');
  assert.equal(await tabA.locator('.build-transfer-key').inputValue(),'',
   'Legacy library keys must not be pre-filled for a signed-in account');
  await tabB.goto(base+'/',{waitUntil:'domcontentloaded'});
  await login(tabB,tokenB,'bob_222');
  await save(tabB,'Bob only',tokenB);
  // Alice is still running in tab A with its original in-memory session.
  await save(tabA,'Alice second',tokenA);
  const bob=await tabB.evaluate(()=>{
   return {
    correctOwner:localStorage.getItem('ps-build-owner-scope.v1')==='account:bob_222',
    rows:JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]'),
    draft:JSON.parse(localStorage.getItem('ps-build-studio.v1')||'{}')
   };
  });
  assert.equal(bob.correctOwner,true,'Bob must retain his owner-scoped primary keys');
  assert.deepEqual(bob.rows.map(x=>x.name),['Bob only']);
  const aliceBackup=await tabA.evaluate(()=>
   JSON.parse(localStorage.getItem('ps-build-scope-cache.v1:account:alice_01')));
  assert.deepEqual(JSON.parse(aliceBackup[0]).map(x=>x.name).sort(),
   ['Alice first','Alice second']);
  assert.ok(puts.some(x=>x.bearer===tokenA&&x.payload.entry.name==='Alice second'));
  assert.ok(puts.some(x=>x.bearer===tokenB&&x.payload.entry.name==='Bob only'));
  assert.equal(puts.some(x=>x.bearer===tokenB&&x.payload.entry.name.startsWith('Alice')),false);
  await login(tabA,tokenA,'alice_01');
  if(!await tabA.locator('.build-name-input').isVisible())
   await tabA.locator('#nav [data-tab="builds"]').click();
  assert.deepEqual((await tabA.locator('.build-card h3').allTextContents()).sort(),
   ['Alice first','Alice second']);
  await login(tabB,tokenB,'bob_222');
  if(!await tabB.locator('.build-name-input').isVisible())
   await tabB.locator('#nav [data-tab="builds"]').click();
  assert.deepEqual(await tabB.locator('.build-card h3').allTextContents(),['Bob only']);
  // The last login belonged to Bob and is currently stored by this origin.
  // Alice's stale tab must never erase Bob's persisted session on logout.
  if(await tabA.locator('#detailPanel').evaluate(node=>node.classList.contains('is-open')))
   await tabA.locator('#dockClose').click();
  await tabA.locator('#profileTrigger').click();
  await tabA.getByRole('button',{name:'Выйти из аккаунта'}).click();
  const sessionAfterAliceLogout=await tabB.evaluate(()=>
   JSON.parse(localStorage.getItem('ps-account-session.v1')||'null'));
  assert.equal(sessionAfterAliceLogout?.token,tokenB,
   'A second account logout may not remove Bob’s persistent session');
  await tabB.reload({waitUntil:'domcontentloaded'});
  if(await tabB.locator('#detailPanel').evaluate(node=>node.classList.contains('is-open')))
   await tabB.locator('#dockClose').click();
  await tabB.locator('#profileTrigger').click();
  await tabB.locator('.account-user').waitFor({state:'visible'});
  assert.match(await tabB.locator('.account-user').innerText(),/bob_222/);
  await tabB.locator('#profileTrigger').click();
  // A second tab with Bob's SAME bearer must log out locally if the owner
  // signs out. Unlike different account tabs, it shares a revoked token.
  const tabC=await context.newPage();
  tabC.on('pageerror',error=>errors.push(error.message));
  await tabC.goto(base+'/',{waitUntil:'domcontentloaded'});
  // The original intermittent failure happened while the third tab restored
  // Bob, and the shared session was already persisted by a different tab.
  // Hold /me deterministically to prove it remains an account (not guest)
  // while authentication is pending. No extra retries or larger timeouts.
  let releaseMe;
  const heldMe=new Promise(resolve=>{releaseMe=resolve});
  let delayedMeTriggered=false,guestLibraryBeforeMe=0;
  const countGuest=request=>{
   if(request.url().startsWith(api+'/api/library')&&
    request.headers().authorization!=='Bearer '+tokenB)guestLibraryBeforeMe++;
  };
  tabC.on('request',countGuest);
  await tabC.route('**/api/account/me',async route=>{
   // CORS OPTIONS belongs to the context's regular 204 preflight handler.
   // Intercept ONLY the authenticated GET. Otherwise the browser rejects
   // the preflight and no /me response ever reaches the page.
   if(route.request().method()==='OPTIONS')
    return route.fallback();
   // Hold *every* authenticated GET, not only the first. The app can
   // issue a second /me while a first request is pending. Letting that
   // second request fall through verifies the profile early and makes
   // the pending-state test fail even though ownership stayed correct.
   delayedMeTriggered=true;
   await heldMe;
   return route.fulfill({status:200,contentType:'application/json',
    headers:{'access-control-allow-origin':'*',
     'access-control-allow-headers':'Content-Type,Authorization',
     'access-control-allow-methods':'GET,POST,OPTIONS'},
    body:JSON.stringify({account:{username:'bob_222'}})});
  });
  // A profile can show "pending" before fetch reaches Playwright routing.
  // Observe the actual GET first, then assert the intermediate UI state.
  const meStarted=tabC.waitForRequest(request=>
   request.method()==='GET'&&request.url().startsWith(api+'/api/account/me'),
   {timeout:20000});
  const thirdLogin=login(tabC,tokenB,'bob_222');
  // Observe rejection immediately. A failed pending-state assertion may close
  // the context before login() finishes; preserve the first useful failure
  // instead of crashing Node with an unhandled page.evaluate rejection.
  void thirdLogin.catch(()=>{});
  try{
   await meStarted;
   try{
    await tabC.waitForFunction(()=>{
     const profile=document.querySelector('#profileTrigger');
     return profile?.dataset.accountBootstrap==='pending'&&
      profile.title.includes('bob_222');
    },null,{timeout:20000});
   }catch(error){
    // Only type/presence/status is logged. Never dump guest keys or bearers.
    const diagnostics=await tabC.evaluate(()=>({
     bootstrap:document.querySelector('#profileTrigger')?.dataset.accountBootstrap||'absent',
     ownerType:(localStorage.getItem('ps-build-owner-scope.v1')||'').split(':',1)[0]||'none',
     profileIsBob:(document.querySelector('#profileTrigger')?.title||'').includes('bob_222'),
     page:document.readyState
    })).catch(()=>({page:'unavailable'}));
    throw Error('Delayed third-tab account check did not remain pending: '+
     JSON.stringify({requested:delayedMeTriggered,guestLibraryBeforeMe,diagnostics})+
     '; '+error.message);
   }
   assert.equal(guestLibraryBeforeMe,0,
    'Pending verified owner must not request the guest library');
  }finally{releaseMe();}
  await thirdLogin;
  tabC.off('request',countGuest);
  await tabC.unroute('**/api/account/me');
  await tabB.locator('#profileTrigger').click();
  await tabB.getByRole('button',{name:'Выйти из аккаунта'}).click();
  try{
   await tabC.waitForFunction(()=>document.querySelector('#profileTrigger')
    ?.title.includes('Войти или зарегистрироваться'),null,{timeout:15000});
  }catch(error){
   // Never disclose bearer/header contents in CI diagnostics.
   const detail=await tabC.evaluate(()=>({
    profile:document.querySelector('#profileTrigger')?.title||'',
    bootstrap:document.querySelector('#profileTrigger')?.dataset.accountBootstrap||'',
    sessionStored:localStorage.getItem('ps-account-session.v1')!==null,
    ownerType:(localStorage.getItem('ps-build-owner-scope.v1')||'').split(':',1)[0]||'none'
   }));
   throw Error('Same-owner logout did not propagate to third tab: '+
    JSON.stringify(detail)+'; '+error.message);
  }
  assert.equal(await tabC.evaluate(()=>localStorage.getItem('ps-account-session.v1')),null);
  assert.deepEqual(errors,[]);
  console.log('Chromium concurrent tabs passed: A cannot overwrite B active localStorage, both caches survive');
 }finally{await context.close()}
}
