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
   assert.match(body.key,/^guideedit\.book\.(?:origin|path|equipment|wiki-ui|wiki\.chest\.text|wiki\.item\.text|wiki\.npc\.trade|wiki\.monster\.text|wiki\.map\.text|skill-ui|stats-ui)\./);
   assert.equal(body.expectedValue,Object.hasOwn(values,body.key)?values[body.key]:null,
    'All owner copy writes must use D1 expectedValue CAS');
   values[body.key]=body.value;writes.push(body);
   return reply({ok:true,key:body.key,value:body.value,conditional:true});
  }
  return route.abort();
 });
 const page=await ctx.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 // Caption buttons intentionally defer owner-mode single clicks to distinguish
 // them from direct-text double clicks. Wait for the actual chosen chapter
 // and for that pending action to finish before typing into its search box.
 const chooseWikiChapter=async key=>{
  const selector='[data-wiki-chapter="'+key+'"]';
  await page.locator(selector).click();
  await page.waitForFunction(chapterKey=>{
   const tab=document.querySelector('[data-wiki-chapter="'+chapterKey+'"]');
   return Boolean(tab?.classList.contains('chosen')&&
    tab.dataset.ownerCaptionPending!=='1');
  },key,{timeout:15000});
 };

 const row=(section,key)=>page.locator('.studio-owner-interface-row')
  .filter({has:page.locator('[data-owner-copy-section="'+section+
   '"][data-owner-copy-id="'+key+'"]')});
 const edit=async(section,key,value)=>{
  const item=row(section,key);
  assert.equal(await item.locator('.studio-owner-interface-pencil').count(),0,
   'No caption-edit pencil should exist beside direct-editable text');
  await item.locator('[data-owner-copy-id="'+key+'"]').dblclick();
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
  await row('wiki-ui','searchAria')
   .locator('[data-owner-copy-id="searchAria"]').dblclick();
  const cancel=row('wiki-ui','searchAria').locator('[data-owner-text-field]');
  await cancel.fill('Не сохранять');
  await cancel.press('Escape');
  assert.equal(writes.length,2);

  // Chest copy uses the same D1/CAS editor and must preserve real reward
  // categories, source counts, select state and group counts during edits.
  await wikiInput.fill('');
  await chooseWikiChapter('chest');
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
  assert.equal(chestKeys.length,36,'All chest captions belong to one owner panel');
  assert.equal(new Set(chestKeys).size,36,'No duplicate chest editor rows');
  assert.ok(chestKeys.includes('goldAmountPrefix'),
   'The gold-only authorial word shares the existing chest owner panel');
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
  await chooseWikiChapter('item');
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
  await chooseWikiChapter('npc');
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
  assert.equal(npcKeys.length,40);
  assert.equal(new Set(npcKeys).size,npcKeys.length);
  const offersBefore=await npc.locator('.wiki-trade-card').count();
  const searchNpcTrades=npc.locator('.wiki-inline-search[role="textbox"]');
  await searchNpcTrades.click();
  await searchNpcTrades.fill('Несуществующий предмет');
  assert.match(await npc.locator('.wiki-result-counter').innerText(),/^0 из \d+$/);
  await edit('wiki.npc.trade','searchPlaceholder','Поиск по предложениям…');
  assert.equal(await searchNpcTrades.getAttribute('placeholder'),'Поиск по предложениям…');
  assert.equal(await searchNpcTrades.innerText(),'Несуществующий предмет');
  assert.equal(await searchNpcTrades.getAttribute('data-placeholder'),'Поиск по предложениям…');
  await edit('wiki.npc.trade','counterOf','среди');
  assert.match(await npc.locator('.wiki-result-counter').innerText(),/^0 среди \d+$/);
  assert.equal(await npc.locator('.wiki-trade-card').count(),offersBefore);
  // This is a contenteditable textbox: clear it through real keyboard input,
  // then assert that the list is unfiltered before choosing a delete action.
  await searchNpcTrades.click();
  await searchNpcTrades.press('ControlOrMeta+A');
  await searchNpcTrades.press('Backspace');
  await page.waitForFunction(()=>[...document.querySelectorAll(
   '#detailContent .wiki-trade-card')].some(card=>!card.hidden),null,{timeout:10000});
  const unfilteredCount=await npc.locator('.wiki-result-counter').innerText();
  assert.equal(unfilteredCount,offersBefore+' среди '+offersBefore);
  assert.equal((await searchNpcTrades.textContent()).trim(),'');
  const removeTrade=npc.locator('.wiki-trade-card:not([hidden]) .wiki-trade-delete').first();
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

  // Owner Wiki monster: authorial D1 copy must not mutate the current OS
  // numeric stats, resistances, or source loot. Cancelling an armed delete
  // never issues a game data write, including on focus change.
  await page.locator('#dockClose').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await chooseWikiChapter('monster');
  const monsterSearch=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  await monsterSearch.click();
  await monsterSearch.fill('Койот');
  await page.locator('[data-wiki-record="11101"]').click();
  const monster=page.locator('#detailContent');
  await monster.locator('.wiki-monster-stats').waitFor({state:'visible'});
  const monsterPanel=monster.locator('.studio-owner-interface-editor')
   .filter({has:page.locator('[data-owner-copy-section="wiki.monster.text"]')});
  await monsterPanel.locator('summary').click();
  const monsterKeys=await monsterPanel.locator('[data-owner-copy-id]')
   .evaluateAll(nodes=>nodes.map(node=>node.dataset.ownerCopyId));
  assert.equal(monsterKeys.length,56);
  assert.equal(new Set(monsterKeys).size,monsterKeys.length);
  const monsterStatsBefore=await monster.locator('.wiki-monster-stat strong').allInnerTexts();
  const monsterResistsBefore=await monster.locator('.wiki-monster-resist strong').allInnerTexts();
  const monsterLootCount=await monster.locator('.wiki-loot-chip').count();
  assert.ok(monsterLootCount>0,'The verified OS Coyote has source loot');
  await edit('wiki.monster.text','loot','Трофеи монстра');
  assert.match(await monster.locator('[data-owner-interface-key="loot"]').innerText(),
   /^Трофеи монстра · \d+$/);
  await edit('wiki.monster.text','statLevel','Уровень противника');
  assert.equal(await monster.locator('.wiki-monster-stat small').first().innerText(),
   'Уровень противника');
  assert.deepEqual(await monster.locator('.wiki-monster-stat strong').allInnerTexts(),
   monsterStatsBefore);
  assert.deepEqual(await monster.locator('.wiki-monster-resist strong').allInnerTexts(),
   monsterResistsBefore);
  await edit('wiki.monster.text','confirmRemove','Подтвердить трофей');
  const dropRemove=monster.locator('.wiki-loot-delete').first();
  await dropRemove.click();
  assert.equal(await dropRemove.innerText(),'Подтвердить трофей');
  assert.equal(await dropRemove.getAttribute('data-confirm'),'1');
  await dropRemove.press('Escape');
  assert.equal(await dropRemove.innerText(),'×');
  assert.equal(await dropRemove.getAttribute('data-confirm'),null);
  await dropRemove.click();
  await monsterPanel.locator('summary').click();
  assert.equal(await dropRemove.getAttribute('data-confirm'),null,
   'Leaving an armed loot delete must discard confirmation');
  assert.equal(await monster.locator('.wiki-loot-chip').count(),monsterLootCount);
  assert.equal(writes.some(write=>write.key.startsWith('dropedit.')),false);

  // Real atlas owner copy must update the visible map without rewriting its
  // curated monster roster, and without granting privileges to guests.
  await page.locator('#dockClose').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await chooseWikiChapter('map');
  await page.locator('[data-wiki-record="el-beht"]').click();
  const atlas=page.locator('#detailContent');
  const atlasPanel=atlas.locator('.studio-owner-interface-editor')
   .filter({has:page.locator('[data-owner-copy-section="wiki.map.text"]')});
  await atlasPanel.locator('summary').click();
  assert.equal(await atlasPanel.locator('[data-owner-copy-id]').count(),58);
  const atlasCount=await atlas.locator('.wiki-map-monsters .wiki-entry').count();
  assert.ok(atlasCount>0);
  await edit('wiki.map.text','monsters','Обитатели локации');
  assert.match(await atlas.locator('[data-owner-interface-key="monsters"]').innerText(),
   /^Обитатели локации · \d+/);
  await edit('wiki.map.text','tags','Метки локации');
  assert.equal(await atlas.locator('.wiki-map-tag-section h4').innerText(),'Метки локации');
  assert.equal(await atlas.locator('.wiki-map-monsters .wiki-entry').count(),atlasCount);
  assert.equal(writes.some(write=>write.key.startsWith('wikiedit.map.')),false,
   'Editing static atlas captions must never modify map data');

  // Skills: work inside the real right-hand Hero Path instead of the
  // retired standalone skills workbench, which has no navigation tab.
  await page.locator('#dockClose').click();
  // #390: meaningful hover explanations remain editable. Self-explanatory
  // Origin/Path tabs cannot keep legacy phantom hint panels or hover copy.
  const hints=page.locator('.workbench-hint-editor');
  assert.equal(await hints.count(),2);
  assert.equal(await page.locator(
   '[data-i18n="originGuide"] + .workbench-hint-editor').count(),0);
  for(const selector of [
   '[data-origin-tab="race"]','[data-origin-tab="class"]',
   '[data-origin-tab="stats"]','#pathGrowthTab','#pathSkillsTab'
  ]){
   const tab=page.locator(selector);
   assert.equal(await tab.getAttribute('data-guide-hint'),null,
    'Self-explanatory tab must not expose phantom hover help: '+selector);
   assert.equal(await tab.getAttribute('aria-description'),null);
  }
  for(const [section,key,selector,newCopy] of [
   ['equipment','hintPortrait','#hero','Помощь: книга героя'],
   ['equipment','hintWeapon','#jumpEquipment','Помощь: выбор оружия'],
   ['equipment','hintNewBuild','#newBuildQuick','Помощь: новый билд'],
   ['equipment','hintSaveBuild','#snapshot','Помощь: сохранить билд'],
   ['path','hintReset','#pathResetPoints','Помощь: сброс веток']
  ]){
   const panel=page.locator('[data-i18n="'+
    (section==='equipment'?'appearanceGuide':'pathGuide')+
    '"] + .workbench-hint-editor');
   assert.equal(await panel.count(),1,'Exactly one panel per real hint family');
   if(!(await panel.evaluate(node=>node.open)))
    await panel.locator('summary').click();
   const target=page.locator(selector);
   assert.ok(await target.getAttribute('data-guide-hint'),
    'A real hint target must expose independent hover help: '+selector);
   const beforeLevel=await page.locator('#levelOut').innerText();
   await edit(section,key,newCopy);
   assert.equal(await target.getAttribute('data-guide-hint'),newCopy);
   assert.equal(await target.getAttribute('aria-description'),newCopy);
   assert.equal(await page.locator('#levelOut').innerText(),beforeLevel);
  }
  assert.equal(writes.filter(write=>/(origin|equipment|path)\.hint-/.test(write.key)).length,5);
  assert.equal(await hints.count(),2,'Saves must not duplicate hint panels');
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
  const stats=page.locator('#ownerOriginStatsCopy');
  await stats.waitFor({state:'visible'});
  await stats.locator('summary').click();
  const expectedAria=['vitalsLoadingAria','holdStepAria','decreaseAria',
   'increaseAria','excludeBonusesAria','baseAria','pointsAria',
   'knownBonusesAria','costAria','maximumAria'];
  const actualAria=await stats.locator('[data-owner-copy-id]')
   .evaluateAll(nodes=>nodes.map(node=>node.dataset.ownerCopyId));
  assert.deepEqual(actualAria.slice().sort(),expectedAria.slice().sort(),
   'One owner-only panel for accessibility, visible stats edit directly');
  const originalSummary=await page.locator('#originStatSummary').innerText();
  // Both values are plain text inside the actual summary, not in the
  // owner-only accessibility panel. Dblclick/blur must save the visible word.
  const editSummary=async(key,value)=>{
   const node=page.locator('#originStatSummary [data-owner-copy-id="'+key+'"]');
   await node.dblclick();
   const field=node.locator('[data-owner-text-field]');
   await field.waitFor({state:'visible'});
   await field.fill(value);
   await field.press('Tab');
   await field.waitFor({state:'detached',timeout:15000});
   await page.waitForFunction(({key,value})=>
    document.querySelector('#originStatSummary [data-owner-copy-id="'+key+'"]')
     ?.textContent===value,{key,value},{timeout:15000});
   const recordKey='guideedit.book.stats-ui.'+
    key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
   assert.equal(JSON.parse(values[recordKey]).ru,value);
  };
  await editSummary('remainingPrefix','Осталось:');
  await editSummary('spentPrefix','Распределено:');
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
  // The native control itself, not its nested caption, takes keyboard focus.
  // F2 must open its owner-only D1 editor; ordinary Enter continues changing
  // tabs and must never become an accidental editor hotkey.
  const detailsTab=picker.locator('[data-stage-tab="details"]');
  await detailsTab.focus();
  assert.equal(await detailsTab.getAttribute('aria-keyshortcuts'),'F2');
  await detailsTab.press('F2');
  const gearCaptionDraft=detailsTab.locator('.stage-copy-caption [data-owner-text-field]');
  await gearCaptionDraft.waitFor({state:'visible'});
  await gearCaptionDraft.fill('Проверенные свойства');
  await gearCaptionDraft.press('Escape');
  assert.equal(await detailsTab.locator('[data-owner-text-field]').count(),0,
   'Esc cancels the direct keyboard caption edit without writing to D1');
  assert.equal(await detailsTab.getAttribute('aria-pressed'),'true',
   'F2 and Esc must not switch equipment tabs or change Soul data');
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
  await enRow.locator('[data-owner-copy-id="searchPlaceholder"]').dblclick();
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
