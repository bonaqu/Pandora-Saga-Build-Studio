import assert from 'node:assert/strict';

export async function runOwnerRacialPath648Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const values={},writes=[],errors=[];
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:7,level:45,points:{},mastery:{}
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
 const openSpecial=async()=>{
  const expand=page.locator('.right [data-path-group="special"]');
  await expand.waitFor({state:'visible'});
  if(await expand.getAttribute('aria-expanded')!=='true')await expand.click();
  await page.locator('.right .path-racial-owner-row').waitFor({state:'visible'});
 };
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
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
  await page.locator('#ownerDock [data-owner-collapse]').click();
  await openSpecial();
  const racial=page.locator('.right .path-racial-owner-row');
  assert.equal(await racial.locator('button.path-racial-unavailable').isDisabled(),true);
  assert.equal(await racial.locator('button.path-racial-pencil').count(),1);
  assert.equal(await racial.locator('button.path-racial-unavailable button').count(),0);
  await racial.locator('button.path-racial-pencil').click();
  const edit=racial.locator('strong [data-owner-text-field]');
  await edit.waitFor({state:'visible'});
  await edit.fill('Расовые умения QA');
  await edit.press('Tab');
  console.log('Racial 648: RU submitted');
  await page.waitForFunction(()=>document.querySelector(
   '.right .path-racial-owner-row strong')?.textContent==='Расовые умения QA',
   null,{timeout:12000});
  assert.deepEqual(JSON.parse(values['guideedit.book.path.racial-branch']),
   {ru:'Расовые умения QA'});
  const group=page.locator('.right .game-tree-head-row').filter({
   has:page.locator('[data-path-group="special"]')});
  await group.locator('button.path-group-pencil').click();
  const groupEdit=group.locator('.game-tree-head strong [data-owner-text-field]');
  await groupEdit.waitFor({state:'visible'});
  await groupEdit.fill('Особое QA');
  await groupEdit.press('Tab');
  console.log('Racial 648: group title submitted');
  await page.waitForFunction(()=>document.querySelector(
   '.right [data-path-group="special"] strong')?.textContent==='Особое QA',
   null,{timeout:12000});
  assert.match(await group.locator('button.path-group-pencil').getAttribute('aria-label'),/Особое QA/);
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await openSpecial();
  const en=page.locator('.right .path-racial-owner-row');
  assert.equal((await en.locator('strong').innerText()).trim(),'Racial');
  await en.locator('button.path-racial-pencil').click();
  const enEditor=en.locator('strong [data-owner-text-field]');
  await enEditor.fill('Race traits QA');await enEditor.press('Tab');
  console.log('Racial 648: EN submitted');
  await page.waitForFunction(()=>document.querySelector(
   '.right .path-racial-owner-row strong')?.textContent==='Race traits QA',
   null,{timeout:12000});
  assert.deepEqual(JSON.parse(values['guideedit.book.path.racial-branch']),
   {ru:'Расовые умения QA',en:'Race traits QA'});
  assert.equal(await en.locator('button.path-racial-unavailable').isDisabled(),true);
  // New D1 caption: never edit or persist the computed number of skills.
  await page.locator('#pathSkillsTab').click();
  const more=page.locator('#pathSkillGallery .path-more-owner-row');
  await more.waitFor({state:'visible',timeout:15000});
  const before=Number((await more.locator('.path-more-count').innerText()).match(/[0-9]+/)?.[0]);
  assert.ok(before>24,'Fixture must have at least 49 eligible skills');
  await more.locator('button.path-more-pencil').click();
  const moreEditor=more.locator('.path-more-copy [data-owner-text-field]');
  await moreEditor.waitFor({state:'visible'});
  await moreEditor.fill('More skills QA');await moreEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#pathSkillGallery .path-more-copy')?.textContent==='More skills QA',
   null,{timeout:12000});
  assert.deepEqual(JSON.parse(values['guideedit.book.path.skill-show-more']),
   {en:'More skills QA'});
  assert.match(await more.locator('button.path-more-pencil').getAttribute('aria-label'),
   /More skills QA/);
  assert.equal(Number((await more.locator('.path-more-count').innerText()).match(/[0-9]+/)?.[0]),before);
  await more.locator('button.path-show-more').click();
  const after=Number((await page.locator('#pathSkillGallery .path-more-count')
   .innerText()).match(/[0-9]+/)?.[0]);
  assert.equal(after,before-24);
  console.log('Chromium 0.649 Show more EN D1 caption and dynamic skill count passed');
  // Pick a known SCOUT skill with an actual previous-skill requirement.
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
  assert.equal((await prereq.locator('.path-owner-copy-text').innerText()).trim(),
   'Previous skill');
  await prereq.locator('.path-owner-pencil').click();
  const prereqEdit=prereq.locator('[data-owner-text-field]');
  await prereqEdit.waitFor({state:'visible'});
  await prereqEdit.fill('Prerequisite QA');await prereqEdit.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#pathSkillDetails .path-skill-previous-label .path-owner-copy-text')
   ?.textContent==='Prerequisite QA',null,{timeout:12000});
  assert.deepEqual(JSON.parse(values['guideedit.book.path.skill-previous-label']),
   {en:'Prerequisite QA'});
  assert.equal(await prereq.locator('.path-skill-previous-value').innerText(),requiredName,
   'D1 text changes must not rename the required source skill');
  console.log('Chromium 0.650 bilingual prerequisite caption and game-data separation passed');
  assert.equal(writes.filter(x=>x.key==='guideedit.book.path.racial-branch').length,2);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.ok(Object.values(saved.points||{}).every(value=>Number(value)===0),
   'Editing RU/EN site text must not allocate any character skill points');
  assert.deepEqual(errors,[]);
  console.log('Chromium 0.648 Racial RU/EN D1, independent pencil, unchanged points passed');
 }finally{await context.close()}
}
