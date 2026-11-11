import assert from 'node:assert/strict';

export async function runOwnerEquipmentInlineSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const context=await browser.newContext({viewport:{width:390,height:800}});
 const values={},writes=[],errors=[];
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
   values[data.key]=data.value;writes.push(data);
   return reply({ok:true,key:data.key,value:data.value,conditional:true});
  }
  if(path==='/api/admin/reset'){
   const data=req.postDataJSON();
   assert.equal(data.expectedValue,values[data.key],'History reset must use current CAS value');
   if(!Object.hasOwn(values,data.key))return reply({code:'OWNER_EDIT_CONFLICT'},409);
   delete values[data.key];writes.push({key:data.key,reset:true});
   return reply({ok:true,deleted:true,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const selector='#stagePicker .stage-rich-fields dt[data-owner-copy-id="field.slots"]';
 const recordKey='guideedit.book.equipment.field.slots';
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
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
  await page.locator('#stagePicker .stage-picker-head button').click();
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
  // The owner drawer intentionally overlays the workbench on mobile.
  // Collapse it before selecting a Soul; keep admin editing active.
  await page.locator('#ownerDock [data-owner-collapse]').click();
  assert.equal(await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')),true);
  // Install a compatible real Soul and edit only the newly exposed caption.
  await page.locator('#stagePicker [data-stage-tab="souls"]').click();
  await page.locator('#stagePicker .stage-rich-result').first().click();
  await page.locator('#stagePicker [data-stage-tab="details"]').click();
  const caption=page.locator('#stagePicker .stage-gear-souls-head>strong');
  await caption.waitFor({state:'visible'});
  assert.equal((await caption.innerText()).trim(),'Socketed Souls');
  assert.equal((await value().innerText()).trim(),'1/2');
  await page.locator('#stagePicker .stage-gear-souls-pencil').click();
  const edit=caption.locator('[data-owner-text-field]');
  await edit.fill('Installed Souls QA');
  await edit.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker .stage-gear-souls-head>strong')?.textContent==='Installed Souls QA',
   null,{timeout:12000});
  assert.deepEqual(JSON.parse(values['guideedit.book.equipment.socketed-souls']),
   {en:'Installed Souls QA'});
  assert.equal((await value().innerText()).trim(),'1/2');
  assert.equal(await page.locator('#stagePicker .stage-gear-soul').count(),1);
  assert.deepEqual(errors,[]);
  console.log('Chromium owner equipment: RU/EN CAS, history reset and Souls caption passed');
 }finally{await context.close()}
}
