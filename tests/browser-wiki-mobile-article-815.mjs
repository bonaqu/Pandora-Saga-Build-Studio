import assert from 'node:assert/strict';

// Real mobile Chromium: a tapped record should reveal the article below the
// lengthy category list. Browser Back still restores the chapter list.
export async function runWikiMobileArticleRevealSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="chest"]').click();
  const row=page.locator('[data-wiki-record="51013"]');
  await row.waitFor({state:'visible',timeout:25000});
  await row.click();
  const article=page.locator('#detailContent .wiki-page');
  const back=article.locator('button.wiki-return-button');
  await back.waitFor({state:'visible',timeout:25000});
  await page.waitForFunction(()=>{
   const article=document.querySelector('#detailContent .wiki-layout .wiki-page');
   if(!article)return false;
   const bounds=article.getBoundingClientRect();
   return bounds.top<Math.min(innerHeight*.6,500)&&bounds.bottom>70;
  },null,{timeout:15000});
  assert.ok((await article.locator('h3').first().innerText()).length>2);
  await back.click();
  await page.waitForFunction(()=>!location.hash);
  assert.equal(await page.locator('#detailContent .wiki-page .wiki-return-button').count(),0);
  assert.deepEqual(errors,[]);
  console.log('Chromium 390px wiki: selected article auto-revealed, chapter Back preserved');
 }finally{await context.close()}
}
