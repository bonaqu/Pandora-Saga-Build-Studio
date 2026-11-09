import assert from 'node:assert/strict';

// A signed-in user can have saved characters in D1 but zero rows in this
// browser (new computer, cleared cache or failed initial offline GET).
// Reconnect must fetch those remote records without a new login.
export async function runEmptyAccountCloudReconnectSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const token='k'.repeat(43),username='reconnect_01',id='e'.repeat(32);
 const cloudBuild={id,at:1760000000000,name:'Returned from D1',
  data:{race:1,gender:0,job:8,level:45,name:'Returned from D1'}};
 let cloudUp=false,accountGets=0,guestGets=0,writes=0;
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Content-Type,Authorization',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 const context=await browser.newContext({viewport:{width:1280,height:860}});
 await context.addInitScript(({token,username})=>{
  localStorage.setItem('ps-account-session.v1',JSON.stringify({
   token,username,expires:Number.MAX_SAFE_INTEGER
  }));
  localStorage.setItem('ps-build-library-secret.v1','5'.repeat(64));
  localStorage.removeItem('ps-build-library.v1');
 },{token,username});
 await context.route('**/*',async route=>{
  const url=route.request().url(),method=route.request().method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const pathname=new URL(url).pathname;
  const reply=(status,body)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(body)});
  const owner=route.request().headers().authorization==='Bearer '+token;
  if(pathname==='/api/account/me')
   return reply(owner?200:401,owner?{account:{username}}:{error:'Unauthorized'});
  if(pathname==='/api/library'){
   if(method!=='GET'){writes++;return reply(403,{error:'No writes in this test'})}
   if(owner)accountGets++;else guestGets++;
   return cloudUp?reply(200,{records:[{id,entry:cloudBuild,deleted:false}]}):
    reply(503,{error:'Cloud temporarily unavailable'});
  }
  return route.abort();
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  const failed=page.waitForResponse(res=>res.url().startsWith(api+'/api/library')&&
   res.status()===503,{timeout:30000});
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await failed;
  await page.waitForFunction(expected=>
   document.querySelector('#profileTrigger')?.dataset.accountBootstrap==='verified'&&
   localStorage.getItem('ps-build-owner-scope.v1')==='account:'+expected,
   username,{timeout:20000});
  await page.locator('#nav [data-tab="builds"]').click();
  await page.waitForFunction(()=>
   document.querySelector('.cloud-library-status')?.textContent.includes('облако пока недоступно'),
   null,{timeout:12000});
  assert.equal(await page.evaluate(()=>JSON.parse(
   localStorage.getItem('ps-build-library.v1')||'[]').length),0);
  assert.ok(accountGets>=1,'An initial account GET must be attempted');
  assert.equal(guestGets,0,'Signed-in user may not GET someone else\'s guest library');
  cloudUp=true;
  const recovered=page.waitForResponse(res=>
   res.url().startsWith(api+'/api/library')&&res.status()===200,
   {timeout:12000});
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await recovered;
  await page.waitForFunction(id=>
   JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')
    .some(x=>x.id===id),id,{timeout:12000});
  assert.ok((await page.locator('#detailContent').innerText()).includes('Returned from D1'),
   'My Builds should render the recovered D1-only build');
  assert.equal(await page.locator('#profileTrigger').getAttribute('data-account-bootstrap'),
   'verified','Reconnect must not log the user out');
  assert.equal(writes,0,'Do not automatically save an unsaved draft or PUT remote builds');
  assert.equal(guestGets,0);
  assert.deepEqual(errors,[]);
  console.log('Chromium account reconnect passed: empty local library pulled D1-only build without re-login/PUT');
 }finally{await context.close()}
}
