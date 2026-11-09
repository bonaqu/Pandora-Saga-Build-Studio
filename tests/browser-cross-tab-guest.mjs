import assert from 'node:assert/strict';

// Guest tabs keep their old local records, but no longer access any cloud library.
export async function runCrossTabGuestIsolationSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const firstKey='4'.repeat(64),secondKey='5'.repeat(64),requests=[],errors=[];
 const id='a'.repeat(32);
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.addInitScript(({key,id})=>{
  if(sessionStorage.getItem('guest-tab-key-seeded'))return;
  sessionStorage.setItem('guest-tab-key-seeded','1');
  localStorage.setItem('ps-build-library-secret.v1',key);
  localStorage.setItem('ps-build-library.v1',JSON.stringify([{
   id,name:'Previously saved guest',at:100,data:{race:0,job:0,level:45}
  }]));
 },{key:firstKey,id});
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const method=route.request().method(),path=new URL(url).pathname;
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/library'||path.startsWith('/api/shared')){
   requests.push({path,method,bearer:route.request().headers().authorization});
   return route.fulfill({status:401,headers,contentType:'application/json',
    body:JSON.stringify({error:'Sign in required'})});
  }
  return route.abort();
 });
 const first=await context.newPage(),second=await context.newPage();
 for(const page of [first,second])page.on('pageerror',error=>errors.push(error.message));
 async function ready(page,secret){
  await page.waitForFunction(key=>
   localStorage.getItem('ps-build-owner-scope.v1')==='guest:'+key&&
   document.querySelector('#raceGrid')?.children.length>0,secret,{timeout:30000});
 }
 try{
  await first.goto(base+'/',{waitUntil:'domcontentloaded'});
  await ready(first,firstKey);
  await first.locator('#snapshot').click();
  await first.locator('.build-signin-gate').waitFor({state:'visible'});
  assert.equal(await first.locator('.build-card').count(),0,
   'Previous guest saves must not be available without login');
  assert.equal(await first.locator('.build-name-input').count(),0);
  await second.goto(base+'/',{waitUntil:'domcontentloaded'});
  await ready(second,firstKey);
  await second.evaluate(key=>localStorage.setItem('ps-build-library-secret.v1',key),secondKey);
  await second.reload({waitUntil:'domcontentloaded'});
  await ready(second,secondKey);
  await second.locator('#snapshot').click();
  assert.match(await second.locator('.build-signin-gate').innerText(),
   /Мои билды — в аккаунте/);
  assert.equal(await second.locator('.build-card').count(),0);
  assert.equal(requests.length,0,'Neither guest tab may load or save into D1');
  // The first owner's independent backup remains retrievable during future
  // explicit account import; changing another tab's guest key does not erase it.
  const backup=await first.evaluate(key=>
   localStorage.getItem('ps-build-scope-cache.v1:guest:'+key),firstKey);
  assert.ok(backup,'Legacy guest copy must not be silently deleted');
  assert.equal(JSON.parse(JSON.parse(backup)[0])[0].name,'Previously saved guest');
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
}
