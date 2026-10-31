import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base='http://127.0.0.1:4173';
const errors=[];
let browser;
async function main(){
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 // Test the bundled OS snapshot, not remote Cloudflare or third-party services.
 await context.route('**/*',route=>{
  if(route.request().url().startsWith(base+'/'))return route.continue();
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});
 const failedRequests=[];
 page.on('requestfailed',request=>{
  if(request.url().startsWith(base+'/'))failedRequests.push(request.url());
 });
 try{
  await page.waitForFunction(()=>
   document.querySelector('#raceGrid')?.children.length>0 &&
   document.querySelector('#hero')?.getAttribute('src'),
   null,{timeout:20000});
 }catch(error){
  const state=await page.evaluate(()=>({
   ready:document.readyState,
   raceCount:document.querySelector('#raceGrid')?.children.length,
   branchCount:document.querySelector('#skillBranches')?.children.length,
   catalog:document.querySelector('#catalogStatus')?.textContent,
   notice:document.querySelector('#siteNotice')?.textContent,
   headline:document.body?.innerText?.slice(0,300)
  }));
  throw Error('Editor bootstrap failed: '+JSON.stringify({state,errors,failedRequests})+'; '+error.message);
 }
 assert.equal(await page.locator('#levelOut').textContent(),'1');
 assert.equal(await page.locator('#level').getAttribute('max'),'55');
 assert.equal(await page.locator('#stageAttributes').isHidden(),true);

 // The portrait itself opens the book; chapter navigation supports the keyboard.
 await page.locator('#hero').click();
 await page.locator('#stageAttributes').waitFor({state:'visible'});
 assert.equal(await page.locator('#stageAttributes [data-book-page]').count(),6);
 await page.locator('#stageAttributes [data-book-page="attack"]').click();
 assert.equal(await page.locator('#stageBookPanel').getAttribute('data-book-visible'),'attack');
 await page.locator('#stageAttributes [data-book-page="attack"]').press('ArrowRight');
 assert.equal(await page.locator('#stageBookPanel').getAttribute('data-book-visible'),'defense');
 await page.locator('#stageAttributes .stage-book-close').click();
 assert.equal(await page.locator('#stageAttributes').isHidden(),true);

 // The planner is future-ready for all 55 levels, independent of live server 45.
 await page.locator('[data-origin-tab="stats"]').click();
 await page.locator('#level').evaluate(el=>{
  el.value='55';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal(await page.locator('#levelOut').textContent(),'55');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='55',
  null,{timeout:30000});
 assert.equal(await page.locator('#level').inputValue(),'55');

 // Creating a new build must ask about the unsaved level-55 character.
 await page.locator('#newBuildQuick').click();
 await page.locator('.new-build-choice').waitFor({state:'visible'});
 await page.getByRole('button',{name:'Создать без сохранения'}).click();
 assert.equal(await page.locator('#levelOut').textContent(),'1');
 assert.equal(await page.locator('#level').inputValue(),'1');
 assert.deepEqual(errors,[],'Unexpected browser JavaScript exceptions');
 console.log('Chromium smoke passed: hero book, keyboard, level 1–55 and unsaved build');
 await context.close();
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{await browser?.close()});
