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
  // Exactly the same native compact selector as the effect-items chapter.
  // A past CSS flex:1 regression made the skill selector span the full row.
  const skillBox=await filter.boundingBox();
  const toolbarBox=await page.locator('.wiki-skill-toolbar').boundingBox();
  assert.ok(skillBox&&toolbarBox&&skillBox.width<toolbarBox.width-60,
   'Skill category selector must not stretch across the entire desktop row');
  assert.equal(await filter.evaluate(node=>getComputedStyle(node).flexGrow),'0');
  const skillAppearance=await filter.evaluate(node=>{
   const css=getComputedStyle(node);
   return [css.backgroundColor,css.borderTopColor,css.borderTopStyle,
    css.borderTopWidth,css.borderTopLeftRadius,css.paddingTop];
  });
  await page.locator('[data-wiki-chapter="utility"]').click();
  const effectSelector=page.locator('.wiki-effect-type');
  await effectSelector.waitFor({state:'visible'});
  const effectAppearance=await effectSelector.evaluate(node=>{
   const css=getComputedStyle(node);
   return [css.backgroundColor,css.borderTopColor,css.borderTopStyle,
    css.borderTopWidth,css.borderTopLeftRadius,css.paddingTop];
  });
  assert.deepEqual(skillAppearance,effectAppearance,
   'Skill and effect-item filters must share the approved native select styling');
  await page.locator('[data-wiki-chapter="skill"]').click();
  await filter.waitFor({state:'visible'});
  assert.equal(await filter.inputValue(),'player');
  await page.locator('[data-wiki-record="161202001"]').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-wiki-record="161202050"]').count(),0,
   'Extra Counterattack must not appear among playable character skills');
  assert.ok((await filter.locator('option[value="racial"]').innerText()).startsWith('Расовая пассивка'));
  assert.ok((await filter.locator('option[value="special"]').innerText()).startsWith('Особое'));
  assert.ok((await filter.locator('option[value="variants"]').innerText()).startsWith('Дубли навыков'));
  await filter.selectOption('racial');
  await page.locator('[data-wiki-record="900050003"]').waitFor({state:'visible'});
  assert.match(await filter.locator('option[value="racial"]').innerText(),/18$/);
  assert.equal(await page.locator('.wiki-list [data-wiki-record]').count(),18);
  assert.deepEqual(await page.locator('.wiki-list .wiki-location-list-heading').allTextContents(),
   ['Человек','Эльф','Цверг','Мирина','Энкиду','Кролль'],
   'Group the six races with the already approved compact section headings');
  for(const id of ['500000001','500000002','500000025'])
   assert.equal(await page.locator('[data-wiki-record="'+id+'"]').count(),0,
    'System effect must not be a racial passive: '+id);
  await page.locator('[data-wiki-record="900050003"]').click();
  assert.ok(page.url().includes('#wiki/skill/900050003'));
  assert.ok(await page.locator('.wiki-page .item-fields').getByText('Раса',{exact:true}).count()>0);
  assert.ok(await page.locator('.wiki-page .item-fields').getByText('Энкиду',{exact:true}).count()>0);
  assert.equal(await filter.inputValue(),'racial');
  await filter.selectOption('variants');
  await page.locator('[data-wiki-record="161202050"]').waitFor({state:'visible'});
  await filter.selectOption('guild');
  await page.locator('[data-wiki-record="600000231"]').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-wiki-record="600000232"]').count(),1,
   'Different guild ranks remain distinct, even when they share artwork');
  assert.ok((await filter.locator('option[value="unknown"]').innerText())
   .startsWith('Неуточнённые'),
   'Review filter should use a neutral label without declaring skills inactive');
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
  assert.ok((await filter.locator('option[value="unknown"]').innerText())
   .startsWith('Unresolved'),'English review label should be neutral');
  assert.ok((await filter.locator('option[value="racial"]').innerText()).startsWith('Racial passive'));
  assert.ok((await filter.locator('option[value="special"]').innerText()).startsWith('Special'));
  assert.ok((await filter.locator('option[value="variants"]').innerText()).startsWith('Duplicate skills'));
  await filter.selectOption('racial');
  assert.deepEqual(await page.locator('.wiki-list .wiki-location-list-heading').allTextContents(),
   ['Human','Elf','Dwarf','Myrine','Enkidu','Lapin']);
  // Exercise two successive queries in an unchanged EN view. The cached
  // translated-name resolver must not lock the first query's results.
  const search=page.locator('.wiki-controls input[type="search"]');
  // The approved anti-password-autofill guard makes this readOnly until an
  // actual pointer/focus gesture, as in normal player interaction.
  await search.click();
  await search.fill('Гармония');
  await page.waitForFunction(()=>
   document.querySelectorAll('.wiki-list [data-wiki-record]').length===1&&
   !!document.querySelector('.wiki-list [data-wiki-record="900020001"]'));
  await search.fill('Бойцовский');
  await page.waitForFunction(()=>
   document.querySelectorAll('.wiki-list [data-wiki-record]').length===1&&
   !!document.querySelector('.wiki-list [data-wiki-record="900010001"]'));
  await search.fill('');
  await page.waitForFunction(()=>
   document.querySelectorAll('.wiki-list [data-wiki-record]').length===18);
  await page.locator('[data-wiki-record="900020001"]').click();
  assert.ok(await page.locator('.wiki-page .item-fields').getByText('Race',{exact:true}).count()>0);
  assert.ok(await page.locator('.wiki-page .item-fields').getByText('Elf',{exact:true}).count()>0);
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

export async function runWikiIconManifestFallbackSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1120,height:820}});
 await context.route('**/*',route=>{
  const url=route.request().url();
  if(url===base+'/assets/os-icon-manifest.json')return route.abort();
  return url.startsWith(base+'/')?route.continue():route.abort();
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // The first visible list may still be the pre-catalog placeholder.
  // Wait for the actual offline archive before choosing its filter.
  await page.waitForFunction(()=>
   /\d+ навыков · \d+ предметов · \d+ душ/.test(
    document.querySelector('#catalogStatus')?.textContent||''),
   null,{timeout:30000});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="skill"]').click();
  const filter=page.locator('.wiki-skill-type');
  await filter.waitFor({state:'visible',timeout:20000});
  await filter.selectOption('unknown');
  // The selector label and rendered rows must refer to the SAME completed
  // icon-manifest fallback, not the short static option shown during loading.
  await page.waitForFunction(()=>{
   const select=document.querySelector('.wiki-skill-type');
   const label=select?.querySelector('option[value="unknown"]')?.textContent||'';
   return select?.value==='unknown'&&/569$/.test(label)&&
    document.querySelectorAll('.wiki-list [data-wiki-record]').length>0;
  },null,{timeout:20000});
  assert.match(await filter.locator('option[value="unknown"]').innerText(),/569$/,
   'With unavailable manifest all 569 archive skills render with question-mark art');
  assert.equal(await page.locator('.wiki-list [data-wiki-record]').first()
   .locator('img[src*="skill_unknown.webp"]').count(),1,
   'Visible rows must agree with question-mark selection');
  assert.deepEqual(errors,[]);
  console.log('Chromium icon manifest outage passed: truthful question-mark filter and no page errors');
 }finally{await context.close()}
}
