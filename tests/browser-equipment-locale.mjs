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
  assert.equal(await page.locator('.wiki-list [data-wiki-record]').count(),0,
   'Race-locked Myrine corset must not be compatible with an elf');
  await page.locator('.wiki-eligibility-filter').selectOption('all');
  await page.locator('.wiki-list [data-wiki-record]').first().click();
  assert.match(await page.locator('.wiki-item-wearers').innerText(),/Мирина[\s\S]*Кролль/);
  await page.locator('.wiki-controls input[type="search"]').click();
  await page.locator('.wiki-controls input[type="search"]').fill('');
  // The reference tooltip in the game separates lore, parameters and upgrade conditions.
  await page.locator('.wiki-controls input[type="search"]').click();
  await page.locator('.wiki-controls input[type="search"]').fill('Алые астирские штаны');
  await rows.first().click();
  const description=page.locator('.wiki-page .wiki-description');
  await description.waitFor({state:'visible'});
  assert.match(await description.textContent(),
   /Астира\.\n\nЛВК \+1, ОЗ \+30\n\nЗа каждые 2 единицы улучшения:\nАтака \+1%/);
  assert.equal(await description.evaluate(el=>getComputedStyle(el).whiteSpace),'pre-wrap');
  // A linked potion/material is not equipment, but still needs a visible record.
  await page.goto(base+'/#wiki/item/50011',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.wiki-list .wiki-link[aria-current="page"]'),
   null,{timeout:20000});
  assert.equal(await page.locator('.wiki-equipment-type').count(),0,
   'Unslotted material is accessible via source link without pretending it is equipment');
  // Source-backed clickable chips navigate to the actual monster.
  await page.goto(base+'/#wiki/soul/101000',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-source-flow .wiki-source-primary').first()
   .waitFor({state:'visible',timeout:20000});
  assert.ok(await page.locator('.wiki-source-token').count()>=2);
  await page.locator('.wiki-source-flow .wiki-source-primary').first().click();
  await page.waitForFunction(()=>location.hash.startsWith('#wiki/monster/'));
  assert.match(await page.locator('.wiki-page h3').innerText(),/Крысолак|./);
  // Skill requirements show current investment without pretending the
  // entire ability is unlocked by one branch threshold.
  await page.goto(base+'/#wiki/skill/100054001',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-requirement-chip').first().waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-requirement-copy').innerText(),/Вложено/);
  // Chest contents are shown as one visible list; original roll boundaries remain in the data.
  await page.goto(base+'/#wiki/chest/51003',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-chest-group').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-chest-group').count(),5);
  assert.equal(await page.locator('.wiki-chest-group-summary:visible').count(),0);
  assert.equal(await page.locator('.wiki-chest-group').nth(1).getAttribute('open'),'');
  assert.match(await page.locator('.wiki-level-reward').innerText(),/Уровень 5/);
  // Level-60 boxes exist even without an invented loot table.
  await page.goto(base+'/#wiki/chest/51010',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-level-reward').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-level-reward').innerText(),/Уровень 60/);
  assert.match(await page.locator('.wiki-page').innerText(),/Состав наград пока не указан/);
  assert.equal(await page.locator('.wiki-chest-group').count(),0);
  // The same-category transition must render actual rewards of the next chest,
  // not the ordinary item record with no chest contents.
  await page.goto(base+'/#wiki/chest/51003',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-chest-group').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-chest-group-summary:visible').count(),0);
  await page.locator('.wiki-chest-group').nth(4).locator('.wiki-chest-reward .wiki-link').first().click();
  await page.waitForFunction(()=>location.hash.startsWith('#wiki/chest/51004'));
  assert.match(await page.locator('.wiki-page h3').innerText(),/Шкатулка охотника/);
  assert.match(await page.locator('.wiki-level-reward').innerText(),/Уровень 10/);
  assert.equal(await page.locator('.wiki-chest-group').count(),5);
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
   assert.match(await page.locator('.wiki-chest-unverified').innerText(),new RegExp(category));
   assert.equal(await page.locator('.wiki-chest-reward').count(),0);
  }
  // Country NPCs remain in country records, not in similarly named Astir districts.
  await page.goto(base+'/#wiki/map/1003001',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page h3').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-page h3').innerText(),/Королевство Сэнт-Фальстайн/);
  assert.match(await page.locator('.wiki-map-kind').innerText(),/Государство/);
  assert.equal(await page.locator('.wiki-map-npcs').count(),0);
  assert.ok(await page.locator('.wiki-page .wiki-link[href^="#wiki/npc/"]').count()>=1);
  for(const district of ['astir-union','astir-empire']){
   await page.goto(base+'/#wiki/map/'+district,{waitUntil:'domcontentloaded'});
   await page.locator('.wiki-page h3').waitFor({state:'visible',timeout:20000});
   assert.equal(await page.locator('.wiki-map-npc').count(),0);
   assert.match(await page.locator('.wiki-page').innerText(),/Подтверждённых сведений о NPC пока нет/);
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
  await page.goto(base+'/#wiki/npc/astir-npc-kingdom-claris',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page h3').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-page h3').innerText(),'Claris');
  const enSearch=page.locator('.wiki-controls input[type="search"]');
  await enSearch.fill('Claris');
  assert.equal(await page.locator('.wiki-list [data-wiki-record="astir-npc-kingdom-claris"]').count(),1);
  await page.goto(base+'/#wiki/map/astir-kingdom',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-map-npc').first().waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-map-npc').innerText(),/Claris/);
  await page.goto(base+'/#wiki/chest/52011',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-chest-opening').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-chest-opening').innerText(),/Claris/);
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
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
