import assert from 'node:assert/strict';

export async function runUIContentInlineSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const context=await browser.newContext({viewport:{width:1100,height:810}});
 // The results matrix exists only for an actual character. Start with a
 // deliberately local, non-account QA build; no player data is fetched.
 await context.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:8,level:45,name:'Editorial UI QA',
   stats:{'Сноровка':9},points:{archery:20},mastery:{},
   equipment:{},souls:{},refinements:{},gems:{}
  }));
 });
 const values={},writes=[],resets=[],errors=[],nextConflicts=new Set(),
  unconfirmedWrites=new Set(),slowWrites=new Set();
 // This group has no authored hover explanation by default. An owner copy
 // override supplies a *real* hint so that the only visible pencil edits
 // its independent hintRu field, not the visible group caption.
 values['guideedit.book.summary.group.0']=JSON.stringify({
  hintRu:'Результаты здоровья, маны и других вычислений героя.'
 });
 let slowLibraryNext=false,offeredRelease=null;
 await context.route('**/*',async route=>{
  const req=route.request(),url=req.url(),method=req.method();
  // Offer a synthetic newer release only for this mock browser context.
  // Never touch GitHub Pages, real Worker or live D1.
  if(offeredRelease&&url.startsWith(base+'/site-version.json?check='))
   return route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({release:offeredRelease})});
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
  if(path==='/api/library'){
   if(slowLibraryNext){slowLibraryNext=false;await new Promise(resolve=>setTimeout(resolve,1200));}
   return reply({records:[]});
  }
  if(path==='/api/admin/login'){
   assert.equal(req.postDataJSON().password,'Correct admin password!');
   return reply({token:'a'.repeat(43),expires:Date.now()+600000});
  }
  if(path==='/api/admin/catalog/test-write')return reply({
   ok:true,readback:true,cleaned:true,overrideReadback:true,
   overrideCleaned:true,activeCatalogUnchanged:true
  });
  // Undo of a freshly created text override uses DELETE semantics (reset),
  // not another override write. The mock must enforce the same CAS handshake
  // as the real Worker, or it can hide a legitimate editor regression.
  if(path==='/api/admin/reset'){
   assert.equal(req.headers().authorization,'Bearer '+'a'.repeat(43));
   const data=req.postDataJSON();
   assert.equal(data.expectedValue,
    Object.hasOwn(values,data.key)?values[data.key]:null);
   if(nextConflicts.delete(data.key))
    return reply({code:'OWNER_EDIT_CONFLICT',error:'Mock concurrent reset'},409);
   delete values[data.key];resets.push(data);
   return reply({ok:true,key:data.key,deleted:true,conditional:true});
  }
  if(path==='/api/admin/override'){
   assert.equal(req.headers().authorization,'Bearer '+'a'.repeat(43));
   const data=req.postDataJSON();
   assert.equal(data.expectedValue,Object.hasOwn(values,data.key)?values[data.key]:null);
   if(slowWrites.delete(data.key))await new Promise(resolve=>setTimeout(resolve,850));
   if(nextConflicts.delete(data.key))
    return reply({code:'OWNER_EDIT_CONFLICT',error:'Mock concurrent edit'},409);
   // Broken Worker adapter can return HTTP 200 without confirming persistence.
   if(unconfirmedWrites.delete(data.key))return reply({ok:true});
   values[data.key]=data.value;writes.push(data);
   return reply({ok:true,key:data.key,value:data.value,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // Never invoke owner keyboard actions before the native startup modal releases.
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#nav [data-tab="wiki"]').waitFor({state:'visible'});
  assert.equal(await page.locator('#nav .ui-content-pencil').count(),0,
   'Guest does not see editing controls');
  const published=await page.locator('meta[name="ps-studio-release"]')
   .getAttribute('content');
  offeredRelease=published.replace(/[0-9]+$/,last=>String(Number(last)+1));
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#studio-update-banner').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#studio-update-banner .account-copy-pencil').count(),0,
   'Only the authenticated owner may edit the update notice');
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:15000});
  // The update manager mounts after the main app and creates its banner
  // asynchronously. Its authorial text must join the SAME D1/CAS editor.
  const updateBanner=page.locator('#studio-update-banner');
  const updateNotice=updateBanner.locator('[data-update-role="message"]');
  await updateNotice.waitFor({state:'visible',timeout:12000});
  assert.equal(await updateBanner.locator('[data-owner-copy-pencil="siteUpdateNotice"]').count(),0);
  await updateNotice.dblclick();
  const updateInput=updateBanner.locator('.account-copy-edit-host [contenteditable]');
  await updateInput.fill('Новая версия сохранит текущего героя');
  await updateInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#studio-update-banner [data-update-role="message"]')?.textContent===
   'Новая версия сохранит текущего героя',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.site-update-notice']).ru,
   'Новая версия сохранит текущего героя');

  // A competing D1 owner edit must keep the draft and present an error,
  // not silently overwrite remote content or reload the current hero.
  nextConflicts.add('guideedit.book.ui.label.site-update-notice');
  await updateNotice.dblclick();
  const conflictInput=updateBanner.locator('.account-copy-edit-host [contenteditable]');
  await conflictInput.fill('Черновик обновления после конфликта');
  await conflictInput.press('Tab');
  await updateBanner.locator('.ui-content-inline-error').waitFor({
   state:'visible',timeout:15000});
  assert.equal(await conflictInput.textContent(),
   'Черновик обновления после конфликта');
  assert.equal(JSON.parse(values['guideedit.book.ui.label.site-update-notice']).ru,
   'Новая версия сохранит текущего героя');
  await conflictInput.press('Escape');
  assert.equal(await updateNotice.textContent(),
   'Новая версия сохранит текущего героя');

  // Direct editing does not insert pencils or replace stable action references.
  await updateBanner.locator('[data-update-role="apply"]').click();
  // Owner action captions distinguish a double-click from a single click.
  // Wait for the actual updater warning after its bounded click delay.
  await page.waitForFunction(()=>
   /выйди из режима владельца/i.test(document.querySelector(
    '#studio-update-banner [data-update-role="message"]')?.textContent||''),
   null,{timeout:3000});
  assert.match(await updateNotice.textContent(),/выйди из режима владельца/i);
  assert.equal(await updateBanner.locator(
   '[data-owner-copy-pencil="siteUpdateNotice"]').count(),0,
   'The notice edit affordance must be removed when a different warning is shown');
  await updateBanner.locator('[data-update-role="later"]').click();
  // This button also owns editable text. Wait for its real single-click
  // action to finish after double-click disambiguation.
  await updateBanner.waitFor({state:'detached',timeout:3000});
  assert.equal(await updateBanner.count(),0);
  // A fixed heading is itself the direct-edit target; no sibling pencil.
  const appearanceHeading=page.locator('#stageHeading');
  await appearanceHeading.waitFor({state:'visible'});
  assert.equal(await page.locator('.stage .panel-heading [data-ui-content-for="appearance"]').count(),0);
  await appearanceHeading.dblclick();
  const appearanceInput=page.locator('.stage .panel-heading .ui-content-edit-host [contenteditable]');
  await appearanceInput.fill('Облик героя');
  await appearanceInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#stageHeading')?.textContent===
   'Облик героя',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.appearance']).ru,'Облик героя');
  // A 200 response missing the conditional write proof is NOT a successful
  // owner save. Keep the exact draft and allow retry without a reload.
  unconfirmedWrites.add('guideedit.book.ui.label.appearance');
  await appearanceHeading.dblclick();
  const unconfirmedInput=page.locator(
   '.stage .panel-heading .ui-content-edit-host [contenteditable]');
  await unconfirmedInput.fill('Черновик после неподтверждённой записи');
  await unconfirmedInput.press('Tab');
  await page.locator('.stage .panel-heading .ui-content-inline-error')
   .waitFor({state:'visible',timeout:12000});
  assert.equal(await unconfirmedInput.textContent(),
   'Черновик после неподтверждённой записи');
  assert.equal(JSON.parse(values['guideedit.book.ui.label.appearance']).ru,
   'Облик героя','An unconfirmed HTTP 200 must not update D1 or the visible heading');
  await unconfirmedInput.press('Enter');
  await page.waitForFunction(()=>document.querySelector('#stageHeading')
   ?.textContent==='Черновик после неподтверждённой записи',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.appearance']).ru,
   'Черновик после неподтверждённой записи');
  // A long owner draft must remain fully measurable at a mobile viewport.
  // Escape discards the draft, preserving the real short heading.
  await page.setViewportSize({width:390,height:780});
  await appearanceHeading.dblclick();
  const longField=page.locator('.stage .panel-heading .ui-content-edit-host [contenteditable]');
  await longField.fill('Полное название или пояснение '.repeat(10));
  const visibleText=await longField.evaluate(el=>{
   const range=document.createRange();range.selectNodeContents(el);
   const field=el.getBoundingClientRect(),content=range.getBoundingClientRect();
   const css=getComputedStyle(el);
   return {whiteSpace:css.whiteSpace,overflowY:css.overflowY,
    scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,
    contentBottom:content.bottom,fieldBottom:field.bottom};
  });
  assert.equal(visibleText.whiteSpace,'pre-wrap');
  assert.ok(visibleText.scrollHeight<=visibleText.clientHeight+2,
   'Owner input clips long text vertically: '+JSON.stringify(visibleText));
  assert.ok(visibleText.contentBottom<=visibleText.fieldBottom+2,
   'Owner input cuts off the last entered line: '+JSON.stringify(visibleText));
  assert.notEqual(visibleText.overflowY,'hidden');
  await longField.press('Escape');
  assert.equal(await page.locator('#stageHeading').innerText(),
   'Черновик после неподтверждённой записи');
  await page.setViewportSize({width:1100,height:810});
  assert.equal(await page.locator('.right .panel-heading [data-ui-content-for="path"]').count(),0);
  assert.equal(await page.locator('.workspace>.left>.panel-heading [data-origin-edit-for="heading"]').count(),0);
  assert.equal(await page.locator('#pathGrowthPage [data-path-copy-for]').count(),0);
  // Edit a group heading and its help in the REAL Book. A D1 request must
  // not unmount the active editor or accidentally fold the results section.
  await page.waitForFunction(()=>
   document.querySelector('#catalogStatus')?.textContent?.includes('навыков'),
   null,{timeout:25000});
  await page.locator('#hero').click();
  const actions=page.locator('#stageBookPanel .stage-result-section-head .stage-guide-actions').first();
  const buttons=actions.locator('button');
  assert.equal(await buttons.count(),1,'Only the independent hover hint gets an edit control');
  assert.equal(await actions.locator('.stage-guide-edit-name').count(),0);
  const firstGroup=page.locator('#stageBookPanel details.stage-result-section').first();
  await firstGroup.waitFor({state:'visible'});
  const bookActions=firstGroup.locator('summary .stage-guide-actions');
  assert.equal(await bookActions.locator('button').count(),1);
  await bookActions.locator('.stage-guide-edit-hint').click();
  const bookHint=firstGroup.locator('summary [data-guide-key="summary.group.0"] [contenteditable]');
  await bookHint.fill('Не терять черновик при повторном двойном клике');
  await bookHint.dblclick();
  assert.equal(await bookHint.textContent(),
   'Не терять черновик при повторном двойном клике',
   'Double-click inside an active contenteditable must not open a nested editor');
  assert.equal(await firstGroup.locator('summary [data-guide-key="summary.group.0"] [data-owner-text-field]').count(),1);
  // Contenteditable is NOT a native input: while an asynchronous D1 save is
  // in flight, the submitted text must be locked and visibly busy.
  slowWrites.add('guideedit.book.summary.group.0');
  await bookHint.fill('Очки здоровья и маны героя');
  await bookHint.press('Tab');
  await page.waitForFunction(()=>{
   const node=document.querySelector('#stageBookPanel [data-guide-key="summary.group.0"]');
   return node?.getAttribute('aria-busy')==='true'&&
    node.querySelector('[data-owner-text-field]')?.getAttribute('contenteditable')==='false';
  },null,{timeout:6000});
  // Owner status and the real Undo button must agree with the pending CAS.
  await page.waitForFunction(()=>{
   const state=document.querySelector('#ownerDock [data-owner-save-state]');
   const undo=document.querySelector('#ownerDock [data-owner-undo]');
   return state?.dataset.state==='saving'&&undo?.disabled===true;
  },null,{timeout:6000});
  await page.waitForFunction(()=>
   !document.querySelector('#stageBookPanel .stage-result-section-head [contenteditable]'),
   null,{timeout:12000});
  assert.equal(await page.locator('#ownerDock [data-owner-save-state]').getAttribute('data-state'),'saved');
  assert.equal(await page.locator('#ownerDock [data-owner-undo]').isDisabled(),false);
  assert.equal(JSON.parse(values['guideedit.book.summary.group.0']).hintRu,
   'Очки здоровья и маны героя');
  assert.equal(await firstGroup.getAttribute('open'),'',
   'Editing a help text must not collapse the native results disclosure');
  await firstGroup.locator('summary [data-guide-key="summary.group.0"]').dblclick();
  const bookTitle=firstGroup.locator('summary [data-guide-key="summary.group.0"] [contenteditable]');
  await bookTitle.fill('Жизнь героя');
  await bookTitle.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stageBookPanel .stage-result-section-head [data-guide-key="summary.group.0"]')
   ?.textContent==='Жизнь героя',null,{timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.summary.group.0']).ru,'Жизнь героя');
  assert.equal(await firstGroup.getAttribute('open'),'');
  // Reject a CAS update: keep the exact draft beside a local error, and
  // restore editability so a retry or Escape is still possible.
  nextConflicts.add('guideedit.book.summary.group.0');
  await bookActions.locator('.stage-guide-edit-hint').click();
  const failedBook=firstGroup.locator('summary [data-guide-key="summary.group.0"] [data-owner-text-field]');
  await failedBook.fill('Неопубликованный текст должен остаться для повторной попытки');
  await failedBook.press('Tab');
  await firstGroup.locator('summary [data-guide-key="summary.group.0"] .ui-content-inline-error')
   .waitFor({state:'visible',timeout:12000});
  assert.match(await firstGroup.locator('summary [data-guide-key="summary.group.0"] .ui-content-inline-error').textContent(),/^Не сохранено:/);
  assert.equal(await failedBook.textContent(),
   'Неопубликованный текст должен остаться для повторной попытки');
  assert.equal(await failedBook.getAttribute('contenteditable'),'plaintext-only');
  assert.equal(await firstGroup.locator('summary [data-guide-key="summary.group.0"] [data-owner-text-field]').count(),1);
  assert.equal(JSON.parse(values['guideedit.book.summary.group.0']).hintRu,'Очки здоровья и маны героя');
  // Arm a tooltip hover while the unsaved editor is focused. A capturing
  // tooltip must not steal Escape from the editing control.
  await failedBook.evaluate(node=>{
   const label=node.closest('[data-guide-key]');
   window.PandoraGuideTooltip.attach(label,'Test guide hint',{hoverDelay:3000});
   label.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));
  });
  await failedBook.press('Escape');
  assert.equal(await firstGroup.locator('summary [data-guide-key="summary.group.0"] [data-owner-text-field]').count(),0);
  await page.locator('#stageAttributes .stage-book-close').click();
  const wiki=page.locator('#nav [data-i18n="wiki"]');
  await wiki.waitFor({state:'visible'});
  assert.equal(await page.locator('#nav [data-ui-content-for="wiki"]').count(),0);
  await wiki.dblclick();
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
  await wiki.dblclick();
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
  assert.match(await wiki.textContent(),/Справочник/);
  // A RU draft must not overwrite an existing EN value when the locale
  // changes before blur. Keep the active editor mounted through the switch.
  await wiki.dblclick();
  const liveRu=page.locator('#nav .ui-content-edit-host [contenteditable]');
  await liveRu.fill('📜 Изменённый русский текст');
  await page.evaluate(()=>document.querySelector('#locale [data-locale="en"]').click());
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  // The visible EN caption may already have the expected fallback before
  // the prior RU blur has finished its async CAS D1 write.
  const ruSave=page.waitForResponse(response=>
   response.url().endsWith('/api/admin/override')&&
   response.request().postDataJSON()?.key==='guideedit.book.ui.label.wiki'&&
   JSON.parse(response.request().postDataJSON()?.value||'{}').ru===
    '📜 Изменённый русский текст',{timeout:15000});
  await liveRu.press('Tab');
  const saved=await ruSave;
  assert.equal(saved.status(),200,'The RU draft must finish its CAS save');
  await page.waitForFunction(()=>document.querySelector('#nav [data-i18n="wiki"]')
   ?.textContent==='📜 Wiki Guide',null,{timeout:15000});
  assert.deepEqual(JSON.parse(values['guideedit.book.ui.label.wiki']),{
   ru:'📜 Изменённый русский текст',en:'📜 Wiki Guide'
  });
  assert.match(await wiki.textContent(),/Wiki Guide/);
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.querySelector('#nav [data-i18n="wiki"]')
   ?.textContent==='📜 Изменённый русский текст',null,{timeout:15000});

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
  // The goal here is the owner's real item-field editor. Use a real
  // pointer click for article navigation; keyboard navigation is separately
  // covered by encyclopedia keyboard smokes. A retained filter can rerender
  // the selected link during an Enter key event under CI CPU contention.
  await spear.click();
  await page.locator('#detailPanel.is-open').waitFor({state:'visible',timeout:15000});
  const penLabel=page.locator('.item-fields dt[data-item-field="PEN"]');
  await penLabel.waitFor({state:'visible',timeout:30000});
  await penLabel.locator('.wiki-hint-pencil').click();
  const field=page.locator('.item-fields .wiki-item-field-inline-editor[data-editor-field="PEN"] [contenteditable]');
  await field.fill('Чем меньше пробитие, тем выше минимальная атака.');
  await field.press('Tab');
  await page.waitForFunction(()=>document.querySelector('.item-fields dt .wiki-help-word[title="Чем меньше пробитие, тем выше минимальная атака."]')!==null,null,
   {timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.wiki.item-field.pen']).hintRu,
   'Чем меньше пробитие, тем выше минимальная атака.');
  const penBefore=await page.locator('.item-fields dt[data-item-field="PEN"] + dd').textContent();
  await penLabel.locator('.wiki-help-word').dblclick();
  const rename=page.locator('.item-fields .wiki-item-field-inline-editor[data-editor-field="PEN"] [contenteditable]');
  await rename.fill('Потенциал атаки');
  await rename.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.item-fields dt[data-item-field="PEN"] .wiki-help-word')?.textContent===
   'Потенциал атаки',null,{timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.wiki.item-field.pen']).ru,'Потенциал атаки');
  assert.equal(JSON.parse(values['guideedit.book.wiki.item-field.pen']).hintRu,
   'Чем меньше пробитие, тем выше минимальная атака.');
  assert.equal(await page.locator('.item-fields dt[data-item-field="PEN"] + dd').textContent(),penBefore);
  // The visible, source-verified patch note is real editorial UI copy.
  // A guest never sees editor controls; the owner changes text, not the
  // supported gameplay signature or character build.
  if(await page.locator('#detailPanel.is-open').count())
   await page.locator('#dockClose').click();
  await wiki.click();
  await page.locator('[data-wiki-chapter="skill"]').click();
  await search.click();
  await search.fill('Песчаная буря');
  const sandstorm=page.locator('[data-wiki-record="420007101"]');
  await sandstorm.waitFor({state:'visible',timeout:25000});
  await sandstorm.click();
  const patchNote=page.locator('.wiki-skill-source-insight p.wiki-description')
   .filter({hasText:'повышенный урон'});
  await patchNote.waitFor({state:'visible',timeout:15000});
  assert.doesNotMatch(await patchNote.textContent(),/коэффициент|не утверждается/);
  await patchNote.locator('span').first().dblclick();
  const patchInput=page.locator('.wiki-skill-source-insight p.wiki-description [contenteditable]');
  await patchInput.fill('Усиленная версия с сокращённой подготовкой и повышенным уроном.');
  await patchInput.press('Tab');
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.wiki-skill-source-insight p.wiki-description')).some(node=>node.textContent?.includes(
   'Усиленная версия с сокращённой подготовкой и повышенным уроном.')),null,
   {timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.wiki-ui.os-patch420007101']).ru,
   'Усиленная версия с сокращённой подготовкой и повышенным уроном.');
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
  // Account copy Undo must NOT recreate the login form or discard credentials.
  const draftPassword=page.locator('#accountPanel .account-form input[type="password"]').first();
  await draftPassword.fill('unsent-login-password');
  const passwordNode=await draftPassword.elementHandle();
  if(await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#accountPanel [data-owner-copy-key="accountGuestLead"]')?.textContent===
   'Вход открывает облачные билды.',null,{timeout:12000});
  assert.equal(await passwordNode.evaluate(node=>node.isConnected),true,
   'Undo must not reconstruct the account form');
  assert.equal(await draftPassword.inputValue(),'unsent-login-password');
  assert.equal(JSON.parse(values['guideedit.book.ui.label.account-guest-lead']).en,undefined);
  await passwordNode.dispose();
  // Clicking Undo outside an account popover intentionally closes it; reopening
  // must reuse the SAME preserved form rather than creating another one.
  await page.waitForFunction(()=>
   !document.querySelector('#accountPanel')?.classList.contains('is-closing'),
   null,{timeout:12000});
  if(!(await page.locator('#accountPanel').isVisible()))
   await page.locator('#profileTrigger').click();
  assert.equal(await draftPassword.inputValue(),'unsent-login-password');
  // Two explicit locale saves plus the additional live-switch RU regression.
  assert.equal(writes.filter(x=>x.key==='guideedit.book.ui.label.wiki').length,3);
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
  await saveNew.waitFor({state:'visible'});
  assert.equal(await page.locator('#detailContent [data-owner-copy-pencil="librarySaveNew"]').count(),0);
  assert.equal(await page.locator('#detailContent [data-owner-copy-key]').count()>=7,true);
  assert.equal(await page.locator('#detailContent .build-name-input[data-owner-copy-key]').count(),0,
   'The user-entered build name must not become owner-editable');
  console.log('UI test: editing library Russian copy');
  await saveNew.dblclick();
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
  await enLibrary.dblclick();
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
  // Earlier account-copy Undo may leave the same owner dock expanded.
  // Do not toggle it closed and then try to click the hidden Undo action.
  if(await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
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

  // The saved-build A/B panel must reuse the SAME author D1/CAS pipeline.
  // Neither comparison selections, generated counts, nor current user draft
  // are part of an owner-editable caption. No production API is touched.
  console.log('Chromium comparison D1 editorial copy: EN, CAS, 409, Undo, key switching');
  // The owner drawer was deliberately opened for the preceding Undo, and its
  // body overlaps the compact comparison heading. Use the real collapse
  // control rather than a force-click through the overlay.
  const compareOwnerDock=page.locator('#ownerDock');
  if(await compareOwnerDock.locator('[data-owner-collapse]')
   .getAttribute('aria-expanded')==='true')
   await compareOwnerDock.locator('[data-owner-collapse]').click();
  const compare=page.locator('#detailContent [data-build-compare]');
  const comparePanel=await compare.elementHandle();
  const compareTitle=compare.locator('[data-owner-copy-key="compareTitle"]');
  const comparisonName=await activeName.inputValue();
  await compareTitle.dblclick();
  const compareTitleEdit=compare.locator('.build-compare-title-group .account-copy-edit-host [contenteditable]');
  await compareTitleEdit.fill('Build comparison QA');
  await compareTitleEdit.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-owner-copy-key="compareTitle"]')?.textContent==='Build comparison QA',
   null,{timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.compare-title']).en,'Build comparison QA');
  assert.equal(await activeName.inputValue(),comparisonName);
  assert.equal(await comparePanel.evaluate(node=>node.isConnected),true);
  await compare.locator('[data-owner-copy-key="compareExpand"]').click();
  await compare.locator('[data-owner-copy-key="compareCollapse"]').waitFor({state:'visible'});
  assert.equal(await compare.locator('[data-owner-copy-pencil="compareExpand"]').count(),0);
  assert.equal(await compare.locator('.build-compare-expand').getAttribute('aria-expanded'),'true');
  const compareStatus=compare.locator('[data-owner-copy-key="compareNeedTwo"]');
  await compareStatus.waitFor({state:'visible'});
  await compareStatus.dblclick();
  const comparisonEdit=compare.locator('.build-compare-summary .account-copy-edit-host [contenteditable]');
  await comparisonEdit.fill('Save a pair of builds to compare.');
  await comparisonEdit.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-owner-copy-key="compareNeedTwo"]')?.textContent==='Save a pair of builds to compare.',
   null,{timeout:12000});
  const compareKey='guideedit.book.ui.label.compare-need-two';
  assert.equal(JSON.parse(values[compareKey]).en,'Save a pair of builds to compare.');
  // The update keeps its native status node and never replaces the A/B panel.
  assert.equal(await comparePanel.evaluate(node=>node.isConnected),true);
  assert.equal(await activeName.inputValue(),comparisonName);
  nextConflicts.add(compareKey);
  await compareStatus.dblclick();
  await comparisonEdit.fill('A compare caption that must survive HTTP 409');
  await comparisonEdit.press('Tab');
  await compare.locator('.build-compare-summary .ui-content-inline-error')
   .waitFor({state:'visible',timeout:12000});
  assert.equal(await comparisonEdit.textContent(),
   'A compare caption that must survive HTTP 409');
  assert.equal(JSON.parse(values[compareKey]).en,'Save a pair of builds to compare.');
  await comparisonEdit.press('Escape');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-owner-copy-key="compareNeedTwo"]')?.textContent==='Save a pair of builds to compare.',
   null,{timeout:12000});
  // Undo is scoped to the saved comparison caption; neither the open panel
  // nor an unsaved name belonging to the active hero may be remounted.
  if(await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-owner-copy-key="compareNeedTwo"]')?.textContent==='Save at least two builds to compare them.',
   null,{timeout:12000});
  assert.equal(await compare.locator('.build-compare-expand').getAttribute('aria-expanded'),'true');
  assert.equal(await activeName.inputValue(),comparisonName);
  assert.equal(await comparePanel.evaluate(node=>node.isConnected),true);
  assert.equal(JSON.parse(values['guideedit.book.ui.label.compare-title']).en,'Build comparison QA');
  assert.equal(Object.hasOwn(values,compareKey),false,
   'Undo removes the new comparison caption instead of inventing an empty JSON record');
  if(await compareOwnerDock.locator('[data-owner-collapse]')
   .getAttribute('aria-expanded')==='true')
   await compareOwnerDock.locator('[data-owner-collapse]').click();
  await comparePanel.dispose();

  // Cloud library status has its own lifecycle: change the currently
  // visible authored notice without editing a dynamic counter, saved build,
  // network error, or another user's account.
  const cloudLabel=page.locator('#detailContent .cloud-library-status');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .cloud-library-status')?.dataset.ownerCopyKey==='statusCloudConnected',
   null,{timeout:15000});
  assert.equal(await cloudLabel.textContent(),'Cloud library connected');
  await cloudLabel.dblclick();
  const cloudEditor=page.locator('#detailContent .cloud-library-status + .account-copy-edit-host [contenteditable]');
  await cloudEditor.fill('Cloud library checked and ready.');
  await cloudEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .cloud-library-status')?.textContent==='Cloud library checked and ready.',
   null,{timeout:15000});
  const cloudKey='guideedit.book.ui.label.status-cloud-connected';
  assert.equal(JSON.parse(values[cloudKey]).en,'Cloud library checked and ready.');
  // The workbench is modal and intercepts pointer clicks on the header.
  // The existing keyboard-accessible locale control must remain usable.
  await page.locator('#locale [data-locale="ru"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .cloud-library-status')?.dataset.ownerCopyKey==='statusCloudConnected',
   null,{timeout:15000});
  await cloudLabel.dblclick();
  await cloudEditor.fill('Облачная библиотека готова.');
  await cloudEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .cloud-library-status')?.textContent==='Облачная библиотека готова.',
   null,{timeout:15000});
  assert.deepEqual(JSON.parse(values[cloudKey]),{
   ru:'Облачная библиотека готова.',en:'Cloud library checked and ready.'
  });
  // Status transitions reuse the same paragraph with a newly current D1 key.
  slowLibraryNext=true;
  await page.locator('#detailContent [data-library-action-copy="libraryRefresh"]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .cloud-library-status')?.dataset.ownerCopyKey==='statusCloudChecking',
   null,{timeout:10000});
  assert.equal(await page.locator('#detailContent [data-owner-copy-pencil="statusCloudChecking"]').count(),0);
  assert.equal(await page.locator('#detailContent [data-owner-copy-pencil="statusCloudConnected"]').count(),0);
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .cloud-library-status')?.dataset.ownerCopyKey==='statusCloudConnected',
   null,{timeout:15000});
  assert.equal(await page.locator('#detailContent .cloud-library-status').textContent(),
   'Облачная библиотека готова.');
  // Undo the latest RU cloud status while its label is still mounted.
  const statusNode=await cloudLabel.elementHandle();
  if(await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .cloud-library-status')?.textContent==='Облачная библиотека подключена',
   null,{timeout:15000});
  assert.equal(await statusNode.evaluate(node=>node.isConnected),true,
   'Undo must patch, not reconstruct, the cloud library');
  assert.equal(await cloudLabel.getAttribute('data-owner-copy-key'),'statusCloudConnected');
  assert.equal(JSON.parse(values[cloudKey]).ru,undefined);
  assert.equal(JSON.parse(values[cloudKey]).en,'Cloud library checked and ready.');
  await statusNode.dispose();
  console.log('Chromium cloud statuses: RU/EN D1 CAS, Undo, live key rebinding, no remount');

  // Dynamic toast owner copy must follow locale switches even when a toast is
  // already open; runtime diagnostics must not become editable or be erased.
  console.log('UI test: live editable toast RU, EN and conflict feedback');
  await page.locator('#locale [data-locale="ru"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  // Trigger the production UI's existing diagnostics control rather than
  // reaching into the private app module from Playwright.
  if(await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock .owner-dock-d1-check').click();
  const statusKey='guideedit.book.ui.label.status-owner-d1-check';
  const toastText=page.locator('#studioToast [data-owner-copy-key="statusOwnerD1Check"]');
  await toastText.waitFor({state:'visible'});
  assert.equal(await toastText.textContent(),
   'D1: временная запись и чтение проверены, тестовые данные удалены.');
  await toastText.dblclick();
  const toastEditor=page.locator('#studioToast .account-copy-edit-host [contenteditable]');
  await toastEditor.fill('Запись удалена, ссылка отозвана.');
  await toastEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#studioToast [data-owner-copy-key="statusOwnerD1Check"]')?.textContent===
   'Запись удалена, ссылка отозвана.',null,{timeout:12000});
  assert.equal(JSON.parse(values[statusKey]).ru,'Запись удалена, ссылка отозвана.');

  await page.locator('#locale [data-locale="en"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.waitForFunction(()=>document.querySelector(
   '#studioToast [data-owner-copy-key="statusOwnerD1Check"]')?.textContent===
   'D1: test write and read succeeded; temporary data was removed.',null,{timeout:15000});
  assert.equal(await page.locator('#studioToast .studio-toast-content>strong').textContent(),'Done');
  assert.equal(await page.locator('#studioToast [data-owner-copy-pencil="statusOwnerD1Check"]').count(),0);
  await toastText.dblclick();
  await toastEditor.fill('Build removed and link revoked.');
  await toastEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#studioToast [data-owner-copy-key="statusOwnerD1Check"]')?.textContent===
   'Build removed and link revoked.',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[statusKey]),{
   ru:'Запись удалена, ссылка отозвана.',en:'Build removed and link revoked.'
  });

  // A CAS conflict in a toast edit must not replace the toast itself or
  // destroy typed text with another warning toast.
  nextConflicts.add(statusKey);
  await toastText.dblclick();
  await toastEditor.fill('Uncommitted owner text survives conflict');
  await toastEditor.press('Tab');
  const inlineFailure=page.locator('#studioToast .ui-content-inline-error');
  await inlineFailure.waitFor({state:'visible',timeout:12000});
  assert.match(await inlineFailure.textContent(),/changed in another window|изменили в другом окне/i);
  assert.match(await inlineFailure.textContent(),/^Not saved:/);
  assert.equal(await toastEditor.textContent(),'Uncommitted owner text survives conflict');
  assert.equal(await page.locator('#studioToast .studio-toast-content>strong').count(),1);
  await toastEditor.press('Escape');
  await toastText.waitFor({state:'visible'});
  assert.equal(await toastText.textContent(),'Build removed and link revoked.');
  assert.equal(JSON.parse(values[statusKey]).en,'Build removed and link revoked.');
  console.log('Chromium UI content: RU/EN status toast edit, live translation, 409 and local draft preservation passed');
  // The Wiki filter's selected ID is gameplay/UI state, never an editable
  // caption. In-place RU/EN CAS edits must update options without rebuilding
  // the list, losing the selection or exposing D1 controls to guests.
  // The top navigation is hidden behind an open builds workbench; use the
  // real Close control before switching chapters.
  if(await page.locator('#dockClose').isVisible())
   await page.locator('#dockClose').click();
  // The previous CAS-conflict test deliberately leaves the owner drawer open
  // with an error. Collapse only its visual panel before normal navigation;
  // neither suppress nor clear that failure or its D1 state.
  const ownerDrawer=page.locator('#ownerDock');
  if(await ownerDrawer.isVisible()&&
     await ownerDrawer.locator('[data-owner-collapse]').getAttribute('aria-expanded')==='true')
   await ownerDrawer.locator('[data-owner-collapse]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="item"]').click();
  const gearFilter=page.locator('.wiki-equipment-type');
  await gearFilter.waitFor({state:'visible',timeout:15000});
  assert.equal(await gearFilter.inputValue(),'equipment');
  assert.equal(await gearFilter.locator('option[value="weapon"]').textContent(),'Weapons');
  const filterGroup=page.locator('.wiki-filter-labels-editor');
  await filterGroup.locator('summary').click();
  const weaponCopy=filterGroup.locator('[data-owner-copy-id="filterEquipmentTypeWeapon"]');
  await weaponCopy.dblclick();
  const filterInput=weaponCopy.locator('[contenteditable]');
  await filterInput.fill('QA Weapons (EN)');
  await filterInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-equipment-type option[value="weapon"]')?.textContent==='QA Weapons (EN)',
   null,{timeout:12000});
  assert.equal(await gearFilter.inputValue(),'equipment');
  const gearKey='guideedit.book.wiki-ui.filter-equipment-type-weapon';
  assert.equal(JSON.parse(values[gearKey]).en,'QA Weapons (EN)');
  // Wiki is a modal workbench. The language selector is intentionally behind
  // it, so use the real Close action rather than forcing a click through it.
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="item"]').click();
  const gearRu=page.locator('.wiki-equipment-type');
  assert.equal(await gearRu.locator('option[value="weapon"]').textContent(),'Оружие');
  const ruGroup=page.locator('.wiki-filter-labels-editor');
  await ruGroup.locator('summary').click();
  const ruCaption=ruGroup.locator('[data-owner-copy-id="filterEquipmentTypeWeapon"]');
  await ruCaption.dblclick();
  await ruCaption.locator('[contenteditable]').fill('Оружие QA');
  await ruCaption.locator('[contenteditable]').press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-equipment-type option[value="weapon"]')?.textContent==='Оружие QA',
   null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[gearKey]),{en:'QA Weapons (EN)',ru:'Оружие QA'});
  await gearRu.selectOption('weapon');
  assert.equal(await gearRu.inputValue(),'weapon',
   'Editing an option label never changes the semantic filter value');
  await page.locator('[data-wiki-chapter="utility"]').click();
  assert.equal(await page.locator('.wiki-effect-type option[value="buff"]').textContent(),
   'Дают положительные эффекты');
  assert.ok(await page.locator('.wiki-filter-labels-editor [data-owner-copy-id="filterUtilityEffectBuff"]').count());
  await page.locator('[data-wiki-chapter="item"]').click();
  await page.locator('.wiki-equipment-type').selectOption('elemental');
  assert.ok(await page.locator('.wiki-elemental-type option[value="lightning"]').count());
  assert.ok(await page.locator('.wiki-filter-labels-editor [data-owner-copy-id="filterWeaponElementLightning"]').count());

  // Editable Wiki result copy must not own or overwrite live count nodes.
  // Use a chapter with >100 records to exercise real "Show more" navigation.
  await page.locator('.wiki-equipment-type').selectOption('equipment');
  const resultStatus=page.locator('#detailContent .wiki-list>p.muted');
  await resultStatus.waitFor({state:'visible'});
  const initialStatus=await resultStatus.textContent();
  const match=/^Показано (\d+) из (\d+) записей$/.exec(initialStatus);
  assert.ok(match,'The live result counter keeps both numeric values');
  assert.equal(Number(match[1]),100);
  assert.ok(Number(match[2])>100);
  const summaryEditor=page.locator(
   '#detailContent .studio-owner-interface-editor:not(.wiki-filter-labels-editor)');
  await summaryEditor.locator('summary').click();
  const summaryCaption=summaryEditor.locator('[data-owner-copy-id="resultsShown"]');
  await summaryCaption.dblclick();
  await summaryCaption.locator('[contenteditable]').fill('Найдено:');
  await summaryCaption.locator('[contenteditable]').press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .wiki-list>p.muted')?.textContent?.startsWith('Найдено: '),
   null,{timeout:15000});
  assert.equal(await resultStatus.textContent(),
   'Найдено: '+match[1]+' из '+match[2]+' записей');
  assert.equal(JSON.parse(values['guideedit.book.wiki-ui.results-shown']).ru,'Найдено:');

  // Real CAS conflict: do not overwrite the adjacent dynamic numbers, and
  // retain an unsaved draft until Esc cancels it.
  const resultMiddle=summaryEditor.locator('[data-owner-copy-id="resultsOf"]');
  nextConflicts.add('guideedit.book.wiki-ui.results-of');
  await resultMiddle.dblclick();
  const middleDraft=resultMiddle.locator('[contenteditable]');
  await middleDraft.fill('среди');
  await middleDraft.press('Tab');
  await resultMiddle.locator('.ui-content-inline-error')
   .waitFor({state:'visible',timeout:15000});
  assert.equal(await middleDraft.textContent(),'среди');
  assert.ok(!Object.hasOwn(values,'guideedit.book.wiki-ui.results-of'));
  await middleDraft.press('Escape');
  assert.equal(await resultStatus.textContent(),
   'Найдено: '+match[1]+' из '+match[2]+' записей');

  // Undo patches mounted caption and counter separately; full Wiki remount
  // would reset the scroll and search or disconnect this exact DOM node.
  const mountedCounter=await resultStatus.elementHandle();
  if(await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .wiki-list>p.muted')?.textContent?.startsWith('Показано '),
   null,{timeout:15000});
  assert.equal(await mountedCounter.evaluate(node=>node.isConnected),true);
  assert.equal(await resultStatus.textContent(),initialStatus);
  assert.equal(Object.hasOwn(values,'guideedit.book.wiki-ui.results-shown'),false);
  assert.equal(resets.at(-1)?.key,'guideedit.book.wiki-ui.results-shown',
   'Undo of newly created Wiki caption must use guarded D1 reset');
  await mountedCounter.dispose();
  // Restore the compact drawer before scrolling the long Wiki list: the
  // expanded owner dock intentionally overlaps the left-side chapter UI.
  if(!await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();

  const more=page.locator('#detailContent .wiki-list>.wiki-more');
  const moreLabel=await more.textContent();
  assert.match(moreLabel,/^Показать ещё 100 \/ \d+$/);
  await more.click();
  assert.equal(await page.locator('#detailContent .wiki-list [data-wiki-record]').count(),200);
  assert.match(await resultStatus.textContent(),
   /^Показано 200 из \d+ записей$/);
  await page.locator('[data-wiki-chapter="map"]').click();
  assert.ok(await page.locator('#detailContent .wiki-location-list-heading').count()>0);
  assert.ok(await summaryEditor.locator('[data-owner-copy-id="placeCity"]').count());
  assert.deepEqual(errors,[]);
  console.log('Chromium Wiki results: RU D1 CAS, 409 draft, Undo, live counters, more and groups passed');
  assert.deepEqual(errors,[]);
  console.log('Chromium Wiki filter D1 editorial: RU/EN CAS, ID invariants, utility and elemental choices passed');
 }finally{await context.close()}
}
