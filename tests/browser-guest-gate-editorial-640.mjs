import assert from 'node:assert/strict';

// Actual RU/EN gate editing through site-owner pencils, with an isolated
// Worker intercept. No production D1 or player account requests are sent.
export async function runGuestGateEditorialSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const values={},writes=[],accountCalls=[],errors=[];
 const authToken='g'.repeat(43);
 const context=await browser.newContext({viewport:{width:1120,height:820}});
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const respond=(body,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(body)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/overrides')return respond({values:{...values}});
  if(path==='/api/admin/login'&&method==='POST')
   return respond({token:authToken,expires:Date.now()+900000});
  if(path==='/api/admin/override'&&method==='POST'){
   assert.equal(req.headers().authorization,'Bearer '+authToken);
   const write=req.postDataJSON();
   assert.match(write.key,/^guideedit\.book\.ui\.label\.library-(guest|shared)/);
   assert.equal(write.expectedValue,
    Object.hasOwn(values,write.key)?values[write.key]:null);
   values[write.key]=write.value;writes.push(write);
   return respond({ok:true,key:write.key,value:write.value,conditional:true});
  }
  if(path.startsWith('/api/library')||path.startsWith('/api/shared/')||
    path.startsWith('/api/account/')){
   accountCalls.push({path,method});
   return respond({error:'Guests do not have access'},401);
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="builds"]').click();
  const gate=page.locator('#detailContent .build-signin-gate');
  await gate.waitFor({state:'visible'});
  assert.match(await gate.innerText(),/Мои билды — в аккаунте/);
  assert.equal(await gate.locator('[data-owner-copy-pencil]').count(),0);
  assert.equal(await page.locator('.build-card').count(),0);
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'})
   .waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('test admin UI fixture');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  const lead=gate.locator('[data-owner-copy-key="libraryGuestLead"]');
  const pencil=gate.locator('[data-owner-copy-pencil="libraryGuestLead"]');
  await pencil.waitFor({state:'visible'});
  await pencil.click();
  const editor=gate.locator('.account-copy-edit-host [contenteditable]');
  await editor.fill('Библиотека доступна после входа в аккаунт.');
  await editor.press('Tab');
  await page.waitForFunction(()=>window.PandoraUILocale?.text(
   'libraryGuestLead','ru')==='Библиотека доступна после входа в аккаунт.');
  assert.equal(await lead.innerText(),'Библиотека доступна после входа в аккаунт.');
  const key='guideedit.book.ui.label.library-guest-lead';
  assert.equal(JSON.parse(values[key]).ru,'Библиотека доступна после входа в аккаунт.');
  assert.equal(writes.length,1);

  // The guest is still not allowed into the actual library.
  assert.equal(await page.locator('.build-card').count(),0);
  assert.equal(accountCalls.length,0);
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="builds"]').click();
  await gate.waitFor({state:'visible'});
  assert.match(await gate.innerText(),/Sign in to save, open or compare builds/);
  await pencil.click();
  const englishEditor=gate.locator('.account-copy-edit-host [contenteditable]');
  await englishEditor.fill('Your saved builds are available after signing in.');
  await englishEditor.press('Tab');
  await page.waitForFunction(()=>window.PandoraUILocale?.text(
   'libraryGuestLead','en')==='Your saved builds are available after signing in.');
  assert.deepEqual(JSON.parse(values[key]),{
   ru:'Библиотека доступна после входа в аккаунт.',
   en:'Your saved builds are available after signing in.'
  });
  assert.equal(await lead.innerText(),'Your saved builds are available after signing in.');
  assert.equal(accountCalls.length,0);

  // Opening a shared link while logged out must keep the original hash and
  // show a caption taken from the same bilingual D1 editorial catalog.
  await page.evaluate(()=>{location.hash='#b/A1234567890'});
  const modal=page.locator('#modalRoot .build-signin-gate-dialog');
  await modal.waitFor({state:'visible',timeout:18000});
  assert.match(await modal.innerText(),/Sign in or register to open this build/);
  assert.equal(await page.evaluate(()=>location.hash),'#b/A1234567890');
  assert.equal(accountCalls.length,0);
  assert.deepEqual(errors,[]);
  console.log('Chromium guest gate copy: RU/EN D1 edit, preserved guest isolation and shared-link modal passed');
 }finally{await context.close()}
}
