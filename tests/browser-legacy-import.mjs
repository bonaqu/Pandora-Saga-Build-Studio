import assert from 'node:assert/strict';

// Regression: old guest backups stay untouched, but are never imported into
// a signed-in account. No production Worker or D1 writes are performed.
export async function runLegacyImportSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const token='i'.repeat(43),username='import_tester',legacyKey='f'.repeat(64);
 const entry={id:'2'.repeat(32),name:'Old character',at:111,
  data:{race:1,gender:0,job:16,level:55,name:'Old character'}};
 const requests=[],errors=[];
 const context=await browser.newContext({viewport:{width:1350,height:900}});
 await context.addInitScript(({token,username,legacyKey,entry})=>{
  localStorage.setItem('ps-build-library-secret.v1',legacyKey);
  localStorage.setItem('ps-account-session.v1',
   JSON.stringify({token,username,expires:Number.MAX_SAFE_INTEGER}));
  localStorage.setItem('ps-build-scope-cache.v1:guest:'+legacyKey,
   JSON.stringify([JSON.stringify([entry]),'','[]','']));
 },{token,username,legacyKey,entry});
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=req.method();
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  requests.push({path,method});
  if(path==='/api/account/me')return route.fulfill({status:200,headers,
   contentType:'application/json',body:JSON.stringify({account:{username}})});
  if(path==='/api/library'&&method==='GET')return route.fulfill({status:200,headers,
   contentType:'application/json',body:JSON.stringify({records:[]})});
  return route.fulfill({status:403,headers,contentType:'application/json',
   body:JSON.stringify({error:'No legacy access'})});
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#profileTrigger')?.title
   ?.includes('import_tester')&&document.querySelector('#raceGrid')?.children.length>0,
   null,{timeout:30000});
  await page.locator('#nav [data-tab="builds"]').click();
  assert.equal(await page.locator('.build-transfer').count(),0);
  assert.equal(await page.getByText('Перенести старые билды').count(),0);
  assert.equal(await page.locator('.build-card').count(),0);
  assert.equal(requests.some(x=>x.path.includes('legacy')),false,
   'No authenticated session should fetch a previous guest library');
  assert.equal(requests.some(x=>x.path==='/api/library'&&x.method!=='GET'),false,
   'No old build should be uploaded automatically');
  const backup=await page.evaluate(key=>
   localStorage.getItem('ps-build-scope-cache.v1:guest:'+key),legacyKey);
  assert.equal(JSON.parse(JSON.parse(backup)[0])[0].name,'Old character');
  assert.deepEqual(errors,[]);
  console.log('Chromium legacy import retired: account gate, old backup isolation and no D1 writes');
 }finally{await context.close()}
}
