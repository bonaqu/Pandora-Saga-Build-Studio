import assert from 'node:assert/strict';

// Real browser workflow with a mocked legacy guest owner and account D1 library.
export async function runLegacyImportSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const token='i'.repeat(43),username='import_tester',legacyKey='f'.repeat(64);
 const entry={id:'2'.repeat(32),name:'Old character',at:111,
  data:{race:1,gender:0,job:16,level:55,name:'Old character'}};
 const uploads=[],requests=[],errors=[],guest=[entry],account=[];
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
  const path=new URL(url).pathname,method=req.method(),
   authenticated=req.headers().authorization==='Bearer '+token;
  const send=(json,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(json)
  });
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/account/me')return send(authenticated?
   {account:{username}}:{error:'Sign in required'},authenticated?200:401);
  if(path==='/api/library'){
   requests.push({path,method,authenticated});
   if(!authenticated)return send({error:'Sign in required'},401);
   if(method==='GET')return send({records:account.map(entry=>({
    id:entry.id,deleted:false,entry}))});
   const action=req.postDataJSON();
   if(action.action==='put'){uploads.push(action.entry);account.push(action.entry);return send({ok:true})}
   return send({error:'Unsupported action'},400);
  }
  if(path==='/api/library/legacy-preview'){
   requests.push({path,method,authenticated});
   if(!authenticated)return send({error:'Sign in required'},401);
   if(req.postDataJSON()?.legacyKey!==legacyKey)return send({records:[]});
   return send({records:guest.map(entry=>({id:entry.id,deleted:false,entry}))});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#profileTrigger')?.title
   ?.includes('import_tester')&&
    document.querySelector('#raceGrid')?.children.length>0,null,{timeout:30000});
  await page.locator('#nav [data-tab="builds"]').click();
  const panel=page.locator('.build-transfer');
  await panel.locator('summary').click();
  await panel.getByRole('button',{name:'Найти на этом устройстве'}).click();
  await panel.getByRole('button',{name:'Добавить билды в мой аккаунт'}).waitFor({state:'visible'});
  assert.match(await panel.locator('[role=status]').innerText(),/Найдено для переноса: 1/);
  await panel.getByRole('button',{name:'Добавить билды в мой аккаунт'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.build-card').length===1,
   null,{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('.cloud-library-status')?.textContent
   ?.includes('Добавлено в аккаунт: 1'),null,{timeout:15000});
  assert.equal(uploads.length,1,'Exactly one new account build must be uploaded');
  assert.notEqual(uploads[0].id,entry.id,'Old record identity is preserved');
  assert.equal(uploads[0].data.level,55);
  assert.deepEqual(guest,[entry],'Legacy cloud record remains untouched');
  assert.ok(requests.every(x=>x.authenticated),'Old guest keys must not authorize normal API calls');
  const backup=await page.evaluate(key=>
   localStorage.getItem('ps-build-scope-cache.v1:guest:'+key),legacyKey);
  assert.equal(JSON.parse(JSON.parse(backup)[0])[0].name,'Old character');
  // A second recovery attempt detects that the account already has the build.
  const again=page.locator('.build-transfer');
  await again.locator('summary').click();
  await again.getByRole('button',{name:'Найти на этом устройстве'}).click();
  await again.locator('[role=status]').getByText(/Новых сохранений не найдено/)
   .waitFor({state:'visible',timeout:15000});
  assert.equal(uploads.length,1,'Identical legacy data must not create duplicate builds');
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
}
