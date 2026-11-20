import assert from 'node:assert/strict';

// Real owner copy controls with a mocked D1 Worker, not production data.
// Check that edits change the active tooltip without mutating a saved build.
export async function runOwnerBuildHints660Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const playerToken='t'.repeat(43),ownerToken='a'.repeat(43),name='QA preserved hero';
 const record={id:'b'.repeat(32),name,at:100,createdAt:100,
  data:{race:1,job:16,level:10,name,stats:{},points:{},mastery:{},
   equipment:{},souls:{},refinements:{},gems:{}}};
 const alternate={...record,id:'c'.repeat(32),name:'QA another build',
  createdAt:101,at:101,data:{...record.data,name:'QA another build'}};
 const initial=JSON.stringify([record,alternate]),values={},writes=[],errors=[];
 const context=await browser.newContext({viewport:{width:1150,height:820}});
 await context.addInitScript(({playerToken,initial,activeId})=>{
  sessionStorage.setItem('ps-active-build-id.v1',activeId);
  localStorage.setItem('ps-active-build-id.v1',activeId);
  localStorage.setItem('ps-build-library-secret.v1','f'.repeat(64));
  localStorage.setItem('ps-account-session.v1',JSON.stringify({
   token:playerToken,username:'hintqa',expires:Number.MAX_SAFE_INTEGER}));
  localStorage.setItem('ps-build-owner-scope.v1','account:hintqa');
  localStorage.setItem('ps-build-library.v1',initial);
 },{playerToken,initial,activeId:record.id});
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const respond=(body,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(body)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/overrides')return respond({values:{...values}});
  if(path==='/api/account/me')return respond({account:{username:'hintqa'}});
  if(path==='/api/library'&&method==='GET')
   return respond({records:[{id:record.id,entry:record},{id:alternate.id,entry:alternate}]});
  if(path==='/api/admin/login'&&method==='POST')
   return respond({token:ownerToken,expires:Date.now()+600000});
  if(path==='/api/admin/catalog/test-write')return respond({
   ok:true,readback:true,cleaned:true,overrideReadback:true,
   overrideCleaned:true,activeCatalogUnchanged:true});
  if(path==='/api/admin/override'&&method==='POST'){
   assert.equal(req.headers().authorization,'Bearer '+ownerToken);
   const body=req.postDataJSON();
   assert.match(body.key,/^guideedit\.book\.ui\.label\.library-(?:hint-|card-|sort-|compare|current-badge|overwrite-|confirm-overwrite|delete-ask)/);
   assert.equal(body.expectedValue,Object.hasOwn(values,body.key)?values[body.key]:null,
    'CAS keeps the previous version');
   values[body.key]=body.value;writes.push(body);
   return respond({ok:true,key:body.key,value:body.value,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('.build-card').first().waitFor({state:'visible'});
  assert.equal(await page.locator('.build-hint-owner-panel').count(),0,
   'Ordinary users never see hint-edit controls');
  assert.equal(await page.locator('.build-card h3').first().innerText(),name);
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'})
   .waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:15000});
  await page.locator('.build-card').first().waitFor({state:'visible'});
  const panel=page.locator('.build-hint-owner-panel');
  await panel.waitFor({state:'visible'});
  await panel.locator('summary').click();
  assert.equal(await panel.locator('.build-hint-owner-row').count(),21);
  for(const key of ['libraryCardOpen','libraryCardOverwrite','libraryCardShare',
   'libraryCardDelete','libraryHintOpen','libraryHintOverwrite','libraryHintShare',
   'libraryHintDelete','libraryHintDeleteLocal','librarySearchInputLabel',
   'librarySearchPlaceholder','librarySearchEmpty','libraryEmpty']){
   assert.equal(await panel.locator('[data-owner-copy-pencil="'+key+'"]').count(),0,
    'Owner captions have no pencil; edit by double click: '+key);
  }
  const edit=async(key,text)=>{
   await panel.locator('[data-owner-copy-key="'+key+'"]').dblclick();
   const field=panel.locator('.account-copy-edit-host [contenteditable]');
   await field.fill(text);
   await field.press('Tab');
   await page.waitForFunction(({key,text})=>
    document.querySelector('.build-hint-owner-panel [data-owner-copy-key="'+key+'"]')
     ?.textContent===text,{key,text},{timeout:15000});
  };
  for(const key of ['librarySortSaved','libraryCompare',
   'librarySortAria','libraryBuildNameAria','libraryDraftNameAria']){
   assert.equal(await panel.locator('[data-owner-copy-pencil="'+key+'"]').count(),0,
    'Owner can double-click additional RU/EN library captions: '+key);
  }
  const editCurrent=async text=>{
   const current=page.locator('.build-card.is-current');
   await current.locator('[data-owner-copy-key="libraryCurrentBadge"]').dblclick();
   const field=current.locator('.account-copy-edit-host [contenteditable]');
   await field.fill(text);
   await field.press('Tab');
   await page.waitForFunction(value=>
    document.querySelector('#detailContent .build-card.is-current [data-owner-copy-key="libraryCurrentBadge"]')
     ?.textContent===value,text,{timeout:15000});
  };
  const russian='Открывает выбранного героя.';
  await edit('libraryHintOpen',russian);
  const key='guideedit.book.ui.label.library-hint-open';
  assert.equal(JSON.parse(values[key]).ru,russian);
  assert.equal(writes.length,1);
  const card=page.locator('.build-card').first();
  const button=card.locator('[data-build-action-hint="libraryHintOpen"]');
  assert.equal(await button.getAttribute('data-guide-hint'),russian,
   'Updated copy reaches the still-mounted action without a library remount');
  await button.hover();
  const popup=page.locator('#stage-guide-tooltip');
  await popup.waitFor({state:'visible',timeout:5000});
  assert.equal(await popup.innerText(),russian);
  await page.mouse.move(1,1);
  await popup.waitFor({state:'hidden'});
  await panel.locator('[data-owner-copy-key="libraryHintOpen"]').dblclick();
  const cancel=panel.locator('.account-copy-edit-host [contenteditable]');
  await cancel.fill('Не сохранять');
  await cancel.press('Escape');
  assert.equal(JSON.parse(values[key]).ru,russian);
  assert.equal(writes.length,1,'Escape never writes to D1');
  // Owner edits a card label while the hero is mounted. The icon remains
  // separate and the accessible button name updates without card remount.
  await edit('libraryCardOpen','Открыть персонажа');
  const labelKey='guideedit.book.ui.label.library-card-open';
  assert.equal(JSON.parse(values[labelKey]).ru,'Открыть персонажа');
  assert.equal(await card.locator('.build-card-action-label').first().innerText(),
   'Открыть персонажа');
  assert.equal(await card.locator('.build-card-action-icon').first().innerText(),'📂');
  assert.equal(await card.locator('[data-build-action-hint="libraryHintOpen"]')
   .getAttribute('data-guide-hint'),russian);

  const current=page.locator('.build-card.is-current');
  assert.equal(await current.locator('.build-card-current-label').innerText(),'● Текущий билд');
  await editCurrent('● Редактируется');
  assert.equal(await current.locator('.build-card-current-label').innerText(),'● Редактируется');
  assert.equal(JSON.parse(values['guideedit.book.ui.label.library-current-badge']).ru,'● Редактируется');
  const sort=page.locator('.build-library-sort-select');
  await sort.selectOption('name');
  await edit('librarySortSaved','Порядок создания');
  assert.equal(await sort.inputValue(),'name','D1 editing never resets current sort');
  assert.equal(await sort.locator('option[value="saved"]').innerText(),'Порядок создания');
  await edit('libraryCompare','Сопоставить');
  assert.equal(await card.locator('[data-library-compare-copy]').innerText(),'Сопоставить');
  assert.equal(await card.locator('.build-card-compare input').getAttribute('aria-label'),
   'Сопоставить '+await card.locator('h3').innerText(),
   'Accessible compare label follows the current sorted card, not its old position');
  await sort.selectOption('saved');
  // The three confirmation forms are now lazy: two cards start with only
  // empty shells. Check real D1 edits without executing overwrite/delete.
  await page.waitForFunction(()=>
   document.querySelector('.build-overwrite-choice')?.querySelectorAll('button').length===0,
   null,{timeout:2500});
  assert.equal(await page.locator('.build-overwrite-choice button').count(),0);
  assert.equal(await page.locator('.build-delete-choice button').count(),0);
  const originalName=await card.locator('h3').textContent();
  const originalCard=await card.elementHandle();
  await card.locator('[data-build-action-hint="libraryHintOverwrite"]').click();
  const overwrite=card.locator('.build-overwrite-choice');
  await overwrite.waitFor({state:'visible'});
  assert.equal(await overwrite.locator('.build-confirm-dynamic-name').innerText(),originalName);
  assert.equal(await overwrite.locator('[data-owner-copy-pencil="libraryOverwriteBefore"]').count(),0);
  await overwrite.locator('[data-owner-copy-key="libraryOverwriteBefore"]').dblclick();
  const beforeInput=overwrite.locator('.account-copy-edit-host [contenteditable]');
  await beforeInput.fill('Вместо этого билда «');
  await beforeInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.build-card .build-overwrite-choice [data-owner-copy-key="libraryOverwriteBefore"]')
   ?.textContent==='Вместо этого билда «',null,{timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.library-overwrite-before']).ru,
   'Вместо этого билда «');
  assert.equal(await overwrite.locator('.build-confirm-dynamic-name').innerText(),originalName);
  assert.equal(await originalCard.evaluate(node=>node.isConnected),true,
   'D1 edit must not remount the active saved-build card');
  await card.locator('[data-build-action-hint="libraryHintDelete"]').click();
  assert.equal(await overwrite.locator('button').count(),0,
   'Switching actions must release the previous hidden confirmation nodes');
  const deletion=card.locator('.build-delete-choice');
  await deletion.waitFor({state:'visible'});
  await deletion.locator('[data-owner-copy-key="libraryDeleteAsk"]').dblclick();
  await deletion.locator('.account-copy-edit-host [contenteditable]')
   .fill('Удалить сохранение и ссылки навсегда?');
  await deletion.locator('.account-copy-edit-host [contenteditable]').press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.build-card .build-delete-choice [data-owner-copy-key="libraryDeleteAsk"]')
   ?.textContent==='Удалить сохранение и ссылки навсегда?',null,{timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.library-delete-ask']).ru,
   'Удалить сохранение и ссылки навсегда?');
  assert.equal(await card.locator('h3').textContent(),originalName);
  assert.equal(await originalCard.evaluate(node=>node.isConnected),true);
  await deletion.locator('[data-owner-copy-key="libraryCancel"]').click();
  // Owner caption actions deliberately distinguish single and double click.
  // Wait for the single-click action to complete, rather than asserting while
  // the 500ms double-click detection window is still open.
  await page.waitForFunction(()=>document.querySelector('.build-delete-choice')?.querySelectorAll('button').length===0,
   null,{timeout:2500});
  assert.equal(await deletion.locator('button').count(),0);
  assert.equal(await page.locator('.build-card').count(),2);
  assert.equal(await page.locator('.build-card h3').first().textContent(),name);
  await originalCard.dispose();
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('.build-card').first().waitFor({state:'visible'});
  await panel.waitFor({state:'visible'});
  if(!(await panel.evaluate(el=>el.open)))await panel.locator('summary').click();
  const english='Opens the saved character.';
  await edit('libraryHintOpen',english);
  assert.deepEqual(JSON.parse(values[key]),{ru:russian,en:english});
  await edit('libraryCardOpen','View character');
  await editCurrent('● Editing now');
  const editedCard=page.locator('.build-card').first();
  await editedCard.locator('[data-build-action-hint="libraryHintOverwrite"]').click();
  const enOverwrite=editedCard.locator('.build-overwrite-choice');
  assert.ok((await enOverwrite.innerText()).includes('QA preserved hero'));
  assert.ok((await enOverwrite.innerText()).includes('Overwrite saved build'));
  await enOverwrite.locator('[data-owner-copy-key="libraryOverwriteAfter"]').dblclick();
  await enOverwrite.locator('.account-copy-edit-host [contenteditable]')
   .fill('” with your current hero? This cannot be undone.');
  await enOverwrite.locator('.account-copy-edit-host [contenteditable]').press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.build-card .build-overwrite-choice [data-owner-copy-key="libraryOverwriteAfter"]')
    ?.textContent==='” with your current hero? This cannot be undone.',
   null,{timeout:12000});
  assert.equal(JSON.parse(values['guideedit.book.ui.label.library-overwrite-after']).en,
   '” with your current hero? This cannot be undone.');
  assert.equal(await editedCard.locator('.build-confirm-dynamic-name').textContent(),name);
  await enOverwrite.locator('[data-owner-copy-key="libraryCancel"]').click();
  assert.equal(await page.locator('.build-overwrite-choice button').count(),0);
  assert.equal(await page.locator('.build-card.is-current .build-card-current-label').innerText(),
   '● Editing now');
  assert.deepEqual(JSON.parse(values[labelKey]),{
   ru:'Открыть персонажа',en:'View character'});
  assert.equal(await page.locator('.build-card').first()
   .locator('.build-card-action-label').first().innerText(),'View character');
  assert.equal(await page.locator('.build-card').first().locator(
   '[data-build-action-hint="libraryHintOpen"]').getAttribute('data-guide-hint'),english);
  await page.setViewportSize({width:390,height:800});
  const geo=await panel.evaluate(el=>({
   overflow:el.scrollWidth-el.clientWidth,
   rows:el.querySelectorAll('.build-hint-owner-row').length
  }));
  assert.equal(geo.rows,21);
  assert.ok(geo.overflow<=4,'Mobile hint editor must not overflow horizontally');
  assert.equal(await page.locator('.build-card h3').first().innerText(),name);
  assert.deepEqual(errors,[]);
  console.log('Chromium owner build hints and library sort: RU/EN D1 CAS, live badge, sort, actions and mobile');
 }finally{await context.close()}
}
