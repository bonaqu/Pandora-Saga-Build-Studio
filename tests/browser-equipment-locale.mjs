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
  await page.locator('#dockClose').click();
  assert.equal(await page.locator('#nav [data-tab="wiki"].active').count(),0);
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-equipment-type').waitFor({state:'visible'});
  assert.equal(await page.locator('#locale [data-locale="en"]').getAttribute('aria-pressed'),'true');
  assert.equal(await picker.locator('option[value="ring"]').innerText(),'Rings');
  assert.equal((await rows.first().innerText()).trim(),firstEn);
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
  assert.deepEqual(errors,[]);
  console.log('Chromium encyclopedia equipment RU/EN passed: source names, rings, and links');
 }finally{await context.close()}
}
