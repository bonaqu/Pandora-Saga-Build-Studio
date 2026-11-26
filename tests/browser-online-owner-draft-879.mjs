import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// A real owner inline editor must never silently commit on a blocked-screen
// blur; the original text stays selectable for an explicit copy and reload.
export async function runOnlineOwnerDraft879Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const publicOrigin='http://pandora-owner-recovery.test';
 const ctx=await browser.newContext({viewport:{width:1260,height:860}});
 let snapshot='owner-audit-a',writes=0,reads=0;
 const cors={'access-control-allow-origin':'*',
  'access-control-allow-headers':'Authorization,Content-Type',
  'access-control-allow-methods':'GET,POST,OPTIONS'};
 await ctx.addInitScript(()=>localStorage.setItem('ps-build-lang','ru'));
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(publicOrigin+'/')){
   const response=await route.fetch({url:base+url.slice(publicOrigin.length)});
   return route.fulfill({response});
  }
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  if(method==='OPTIONS')return route.fulfill({status:204,headers:cors});
  const path=new URL(url).pathname;
  const reply=(data,status=200,additional={})=>route.fulfill({status,
   headers:{...cors,...additional},contentType:'application/json',body:JSON.stringify(data)});
  if(path==='/api/admin/login'&&method==='POST')
   return reply({token:'a'.repeat(43),expires:Date.now()+600000});
  if(method!=='GET'){writes++;return reply({error:'No writes expected'},403)}
  if(path==='/api/overrides'){reads++;return reply({values:{}})}
  if(path.startsWith('/api/catalog/')&&path.endsWith('.json')){
   reads++;
   const name=path.slice('/api/catalog/'.length,-5);
   const data=readFileSync(new URL('../data/os/'+
    (name==='stringsEn'?'strings.en':name)+'.json',import.meta.url),'utf8');
   return route.fulfill({status:200,headers:{...cors,
    'access-control-expose-headers':'X-PS-Catalog-Snapshot,X-PS-Catalog',
    'x-ps-catalog':'d1','x-ps-catalog-snapshot':snapshot},
    contentType:'application/json',body:data});
  }
  if(path==='/api/library')return reply({records:[]});
  return route.abort();
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(publicOrigin+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Local browser fixture password');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:16000});
  await page.locator('#ownerDock [data-owner-collapse]').click();
  const diagnostics=page.locator('#ownerDock details[data-owner-group="tools"]');
  assert.equal(await diagnostics.getAttribute('open'),null,
   'Diagnostic controls should start collapsed');
  await diagnostics.locator(':scope > summary').click();
  const slot=page.locator('#ownerDock .owner-dock-action-slot[data-owner-dock-key="testD1"]');
  assert.equal(await slot.locator('.owner-dock-action-pencil').count(),0);
   await slot.locator('button').dblclick();
  const edit=slot.locator('[contenteditable="plaintext-only"]');
  await edit.waitFor({state:'visible'});
  const unsent='Особая черновая подпись 879 — сохранить вручную';
  await edit.fill(unsent);
  assert.equal(writes,0,'An active inline edit should not POST before explicit save');
  snapshot='owner-audit-b';
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  const recovery=page.locator('#startupOverlay[data-state="error"]');
  await recovery.waitFor({state:'visible',timeout:15000});
  assert.match(await page.locator('#startupTitle').innerText(),/Игровые данные обновились/);
  const copy=page.locator('#startupUnsentOwnerText');
  await copy.waitFor({state:'visible'});
  assert.equal(await copy.inputValue(),unsent);
  assert.equal(await copy.getAttribute('readonly'),'',
   'The saved copy is selectable but cannot accidentally be edited');
  assert.equal(writes,0,'Showing a blocking overlay must not commit an owner draft');
  await page.locator('#startupRetry').click();
  assert.match(await page.locator('#startupRetry').innerText(),/Я скопировал/);
  assert.equal(await copy.inputValue(),unsent);
  assert.equal(writes,0,'Selecting/copying behind the modal must not blur-save to D1');
  await page.locator('#startupRetry').click();
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  assert.equal(writes,0,'A forced update must not submit unconfirmed owner text to D1');
  assert.ok(reads>9);
  assert.deepEqual(errors,[]);
  console.log('Chromium owner unsent draft: same text exposed for copy, no D1 blur-write, explicit two-step refresh');
 }finally{await ctx.close()}
}
