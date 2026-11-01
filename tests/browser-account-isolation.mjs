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
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0);
  // Account bootstrapping is async. Wait until the actual scoped library has
  // replaced the previous owner's storage before opening/saving a build.
  await page.waitForFunction(expected=>
   localStorage.getItem('ps-build-owner-scope.v1')===expected,
   token?'account:'+username:'guest:'+guestToken);
  await openManager();
 }
 async function named(){
  // The Build Manager is already open; its modal captures clicks outside itself.
  return page.locator('.build-card h3').allTextContents();
 }
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(token=>localStorage.setItem('ps-build-library-secret.v1',token),guestToken);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0);
  await saveNamed('Guest only');
  assert.ok((await named()).includes('Guest only'));
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
  assert.deepEqual(await named(),['Guest only']);
  assert.ok(writes.some(x=>x.bearer===alice&&x.body?.entry?.name==='Alice only'));
  assert.ok(writes.some(x=>x.bearer===bob&&x.body?.entry?.name==='Bob only'));
  assert.ok(!writes.some(x=>x.bearer===bob&&x.body?.entry?.name!=='Bob only'),
   'Another owner must never upload Alice or guest saves into Bob D1');
  assert.ok(!writes.some(x=>x.bearer===alice&&x.body?.entry?.name==='Guest only'),
   'Existing-account login must never upload guest saves');
  assert.deepEqual(exceptions,[]);
  console.log('Chromium account switching passed: isolated guest, Alice and Bob saved builds; no cross-owner D1 PUT');
 }finally{await context.close()}
}
