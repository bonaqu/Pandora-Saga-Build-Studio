import assert from 'node:assert/strict';

export async function runUIContentInlineSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const context=await browser.newContext({viewport:{width:1100,height:810}});
 const values={},writes=[],errors=[];
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Authorization,Content-Type',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const reply=(body,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(body)});
  const path=new URL(url).pathname;
  if(path==='/api/overrides')return reply({values});
  // A signed-in library is required to exercise real dynamic build controls.
  if(path==='/api/account/login'){
   const body=req.postDataJSON();
   assert.equal(body.username.toLowerCase(),'testingprofile');
   return reply({account:{username:'testingprofile'},token:'b'.repeat(43),
    expires:Date.now()+7200000});
  }
  if(path==='/api/account/me')return reply({account:{username:'testingprofile'}});
  if(path==='/api/library')return reply({records:[]});
  if(path==='/api/admin/login'){
   assert.equal(req.postDataJSON().password,'Correct admin password!');
   return reply({token:'a'.repeat(43),expires:Date.now()+600000});
  }
  if(path==='/api/admin/override'){
   assert.equal(req.headers().authorization,'Bearer '+'a'.repeat(43));
   const data=req.postDataJSON();
   assert.equal(data.expectedValue,Object.hasOwn(values,data.key)?values[data.key]:null);
   values[data.key]=data.value;writes.push(data);
   return reply({ok:true,key:data.key,value:data.value,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').waitFor({state:'visible'});
  assert.equal(await page.locator('#nav .ui-content-pencil').count(),0,
   'Guest does not see editing controls');
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:15000});
  // A real pencil must exist beside fixed headers on touchscreens. Renaming
  // the Hero Appearance heading is editorial copy, not a character change.
  const appearancePencil=page.locator('.stage .panel-heading [data-ui-content-for="appearance"]');
  await appearancePencil.waitFor({state:'visible'});
  await appearancePencil.click();
  const appearanceInput=page.locator('.stage .panel-heading .ui-content-edit-host [contenteditable]');
  await appearanceInput.fill('Облик героя');
  await appearanceInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#stageHeading')?.textContent===
   'Облик героя',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.appearance']).ru,'Облик героя');
  const pathTitlePencil=page.locator('.right .panel-heading [data-ui-content-for="path"]');
  await pathTitlePencil.waitFor({state:'visible'});
  const originHeadingPencil=page.locator('.workspace>.left>.panel-heading [data-origin-edit-for="heading"]');
  await originHeadingPencil.waitFor({state:'visible'});
  assert.equal(await page.locator('#pathGrowthPage [data-path-copy-for]').count(),4);
  const wiki=page.locator('#nav [data-i18n="wiki"]');
  const pencil=page.locator('#nav [data-ui-content-for="wiki"]');
  await pencil.waitFor({state:'visible'});
  await pencil.click();
  const input=page.locator('#nav .ui-content-edit-host [contenteditable]');
  await input.waitFor({state:'visible'});
  await input.fill('📜 Справочник');
  await input.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#nav [data-i18n="wiki"]')
   ?.textContent==='📜 Справочник',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.wiki']).ru,'📜 Справочник');
  assert.equal(await page.getByRole('dialog',{name:'Служебный вход'}).isVisible(),false);
  assert.equal(await wiki.isVisible(),true);

  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await pencil.click();
  const englishInput=page.locator('#nav .ui-content-edit-host [contenteditable]');
  await englishInput.fill('📜 Wiki Guide');
  await englishInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#nav [data-i18n="wiki"]')
   ?.textContent==='📜 Wiki Guide',null,{timeout:15000});
  assert.deepEqual(JSON.parse(values['guideedit.book.ui.label.wiki']),{
   ru:'📜 Справочник',en:'📜 Wiki Guide'
  });
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.querySelector('#nav [data-i18n="wiki"]')
   ?.textContent==='📜 Справочник',null,{timeout:15000});

  await wiki.click();
  const category=page.locator('[data-wiki-chapter="item"]');
  if(await category.count())await category.click();
  const search=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  // The UI intentionally guards this search against password-manager autofill.
  // Real pointer focus unlocks readonly before typing.
  await search.click();
  await search.fill('Копье Зефира');
  const spear=page.locator('[data-wiki-record="1482"]');
  await spear.waitFor({state:'visible',timeout:20000});
  await spear.press('Enter');
  const penLabel=page.locator('.item-fields dt').filter({hasText:'Пробитие'});
  await penLabel.waitFor({state:'visible'});
  await penLabel.locator('.wiki-hint-pencil').click();
  const field=penLabel.locator('.wiki-hint-inline-edit [contenteditable]');
  await field.fill('Чем меньше пробитие, тем выше минимальная атака.');
  await field.press('Tab');
  await page.waitForFunction(()=>document.querySelector('.item-fields dt .wiki-help-word[title="Чем меньше пробитие, тем выше минимальная атака."]')!==null,null,
   {timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.wiki.item-field.pen']).hintRu,
   'Чем меньше пробитие, тем выше минимальная атака.');
  const penBefore=await page.locator('.item-fields dt[data-item-field="PEN"] + dd').textContent();
  await penLabel.locator('.wiki-label-pencil').click();
  const rename=penLabel.locator('.wiki-label-inline-edit [contenteditable]');
  await rename.fill('Потенциал атаки');
  await rename.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.item-fields dt[data-item-field="PEN"] .wiki-help-word')?.textContent===
   'Потенциал атаки',null,{timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.wiki.item-field.pen']).ru,'Потенциал атаки');
  assert.equal(JSON.parse(values['guideedit.book.wiki.item-field.pen']).hintRu,
   'Чем меньше пробитие, тем выше минимальная атака.');
  assert.equal(await page.locator('.item-fields dt[data-item-field="PEN"] + dd').textContent(),penBefore);
  // Leave the existing Encyclopedia detail workbench before opening the
  // account UI: a modal workbench correctly intercepts background clicks.
  if(await page.locator('#detailPanel.is-open').count())
   await page.locator('#dockClose').click();
  // Dynamic account panel is rebuilt independently of the main planner.
  // Author edits remain inside the existing panel without touching forms.
  await page.locator('#profileTrigger').click();
  const guestLead=page.locator('#accountPanel [data-owner-copy-key="accountGuestLead"]');
  await guestLead.waitFor({state:'visible'});
  const login=page.locator('#accountPanel .account-form input').first();
  await login.fill('TestingProfile');
  await guestLead.dblclick();
  const accountInput=page.locator('#accountPanel .account-copy-edit-host [contenteditable]');
  await accountInput.fill('Вход открывает облачные билды.');
  await accountInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#accountPanel [data-owner-copy-key="accountGuestLead"]')?.textContent===
   'Вход открывает облачные билды.',null,{timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.account-guest-lead']).ru,
   'Вход открывает облачные билды.');
  assert.equal(await login.inputValue(),'TestingProfile',
   'Editing descriptive text must not erase the account username draft');
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  // The real account panel has a 170ms exit animation; never decide
  // whether to reopen it while that transition is still closing.
  await page.waitForFunction(()=>
   !document.querySelector('#accountPanel')?.classList.contains('is-closing'),
   null,{timeout:12000});
  if(!(await page.locator('#accountPanel').isVisible()))
   await page.locator('#profileTrigger').click();
  const guestEn=page.locator('#accountPanel [data-owner-copy-key="accountGuestLead"]');
  await guestEn.waitFor({state:'visible'});
  assert.match(await guestEn.textContent(),/username and password/i);
  await guestEn.dblclick();
  const enInput=page.locator('#accountPanel .account-copy-edit-host [contenteditable]');
  await enInput.fill('Sign in to open cloud builds.');
  await enInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#accountPanel [data-owner-copy-key="accountGuestLead"]')?.textContent===
   'Sign in to open cloud builds.',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values['guideedit.book.ui.label.account-guest-lead']),{
   ru:'Вход открывает облачные билды.',en:'Sign in to open cloud builds.'
  });
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  // If the account popup was closed by the locale button, open it again.
  // The real account panel has a 170ms exit animation; never decide
  // whether to reopen it while that transition is still closing.
  await page.waitForFunction(()=>
   !document.querySelector('#accountPanel')?.classList.contains('is-closing'),
   null,{timeout:12000});
  if(!(await page.locator('#accountPanel').isVisible()))
   await page.locator('#profileTrigger').click();
  await page.waitForFunction(()=>document.querySelector(
   '#accountPanel [data-owner-copy-key="accountGuestLead"]')?.textContent===
   'Вход открывает облачные билды.',null,{timeout:12000});
  assert.deepEqual(errors,[]);
  assert.equal(writes.filter(x=>x.key==='guideedit.book.ui.label.account-guest-lead').length,2);
  assert.equal(writes.filter(x=>x.key==='guideedit.book.ui.label.wiki').length,2);
  assert.equal(writes.filter(x=>x.key==='guideedit.book.wiki.item-field.pen').length,2);
  console.log('UI test: preparing to sign in');
  // Sign in without editing the username or password: library controls, not
  // account credentials or player-authored names, are the editing targets.
  const loginForm=page.locator('#accountPanel .account-form');
  await loginForm.locator('input').nth(0).fill('testingprofile');
  await loginForm.locator('input').nth(1).fill('password-for-test');
  await loginForm.locator('button[type="submit"]').click();
  await page.locator('#accountPanel .account-identity').waitFor({state:'visible'});
  console.log('UI test: opening saved-build library');
  await page.locator('#nav [data-tab="builds"]').click();
  const saveNew=page.locator('#detailContent [data-owner-copy-key="librarySaveNew"]');
  const libraryPencil=page.locator('#detailContent [data-owner-copy-pencil="librarySaveNew"]');
  await saveNew.waitFor({state:'visible'});
  await libraryPencil.waitFor({state:'visible'});
  assert.equal(await page.locator('#detailContent [data-owner-copy-key]').count()>=7,true);
  assert.equal(await page.locator('#detailContent .build-name-input[data-owner-copy-key]').count(),0,
   'The user-entered build name must not become owner-editable');
  console.log('UI test: editing library Russian copy');
  await libraryPencil.click();
  const libraryInput=page.locator('#detailContent .account-copy-edit-host [contenteditable]');
  await libraryInput.fill('✧ Сохранить персонажа');
  await libraryInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-owner-copy-key="librarySaveNew"]')?.textContent===
   '✧ Сохранить персонажа',null,{timeout:12000});
  const libraryKey='guideedit.book.ui.label.library-save-new';
  assert.equal(JSON.parse(values[libraryKey]).ru,'✧ Сохранить персонажа');
  console.log('UI test: switching library to English');
  await page.locator('#locale [data-locale="en"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  // The panel is rebuilt when the site language changes; editors must be
  // rebound to the new controls, not a detached DOM reference.
  console.log('UI test: editing library English copy');
  const enLibrary=page.locator('#detailContent [data-owner-copy-key="librarySaveNew"]');
  await enLibrary.waitFor({state:'visible'});
  assert.equal(await enLibrary.textContent(),'✧ Save new build');
  await page.locator('#detailContent [data-owner-copy-pencil="librarySaveNew"]').click();
  const enLibraryInput=page.locator('#detailContent .account-copy-edit-host [contenteditable]');
  await enLibraryInput.fill('✧ Save character');
  await enLibraryInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-owner-copy-key="librarySaveNew"]')?.textContent===
   '✧ Save character',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[libraryKey]),{
   ru:'✧ Сохранить персонажа',en:'✧ Save character'
  });
  assert.equal(writes.filter(x=>x.key===libraryKey).length,2);
  // Undoing the last English UI edit must not redraw the build library:
  // unsaved text in the name field belongs to the user, not the D1 editor.
  const activeName=page.locator('#detailContent .build-name-input');
  await activeName.fill('Unsent character name');
  const originalInput=await activeName.elementHandle();
  await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-owner-copy-key="librarySaveNew"]')?.textContent===
   '✧ Save new build',null,{timeout:12000});
  assert.equal(await activeName.inputValue(),'Unsent character name');
  assert.equal(await originalInput.evaluate(node=>node.isConnected),true,
   'Undoing UI text must not remount the saved-build library');
  assert.equal(JSON.parse(values[libraryKey]).ru,'✧ Сохранить персонажа');
  assert.equal(JSON.parse(values[libraryKey]).en,undefined);
  await originalInput.dispose();
  assert.deepEqual(errors,[]);
  console.log('Chromium D1 inline UI/Wiki/account/library RU+EN: blur, CAS, locale and no-redraw Undo passed');
 }finally{await context.close()}
}
