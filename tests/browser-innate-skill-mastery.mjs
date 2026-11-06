import assert from 'node:assert/strict';

// Browser contract backed by the bundled OS tables and the first-level
// ENKIDU Warrior screenshots supplied from the live game.
export async function runInnateSkillMasterySmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#catalogStatus')?.textContent?.includes('навыков')&&document.querySelector('#catalogStatus')?.textContent?.includes('предметов'),null,{timeout:25000});

  const skillSearch=page.locator('#pathSkillSearch');
  assert.equal(await skillSearch.getAttribute('autocomplete'),'off');
  assert.equal(await skillSearch.getAttribute('name'),'ps-hero-skill-filter');
  assert.equal(await skillSearch.evaluate(el=>el.readOnly),true);

  for(let i=0;i<6;i++)await page.locator('#raceGrid .race-slide-arrow.next').click();
  assert.match(await page.locator('#raceGrid .race-slide-frame img').getAttribute('alt'),/Энкиду/);
  await page.locator('#raceGrid .race-slide-select').click();
  await page.locator('[data-origin-tab="class"]').click();
  await page.locator('#classGrid .class-wizard-choice').first().click(); // Warrior path
  await page.locator('#classGrid .class-current-select').click(); // Warrior itself
  assert.match(await page.locator('#activeJob').innerText(),/Воин/);
  assert.equal(await page.locator('#levelOut').innerText(),'1');
  assert.equal(await page.locator('#pathAutoMastery').isChecked(),false,
   'A freshly created level-1 character must not already have max-trained green mastery');
  const budget=await page.locator('#budgetState').innerText();
  assert.match(budget,/0[\s\S]*Вложено/);
  await page.locator('[data-origin-tab="stats"]').click();
  const stats=await page.locator('#originStats .origin-stat-input').evaluateAll(rows=>
   rows.map(row=>Number(row.value)));
  assert.deepEqual(stats,[10,9,3,5,5,2]);
  assert.equal(await page.locator('#originHp').innerText(),'181');
  assert.equal(await page.locator('#originMp').innerText(),'42');

  // All five innate melee lines must match the screenshots, not only Slash.
  for(const [key,green,potential] of [
   ['slash',5,25],['thrust',2,25],['brush',5,25],
   ['blow',2,20],['defense',4,25]
  ]){
   const branch=page.locator('#skillBranches [data-path-branch="'+key+'"]');
   await branch.waitFor({state:'visible'});
   assert.equal((await branch.locator('.count').innerText()).replaceAll(' ',''),
    green+'/'+potential,'Wrong innate baseline '+key);
  }
  const slash=page.locator('#skillBranches [data-path-branch="slash"]');
  await slash.waitFor({state:'visible'});
  assert.equal((await slash.locator('.count').innerText()).replaceAll(' ',''),'5/25');
  if(await slash.getAttribute('aria-expanded')!=='true')await slash.click();
  const spent=page.locator('[data-branch-control="slash:potential-number"]');
  const green=page.locator('[data-branch-control="slash:mastery-number"]');
  assert.equal(await spent.inputValue(),'0');
  assert.equal(await green.inputValue(),'5');
  assert.equal(await green.getAttribute('min'),'5');
  assert.equal(await green.getAttribute('max'),'25');
  assert.match(await page.locator('.path-innate-baseline').first().innerText(),/Старт: 5/);
  await green.fill('6');await green.press('Tab');
  assert.equal(await green.inputValue(),'6');
  assert.equal(await spent.inputValue(),'0');
  assert.match(await page.locator('#budgetState').innerText(),/0[\s\S]*Вложено/);

  const tactics=page.locator('#skillBranches [data-path-group="tactics"]');
  await tactics.click();
  const archery=page.locator('#skillBranches [data-path-branch="archery"]');
  assert.equal((await archery.locator('.count').innerText()).replaceAll(' ',''),'1/5');
  assert.equal(await page.locator('#skillBranches [data-path-branch="alchemy"]')
   .evaluate(node=>node.classList.contains('disabled-branch')),true);

  // The live client's Special section contains grey unavailable Racial
  // mastery as well as Riding. Racial passives are chosen in Origin.
  for(const group of ['prayer','magic']){
   await page.locator('#skillBranches [data-path-group="'+group+'"]').click();
   assert.equal(await page.locator('#skillBranches .branch-row').count(),4,
    'All '+group+' branches must be present');
   assert.equal(await page.locator('#skillBranches .branch-row.disabled-branch').count(),4,
    'All '+group+' branches must be disabled for Warrior');
  }
  await page.locator('#skillBranches [data-path-group="special"]').click();
  const racial=page.locator('#skillBranches [data-path-branch="race"]');
  assert.equal(await racial.isDisabled(),true);
  assert.match(await racial.innerText(),/Расовые/);
  assert.equal(await page.locator('#skillBranches [data-path-branch="riding"]').isDisabled(),true);
  assert.equal(await page.locator('#skillBranches [data-path-branch="riding"]').evaluate(node=>node.classList.contains('disabled-branch')),true);
  await page.locator('#pathSkillsTab').click();
  await skillSearch.click();
  assert.equal(await skillSearch.evaluate(el=>el.readOnly),false);
  await skillSearch.fill('удар');
  assert.equal(await skillSearch.inputValue(),'удар');
  await skillSearch.press('Tab');
  assert.equal(await skillSearch.evaluate(el=>el.readOnly),true,
   'Search returns to non-credential readOnly state after editing');
  assert.deepEqual(errors,[]);
  console.log('Chromium innate mastery passed: Warrior Enkidu L1 5/2/5/2/4 + archery1, no spent points, manual green training, non-login search');
 }finally{await context.close()}
}
