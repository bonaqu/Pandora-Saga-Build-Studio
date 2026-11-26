import assert from 'node:assert/strict';
// Real isolated browser checks. No credentials or Cloudflare writes.
export async function runWikiChapterNavigation815Smoke(browser,base){
 for(const width of [390,1366]){
  const context=await browser.newContext({viewport:{width,height:840}});
  await context.route('**/*',route=>
   route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
   await page.locator('#nav [data-tab="wiki"]').click();
   const chapters=page.locator('.wiki-controls>.wiki-categories [data-wiki-chapter]');
   await chapters.first().waitFor({state:'visible',timeout:30000});
   assert.equal(await chapters.count(),10);
   const first=page.locator('.wiki-open-first');
   await first.waitFor({state:'visible'});
   if(width===390){
    const strip=await page.locator('.wiki-controls>.wiki-categories').evaluate(node=>{
     const box=node.getBoundingClientRect();
     return {height:box.height,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,
      group:node.getAttribute('role'),label:node.getAttribute('aria-label')};
    });
    assert.equal(strip.group,'group');
    assert.ok(strip.label);
    assert.ok(strip.height<=76,'Chapter navigation must fit in one row: '+strip.height);
    assert.ok(strip.scrollWidth>strip.clientWidth+10,'Chapter row should scroll');
    await page.locator('[data-wiki-chapter="soul"]').click();
    await page.waitForFunction(()=>{
     const c=document.querySelector('.wiki-controls>.wiki-categories');
     const b=c?.querySelector('[data-wiki-chapter="soul"]');
     if(!c||!b)return false;
     const x=c.getBoundingClientRect(),y=b.getBoundingClientRect();
     return b.getAttribute('aria-pressed')==='true' &&
      y.left>=x.left-2&&y.right<=x.right+2;
    },null,{timeout:10000});
    await page.locator('.wiki-open-first').waitFor({state:'visible'});
   }
   await first.click();
   await page.locator('.wiki-page h3').waitFor({state:'visible'});
   assert.match(new URL(page.url()).hash,/^#wiki\/(?:item|soul)\//);
   assert.deepEqual(errors,[],'Unexpected '+width+'px browser exceptions');
  }finally{await context.close()}
 }
 console.log('Chromium #815 chapter UX: mobile single-row navigation and quick article');
}
