import assert from 'node:assert/strict';

// Real RU/EN page interactions with isolated Worker mocks; no production writes.
export async function runBuildAuthGateSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const token='a'.repeat(43),shareId='A1234567890',calls=[],errors=[];
 const context=await browser.newContext({viewport:{width:1200,height:850}});
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await context.route('**/*',route=>{
  const request=route.request(),url=request.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=request.method();
  const auth=request.headers().authorization==='Bearer '+token;
  const json=(value,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(value)
  });
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/account/login'&&method==='POST')
   return json({account:{username:'alice_01'},token,expires:Number.MAX_SAFE_INTEGER});
  if(path==='/api/account/me')return json(auth?
   {account:{username:'alice_01'}}:{error:'Sign in required'},auth?200:401);
  if(path==='/api/library'){
   calls.push({path,auth,method});
   return auth?json({records:[]}):json({error:'Sign in required'},401);
  }
  if(path==='/api/shared/'+shareId&&method==='GET'){
   calls.push({path,auth,method});
   return auth?json({schema:1,share:{schema:1,type:'build',
    data:{race:1,gender:0,job:16,level:22,name:'Shared hero'}}}):
    json({error:'Sign in required'},401);
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#raceGrid .race-slide-select').first().waitFor({state:'visible',timeout:30000});
  await page.locator('#nav [data-tab="builds"]').click();
  const gate=page.locator('.build-signin-gate');
  await gate.waitFor({state:'visible'});
  assert.match(await gate.innerText(),/Мои билды — в аккаунте/);
  assert.equal(await page.locator('.build-card').count(),0);
  assert.equal(await page.locator('.build-name-input').count(),0);
  assert.equal(calls.length,0,'Guests must never fetch cloud builds');
  await gate.getByRole('button',{name:'Регистрация'}).click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal((await page.locator('#accountPanel .account-action.selected').innerText()).trim(),'Регистрация');
  await page.locator('#profileTrigger').click();
  await page.evaluate(id=>{location.hash='#b/'+id},shareId);
  const dialog=page.getByRole('dialog',{name:'Вход для открытия билда'});
  await dialog.waitFor({state:'visible'});
  assert.equal(calls.length,0,'Guests must not fetch shared snapshots');
  assert.equal(await page.evaluate(()=>location.hash),'#b/'+shareId);
  await dialog.getByRole('button',{name:'Войти'}).click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  const form=page.locator('#accountPanel .account-form');
  await form.locator('input').nth(0).fill('alice_01');
  await form.locator('input[type="password"]').fill('testpassword');
  await form.getByRole('button',{name:'Войти'}).click();
  const shared=page.getByRole('dialog',{name:'Открыть билд по ссылке?'});
  await shared.waitFor({state:'visible',timeout:25000});
  assert.equal(calls.filter(x=>x.path.includes('/api/shared/')).length,1);
  assert.ok(calls.every(x=>x.auth),'Build access must always use account token');
  await shared.getByRole('button',{name:'Отмена'}).click();
  await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('.build-name-input').waitFor({state:'visible'});
  assert.equal(await page.locator('.build-signin-gate').count(),0);
  // The library drawer is a real modal surface; close it before using header locale.
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en',null,{timeout:20000});
  assert.equal(await page.locator('.build-signin-gate').count(),0);
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
}
