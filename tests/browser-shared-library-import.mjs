import assert from 'node:assert/strict';

// Real Chromium account-only shared-library import with mocked Worker.
export async function runSharedLibraryImportSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev',
  token='t'.repeat(43),username='share_importer',shareId='W1234567890';
 const uploads=[],errors=[],nativeDialogs=[];
 const context=await browser.newContext({viewport:{width:1280,height:860}});
 await context.addInitScript(({token,username})=>{
  localStorage.setItem('ps-account-session.v1',
   JSON.stringify({token,username,expires:Number.MAX_SAFE_INTEGER}));
 },{token,username});
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const method=req.method(),path=new URL(url).pathname,
   auth=req.headers().authorization==='Bearer '+token;
  const send=(data,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/account/me')return send(auth?{account:{username}}:{error:'Sign in required'},
   auth?200:401);
  if(path==='/api/library'){
   if(!auth)return send({error:'Sign in required'},401);
   if(method==='GET')return send({records:[]});
   const data=req.postDataJSON();uploads.push({auth,entry:data?.entry});
   return data?.entry?.name==='Import A'?send({error:'Temporarily unavailable'},503):
    send({ok:true});
  }
  if(path==='/api/shared/'+shareId&&method==='GET'){
   if(!auth)return send({error:'Sign in required'},401);
   return send({schema:1,share:{schema:1,type:'library',data:[
    {name:'Import A',data:{race:1,gender:0,job:8,level:22,name:'Import A'}},
    {name:'Import B',data:{race:1,gender:0,job:8,level:23,name:'Import B'}}
   ]}});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('dialog',dialog=>{nativeDialogs.push(dialog.message());void dialog.dismiss()});
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0,
   null,{timeout:30000});
  await page.waitForFunction(username=>
   document.querySelector('#profileTrigger')?.dataset.accountBootstrap==='verified'&&
   localStorage.getItem('ps-build-owner-scope.v1')==='account:'+username,
   username,{timeout:30000});
  await page.evaluate(id=>{location.hash='#b/'+id},shareId);
  const prompt=page.getByRole('dialog',{name:'Добавить билды по ссылке?'});
  await prompt.waitFor({state:'visible'});
  assert.match(await prompt.innerText(),/Билдов по ссылке: 2/);
  assert.equal(await prompt.locator('.shared-import-count').innerText(),'Билдов по ссылке: 2.');
  assert.equal(await prompt.locator('[data-owner-copy-key="librarySharedImportNote"]').count(),1);
  assert.equal(await prompt.locator('.shared-receiver-copy-row .account-copy-pencil').count(),0,
   'Only administrators may edit import explanations');
  assert.equal(await prompt.locator('.shared-import-count [data-owner-copy-key]').count(),1,
   'Only the fixed count label is editorial, not the number');
  assert.equal(await prompt.locator('.shared-import-count-value [data-owner-copy-key]').count(),0);
  assert.equal(await prompt.locator('.shared-import-count .account-copy-pencil').count(),0);
  await prompt.getByRole('button',{name:'Отмена'}).click();
  assert.equal(uploads.length,0);
  await page.evaluate(id=>{location.hash='#b/'+id},shareId);
  await prompt.waitFor({state:'visible'});
  await prompt.getByRole('button',{name:'Добавить в мои билды'}).click();
  await page.waitForFunction(()=>{
   const message=document.querySelector('.cloud-library-status')?.textContent||'';
   return message.includes('1 из 2')&&message.includes('только в браузере');
  },null,{timeout:25000});
  const stored=await page.evaluate(()=>JSON.parse(
   localStorage.getItem('ps-build-library.v1')||'[]'));
  assert.deepEqual(stored.map(row=>row.name).sort(),['Import A','Import B']);
  assert.equal(uploads.length,2);
  assert.ok(uploads.every(row=>row.auth));
  assert.equal(await page.locator('#levelOut').textContent(),'1',
   'Importing builds must not replace the current working character');
  assert.deepEqual(nativeDialogs,[],'No native alert during shared library import');
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
}
