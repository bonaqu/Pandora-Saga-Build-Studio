import assert from 'node:assert/strict';

export async function runOwnerRacialPath648Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const values={},writes=[],errors=[];
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:2,level:45,points:{},mastery:{}
  }));
 });
 await context.route('**/*',route=>{
  const request=route.request(),url=request.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Authorization,Content-Type',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  const json=(data,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(data)});
  if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
  const path=new URL(url).pathname;
  if(path==='/api/overrides')return json({values});
  if(path==='/api/admin/login')return json({token:'a'.repeat(43),expires:Date.now()+600000});
  if(path==='/api/admin/catalog/test-write')return json({ok:true,readback:true,cleaned:true,
   overrideReadback:true,overrideCleaned:true,activeCatalogUnchanged:true});
  if(path==='/api/admin/override'){
   const data=request.postDataJSON();
   assert.equal(request.headers().authorization,'Bearer '+'a'.repeat(43));
   assert.equal(data.expectedValue,Object.hasOwn(values,data.key)?values[data.key]:null);
   writes.push(data);
   values[data.key]=data.value;
   return json({ok:true,key:data.key,value:data.value,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 // Inline copy changes the visible label optimistically before its D1-style
 // mock request resolves. Verify persistence AFTER the write, not just the DOM.
 const savedOverride=async(key,expected)=>{
  for(let attempt=0;attempt<120;attempt++){
   const value=values[key];
   if(typeof value==='string'){
    try{if(JSON.stringify(JSON.parse(value))===JSON.stringify(expected))return}
    catch{}
   }
   await page.waitForTimeout(50);
  }
  assert.deepEqual(JSON.parse(values[key]),expected,
   'Edited text did not persist in the mocked D1 override');
 };
 const openEditableTrack=async()=>{
  // The rail legend is rendered only inside an OPEN branch. A selected
  // chapter alone is insufficient: search source-enabled branches without
  // changing invested points or mastery.
  const groups=page.locator('.right .game-tree-group');
  const total=await groups.count();
  for(let i=0;i<total;i++){
   const group=groups.nth(i),head=group.locator('.game-tree-head').first();
   if(await head.getAttribute('aria-expanded')!=='true'){
    await head.click({position:{x:4,y:4}});
    await page.waitForFunction(index=>{
     const button=document.querySelectorAll('.right .game-tree-head')[index];
     return button?.getAttribute('aria-expanded')==='true';
    },i,{timeout:12000});
   }
   const branch=group.locator('.branch-row[data-path-branch]:not([disabled])').first();
   if(!await branch.count())continue;
   if(await branch.getAttribute('aria-expanded')!=='true')
    await branch.click();
   await page.locator('#pathGrowthPage .path-limit-copy').first()
    .waitFor({state:'visible',timeout:12000});
   return;
  }
  throw Error('No editable class branch to exercise a live point-cap caption');
 };
 const openSpecial=async()=>{
  const expand=page.locator('.right [data-path-group="special"]');
  await expand.waitFor({state:'visible'});
  if(await expand.getAttribute('aria-expanded')!=='true')await expand.click();
  await page.locator('.right .path-racial-owner-row').waitFor({state:'visible'});
 };
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // Wait until the mandatory D1 modal actually releases native inert.
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('.right [data-path-group="special"]')&&
   document.querySelector('#catalogStatus')?.textContent?.includes('предметов'),
   null,{timeout:25000});
  // A normal visitor cannot edit the disabled race branch.
  const playerRace=page.locator('.right [data-path-group="special"]');
  await playerRace.click();
  assert.equal(await page.locator('.right .path-racial-pencil').count(),0);
  const ordinary=page.locator('.right .path-racial-unavailable');
  assert.equal(await ordinary.isDisabled(),true);
  assert.equal((await ordinary.locator('strong').innerText()).trim(),'Расовые');
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  // The dock may start collapsed; an unconditional toggle would expand it
  // across the Origin passives and intercept the double-click. Keep the
  // real UI collapsed while exercising the visible text editor.
  const dockToggle=page.locator('#ownerDock [data-owner-collapse]');
  if(await dockToggle.getAttribute('aria-expanded')==='true')
   await dockToggle.click();
  // The passive remains selectable, but its caption edits directly without
  // a pencil. Escape must preserve the selected passive and avoid D1 writes.
  const passive=page.locator('#originPassives .origin-passive').first();
  await passive.waitFor({state:'visible'});
  assert.equal(await page.locator('#originPassives .owner-race-passive-edit').count(),0);
  const passiveLabel=passive.locator('b[data-edit-key^="skill.race."]');
  assert.equal(await passiveLabel.count(),1);
  const selectedPassive=await passive.getAttribute('aria-pressed');
  await passiveLabel.dblclick();
  const passiveEditor=passiveLabel.locator('[data-owner-text-field]');
  await passiveEditor.waitFor({state:'visible'});
  await passiveEditor.fill('Не сохраняем пассивку QA');
  await passiveEditor.press('Escape');
  assert.equal(await passive.getAttribute('aria-pressed'),selectedPassive,
   'Editing a racial skill name must not select a passive');
  assert.equal(writes.length,0,'Escape must not write a D1 skill name');
  // Source-backed caps are not authorial copy. Edit the visible caption
  // directly while keeping the cap number and the growth state untouched.
  await openEditableTrack();
  const capLabel=page.locator('#pathGrowthPage .path-limit-copy').first();
  await capLabel.waitFor({state:'visible',timeout:15000});
  const capNumber=page.locator('#pathGrowthPage .path-limit-number').first();
  const originalCap=await capNumber.textContent();
  assert.ok(/^\s*[0-9]+$/.test(originalCap),'The fixture needs a real numeric branch cap');
  await capLabel.dblclick();
  const capInput=capLabel.locator('[data-owner-text-field]');
  await capInput.waitFor({state:'visible'});
  await capInput.fill('Лимит ветки:');
  await capInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#pathGrowthPage .path-limit-copy')
   ?.textContent==='Лимит ветки:',null,{timeout:12000});
  await savedOverride('guideedit.book.path.path-limit-points',
   {ru:'Лимит ветки:'});
  assert.equal(await page.locator('#pathGrowthPage .path-limit-number').first().textContent(),
   originalCap,'Editing the author label must not overwrite branch point caps');
  await openSpecial();
  // Author edits a hint through the ONE compact owner panel. The disabled
  // Racial branch and current hero remain mounted; no per-card pencil.
  const pathHelp=page.locator('#ownerPathHelpCopy');
  await pathHelp.locator('summary').click();
  const racialHelp=pathHelp.locator('.studio-owner-interface-row').filter({hasText:'Расовая ветка'});
  assert.equal(await racialHelp.locator('.studio-owner-interface-pencil').count(),0);
  await racialHelp.locator('.studio-owner-interface-value').dblclick();
  const helpEdit=racialHelp.locator('[data-owner-text-field]');
  await helpEdit.waitFor({state:'visible'});
  await helpEdit.fill('Расовую ветку нельзя прокачать QA');
  await helpEdit.press('Tab');
  await savedOverride('guideedit.book.path.racial-unavailable-aria',
   {ru:'Расовую ветку нельзя прокачать QA'});
  await page.waitForFunction(()=>document.querySelector('.right button.path-racial-unavailable')
   ?.getAttribute('aria-label')==='Расовую ветку нельзя прокачать QA',
   null,{timeout:12000});
  const racial=page.locator('.right .path-racial-owner-row');
  assert.equal(await racial.locator('button.path-racial-unavailable').isDisabled(),true);
  assert.equal(await racial.locator('button.path-racial-pencil').count(),0,
   'Racial caption does not need a rename pencil');
  assert.equal(await racial.locator('button.path-racial-unavailable button').count(),0);
  await racial.locator('strong').dblclick();
  const edit=racial.locator('strong [data-owner-text-field]');
  await edit.waitFor({state:'visible'});
  await edit.fill('Расовые умения QA');
  await edit.press('Tab');
  console.log('Racial 648: RU submitted');
  await page.waitForFunction(()=>document.querySelector(
   '.right .path-racial-owner-row strong')?.textContent==='Расовые умения QA',
   null,{timeout:12000});
  await savedOverride('guideedit.book.path.racial-branch',
   {ru:'Расовые умения QA'});
  const group=page.locator('.right .game-tree-head-row').filter({
   has:page.locator('[data-path-group="special"]')});
  assert.equal(await group.locator('button.path-group-pencil').count(),0);
  await group.locator('.game-tree-head strong').dblclick();
  const groupEdit=group.locator('.game-tree-head strong [data-owner-text-field]');
  await groupEdit.waitFor({state:'visible'});
  await groupEdit.fill('Особое QA');
  await groupEdit.press('Tab');
  console.log('Racial 648: group title submitted');
  await page.waitForFunction(()=>document.querySelector(
   '.right [data-path-group="special"] strong')?.textContent==='Особое QA',
   null,{timeout:12000});
  assert.equal(await group.locator('button.path-group-pencil').count(),0);
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await openSpecial();
  const pathEnHelp=page.locator('#ownerPathHelpCopy');
  // Locale changes preserve the expanded owner panel; clicking Summary
  // unconditionally would collapse an already-open panel.
  if(!await pathEnHelp.evaluate(el=>el.open))
   await pathEnHelp.locator('summary').click();
  assert.equal(await pathEnHelp.evaluate(el=>el.open),true);
  const enRacialHelp=pathEnHelp.locator('.studio-owner-interface-row').filter({hasText:'Racial branch'});
  assert.equal(await enRacialHelp.locator('.studio-owner-interface-pencil').count(),0);
  await enRacialHelp.locator('.studio-owner-interface-value').dblclick();
  const enHelpEdit=enRacialHelp.locator('[data-owner-text-field]');
  await enHelpEdit.waitFor({state:'visible'});
  await enHelpEdit.fill('Racial mastery cannot be allocated QA');
  await enHelpEdit.press('Tab');
  await savedOverride('guideedit.book.path.racial-unavailable-aria',
   {ru:'Расовую ветку нельзя прокачать QA',en:'Racial mastery cannot be allocated QA'});
  await page.waitForFunction(()=>document.querySelector('.right button.path-racial-unavailable')
   ?.getAttribute('aria-label')==='Racial mastery cannot be allocated QA',
   null,{timeout:12000});
  const en=page.locator('.right .path-racial-owner-row');
  assert.equal((await en.locator('strong').innerText()).trim(),'Racial');
  await en.locator('strong').dblclick();
  const enEditor=en.locator('strong [data-owner-text-field]');
  await enEditor.fill('Race traits QA');await enEditor.press('Tab');
  console.log('Racial 648: EN submitted');
  await page.waitForFunction(()=>document.querySelector(
   '.right .path-racial-owner-row strong')?.textContent==='Race traits QA',
   null,{timeout:12000});
  await savedOverride('guideedit.book.path.racial-branch',
   {ru:'Расовые умения QA',en:'Race traits QA'});
  assert.equal(await en.locator('button.path-racial-unavailable').isDisabled(),true);
  // Locale switching must preserve the Russian copy while exposing an
  // independently editable English caption, not the numeric branch cap.
  await openEditableTrack();
  const capEn=page.locator('#pathGrowthPage .path-limit-copy').first();
  await capEn.waitFor({state:'visible',timeout:15000});
  assert.equal(await capEn.textContent(),'Limit (pts):');
  const enCapNumber=await page.locator('#pathGrowthPage .path-limit-number').first()
   .textContent();
  await capEn.dblclick();
  const capEnInput=capEn.locator('[data-owner-text-field]');
  await capEnInput.waitFor({state:'visible'});
  await capEnInput.fill('Branch ceiling:');
  await capEnInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector('#pathGrowthPage .path-limit-copy')
   ?.textContent==='Branch ceiling:',null,{timeout:12000});
  await savedOverride('guideedit.book.path.path-limit-points',
   {ru:'Лимит ветки:',en:'Branch ceiling:'});
  assert.equal(await page.locator('#pathGrowthPage .path-limit-number').first()
   .textContent(),enCapNumber);
  // Shared group metric captions can now be edited where the owner sees
  // them, while all three numbers and the group disclosure remain intact.
  const groupCount=page.locator('#pathGrowthPage .path-group-summary').first();
  await groupCount.waitFor({state:'visible',timeout:12000});
  const groupValuesBefore=await groupCount.locator('.path-group-summary-value').allTextContents();
  const groupButton=groupCount.locator('xpath=..');
  const expandedBefore=await groupButton.getAttribute('aria-expanded');
  const groupMetric=groupCount.locator('.path-group-summary-copy').first();
  assert.equal(await groupMetric.innerText(),'trained');
  await groupMetric.dblclick();
  const groupMetricEditor=groupMetric.locator('[data-owner-text-field]');
  await groupMetricEditor.waitFor({state:'visible'});
  await groupMetricEditor.fill('mastered QA');
  await groupMetricEditor.press('Tab');
  await savedOverride('guideedit.book.path.path-group-trained',{en:'mastered QA'});
  assert.equal(await groupMetric.innerText(),'mastered QA');
  assert.deepEqual(await groupCount.locator('.path-group-summary-value').allTextContents(),
   groupValuesBefore,'Editing a shared metric cannot overwrite game totals');
  assert.equal(await groupButton.getAttribute('aria-expanded'),expandedBefore);

  // The expandable rail keeps its live skill count outside the owner D1
  // editor. Double-clicking the author caption must not toggle the summary.
  const unlock=page.locator('#pathGrowthPage .path-unlock-details summary').first();
  await unlock.waitFor({state:'visible',timeout:15000});
  const countBefore=await unlock.locator('.path-unlock-count').innerText();
  const openBefore=await unlock.evaluate(el=>el.parentElement.open);
  const railCaption=unlock.locator('.path-unlock-heading');
  assert.equal(await railCaption.innerText(),'Skills on track');
  await railCaption.dblclick();
  const railEditor=railCaption.locator('[data-owner-text-field]');
  await railEditor.waitFor({state:'visible'});
  await railEditor.fill('Skills on this rail QA');
  await railEditor.press('Tab');
  await savedOverride('guideedit.book.path.skills-on-track-caption',
   {en:'Skills on this rail QA'});
  assert.equal(await railCaption.innerText(),'Skills on this rail QA');
  assert.equal(await unlock.locator('.path-unlock-count').innerText(),countBefore);
  assert.equal(await unlock.evaluate(el=>el.parentElement.open),openBefore,
   'Renaming a summary caption must not toggle the skills disclosure');
  assert.equal(await unlock.locator('button.path-owner-pencil').count(),0);

  // Every skill milestone keeps its threshold and target skill ID outside
  // the RU/EN author caption, even when edited on a real clickable row.
  const unlockDetails=unlock.locator('xpath=..');
  if(!await unlockDetails.evaluate(el=>el.open))
   await unlock.locator('.path-unlock-count').click();
  const milestone=unlockDetails.locator('button.path-unlock-skill').first();
  await milestone.waitFor({state:'visible',timeout:12000});
  const skillIdBefore=await milestone.locator('xpath=.').getAttribute('type');
  const thresholdBefore=await milestone.locator('.path-unlock-status span').first().innerText();
  const unit=milestone.locator('.path-unlock-unit');
  assert.equal(await unit.innerText(),'pts');
  await unit.dblclick();
  const unitEditor=unit.locator('[data-owner-text-field]');
  await unitEditor.waitFor({state:'visible'});
  await unitEditor.fill('milestone pts QA');
  await unitEditor.press('Tab');
  await savedOverride('guideedit.book.path.path-unlock-points',
   {en:'milestone pts QA'});
  assert.equal(await unit.innerText(),'milestone pts QA');
  assert.equal(await milestone.locator('.path-unlock-status span').first().innerText(),
   thresholdBefore);
  assert.equal(await milestone.getAttribute('type'),skillIdBefore);
  assert.match(await milestone.getAttribute('aria-label'),/milestone pts QA/,
   'The same D1 key refreshes the accessible action label after inline save');
  assert.equal(await page.locator('#pathGrowthPage').isVisible(),true,
   'Double-clicking a milestone caption must not navigate to skill details');

  // New D1 caption: never edit or persist the computed number of skills.
  await page.locator('#pathSkillsTab').click();
  const more=page.locator('#pathSkillGallery button.path-show-more');
  await more.waitFor({state:'visible',timeout:15000});
  const before=Number((await more.locator('.path-more-count').innerText()).match(/[0-9]+/)?.[0]);
  assert.ok(before>0,'Fixture must have more than the initial 24 future-learnable skills');
  assert.equal(await page.locator('#pathSkillGallery .path-more-pencil').count(),0);
  await more.locator('.path-more-copy').dblclick();
  const moreEditor=more.locator('.path-more-copy [data-owner-text-field]');
  await moreEditor.waitFor({state:'visible'});
  await moreEditor.fill('More skills QA');await moreEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#pathSkillGallery .path-more-copy')?.textContent==='More skills QA',
   null,{timeout:12000});
  await savedOverride('guideedit.book.path.skill-show-more',
   {en:'More skills QA'});
  assert.equal(await page.locator('#pathSkillGallery .path-more-pencil').count(),0);
  assert.equal(Number((await more.locator('.path-more-count').innerText()).match(/[0-9]+/)?.[0]),before);
  // The number is not the owner-editable caption: one click loads skills.
  await more.locator('.path-more-count').click();
  const remaining=page.locator('#pathSkillGallery .path-more-count');
  const after=await remaining.count()?
   Number((await remaining.innerText()).match(/[0-9]+/)?.[0]):0;
  assert.equal(after,Math.max(0,before-24),
   'Show more count reflects only skills this class can eventually learn');
  console.log('Chromium 0.649 Show more EN D1 caption and dynamic skill count passed');
  // Pick a JUGGERNAUT-compatible skill with a real predecessor requirement.
  // Search by source ID is test-only; game IDs are not displayed to players.
  // The real search starts read-only to block password-manager injection.
  // A user's focus/click unlocks it; programmatic fill must follow that gesture.
  const search=page.locator('#pathSkillSearch');
  await search.click();
  assert.equal(await search.isEditable(),true);
  await search.fill('110101002');
  const skillCard=page.locator('#pathSkillGallery [data-skill-id="110101002"]');
  await skillCard.waitFor({state:'visible',timeout:12000});
  await skillCard.click();
  const prereq=page.locator('#pathSkillDetails .path-skill-previous-row');
  await prereq.waitFor({state:'visible',timeout:12000});
  const requiredName=await prereq.locator('.path-skill-previous-value').innerText();
  assert.ok(requiredName.trim(),'The source prerequisite name must remain visible');
  assert.equal((await prereq.locator('.path-skill-previous-label').innerText()).trim(),
   'Previous skill');
  assert.equal(await prereq.locator('.path-owner-pencil').count(),0);
  await prereq.locator('.path-skill-previous-label').dblclick();
  const prereqEdit=prereq.locator('[data-owner-text-field]');
  await prereqEdit.waitFor({state:'visible'});
  await prereqEdit.fill('Prerequisite QA');await prereqEdit.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#pathSkillDetails .path-skill-previous-label')
   ?.textContent==='Prerequisite QA',null,{timeout:12000});
  await savedOverride('guideedit.book.path.skill-previous-label',
   {en:'Prerequisite QA'});
  assert.equal(await prereq.locator('.path-skill-previous-value').innerText(),requiredName,
   'D1 text changes must not rename the required source skill');
  console.log('Chromium 0.650 bilingual prerequisite caption and game-data separation passed');
  assert.equal(writes.filter(x=>x.key==='guideedit.book.path.racial-branch').length,2);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.ok(Object.values(saved.points||{}).every(value=>Number(value)===0),
   'Editing RU/EN site text must not allocate any character skill points');
  assert.deepEqual(errors,[]);
  console.log('Chromium 0.648 Racial RU/EN D1, direct caption editing, unchanged points passed');
 }finally{await context.close()}
}
