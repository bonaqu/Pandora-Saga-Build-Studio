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
   assert.match(body.key,/^guideedit\.book\.(?:origin|path|equipment|wiki-ui|wiki\.chest\.text|wiki\.item\.text|wiki\.npc\.trade|skill-ui|stats-ui)\./);
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
  const wikiPanel=page.locator('#detailContent .studio-owner-interface-editor:not(.wiki-filter-labels-editor)');
  await wikiPanel.locator('summary').click();
  // The encyclopedia grows new editorial keys across releases. Require its
  // original seven independent controls, verify newer dynamic keys and reject
  // duplicates without pinning the total row count.
  const wikiCopyKeys=await wikiPanel.locator('.studio-owner-interface-row [data-owner-copy-id]')
   .evaluateAll(nodes=>nodes.map(node=>node.dataset.ownerCopyId));
  for(const id of ['searchPlaceholder','searchAria','backTop','backTopAria',
   'viewAria','viewList','viewGrid','resultsShown','resultsOf','resultsUnits',
   'morePrefix','noMatches','selectPrompt']){
   assert.ok(wikiCopyKeys.includes(id),'Missing editable Wiki label: '+id);
  }
  assert.equal(new Set(wikiCopyKeys).size,wikiCopyKeys.length,
   'One owner editor per semantic Wiki label, never duplicates');
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

  // Chest copy uses the same D1/CAS editor and must preserve real reward
  // categories, source counts, select state and group counts during edits.
  await wikiInput.fill('');
  await page.locator('[data-wiki-chapter="chest"]').click();
  await page.locator('[data-wiki-record="51036"]').click();
  const chest=page.locator('#detailContent');
  await chest.locator('.wiki-chest-board').waitFor({state:'visible'});
  // Playwright's "has" locator is evaluated relative to each candidate;
  // prefixing it with #detailContent would incorrectly require a nested
  // #detailContent inside the editor and time out, despite valid UI.
  const chestPanel=chest.locator('.studio-owner-interface-editor')
   .filter({has:page.locator('[data-owner-copy-section="wiki.chest.text"]')});
  await chestPanel.locator('summary').click();
  const chestKeys=await chestPanel.locator('[data-owner-copy-id]').evaluateAll(
   nodes=>nodes.map(node=>node.dataset.ownerCopyId));
  assert.equal(chestKeys.length,35,'All chest captions belong to one owner panel');
  assert.equal(new Set(chestKeys).size,35,'No duplicate chest editor rows');
  const chestFilter=chest.locator('.wiki-chest-filter-type');
  const totalBefore=await chest.locator('.wiki-chest-filter-count').innerText();
  const countBefore=await chest.locator('.wiki-chest-reward').count();
  await edit('wiki.chest.text','filterCategory','Категория добычи');
  assert.equal(await chestFilter.getAttribute('aria-label'),'Категория добычи');
  assert.equal(await chestFilter.inputValue(),'all');
  assert.equal(await chest.locator('.wiki-chest-filter-count').innerText(),totalBefore);
  await chestFilter.selectOption('equipment');
  await edit('wiki.chest.text','groupShowing','Найдено:');
  const visibleCount=chest.locator('.wiki-chest-group:not([hidden]) .wiki-chest-group-count').first();
  assert.match(await visibleCount.innerText(),/^Найдено:\d+ \/ \d+$/);
  await chestFilter.selectOption('all');
  await chestFilter.selectOption('equipment');
  assert.match(await visibleCount.innerText(),/^Найдено:\d+ \/ \d+$/,
   'Filtering must not bring back the obsolete hardcoded caption');
  await edit('wiki.chest.text','filterEmpty','Награды в этой категории не найдены.');
  assert.equal(await chest.locator('.wiki-chest-filter-empty').textContent(),
   'Награды в этой категории не найдены.');
  assert.equal(await chest.locator('.wiki-chest-reward').count(),countBefore,
   'Writing display copy cannot remove or alter reward records');
  assert.equal(await chestFilter.inputValue(),'equipment');
  assert.equal(JSON.parse(values['guideedit.book.wiki.chest.text.group-showing']).ru,'Найдено:');

  // Item captions are CAS-edited in the real owner Wiki without changing
  // the source item values, record selection or game calculations.
  await page.locator('#dockClose').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="item"]').click();
  const itemSearch=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  await itemSearch.click();
  await itemSearch.fill('Железные поножи');
  await page.locator('[data-wiki-record="13041"]').click();
  const item=page.locator('#detailContent');
  await item.locator('.item-fields').waitFor({state:'visible'});
  const itemPanel=item.locator('.studio-owner-interface-editor')
   .filter({has:page.locator('[data-owner-copy-section="wiki.item.text"]')});
  await itemPanel.locator('summary').click();
  const itemCopyKeys=await itemPanel.locator('.studio-owner-interface-row [data-owner-copy-id]')
   .evaluateAll(nodes=>nodes.map(node=>node.dataset.ownerCopyId));
  assert.equal(itemCopyKeys.length,29);
  assert.equal(new Set(itemCopyKeys).size,29);
  const originalItemValues=await item.locator('.item-fields').innerText();
  await edit('wiki.item.text','obtainHeading','Где добывается');
  assert.equal(await item.locator('[data-owner-interface-key="obtainHeading"]')
   .innerText(),'Где добывается');
  assert.equal(await item.locator('.item-fields').innerText(),originalItemValues,
   'Editing a caption must not mutate the game item stats');
  assert.equal(JSON.parse(values['guideedit.book.wiki.item.text.obtain-heading']).ru,
   'Где добывается');

  // NPC trades: the published recipes and prices must not change when a
  // bilingual source label is edited through real D1 CAS.
  await page.locator('#dockClose').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="npc"]').click();
  const npcSearchWiki=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  await npcSearchWiki.click();
  await npcSearchWiki.fill('Огун VIII');
  await page.locator('[data-wiki-record="131"]').click();
  const npc=page.locator('#detailContent');
  await npc.locator('.wiki-trade-card').first().waitFor({state:'visible'});
  const npcPanel=npc.locator('.studio-owner-interface-editor')
   .filter({has:page.locator('[data-owner-copy-section="wiki.npc.trade"]')});
  await npcPanel.locator('summary').click();
  const npcKeys=await npcPanel.locator('.studio-owner-interface-row [data-owner-copy-id]')
   .evaluateAll(nodes=>nodes.map(node=>node.dataset.ownerCopyId));
  assert.equal(npcKeys.length,36);
  assert.equal(new Set(npcKeys).size,36);
  const offersBefore=await npc.locator('.wiki-trade-card').count();
  const searchNpcTrades=npc.locator('input.wiki-inline-search');
  await searchNpcTrades.click();
  await searchNpcTrades.fill('Несуществующий предмет');
  assert.match(await npc.locator('.wiki-result-counter').innerText(),/^0 из \d+$/);
  await edit('wiki.npc.trade','searchPlaceholder','Поиск по предложениям…');
  assert.equal(await searchNpcTrades.getAttribute('placeholder'),'Поиск по предложениям…');
  assert.equal(await searchNpcTrades.inputValue(),'Несуществующий предмет');
  await edit('wiki.npc.trade','counterOf','среди');
  assert.match(await npc.locator('.wiki-result-counter').innerText(),/^0 среди \d+$/);
  assert.equal(await npc.locator('.wiki-trade-card').count(),offersBefore);
  await searchNpcTrades.fill('');
  const removeTrade=npc.locator('.wiki-trade-delete').first();
  await edit('wiki.npc.trade','deleteConfirm','Подтвердить безвозвратное удаление');
  await removeTrade.click();
  assert.equal(await removeTrade.innerText(),'Подтвердить безвозвратное удаление');
  assert.equal(await removeTrade.getAttribute('data-confirm'),'1');
  await removeTrade.press('Escape');
  assert.equal(await removeTrade.innerText(),'Удалить обмен');
  assert.equal(await removeTrade.getAttribute('data-confirm'),null);
  await removeTrade.click();
  await searchNpcTrades.click();
  assert.equal(await removeTrade.innerText(),'Удалить обмен',
   'Leaving the delete button must discard pending confirmation');
  assert.equal(writes.some(write=>write.key.startsWith('tradeedit.')),false);
  assert.equal(await npc.locator('.wiki-trade-card').count(),offersBefore,
   'Neither caption edits nor aborted confirmations delete NPC recipes');

  // Skills: work inside the real right-hand Hero Path instead of the
  // retired standalone skills workbench, which has no navigation tab.
  await page.locator('#dockClose').click();
  // 864: fixed tooltips in all three workbench areas are owner-authored D1
  // content. Editing must refresh the target without changing the hero.
  const hints=page.locator('.workbench-hint-editor');
  assert.equal(await hints.count(),3);
  for(const [section,key,selector,newCopy] of [
   ['origin','hintRace','[data-origin-tab="race"]','Помощь: раса'],
   ['equipment','hintWeapon','#jumpEquipment','Помощь: выбор оружия'],
   ['path','hintSkills','#pathSkillsTab','Помощь: умения героя']
  ]){
   const panel=page.locator('[data-i18n="'+
    (section==='origin'?'originGuide':section==='equipment'?'appearanceGuide':'pathGuide')+
    '"] + .workbench-hint-editor');
   await panel.locator('summary').click();
   const target=page.locator(selector);
   const original=await target.getAttribute('data-guide-hint');
   const redundant=section==='origin'||section==='path';
   if(redundant)assert.equal(original,null,'Self-explanatory tabs must not have redundant hover help');
   else assert.ok(original,'Useful action hints must remain visible');
   const beforeLevel=await page.locator('#levelOut').innerText();
   await edit(section,key,newCopy);
   assert.equal(await target.getAttribute('data-guide-hint'),redundant?null:newCopy);
   assert.equal(await target.getAttribute('aria-description'),redundant?null:newCopy);
   assert.equal(await page.locator('#levelOut').innerText(),beforeLevel);
   await panel.locator('summary').click();
  }
  assert.equal(writes.filter(write=>/(origin|equipment|path)\.hint-/.test(write.key)).length,3);
  await page.locator('#pathSkillsTab').click();
  const pathSearch=page.locator('#pathSkillSearch');
  await pathSearch.waitFor({state:'visible'});
  // Hero Path search has the same password-manager guard as Encyclopedia:
  // a real click unlocks its intentional temporary readonly state.
  await pathSearch.click();
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
  // Keep the existing 15 author fields AND the 15 new game-safe captions.
  // Assert stable key identity and uniqueness rather than freezing the count.
  const equipmentKeys=await equipPanel.locator(
   '.studio-owner-interface-row [data-owner-copy-id]')
   .evaluateAll(nodes=>nodes.map(node=>node.dataset.ownerCopyId));
  for(const key of [
   'pickerChoosePrefix','pickerDetails','pickerClose','pickerSearchPlaceholder',
   'pickerSearchAria','pickerUnequip','pickerAvailableLabel','pickerAvailableAria',
   'pickerMatchSuffix','pickerShownSuffix','pickerMorePrefix','pickerOutfitNote',
   'pickerLoading','pickerOriginFirst','pickerNoMatches',
   'gearMenuEquippedAria','gearMenuEmptyAria','gearMenuEmptyTitle',
   'gearMenuNoSoulSlots','gearMenuMissingItem','pickerNavGroup',
   'pickerPreviousSlot','pickerNextSlot','pickerEquipAction','pickerPlanAction',
   'pickerFutureLevel','pickerItemLevel','pickerItemSlots',
   'pickerFutureBadgePrefix','pickerFutureBadgeSuffix'
  ])assert.ok(equipmentKeys.includes(key),'Missing equipment D1 copy: '+key);
  assert.equal(new Set(equipmentKeys).size,equipmentKeys.length,
   'Each equipment caption must have exactly one editor');
  for(const key of ['pickerAvailableLabel','pickerAvailableAria','pickerMatchSuffix',
   'pickerShownSuffix','pickerMorePrefix'])
   assert.equal(await row('equipment',key).count(),1,
    'New owner-editable label present: '+key);
  const gearFilter=picker.locator('.stage-picker-only-available input');
  const originalFilterState=await gearFilter.isChecked();
  await edit('equipment','pickerAvailableLabel','Фильтр по уровню');
  assert.equal((await picker.locator('.stage-picker-only-available span').innerText()).trim(),
   'Фильтр по уровню');
  assert.equal(await gearFilter.isChecked(),originalFilterState,
   'D1 caption edit cannot toggle the filter');
  await edit('equipment','pickerMatchSuffix','совпадений');
  assert.equal((await picker.locator('.stage-picker-count').innerText()).trim(),
   '0 совпадений · 0 показано',
   'Owner edits only the words, never the live numeric counts');
  assert.equal(await equipInput.inputValue(),'no item exists');
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
  const detailsKeys=await detailsPanel.locator(
   '.studio-owner-interface-row [data-owner-copy-id]')
   .evaluateAll(nodes=>nodes.map(node=>node.dataset.ownerCopyId));
  for(const key of [
   'pickerItemClose','pickerItemSettings','pickerSoulSearchAria',
   'pickerSoulSlotAria','pickerSoulSlotCaption','pickerEmptySoul',
   'hint.choose','hint.details','hint.souls',
   'gearMenuEquippedAria','gearMenuEmptyAria','gearMenuEmptyTitle',
   'gearMenuNoSoulSlots','gearMenuMissingItem','pickerNavGroup',
   'pickerPreviousSlot','pickerNextSlot','pickerEquipAction','pickerPlanAction',
   'pickerFutureLevel','pickerItemLevel','pickerItemSlots',
   'pickerFutureBadgePrefix','pickerFutureBadgeSuffix'
  ])assert.ok(detailsKeys.includes(key),'Missing item-details D1 copy: '+key);
  assert.equal(new Set(detailsKeys).size,detailsKeys.length,
   'Details and Souls must not duplicate the same editor');
  await edit('equipment','pickerItemSettings','Параметры экипировки');
  await edit('equipment','hint.souls','Подсказка слотов душ');
  assert.equal(await picker.locator('[data-stage-tab="souls"]')
   .getAttribute('data-guide-hint'),'Подсказка слотов душ');
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
  // Encyclopedia and chest editors may coexist: target the exact Wiki
  // copy family instead of relying on there being only one details panel.
  const englishWikiEditor=page.locator('#detailContent .studio-owner-interface-editor')
   .filter({has:page.locator('[data-owner-copy-section="wiki-ui"][data-owner-copy-id="searchPlaceholder"]')});
  await englishWikiEditor.locator('summary').click();
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
  const overflow=await englishWikiEditor
   .evaluate(node=>node.scrollWidth-node.clientWidth);
  assert.ok(overflow<=5,'Compact owner editor must fit the 390px width');
  assert.deepEqual(errors,[]);
  console.log('Chromium cross-surface 663: 27 D1 strings, real Wiki/Skill/Equipment controls, RU/EN CAS, Escape, mobile and no data loss');
 }finally{await ctx.close()}
}
