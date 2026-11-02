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
  await wikiSearch.fill('Kris');
  await page.waitForFunction(()=>
   [...document.querySelectorAll('.wiki-list [data-wiki-record]')]
    .some(node=>node.textContent?.includes('Kris')),{timeout:20000});
  assert.equal(await rows.first().innerText(),'Kris',
   'English item name finds the true translated item');
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
  await page.locator('.wiki-controls input[type="search"]').fill('Корсет для мирины');
  assert.equal(await page.locator('.wiki-list [data-wiki-record]').count(),0,
   'Race-locked Myrine corset must not be compatible with an elf');
  await page.locator('.wiki-eligibility-filter').selectOption('all');
  await page.locator('.wiki-list [data-wiki-record]').first().click();
  assert.match(await page.locator('.wiki-item-wearers').innerText(),/Мирина[\s\S]*Кролль/);
  await page.locator('.wiki-controls input[type="search"]').fill('');
  // The reference tooltip in the game separates lore, parameters and upgrade conditions.
  await page.locator('.wiki-controls input[type="search"]').fill('Алые астирские штаны');
  await rows.first().click();
  const description=page.locator('.wiki-page .wiki-description');
  await description.waitFor({state:'visible'});
  assert.match(await description.textContent(),
   /Астира\.\n\nЛВК \+1, ОЗ \+30\n\nЗа каждые 2 единицы улучшения:\nАтака \+1%/);
  assert.equal(await description.evaluate(el=>getComputedStyle(el).whiteSpace),'pre-wrap');
  // A linked potion/material is not equipment, but still needs a visible record.
  await page.goto(base+'/#wiki/item/50011',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-equipment-type').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('.wiki-equipment-type')?.value==='all'&&
   document.querySelector('.wiki-list .wiki-link[aria-current="page"]'),
   null,{timeout:20000});
  assert.equal(await page.locator('.wiki-equipment-type').inputValue(),'all');
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
  // Group rows are compact and independently expandable.
  await page.goto(base+'/#wiki/chest/51003',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-chest-group').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-chest-group').count(),5);
  await page.locator('.wiki-chest-group').nth(1).locator('summary').click();
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
  await page.locator('.wiki-chest-group').nth(4).locator('summary').click();
  await page.locator('.wiki-chest-group').nth(4).locator('.wiki-chest-reward .wiki-link').first().click();
  await page.waitForFunction(()=>location.hash.startsWith('#wiki/chest/51004'));
  assert.match(await page.locator('.wiki-page h3').innerText(),/Шкатулка охотника/);
  assert.match(await page.locator('.wiki-level-reward').innerText(),/Уровень 10/);
  assert.equal(await page.locator('.wiki-chest-group').count(),5);
  // Item catalog separately includes location loot chests whose opening
  // chances are not part of this source snapshot.
  await page.goto(base+'/#wiki/chest/52011',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page h3').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-page h3').innerText(),/Сундук из Мальдии/);
  assert.match(await page.locator('.wiki-page').innerText(),/Состав наград пока не указан/);
  assert.ok(await page.locator('.wiki-chest-location .wiki-link').count()>=1);
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
