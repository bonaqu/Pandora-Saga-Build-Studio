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
  await page.evaluate(({token,username,guestKey})=>{
   localStorage.setItem('ps-build-library-secret.v1',guestKey);
   localStorage.setItem('ps-account-session.v1',JSON.stringify({
    username,token,expires:Date.now()+3600000
   }));
  },{token,username,guestKey});
  await page.reload({waitUntil:'domcontentloaded'});
  // The owner marker changes before the account and OS catalog finish
  // rendering. A save issued mid-render can lose the typed name.
  await page.waitForFunction(expected=>{
   const catalog=document.querySelector('#catalogStatus')?.textContent||'';
   const profile=document.querySelector('#profileTrigger')?.title||'';
   return localStorage.getItem('ps-build-owner-scope.v1')==='account:'+expected&&
    /\d+ навыков · \d+ предметов · \d+ душ/.test(catalog)&&
    profile.includes(expected);
  },username,{timeout:25000});
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
  assert.equal(await tabA.locator('.build-transfer').count(),0,
   'A signed-in account must not display its unrelated guest recovery key');
  await tabB.goto(base+'/',{waitUntil:'domcontentloaded'});
  await login(tabB,tokenB,'bob_222');
  await save(tabB,'Bob only',tokenB);
  // Alice is still running in tab A with its original in-memory session.
  await save(tabA,'Alice second',tokenA);
  const bob=await tabB.evaluate(()=>{
   return {
    owner:localStorage.getItem('ps-build-owner-scope.v1'),
    rows:JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]'),
    draft:JSON.parse(localStorage.getItem('ps-build-studio.v1')||'{}')
   };
  });
  assert.equal(bob.owner,'account:bob_222');
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
  assert.deepEqual(errors,[]);
  console.log('Chromium concurrent tabs passed: A cannot overwrite B active localStorage, both caches survive');
 }finally{await context.close()}
}
