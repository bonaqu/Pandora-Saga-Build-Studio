import assert from 'node:assert/strict';

// Mocked Worker responses; no requests touch real player D1 data.
export async function runShareLinkSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const shareId='A1234567890',stored=new Map();
 let mismatched=false,revoked=false,created=0,readbacks=0;
 const context=await browser.newContext({viewport:{width:1365,height:850}});
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
  if(path==='/api/library'){
   if(method==='GET')return json({records:[]});
   const body=request.postDataJSON();
   if(body?.action==='put'&&body.entry?.id){
    stored.set(body.entry.id,body.entry);return json({ok:true,revision:body.entry.at});
   }
   return json({error:'Invalid library request'},400);
  }
  if(path==='/api/shared'&&method==='POST'){
   const body=request.postDataJSON();
   if(!stored.has(body?.buildId))return json({error:'Missing stored build'},409);
   created++;return json({ok:true,id:shareId});
  }
  if(path==='/api/shared/'+shareId&&method==='GET'){
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
  await page.locator('[data-origin-tab="stats"]').click();
  await page.locator('#level').evaluate(el=>{
   el.value='55';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.locator('#levelOut').textContent(),'55');
  await page.locator('#snapshot').click();
  await page.locator('.build-card').first().waitFor({state:'visible'});
  await page.locator('.build-card').first().getByRole('button',{name:'🔗 Поделиться'}).click();
  const status=page.locator('.build-card').first().locator('.share-result');
  await status.waitFor({state:'visible',timeout:20000});
  assert.match(await status.innerText(),/Ссылка на билд создана/);
  const input=status.locator('input[aria-label="Ссылка на билд"]');
  const link=await input.inputValue();
  assert.equal(link,base+'/#b/'+shareId);
  assert.equal(created,1);
  assert.equal(readbacks,1,'must verify public GET before displaying link');
  await status.getByRole('button',{name:'Скопировать ссылку'}).click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),link);
  mismatched=true;
  await page.locator('.build-card').first().getByRole('button',{name:'🔗 Поделиться'}).click();
  const error=page.locator('.build-card').first().locator('.build-share-error');
  await error.waitFor({state:'visible',timeout:20000});
  assert.match(await error.innerText(),/не подтвердила выбранный билд/);
  assert.equal(await page.locator('.build-share-slot .share-result').count(),0);
  assert.equal(readbacks,2);
  assert.deepEqual(errors,[]);
  mismatched=false;
  const receiver=await browser.newContext({viewport:{width:1365,height:850}});
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
   await incoming.goto(base+'/#b/'+shareId,{waitUntil:'domcontentloaded'});
   const dialog=incoming.getByRole('dialog',{name:'Открыть билд по ссылке?'});
   await dialog.waitFor({state:'visible',timeout:20000});
   await dialog.getByRole('button',{name:'Отмена'}).click();
   assert.equal(await incoming.locator('#levelOut').textContent(),'22',
    'rejecting an imported build preserves the recipient draft');
   assert.equal(await incoming.evaluate(()=>location.hash),'');
   await incoming.goto(base+'/#b/'+shareId,{waitUntil:'domcontentloaded'});
   await dialog.waitFor({state:'visible',timeout:20000});
   await dialog.getByRole('button',{name:'Открыть без сохранения'}).click();
   assert.equal(await incoming.locator('#levelOut').textContent(),'55',
    'accepting the shared build loads its full planning level');
   assert.equal(await incoming.evaluate(()=>location.hash),'');
   revoked=true;
   await incoming.goto(base+'/#b/'+shareId,{waitUntil:'domcontentloaded'});
   const toast=incoming.locator('#studioToast');
   await toast.waitFor({state:'visible',timeout:20000});
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
