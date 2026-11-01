import assert from 'node:assert/strict';
export async function runSavedAutosaveSmoke(browser,base){
 const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const id='d'.repeat(32),token='e'.repeat(64);
 const data={race:1,gender:0,job:0,level:45,name:'Cloud Hero'};
 const original={id,name:'Cloud Hero',at:100,data};
 const online=new Map([[id,original]]),writes=[];
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.addInitScript(({original,token})=>{
  if(sessionStorage.getItem('ps-autosave-seeded'))return;
  sessionStorage.setItem('ps-autosave-seeded','1');
  localStorage.setItem('ps-build-library-secret.v1',token);
  localStorage.setItem('ps-build-library.v1',JSON.stringify([original]));
  localStorage.setItem('ps-build-studio.v1',JSON.stringify(original.data));
  localStorage.setItem('ps-active-build-id.v1',original.id);
 },{original,token});
 await context.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(API+'/'))return route.abort();
  if(route.request().method()==='OPTIONS')return route.fulfill({
   status:204,headers:{'access-control-allow-origin':'*',
    'access-control-allow-headers':'content-type,authorization',
    'access-control-allow-methods':'GET,POST,OPTIONS'}});
  const respond=(data,status=200)=>route.fulfill({status,contentType:'application/json',
   headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
  if(new URL(url).pathname!=='/api/library')return route.abort();
  if(route.request().method()==='GET')
   return respond({records:[...online.values()].map(entry=>({id:entry.id,entry,deleted:false}))});
  const payload=route.request().postDataJSON();
  if(payload.action!=='put')return respond({error:'Unsupported'},400);
  writes.push(payload.entry);
  online.set(payload.entry.id,payload.entry);
  return respond({ok:true,revision:payload.entry.at});
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0);
  await page.locator('[data-origin-tab="stats"]').click();
  const input=page.locator('#level');await input.focus();
  await input.press('ArrowRight'); // Genuine trusted keyboard action, no Save click.
  await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='46');
  await page.waitForTimeout(900);
  assert.equal(online.get(id).data.level,45,'An edit must not silently overwrite D1');
  assert.equal(writes.length,0);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='46');
  await page.locator('[data-tab="builds"]').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Перезаписать'}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')
   .some(entry=>entry.id==='dddddddddddddddddddddddddddddddd'&&entry.data.level===46));
  await page.waitForTimeout(300);
  assert.equal(online.get(id).data.level,46,'Explicit overwrite must update the original cloud build');
  assert.equal(online.size,1);
  assert.equal(writes.length,1);
  // Explicitly start a new blank draft without saving it to the library.
  await page.locator('#newBuildQuick').click();
  const choice=page.locator('.new-build-choice');
  if(await choice.isVisible())
   await page.getByRole('button',{name:'Создать без сохранения'}).click();
  await page.locator('[data-origin-tab="stats"]').click();
  await input.focus();await input.press('ArrowRight');
  await page.waitForTimeout(900);
  assert.equal(online.size,1,'Changing an unsaved draft must not create a cloud build');
  assert.equal(writes.length,1,'No automatic PUT is allowed for an unsaved hero');
  assert.deepEqual(errors,[]);
  console.log('Chromium manual overwrite passed: edits survive reload, saved D1 unchanged until confirmed, new draft not uploaded');
 }finally{await context.close()}
}
