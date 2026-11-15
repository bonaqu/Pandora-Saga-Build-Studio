import assert from 'node:assert/strict';

// Browser Back must restore the last viewed article, not a reset chapter.
export async function runWikiReturn799Smoke(browser,base){
 const context=await browser.newContext({viewport:{width:1250,height:850}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/#wiki/item/50056',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  const article=page.locator('#detailContent .wiki-page');
  const back=article.locator('button.wiki-return-button');
  await back.waitFor({state:'visible',timeout:30000});
  assert.match(await article.locator('h3').first().innerText(),/Ядовитое зелье/);
  const browse=page.locator('#detailContent .wiki-list');
  await browse.waitFor({state:'visible'});
  const before=await browse.evaluate(node=>{
   node.scrollTop=430;
   return node.scrollTop;
  });
  assert.ok(before>50,'List must be long enough to test scroll restoration');
  await back.click();
  await page.waitForFunction(()=>!location.hash);
  assert.equal(await page.locator('#detailContent .wiki-page .wiki-return-button').count(),0,
   'Chapter list is shown after Back in a direct-linked article');
  await page.goBack();
  await page.waitForFunction(()=>location.hash==='#wiki/item/50056');
  await back.waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(expected=>{
   const node=document.querySelector('#detailContent .wiki-list');
   return !!node&&Math.abs(node.scrollTop-expected)<=3;
  },before,{timeout:12000});
  assert.match(await article.locator('h3').first().innerText(),/Ядовитое зелье/);
  await page.goForward();
  await page.waitForFunction(()=>!location.hash);
  await page.goBack();
  await back.waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(expected=>
   Math.abs((document.querySelector('#detailContent .wiki-list')?.scrollTop||0)-expected)<=3,
   before,{timeout:12000});
  assert.deepEqual(errors,[]);
  console.log('Chromium wiki Back 799: article/list scroll survives Back/Forward');
 }finally{await context.close()}
}
