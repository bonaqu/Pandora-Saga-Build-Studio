import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const firstRu=read('data/os/items.json')['1'].name;
const firstEn=read('data/os/strings.en.json').items['1'].n;

// Equipment is a filtered chapter of the encyclopedia, not a separate header tab.
export async function runEquipmentLocaleSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:850}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>/\d+ навыков · \d+ предметов · \d+ душ/.test(
   document.querySelector('#catalogStatus')?.textContent||''),null,{timeout:20000});
  assert.equal(await page.locator('#nav [data-tab="equipment"]').count(),0);
  assert.equal(await page.locator('#nav [data-tab="character"]').count(),0);
  await page.locator('#nav [data-tab="wiki"]').click();
  const picker=page.locator('.wiki-equipment-type'),rows=page.locator('.wiki-list .wiki-link');
  await picker.waitFor({state:'visible',timeout:20000});
  await rows.first().waitFor({state:'visible',timeout:20000});
  assert.equal(await picker.inputValue(),'equipment');
  assert.equal((await rows.first().innerText()).trim(),firstRu);
  // Back to the origin list, Forward to the linked record, and explicit Back.
  const originalHash=await page.evaluate(()=>location.hash);
  await rows.first().click();
  await page.waitForFunction(()=>location.hash.startsWith('#wiki/item/'));
  const chosenHash=await page.evaluate(()=>location.hash);
  await page.locator('.wiki-return-button').waitFor({state:'visible'});
  await page.goBack();
  await page.waitForFunction(expected=>location.hash===expected,originalHash);
  assert.equal(await page.locator('#detailPanel').getAttribute('aria-modal'),'true');
  assert.equal(await page.locator('.wiki-return-button').count(),0);
  await page.goForward();
  await page.waitForFunction(expected=>location.hash===expected,chosenHash);
  await page.locator('.wiki-return-button').click();
  await page.waitForFunction(expected=>location.hash===expected,originalHash);
  assert.equal(await page.locator('#detailPanel').getAttribute('aria-modal'),'true');
  await rows.first().click();
  await page.waitForFunction(expected=>location.hash===expected,chosenHash);
  assert.equal(await page.locator('.wiki-page-nav').count(),0,
   'The old navigation bar should be absent');
  assert.equal(await page.locator('.wiki-page > .wiki-return-button').count(),1);
  assert.equal(await page.locator('.wiki-chapter-list').count(),0,
   'The chapter list is already visible; no duplicate navigation action');
  const sidebar=page.locator('.wiki-list');
  assert.equal(await page.locator('.wiki-list-top').isHidden(),true);
  await sidebar.evaluate(el=>{el.scrollTop=el.scrollHeight});
  const scrollFooter=page.locator('.wiki-list-top');
  await scrollFooter.waitFor({state:'visible'});
  assert.equal(await scrollFooter.evaluate(el=>getComputedStyle(el).position),'static',
   'Navigation must be in document flow, not float over the list entries');
  const listRect=await sidebar.boundingBox();
  const footerRect=await scrollFooter.boundingBox();
  assert.ok(listRect&&footerRect);
  assert.ok(footerRect.y>=listRect.y+listRect.height-1,
   'The footer must start below the independently scrollable list');
  assert.ok(footerRect.width>=listRect.width-3,
   'The footer should be integrated with the full width of the list panel');
  await scrollFooter.click();
  await page.waitForFunction(()=>document.querySelector('.wiki-list').scrollTop<=1);
  assert.equal(await page.locator('.wiki-list-top').isHidden(),true);
  assert.equal(await page.evaluate(()=>location.hash),chosenHash,
   'Scrolling the list must not discard the open article or browser history');
  // The chapter tab returns to the already-visible list while preserving
  // the same list history state used by earlier browser acceptance checks.
  await page.locator('.wiki-categories [data-wiki-chapter="item"]').click();
  await page.waitForFunction(()=>location.hash==='');
  assert.equal(await page.locator('.wiki-return-button').count(),0);
  assert.equal(await page.locator('#dockLocale').count(),0);
  assert.equal(await page.locator('#dockTabs').count(),0);
  assert.equal(await page.locator('#nav [data-tab="wiki"]').isHidden(),true,
   'Main navigation belongs only to the main editor, not the encyclopedia');
  await page.locator('#dockClose').click();
  assert.equal(await page.locator('#nav [data-tab="wiki"]').isVisible(),true);
  assert.equal(await page.locator('#nav [data-tab="wiki"].active').count(),0);
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-equipment-type').waitFor({state:'visible'});
  assert.equal(await page.locator('#locale [data-locale="en"]').getAttribute('aria-pressed'),'true');
  assert.equal(await picker.locator('option[value="ring"]').innerText(),'Rings');
  assert.equal((await rows.first().innerText()).trim(),firstEn);
  const wikiSearch=page.locator('.wiki-controls input[type="search"]');
  await wikiSearch.click();
  // Search the original RU name while the wiki is displaying official EN.
  // Combining RU+EN proves the cached search text contains both names.
  await wikiSearch.fill(firstRu+' '+firstEn);
  const crossLocale=page.locator('.wiki-list [data-wiki-record="1"]');
  await crossLocale.waitFor({state:'visible',timeout:20000});
  assert.equal((await crossLocale.innerText()).trim(),firstEn,
   'EN wiki must find the exact source item by its original Russian name');
  await wikiSearch.fill('Kris');
  await page.waitForFunction(()=>
   [...document.querySelectorAll('.wiki-list [data-wiki-record]')]
    .some(node=>node.textContent?.includes('Kris')),{timeout:20000});
  assert.equal(await rows.first().innerText(),'Kris',
   'English item name finds the true translated item');
  await wikiSearch.click();
  await wikiSearch.fill('');
  await picker.selectOption('ring');
  await rows.first().click();
  assert.match(await page.locator('.wiki-page').innerText(),/How to obtain/);
  await page.goto(base+'/#wiki/chest/51040',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-chest-unverified').waitFor({state:'visible'});
  assert.match(await page.locator('.wiki-chest-unverified').innerText(),
   /Reward category: Accessories[\s\S]*Contents are not listed/);
  // The separate locale test below expects the equipment chapter.
  await page.locator('.wiki-categories [data-wiki-chapter="item"]').click();
  await page.locator('.wiki-equipment-type').waitFor({state:'visible'});
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-equipment-type').waitFor({state:'visible'});
  assert.equal(await picker.locator('option[value="ring"]').innerText(),'Кольца');
  await picker.selectOption('equipment');
  assert.equal((await rows.first().innerText()).trim(),firstRu);
  await page.locator('.wiki-eligibility-filter').selectOption('now');
  await page.locator('.wiki-controls input[type="search"]').click();
  await page.locator('.wiki-controls input[type="search"]').fill('Корсет для мирины');
  await page.waitForFunction(()=>document.querySelectorAll('.wiki-list [data-wiki-record]').length===0);
  assert.equal(await page.locator('.wiki-list [data-wiki-record]').count(),0,
   'Race-locked Myrine corset must not be compatible with an elf');
  await page.locator('.wiki-eligibility-filter').selectOption('all');
  await page.locator('.wiki-list [data-wiki-record]').first().click();
  assert.match(await page.locator('.wiki-item-wearers').innerText(),/Мирина[\s\S]*Кролль/);
  await page.locator('.wiki-controls input[type="search"]').click();
  await page.locator('.wiki-controls input[type="search"]').fill('');
  // Original game-authored breaks separate lore, parameters and upgrades without inventing new blank paragraphs.
  await page.locator('.wiki-controls input[type="search"]').click();
  await page.locator('.wiki-controls input[type="search"]').fill('Алые астирские штаны');
  const redAstirPants=rows.filter({hasText:'Алые астирские штаны'}).first();
  await redAstirPants.waitFor({state:'visible',timeout:20000});
  await redAstirPants.click();
  const description=page.locator('.wiki-page .wiki-description');
  await description.waitFor({state:'visible'});
  assert.match(await description.textContent(),
   /Астира\.\n\nЛВК \+1, ОЗ \+30\nЗа каждые 2 единицы улучшения:\nАтака \+1%/);
  assert.equal(await description.evaluate(el=>getComputedStyle(el).whiteSpace),'pre-wrap');
  // A linked potion/material is not equipment, but still needs a visible record.
  await page.goto(base+'/#wiki/item/50011',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.wiki-list .wiki-link[aria-current="page"]'),
   null,{timeout:20000});
  assert.equal(await page.locator('.wiki-equipment-type').count(),0,
   'Unslotted material is accessible via source link without pretending it is equipment');
  assert.equal(await page.locator('.wiki-return-button').count(),1,
   'Direct links must provide safe return to their category');
  // Source-backed clickable chips navigate to the actual monster.
  await page.goto(base+'/#wiki/soul/101000',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-source-flow .wiki-source-primary').first()
   .waitFor({state:'visible',timeout:20000});
  assert.ok(await page.locator('.wiki-source-token').count()>=2);
  await page.locator('.wiki-source-flow .wiki-source-primary').first().click();
  await page.waitForFunction(()=>location.hash.startsWith('#wiki/monster/'));
  assert.match(await page.locator('.wiki-page h3').innerText(),/Крысолак|./);
  const monsterHash=await page.evaluate(()=>location.hash);
  await page.goBack();
  await page.waitForFunction(()=>location.hash==='#wiki/soul/101000');
  assert.match(await page.locator('.wiki-page').innerText(),/Душа|Soul/);
  await page.goForward();
  await page.waitForFunction(expected=>location.hash===expected,monsterHash);
  await page.locator('.wiki-return-button').click();
  await page.waitForFunction(()=>location.hash==='#wiki/soul/101000');
  // Skill requirements are static game thresholds, not values from an open build.
  await page.goto(base+'/#wiki/skill/100054001',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-requirement-chip').first().waitFor({state:'visible',timeout:20000});
  const requirement=await page.locator('.wiki-requirement-copy').innerText();
  assert.match(requirement,/Порог ветки: 26/);
  assert.doesNotMatch(requirement,/Вложено/);
  // Newly restored MELEE skills carry source-verified explanations in Wiki.
  await page.goto(base+'/#wiki/skill/100101001',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-skill-source-insight').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-skill-source-insight').innerText(),
   /Быстрый удар с параметрами точности/);
  assert.match(await page.locator('.wiki-requirement-copy').innerText(),
   /Ближний бой\s+Суммарное освоенное мастерство: 3/);
  // Three exceptional OS skills stay in the encyclopedia instead of
  // becoming fake current-character buffs or apparently learnable barriers.
  for(const id of [300001001,300002001]){
   await page.goto(base+'/#wiki/skill/'+id,{waitUntil:'domcontentloaded'});
   const notice=page.locator('.wiki-skill-access-notice');
   await notice.waitFor({state:'visible',timeout:20000});
   assert.match(await notice.innerText(),/Исцеление.*102/);
   assert.match(await notice.innerText(),/90/);
   assert.match(await notice.innerText(),/не подтверждены/);
  }
  await page.goto(base+'/#wiki/skill/260006002',{waitUntil:'domcontentloaded'});
  const duplicateNote=page.locator('.wiki-skill-access-notice');
  await duplicateNote.waitFor({state:'visible',timeout:20000});
  assert.match(await duplicateNote.innerText(),/нет профессий/);
  assert.match(await duplicateNote.innerText(),/Не следует прибавлять его второй раз/);
  await duplicateNote.locator('a[href*="/wiki/skill/260006001"], a[href*="#wiki/skill/260006001"]').click();
  await page.waitForFunction(()=>location.hash==='#wiki/skill/260006001');
  // The original party skill owns real class access; the variant does not.
  assert.equal(await page.locator('.wiki-skill-access-notice').count(),0);
  // Chest contents are shown as one visible list; original roll boundaries remain in the data.
  await page.goto(base+'/#wiki/chest/51003',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-chest-listed-100 .wiki-chest-reward').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-chest-listed-100 .wiki-chest-reward').count(),5,
   'Five separate 100% source rows are grouped only visually');
  assert.equal(await page.locator('.wiki-chest-group').count(),0,
   'Single 100%-listed rolls do not waste space as standalone sections');
  assert.match(await page.locator('.wiki-chest-collection-head').innerText(),/100%/);
  const nextChest=page.locator('.wiki-chest-reward-nested .wiki-link').first();
  assert.equal(await nextChest.count(),1,'The source chest chain is explicitly marked');
  await nextChest.click();
  await page.waitForFunction(()=>location.hash.startsWith('#wiki/chest/51004'));
  assert.ok(await page.locator('.wiki-chest-alternatives').count()>=1);
  assert.equal(await page.locator('.wiki-chest-alternatives .wiki-chest-reward').count(),7);
  const rollHeading=await page.locator('.wiki-chest-alternatives .wiki-chest-group-summary').innerText();
  assert.match(rollHeading,/Возможные награды/);
  assert.doesNotMatch(rollHeading,/группа [0-9]|Розыгрыш|таблице/);
  assert.equal(await page.locator('.wiki-chest-probability-note').count(),0);
  await page.locator('.wiki-return-button').click();
  await page.waitForFunction(()=>location.hash==='#wiki/chest/51003');
  assert.match(await page.locator('.wiki-level-reward').innerText(),/Уровень 5/);
  // Level-60 boxes exist even without an invented loot table.
  await page.goto(base+'/#wiki/chest/51010',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-level-reward').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-level-reward').innerText(),/Уровень 60/);
  assert.match(await page.locator('.wiki-page').innerText(),/Содержимое сундука не указано/);
  assert.equal(await page.locator('.wiki-chest-group').count(),0);
  // The same-category transition must render actual rewards of the next chest,
  // not the ordinary item record with no chest contents.
  await page.goto(base+'/#wiki/chest/51003',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-chest-listed-100 .wiki-chest-reward').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-chest-group-summary:visible').count(),0);
  await page.locator('.wiki-chest-reward-nested .wiki-link').first().click();
  await page.waitForFunction(()=>location.hash.startsWith('#wiki/chest/51004'));
  assert.match(await page.locator('.wiki-page h3').innerText(),/Шкатулка охотника/);
  assert.match(await page.locator('.wiki-level-reward').innerText(),/Уровень 10/);
  assert.equal(await page.locator('.wiki-chest-group').count(),1);
  assert.equal(await page.locator('.wiki-chest-alternatives .wiki-chest-reward').count(),7);
  // Location chests have real OS probabilities in the NPC chest dataset,
  // and must display them just like ordinary inventory boxes.
  await page.goto(base+'/#wiki/chest/52011',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page h3').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-page h3').innerText(),/Сундук из Мальдии/);
  await page.locator('.wiki-chest-reward').first().waitFor({state:'visible'});
  assert.ok(await page.locator('.wiki-chest-reward').count()>3);
  assert.ok(await page.locator('.wiki-chest-reward .wiki-reward-percent').count()>3);
  assert.equal(await page.locator('.wiki-chest-opening').count(),1);
  assert.ok(await page.locator('.wiki-chest-location .wiki-link').count()>=1);
  assert.match(await page.locator('.wiki-chest-opening').innerText(),/Кларис/);
  assert.doesNotMatch(await page.locator('.wiki-chest-opening').innerText(),/Культье/);
  assert.match(await page.locator('.wiki-chest-opening').innerText(),/Астир/);
  assert.ok(await page.locator('.wiki-chest-opening .wiki-link[href="#wiki/map/astir-kingdom"]').count()>=1);
  // Source has category labels for colored boxes, but no item or chance table.
  for(const [box,category] of [[51038,'Оружие и доспехи'],[51040,'Аксессуары'],[51042,'Души']]){
   await page.goto(base+'/#wiki/chest/'+box,{waitUntil:'domcontentloaded'});
   await page.locator('.wiki-chest-unverified').waitFor({state:'visible',timeout:20000});
   const notice=await page.locator('.wiki-chest-unverified').innerText();
   assert.match(notice,new RegExp(category));
   assert.match(notice,/Категория наград/);
   assert.match(notice,/Сведения о содержимом отсутствуют/);
   assert.doesNotMatch(notice,/доступной таблице|игрового сервера|No confirmed/);
   assert.equal(await page.locator('.wiki-chest-reward').count(),0);
  }
  // Country NPCs remain in country records, not in similarly named Astir districts.
  await page.goto(base+'/#wiki/map/1003001',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page h3').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-page h3').innerText(),/Королевство Сэнт-Фальстайн/);
  assert.match(await page.locator('.wiki-map-kind').innerText(),/Государство/);
  assert.ok(await page.locator('.wiki-map-npcs .wiki-map-npc').count()>=1,
   'Country NPCs now share native location cards instead of a one-off link flow');
  assert.ok(await page.locator('.wiki-page .wiki-link[href^="#wiki/npc/"]').count()>=1);
  for(const district of ['astir-union','astir-empire']){
   await page.goto(base+'/#wiki/map/'+district,{waitUntil:'domcontentloaded'});
   await page.locator('.wiki-page h3').waitFor({state:'visible',timeout:20000});
   assert.equal(await page.locator('.wiki-map-npc').count(),0);
   assert.doesNotMatch(await page.locator('.wiki-page').innerText(),/Подтверждённых сведений о NPC пока нет/);
  }
  await page.goto(base+'/#wiki/map/astir-kingdom',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-map-npcs .wiki-link').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-map-npc').count(),1);
  assert.match(await page.locator('.wiki-map-npc').innerText(),/Кларис/);
  assert.equal(await page.locator('.wiki-astir-neighborhoods .wiki-link').count(),4);
  assert.equal(await page.locator('.wiki-nation-territory').count(),0);
  await page.locator('.wiki-map-npc .wiki-link').click();
  await page.waitForFunction(()=>location.hash==='#wiki/npc/astir-npc-kingdom-claris');
  assert.match(await page.locator('.wiki-page h3').innerText(),/Кларис/);
  assert.match(await page.locator('.wiki-page .item-fields').innerText(),/Открытие сундуков/);
  assert.equal(await page.locator('.wiki-page .item-fields').innerText().then(s=>s.includes('K-11')),false);
  assert.ok(await page.locator('.wiki-page a[href="#wiki/map/astir-kingdom"]').count()>=1);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page h3').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-page h3').innerText(),/Кларис/);
  // Player-confirmed native English name must be used consistently in every
  // encyclopedia surface, including NPC profile, district roster and chests.
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.querySelector('#locale [data-locale="en"]')
    ?.getAttribute('aria-pressed')==='true'&&document.querySelector('#startupOverlay')?.hidden===true,
    null,{timeout:20000});
  await page.goto(base+'/#wiki/npc/astir-npc-kingdom-claris',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page h3').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-page h3').innerText(),'Claris');
  const enSearch=page.locator('.wiki-controls input[type="search"]');
  await enSearch.click();
  await enSearch.fill('Claris');
  await page.waitForFunction(()=>{
   const records=document.querySelectorAll('.wiki-list [data-wiki-record]');
   return records.length===1&&records[0].getAttribute('data-wiki-record')==='astir-npc-kingdom-claris';
  });
  assert.equal(await page.locator('.wiki-list [data-wiki-record="astir-npc-kingdom-claris"]').count(),1);
  await page.goto(base+'/#wiki/map/astir-kingdom',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-map-npc').first().waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-map-npc').innerText(),/Claris/);
  await page.goto(base+'/#wiki/chest/52011',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-chest-opening').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-chest-opening').innerText(),/Claris/);
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.querySelector('#locale [data-locale="ru"]')
    ?.getAttribute('aria-pressed')==='true'&&document.querySelector('#startupOverlay')?.hidden===true,
    null,{timeout:20000});
  await page.goto(base+'/#wiki/chest/52011',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-chest-opening').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-chest-opening').innerText(),/Кларис/);
  await page.goto(base+'/#wiki/chest/52011',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.wiki-chest-master-row').count(),1);
  assert.equal(await page.locator('.wiki-chest-master-row a[href="#wiki/map/astir-empire"]').count(),0);
  assert.equal(await page.locator('.wiki-chest-master-row a[href="#wiki/map/astir-kingdom"]').count(),1);
  assert.equal(await page.locator('.wiki-chest-master-row a[href="#wiki/npc/astir-npc-kingdom-claris"]').count(),1);
  // Source-backed elemental selection and separate status/skill consumables.
  await page.goto(base+'/#wiki/item/452',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.wiki-elemental-type').count(),0);
  await page.locator('.wiki-equipment-type').selectOption('elemental');
  await page.locator('.wiki-elemental-type').waitFor({state:'visible',timeout:20000});
  await page.locator('.wiki-elemental-type').selectOption('fire');
  assert.ok(await page.locator('.wiki-list .wiki-link')
   .filter({hasText:'Огненный меч пылающей души'}).count()>=1);
  await page.locator('.wiki-categories [data-wiki-chapter="utility"]').click();
  assert.equal(await page.locator('.wiki-equipment-type').count(),0);
  assert.equal(await page.locator('.wiki-effect-type').inputValue(),'all');
  assert.equal(await page.locator('.wiki-elemental-type').count(),0);
  await page.locator('.wiki-effect-type').selectOption('buff');
  assert.equal(await page.locator('.wiki-list .wiki-link').filter({hasText:'Снежный корень'}).count(),0);
  await page.locator('.wiki-effect-type').selectOption('cure');
  assert.ok(await page.locator('.wiki-list .wiki-link')
   .filter({hasText:'Снежный корень'}).count()>=1);
  assert.equal(await page.locator('.wiki-list .wiki-link')
   .filter({hasText:'Огненный меч пылающей души'}).count(),0);
  await page.goto(base+'/#wiki/soul/101000',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-soul-properties').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-soul-properties').evaluate(el=>
   getComputedStyle(el).display),'inline-grid');
  assert.ok(await page.locator('.wiki-soul-properties').evaluate(el=>
   el.getBoundingClientRect().width<el.closest('.wiki-page').getBoundingClientRect().width));
  // Conditional fire-gem effects come from verified per-weapon description,
  // not unconditional stat effects. The tooltip must explain STR vs INT.
  await page.goto(base+'/#wiki/item/452',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-conditional-term').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-conditional-bonuses').innerText(),/\+7/);
  assert.match(await page.locator('.wiki-conditional-bonuses').innerText(),/\+5%/);
  assert.match(await page.locator('.wiki-owner-effects').innerText(),/Сопротивляемость ожогам[\s\S]*\+5%/);
  assert.equal(await page.locator('.wiki-owner-effect-value').first().evaluate(el=>getComputedStyle(el).textAlign),'right');
  assert.equal(await page.locator('.wiki-conditional-term').first().getAttribute('title'),null);
  await page.locator('.wiki-conditional-term').hover();
  await page.locator('.wiki-phoenix-explanation').waitFor({state:'visible'});
  assert.match(await page.locator('.wiki-phoenix-explanation').innerText(),/25% от СИЛ/);
  await page.goto(base+'/#wiki/item/1862',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-conditional-term').waitFor({state:'visible',timeout:20000});
  await page.locator('.wiki-conditional-term').hover();
  await page.locator('.wiki-phoenix-explanation').waitFor({state:'visible'});
  assert.match(await page.locator('.wiki-phoenix-explanation').innerText(),/25% от ИНТ/);
  await page.goto(base+'/#wiki/item/1652',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-conditional-bonuses').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-conditional-term').count(),0);
  // Monsters and material exchange relationships occupy compact flow grids.
  await page.goto(base+'/#wiki/monster/21103',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-loot-chip').first().waitFor({state:'visible',timeout:20000});
  assert.ok(await page.locator('.wiki-loot-chip').count()>=1);
  assert.equal(await page.locator('.wiki-monster-resist').count(),9,
   'Monster resistances must be visible, not collapsed');
  const lootLink=page.locator('.wiki-loot-chip .wiki-link').first();
  await lootLink.hover();
  await page.locator('.stage-hover-preview.stage-item-tooltip').waitFor({state:'visible'});
  assert.ok((await page.locator('.stage-hover-preview.stage-item-tooltip').innerText()).length>5);
  await page.locator('.wiki-page h3').click();
  assert.equal(await page.locator('.stage-hover-preview.stage-item-tooltip').count(),0);
  // Quest instances have original English source text and a checked-in RU
  // translation, even when the D1 snapshot predates the translated field.
  await page.goto(base+'/#wiki/instance/20030040',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page .wiki-description').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-page .wiki-description').innerText(),/беглеца/);
  await page.goto(base+'/#wiki/item/1',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-recipe-use').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-recipe-use').count(),3);
  assert.ok(await page.locator('.wiki-recipe-npcs .wiki-link').count()>=1);
  // The server follows the same 8-character contract; the browser must not
  // impose the previous 15-character minimum.
  await page.locator('#dockClose').click();
  await page.locator('#profileTrigger').click();
  await page.locator('.account-tabs button').filter({hasText:'Регистрация'}).click();
  assert.equal(await page.locator('.account-form input[type="password"]').first()
   .getAttribute('minlength'),'8');
  assert.deepEqual(errors,[]);
  console.log('Chromium encyclopedia equipment RU/EN passed: source names, rings, and links');
 }finally{await context.close()}
}
