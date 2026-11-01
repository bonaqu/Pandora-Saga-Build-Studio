import assert from 'node:assert/strict';

export async function runLegacySkillCapSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:850}});
 await context.addInitScript(()=>{
  if(sessionStorage.getItem('ps-legacy-skill-seeded'))return;
  sessionStorage.setItem('ps-legacy-skill-seeded','1');
  // Saved as a Warrior, then selected Cleric: old investment in Slash survives
  // despite Cleric having a strict zero Slash mastery cap.
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:16,level:45,points:{slash:12},masteryAuto:true
  }));
 });
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='45'&&
   document.querySelector('#catalogStatus')?.textContent?.includes('предметов'),
   null,{timeout:20000});
  await page.locator('[data-path-group="melee"]').click();
  const branch=page.locator('[data-path-branch="slash"]');
  assert.equal((await branch.locator('.count').innerText()).replace(/\s+/g,' '),'12 / 0');
  await branch.click();
  const exact=page.locator('[data-branch-control="slash:potential-number"]');
  await exact.waitFor({state:'visible'});
  assert.equal(await exact.inputValue(),'12');
  assert.equal(await page.locator('[data-branch-control="slash:potential-range"]').inputValue(),'12');
  assert.match(await page.locator('.inline-branch-editor .budget-excess').innerText(),
   /12 очков сверх текущего лимита 0/);
  await exact.fill('8');await exact.press('Tab');
  assert.equal(await page.locator('[data-path-branch="slash"] .count').innerText(),'8 / 0');
  assert.equal(await page.locator('[data-branch-control="slash:potential-number"]').inputValue(),'8');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='45',
   null,{timeout:20000});
  // The current category may reopen automatically from session navigation.
  if(await page.locator('[data-path-branch="slash"]').count()===0)
   await page.locator('[data-path-group="melee"]').click();
  assert.equal((await page.locator('[data-path-branch="slash"] .count').innerText()).replace(/\s+/g,' '),'8 / 0');
  assert.deepEqual(errors,[]);
  console.log('Chromium saved zero-class-cap skill smoke passed: 12/0, refund to 8/0, reload and no erased draft');
 }finally{await context.close()}
}
