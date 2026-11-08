import assert from 'node:assert/strict';

// Deliberately pause only the deferred entry module. Classic scripts have
// already read localStorage, but the app has not called AccountUI.init().
export async function runAccountLateBootstrapSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const token='a'.repeat(43),username='alice_01';
 const context=await browser.newContext({viewport:{width:1280,height:860}});
 const stats={me:0,accountLibrary:0,guestLibrary:0},errors=[];
 await context.route('**/*',async route=>{
  const request=route.request(),url=request.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(request.method()==='OPTIONS')
   return route.fulfill({status:204,headers});
  const auth=request.headers().authorization||'';
  const respond=(status,body)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(body)});
  const path=new URL(url).pathname;
  if(path==='/api/account/me'){
   stats.me++;
   return respond(auth==='Bearer '+token?200:401,
    auth==='Bearer '+token?{account:{username}}:{error:'Sign in required'});
  }
  if(path==='/api/library'){
   if(auth==='Bearer '+token)stats.accountLibrary++;
   else stats.guestLibrary++;
   return respond(200,{records:[]});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 let releaseEntry;
 let signalEntry;
 const entryRequested=new Promise(resolve=>{signalEntry=resolve});
 await page.route('**/pandora-studio-app.js*',async route=>{
  await new Promise(resolve=>{releaseEntry=resolve;signalEntry()});
  await route.continue();
 });
 const navigation=page.goto(base+'/',{waitUntil:'domcontentloaded'});
 try{
  await entryRequested;
  // AccountUI was evaluated as a classic script with no session. The entry
  // module is blocked, so init() and the guest callback have not run yet.
  await page.waitForFunction(()=>Boolean(window.PandoraAccountUI)&&
   !document.querySelector('#profileTrigger')?.dataset.accountBootstrap,
   null,{timeout:15000});
  const before=await page.evaluate(()=>localStorage.getItem('ps-account-session.v1'));
  assert.equal(before,null);
  // Another tab can persist the login during this exact loader gap.
  await page.evaluate(({token,username})=>{
   localStorage.setItem('ps-account-session.v1',JSON.stringify({
    token,username,expires:Date.now()+3600000
   }));
  },{token,username});
  releaseEntry();
  await navigation;
  await page.waitForFunction(expected=>
   document.querySelector('#profileTrigger')?.dataset.accountBootstrap==='verified'&&
   document.querySelector('#profileTrigger')?.title.includes(expected)&&
   localStorage.getItem('ps-build-owner-scope.v1')==='account:'+expected&&
   document.querySelector('#raceGrid')?.children.length>0,
   username,{timeout:25000});
  assert.equal(stats.me,1,'The late session must be checked via /me');
  assert.equal(stats.guestLibrary,0,
   'A newly persisted account may not bootstrap an unrelated guest library');
  assert.ok(stats.accountLibrary>=1,'Account library must be requested');
  assert.deepEqual(errors,[]);
  console.log('Chromium late-login bootstrap passed: delayed app module restores verified account and only its library');
 }finally{
  releaseEntry?.();
  await context.close();
 }
}
