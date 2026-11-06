import assert from 'node:assert/strict';

export async function runWikiSkillFiltersSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="skill"]').click();
  const filter=page.locator('.wiki-skill-type');
  await filter.waitFor({state:'visible',timeout:20000});
  assert.equal(await filter.inputValue(),'player');
  await page.locator('[data-wiki-record="161202001"]').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-wiki-record="161202050"]').count(),0,
   'Extra Counterattack must not appear among playable character skills');
  await filter.selectOption('variants');
  await page.locator('[data-wiki-record="161202050"]').waitFor({state:'visible'});
  await filter.selectOption('guild');
  await page.locator('[data-wiki-record="600000231"]').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-wiki-record="600000232"]').count(),1,
   'Different guild ranks remain distinct, even when they share artwork');
  await filter.selectOption('unknown');
  await page.locator('[data-wiki-record="500000001"]').waitFor({state:'visible'});
  const sleep=page.locator('[data-wiki-record="500000001"]');
  assert.ok(await sleep.locator('img[src*="skill_unknown.webp"]').count()>0,
   'Unknown artwork has the game-client question-mark icon');
  await filter.selectOption('all');
  await page.locator('[data-wiki-record="161202050"]').waitFor({state:'visible'});
  await page.locator('[data-wiki-record="161202050"]').click();
  assert.ok(page.url().includes('#wiki/skill/161202050'),
   'All-records view must open the original variant ID, not a guessed replacement');
  assert.match(await page.locator('.wiki-page .wiki-description').innerText(),/Чучело \(контратака\)/,
   'Linked source variant must show its own description instead of the playable record');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page .wiki-description').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('.wiki-page .wiki-description').innerText(),/Чучело \(контратака\)/,
   'A direct variant URL must retain source identity after reloading the catalog');
  assert.equal(await filter.inputValue(),'all',
   'The selected encyclopedia skill filter should survive a reload');
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="skill"]').click();
  await filter.waitFor({state:'visible'});
  assert.equal(await filter.locator('option[value="player"]').innerText()
   .then(text=>text.startsWith('Character skills')),true);
  await page.setViewportSize({width:390,height:780});
  assert.ok((await filter.boundingBox())?.width>80,'Mobile filter remains usable');
  const overflow=await page.evaluate(()=>
   Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-
    document.documentElement.clientWidth);
  assert.ok(overflow<=15,'Skill filter overflows viewport: '+overflow);
  assert.deepEqual(errors,[]);
  console.log('Chromium skill filters passed: playable, variants, guild ranks, unknown, links, RU/EN and mobile');
 }finally{await context.close()}
}
