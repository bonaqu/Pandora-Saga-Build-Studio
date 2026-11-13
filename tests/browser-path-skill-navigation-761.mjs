import assert from 'node:assert/strict';
export async function runPathSkillNavigation761Smoke(browser,base){
 const context=await browser.newContext({viewport:{width:1280,height:850}});
 await context.addInitScript(()=>{
  if(sessionStorage.getItem('ps-761-seeded'))return;
  sessionStorage.setItem('ps-761-seeded','1');
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:2,level:45,points:{slash:73},masteryAuto:true
  }));
 });
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#pathSkillsTab').click();
  const gallery=page.locator('#pathSkillGallery');
  const details=page.locator('#pathSkillDetails');
  const query=page.locator('#pathSkillSearch');
  await query.click();await query.fill('Двойной удар');
  await gallery.locator('[data-skill-id="110101001"]').waitFor();
  await gallery.locator('[data-skill-id="110101001"]').click();
  assert.match(await details.locator('h3').innerText(),/Двойной удар/);
  const upgrade=details.locator('[data-related-skill-id="110101002"]');
  assert.equal(await upgrade.count(),1);
  assert.match(await upgrade.innerText(),/Следующее/);
  await upgrade.click();
  assert.equal(await query.inputValue(),'');
  assert.equal(await page.locator('#pathSkillStatus').inputValue(),'all');
  assert.match(await details.locator('h3').innerText(),/Порез/);
  assert.equal(await gallery.locator('[data-skill-id="110101002"]').getAttribute('aria-current'),'true');
  assert.ok(await gallery.locator('.path-skill-card').count()<=24);
  assert.equal(await gallery.locator('.path-skill-card').first().getAttribute('data-skill-id'),'110101002');
  const back=details.locator('[data-related-skill-id="110101001"]');
  assert.equal(await back.count(),1);
  assert.match(await back.getAttribute('aria-label'),/Предыдущее/);
  assert.match(await back.innerText(),/Двойной удар/);
  await back.click();
  assert.match(await details.locator('h3').innerText(),/Двойной удар/);
  await page.locator('[data-locale="en"]').click();
  await query.click();await query.fill('Slice');
  await gallery.locator('[data-skill-id="110101001"]').waitFor();
  await gallery.locator('[data-skill-id="110101001"]').click();
  assert.match(await details.locator('h3').innerText(),/Slice/);
  const nextEn=details.locator('[data-related-skill-id="110101002"]');
  assert.match(await nextEn.getAttribute('aria-label'),/Next/);
  await nextEn.click();
  assert.equal(await query.inputValue(),'');
  assert.match(await details.locator('h3').innerText(),/Dice/);
  assert.equal(await gallery.locator('[data-skill-id="110101002"]').getAttribute('aria-current'),'true');
  assert.match(await details.locator('[data-related-skill-id="110101001"]').getAttribute('aria-label'),/Previous/);
  // Browse filtered results independently of the prerequisite/upgrade chain.
  const listNav=details.locator('.path-skill-list-nav');
  assert.equal(await listNav.count(),1);
  assert.match(await listNav.locator('.path-skill-list-position').innerText(),/^\d+ \/ \d+$/);
  const nextInList=listNav.locator('[data-skill-list-direction="next"]');
  const previousInList=listNav.locator('[data-skill-list-direction="previous"]');
  const move=await nextInList.isEnabled()?nextInList:previousInList;
  assert.equal(await move.isEnabled(),true);
  assert.match(await move.getAttribute('aria-label'),/(Next|Previous) in list:/);
  const oldTitle=await details.locator('h3').innerText();
  await move.click();
  assert.notEqual(await details.locator('h3').innerText(),oldTitle);
  assert.equal(await query.inputValue(),'');
  const pinned=await gallery.locator('.path-skill-card').first().getAttribute('data-skill-id');
  const active=await gallery.locator('.path-skill-card[aria-current="true"]').getAttribute('data-skill-id');
  assert.equal(pinned,active);
  assert.ok(await gallery.locator('.path-skill-card').count()<=24);
  await query.click();
  await query.fill('not-a-game-skill-766');
  await details.waitFor({state:'hidden'});
  assert.equal(await details.locator('.path-skill-list-nav').count(),0);
  assert.deepEqual(errors,[]);
  console.log('Chromium 761: RU/EN lineage links, selection, filters and 24-card limit');
 }finally{await context.close()}
}
