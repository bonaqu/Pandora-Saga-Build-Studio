import assert from 'node:assert/strict';

// Mocked Worker responses; no requests touch real player D1 data.
export async function runShareLinkSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const shareId='A1234567890',stored=new Map(),token='t'.repeat(43),username='share_tester';
 let mismatched=false,revoked=false,created=0,readbacks=0,sharedGets=0;
 let holdNextSharedRead=false,releaseStaleRead=null,notifyStaleRead=null;
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 const seedSession=({token,username})=>localStorage.setItem('ps-account-session.v1',
  JSON.stringify({token,username,expires:Number.MAX_SAFE_INTEGER}));
 await context.addInitScript(seedSession,{token,username});
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 const mockWorkerRoute=async route=>{
  const request=route.request(),url=request.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=request.method();
  const json=async(data,status=200)=>route.fulfill({
   status,contentType:'application/json',
   headers:{
    'access-control-allow-origin':'*',
    'access-control-allow-headers':'authorization,content-type',
    'access-control-allow-methods':'GET,POST,OPTIONS'
   },body:JSON.stringify(data)
  });
  if(method==='OPTIONS')return route.fulfill({status:204,headers:{
   'access-control-allow-origin':'*',
   'access-control-allow-headers':'authorization,content-type',
   'access-control-allow-methods':'GET,POST,OPTIONS'
  }});
  if(path==='/api/account/me'){
   assert.equal(request.headers().authorization,'Bearer '+token);
   return json({account:{username}});
  }
  if(path==='/api/library'){
   assert.equal(request.headers().authorization,'Bearer '+token,
    'Library requests must use an account session');
   if(method==='GET')return json({records:[]});
   const body=request.postDataJSON();
   if(body?.action==='put'&&body.entry?.id){
    stored.set(body.entry.id,body.entry);return json({ok:true,revision:body.entry.at});
   }
   return json({error:'Invalid library request'},400);
  }
  if(path==='/api/shared'&&method==='POST'){
   assert.equal(request.headers().authorization,'Bearer '+token,
    'Only signed-in accounts may publish links');
   const body=request.postDataJSON();
   if(!stored.has(body?.buildId))return json({error:'Missing stored build'},409);
   created++;return json({ok:true,id:shareId});
  }
  if(path==='/api/shared/'+shareId&&method==='GET'){
   assert.equal(request.headers().authorization,'Bearer '+token,
    'Shared link reads must use an account session');
   sharedGets++;
   if(holdNextSharedRead){
    holdNextSharedRead=false;
    notifyStaleRead?.();
    await new Promise(resolve=>{releaseStaleRead=resolve});
    return json({error:'Old deleted-link response',reason:'deleted'},410);
   }
   if(revoked)return json({error:'Владелец удалил билд',reason:'deleted'},410);
   const entry=[...stored.values()].at(-1);
   if(!entry)return json({error:'Missing'},404);
   readbacks++;
   const data=mismatched?{...entry.data,level:1}:entry.data;
   return json({schema:1,share:{schema:1,type:'build',data}});
  }
  return route.abort();
 };
 await context.route('**/*',mockWorkerRoute);
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0,
   null,{timeout:20000});
  // A shareable build must have an explicitly chosen origin.
  await page.locator('#raceGrid .race-slide-select').click(); // Human preview
  await page.locator('[data-origin-tab="class"]').click();
  await page.locator('#classGrid .class-wizard-choice').first().click(); // Warrior direction
  await page.locator('#classGrid .class-current-select').click(); // Confirm Warrior
  await page.locator('[data-origin-tab="stats"]').click();
  await page.locator('#level').evaluate(el=>{
   el.value='55';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.locator('#levelOut').textContent(),'55');
  await page.locator('#snapshot').click();
  await page.getByRole('button',{name:'Сохранить новый билд'}).click();
  await page.locator('.build-card').first().waitFor({state:'visible'});
  await page.waitForFunction(()=>
   document.querySelector('.cloud-library-status')?.textContent.includes('Сохранено в облаке'),
   null,{timeout:15000});
  await page.locator('.build-card').first().getByRole('button',{name:'🔗 Поделиться'}).click();
  const status=page.locator('.build-card').first().locator('.share-result');
  await status.waitFor({state:'visible',timeout:20000});
  assert.match(await status.innerText(),/Ссылка на билд создана/);
  assert.equal(await status.locator('[data-owner-copy-key="libraryShareCreated"]').count(),1);
  assert.equal(await status.locator('[data-owner-copy-key="libraryShareSnapshotNote"]').count(),1);
  assert.equal(await status.locator('.share-result-copy-row').count(),2);
  assert.equal(await status.locator('.account-copy-pencil').count(),0,
   'Ordinary account users must never see administrator edit buttons');
  assert.equal(await status.locator('button[data-owner-copy-key]').count(),0,
   'Copying a link is a user action, not an editable caption');
  const input=status.locator('input[aria-label="Ссылка на билд"]');
  const link=await input.inputValue();
  assert.equal(link,base+'/#b/'+shareId);
  assert.equal(created,1);
  assert.equal(readbacks,1,'must verify public GET before displaying link');
  assert.equal(sharedGets,1,'sharing should issue one verification GET');
  await status.getByRole('button',{name:'Скопировать ссылку'}).click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),link);
  mismatched=true;
  await page.locator('.build-card').first().getByRole('button',{name:'🔗 Поделиться'}).click();
  const error=page.locator('.build-card').first().locator('.build-share-error');
  await error.waitFor({state:'visible',timeout:20000});
  assert.match(await error.innerText(),/не подтвердила выбранный билд/);
  assert.equal(await page.locator('.build-share-slot .share-result').count(),0);
  assert.equal(readbacks,2);
  assert.equal(sharedGets,2,'repeat verification must issue one GET');
  assert.deepEqual(errors,[]);
  mismatched=false;
  const receiver=await browser.newContext({viewport:{width:1365,height:850}});
  await receiver.addInitScript(seedSession,{token,username});
  await receiver.route('**/*',mockWorkerRoute);
  const incoming=await receiver.newPage(),incomingErrors=[];
  incoming.on('pageerror',e=>incomingErrors.push(e.message));
  try{
   await incoming.goto(base+'/',{waitUntil:'domcontentloaded'});
   await incoming.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0,
    null,{timeout:20000});
   await incoming.locator('[data-origin-tab="stats"]').click();
   await incoming.locator('#level').evaluate(el=>{
    el.value='22';el.dispatchEvent(new Event('input',{bubbles:true}));
   });
   assert.equal(await incoming.locator('#levelOut').textContent(),'22');
   // Navigate without a full page reload: previously only boot processed #b/.
   await incoming.evaluate(id=>{location.hash='#b/'+id},shareId);
   const dialog=incoming.getByRole('dialog',{name:'Открыть билд по ссылке?'});
   await dialog.waitFor({state:'visible',timeout:20000});
   assert.equal(await dialog.locator('[data-owner-copy-key="librarySharedOpenNote"]').count(),1);
   assert.equal(await dialog.locator('.shared-receiver-copy-row .account-copy-pencil').count(),0);
   assert.equal(await dialog.locator('.shared-personal-name [data-owner-copy-key]').count(),0);
   assert.equal(sharedGets,3,'one same-tab hashchange must issue exactly one shared GET');
   await dialog.getByRole('button',{name:'Отмена'}).click();
   assert.equal(await incoming.locator('#levelOut').textContent(),'22',
    'rejecting an imported build preserves the recipient draft');
   assert.equal(await incoming.evaluate(()=>location.hash),'');
   await incoming.evaluate(id=>{location.hash='#b/'+id},shareId);
   await dialog.waitFor({state:'visible',timeout:20000});
   assert.equal(sharedGets,4,'a second navigation must not duplicate its GET');
   await dialog.getByRole('button',{name:'Открыть без сохранения'}).click();
   assert.equal(await incoming.locator('#levelOut').textContent(),'55',
    'accepting the shared build loads its full planning level');
   assert.equal(await incoming.evaluate(()=>location.hash),'');
   // English receiver: the entire standalone shared-build dialog must be localized,
   // while preserving the original user build and all saved build data.
   await incoming.locator('#locale [data-locale="en"]').click();
   // Switching to EN loads a verified locale asynchronously. The shared
   // dialog must not race against an unfinished language switch.
   await incoming.waitForFunction(()=>document.documentElement.lang==='en',
    null,{timeout:15000});
   await incoming.evaluate(id=>{location.hash='#b/'+id},shareId);
   const englishDialog=incoming.getByRole('dialog',{name:'Open build from link?'});
   await englishDialog.waitFor({state:'visible',timeout:20000});
   assert.equal(sharedGets,5,'EN navigation must issue one shared GET');
   assert.match(await englishDialog.innerText(),/unsaved changes will be replaced/i);
   assert.equal(await englishDialog.locator('[data-owner-copy-key="librarySharedOpenNote"]').innerText(),
    'Existing saved builds will not be deleted.');
   await englishDialog.getByRole('button',{name:'Cancel'}).click();
   assert.equal(await incoming.locator('#levelOut').textContent(),'55');
   await incoming.locator('#locale [data-locale="ru"]').click();
   await incoming.waitForFunction(()=>document.documentElement.lang==='ru',
    null,{timeout:15000});
   // Older GET for the SAME ID must not override a successful second visit.
   // A stale 410 used to remove the new hash and display a false deleted toast.
   const staleStarted=new Promise(resolve=>{notifyStaleRead=resolve});
   holdNextSharedRead=true;
   await incoming.evaluate(id=>{location.hash='#b/'+id},shareId);
   await staleStarted;
   await incoming.evaluate(()=>{location.hash=''});
   await incoming.evaluate(id=>{location.hash='#b/'+id},shareId);
   await dialog.waitFor({state:'visible',timeout:20000});
   assert.equal(sharedGets,7,'same-link reentry opens a second request');
   const staleResponse=incoming.waitForResponse(response=>
    response.url().endsWith('/api/shared/'+shareId)&&response.status()===410);
   releaseStaleRead();
   await staleResponse;
   await incoming.evaluate(()=>new Promise(resolve=>
    requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.equal(await incoming.evaluate(()=>location.hash),'#b/'+shareId,
    'stale 410 must not erase a newer visit to the same URL');
   assert.equal(await incoming.locator('#studioToast').isVisible(),false,
    'stale 410 must not produce a deleted-link warning for a successful revisit');
   assert.equal(await dialog.isVisible(),true,
    'newer shared-build confirmation must remain open');
   await dialog.getByRole('button',{name:'Отмена'}).click();
   revoked=true;
   await incoming.evaluate(id=>{location.hash='#b/'+id},shareId);
   const toast=incoming.locator('#studioToast');
   await toast.waitFor({state:'visible',timeout:20000});
   assert.equal(sharedGets,8,'revoked link must issue one shared GET');
   assert.match(await toast.innerText(),/Владелец удалил этот билд/);
   assert.equal(await incoming.locator('#levelOut').textContent(),'55');
   assert.equal(await incoming.evaluate(()=>location.hash),'');
   assert.deepEqual(incomingErrors,[]);
  }finally{await receiver.close()}
  console.log('Chromium share link smoke passed: verified URL, clipboard, mismatch, receiver cancellation/import and revoked link');
 }finally{
  await context.close();
 }
}
