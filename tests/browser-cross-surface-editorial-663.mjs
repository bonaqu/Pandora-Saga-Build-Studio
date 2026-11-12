import assert from 'node:assert/strict';

// All D1 writes are mocked and checked for CAS. This test never edits
// production data or uses a real user account.
export async function runCrossSurfaceEditorial663Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const token='a'.repeat(43),values={},writes=[],errors=[];
 const ctx=await browser.newContext({viewport:{width:1366,height:880}});
 await ctx.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:7,level:45,name:'Cross-section QA',
   stats:{},points:{},mastery:{},
   equipment:{5:{id:13041,name:'Железные поножи'}},
   socketCapacities:{'5:13041':2},souls:{},refinements:{},gems:{}
  }));
 });
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await ctx.route('**/*',route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const reply=(data,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/overrides')return reply({values:{...values}});
  if(path==='/api/admin/login')return reply({token,expires:Date.now()+600000});
  if(path==='/api/admin/catalog/test-write')return reply({
   ok:true,readback:true,cleaned:true,overrideReadback:true,
   overrideCleaned:true,activeCatalogUnchanged:true});
  if(path==='/api/admin/override'&&req.method()==='POST'){
   assert.equal(req.headers().authorization,'Bearer '+token);
   const body=req.postDataJSON();
   assert.match(body.key,/^guideedit\.book\.(?:equipment|wiki-ui|skill-ui|stats-ui)\./);
   assert.equal(body.expectedValue,Object.hasOwn(values,body.key)?values[body.key]:null,
    'All owner copy writes must use D1 expectedValue CAS');
   values[body.key]=body.value;writes.push(body);
   return reply({ok:true,key:body.key,value:body.value,conditional:true});
  }
  return route.abort();
 });
 const page=await ctx.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 const row=(section,key)=>page.locator('.studio-owner-interface-row')
  .filter({has:page.locator('[data-owner-copy-section="'+section+
   '"][data-owner-copy-id="'+key+'"]')});
 const edit=async(section,key,value)=>{
  const item=row(section,key);
  await item.locator('.studio-owner-interface-pencil').click();
  const input=item.locator('[data-owner-text-field]');
  await input.waitFor({state:'visible',timeout:10000});
  await input.fill(value);
  await input.press('Tab');
  // The mock Worker records D1 before the client receives its CAS response.
  // Wait until the inline editor has actually finished saving and unmounted,
  // not just until its contenteditable text equals the typed draft.
  await input.waitFor({state:'detached',timeout:15000});
  const recordKey='guideedit.book.'+section+'.'+key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  await page.waitForFunction(({section,key,value})=>
   document.querySelector('[data-owner-copy-section="'+section+
    '"][data-owner-copy-id="'+key+'"]')?.textContent===value,
   {section,key,value},{timeout:15000});
  assert.equal(JSON.parse(values[recordKey]).ru,value);
  return recordKey;
 };
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#nav [data-tab="wiki"]').click();
  assert.equal(await page.locator('#detailContent .studio-owner-interface-editor').count(),0,
   'Guest must not see admin controls');
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:15000});

  // The encyclopedia remains open after admin login. The top nav is hidden
  // inside the workbench, so never attempt to click a hidden active tab.
  const wikiInput=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  await wikiInput.waitFor({state:'visible'});
  // Encyclopedia search is intentionally readonly until a real pointer
  // or keyboard interaction, to suppress password-manager interference.
  await wikiInput.click();
  await wikiInput.fill('search that stays');
  const wikiBindings=JSON.parse(await wikiInput.getAttribute('data-owner-interface-bindings'));
  assert.equal(wikiBindings.placeholder.key,'searchPlaceholder');
  assert.equal(wikiBindings['aria-label'].key,'searchAria');
  await wikiInput.evaluate(node=>{window.__copyWikiSearch=node});
  const wikiPanel=page.locator('#detailContent .studio-owner-interface-editor');
  await wikiPanel.locator('summary').click();
  assert.equal(await wikiPanel.locator('.studio-owner-interface-row').count(),7);
  const wikiKey=await edit('wiki-ui','searchPlaceholder','Искать в справочнике…');
  assert.equal(await wikiInput.getAttribute('placeholder'),'Искать в справочнике…');
  assert.equal(await wikiInput.inputValue(),'search that stays');
  assert.equal(await wikiInput.evaluate(node=>node===window.__copyWikiSearch),true);
  await edit('wiki-ui','searchAria','Искать записи энциклопедии');
  assert.equal(await wikiInput.getAttribute('aria-label'),'Искать записи энциклопедии');
  assert.equal(await wikiInput.getAttribute('placeholder'),'Искать в справочнике…',
   'The aria edit must not overwrite the separately edited placeholder');
  // Escape cancels without another D1 write, on the same live page.
  await row('wiki-ui','searchAria').locator('.studio-owner-interface-pencil').click();
  const cancel=row('wiki-ui','searchAria').locator('[data-owner-text-field]');
  await cancel.fill('Не сохранять');
  await cancel.press('Escape');
  assert.equal(writes.length,2);

  // Skills: work inside the real right-hand Hero Path instead of the
  // retired standalone skills workbench, which has no navigation tab.
  await page.locator('#dockClose').click();
  await page.locator('#pathSkillsTab').click();
  const pathSearch=page.locator('#pathSkillSearch');
  await pathSearch.waitFor({state:'visible'});
  await pathSearch.fill('spell name stays');
  await pathSearch.evaluate(node=>{window.__copySkillSearch=node});
  const skills=page.locator('#pathSkillsPage .studio-owner-interface-editor');
  await skills.locator('summary').click();
  assert.equal(await skills.locator('.studio-owner-interface-row').count(),2);
  await edit('skill-ui','searchPlaceholder','Найти редкое умение');
  assert.equal(await pathSearch.getAttribute('placeholder'),'Найти редкое умение');
  assert.equal(await pathSearch.inputValue(),'spell name stays');
  assert.equal(await pathSearch.evaluate(node=>node===window.__copySkillSearch),true);
  await edit('skill-ui','filterAria','Выбрать тип умений');
  assert.equal(await page.locator('#pathSkillStatus').getAttribute('aria-label'),
   'Выбрать тип умений');

  // Live Origin stats: D1 controls edit captions only, not remaining points.
  await page.locator('#originTabs [data-origin-tab="stats"]').click();
  const stats=page.locator('#originStats .studio-owner-interface-editor');
  await stats.waitFor({state:'visible'});
  await stats.locator('summary').click();
  assert.equal(await stats.locator('.studio-owner-interface-row').count(),2);
  const originalSummary=await page.locator('#originStatSummary').innerText();
  await edit('stats-ui','remainingPrefix','Осталось:');
  await edit('stats-ui','spentPrefix','Распределено:');
  const updatedSummary=await page.locator('#originStatSummary').innerText();
  assert.match(updatedSummary,/Осталось:/);
  assert.match(updatedSummary,/Распределено:/);
  assert.equal(updatedSummary.replace('Осталось:','Свободно:').replace(
   'Распределено:','Потрачено:'),originalSummary,
   'Copy changes must not affect allocated or available points');

  // Equipment: choose a real character slot without a hidden nav tab.
  await page.locator('.equipment-slot[data-slot-index="0"]').click();
  const picker=page.locator('#stagePicker');
  await picker.locator('.stage-picker-list').waitFor({state:'visible'});
  const equipInput=picker.locator('input[type="search"]');
  await equipInput.fill('no item exists');
  const gearBindings=JSON.parse(await equipInput.getAttribute('data-owner-interface-bindings'));
  assert.equal(gearBindings.placeholder.key,'pickerSearchPlaceholder');
  assert.equal(gearBindings['aria-label'].key,'pickerSearchAria');
  await equipInput.evaluate(node=>{window.__copyGearSearch=node});
  const equipPanel=picker.locator('.studio-owner-interface-editor');
  await equipPanel.locator('summary').click();
  assert.equal(await equipPanel.locator('.studio-owner-interface-row').count(),10);
  await edit('equipment','pickerSearchPlaceholder','Найти снаряжение…');
  assert.equal(await equipInput.getAttribute('placeholder'),'Найти снаряжение…');
  assert.equal(await equipInput.inputValue(),'no item exists');
  assert.equal(await equipInput.evaluate(node=>node===window.__copyGearSearch),true);
  await edit('equipment','pickerSearchAria','Искать снаряжение для');
  assert.match(await equipInput.getAttribute('aria-label'),/Искать снаряжение для/);
  assert.equal(await equipInput.getAttribute('placeholder'),'Найти снаряжение…',
   'Equipment aria and placeholder must remain independent');
  await edit('equipment','pickerNoMatches','Совместимого снаряжения нет.');
  await picker.locator('.stage-picker-list .muted')
   .getByText('Совместимого снаряжения нет.').waitFor({state:'visible'});

  // Dedicated item UI: its own module uses the same owner mechanism.
  await picker.locator('.stage-picker-head button[aria-label="Закрыть выбор"]').click();
  await page.locator('.equipment-slot[data-slot-index="5"]').click();
  await picker.locator('[data-stage-tab="details"]').waitFor({state:'visible'});
  const detailsPanel=picker.locator('.studio-owner-interface-editor');
  await detailsPanel.locator('summary').click();
  assert.equal(await detailsPanel.locator('.studio-owner-interface-row').count(),6);
  await edit('equipment','pickerItemSettings','Параметры экипировки');
  assert.equal(await picker.locator('[role="group"][data-owner-interface-key="pickerItemSettings"]')
   .getAttribute('aria-label'),'Параметры экипировки');
  assert.equal(await page.locator('.equipment-slot[data-slot-index="5"].equipped').count(),1);

  // Changing language reads each language's independent stored RU/EN field.
  await picker.locator('.stage-picker-head button[aria-label="Закрыть настройку"]').click();
  if(await page.locator('#dockClose').isVisible())await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await wikiInput.waitFor({state:'visible'});
  assert.equal(await wikiInput.getAttribute('placeholder'),'Search by name');
  await page.locator('#detailContent .studio-owner-interface-editor summary').click();
  // Set the English variant through the same real editor and CAS key.
  const enRow=row('wiki-ui','searchPlaceholder');
  await enRow.locator('.studio-owner-interface-pencil').click();
  const enEdit=enRow.locator('[data-owner-text-field]');
  await enEdit.fill('Find a record…');
  await enEdit.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('input[name="pandora-studio-encyclopedia-filter"]')
    ?.placeholder==='Find a record…',{},{timeout:15000});
  assert.deepEqual(JSON.parse(values[wikiKey]),{
   ru:'Искать в справочнике…',en:'Find a record…'});
  await page.setViewportSize({width:390,height:800});
  const overflow=await page.locator('#detailContent .studio-owner-interface-editor')
   .evaluate(node=>node.scrollWidth-node.clientWidth);
  assert.ok(overflow<=5,'Compact owner editor must fit the 390px width');
  assert.deepEqual(errors,[]);
  console.log('Chromium cross-surface 663: 27 D1 strings, real Wiki/Skill/Equipment controls, RU/EN CAS, Escape, mobile and no data loss');
 }finally{await ctx.close()}
}
