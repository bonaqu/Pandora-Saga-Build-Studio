import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';

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
 // The first summary group has no source-authored hover explanation.
 // Its visible title needs no pencil; the actual health stat has its own hint.
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
 // Caption buttons intentionally defer owner-mode single clicks to distinguish
 // them from direct-text double clicks. Wait for the actual chosen chapter
 // and for that pending action to finish before typing into its search box.
 // Give a named, source-specific failure with the current modal state.
 const expectHonorCaption=async(selector,expected,label)=>{
  try{
   await page.waitForFunction(({selector,expected})=>
    document.querySelector(selector)?.textContent===expected,
    {selector,expected},{timeout:15000});
  }catch(error){
   const actual=await page.evaluate(selector=>{
    const caption=document.querySelector(selector);
    return {language:document.documentElement.lang,
     text:caption?.textContent??null,
     editing:Boolean(caption?.querySelector('[contenteditable]')),
     honorOpen:Boolean(document.querySelector('.wiki-layout-honor')),
     detailOpen:Boolean(document.querySelector('#detailPanel.is-open'))};
   },selector);
   throw new Error('Honor editorial '+label+' failed; expected='+
    JSON.stringify(expected)+'; actual='+JSON.stringify(actual),{cause:error});
  }
 };
 const chooseWikiChapter=async key=>{
  const selector='[data-wiki-chapter="'+key+'"]';
  await page.locator(selector).click();
  await page.waitForFunction(chapterKey=>{
   const tab=document.querySelector('[data-wiki-chapter="'+chapterKey+'"]');
   return Boolean(tab?.classList.contains('chosen')&&
    tab.dataset.ownerCaptionPending!=='1');
  },key,{timeout:15000});
 };

 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // Never invoke owner keyboard actions before the native startup modal releases.
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#nav [data-tab="wiki"]').waitFor({state:'visible'});

  // Stage-only, verified bilingual D1 defaults can overlay this release's
  // authored copy WITHOUT a network request, gameplay rerender, owner
  // privilege, or altering the cloud overrides used by the real editor.
  const manifest=buildEditorialDefaultsManifest();
  const rows=manifest.records.map(r=>({...r}));
  const changes=[
   ['guideedit.wiki.labels','honor_victories_ru','Стадийные PvP победы'],
   ['guideedit.wiki.labels','honor_victories_en','Staging PvP Victories'],
   ['guideedit.honor.overview','overviewRu','Тестовое описание чести']
  ];
  for(const [key,field,value] of changes){
   const row=rows.find(r=>r.recordKey===key&&r.field===field);
   assert.ok(row,'Missing safe source-authored field for staged browser test');
   row.value=value;
  }
  const digest=createHash('sha256').update(JSON.stringify({
   schema:1,release:manifest.release,records:rows
  })).digest('hex');
  const staging={schema:1,release:manifest.release,records:rows,
   sha256:digest,snapshot:manifest.release+'-'+digest.slice(0,16)};
  const result=await page.evaluate(async payload=>{
   const defaults=window.PandoraEditorialDefaults;
   if(!defaults)return {moduleMissing:true};
   const before=window.PandoraWikiLabels.value({},'honor','victories','ru');
   const accepted=await defaults.installVerified(payload,payload.snapshot);
   const stagedRu=window.PandoraWikiLabels.value({},'honor','victories','ru');
   const stagedEn=window.PandoraWikiLabels.value({},'honor','victories','en');
   const guide=window.PandoraHonorGuide.article({}).overview.overviewRu;
   const bad=await defaults.installVerified({...payload,sha256:'0'.repeat(64)},
    payload.snapshot);
   const intact=window.PandoraWikiLabels.value({},'honor','victories','ru');
   defaults.reset();
   const restored=window.PandoraWikiLabels.value({},'honor','victories','ru');
   return {before,accepted,stagedRu,stagedEn,guide,bad,intact,restored,
    active:defaults.status().active};
  },staging);
  assert.equal(result.before,'Победы в PvP');
  assert.equal(result.accepted,true);
  assert.equal(result.stagedRu,'Стадийные PvP победы');
  assert.equal(result.stagedEn,'Staging PvP Victories');
  assert.equal(result.guide,'Тестовое описание чести');
  assert.equal(result.bad,false);
  assert.equal(result.intact,'Стадийные PvP победы');
  assert.equal(result.restored,'Победы в PvP');
  assert.equal(result.active,false);
  assert.equal(Object.keys(values).length,0,
   'Staged browser read must never create a mock admin D1 CAS override');
  console.log('Chromium #390: pinned SHA-256 RU/EN defaults, bad snapshot and rollback passed');

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
  // A title duplicating a button's ARIA is not a distinct hover-hint.
  const profileButton=page.locator('#profileTrigger');
  assert.equal(await profileButton.getAttribute('title'),'Войти или зарегистрироваться');
  assert.equal(await profileButton.getAttribute('aria-label'),'Войти или зарегистрироваться');
  assert.equal(await page.locator('#profileTrigger + .ui-content-pencil').count(),0);
  assert.equal(await page.locator('#profileTrigger + [data-ui-content-for="profileAccess"]').count(),0);
  // Icon-only accessible copy remains editable without adding an ordinary
  // caption pencil: F2 edits the same source shared by title and ARIA.
  assert.equal(await profileButton.getAttribute('aria-keyshortcuts'),'F2');
  await profileButton.focus();
  await profileButton.press('F2');
  const profileEditor=page.locator('#profileTrigger + .ui-content-edit-host [data-owner-text-field]');
  await profileEditor.waitFor({state:'visible'});
  await profileEditor.fill('Профиль или регистрация QA');
  await profileEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#profileTrigger')
   ?.getAttribute('title')==='Профиль или регистрация QA',null,{timeout:15000});
  assert.equal(await profileButton.getAttribute('aria-label'),'Профиль или регистрация QA');
  assert.equal(JSON.parse(values['guideedit.book.ui.label.profile-access']).ru,
   'Профиль или регистрация QA');
  assert.equal(await page.locator('#profileTrigger + .ui-content-pencil').count(),0);
  // Escape cancels a second edit without changing the saved D1 value.
  const profileWrites=writes.filter(entry=>entry.key==='guideedit.book.ui.label.profile-access').length;
  await profileButton.focus();await profileButton.press('F2');
  const discarded=page.locator('#profileTrigger + .ui-content-edit-host [data-owner-text-field]');
  await discarded.fill('Не сохранять доступ');
  await discarded.press('Escape');
  assert.equal(writes.filter(entry=>entry.key==='guideedit.book.ui.label.profile-access').length,
   profileWrites);
  assert.equal(await profileButton.getAttribute('title'),'Профиль или регистрация QA');
  // Owner help editor must list only independently mounted hover hints.
  // Self-explanatory Origin and Path tabs have no guide tooltip to edit.
  assert.equal(await page.locator(
   '[data-i18n="originGuide"] + .workbench-hint-editor').count(),0);
  const equipHints=page.locator(
   '[data-i18n="appearanceGuide"] + .workbench-hint-editor');
  const pathHints=page.locator(
   '[data-i18n="pathGuide"] + .workbench-hint-editor');
  await equipHints.waitFor({state:'visible'});
  assert.equal(await equipHints.locator('.studio-owner-interface-row').count(),4);
  assert.equal(await pathHints.locator('.studio-owner-interface-row').count(),1);
  assert.equal(await pathHints.locator('[data-owner-copy-id="hintGrowth"]').count(),0);
  assert.equal(await equipHints.locator('[data-owner-copy-id="hintPortrait"]').count(),1);
  await equipHints.locator('summary').click();
  const portraitHint=equipHints.locator('[data-owner-copy-id="hintPortrait"]');
  await portraitHint.dblclick();
  const portraitEdit=portraitHint.locator('[data-owner-text-field]');
  await portraitEdit.waitFor({state:'visible'});
  await portraitEdit.fill('Открыть Книгу героя · QA');
  await portraitEdit.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#hero')
   ?.dataset.guideHint==='Открыть Книгу героя · QA',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.equipment.hint-portrait']).ru,
   'Открыть Книгу героя · QA');
  if(await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector('#hero')?.dataset.guideHint===
   'Открыть Книгу героя с рассчитанными характеристиками.',
   null,{timeout:15000});
  assert.equal(Object.hasOwn(values,'guideedit.book.equipment.hint-portrait'),false);
  assert.equal(resets.at(-1)?.key,'guideedit.book.equipment.hint-portrait');
  if(!await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
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
  // The encyclopedia footer's words are owner-copy; actual D1 catalog
  // counts remain separate, stable DOM nodes across save and guarded Undo.
  await page.waitForFunction(()=>{
   const root=document.querySelector('#catalogStatus');
   return root?.querySelectorAll('[data-catalog-status-copy]').length===4&&
    root.querySelectorAll('[data-catalog-status-value]').length===3;
  },null,{timeout:30000});
  const footer=page.locator('#catalogStatus');
  const countCopy=await footer.locator('[data-catalog-status-value]')
   .evaluateAll(nodes=>nodes.map(node=>node.textContent));
  const numberNodes=await footer.locator('[data-catalog-status-value]').elementHandles();
  const skillWord=footer.locator('[data-catalog-status-copy="skills"]');
  assert.equal(await skillWord.textContent(),'навыков');
  assert.equal(await footer.locator('[data-owner-copy-section="catalog-sync"]').count(),4);
  const wasCollapsed=await page.locator('#ownerDock').evaluate(
   el=>el.classList.contains('owner-dock-collapsed'));
  if(!wasCollapsed)await page.locator('#ownerDock [data-owner-collapse]').click();
  await skillWord.dblclick();
  const footerInput=skillWord.locator('[data-owner-text-field]');
  await footerInput.fill('навыков QA');
  await footerInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#catalogStatus [data-catalog-status-copy="skills"]')?.textContent==='навыков QA',
   null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.catalog-sync.catalog-count-skills']).ru,
   'навыков QA');
  assert.deepEqual(await footer.locator('[data-catalog-status-value]')
   .evaluateAll(nodes=>nodes.map(node=>node.textContent)),countCopy);
  if(await page.locator('#ownerDock').evaluate(
   el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#catalogStatus [data-catalog-status-copy="skills"]')?.textContent==='навыков',
   null,{timeout:15000});
  assert.equal(Object.hasOwn(values,'guideedit.book.catalog-sync.catalog-count-skills'),false);
  assert.equal(resets.at(-1)?.key,'guideedit.book.catalog-sync.catalog-count-skills');
  // RU/EN use distinct existing CAS fields, while all three source
  // numbers keep their DOM identities through repeated language changes.
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert.equal(await skillWord.textContent(),'skills');
  assert.deepEqual(await footer.locator('[data-catalog-status-value]')
   .evaluateAll(nodes=>nodes.map(node=>node.textContent)),countCopy);
  if(!await page.locator('#ownerDock').evaluate(
   el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await skillWord.dblclick();
  const footerEnglish=skillWord.locator('[data-owner-text-field]');
  await footerEnglish.fill('skills QA');
  await footerEnglish.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#catalogStatus [data-catalog-status-copy="skills"]')?.textContent==='skills QA',
   null,{timeout:15000});
  assert.deepEqual(JSON.parse(values['guideedit.book.catalog-sync.catalog-count-skills']),{
   en:'skills QA'
  });
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  assert.equal(await skillWord.textContent(),'навыков');
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert.equal(await skillWord.textContent(),'skills QA');
  if(await page.locator('#ownerDock').evaluate(
   el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#catalogStatus [data-catalog-status-copy="skills"]')?.textContent==='skills',
   null,{timeout:15000});
  assert.equal(resets.at(-1)?.key,'guideedit.book.catalog-sync.catalog-count-skills');
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  assert.deepEqual(await footer.locator('[data-catalog-status-value]')
   .evaluateAll(nodes=>nodes.map(node=>node.textContent)),countCopy);
  for(const [index,node] of numberNodes.entries()){
   assert.equal(await node.evaluate(el=>el.isConnected),true,
    'Catalog count DOM node '+index+' must survive authorial Undo');
   await node.dispose();
  }
  if(wasCollapsed&&
   !await page.locator('#ownerDock').evaluate(
    el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();

  // A fixed heading is itself the direct-edit target; no sibling pencil.
  const appearanceHeading=page.locator('#stageHeading');
  await appearanceHeading.waitFor({state:'visible'});
  assert.equal(await page.locator('.stage .panel-heading [data-ui-content-for="appearance"]').count(),0);
  assert.equal(await appearanceHeading.getAttribute('aria-keyshortcuts'),'F2 Enter');
  await appearanceHeading.focus();
  await appearanceHeading.press('Enter');
  const keyboardDraft=page.locator('.stage .panel-heading .ui-content-edit-host [contenteditable]');
  await keyboardDraft.waitFor({state:'visible'});
  await keyboardDraft.fill('Отменено через Enter');
  await keyboardDraft.press('Escape');
  assert.equal(await appearanceHeading.textContent(),'Образ героя');
  assert.equal(Object.hasOwn(values,'guideedit.book.ui.label.appearance'),false,
   'Esc from Enter editor cannot produce an owner D1 CAS write');
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
  // Holding a *nested action* must never borrow its parent caption editor.
  await appearanceHeading.evaluate(el=>{
   const button=document.createElement('button');
   button.type='button';button.className='touch-owner-action-probe';
   button.textContent='Action';el.append(button);
  });
  const nestedAction=appearanceHeading.locator('.touch-owner-action-probe');
  await nestedAction.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,clientX:12,clientY:20
  });
  await page.waitForTimeout(560);
  assert.equal(await page.locator(
   '.stage .panel-heading .ui-content-edit-host [contenteditable]').count(),0);
  await nestedAction.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true});
  await nestedAction.evaluate(el=>el.remove());
  // Touch scrolling emits pointercancel; an unrelated synthetic document
  // scroll (e.g. a popup repositioning) must NOT cancel the touch editor.
  await appearanceHeading.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:17,clientX:12,clientY:20
  });
  await appearanceHeading.dispatchEvent('pointercancel',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:17
  });
  await page.waitForTimeout(530);
  assert.equal(await page.locator(
   '.stage .panel-heading .ui-content-edit-host [contenteditable]').count(),0);
  await appearanceHeading.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:18,clientX:12,clientY:20
  });
  await appearanceHeading.dispatchEvent('pointermove',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:18,clientX:50,clientY:20
  });
  await page.waitForTimeout(530);
  assert.equal(await page.locator(
   '.stage .panel-heading .ui-content-edit-host [contenteditable]').count(),0);
  await appearanceHeading.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true,pointerId:18});
  // Multi-touch must never open an editor during pinch/zoom or panning.
  await appearanceHeading.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:19,clientX:12,clientY:20
  });
  await appearanceHeading.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:false,button:0,pointerId:20,clientX:12,clientY:20
  });
  await page.waitForTimeout(530);
  assert.equal(await page.locator(
   '.stage .panel-heading .ui-content-edit-host [contenteditable]').count(),0);
  await appearanceHeading.dispatchEvent('pointercancel',{pointerType:'touch',pointerId:19});
  // A simultaneous mouse pointer on a hybrid tablet cannot interrupt
  // another still-held finger's authorial caption editor.
  await appearanceHeading.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:32,clientX:12,clientY:20
  });
  await appearanceHeading.dispatchEvent('pointermove',{
   pointerType:'mouse',isPrimary:true,button:0,pointerId:99,clientX:80,clientY:20
  });
  await appearanceHeading.dispatchEvent('pointerup',{
   pointerType:'mouse',isPrimary:true,button:0,pointerId:99
  });
  await page.waitForTimeout(570);
  const hybridTouch=page.locator(
   '.stage .panel-heading .ui-content-edit-host [contenteditable]');
  await hybridTouch.waitFor({state:'visible',timeout:6000});
  await hybridTouch.press('Escape');
  await appearanceHeading.dispatchEvent('pointerup',{
   pointerType:'touch',isPrimary:true,pointerId:32
  });
  // Owner touch gesture is long-press only on a plain caption. A short tap
  // must not replace a button click or expose the editor to a guest.
  await appearanceHeading.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,clientX:12,clientY:20
  });
  await page.waitForTimeout(570);
  const touchHeading=page.locator(
   '.stage .panel-heading .ui-content-edit-host [contenteditable]');
  await touchHeading.waitFor({state:'visible',timeout:6000});
  assert.equal(await touchHeading.textContent(),'Черновик после неподтверждённой записи');
  const menuBlocked=await appearanceHeading.evaluate(el=>{
   const menu=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});
   el.dispatchEvent(menu);return menu.defaultPrevented;
  });
  assert.equal(menuBlocked,true,'Native context menu must not hide an active touch editor');
  await touchHeading.press('Escape');
  await appearanceHeading.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true});
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
  const firstGroup=page.locator('#stageBookPanel details.stage-result-section').first();
  await firstGroup.waitFor({state:'visible'});
  // The author may rename the Book title, never the live 1/6 page counter.
  const bookHeading=page.locator('#stageAttributes .stage-book-title-text[data-owner-copy-key]');
  await bookHeading.waitFor({state:'visible'});
  assert.equal(await bookHeading.innerText(),'КНИГА ГЕРОЯ');
  assert.equal(await page.locator('#stageAttributes .stage-book-title-count').textContent(),' · 1 / 6');
  const headingKey=await bookHeading.getAttribute('data-owner-copy-key');
  const headingD1='guideedit.book.'+
   await page.evaluate(key=>window.PandoraUILocale.fieldKey(key),headingKey);
  await bookHeading.dblclick();
  const headingInput=page.locator('#stageAttributes .stage-book-heading .account-copy-edit-host [contenteditable]');
  await headingInput.fill('КНИГА ГЕРОЯ · QA');
  await headingInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#stageAttributes .stage-book-title-text')
   ?.textContent==='КНИГА ГЕРОЯ · QA',null,{timeout:15000});
  assert.equal(JSON.parse(values[headingD1]).ru,'КНИГА ГЕРОЯ · QA');
  assert.equal(await page.locator('#stageAttributes .stage-book-title-count').textContent(),' · 1 / 6');
  // Interactive captions are editable with a long press, but a synthetic
  // post-touch click must not navigate, change the current page or save a
  // different chapter. Short taps keep the original navigation.
  const tabCaption=page.locator(
   '#stageAttributes [data-book-page="defense"] .stage-book-tab-copy');
  await tabCaption.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:71,clientX:18,clientY:18
  });
  await page.waitForTimeout(570);
  const tabTouch=tabCaption.locator('[contenteditable]');
  await tabTouch.waitFor({state:'visible',timeout:6000});
  assert.equal(await page.locator('#stageBookPanel').getAttribute('data-book-visible'),'summary');
  // A click on another element (e.g. focus restoration or hybrid mouse)
  // must not consume suppression for the pending synthetic touch click.
  const unrelatedClicks=await tabCaption.evaluate(el=>{
   const unrelated=document.createElement('button');
   unrelated.type='button';unrelated.textContent='Unrelated action';
   el.ownerDocument.body.append(unrelated);
   let fired=0;unrelated.addEventListener('click',()=>fired++);
   unrelated.click();unrelated.remove();return fired;
  });
  assert.equal(unrelatedClicks,1,'Unrelated clicks are not blocked by touch editor');
  await tabCaption.dispatchEvent('click',{bubbles:true,cancelable:true,detail:1});
  assert.equal(await page.locator('#stageBookPanel').getAttribute('data-book-visible'),'summary',
   'Unrelated click must not consume delayed synthetic tab suppression');
  await tabTouch.press('Escape');
  await tabCaption.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true,pointerId:71});
  await page.locator('#stageAttributes [data-book-page="defense"]').click();
  await page.locator('#stageBookPanel[data-book-visible="defense"]')
   .waitFor({state:'visible',timeout:15000});
  await page.locator('#stageAttributes [data-book-page="summary"]').click();
  await page.locator('#stageBookPanel[data-book-visible="summary"]')
   .waitFor({state:'visible',timeout:15000});
  // HTML label = an action. A hold edits the author's RU/EN caption, not
  // the current character's mounted checkbox. Normal clicks still toggle.
  await page.locator('#stageAttributes [data-book-page="attack"]').click();
  await page.locator('#stageBookPanel[data-book-visible="attack"]')
   .waitFor({state:'visible',timeout:15000});
  const mountedLabel=page.locator('#stageBookPanel .stage-mounted-label');
  const mountedCheck=page.locator('#stageBookMountedToggle');
  await mountedLabel.waitFor({state:'visible',timeout:10000});
  const beforeMounted=await mountedCheck.isChecked();
  await mountedLabel.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:82,
   clientX:18,clientY:18
  });
  await page.waitForTimeout(570);
  const mountedTouch=mountedLabel.locator('[contenteditable]');
  await mountedTouch.waitFor({state:'visible',timeout:6000});
  await mountedLabel.dispatchEvent('click',{bubbles:true,cancelable:true,detail:1});
  assert.equal(await mountedCheck.isChecked(),beforeMounted,
   'A touch editor must not toggle a gameplay setting');
  await mountedTouch.press('Escape');
  await mountedLabel.dispatchEvent('pointerup',{
   pointerType:'touch',isPrimary:true,pointerId:82
  });
  await mountedLabel.click();
  await page.waitForFunction(previous=>
   document.querySelector('#stageBookMountedToggle')?.checked!==previous,
   beforeMounted,{timeout:15000});
  await mountedLabel.click();
  await page.waitForFunction(previous=>
   document.querySelector('#stageBookMountedToggle')?.checked===previous,
   beforeMounted,{timeout:15000});

  // A dynamic enhancement counter and its independent bilingual caption
  // must never share an editable source value. Check real owner D1 CAS and
  // the native disclosure guard without changing a character buff.
  await page.locator('#stageAttributes [data-book-page="buffs"]').click();
  await page.locator('#stageBookPanel[data-book-visible="buffs"]')
   .waitFor({state:'visible',timeout:15000});
  const overview=page.locator('#stageBookPanel .stage-buff-overview');
  await overview.waitFor({state:'visible'});
  const originalCount=await overview.locator('strong').innerText();
  const buffCaption=overview.locator('span[data-owner-copy-key]').first();
  assert.equal(await buffCaption.innerText(),'Выбранные усиления');
  const buffKey=await buffCaption.getAttribute('data-owner-copy-key');
  const buffD1='guideedit.book.'+
   await page.evaluate(key=>window.PandoraUILocale.fieldKey(key),buffKey);
  await buffCaption.dblclick();
  const buffEditor=overview.locator('.account-copy-edit-host [contenteditable]');
  await buffEditor.waitFor({state:'visible'});
  await buffEditor.fill('Активные усиления QA');
  await buffEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stageBookPanel .stage-buff-overview > span')?.textContent==='Активные усиления QA',
   null,{timeout:15000});
  assert.equal(JSON.parse(values[buffD1]).ru,'Активные усиления QA');
  assert.equal(await overview.locator('strong').innerText(),originalCount);
  assert.equal(await overview.locator('.account-copy-pencil').count(),0);
  const guildLabel=page.locator('#stageBookPanel summary [data-guide-key="buffs.guild"]').first();
  await guildLabel.waitFor({state:'visible',timeout:15000});
  const guildSummary=guildLabel.locator('xpath=ancestor::summary[1]');
  const guildDisclosure=guildSummary.locator('xpath=..');
  const wasOpen=await guildDisclosure.evaluate(node=>node.open);
  await guildLabel.dblclick();
  await guildLabel.locator('[contenteditable]').waitFor({state:'visible'});
  assert.equal(await guildDisclosure.evaluate(node=>node.open),wasOpen,
   'Double-clicking the owner caption must not toggle its guild disclosure');
  await guildLabel.locator('[contenteditable]').press('Escape');
  await guildSummary.locator('.stage-result-symbol').click();
  await page.waitForFunction(previous=>{
   const summary=document.querySelector('#stageBookPanel summary [data-guide-key="buffs.guild"]')
    ?.closest('summary');
   return summary?.parentElement?.open!==previous;
  },wasOpen,{timeout:5000});
  assert.equal(await overview.locator('strong').innerText(),originalCount);

  // Honor's native summary contains TWO independent owner captions.
  // Both must edit without toggling that same disclosure, and the second
  // caption must not be silently ignored by a guard bound to the first.
  const honorTitle=page.locator(
   '#stageBookPanel summary [data-guide-key="buffs.section.honor"]');
  const honorTerm=page.locator(
   '#stageBookPanel summary [data-guide-key="buffs.honor"]');
  await honorTitle.waitFor({state:'visible',timeout:15000});
  await honorTerm.waitFor({state:'visible',timeout:15000});
  const honorSummary=honorTerm.locator('xpath=ancestor::summary[1]');
  const honorDisclosure=honorSummary.locator('xpath=..');
  const honorWasOpen=await honorDisclosure.evaluate(node=>node.open);
  assert.equal(await honorTitle.innerText(),'Честь');
  assert.equal(await honorTerm.innerText(),'пассивное умение');
  await honorTitle.dblclick();
  const honorTitleEditor=honorTitle.locator('[contenteditable]');
  await honorTitleEditor.waitFor({state:'visible'});
  assert.equal(await honorDisclosure.evaluate(node=>node.open),honorWasOpen);
  await honorTitleEditor.press('Escape');
  await honorTerm.dblclick();
  const honorTermEditor=honorTerm.locator('[contenteditable]');
  await honorTermEditor.waitFor({state:'visible'});
  assert.equal(await honorDisclosure.evaluate(node=>node.open),honorWasOpen);
  await honorTermEditor.fill('пассивная способность QA');
  await honorTermEditor.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('#stageBookPanel summary [data-guide-key="buffs.honor"]')
    ?.textContent==='пассивная способность QA',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.buffs.honor']).ru,
   'пассивная способность QA');
  assert.equal(await honorDisclosure.evaluate(node=>node.open),honorWasOpen,
   'Editing either of two captions must preserve one native disclosure state');
  assert.equal(await honorSummary.locator('.stage-guide-edit-name').count(),0);

  // Deterministic DOM-only source-events fixture: the real renderer, no
  // live Worker or invented gameplay effect, isolates the published count
  // from the older stable Book D1 copy key in an actionable native summary.
  const procStructure=await page.evaluate(()=>{
   const host=document.createElement('div');document.body.append(host);
   try{
    window.PandoraStageAttributes.render(host,{
     page:'attack',items:[],
     modifiers:{specialEquipment:{entries:[{
      code:'EP_ONHIT_EDITORIAL_TEST',source:'Fixture item',
      ru:'Synthetic effect',en:'Synthetic effect'
     }]}}
    });
    const row=host.querySelector('.stage-source-events');
    const label=row?.querySelector('summary .stage-source-events-caption');
    return {label:label?.textContent,key:label?.dataset.ownerCopyKey,
     count:row?.querySelector('summary .stage-book-live-count')?.textContent,
     source:row?.querySelector('p')?.textContent,
     numberOfRows:row?.querySelectorAll('p').length};
   }finally{host.remove()}
  });
  assert.equal(procStructure.label,'Срабатывания предметов и душ');
  assert.match(procStructure.key||'',/^book-/);
  assert.equal(procStructure.count,' · 1');
  assert.equal(procStructure.source,'Fixture item · Synthetic effect');
  assert.equal(procStructure.numberOfRows,1);
  assert.equal(await overview.locator('strong').innerText(),originalCount,
   'A separate Book fixture cannot mutate the real hero buffs');

  // Source-only range fixture: the real Book renderer has two separate
  // editorial languages and numerically identical values. Never impersonate
  // a real OS skill, write D1, or localize unknown source skill identities.
  const rangeFixtures=await page.evaluate(()=>{
   const old=document.documentElement.lang,results=[];
   try{
    for(const language of ['ru','en']){
     document.documentElement.lang=language;
     const host=document.createElement('div');document.body.append(host);
     const edits=[];
     try{
      window.PandoraStageAttributes.render(host,{
       page:'attack',items:[],canEdit:true,
       modifiers:{skillAttackRange:{rows:[{
        id:910000001,name:'QA source skill',sourceBonus:42,
        sourceConstant:20,sourceMasteryPart:22,
        mode:'toggle',available:false,
        reasonRu:'Требуется мастерство QA',
        reasonEn:'Requires mastery QA'
       }]}},
       gameTerms:{skills:{'910000001':{id:910000001,name:'QA source skill'}},
        branchLabels:{archery:'Стрельба'},englishBranches:{archery:'Archery'}},
       onTextEdit:(_node,key,field,label)=>edits.push({key,field,label})
      });
      const row=host.querySelector('[data-range-skill="910000001"]');
      const bonus=row?.querySelector('.stage-skill-range-bonus .stage-skill-range-editorial');
      bonus?.dispatchEvent(new MouseEvent('dblclick',{
       bubbles:true,cancelable:true,detail:2}));
      results.push({
       language,
       bonus:bonus?.textContent,
       value:row?.querySelector('.stage-skill-range-bonus-value')?.textContent,
       sourceValue:row?.querySelector('.stage-skill-range-source-value')?.textContent,
       masteryValue:row?.querySelector('.stage-skill-range-mastery-value')?.textContent,
       sourceName:row?.querySelector('.stage-effect-skill-label')?.textContent,
       branch:row?.querySelector('.stage-skill-range-source-branch')?.textContent,
       reason:row?.querySelector('.stage-skill-range-source-reason')?.textContent,
       hintPencils:row?.querySelectorAll('.stage-guide-edit-hint').length,
       edits
      });
     }finally{host.remove()}
    }
   }finally{document.documentElement.lang=old}
   return results;
  });
  assert.deepEqual(rangeFixtures.map(x=>[x.language,x.bonus,x.branch,x.reason]),[
   ['ru','Прибавка к дальности','Стрельба','Требуется мастерство QA'],
   ['en','Range bonus','Archery','Requires mastery QA']
  ]);
  for(const [i,result] of rangeFixtures.entries()){
   assert.equal(result.value,'+42');
   assert.equal(result.sourceValue,'+20');
   assert.equal(result.masteryValue,'+22');
   assert.equal(result.sourceName,'QA source skill');
   assert.equal(result.hintPencils,0);
   assert.deepEqual(result.edits,[{key:'attack.skillRange.bonus',
    field:i===0?'ru':'en',label:i===0?'Прибавка к дальности':'Range bonus'}]);
  }

  await page.locator('#stageAttributes [data-book-page="summary"]').click();
  await page.locator('#stageBookPanel[data-book-visible="summary"]')
   .waitFor({state:'visible',timeout:15000});
  const groupTitle=firstGroup.locator('summary [data-guide-key="summary.group.0"]');
  // A group title has no independent hover hint. The correct owner UI must
  // NOT synthesize a pencil simply because its visible caption is editable.
  assert.equal(await firstGroup.locator('summary .stage-guide-edit-hint').count(),0,
   'A group heading without a real hover explanation has no pencil');
  // A summary text label has its own authorial D1 field. Holding it edits
  // that field without toggling the native disclosure on touch release.
  await groupTitle.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:72,clientX:18,clientY:18
  });
  await page.waitForTimeout(570);
  const groupTouch=groupTitle.locator('[contenteditable]');
  await groupTouch.waitFor({state:'visible',timeout:6000});
  const groupWasOpen=await firstGroup.getAttribute('open');
  await groupTitle.dispatchEvent('click',{bubbles:true,cancelable:true,detail:1});
  assert.equal(await firstGroup.getAttribute('open'),groupWasOpen);
  await groupTouch.press('Escape');
  await groupTitle.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true,pointerId:72});
  const stat=firstGroup.locator('.stage-result-grid [data-guide-key="summary.0"]');
  assert.equal(await stat.count(),1,'The first result is the source-backed health stat');
  assert.match(await stat.innerText(),/ОЗ|HP/);
  const statHint=firstGroup.locator('.stage-result-grid .stage-guide-actions').first();
  assert.equal(await statHint.locator('.stage-guide-edit-hint').count(),1,
   'The real hover explanation of health keeps precisely one hint pencil');
  assert.equal(await statHint.locator('.stage-guide-edit-name').count(),0);
  await stat.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,clientX:17,clientY:19
  });
  await page.waitForTimeout(570);
  const bookTouchEdit=stat.locator('[contenteditable]');
  await bookTouchEdit.waitFor({state:'visible',timeout:6000});
  await bookTouchEdit.press('Escape');
  await stat.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true});
  assert.equal(await statHint.locator('.stage-guide-edit-hint').count(),1,
   'Touch caption editing must not create a second pencil or rewrite a hover hint');
  await statHint.locator('.stage-guide-edit-hint').click();
  const bookHint=stat.locator('[contenteditable]');
  await bookHint.fill('Не терять черновик при повторном двойном клике');
  await bookHint.dblclick();
  assert.equal(await bookHint.textContent(),
   'Не терять черновик при повторном двойном клике',
   'Double-click inside an active contenteditable must not open a nested editor');
  assert.equal(await stat.locator('[data-owner-text-field]').count(),1);
  // A slow D1 write must lock the contenteditable and disallow Undo.
  slowWrites.add('guideedit.book.summary.0');
  await bookHint.fill('Очки здоровья и маны героя');
  await bookHint.press('Tab');
  await page.waitForFunction(()=>{
   const node=document.querySelector('#stageBookPanel [data-guide-key="summary.0"]');
   return node?.getAttribute('aria-busy')==='true'&&
    node.querySelector('[data-owner-text-field]')?.getAttribute('contenteditable')==='false';
  },null,{timeout:6000});
  await page.waitForFunction(()=>{
   const state=document.querySelector('#ownerDock [data-owner-save-state]');
   const undo=document.querySelector('#ownerDock [data-owner-undo]');
   return state?.dataset.state==='saving'&&undo?.disabled===true;
  },null,{timeout:6000});
  await page.waitForFunction(()=>
   !document.querySelector('#stageBookPanel [data-guide-key="summary.0"] [contenteditable]'),
   null,{timeout:12000});
  assert.equal(await page.locator('#ownerDock [data-owner-save-state]').getAttribute('data-state'),'saved');
  assert.equal(await page.locator('#ownerDock [data-owner-undo]').isDisabled(),false);
  assert.equal(JSON.parse(values['guideedit.book.summary.0']).hintRu,
   'Очки здоровья и маны героя');
  assert.equal(await firstGroup.getAttribute('open'),'',
   'Editing a real stat help must not collapse the native results disclosure');
  // The headline is a separate editable caption, even when it has no hint pencil.
  await groupTitle.dblclick();
  const bookTitle=groupTitle.locator('[contenteditable]');
  await bookTitle.fill('Жизнь героя');
  await bookTitle.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stageBookPanel .stage-result-section-head [data-guide-key="summary.group.0"]')
   ?.textContent==='Жизнь героя',null,{timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.summary.group.0']).ru,'Жизнь героя');
  assert.equal(await firstGroup.getAttribute('open'),'');
  // Reject a CAS hint update; the exact draft must remain recoverable.
  nextConflicts.add('guideedit.book.summary.0');
  await statHint.locator('.stage-guide-edit-hint').click();
  const failedBook=stat.locator('[data-owner-text-field]');
  await failedBook.fill('Неопубликованный текст должен остаться для повторной попытки');
  await failedBook.press('Tab');
  await stat.locator('.ui-content-inline-error').waitFor({
   state:'visible',timeout:12000});
  assert.match(await stat.locator('.ui-content-inline-error').textContent(),/^Не сохранено:/);
  assert.equal(await failedBook.textContent(),
   'Неопубликованный текст должен остаться для повторной попытки');
  assert.equal(await failedBook.getAttribute('contenteditable'),'plaintext-only');
  assert.equal(await stat.locator('[data-owner-text-field]').count(),1);
  assert.equal(JSON.parse(values['guideedit.book.summary.0']).hintRu,'Очки здоровья и маны героя');
  // Hover feedback must never intercept Escape from an unsaved hint editor.
  await failedBook.evaluate(node=>{
   const label=node.closest('[data-guide-key]');
   window.PandoraGuideTooltip.attach(label,'Test guide hint',{hoverDelay:3000});
   label.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));
  });
  await failedBook.press('Escape');
  assert.equal(await stat.locator('[data-owner-text-field]').count(),0);
  // A formerly hard-coded explanation beside live EXP values is now one
  // directly editable D1 label, without a redundant pencil or numeric edit.
  await page.locator('#stageAttributes [data-book-page="defense"]').click();
  await page.locator('#stageBookPanel[data-book-visible="defense"]')
   .waitFor({state:'visible',timeout:15000});
  const expDetails=page.locator('#stageBookPanel .stage-experience-effects');
  await expDetails.locator('summary').click();
  const noExp=expDetails.locator('p.stage-attribute-note[data-owner-copy-key]');
  await noExp.waitFor({state:'visible',timeout:15000});
  assert.equal(await noExp.innerText(),'Сейчас нет активных бонусов к опыту.');
  assert.equal(await expDetails.locator('.account-copy-pencil').count(),0);
  const expKey=await noExp.getAttribute('data-owner-copy-key');
  assert.match(expKey,/^book-/);
  const expD1='guideedit.book.'+
   await page.evaluate(key=>window.PandoraUILocale.fieldKey(key),expKey);
  await noExp.dblclick();
  const expInput=expDetails.locator('.account-copy-edit-host [contenteditable]');
  await expInput.fill('Бонусы опыта сейчас не действуют.');
  await expInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stageBookPanel .stage-experience-effects p.stage-attribute-note')?.textContent===
   'Бонусы опыта сейчас не действуют.',null,{timeout:15000});
  assert.equal(JSON.parse(values[expD1]).ru,'Бонусы опыта сейчас не действуют.');
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert.equal(await profileButton.getAttribute('title'),'Sign in or register');
  assert.equal(await profileButton.getAttribute('aria-label'),'Sign in or register');
  assert.equal(await page.locator('#profileTrigger + .ui-content-pencil').count(),0);
  const expEnglish=page.locator('#stageBookPanel .stage-experience-effects p.stage-attribute-note[data-owner-copy-key]');
  assert.equal(await expEnglish.innerText(),'No experience bonuses are currently active.');
  await expEnglish.dblclick();
  const expEnInput=page.locator('#stageBookPanel .stage-experience-effects .account-copy-edit-host [contenteditable]');
  await expEnInput.fill('No EXP bonus is active for this build.');
  await expEnInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stageBookPanel .stage-experience-effects p.stage-attribute-note')?.textContent===
   'No EXP bonus is active for this build.',null,{timeout:15000});
  assert.deepEqual(JSON.parse(values[expD1]),{
   ru:'Бонусы опыта сейчас не действуют.',en:'No EXP bonus is active for this build.'
  });
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
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
  if(await category.count())await chooseWikiChapter('item');
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
  await chooseWikiChapter('skill');
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
  // The verified Hymn has a static, source-gated explanation. The name, ID,
  // link chain, gameplay values and account state are not editor copy.
  const hymn=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),
   'utf8'))['340004001'];
  assert.ok(hymn?.name,'The tested hymn must originate from the catalog');
  await page.locator('#dockClose').click();
  await page.locator('#detailPanel.is-open').waitFor({state:'hidden',timeout:15000});
  await wiki.click();
  await page.locator('#detailPanel.is-open').waitFor({state:'visible',timeout:15000});
  await chooseWikiChapter('skill');
  await search.click();
  await search.fill(hymn.name);
  const hymnRecord=page.locator('[data-wiki-record="340004001"]');
  await hymnRecord.waitFor({state:'visible',timeout:25000});
  await hymnRecord.click();
  const hymnCaption=page.locator(
   '.wiki-skill-source-insight p.wiki-description [data-owner-copy-id="osSourceHymn340004001"]');
  await hymnCaption.waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('.wiki-skill-source-insight .wiki-owner-pencil').count(),0,
   'Static source notes edit by direct click, not a spare caption pencil');
  const originalHymn=await hymnCaption.innerText();
  assert.match(originalHymn,/стихийн|стихийн|стихийный|стихийного|стихийный урон/i);
  await hymnCaption.dblclick();
  const hymnEditor=page.locator('.wiki-skill-source-insight [contenteditable]').first();
  await hymnEditor.fill('Подтверждённое описание песни · QA');
  await hymnEditor.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.wiki-skill-source-insight [data-owner-copy-id="osSourceHymn340004001"]')
    ?.textContent==='Подтверждённое описание песни · QA',null,{timeout:15000});
  const hymnD1='guideedit.book.wiki-ui.os-source-hymn340004001';
  assert.equal(JSON.parse(values[hymnD1]).ru,'Подтверждённое описание песни · QA');
  assert.ok(writes.some(x=>x.key===hymnD1&&x.expectedValue===null),
   'The source-gated owner note uses the same CAS handshake as other labels');
  const skillSourceHeading=page.locator(
   '.wiki-skill-source-insight h4[data-owner-copy-id="sourceSkillEffectsHeading"]');
  assert.equal(await skillSourceHeading.innerText(),'Действие умения');
  await skillSourceHeading.dblclick();
  const sourceHeadingInput=page.locator('.wiki-skill-source-insight [contenteditable]').first();
  await sourceHeadingInput.fill('Действие умения · QA');
  await sourceHeadingInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-skill-source-insight h4[data-owner-copy-id="sourceSkillEffectsHeading"]')
   ?.textContent==='Действие умения · QA',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.wiki-ui.source-skill-effects-heading']).ru,
   'Действие умения · QA');
  // The role label is independently editable; the actual wiki links and
  // verified chain IDs must remain unchanged after the D1 CAS save.
  const areaRole=page.locator(
   '.wiki-skill-source-chain [data-owner-copy-id="sourceAreaRole"]').first();
  await areaRole.waitFor({state:'visible',timeout:15000});
  const linksBefore=await page.locator('.wiki-skill-source-chain a[href]')
   .evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
  assert.ok(linksBefore.length>=3,'The Hymn still has its verified root/area/target chain');
  await areaRole.dblclick();
  const roleInput=page.locator('.wiki-skill-source-chain [contenteditable]').first();
  await roleInput.fill('Зона влияния:');
  await roleInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-skill-source-chain [data-owner-copy-id="sourceAreaRole"]')
   ?.textContent==='Зона влияния:',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.wiki-ui.source-area-role']).ru,
   'Зона влияния:');
  assert.deepEqual(await page.locator('.wiki-skill-source-chain a[href]')
   .evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href'))),linksBefore);
  // The Honor PvP table headings are authorial copy, but rewards and rank
  // counts are game data. Verify direct editing on the real owner surface.
  await page.locator('#dockClose').click();
  await wiki.click();
  await search.click();
  await search.fill('');
  await chooseWikiChapter('honor');
  const honorPane=page.locator('.wiki-page');
  // Honor owner actions retain native Enter/Space behavior, with F2 and
  // double-click editing only their caption using the existing D1/CAS path.
  const zoneList=honorPane.locator('#honor-gain .wiki-honor-list-section').first();
  const linkAction=zoneList.locator('.wiki-honor-add');
  await linkAction.waitFor({state:'visible'});
  const linkCaption=linkAction.locator('[data-owner-copy-id="linkZoneAction"]');
  assert.equal(await linkCaption.innerText(),'+ Связать локацию');
  const linkedRows=await zoneList.locator('.wiki-honor-list-row').count();
  await linkCaption.dblclick();
  const linkEditor=linkCaption.locator('[contenteditable]');
  await linkEditor.waitFor({state:'visible',timeout:8000});
  await linkEditor.fill('+ Связать локацию QA');
  await linkEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#honor-gain .wiki-honor-add [data-owner-copy-id="linkZoneAction"]')
   ?.textContent==='+ Связать локацию QA',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.honor-view.link-zone-action']).ru,
   '+ Связать локацию QA');
  assert.equal(await zoneList.locator('.wiki-honor-list-row').count(),linkedRows);
  // A deferred owner-caption mouse click must be cancelled by a new
  // pointerdown elsewhere, never open a stale form over the next task.
  await linkAction.click();
  assert.equal(await linkAction.getAttribute('data-owner-caption-pending'),'1');
  await honorPane.locator('.wiki-honor-title').click();
  await page.waitForTimeout(600);
  assert.equal(await linkAction.getAttribute('data-owner-caption-pending'),null);
  assert.equal(await zoneList.locator('.wiki-honor-new').count(),0,
   'Leaving a pending Honor action cannot open a stale form');
  await linkAction.click();
  await zoneList.locator('.wiki-honor-new').waitFor({state:'visible',timeout:6000});
  const cancelAction=zoneList.locator('.wiki-honor-new .wiki-owner-remove').first();
  await cancelAction.focus();await cancelAction.press('F2');
  const cancelEditor=cancelAction.locator('[contenteditable]');
  await cancelEditor.waitFor({state:'visible',timeout:8000});
  await cancelEditor.press('Escape');
  await cancelAction.press('Enter');
  await zoneList.locator('.wiki-honor-new').waitFor({state:'detached',timeout:6000});
  assert.equal(await zoneList.locator('.wiki-honor-list-row').count(),linkedRows);
  // Only the authorial heading is editable; no owner override may replace
  // the source-defined PvP weekdays in its immutable sibling node.
  const doubleRewards=honorPane.locator('#honor-victories .wiki-honor-double-rewards');
  const fixedDays=doubleRewards.locator('.wiki-honor-fixed-schedule');
  const daysBefore=await fixedDays.textContent();
  assert.equal(daysBefore,': вторник и четверг');
  assert.equal(await fixedDays.getAttribute('data-owner-copy-id'),null);
  const rewardHeading=doubleRewards.locator('[data-owner-copy-id="pvpDoubleHeading"]');
  await rewardHeading.dblclick();
  const headingEditor=rewardHeading.locator('[contenteditable]');
  await headingEditor.waitFor({state:'visible',timeout:8000});
  await headingEditor.fill('Бонусные награды');
  await headingEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-honor-pvp-heading-copy[data-owner-copy-id="pvpDoubleHeading"]')
   ?.textContent==='Бонусные награды',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.honor-view.pvp-double-heading']).ru,
   'Бонусные награды');
  assert.equal(await fixedDays.textContent(),daysBefore);
  assert.equal(await fixedDays.locator('[contenteditable]').count(),0);
  const tableHead=honorPane.locator(
   '.wiki-honor-pvp-label[data-owner-copy-id="pvpDailyHeading"]');
  await tableHead.waitFor({state:'visible',timeout:20000});
  const rewardsBefore=await honorPane.locator('#honor-victories .wiki-honor-pvp-table tbody')
   .first().innerText();
  assert.equal(await tableHead.innerText(),'Ежедневные награды');
  assert.equal(await honorPane.locator('.wiki-honor-pvp-group .wiki-honor-copy-pencil').count(),0);
  await tableHead.dblclick();
  const tableInput=honorPane.locator('.wiki-honor-pvp-label [contenteditable]').first();
  await tableInput.fill('Награды за сутки');
  await tableInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-honor-pvp-label[data-owner-copy-id="pvpDailyHeading"]')
   ?.textContent==='Награды за сутки',null,{timeout:15000});
  const honorD1='guideedit.book.honor-view.pvp-daily-heading';
  assert.equal(JSON.parse(values[honorD1]).ru,'Награды за сутки');
  assert.equal(await honorPane.locator('#honor-victories .wiki-honor-pvp-table tbody')
   .first().innerText(),rewardsBefore,
   'Editing a header must not mutate the game reward table');
  // Previously the client offered this PvP paragraph editor but the actual
  // Worker rejected its pvpIntroRu/En fields as unknown Honor overview keys.
  const victoryIntro=honorPane.locator(
   '#honor-victories .wiki-honor-field-edit-row p.wiki-honor-copy').first();
  await victoryIntro.waitFor({state:'visible',timeout:12000});
  await victoryIntro.dblclick();
  const introInput=honorPane.locator(
   '#honor-victories .wiki-honor-field-edit-row [contenteditable]').first();
  await introInput.waitFor({state:'visible'});
  await introInput.fill('Официальное описание события PvP · QA.');
  await introInput.press('Tab');
  await expectHonorCaption('#honor-victories .wiki-honor-copy',
   'Официальное описание события PvP · QA.','RU PvP introduction');
  assert.equal(JSON.parse(values['guideedit.honor.overview']).pvpIntroRu,
   'Официальное описание события PvP · QA.');
  assert.equal(await honorPane.locator('#honor-victories .wiki-honor-pvp-table tbody')
   .first().innerText(),rewardsBefore,
   'Editing event intro copy cannot rewrite source reward values');
  const sectionsCaption=page.locator(
   '.wiki-layout-honor .wiki-honor-sections-label [data-owner-copy-id="sectionsHeading"]');
  assert.equal(await sectionsCaption.textContent(),'Разделы');
  assert.equal(await page.locator('.wiki-layout-honor .wiki-honor-live-count').textContent(),' · 5');
  await sectionsCaption.dblclick();
  const sectionsInput=page.locator('.wiki-layout-honor .wiki-honor-sections-label [contenteditable]');
  await sectionsInput.fill('Категории');
  await sectionsInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-honor-sections-label [data-owner-copy-id="sectionsHeading"]')
   ?.textContent==='Категории',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.honor-view.sections-heading']).ru,'Категории');
  assert.equal(await page.locator('.wiki-layout-honor .wiki-honor-live-count').textContent(),' · 5');
  // The left navigation shares the actual Wiki honor label with its chapter,
  // so a second title registry or an editable nav ID must never appear.
  const honorNav=page.locator(
   '.wiki-layout-honor [data-honor-section="overview"] .wiki-honor-nav-caption');
  assert.equal(await honorNav.textContent(),'Система чести');
  await honorNav.dblclick();
  const honorNavInput=page.locator(
   '.wiki-layout-honor [data-honor-section="overview"] [contenteditable]');
  await honorNavInput.fill('Правила чести');
  await honorNavInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-layout-honor [data-honor-section="overview"] .wiki-honor-nav-caption')
   ?.textContent==='Правила чести',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.wiki.labels']).honor_overview_ru,'Правила чести');
  assert.equal(await honorPane.locator('#honor-victories').count(),1,
   'A double-click in the chapter menu must not navigate away from Honor');
  // The fifth known Wiki Honor chapter is also legal on the actual Worker.
  // Previously its owner CAS save could be rejected as an unknown label.
  const victoryNav=page.locator(
   '.wiki-layout-honor [data-honor-section="victories"] .wiki-honor-nav-caption');
  await victoryNav.waitFor({state:'visible'});
  assert.equal(await victoryNav.innerText(),'Победы в PvP');
  await victoryNav.dblclick();
  const victoryEditor=page.locator(
   '.wiki-layout-honor [data-honor-section="victories"] [contenteditable]');
  await victoryEditor.fill('Победы героев PvP');
  await victoryEditor.press('Tab');
  await expectHonorCaption(
   '.wiki-layout-honor [data-honor-section="victories"] .wiki-honor-nav-caption',
   'Победы героев PvP','RU PvP navigation');
  assert.equal(JSON.parse(values['guideedit.wiki.labels']).honor_victories_ru,
   'Победы героев PvP');
  assert.equal(await page.locator('.wiki-honor-live-count').textContent(),' · 5');
  // The Wiki detail is aria-modal and covers the pointer target. Exercise
  // the existing keyboard locale path without bypassing the modal with force.
  await page.locator('#locale [data-locale="en"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  const victoryEnglish=page.locator(
   '.wiki-layout-honor [data-honor-section="victories"] .wiki-honor-nav-caption');
  await victoryEnglish.waitFor({state:'visible',timeout:15000});
  assert.equal(await victoryEnglish.innerText(),'PvP Victories');
  await victoryEnglish.dblclick();
  const victoryEnglishInput=page.locator(
   '.wiki-layout-honor [data-honor-section="victories"] [contenteditable]');
  await victoryEnglishInput.fill('Hero PvP Victories');
  await victoryEnglishInput.press('Tab');
  await expectHonorCaption(
   '.wiki-layout-honor [data-honor-section="victories"] .wiki-honor-nav-caption',
   'Hero PvP Victories','EN PvP navigation');
  const englishIntro=page.locator(
   '#honor-victories .wiki-honor-field-edit-row p.wiki-honor-copy').first();
  await englishIntro.dblclick();
  const englishIntroInput=page.locator(
   '#honor-victories .wiki-honor-field-edit-row [contenteditable]').first();
  await englishIntroInput.fill('Verified PvP event introduction · QA.');
  await englishIntroInput.press('Tab');
  await expectHonorCaption('#honor-victories .wiki-honor-copy',
   'Verified PvP event introduction · QA.','EN PvP introduction');
  assert.deepEqual(JSON.parse(values['guideedit.honor.overview']),{
   pvpIntroRu:'Официальное описание события PvP · QA.',
   pvpIntroEn:'Verified PvP event introduction · QA.'
  });
  assert.deepEqual(JSON.parse(values['guideedit.wiki.labels']),{
   honor_overview_ru:'Правила чести',honor_victories_ru:'Победы героев PvP',
   honor_victories_en:'Hero PvP Victories'
  });
  await page.locator('#locale [data-locale="ru"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  await expectHonorCaption(
   '.wiki-layout-honor [data-honor-section="victories"] .wiki-honor-nav-caption',
   'Победы героев PvP','RU PvP navigation');
  assert.equal(await page.locator('.wiki-honor-live-count').textContent(),' · 5');
  // Rank requirements that come from numeric records must never be editable
  // as one paragraph. Edit only their authorial words (same CAS/Undo store).
  // Existing custom requirement fields remain separately editable for
  // backward compatibility with pre-#390 Honor overrides.
  const rankReq=honorPane.locator('#honor-rank-2 .wiki-honor-requirement');
  const immutableNumbers=rankReq.locator('.wiki-honor-runtime-value');
  const beforeThresholds=await immutableNumbers.allTextContents();
  assert.equal(beforeThresholds.length,2);
  assert.equal(beforeThresholds[0].replace(/\D/g,''),'3000');
  assert.equal(beforeThresholds[1].replace(/\D/g,''),'20000');
  assert.equal(await rankReq.locator('.wiki-honor-direct-pencil').count(),0);
  const rankLead=rankReq.locator('[data-owner-copy-id="rankReqPointsLead"]');
  await rankLead.dblclick();
  const rankEditor=rankLead.locator('[contenteditable]');
  await rankEditor.fill('Для ранга требуется');
  await rankEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#honor-rank-2 [data-owner-copy-id="rankReqPointsLead"]')
   ?.textContent==='Для ранга требуется',null,{timeout:15000});
  const rankCaptionKey='guideedit.book.honor-view.rank-req-points-lead';
  assert.equal(JSON.parse(values[rankCaptionKey]).ru,'Для ранга требуется');
  assert.deepEqual(await immutableNumbers.allTextContents(),beforeThresholds);
  // An English edit must not replace the Russian value or any live number.
  await page.locator('#locale [data-locale="en"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  const enRank=page.locator('#honor-rank-2 .wiki-honor-requirement');
  const enNumbers=enRank.locator('.wiki-honor-runtime-value');
  assert.deepEqual((await enNumbers.allTextContents()).map(s=>s.replace(/\D/g,'')),
   ['3000','20000']);
  const enRankLead=enRank.locator('[data-owner-copy-id="rankReqPointsLead"]');
  await enRankLead.focus();
  await page.keyboard.press('F2');
  const enRankEditor=enRankLead.locator('[contenteditable]');
  await enRankEditor.fill('This rank requires');
  await enRankEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#honor-rank-2 [data-owner-copy-id="rankReqPointsLead"]')
   ?.textContent==='This rank requires',null,{timeout:15000});
  assert.deepEqual(JSON.parse(values[rankCaptionKey]),{
   ru:'Для ранга требуется',en:'This rank requires'
  });
  assert.deepEqual((await enNumbers.allTextContents()).map(s=>s.replace(/\D/g,'')),
   ['3000','20000']);
  await page.locator('#locale [data-locale="ru"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  assert.equal(await page.locator(
   '#honor-rank-2 [data-owner-copy-id="rankReqPointsLead"]').textContent(),
   'Для ранга требуется');
  assert.deepEqual((await page.locator(
   '#honor-rank-2 .wiki-honor-runtime-value').allTextContents())
   .map(s=>s.replace(/\D/g,'')),['3000','20000']);
  // A CAS conflict cannot replace the verified numerical requirements or
  // discard the exact draft. Undo should remove the latest EN translation
  // without reverting the already saved RU translation.
  const ruRankLead=page.locator('#honor-rank-2 [data-owner-copy-id="rankReqPointsLead"]');
  nextConflicts.add(rankCaptionKey);
  await ruRankLead.dblclick();
  const rankDraft=ruRankLead.locator('[contenteditable]');
  await rankDraft.fill('Неопубликованный черновик требования ранга');
  await rankDraft.press('Tab');
  await ruRankLead.locator('.ui-content-inline-error').waitFor({state:'visible',timeout:15000});
  assert.equal(await rankDraft.textContent(),'Неопубликованный черновик требования ранга');
  assert.equal(JSON.parse(values[rankCaptionKey]).ru,'Для ранга требуется');
  assert.deepEqual((await page.locator('#honor-rank-2 .wiki-honor-runtime-value')
   .allTextContents()).map(s=>s.replace(/\D/g,'')),['3000','20000']);
  await rankDraft.press('Escape');
  assert.equal(await ruRankLead.textContent(),'Для ранга требуется');
  if(await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  let revertedRankEnglish=false;
  for(let check=0;check<120;check++){
   const value=values[rankCaptionKey];
   if(value&&JSON.parse(value).en===undefined){revertedRankEnglish=true;break}
   await page.waitForTimeout(50);
  }
  assert.ok(revertedRankEnglish,'Undo must restore the previous bilingual D1 record');
  assert.equal(JSON.parse(values[rankCaptionKey]).ru,'Для ранга требуется');
  assert.deepEqual((await page.locator('#honor-rank-2 .wiki-honor-runtime-value')
   .allTextContents()).map(s=>s.replace(/\D/g,'')),['3000','20000']);
  if(await page.locator('#ownerDock [data-owner-collapse]').getAttribute('aria-expanded')==='true')
   await page.locator('#ownerDock [data-owner-collapse]').click();
  const fingerRank=page.locator('#honor-rank-2 [data-owner-copy-id="rankReqPointsLead"]');
  await fingerRank.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,clientX:16,clientY:16
  });
  await page.waitForTimeout(570);
  const fingerRankEditor=fingerRank.locator('[contenteditable]');
  await fingerRankEditor.waitFor({state:'visible',timeout:6000});
  await fingerRankEditor.press('Escape');
  await fingerRank.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true});
  assert.deepEqual((await page.locator('#honor-rank-2 .wiki-honor-runtime-value')
   .allTextContents()).map(s=>s.replace(/\D/g,'')),['3000','20000']);
  // Authorial prefix and source gold range must never share editable DOM.
  await chooseWikiChapter('chest');
  await page.locator('[data-wiki-record="52002"]').click();
  const goldReward=page.locator('.wiki-chest-gold-reward').first();
  await goldReward.waitFor({state:'visible',timeout:15000});
  const goldValue=goldReward.locator('.wiki-chest-gold-amount');
  const goldNumberBefore=await goldValue.textContent();
  const goldCaption=goldReward.locator('[data-owner-copy-id="goldAmountPrefix"]');
  assert.equal((await goldCaption.textContent()).trim(),'Золото:');
  assert.equal(await goldValue.getAttribute('data-owner-copy-id'),null);
  await goldCaption.dblclick();
  const goldEditor=goldCaption.locator('[contenteditable]');
  await goldEditor.waitFor({state:'visible',timeout:8000});
  await goldEditor.fill('Монеты:');
  await goldEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-chest-gold-prefix[data-owner-copy-id="goldAmountPrefix"]')
   ?.textContent==='Монеты:',null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.wiki.chest.text.gold-amount-prefix']).ru,
   'Монеты:');
  assert.equal(await goldValue.textContent(),goldNumberBefore,
   'Owner label cannot change the source gold interval');
  assert.equal(await goldValue.locator('[contenteditable]').count(),0);
  // Leave the existing Encyclopedia detail workbench before opening the
  // account UI: a modal workbench correctly intercepts background clicks.
  if(await page.locator('#detailPanel.is-open').count())
   await page.locator('#dockClose').click();
  // Dynamic account panel is rebuilt independently of the main planner.
  // Author edits remain inside the existing panel without touching forms.
  await page.locator('#profileTrigger').click();
  const guestLead=page.locator('#accountPanel [data-owner-copy-key="accountGuestLead"]');
  await guestLead.waitFor({state:'visible'});
  assert.equal(await guestLead.getAttribute('aria-keyshortcuts'),'F2');
  assert.equal(await guestLead.getAttribute('tabindex'),'0');
  assert.equal(await page.locator('#accountPanel .account-copy-pencil').count(),0);
  const login=page.locator('#accountPanel .account-form input').first();
  await login.fill('TestingProfile');
  await guestLead.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:52,clientX:18,clientY:18
  });
  // A scroll event from unrelated layout or input focus does not mean the
  // finger moved to scroll. This was the reported Chromium failure at 9673901.
  await guestLead.evaluate(el=>el.ownerDocument.dispatchEvent(new Event('scroll')));
  await page.waitForTimeout(570);
  // Account inline editors use a sibling editing host rather than rewriting
  // the source node, so detect that host via the actual panel.
  const guestTouchHost=page.locator(
   '#accountPanel .account-copy-edit-host [contenteditable]');
  await guestTouchHost.waitFor({state:'visible',timeout:6000});
  await guestTouchHost.press('Escape');
  await guestLead.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true});
  assert.equal(await login.inputValue(),'TestingProfile');
  // This is a real action button, not a spare pencil or a decoration.
  // A hold edits its D1 caption but must not submit the login form.
  const signInCaption=page.locator(
   '#accountPanel button[data-owner-copy-key="accountSignIn"]').first();
  await signInCaption.waitFor({state:'visible'});
  await signInCaption.evaluate(el=>{
   el.dataset.qaTouchClicks='0';
   el.addEventListener('click',()=>{
    el.dataset.qaTouchClicks=String(Number(el.dataset.qaTouchClicks)+1);
   });
  });
  await signInCaption.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:73,clientX:20,clientY:20
  });
  await page.waitForTimeout(570);
  const buttonTouch=page.locator('#accountPanel .account-copy-edit-host [contenteditable]');
  await buttonTouch.waitFor({state:'visible',timeout:6000});
  await signInCaption.dispatchEvent('click',{bubbles:true,cancelable:true,detail:1});
  assert.equal(await signInCaption.getAttribute('data-qa-touch-clicks'),'0');
  await buttonTouch.press('Escape');
  await signInCaption.dispatchEvent('pointerup',{pointerType:'touch',isPrimary:true,pointerId:73});
  assert.equal(await login.inputValue(),'TestingProfile');
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
  // The owner action arbiter defers one physical click to separate it from
  // a double-click on the action caption. Observe the completed CAS undo.
  let enReverted=false;
  for(let attempt=0;attempt<120;attempt++){
   const value=values['guideedit.book.ui.label.account-guest-lead'];
   if(value&&JSON.parse(value).en===undefined){enReverted=true;break}
   await page.waitForTimeout(50);
  }
  assert.ok(enReverted,'The undo action must revert the saved English label');
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
  // A deliberately expanded owner drawer can obscure the library button.
  // Collapse via the real UI rather than bypassing pointer hit-testing.
  const libraryDock=page.locator('#ownerDock');
  if(await libraryDock.locator('[data-owner-collapse]')
   .getAttribute('aria-expanded')==='true')
   await libraryDock.locator('[data-owner-collapse]').click();
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

  // #390: the real A/B prefix is inline authorial text, not the immutable
  // A/B selector identities or another player's saved-build name.
  if(await compareOwnerDock.locator('[data-owner-collapse]')
   .getAttribute('aria-expanded')==='true')
   await compareOwnerDock.locator('[data-owner-collapse]').click();
  const prefixes=compare.locator(
   '.build-compare-select-label [data-owner-copy-key="compareBuildCaption"]');
  assert.deepEqual(await prefixes.allTextContents(),['Build','Build']);
  assert.deepEqual(await compare.locator('[data-compare-letter]').allTextContents(),
   [' A',' B']);
  const selectionBefore=await compare.locator('[data-compare-select]').evaluateAll(
   fields=>fields.map(field=>field.value));
  await prefixes.first().dblclick();
  const editPrefix=compare.locator(
   '.build-compare-select-label .account-copy-edit-host [contenteditable]');
  await editPrefix.waitFor({state:'visible'});
  await editPrefix.fill('Saved character');
  await editPrefix.press('Tab');
  await page.waitForFunction(()=>[...document.querySelectorAll(
   '#detailContent [data-build-compare] [data-owner-copy-key="compareBuildCaption"]')]
   .every(node=>node.textContent==='Saved character'),null,{timeout:12000});
  const prefixKey='guideedit.book.ui.label.compare-build-caption';
  assert.equal(JSON.parse(values[prefixKey]).en,'Saved character');
  assert.deepEqual(await compare.locator('[data-compare-select]').evaluateAll(
   fields=>fields.map(field=>field.getAttribute('aria-label'))),
   ['Saved character A','Saved character B']);
  assert.deepEqual(await compare.locator('[data-compare-select]').evaluateAll(
   fields=>fields.map(field=>field.value)),selectionBefore);
  assert.equal(await activeName.inputValue(),comparisonName);
  assert.equal(await comparePanel.evaluate(node=>node.isConnected),true);
  assert.equal(await compare.locator('.ui-content-pencil').count(),0);
  if(await compareOwnerDock.locator('[data-owner-collapse]')
   .getAttribute('aria-expanded')==='false')
   await compareOwnerDock.locator('[data-owner-collapse]').click();
  await compareOwnerDock.locator('[data-owner-undo]').click();
  await page.waitForFunction(()=>[...document.querySelectorAll(
   '#detailContent [data-build-compare] [data-owner-copy-key="compareBuildCaption"]')]
   .every(node=>node.textContent==='Build'),null,{timeout:12000});
  assert.equal(Object.hasOwn(values,prefixKey),false);
  assert.equal(resets.at(-1)?.key,prefixKey);
  assert.deepEqual(await compare.locator('[data-compare-select]').evaluateAll(
   fields=>fields.map(field=>field.getAttribute('aria-label'))),
   ['Build A','Build B']);
  assert.deepEqual(await compare.locator('[data-compare-select]').evaluateAll(
   fields=>fields.map(field=>field.value)),selectionBefore);
  assert.equal(await activeName.inputValue(),comparisonName);
  assert.equal(await comparePanel.evaluate(node=>node.isConnected),true);
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
  if(await page.locator('#detailPanel.is-open').count()){
   await page.locator('#dockClose').click();
   // A deferred owner-mode action must finish before interacting elsewhere.
   await page.locator('#detailPanel.is-open').waitFor({state:'hidden',timeout:15000});
  }
  await page.locator('#nav [data-tab="wiki"]').waitFor({state:'visible'});
  // The previous CAS-conflict test deliberately leaves the owner drawer open
  // with an error. Collapse only its visual panel before normal navigation;
  // neither suppress nor clear that failure or its D1 state.
  const ownerDrawer=page.locator('#ownerDock');
  if(await ownerDrawer.isVisible()&&
     await ownerDrawer.locator('[data-owner-collapse]').getAttribute('aria-expanded')==='true')
   await ownerDrawer.locator('[data-owner-collapse]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await chooseWikiChapter('item');
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
  await chooseWikiChapter('item');
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
  await chooseWikiChapter('utility');
  assert.equal(await page.locator('.wiki-effect-type option[value="buff"]').textContent(),
   'Дают положительные эффекты');
  assert.ok(await page.locator('.wiki-filter-labels-editor [data-owner-copy-id="filterUtilityEffectBuff"]').count());
  await chooseWikiChapter('item');
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
  await chooseWikiChapter('map');
  assert.ok(await page.locator('#detailContent .wiki-location-list-heading').count()>0);
  assert.ok(await summaryEditor.locator('[data-owner-copy-id="placeCity"]').count());

  // #390: Undo of a source-authored Wiki map caption must patch the existing
  // card, rather than recreate the Wiki browse list or discard its search.
  const firstMap=page.locator('#detailContent .wiki-list [data-wiki-record]').first();
  await firstMap.click();
  const mapPage=page.locator('#detailContent article.wiki-page');
  const mapEditor=mapPage.locator('.studio-owner-interface-editor')
   .filter({hasText:'Подписи локаций и подземелий'});
  await mapEditor.locator('summary').waitFor({state:'visible'});
  await mapEditor.locator('summary').click();
  const mapCaption=mapEditor.locator('[data-owner-copy-id="tags"]');
  await mapCaption.waitFor({state:'visible'});
  const mountedMapCaption=await mapCaption.elementHandle();
  const mountedMapPage=await mapPage.elementHandle();
  const mapBrowse=page.locator('#detailContent .wiki-list');
  const mountedBrowse=await mapBrowse.elementHandle();
  const selectedMap=await firstMap.getAttribute('data-wiki-record');
  const browseScroll=await mapBrowse.evaluate(el=>el.scrollTop);
  await mapCaption.dblclick();
  const mapDraft=mapCaption.locator('[data-owner-text-field]');
  await mapDraft.waitFor({state:'visible'});
  await mapDraft.fill('Теги карты QA');
  await mapDraft.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .wiki-page [data-owner-copy-id="tags"]')?.textContent==='Теги карты QA',
   null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.wiki.map.text.tags']).ru,'Теги карты QA');
  if(await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent .wiki-page [data-owner-copy-id="tags"]')?.textContent==='Теги локации',
   null,{timeout:15000});
  assert.equal(Object.hasOwn(values,'guideedit.book.wiki.map.text.tags'),false);
  assert.equal(resets.at(-1)?.key,'guideedit.book.wiki.map.text.tags');
  assert.equal(await mountedMapCaption.evaluate(el=>el.isConnected),true,
   'Wiki authorial Undo must not remount the caption');
  assert.equal(await mountedMapPage.evaluate(el=>el.isConnected),true,
   'Wiki authorial Undo must preserve the currently open map');
  assert.equal(await mountedBrowse.evaluate(el=>el.isConnected),true,
   'Wiki authorial Undo must preserve the browsing/search list');
  assert.equal(await page.locator('#detailContent .wiki-list [data-wiki-record].selected')
   .first().getAttribute('data-wiki-record'),selectedMap);
  assert.equal(await mapBrowse.evaluate(el=>el.scrollTop),browseScroll);
  await mountedMapCaption.dispose();await mountedMapPage.dispose();
  await mountedBrowse.dispose();
  // The visible, plain Wiki heading is ALSO an immediate owner edit target.
  // Static text only: no Soul counts, item IDs or clickable links are edited.
  let directMapHeading=mapPage.locator('h4[data-wiki-direct-caption="1"]').first();
  if(!await directMapHeading.count()){
   const mapCards=page.locator('#detailContent .wiki-list [data-wiki-record]');
   const limit=Math.min(await mapCards.count(),25);
   for(let i=1;i<limit;i++){
    await mapCards.nth(i).click();
    directMapHeading=mapPage.locator('h4[data-wiki-direct-caption="1"]').first();
    if(await directMapHeading.count())break;
   }
  }
  assert.ok(await directMapHeading.count(),
   'At least one mounted Wiki map heading must support direct owner dblclick');
  const directId=await directMapHeading.getAttribute('data-owner-copy-id');
  const directKey='guideedit.book.wiki.map.text.'+
   directId.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  const originalHeading=await directMapHeading.textContent();
  const directNode=await directMapHeading.elementHandle();
  await directMapHeading.dblclick();
  const directField=directMapHeading.locator('[data-owner-text-field]');
  await directField.waitFor({state:'visible'});
  await directField.fill('Прямой заголовок Wiki QA');
  await directField.press('Tab');
  await page.waitForFunction(key=>document.querySelector(
   '#detailContent .wiki-page [data-owner-copy-id="'+key+'"][data-wiki-direct-caption="1"]')
   ?.textContent==='Прямой заголовок Wiki QA',directId,{timeout:15000});
  assert.equal(JSON.parse(values[directKey]).ru,'Прямой заголовок Wiki QA');
  assert.equal(await directNode.evaluate(el=>el.isConnected),true);
  assert.equal(await page.locator('#detailContent h4[data-wiki-direct-caption="1"] + .ui-content-pencil').count(),0);
  if(await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(({key,expected})=>document.querySelector(
   '#detailContent .wiki-page [data-owner-copy-id="'+key+'"][data-wiki-direct-caption="1"]')
   ?.textContent===expected,{key:directId,expected:originalHeading},{timeout:15000});
  assert.equal(Object.hasOwn(values,directKey),false);
  assert.equal(await directNode.evaluate(el=>el.isConnected),true);
  await directNode.dispose();
  if(!await page.locator('#ownerDock').evaluate(el=>el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  assert.deepEqual(errors,[]);
  console.log('Chromium Wiki results: RU D1 CAS, 409 draft, Undo, live counters, more and groups passed');
  assert.deepEqual(errors,[]);
  console.log('Chromium Wiki filter D1 editorial: RU/EN CAS, ID invariants, utility and elemental choices passed');
 }finally{await context.close()}
}
