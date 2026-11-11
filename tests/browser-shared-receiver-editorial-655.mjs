import assert from 'node:assert/strict';

// Real Chromium admin-only editing of static receiver copy. All account,
// share and D1 responses are mocked; live production data is never mutated.
export async function runSharedReceiverEditorial655Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const username='shared_qa',playerToken='p'.repeat(43),adminToken='a'.repeat(43);
 const values={},writes=[],errors=[];
 const context=await browser.newContext({viewport:{width:1280,height:850}});
 await context.addInitScript(({token,user})=>localStorage.setItem('ps-account-session.v1',
  JSON.stringify({token,username:user,expires:Number.MAX_SAFE_INTEGER})),
  {token:playerToken,user:username});
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=req.method();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Authorization,Content-Type',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  const send=(data,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(data)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/overrides')return send({values});
  if(path==='/api/account/me')return send({account:{username}});
  if(path==='/api/library'){
   if(method!=='GET')throw Error('Editing import guidance must never save a build');
   return send({records:[]});
  }
  if(path==='/api/shared/W1234567890')return send({schema:1,share:{schema:1,
   type:'library',data:[
    {name:'Only for QA A',data:{race:1,gender:0,job:8,level:24,name:'A'}},
    {name:'Only for QA B',data:{race:1,gender:0,job:8,level:25,name:'B'}}
   ]}});
  if(path==='/api/shared/A1234567890')return send({schema:1,share:{schema:1,
   type:'build',data:{race:1,gender:0,job:8,level:30,name:'Friend private QA hero'}}});
  if(path==='/api/admin/login')return send({token:adminToken,expires:Date.now()+600000});
  if(path==='/api/admin/catalog/test-write')return send({ok:true,readback:true,
   cleaned:true,overrideReadback:true,overrideCleaned:true,activeCatalogUnchanged:true});
  if(path==='/api/admin/override'){
   const body=req.postDataJSON();
   assert.equal(req.headers().authorization,'Bearer '+adminToken);
   assert.equal(body.expectedValue,Object.hasOwn(values,body.key)?values[body.key]:null);
   values[body.key]=body.value;writes.push(body);
   return send({ok:true,key:body.key,value:body.value,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0,
   null,{timeout:30000});
  await page.keyboard.press('Control+Alt+Shift+P');
  const login=page.getByRole('dialog',{name:'Служебный вход'});
  await login.waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  await page.evaluate(()=>{location.hash='#b/W1234567890'});
  const importDialog=page.getByRole('dialog',{name:'Добавить билды по ссылке?'});
  await importDialog.waitFor({state:'visible',timeout:20000});
  assert.equal(await importDialog.locator('.shared-import-count').innerText(),'Билдов по ссылке: 2.');
  assert.equal(await importDialog.locator('.shared-import-count [data-owner-copy-key]').count(),1);
  assert.equal(await importDialog.locator('.shared-import-count-value [data-owner-copy-key]').count(),0);
  const countKey='guideedit.book.ui.label.library-shared-import-count-label';
  await importDialog.locator('[data-owner-copy-pencil="librarySharedImportCountLabel"]').click();
  const countEdit=importDialog.locator('.shared-import-count .account-copy-edit-host [contenteditable]');
  await countEdit.fill('В ссылке билдов:');
  await countEdit.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#modalRoot [data-owner-copy-key="librarySharedImportCountLabel"]')?.textContent==='В ссылке билдов:',
   null,{timeout:12000});
  assert.equal(JSON.parse(values[countKey]).ru,'В ссылке билдов:');
  assert.equal(await importDialog.locator('.shared-import-count-value').innerText(),'2.');
  const importKey='guideedit.book.ui.label.library-shared-import-note';
  const ruNote=importDialog.locator('[data-owner-copy-key="librarySharedImportNote"]');
  await ruNote.waitFor({state:'visible'});
  await importDialog.locator('[data-owner-copy-pencil="librarySharedImportNote"]').click();
  const importEditor=importDialog.locator('.shared-receiver-copy-row .account-copy-edit-host [contenteditable]');
  await importEditor.fill('Герой и библиотека сохранены; добавим только новые копии.');
  await importEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#modalRoot [data-owner-copy-key="librarySharedImportNote"]')?.textContent===
   'Герой и библиотека сохранены; добавим только новые копии.',null,{timeout:12000});
  assert.equal(JSON.parse(values[importKey]).ru,
   'Герой и библиотека сохранены; добавим только новые копии.');
  assert.match(await importDialog.locator('.shared-import-count').innerText(),/В ссылке билдов:/);
  assert.equal(await importDialog.locator('.shared-import-count-value').innerText(),'2.');
  await importDialog.getByRole('button',{name:'Отмена'}).click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en',null,{timeout:15000});
  await page.evaluate(()=>{location.hash='#b/W1234567890'});
  const enImport=page.getByRole('dialog',{name:'Add builds from link?'});
  await enImport.waitFor({state:'visible'});
  const enCount=enImport.locator('[data-owner-copy-key="librarySharedImportCountLabel"]');
  assert.equal(await enCount.innerText(),'Builds in link:');
  await enImport.locator('[data-owner-copy-pencil="librarySharedImportCountLabel"]').click();
  const enCountEdit=enImport.locator('.shared-import-count .account-copy-edit-host [contenteditable]');
  await enCountEdit.fill('Builds received:');
  await enCountEdit.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#modalRoot [data-owner-copy-key="librarySharedImportCountLabel"]')?.textContent==='Builds received:',
   null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[countKey]),{ru:'В ссылке билдов:',en:'Builds received:'});
  assert.equal(await enImport.locator('.shared-import-count-value').innerText(),'2.');
  const enNote=enImport.locator('[data-owner-copy-key="librarySharedImportNote"]');
  assert.equal(await enNote.innerText(),
   'Your current character and saved builds will not change. New copies will be added to My Builds.');
  await enImport.locator('[data-owner-copy-pencil="librarySharedImportNote"]').click();
  const enInput=enImport.locator('.shared-receiver-copy-row .account-copy-edit-host [contenteditable]');
  await enInput.fill('Keep your hero and saved builds; add new copies only.');
  await enInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#modalRoot [data-owner-copy-key="librarySharedImportNote"]')?.textContent===
   'Keep your hero and saved builds; add new copies only.',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[importKey]),{
   ru:'Герой и библиотека сохранены; добавим только новые копии.',
   en:'Keep your hero and saved builds; add new copies only.'
  });
  await enImport.getByRole('button',{name:'Cancel'}).click();
  await page.evaluate(()=>{location.hash='#b/A1234567890'});
  const openDialog=page.getByRole('dialog',{name:'Open build from link?'});
  await openDialog.waitFor({state:'visible'});
  assert.match(await openDialog.locator('.shared-personal-name').innerText(),/Friend private QA hero/);
  assert.equal(await openDialog.locator('.shared-personal-name [data-owner-copy-key]').count(),0);
  const warnKey='guideedit.book.ui.label.library-shared-unsaved-warning';
  assert.match(await openDialog.locator('[data-owner-copy-key="librarySharedUnsavedWarning"]').innerText(),
   /unsaved changes will be replaced/i);
  await openDialog.locator('[data-owner-copy-pencil="librarySharedUnsavedWarning"]').click();
  const warnInput=openDialog.locator('.shared-unsaved-warning-row .account-copy-edit-host [contenteditable]');
  await warnInput.fill('Unsaved character changes will be discarded.');
  await warnInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#modalRoot [data-owner-copy-key="librarySharedUnsavedWarning"]')?.textContent===
   'Unsaved character changes will be discarded.',null,{timeout:12000});
  assert.equal(JSON.parse(values[warnKey]).en,'Unsaved character changes will be discarded.');
  assert.match(await openDialog.locator('.shared-personal-name').innerText(),/Friend private QA hero/);
  const openKey='guideedit.book.ui.label.library-shared-open-note';
  await openDialog.locator('[data-owner-copy-pencil="librarySharedOpenNote"]').click();
  const openInput=openDialog.locator('.shared-receiver-copy-row .account-copy-edit-host [contenteditable]');
  await openInput.fill('Your previously saved builds stay untouched.');
  await openInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#modalRoot [data-owner-copy-key="librarySharedOpenNote"]')?.textContent===
   'Your previously saved builds stay untouched.',null,{timeout:12000});
  assert.equal(JSON.parse(values[openKey]).en,'Your previously saved builds stay untouched.');
  assert.match(await openDialog.locator('.shared-personal-name').innerText(),/Friend private QA hero/);
  assert.equal(writes.length,6);
  assert.ok(writes.every(row=>row.key.startsWith('guideedit.book.ui.label.library-shared-')));
  await openDialog.getByRole('button',{name:'Cancel'}).click();
  assert.deepEqual(errors,[]);
  console.log('Chromium shared receiver 655: owner RU/EN edits, isolated dynamic names/counts and CAS passed');
 }finally{await context.close()}
}
