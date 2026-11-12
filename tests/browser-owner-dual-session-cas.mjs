import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Two isolated browser contexts share one CAS-aware mock Worker. Production D1
// atomicity is verified separately by the authorized release workflow.
// This test verifies the actual inline editor and user-facing 409 handling.
export async function runOwnerDualSessionCasSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const key='guideedit.book.owner-dock.test-d1';
 const values={},writes=[],attempts=[],errors=[],testWriteCalls=[];
 const tokens=['a'.repeat(43),'b'.repeat(43)];
 const contexts=await Promise.all(tokens.map(async(token)=>{
  const context=await browser.newContext({viewport:{width:1150,height:800}});
  await context.route('**/*',route=>{
   const req=route.request(),url=req.url();
   if(url.startsWith(base+'/'))return route.continue();
   if(!url.startsWith(api+'/'))return route.abort();
   const path=new URL(url).pathname,method=req.method();
   const headers={'access-control-allow-origin':'*',
    'access-control-allow-headers':'Authorization,Content-Type',
    'access-control-allow-methods':'GET,POST,OPTIONS'};
   const json=(body,status=200)=>route.fulfill({
    status,headers,contentType:'application/json',body:JSON.stringify(body)});
   if(method==='OPTIONS')return route.fulfill({status:204,headers});
   if(path.startsWith('/api/catalog/')&&path.endsWith('.json')){
    const id=path.split('/').pop().slice(0,-5);
    if(id==='legacyLocale')return json({});
    const filename=id==='stringsEn'?'strings.en':id;
    const data=JSON.parse(readFileSync(
     new URL('../data/os/'+filename+'.json',import.meta.url),'utf8'));
    return route.fulfill({status:200,headers:{
     ...headers,'access-control-expose-headers':'X-PS-Catalog-Snapshot, X-PS-Catalog',
     'x-ps-catalog-snapshot':'ps-browser-qa','x-ps-catalog':'d1'
    },contentType:'application/json',body:JSON.stringify(data)});
   }
   if(path==='/api/overrides'&&method==='GET')
    return json({values:{...values}});
   if(path==='/api/admin/login'&&method==='POST')
    return json({token,expires:Date.now()+600000});
   if(path==='/api/admin/catalog/test-write'&&method==='POST'){
    testWriteCalls.push(token);
    return json({error:'Diagnostic must not execute during caption edit'},500);
   }
   if(path==='/api/admin/override'&&method==='POST'){
    assert.equal(req.headers().authorization,'Bearer '+token,
     'Only the authenticated editor can submit this action');
    const edit=req.postDataJSON();
    assert.equal(edit.key,key,'Only the disposable editorial button was edited');
    if(!Object.hasOwn(edit,'expectedValue'))
     return json({code:'OWNER_CLIENT_UPDATE_REQUIRED'},428);
    const current=Object.hasOwn(values,edit.key)?values[edit.key]:null;
    const status=edit.expectedValue===current?200:409;
    attempts.push({status,expectedValue:edit.expectedValue,current});
    if(status===409)
     return json({code:'OWNER_EDIT_CONFLICT',error:'Stale editorial value'},409);
    values[edit.key]=edit.value;writes.push({token,body:edit});
    return json({ok:true,key:edit.key,value:edit.value,conditional:true});
   }
   return route.abort();
  });
  return context;
 }));
 const pages=[];let phase='start';
 const enterLiveCatalog=async page=>{
  await page.evaluate(()=>document.querySelector('#startupRetry')?.click());
  await page.waitForFunction(()=>
   document.querySelector('#startupOverlay')?.hidden===true &&
   document.querySelector('#catalogStatus')?.textContent?.includes('навыков'),
   null,{timeout:30000});
 };
 try{
  for(const context of contexts){
   const page=await context.newPage();pages.push(page);
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await enterLiveCatalog(page);
   await page.locator('#nav [data-tab="wiki"]').waitFor({state:'visible',timeout:30000});
   await page.keyboard.press('Control+Alt+Shift+P');
   await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
   // A synthetic password; the route never validates or stores credentials.
   await page.locator('input[placeholder="Пароль администратора"]')
    .fill('isolated browser fixture');
   await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
   await page.locator('#ownerDock').waitFor({state:'visible',timeout:18000});
   await page.locator('#ownerDock [data-owner-collapse]').click();
   const caption=page.locator('#ownerDock .owner-dock-d1-check');
   await caption.waitFor({state:'visible'});
   assert.equal((await caption.innerText()).trim(),'Проверить сохранение');
  }
  const editSlot=page=>page.locator(
   '#ownerDock .owner-dock-action-slot[data-owner-dock-key="testD1"]');
  const edit=async(page,text)=>{
   const slot=editSlot(page);
   await slot.locator('.owner-dock-action-pencil').click();
   const input=slot.locator('[contenteditable="plaintext-only"]');
   await input.waitFor({state:'visible'});
   await input.fill(text);await input.press('Tab');
   return input;
  };
  const [first,second]=pages;
  phase='first-submit';
  await edit(first,'Первая подтверждённая подпись');
  phase='first-visible';
  await first.waitForFunction(text=>
   document.querySelector('#ownerDock .owner-dock-d1-check')?.textContent===text,
   'Первая подтверждённая подпись',{timeout:12000});
  assert.equal(JSON.parse(values[key]).ru,'Первая подтверждённая подпись');
  assert.equal(writes.length,1);
  assert.equal((await second.locator('#ownerDock .owner-dock-d1-check').innerText()).trim(),
   'Проверить сохранение','Second browser must retain its independently loaded stale copy');

  phase='second-submit';
  await edit(second,'Вторая конкурирующая подпись');
  phase='second-error';
  await second.waitForFunction(()=>document.querySelector(
   '#ownerDock [data-owner-save-state]')?.dataset.state==='error',
   null,{timeout:12000});
  const draft=editSlot(second).locator('[contenteditable="plaintext-only"]');
  assert.equal(await draft.textContent(),'Вторая конкурирующая подпись',
   'The losing edit must keep its unsaved draft available for retry');
  const inlineConflict=editSlot(second).locator('.ui-content-inline-error');
  await inlineConflict.waitFor({state:'visible',timeout:12000});
  assert.match(await inlineConflict.innerText(),/другом окне|изменили/,
   'Conflict message must be next to the draft, not a raw HTTP error');
  assert.equal(await draft.getAttribute('contenteditable'),'plaintext-only',
   'An administrator can edit and retry the same draft after CAS rejection');
  assert.match(await second.locator('#ownerDock [data-owner-recent]').innerText(),
   /За этот сеанс: 0/,'Rejected CAS must not count as a successful edit');
  assert.equal(writes.length,1,'Only the winning editor may write a value');
  assert.deepEqual(attempts.map(row=>row.status),[200,409]);
  assert.equal(JSON.parse(values[key]).ru,'Первая подтверждённая подпись');
  assert.equal(testWriteCalls.length,0,'Editing a button caption must never run D1 diagnostics');
  await draft.press('Escape');
  await editSlot(second).locator('.owner-dock-d1-check').waitFor({state:'visible'});

  // After explicit refresh the second browser observes the winning value,
  // then may save a new revision with the exact current CAS precondition.
  phase='second-reload';
  await second.reload({waitUntil:'domcontentloaded'});
  await enterLiveCatalog(second);
  await second.locator('#nav [data-tab="wiki"]').waitFor({state:'visible',timeout:30000});
  await second.keyboard.press('Control+Alt+Shift+P');
  await second.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await second.locator('input[placeholder="Пароль администратора"]')
   .fill('isolated browser fixture');
  await second.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await second.locator('#ownerDock').waitFor({state:'visible'});
  await second.locator('#ownerDock [data-owner-collapse]').click();
  await second.waitForFunction(text=>
   document.querySelector('#ownerDock .owner-dock-d1-check')?.textContent===text,
   'Первая подтверждённая подпись',{timeout:12000});
  phase='second-retry';
  await edit(second,'Вторая версия после обновления');
  phase='retry-visible';
  await second.waitForFunction(text=>
   document.querySelector('#ownerDock .owner-dock-d1-check')?.textContent===text,
   'Вторая версия после обновления',{timeout:12000});
  assert.equal(JSON.parse(values[key]).ru,'Вторая версия после обновления');
  assert.equal(writes.length,2);
  assert.deepEqual(attempts.map(row=>row.status),[200,409,200]);
  assert.equal(attempts[2].expectedValue,writes[0].body.value);
  assert.equal(testWriteCalls.length,0);
  assert.deepEqual(errors,[]);
  console.log('Chromium dual-session owner CAS passed: 200/409, draft and count preserved, fresh retry 200');
 }catch(error){
  const observed=[];
  for(const page of pages)try{observed.push(await page.evaluate(()=>({
   label:document.querySelector('#ownerDock .owner-dock-d1-check')?.textContent,
   status:document.querySelector('#ownerDock [data-owner-save-state]')?.textContent,
   input:document.querySelector('#ownerDock [contenteditable]')?.textContent,
   toast:document.querySelector('#studioToast')?.textContent
  })));}catch{observed.push({unavailable:true})}
  console.error('DUAL CAS failure phase='+phase+' attempts='+JSON.stringify(attempts)+
   ' writes='+writes.length+' data='+JSON.stringify(values)+' ui='+JSON.stringify(observed));
  throw error;
 }finally{await Promise.all(contexts.map(context=>context.close()))}
}
