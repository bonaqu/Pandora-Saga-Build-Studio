import assert from 'node:assert/strict';

// Isolated owner CAS smoke; no real accounts or Cloudflare D1 mutation.
export async function runProfileCaption390Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const token='a'.repeat(43),values={},writes=[],resets=[],errors=[],nextConflicts=new Set();
 const context=await browser.newContext({viewport:{width:1200,height:840}});
 await context.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:2,level:45,name:'Profile smoke hero',
   stats:{},points:{},mastery:{},
   profile:{guild:'Player data QA',nation:'',rank:'',about:'Biography draft'}
  }));
  sessionStorage.setItem('ps-studio-navigation.v2',
   JSON.stringify({tab:'character',open:true}));
 });
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const send=(value,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(value)
  });
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/overrides')return send({values:{...values}});
  if(path==='/api/admin/login')return send({token,expires:Date.now()+600000});
  if(path==='/api/admin/catalog/test-write')return send({
   ok:true,readback:true,cleaned:true,overrideReadback:true,
   overrideCleaned:true,activeCatalogUnchanged:true
  });
  if(path==='/api/admin/override'){
   assert.equal(req.headers().authorization,'Bearer '+token);
   const data=req.postDataJSON();
   assert.match(data.key,/^guideedit\.book\.profile\./);
   assert.equal(data.expectedValue,Object.hasOwn(values,data.key)?values[data.key]:null);
   if(nextConflicts.delete(data.key))
    return send({code:'OWNER_EDIT_CONFLICT',error:'Mock stale owner version'},409);
   values[data.key]=data.value;writes.push(data);
   return send({ok:true,key:data.key,value:data.value,conditional:true});
  }
  if(path==='/api/admin/reset'){
   assert.equal(req.headers().authorization,'Bearer '+token);
   const data=req.postDataJSON();
   assert.match(data.key,/^guideedit\.book\.profile\./);
   delete values[data.key];resets.push(data.key);
   return send({ok:true,key:data.key});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  const panel=page.locator('#detailContent');
  const tabs=panel.locator('.ps-character-tabs');
  await tabs.waitFor({state:'visible',timeout:15000});
  assert.equal((await tabs.locator('[data-profile-copy-key="tab-character"]').textContent()).trim(),
   'Персонаж');
  assert.equal(await tabs.locator('.origin-copy-editable').count(),0);
  await tabs.locator('button').nth(1).click();
  await panel.locator('#ps-profile-field-name').waitFor({state:'visible'});
  assert.equal(await panel.locator('#ps-profile-field-name').inputValue(),'Profile smoke hero');
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:15000});
  const profileCaption=panel.locator('[data-profile-copy-key="tab-profile"]');
  await profileCaption.waitFor({state:'visible'});
  assert.equal(await panel.locator('.ps-profile-copy-pencil').count(),0);
  await profileCaption.dblclick();
  const input=profileCaption.locator('[data-owner-text-field]');
  await input.waitFor({state:'visible'});
  await input.fill('Мой профиль QA');
  await input.press('Tab');
  // The caption shows typed text *during* its asynchronous CAS write. Wait
  // for editor removal, not only matching text, before sending another F2.
  await input.waitFor({state:'detached',timeout:15000});
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-copy-key="tab-profile"]')?.textContent==='Мой профиль QA',
   null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.profile.tab-profile']).ru,'Мой профиль QA');
  const tabButton=panel.locator('.ps-character-tabs button[aria-selected="true"]');
  await tabButton.focus();await tabButton.press('F2');
  const cancelled=profileCaption.locator('[data-owner-text-field]');
  await cancelled.waitFor({state:'visible'});
  assert.equal(await cancelled.getAttribute('contenteditable'),'plaintext-only',
   'After save completes, F2 must open an editable new draft');
  await cancelled.fill('Не сохранять');
  await cancelled.press('Escape');
  assert.equal(writes.length,1);
  await tabs.locator('button').first().click();
  await panel.locator('.ps-overview-actions').waitFor({state:'visible',timeout:12000});
  const action=panel.locator('[data-profile-copy-key="action-edit-profile"]');
  await action.dblclick();
  const actionInput=action.locator('[data-owner-text-field]');
  await actionInput.waitFor({state:'visible'});
  await actionInput.fill('Открыть профиль QA');
  await actionInput.press('Tab');
  await actionInput.waitFor({state:'detached',timeout:15000});
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-copy-key="action-edit-profile"]')?.textContent==='Открыть профиль QA',
   null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.profile.action-edit-profile']).ru,
   'Открыть профиль QA');
  assert.equal(await panel.locator('.ps-overview-actions').isVisible(),true,
   'Double click must not navigate');
  await panel.locator('.ps-overview-actions button').last().click();
  await panel.locator('#ps-profile-field-name').waitFor({state:'visible',timeout:12000});
  assert.equal(await panel.locator('#ps-profile-field-guild').inputValue(),'Player data QA');
  // A modal workbench intercepts background pointer clicks by design.
  // Use its existing keyboard-accessible language action (no force click).
  await page.locator('#locale [data-locale="en"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  const english=panel.locator('[data-profile-copy-key="tab-profile"]');
  assert.equal((await english.textContent()).trim(),'Profile');
  await english.dblclick();
  const enInput=english.locator('[data-owner-text-field]');
  await enInput.waitFor({state:'visible'});
  await enInput.fill('My profile QA');
  await enInput.press('Tab');
  await enInput.waitFor({state:'detached',timeout:15000});
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-copy-key="tab-profile"]')?.textContent==='My profile QA',
   null,{timeout:15000});
  const profileKey='guideedit.book.profile.tab-profile';
  assert.deepEqual(JSON.parse(values[profileKey]),
   {ru:'Мой профиль QA',en:'My profile QA'});
  // A concurrent CAS failure must retain the draft in the current mounted
  // caption. Escape must not submit a second write or lose the last EN value.
  nextConflicts.add(profileKey);
  await english.dblclick();
  const conflict=english.locator('[data-owner-text-field]');
  await conflict.waitFor({state:'visible'});
  await conflict.fill('Conflicting English profile draft');
  await conflict.press('Tab');
  await english.locator('.ui-content-inline-error').waitFor({
   state:'visible',timeout:15000
  });
  assert.equal((await conflict.textContent()).trim(),'Conflicting English profile draft');
  assert.deepEqual(JSON.parse(values[profileKey]),
   {ru:'Мой профиль QA',en:'My profile QA'});
  await conflict.press('Escape');
  await conflict.waitFor({state:'detached'});
  assert.equal(writes.length,3);

  // Undo of the last English change must restore only the EN copy field and
  // keep the selected Profile tab, real hero inputs and existing DOM mounted.
  const mounted=await english.elementHandle();
  const dock=page.locator('#ownerDock');
  if(await dock.evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await dock.locator('[data-owner-collapse]').click();
  await dock.locator('[data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-copy-key="tab-profile"]')?.textContent==='Profile',
   null,{timeout:15000});
  assert.deepEqual(JSON.parse(values[profileKey]),{ru:'Мой профиль QA'});
  assert.equal(await mounted.evaluate(node=>node.isConnected),true,
   'Undo should not replace the selected profile caption');
  await mounted.dispose();
  assert.equal(await panel.locator('#ps-profile-field-name').inputValue(),
   'Profile smoke hero');
  assert.equal(await panel.locator('#ps-profile-field-guild').inputValue(),'Player data QA');

  // Narrow viewport: a long draft remains visible/readable in the actual
  // text node. Enter is an editor shortcut only for non-interactive copy.
  if(!await dock.evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await dock.locator('[data-owner-collapse]').click();
  await page.setViewportSize({width:390,height:780});
  const notes=panel.locator('[data-profile-copy-key="profile-notes"]');
  await notes.waitFor({state:'visible'});
  await notes.focus();
  await notes.press('Enter');
  const mobile=notes.locator('[data-owner-text-field][contenteditable="plaintext-only"]');
  await mobile.waitFor({state:'visible'});
  await mobile.fill('Long Profile editorial note that must wrap safely on mobile. '.repeat(8));
  const geometry=await mobile.evaluate(el=>{
   const rect=el.getBoundingClientRect(),css=getComputedStyle(el);
   return {left:rect.left,right:rect.right,width:rect.width,
    viewport:document.documentElement.clientWidth,
    overflowY:css.overflowY,whiteSpace:css.whiteSpace};
  });
  assert.ok(geometry.width>0&&geometry.left>=-2&&geometry.right<=geometry.viewport+2,
   'Owner Profile editor overflows mobile: '+JSON.stringify(geometry));
  assert.equal(geometry.whiteSpace,'pre-wrap');
  assert.notEqual(geometry.overflowY,'hidden');
  await mobile.press('Escape');
  assert.equal(writes.length,4,'409 and mobile Escape must not create CAS writes');
  assert.equal(await panel.locator('#ps-profile-field-name').inputValue(),
   'Profile smoke hero');
  // The 12 dynamic authorial phrases are edited in one owner-only panel,
  // never through player values or noisy per-caption pencil controls.
  const dynamicPanel=panel.locator('#ownerProfileDynamicCopy');
  await dynamicPanel.locator('summary').click();
  assert.equal(await dynamicPanel.locator('.studio-owner-interface-pencil').count(),0);
  const portrait=panel.locator('[data-profile-live="portrait-art"]');
  const originalSrc=await portrait.getAttribute('src');
  const portraitHandle=await portrait.elementHandle();
  assert.equal(await portrait.getAttribute('alt'),'Race appearance: Elf');
  const editDynamic=async(key,value)=>{
   const caption=panel.locator('#ownerProfileDynamicCopy [data-owner-copy-id="'+key+'"]');
   await caption.dblclick();
   const field=caption.locator('[data-owner-text-field]');
   await field.waitFor({state:'visible',timeout:12000});
   await field.fill(value);
   await field.press('Tab');
   await field.waitFor({state:'detached',timeout:15000});
  };
  await editDynamic('portrait-race-prefix','Race portrait QA');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-live="portrait-art"]')?.alt==='Race portrait QA Elf',
   null,{timeout:15000});
  assert.deepEqual(JSON.parse(values['guideedit.book.profile.portrait-race-prefix']),
   {en:'Race portrait QA'});
  await editDynamic('level-suffix','level QA');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-live="hero-summary"]')?.textContent.endsWith('45 level QA'),
   null,{timeout:15000});
  assert.equal(await portrait.getAttribute('src'),originalSrc);
  assert.equal(await portraitHandle.evaluate(node=>node.isConnected),true,
   'Live author copy must not remount the race artwork');
  await portraitHandle.dispose();
  assert.equal(await panel.locator('#ps-profile-field-name').inputValue(),'Profile smoke hero');
  assert.equal(await panel.locator('#ps-profile-field-guild').inputValue(),'Player data QA');
  assert.equal(await panel.locator('#ps-profile-description').inputValue(),'Biography draft');
  // Undo a newly created EN-only override uses the real reset route and
  // restores only the source unit, not the independently CAS-ed alt prefix.
  if(await dock.evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await dock.locator('[data-owner-collapse]').click();
  await dock.locator('[data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-live="hero-summary"]')?.textContent.endsWith('45 lvl.'),
   null,{timeout:15000});
  assert.deepEqual(resets,['guideedit.book.profile.level-suffix']);
  assert.equal(await portrait.getAttribute('alt'),'Race portrait QA Elf');
  assert.equal(values['guideedit.book.profile.level-suffix'],undefined);
  // Switching to Russian must not leak English author copy into the source
  // race label; the original game race remains a separate immutable suffix.
  await page.locator('#locale [data-locale="ru"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  assert.equal(await portrait.getAttribute('alt'),'Облик расы Эльф');
  assert.match(await panel.locator('[data-profile-live="hero-summary"]').textContent(),
   /45 ур\.$/);
  const ruEditor=panel.locator('#ownerProfileDynamicCopy');
  if(!await ruEditor.evaluate(node=>node.open))
   await ruEditor.locator('summary').click();
  await editDynamic('portrait-race-prefix','Портрет расы QA');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-live="portrait-art"]')?.alt==='Портрет расы QA Эльф',
   null,{timeout:15000});
  assert.deepEqual(JSON.parse(values['guideedit.book.profile.portrait-race-prefix']),
   {en:'Race portrait QA',ru:'Портрет расы QA'});
  await page.locator('#locale [data-locale="en"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert.equal(await portrait.getAttribute('alt'),'Race portrait QA Elf');
  assert.equal(await panel.locator('#ps-profile-field-name').inputValue(),'Profile smoke hero');
  assert.equal(await panel.locator('#ps-profile-field-guild').inputValue(),'Player data QA');
  assert.deepEqual(errors,[]);
  console.log('Chromium #390: profile guest, direct tabs/actions, F2/Esc, 409 CAS, Undo, RU/EN, mobile and hero preservation passed');
 }finally{await context.close()}
}
