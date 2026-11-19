import assert from 'node:assert/strict';

export async function runOwnerEquipmentInlineSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const context=await browser.newContext({viewport:{width:390,height:800}});
 const values={},writes=[],errors=[],nextConflicts=new Set();
 await context.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:7,level:45,name:'Owner equipment QA',
   equipment:{5:{id:13041,name:'Железные поножи'}},
   socketCapacities:{'5:13041':2},souls:{},refinements:{},gems:{}
  }));
 });
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Authorization,Content-Type',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  const reply=(payload,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(payload)});
  const path=new URL(url).pathname;
  if(path==='/api/overrides')return reply({values});
  if(path==='/api/admin/login')return reply({
   token:'a'.repeat(43),expires:Date.now()+600000
  });
  if(path==='/api/admin/catalog/test-write')return reply({
   ok:true,readback:true,cleaned:true,overrideReadback:true,
   overrideCleaned:true,activeCatalogUnchanged:true
  });
  if(path==='/api/admin/override'){
   const data=req.postDataJSON();
   assert.equal(req.headers().authorization,'Bearer '+'a'.repeat(43));
   assert.equal(data.expectedValue,Object.hasOwn(values,data.key)?values[data.key]:null);
   if(nextConflicts.delete(data.key))
    return reply({code:'OWNER_EDIT_CONFLICT',error:'Concurrent copy edit'},409);
   values[data.key]=data.value;writes.push(data);
   return reply({ok:true,key:data.key,value:data.value,conditional:true});
  }
  if(path==='/api/admin/reset'){
   const data=req.postDataJSON();
   assert.equal(data.expectedValue,values[data.key],'History reset must use current CAS value');
   if(!Object.hasOwn(values,data.key))return reply({code:'OWNER_EDIT_CONFLICT'},409);
   delete values[data.key];writes.push({key:data.key,reset:true});
   return reply({ok:true,key:data.key,deleted:true,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const selector='#stagePicker .stage-rich-fields dt[data-owner-copy-id="field.slots"]';
 const recordKey='guideedit.book.equipment.field.slots';
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // Wait until the mandatory D1 modal actually releases native inert.
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.waitForFunction(()=>
   document.querySelector('.equipment-slot[data-slot-index="5"].equipped')&&
   document.querySelector('#catalogStatus')?.textContent?.includes('предметов'),
   null,{timeout:25000});
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:15000});
  await page.locator('.equipment-slot[data-slot-index="5"]').click();
  await page.locator('#stagePicker [data-stage-tab="details"]').click();
  const label=page.locator(selector);
  await label.waitFor({state:'visible'});
  console.log('Owner equipment 632: initial label rendered');
  assert.equal((await label.textContent({timeout:4000})).trim(),'Слоты душ');
  console.log('Owner equipment 632: initial label confirmed');
  const value=()=>page.locator('#stagePicker .stage-rich-fields dd[data-edit-key="itemslots.13041"]');
  assert.equal((await value().innerText()).trim(),'0/2');
  await label.dblclick();
  const input=label.locator('[data-owner-text-field]');
  await input.waitFor({state:'visible'});
  await input.fill('Очень длинное название свойства для проверки редактора '.repeat(7));
  const size=await input.evaluate(el=>{
   const dt=el.parentElement,rect=el.getBoundingClientRect();
   const row=dt.getBoundingClientRect(),range=document.createRange();
   range.selectNodeContents(el);
   const content=range.getBoundingClientRect(),css=getComputedStyle(el);
   return {width:rect.width,rowWidth:row.width,
    column:getComputedStyle(dt).gridColumn,
    whiteSpace:css.whiteSpace,scrollHeight:el.scrollHeight,
    clientHeight:el.clientHeight,contentBottom:content.bottom,
    editorBottom:rect.bottom};
  });
  assert.equal(size.column,'1 / -1','D1 editor did not expand to a whole grid row');
  assert.ok(size.width>=size.rowWidth-4,'Text field is still restricted to half a row: '+JSON.stringify(size));
  assert.equal(size.whiteSpace,'pre-wrap');
  assert.ok(size.scrollHeight<=size.clientHeight+2,
   'Long RU text is clipped vertically: '+JSON.stringify(size));
  assert.ok(size.contentBottom<=size.editorBottom+3,
   'Last typed line falls outside editor: '+JSON.stringify(size));
  assert.equal((await value().innerText()).trim(),'0/2',
   'Editing the label must not alter the Soul count');
  await input.press('Escape');
  console.log('Owner equipment 632: Escape pressed');
  assert.equal((await label.textContent({timeout:4000})).trim(),'Слоты душ');
  console.log('Owner equipment 632: Escape restored original label');
  assert.equal(writes.length,0,'Escape must not write a D1 override');
  // Real in-place owner editor -> mocked CAS Worker -> existing D1 key.
  await label.dblclick();
  const ruInput=label.locator('[data-owner-text-field]');
  await ruInput.fill('Гнёзда для душ');
  await ruInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker .stage-rich-fields dt[data-owner-copy-id="field.slots"]')
   ?.textContent==='Гнёзда для душ',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[recordKey]),{ru:'Гнёзда для душ'});
  assert.equal((await value().innerText()).trim(),'0/2');
  console.log('Owner equipment 632: RU committed to mock CAS');
  // Locale switching may switch the inspector to Choose; reopen Properties.
  await page.locator('#stagePicker .stage-picker-head > button').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.locator('.equipment-slot[data-slot-index="5"]').click();
  await page.locator('#stagePicker [data-stage-tab="details"]').click();
  const enLabel=page.locator(selector);
  await enLabel.waitFor({state:'visible'});
  console.log('Owner equipment 632: EN label rendered');
  assert.equal((await enLabel.textContent({timeout:4000})).trim(),'Soul slots');
  console.log('Owner equipment 632: EN label confirmed');
  await enLabel.dblclick();
  const enInput=enLabel.locator('[data-owner-text-field]');
  await enInput.fill('Soul sockets');
  await enInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker .stage-rich-fields dt[data-owner-copy-id="field.slots"]')
   ?.textContent==='Soul sockets',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[recordKey]),{
   ru:'Гнёзда для душ',en:'Soul sockets'
  });
  console.log('Owner equipment 632: EN committed to mock CAS');
  assert.equal(writes.filter(row=>row.key===recordKey).length,2);
  assert.equal((await value().innerText()).trim(),'0/2');
  // Undo the EN save: revert only the last locale, not the RU edit or Soul data.
  if(await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  console.log('Owner equipment 632: Undo clicked');
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker .stage-rich-fields dt[data-owner-copy-id="field.slots"]')
   ?.textContent==='Soul slots',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[recordKey]),{ru:'Гнёзда для душ'});
  assert.equal((await value().innerText()).trim(),'0/2');
  // Manual history reset preserves the DOM node and the selected item.
  await page.evaluate(()=>{window.__ownerQAFieldNode=document.querySelector(
   '#stagePicker .stage-rich-fields dt[data-owner-copy-id="field.slots"]');});
  await page.locator('#ownerDock .owner-dock-history').click();
  const history=page.locator('#modalRoot .owner-manager');
  await history.locator('.owner-review-reset').waitFor({state:'visible'});
  page.once('dialog',dialog=>dialog.accept());
  await history.locator('.owner-review-reset').first().click();
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker .stage-rich-fields dt[data-owner-copy-id="field.slots"]')
   ?.textContent==='Soul slots',null,{timeout:12000});
  assert.equal(Object.hasOwn(values,recordKey),false);
  assert.equal(await page.evaluate(()=>window.__ownerQAFieldNode===document.querySelector(
   '#stagePicker .stage-rich-fields dt[data-owner-copy-id="field.slots"]')),true,
   'History reset must not remount equipment');
  assert.equal((await value().innerText()).trim(),'0/2');
  await page.locator('#modalRoot .modal button.close').click();
  // The owner edits the existing EN tab hint using the D1 CAS/Undo pipeline.
  // The active equipment slot and DOM node must stay intact.
  const hintKey='guideedit.book.equipment.hint.details';
  if(!await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  const hintPanel=page.locator('#stagePicker .studio-owner-interface-editor');
  await hintPanel.locator('summary').click();
  const hintValue=hintPanel.locator('.studio-owner-interface-row')
   .filter({hasText:'Properties help'}).locator('.studio-owner-interface-value');
  await hintValue.dblclick();
  await hintValue.locator('[data-owner-text-field]').fill('Edited equipment details hint');
  await hintValue.locator('[data-owner-text-field]').press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker [data-stage-tab="details"]')?.dataset.guideHint===
   'Edited equipment details hint',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[hintKey]),{en:'Edited equipment details hint'});
  const detailsTab=page.locator('#stagePicker [data-stage-tab="details"]');
  assert.equal(await detailsTab.getAttribute('aria-description'),'Edited equipment details hint');
  assert.equal(await detailsTab.getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{window.__equipmentHintTab=
   document.querySelector('#stagePicker [data-stage-tab="details"]')});
  if(await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker [data-stage-tab="details"]')?.dataset.guideHint===
   'View properties, refinement and Soul sockets.',null,{timeout:12000});
  assert.equal(Object.hasOwn(values,hintKey),false);
  assert.equal(await page.evaluate(()=>window.__equipmentHintTab===
   document.querySelector('#stagePicker [data-stage-tab="details"]')),true);
  assert.equal(await detailsTab.getAttribute('aria-description'),
   'View properties, refinement and Soul sockets.');
  // A separate bilingual title-prefix edit never serializes the selected
  // item name and never remounts the picker. Test real CAS, Undo and language.
  const headingKey='guideedit.book.equipment.picker-slot-heading';
  const readHeading=()=>{try{return JSON.parse(values[headingKey]||'null')}catch{return null}};
  const expectSavedHeading=async (locale,expected)=>{
   for(let n=0;n<150;n++){
    if(readHeading()?.[locale]===expected)return;
    await new Promise(resolve=>setTimeout(resolve,25));
   }
   throw Error('Mock D1 never saved equipment slot prefix '+locale+': '+
    String(values[headingKey]));
  };
  const slotPrefix=page.locator('#stagePicker .stage-picker-slot-prefix');
  const slotTitle=page.locator('#stagePicker .stage-picker-slot-title');
  await slotPrefix.waitFor({state:'visible'});
  assert.equal((await slotPrefix.innerText()).trim(),'Slot');
  const englishSlotSuffix=await slotTitle.locator('span').last().textContent();
  await page.locator('#stagePicker .stage-picker-slot-pencil').click();
  await slotPrefix.locator('[data-owner-text-field]').fill('Socket position');
  await slotPrefix.locator('[data-owner-text-field]').press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('#stagePicker .stage-picker-slot-prefix')?.textContent===
   'Socket position',null,{timeout:12000});
  await expectSavedHeading('en','Socket position');
  assert.equal(await slotTitle.locator('span').last().textContent(),englishSlotSuffix,
   'Changing title must not rename selected game slot');
  assert.equal((await value().innerText()).trim(),'0/2');
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>
   document.querySelector('#stagePicker .stage-picker-slot-prefix')?.textContent==='Slot',
   null,{timeout:12000});
  assert.equal(Object.hasOwn(values,headingKey),false);
  assert.match(await page.locator('#stagePicker .stage-picker-slot-pencil')
   .getAttribute('aria-label'),/Slot/);
  // On narrow viewports the deliberately persistent owner dock can cover
  // the picker close control. Collapse it through the actual admin UI;
  // never use a forced pointer click through an overlapping panel.
  if(!await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#stagePicker .stage-picker-head > button').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  await page.locator('.equipment-slot[data-slot-index="5"]').click();
  await page.locator('#stagePicker [data-stage-tab="details"]').click();
  const ruPrefix=page.locator('#stagePicker .stage-picker-slot-prefix');
  await ruPrefix.waitFor({state:'visible'});
  assert.equal((await ruPrefix.innerText()).trim(),'Слот');
  const russianSlotSuffix=await page.locator('#stagePicker .stage-picker-slot-title span').last().textContent();
  await ruPrefix.dblclick();
  await ruPrefix.locator('[data-owner-text-field]').fill('Ячейка');
  await ruPrefix.locator('[data-owner-text-field]').press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('#stagePicker .stage-picker-slot-prefix')?.textContent==='Ячейка',
   null,{timeout:12000});
  await expectSavedHeading('ru','Ячейка');
  assert.equal(await page.locator('#stagePicker .stage-picker-slot-title span').last().textContent(),
   russianSlotSuffix);
  assert.equal((await value().innerText()).trim(),'0/2');
  if(await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>
   document.querySelector('#stagePicker .stage-picker-slot-prefix')?.textContent==='Слот',
   null,{timeout:12000});
  assert.equal(Object.hasOwn(values,headingKey),false);
  // Preserve the original D1 text key and its CAS/Undo contract on the longer label.
  const replacementKey='guideedit.book.equipment.tab.choose';
  const replacementCaption=page.locator('#stagePicker [data-stage-tab="choose"] .stage-copy-caption');
  assert.equal((await replacementCaption.innerText()).trim(),'Выбрать другую вещь');
  // Editing a caption nested in a real tab uses the adjacent pencil:
  // direct double-clicking the tab would navigate away before editing starts.
  if(!await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#stagePicker .stage-rich-choose-group .stage-action-edit-wrap > .stage-control-pencil').click();
  await replacementCaption.locator('[data-owner-text-field]').fill('Сменить экипировку');
  await replacementCaption.locator('[data-owner-text-field]').press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('#stagePicker [data-stage-tab="choose"] .stage-copy-caption')
    ?.textContent==='Сменить экипировку',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[replacementKey]),{ru:'Сменить экипировку'});
  if(await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>
   document.querySelector('#stagePicker [data-stage-tab="choose"] .stage-copy-caption')
    ?.textContent==='Выбрать другую вещь',null,{timeout:12000});
  assert.equal(Object.hasOwn(values,replacementKey),false);
  // Additional author copy is edited in the existing inline equipment editor,
  // not a new modal. Game levels and original names remain read-only.
  if(!await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#stagePicker [data-stage-tab="choose"]').click();
  const picker=page.locator('#stagePicker');
  const firstItem=picker.locator('[data-stage-choice]').first();
  await firstItem.waitFor({state:'visible',timeout:12000});
  const gameItemId=await firstItem.getAttribute('data-stage-choice');
  const originalName=await firstItem.locator('.stage-picker-item-label>b').textContent();
  const originalAria=await firstItem.getAttribute('aria-label');
  const beforeHero=await page.evaluate(()=>localStorage.getItem('ps-build-studio.v1'));
  await firstItem.evaluate(el=>el.dataset.ownerEditorStable='yes');
  const meta=firstItem.locator('.stage-picker-item-label small');
  assert.match(await meta.innerText(),/^Уровень /);
  const editPanel=picker.locator('.studio-owner-interface-editor');
  await editPanel.locator('summary').click();
  const row=editPanel.locator('.studio-owner-interface-row')
   .filter({has:page.getByText('Уровень предмета',{exact:true})});
  const caption=row.locator('.studio-owner-interface-value');
  await caption.dblclick();
  const input=caption.locator('[data-owner-text-field]');
  await input.fill('Ур. ');
  await input.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker [data-stage-choice] .stage-picker-item-label small')
   ?.textContent.startsWith('Ур. '),null,{timeout:12000});
  const itemLevelKey='guideedit.book.equipment.picker-item-level';
  assert.equal(JSON.parse(values[itemLevelKey]).ru,'Ур. ');
  assert.equal(await firstItem.getAttribute('data-owner-editor-stable'),'yes');
  assert.equal(await firstItem.getAttribute('data-stage-choice'),gameItemId);
  assert.equal(await firstItem.locator('.stage-picker-item-label>b').textContent(),originalName);
  assert.equal(await firstItem.getAttribute('aria-label'),originalAria);
  assert.equal(await page.evaluate(()=>localStorage.getItem('ps-build-studio.v1')),beforeHero);
  // HTTP 409 preserves the exact unsent text; neither the selected item nor
  // the previously confirmed D1 record may be silently overwritten.
  nextConflicts.add(itemLevelKey);
  await caption.dblclick();
  await input.fill('Неотправленная подпись');
  await input.press('Tab');
  await caption.locator('.ui-content-inline-error').waitFor({state:'visible',timeout:12000});
  assert.equal(await input.textContent(),'Неотправленная подпись');
  assert.equal(JSON.parse(values[itemLevelKey]).ru,'Ур. ');
  await input.press('Escape');
  assert.equal((await meta.innerText()).startsWith('Ур. '),true);
  if(await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker [data-stage-choice] .stage-picker-item-label small')
   ?.textContent.startsWith('Уровень '),null,{timeout:12000});
  assert.equal(Object.hasOwn(values,itemLevelKey),false);
  assert.equal(await firstItem.getAttribute('data-owner-editor-stable'),'yes');
  assert.equal(await firstItem.getAttribute('aria-label'),originalAria);
  assert.equal(await page.evaluate(()=>localStorage.getItem('ps-build-studio.v1')),beforeHero);

  // A second case edits the game-item action accessibility prefix in English.
  // The original source name must stay attached and no result row may remount.
  if(!await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#stagePicker .stage-picker-head>button[aria-label="Закрыть выбор"]').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.locator('.equipment-slot[data-slot-index="5"]').click();
  const chooser=page.locator('#stagePicker');
  await chooser.locator('[data-stage-tab="choose"]').click();
  await chooser.locator('[data-stage-choice]').first().waitFor({state:'visible',timeout:12000});
  const enFirst=chooser.locator('[data-stage-choice]').first();
  assert.match(await enFirst.locator('.stage-picker-item-label small').innerText(),/^Level /);
  await enFirst.evaluate(el=>el.dataset.ownerEditorStable='en');
  const enPanel=chooser.locator('.studio-owner-interface-editor');
  await enPanel.locator('summary').click();
  const enLevel=enPanel.locator('.studio-owner-interface-row')
   .filter({has:page.getByText('Item level',{exact:true})})
   .locator('.studio-owner-interface-value');
  await enLevel.dblclick();
  await enLevel.locator('[data-owner-text-field]').fill('Lvl. ');
  await enLevel.locator('[data-owner-text-field]').press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker [data-stage-choice] .stage-picker-item-label small')
   ?.textContent.startsWith('Lvl. '),null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[itemLevelKey]),{en:'Lvl. '});
  assert.equal(await enFirst.getAttribute('data-owner-editor-stable'),'en');
  assert.equal(await page.evaluate(()=>localStorage.getItem('ps-build-studio.v1')),beforeHero);
  if(await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker [data-stage-choice] .stage-picker-item-label small')
   ?.textContent.startsWith('Level '),null,{timeout:12000});
  assert.equal(Object.hasOwn(values,itemLevelKey),false);
  assert.equal(await enFirst.getAttribute('data-owner-editor-stable'),'en');
  // A text-only history reset does not remount the item picker or change Souls.
  assert.deepEqual(errors,[]);
  console.log('Chromium owner equipment: RU/EN CAS, 409, Undo and same-DOM item metadata passed');
 }finally{await context.close()}
}
