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
  const label=page.locator(selector);
  await label.waitFor({state:'visible'});
  assert.equal((await label.textContent()).trim(),'Слоты душ');
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
  assert.equal((await label.textContent()).trim(),'Слоты душ');
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
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  if(!(await page.locator('#stagePicker').isVisible()))
   await page.locator('.equipment-slot[data-slot-index="5"]').click();
  const enLabel=page.locator(selector);
  await enLabel.waitFor({state:'visible'});
  assert.equal((await enLabel.textContent()).trim(),'Soul slots');
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
  assert.equal(writes.filter(row=>row.key===recordKey).length,2);
  assert.equal((await value().innerText()).trim(),'0/2');
  // Undo the EN save: revert only the last locale, not the RU edit or Soul data.
  if(await page.locator('#ownerDock').evaluate(el=>
   el.classList.contains('owner-dock-collapsed')))
   await page.locator('#ownerDock [data-owner-collapse]').click();
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker .stage-rich-fields dt[data-owner-copy-id="field.slots"]')
   ?.textContent==='Soul slots',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values[recordKey]),{ru:'Гнёзда для душ'});
  assert.equal((await value().innerText()).trim(),'0/2');
  assert.deepEqual(errors,[]);
  console.log('Chromium owner equipment: full-width edit, RU/EN CAS and Undo passed');
 }finally{await context.close()}
}
