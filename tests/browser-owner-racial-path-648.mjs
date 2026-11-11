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
  assert.equal(writes.filter(x=>x.key==='guideedit.book.path.racial-branch').length,2);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.deepEqual(saved.points||{},{});
  assert.deepEqual(errors,[]);
  console.log('Chromium 0.648 Racial RU/EN D1, independent pencil, unchanged points passed');
 }finally{await context.close()}
}
