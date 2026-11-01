import assert from 'node:assert/strict';

export async function runCrossTabGuestIsolationSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev',keyA='4'.repeat(64),
  keyB='5'.repeat(64);
 const writes=[],context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.addInitScript(key=>{
  if(sessionStorage.getItem('guest-tab-key-seeded'))return;
  sessionStorage.setItem('guest-tab-key-seeded','1');
  localStorage.setItem('ps-build-library-secret.v1',key);
 },keyA);
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
  const bearer=route.request().headers().authorization?.slice(7);
  const send=(code,body)=>route.fulfill({status:code,headers,
   contentType:'application/json',body:JSON.stringify(body)});
  if(new URL(url).pathname==='/api/library'){
   if(route.request().method()==='GET')return send(200,{records:[]});
   const payload=route.request().postDataJSON();writes.push({bearer,payload});
   return send(200,{ok:true});
  }
  return route.abort();
 });
 const tabA=await context.newPage(),tabB=await context.newPage(),errors=[];
 for(const page of [tabA,tabB])page.on('pageerror',e=>errors.push(e.message));
 async function loaded(page,expectedKey){
  // The race grid renders before the verified catalog and before the guest
  // owner transition commits. Waiting for the grid alone can lead to input
  // replacement or a POST sent from a stale initial tab state.
  await page.waitForFunction(expected=>
   localStorage.getItem('ps-build-owner-scope.v1')==='guest:'+expected&&
   /\d+ навыков · \d+ предметов · \d+ душ/.test(
    document.querySelector('#catalogStatus')?.textContent||''),
   expectedKey,{timeout:25000});
 }
 async function save(page,name,expectedKey){
  if(!await page.locator('.build-name-input').isVisible())
   await page.locator('#nav [data-tab="builds"]').click();
  const nameInput=page.locator('.build-name-input');
  await nameInput.fill(name);
  assert.equal(await nameInput.inputValue(),name,'Guest save name must survive before POST');
  // A card may render as soon as the local draft is saved, before the
  // asynchronous POST reaches the mock Worker. Check the exact owner,
  // build name AND server response; do not merely sleep or weaken assertions.
  const persisted=page.waitForResponse(response=>{
   if(!response.url().startsWith(api+'/api/library')||
      response.request().method()!=='POST'||!response.ok())return false;
   const request=response.request();
   try{return request.headers().authorization==='Bearer '+expectedKey&&
    request.postDataJSON()?.entry?.name===name}
   catch{return false}
  },{timeout:20000});
  await page.getByRole('button',{name:'Сохранить новый билд'}).click();
  await page.locator('.build-card h3').filter({hasText:name}).waitFor({state:'visible'});
  await persisted;
 }
 try{
  await tabA.goto(base+'/',{waitUntil:'domcontentloaded'});await loaded(tabA,keyA);
  await save(tabA,'Guest A one',keyA);
  assert.equal(await tabA.locator('.build-transfer').count(),1,
   'Guest transfer controls remain available to account-free libraries');
  await tabB.goto(base+'/',{waitUntil:'domcontentloaded'});await loaded(tabB,keyA);
  await tabB.evaluate(key=>localStorage.setItem('ps-build-library-secret.v1',key),keyB);
  await tabB.reload({waitUntil:'domcontentloaded'});await loaded(tabB,keyB);
  await save(tabB,'Guest B one',keyB);
  // Tab A remains on its original account-free library even though tab B
  // wrote a different key to origin-shared localStorage.
  await save(tabA,'Guest A two',keyA);
  const storage=await tabB.evaluate(()=>{
   return {owner:localStorage.getItem('ps-build-owner-scope.v1'),
    names:JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]').map(x=>x.name)};
  });
  assert.equal(storage.owner,'guest:'+keyB);
  assert.deepEqual(storage.names,['Guest B one']);
  const cacheA=await tabA.evaluate(key=>
   JSON.parse(localStorage.getItem('ps-build-scope-cache.v1:guest:'+key)),keyA);
  assert.deepEqual(JSON.parse(cacheA[0]).map(x=>x.name).sort(),
   ['Guest A one','Guest A two']);
  assert.ok(writes.some(x=>x.bearer===keyA&&x.payload?.entry?.name==='Guest A two'));
  assert.ok(writes.some(x=>x.bearer===keyB&&x.payload?.entry?.name==='Guest B one'));
  assert.equal(writes.some(x=>x.bearer===keyB&&x.payload?.entry?.name.startsWith('Guest A')),false);
  assert.deepEqual(errors,[]);
  console.log('Chromium concurrent guests passed: tab A retains its original private D1 library key');
 }finally{await context.close()}
}
