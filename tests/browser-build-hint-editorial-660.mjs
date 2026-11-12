import assert from 'node:assert/strict';

// Real owner copy controls with a mocked D1 Worker, not production data.
// Check that edits change the active tooltip without mutating a saved build.
export async function runOwnerBuildHints660Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const playerToken='t'.repeat(43),ownerToken='a'.repeat(43),name='QA preserved hero';
 const record={id:'b'.repeat(32),name,at:100,createdAt:100,
  data:{race:1,job:16,level:10,name,stats:{},points:{},mastery:{},
   equipment:{},souls:{},refinements:{},gems:{}}};
 const initial=JSON.stringify([record]),values={},writes=[],errors=[];
 const context=await browser.newContext({viewport:{width:1150,height:820}});
 await context.addInitScript(({playerToken,initial})=>{
  localStorage.setItem('ps-build-library-secret.v1','f'.repeat(64));
  localStorage.setItem('ps-account-session.v1',JSON.stringify({
   token:playerToken,username:'hintqa',expires:Number.MAX_SAFE_INTEGER}));
  localStorage.setItem('ps-build-owner-scope.v1','account:hintqa');
  localStorage.setItem('ps-build-library.v1',initial);
 },{playerToken,initial});
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const respond=(body,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(body)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/overrides')return respond({values:{...values}});
  if(path==='/api/account/me')return respond({account:{username:'hintqa'}});
  if(path==='/api/library'&&method==='GET')
   return respond({records:[{id:record.id,entry:record}]});
  if(path==='/api/admin/login'&&method==='POST')
   return respond({token:ownerToken,expires:Date.now()+600000});
  if(path==='/api/admin/catalog/test-write')return respond({
   ok:true,readback:true,cleaned:true,overrideReadback:true,
   overrideCleaned:true,activeCatalogUnchanged:true});
  if(path==='/api/admin/override'&&method==='POST'){
   assert.equal(req.headers().authorization,'Bearer '+ownerToken);
   const body=req.postDataJSON();
   assert.match(body.key,/^guideedit\.book\.ui\.label\.library-hint-/);
   assert.equal(body.expectedValue,Object.hasOwn(values,body.key)?values[body.key]:null,
    'CAS keeps the previous version');
   values[body.key]=body.value;writes.push(body);
   return respond({ok:true,key:body.key,value:body.value,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('.build-card').first().waitFor({state:'visible'});
  assert.equal(await page.locator('.build-hint-owner-panel').count(),0,
   'Ordinary users never see hint-edit controls');
  assert.equal(await page.locator('.build-card h3').first().innerText(),name);
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'})
   .waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:15000});
  await page.locator('.build-card').first().waitFor({state:'visible'});
  const panel=page.locator('.build-hint-owner-panel');
  await panel.waitFor({state:'visible'});
  await panel.locator('summary').click();
  assert.equal(await panel.locator('.build-hint-owner-row').count(),5);
  const edit=async(key,text)=>{
   await panel.locator('[data-owner-copy-pencil="'+key+'"]').click();
   const field=panel.locator('.account-copy-edit-host [contenteditable]');
   await field.fill(text);
   await field.press('Tab');
   await page.waitForFunction(({key,text})=>
    document.querySelector('.build-hint-owner-panel [data-owner-copy-key="'+key+'"]')
     ?.textContent===text,{key,text},{timeout:15000});
  };
  const russian='Открывает выбранного героя.';
  await edit('libraryHintOpen',russian);
  const key='guideedit.book.ui.label.library-hint-open';
  assert.equal(JSON.parse(values[key]).ru,russian);
  assert.equal(writes.length,1);
  const card=page.locator('.build-card').first();
  const button=card.locator('[data-build-action-hint="libraryHintOpen"]');
  assert.equal(await button.getAttribute('data-guide-hint'),russian,
   'Updated copy reaches the still-mounted action without a library remount');
  await button.hover();
  const popup=page.locator('#stage-guide-tooltip');
  await popup.waitFor({state:'visible',timeout:5000});
  assert.equal(await popup.innerText(),russian);
  await page.mouse.move(1,1);
  await popup.waitFor({state:'hidden'});
  await panel.locator('[data-owner-copy-pencil="libraryHintOpen"]').click();
  const cancel=panel.locator('.account-copy-edit-host [contenteditable]');
  await cancel.fill('Не сохранять');
  await cancel.press('Escape');
  assert.equal(JSON.parse(values[key]).ru,russian);
  assert.equal(writes.length,1,'Escape never writes to D1');

  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('.build-card').first().waitFor({state:'visible'});
  await panel.waitFor({state:'visible'});
  if(!(await panel.evaluate(el=>el.open)))await panel.locator('summary').click();
  const english='Opens the saved character.';
  await edit('libraryHintOpen',english);
  assert.deepEqual(JSON.parse(values[key]),{ru:russian,en:english});
  assert.equal(await page.locator('.build-card').first().locator(
   '[data-build-action-hint="libraryHintOpen"]').getAttribute('data-guide-hint'),english);
  await page.setViewportSize({width:390,height:800});
  const geo=await panel.evaluate(el=>({
   overflow:el.scrollWidth-el.clientWidth,
   rows:el.querySelectorAll('.build-hint-owner-row').length
  }));
  assert.equal(geo.rows,5);
  assert.ok(geo.overflow<=4,'Mobile hint editor must not overflow horizontally');
  assert.equal(await page.locator('.build-card h3').first().innerText(),name);
  assert.deepEqual(errors,[]);
  console.log('Chromium owner build hints: RU/EN CAS edit, immediate hover, Escape, mobile, no player data change');
 }finally{await context.close()}
}
