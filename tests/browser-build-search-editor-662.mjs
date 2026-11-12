import assert from 'node:assert/strict';

// Real Chromium editorial UI, isolated account and mocked D1 CAS.
// Search terms and all six stored player builds must survive owner edits.
export async function runOwnerBuildSearch662Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const token='t'.repeat(43),ownerToken='a'.repeat(43);
 const builds=Array.from({length:6},(_,i)=>{
  const name='Search QA '+(i+1);
  return {id:(i+1).toString(16).repeat(32),name,createdAt:i+100,at:i+100,
   data:{race:1,job:8,level:20+i,name,stats:{},points:{},mastery:{},
    equipment:{},souls:{},refinements:{},gems:{}}};
 });
 const stored=JSON.stringify(builds);
 const values={},writes=[],errors=[];
 const context=await browser.newContext({viewport:{width:1150,height:820}});
 await context.addInitScript(({token,stored})=>{
  localStorage.setItem('ps-build-library-secret.v1','f'.repeat(64));
  localStorage.setItem('ps-account-session.v1',JSON.stringify({
   token,username:'searchqa',expires:Number.MAX_SAFE_INTEGER}));
  localStorage.setItem('ps-build-owner-scope.v1','account:searchqa');
  localStorage.setItem('ps-build-library.v1',stored);
 },{token,stored});
 const headers={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const reply=(data,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/overrides')return reply({values:{...values}});
  if(path==='/api/account/me')return reply({account:{username:'searchqa'}});
  if(path==='/api/library'&&method==='GET')
   return reply({records:builds.map(entry=>({id:entry.id,entry}))});
  if(path==='/api/admin/login')return reply({
   token:ownerToken,expires:Date.now()+600000});
  if(path==='/api/admin/catalog/test-write')return reply({
   ok:true,readback:true,cleaned:true,overrideReadback:true,
   overrideCleaned:true,activeCatalogUnchanged:true});
  if(path==='/api/admin/override'&&method==='POST'){
   assert.equal(req.headers().authorization,'Bearer '+ownerToken);
   const edit=req.postDataJSON();
   assert.match(edit.key,/^guideedit\.book\.ui\.label\.library-(?:search-|empty)/);
   assert.equal(edit.expectedValue,Object.hasOwn(values,edit.key)?values[edit.key]:null);
   values[edit.key]=edit.value;writes.push(edit);
   return reply({ok:true,key:edit.key,value:edit.value,conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#nav [data-tab="builds"]').click();
  const search=page.locator('.build-library-search');
  await search.waitFor({state:'visible'});
  assert.equal(await page.locator('.build-card').count(),6);
  assert.equal(await page.locator('.build-hint-owner-panel').count(),0);
  await search.fill('missing word');
  const none=page.locator('[data-build-library-state-copy="librarySearchEmpty"]');
  await none.waitFor({state:'visible'});
  assert.equal(await page.locator('.build-card:visible').count(),0);

  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'})
   .waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  await search.waitFor({state:'visible'});
  assert.equal(await search.inputValue(),'missing word');
  await search.evaluate(node=>{window.__qaSearchNode=node});
  const panel=page.locator('.build-hint-owner-panel');
  await panel.waitFor({state:'visible'});
  if(!(await panel.evaluate(node=>node.open)))await panel.locator('summary').click();
  assert.equal(await panel.locator('.build-hint-owner-row').count(),13);

  const edit=async(key,value)=>{
   await panel.locator('[data-owner-copy-pencil="'+key+'"]').click();
   const field=panel.locator('.account-copy-edit-host [contenteditable]');
   await field.fill(value);
   await field.press('Tab');
   await page.waitForFunction(({key,value})=>
    document.querySelector('.build-hint-owner-panel [data-owner-copy-key="'+key+'"]')
     ?.textContent===value,{key,value},{timeout:15000});
  };
  await edit('librarySearchPlaceholder','Найди своего героя…');
  assert.equal(await search.getAttribute('placeholder'),'Найди своего героя…');
  await edit('librarySearchInputLabel','Поиск по библиотеке');
  assert.equal(await search.getAttribute('aria-label'),'Поиск по библиотеке');
  await edit('librarySearchEmpty','Совпадений не обнаружено.');
  assert.equal(await none.innerText(),'Совпадений не обнаружено.');
  await edit('libraryEmpty','Библиотека пока пуста.');
  assert.equal(JSON.parse(values['guideedit.book.ui.label.library-empty']).ru,
   'Библиотека пока пуста.');
  assert.equal(await search.inputValue(),'missing word');
  assert.equal(await search.evaluate(node=>node===window.__qaSearchNode),true,
   'Saving D1 search copy must keep the same input element');
  assert.equal(await page.locator('.build-card:visible').count(),0,
   'Saving text must retain the active search filter');

  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="builds"]').click();
  await search.waitFor({state:'visible'});
  assert.equal(await search.inputValue(),'missing word',
   'Locale switch must preserve the filter term');
  assert.equal(await search.getAttribute('placeholder'),'Search by name, class or level…');
  assert.equal(await none.innerText(),'No builds match this search.');
  if(!(await panel.evaluate(el=>el.open)))await panel.locator('summary').click();
  await edit('librarySearchPlaceholder','Find a character…');
  assert.deepEqual(JSON.parse(values['guideedit.book.ui.label.library-search-placeholder']),{
   ru:'Найди своего героя…',en:'Find a character…'});
  assert.equal(await search.getAttribute('placeholder'),'Find a character…');
  assert.equal(await search.inputValue(),'missing word');
  assert.equal(await page.locator('.build-card:visible').count(),0);

  await page.setViewportSize({width:390,height:800});
  const geom=await panel.evaluate(node=>({
   overflow:node.scrollWidth-node.clientWidth,
   rows:node.querySelectorAll('.build-hint-owner-row').length
  }));
  assert.ok(geom.overflow<=4,'Owner search copy editor must fit at mobile width');
  assert.equal(geom.rows,13);
  assert.deepEqual((await page.locator('.build-card h3').allInnerTexts()),builds.map(x=>x.name));
  assert.deepEqual(errors,[]);
  console.log('Chromium owner search 662: D1 RU/EN edits, no-result, 390px, query and build preservation');
 }finally{await context.close()}
}
