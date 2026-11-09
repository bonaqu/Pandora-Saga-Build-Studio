import assert from 'node:assert/strict';

export async function runAccountLibraryIsolationSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const guestToken='e'.repeat(64),alice='a'.repeat(43),bob='b'.repeat(43);
 const writes=[],readers=[];
 const context=await browser.newContext({viewport:{width:1300,height:850}});
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const pathname=new URL(url).pathname,method=route.request().method();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  const send=(body,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(body)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(pathname==='/api/library'){
   const bearer=route.request().headers().authorization?.slice(7);
   if(method==='GET'){readers.push(bearer);return send({records:[]})}
   const body=route.request().postDataJSON();writes.push({bearer,body});
   return send({ok:true});
  }
  if(pathname==='/api/account/me'){
   const token=route.request().headers().authorization?.slice(7);
   if(token===alice)return send({account:{username:'alice_01'}});
   if(token===bob)return send({account:{username:'bob_222'}});
   return send({error:'Sign in required'},401);
  }
  if(pathname==='/api/overrides')return send({values:{}});
  return route.abort();
 });
 const page=await context.newPage(),exceptions=[];
 page.on('pageerror',error=>exceptions.push(error.message));
 async function openManager(){
  // The last visible tab is restored after F5; its dialog must not be clicked through.
  if(!await page.locator('.build-name-input').isVisible())
   await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('.build-name-input').waitFor({state:'visible'});
 }
 async function saveNamed(name){
  await openManager();
  await page.locator('.build-name-input').fill(name);
  await page.getByRole('button',{name:'Сохранить новый билд'}).click();
  await page.locator('.build-card h3').filter({hasText:name}).waitFor({state:'visible'});
 }
 async function setAccount(token,username){
  await page.evaluate(({token,username})=>{
   if(token)localStorage.setItem('ps-account-session.v1',
    JSON.stringify({token,username,expires:Date.now()+86400000}));
   else localStorage.removeItem('ps-account-session.v1');
  },{token,username});
  await page.reload({waitUntil:'domcontentloaded'});
  // Owner scope may become visible before session and catalog readiness;
  // saving during that gap can lose the intended draft name.
  await page.waitForFunction(({owner,username})=>{
   const catalog=document.querySelector('#catalogStatus')?.textContent||'';
   const profile=document.querySelector('#profileTrigger')?.title||'';
   return document.querySelector('#raceGrid')?.children.length>0&&
    localStorage.getItem('ps-build-owner-scope.v1')===owner&&
    /\d+ навыков · \d+ предметов · \d+ душ/.test(catalog)&&
    (!username||profile.includes(username));
  },{owner:token?'account:'+username:'guest:'+guestToken,
    username:token?username:null},{timeout:30000});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  if(token)await openManager();
  else{
   // The previous workbench can be restored already open after sign-out.
   // Never click the main navigation through its modal overlay.
   if(!await page.locator('.build-signin-gate').isVisible())
    await page.locator('#nav [data-tab="builds"]').click();
   await page.locator('.build-signin-gate').waitFor({state:'visible'});
  }
 }
 async function named(){
  // The Build Manager is already open; its modal captures clicks outside itself.
  return page.locator('.build-card h3').allTextContents();
 }
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(token=>{
   localStorage.setItem('ps-build-library-secret.v1',token);
   // Seed the previous record under the SAME guest owner before reload.
   // A different marker would correctly treat that primary key as another user's.
   localStorage.setItem('ps-build-owner-scope.v1','guest:'+token);
   localStorage.setItem('ps-build-library.v1',JSON.stringify([{
    id:'c'.repeat(32),name:'Guest only',at:99,data:{race:1,job:16,level:45}
   }]));
  },guestToken);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(expected=>
   document.querySelector('#raceGrid')?.children.length>0&&
   localStorage.getItem('ps-build-owner-scope.v1')==='guest:'+expected&&
   /\d+ навыков · \d+ предметов · \d+ душ/.test(
    document.querySelector('#catalogStatus')?.textContent||''),
   guestToken,{timeout:30000});
  await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('.build-signin-gate').waitFor({state:'visible'});
  assert.deepEqual(await named(),[],'Guests cannot open even their old local builds');
  assert.equal(await page.locator('.build-name-input').count(),0);
  await setAccount(alice,'alice_01');
  assert.deepEqual(await named(),[],'Alice cannot see guest saves');
  assert.equal(await page.locator('#levelOut').textContent(),'1');
  await saveNamed('Alice only');
  await setAccount(bob,'bob_222');
  assert.deepEqual(await named(),[],'Bob cannot see Alice saves');
  await saveNamed('Bob only');
  await setAccount(alice,'alice_01');
  assert.deepEqual(await named(),['Alice only']);
  await setAccount(null,null);
  assert.deepEqual(await named(),[],'Signing out returns to the account-entry gate');
  const guestBackup=await page.evaluate(key=>
   localStorage.getItem('ps-build-scope-cache.v1:guest:'+key),guestToken);
  assert.ok(guestBackup,'Original guest saves must remain available for explicit import');
  assert.deepEqual(JSON.parse(JSON.parse(guestBackup)[0]).map(row=>row.name),['Guest only']);
  assert.ok(writes.some(x=>x.bearer===alice&&x.body?.entry?.name==='Alice only'));
  assert.ok(writes.some(x=>x.bearer===bob&&x.body?.entry?.name==='Bob only'));
  assert.ok(!writes.some(x=>x.bearer===bob&&x.body?.entry?.name!=='Bob only'),
   'Another owner must never upload Alice or guest saves into Bob D1');
  assert.ok(!writes.some(x=>x.bearer===alice&&x.body?.entry?.name==='Guest only'),
   'Existing-account login must never upload guest saves');
  assert.deepEqual(exceptions,[]);
  console.log('Chromium account switching passed: guests gated, Alice/Bob isolated, old guest backup preserved');
 }finally{await context.close()}
}
