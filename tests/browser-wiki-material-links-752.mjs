import assert from 'node:assert/strict';

// Real, read-only Wiki navigation: recipe ingredients, products and consumed
// items must link to exact source item IDs in both languages.
export async function runWikiMaterialLinks752Smoke(browser,base){
 const context=await browser.newContext({viewport:{width:1180,height:900}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const skill=async id=>{
  await page.goto(base+'/#wiki/skill/'+id,{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('.wiki-page .wiki-skill-source-insight').waitFor({
   state:'visible',timeout:30000});
 };
 try{
  await skill(220002001);
  const recipe=page.locator('.wiki-page .wiki-skill-source-recipe').first();
  const ids=['50022','65011','50056'];
  assert.deepEqual(await recipe.locator('a.wiki-link').evaluateAll(anchors=>
   anchors.map(a=>a.getAttribute('href'))),
  ids.map(id=>'#wiki/item/'+id),'Crafting inputs and result have their own item links');
  assert.match(await recipe.innerText(),/Рецепт: 1 ×.*\+ 1 ×.*→ 1 ×/);
  const links=recipe.locator('a.wiki-link');
  assert.ok((await links.first().boundingBox())?.width>15,
   'Material references remain visible and compact');
  await links.first().click();
  await page.waitForFunction(()=>location.hash.includes('#wiki/item/50022'));
  assert.match(await page.locator('.wiki-page h3').first().innerText(),/Ядовитый корень/);
  await page.goBack();
  await recipe.waitFor({state:'visible',timeout:20000});

  await skill(220004001);
  assert.deepEqual(await page.locator('.wiki-page .wiki-skill-source-recipe a.wiki-link')
   .evaluateAll(anchors=>anchors.map(a=>a.getAttribute('href'))),
  ['#wiki/item/50025','#wiki/item/50024',
   '#wiki/item/65011','#wiki/item/50061']);
  await skill(310003001);
  const holy=page.locator('.wiki-page .wiki-skill-source-material');
  assert.match(await holy.innerText(),/Для применения нужно: 3 × Святая вода/);
  assert.equal(await holy.locator('a.wiki-link').first().getAttribute('href'),
   '#wiki/item/50059');
  await holy.locator('a.wiki-link').click();
  await page.waitForFunction(()=>location.hash.includes('#wiki/item/50059'));
  await page.goBack();
  await holy.waitFor({state:'visible',timeout:20000});

  // Both real OS Toxify skill variants consume the same exact Venom item.
  await skill(220001001);
  const poison=page.locator('.wiki-page .wiki-skill-source-material');
  assert.match(await poison.innerText(),/Для применения нужно: 1 × Ядовитое зелье/);
  assert.equal(await poison.locator('a.wiki-link').getAttribute('href'),
   '#wiki/item/50056');
  assert.match(await page.locator('.wiki-page .wiki-skill-source-insight').innerText(),
   /эффект яда прекращается при смене оружия/);
  await poison.locator('a.wiki-link').click();
  await page.waitForFunction(()=>location.hash.includes('#wiki/item/50056'));
  await page.goBack();
  await poison.waitFor({state:'visible',timeout:20000});

  // Keep current Resurrection selection for the existing English checks.
  await skill(310003001);
  const close=page.locator('#dockClose');
  if(await close.isVisible())await close.click();
  await page.locator('#locale [data-locale="en"]').click();
  // The locale switch closes the dock: reopen the same Wiki article before
  // asserting visible content, matching a real user's navigation.
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-page .wiki-skill-source-material').waitFor({
   state:'visible',timeout:20000});
  const en=await page.locator('.wiki-page .wiki-skill-source-material').innerText();
  assert.match(en,/Requires: 3 ×/);
  assert.equal(await page.locator('.wiki-page .wiki-skill-source-material a.wiki-link')
   .getAttribute('href'),'#wiki/item/50059');
  await skill(220001003);
  const poisonEn=page.locator('.wiki-page .wiki-skill-source-material');
  assert.match(await poisonEn.innerText(),/Requires: 1 × Venom/);
  assert.equal(await poisonEn.locator('a.wiki-link').getAttribute('href'),
   '#wiki/item/50056');
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
}
