import assert from 'node:assert/strict';

// Isolated owner CAS smoke; no real accounts or Cloudflare D1 mutation.
export async function runProfileCaption390Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const token='a'.repeat(43),values={},writes=[],errors=[];
 const context=await browser.newContext({viewport:{width:1200,height:840}});
 await context.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:2,level:45,name:'Profile smoke hero',
   stats:{},points:{},mastery:{},
   profile:{guild:'Player data QA',nation:'',rank:'',about:'Biography draft'}
  }));
  sessionStorage.setItem('ps-studio-navigation.v2',
   JSON.stringify({tab:'character',open:true}));
 });
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const send=(value,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(value)
  });
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/overrides')return send({values:{...values}});
  if(path==='/api/admin/login')return send({token,expires:Date.now()+600000});
  if(path==='/api/admin/catalog/test-write')return send({
   ok:true,readback:true,cleaned:true,overrideReadback:true,
   overrideCleaned:true,activeCatalogUnchanged:true
  });
  if(path==='/api/admin/override'){
   assert.equal(req.headers().authorization,'Bearer '+token);
   const data=req.postDataJSON();
   assert.match(data.key,/^guideedit\.book\.profile\./);
   assert.equal(data.expectedValue,Object.hasOwn(values,data.key)?values[data.key]:null);
   values[data.key]=data.value;writes.push(data);
   return send({ok:true,key:data.key,value:data.value,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  const panel=page.locator('#detailContent');
  const tabs=panel.locator('.ps-character-tabs');
  await tabs.waitFor({state:'visible',timeout:15000});
  assert.equal((await tabs.locator('[data-profile-copy-key="tab-character"]').textContent()).trim(),
   'Персонаж');
  assert.equal(await tabs.locator('.origin-copy-editable').count(),0);
  await tabs.locator('button').nth(1).click();
  await panel.locator('#ps-profile-field-name').waitFor({state:'visible'});
  assert.equal(await panel.locator('#ps-profile-field-name').inputValue(),'Profile smoke hero');
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:15000});
  const profileCaption=panel.locator('[data-profile-copy-key="tab-profile"]');
  await profileCaption.waitFor({state:'visible'});
  assert.equal(await panel.locator('.ps-profile-copy-pencil').count(),0);
  await profileCaption.dblclick();
  const input=profileCaption.locator('[data-owner-text-field]');
  await input.waitFor({state:'visible'});
  await input.fill('Мой профиль QA');
  await input.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-copy-key="tab-profile"]')?.textContent==='Мой профиль QA',
   null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.profile.tab-profile']).ru,'Мой профиль QA');
  const tabButton=panel.locator('.ps-character-tabs button[aria-selected="true"]');
  await tabButton.focus();await tabButton.press('F2');
  const cancelled=profileCaption.locator('[data-owner-text-field]');
  await cancelled.waitFor({state:'visible'});
  await cancelled.fill('Не сохранять');
  await cancelled.press('Escape');
  assert.equal(writes.length,1);
  await tabs.locator('button').first().click();
  await panel.locator('.ps-overview-actions').waitFor({state:'visible',timeout:12000});
  const action=panel.locator('[data-profile-copy-key="action-edit-profile"]');
  await action.dblclick();
  const actionInput=action.locator('[data-owner-text-field]');
  await actionInput.waitFor({state:'visible'});
  await actionInput.fill('Открыть профиль QA');
  await actionInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-copy-key="action-edit-profile"]')?.textContent==='Открыть профиль QA',
   null,{timeout:15000});
  assert.equal(JSON.parse(values['guideedit.book.profile.action-edit-profile']).ru,
   'Открыть профиль QA');
  assert.equal(await panel.locator('.ps-overview-actions').isVisible(),true,
   'Double click must not navigate');
  await panel.locator('.ps-overview-actions button').last().click();
  await panel.locator('#ps-profile-field-name').waitFor({state:'visible',timeout:12000});
  assert.equal(await panel.locator('#ps-profile-field-guild').inputValue(),'Player data QA');
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  const english=panel.locator('[data-profile-copy-key="tab-profile"]');
  assert.equal((await english.textContent()).trim(),'Profile');
  await english.dblclick();
  const enInput=english.locator('[data-owner-text-field]');
  await enInput.waitFor({state:'visible'});
  await enInput.fill('My profile QA');
  await enInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#detailContent [data-profile-copy-key="tab-profile"]')?.textContent==='My profile QA',
   null,{timeout:15000});
  assert.deepEqual(JSON.parse(values['guideedit.book.profile.tab-profile']),
   {ru:'Мой профиль QA',en:'My profile QA'});
  assert.deepEqual(errors,[]);
  console.log('Chromium #390: profile tabs and actions, direct copy, F2/Esc, RU/EN owner CAS and hero-data safety passed');
 }finally{await context.close()}
}
