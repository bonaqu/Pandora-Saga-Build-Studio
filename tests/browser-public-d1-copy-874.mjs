import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// This scenario simulates the D1 overrides API in-memory. Production D1 is
// never written; real client edit, CAS payload, reload and guest rendering run.
export async function runPublicD1Copy874Smoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const publicOrigin='http://pandora-build-studio.test';
 const values={},writes=[],errors=[];
 const newContext=async()=>{
  const ctx=await browser.newContext({viewport:{width:1280,height:840}});
  await ctx.addInitScript(()=>{
   localStorage.setItem('ps-build-lang','ru');
   localStorage.setItem('ps-build-studio.v1',JSON.stringify({
    race:1,gender:0,job:7,level:45,name:'Public copy QA',
    stats:{},points:{},mastery:{},equipment:{11:{id:21001,name:'Пояс'}},
    souls:{},refinements:{},gems:{}
   }));
  });
  await ctx.route('**/*',async route=>{
   const req=route.request(),url=req.url(),method=req.method();
   if(url.startsWith(publicOrigin+'/')){
    const publicPath=url.slice(publicOrigin.length);
    // A virtual public origin uses the actual local server's assets without
    // depending on DNS; unlike localhost it boots through the live D1 path.
    const response=await route.fetch({url:base+publicPath});
    return route.fulfill({response});
   }
   if(url.startsWith(base+'/'))return route.continue();
   if(!url.startsWith(api+'/'))return route.abort();
   const path=new URL(url).pathname;
   const headers={'access-control-allow-origin':'*',
    'access-control-allow-headers':'Authorization,Content-Type',
    'access-control-allow-methods':'GET,POST,OPTIONS'};
   const reply=(value,status=200)=>route.fulfill({status,headers,
    contentType:'application/json',body:JSON.stringify(value)});
   if(method==='OPTIONS')return reply({},204);
   if(path==='/api/overrides'&&method==='GET')return reply({values});
   // A full live D1 snapshot is necessary: explicit archive mode intentionally
   // skips /api/overrides, so it cannot prove the public D1 copy round-trip.
   if(path.startsWith('/api/catalog/')&&path.endsWith('.json')&&method==='GET'){
    const name=path.slice('/api/catalog/'.length,-5);
    const file=name==='stringsEn'?'strings.en':name;
    const body=readFileSync(new URL('../data/os/'+file+'.json',import.meta.url),'utf8');
    return route.fulfill({status:200,headers:{...headers,
     'access-control-expose-headers':'X-PS-Catalog-Snapshot,X-PS-Catalog',
     'x-ps-catalog-snapshot':'qa-d1-snapshot-874','x-ps-catalog':'d1'},
     contentType:'application/json',body});
   }
   if(path==='/api/admin/login'&&method==='POST'){
    assert.equal(req.postDataJSON().password,'Correct admin password!');
    return reply({token:'a'.repeat(43),expires:Date.now()+600000});
   }
   if(path==='/api/admin/override'&&method==='POST'){
    assert.equal(req.headers().authorization,'Bearer '+'a'.repeat(43));
    const data=req.postDataJSON();
    assert.equal(data.expectedValue,Object.hasOwn(values,data.key)?values[data.key]:null,
     'editor must preserve D1 compare-and-swap contract');
    values[data.key]=data.value;writes.push(data);
    return reply({ok:true,key:data.key,value:data.value,conditional:true});
   }
   if(path==='/api/library')return reply({records:[]});
   if(path==='/api/runtime-capabilities')return reply({ownerProgressionD1:true});
   return route.abort();
  });
  return ctx;
 };
 const key='guideedit.book.equipment.soul-unavailable-zero.belt';
 const owner=await newContext(),page=await owner.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 const guestAssertions=async p=>{
  assert.equal(await p.locator('#authState').count(),0,
   'No editor status element in ordinary DOM');
  assert.equal(await p.locator('#ownerDock').count(),0);
  assert.equal(await p.locator('.stage-soul-unavailable-pencil').count(),0);
  assert.equal(await p.locator('.studio-owner-interface-editor,.ui-content-pencil').count(),0);
  const body=await p.locator('body').innerText();
  assert.doesNotMatch(body,/Cloudflare|\bD1\b|\bCAS\b|\/api\/|администратор|режим редактора|добавлено редактором/i);
 };
 const openBelt=async p=>{
  await p.locator('.equipment-slot[data-slot-index="11"]').click();
  const root=p.locator('#stagePicker');
  await root.locator('[data-stage-tab="souls"]').click();
  await root.locator('.stage-soul-unavailable').waitFor({state:'visible'});
  return root;
 };
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  let picker=await openBelt(page);
  await guestAssertions(page);
  assert.match(await picker.locator('.stage-soul-unavailable').innerText(),/пояса.*0 слотов для душ/);
  await page.locator('#profileTrigger').click();
  assert.equal(await page.locator('.account-admin-entry').count(),0);
  await page.locator('#profileTrigger').click();
  // Hidden gesture keeps an owner entry point without a guest affordance.
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#authState').count(),1,
   'Editor status appears only after confirmed login');
  picker=await openBelt(page);
  const pencil=picker.locator('.stage-soul-unavailable-pencil');
  await pencil.waitFor({state:'visible'});
  await pencil.click();
  const input=picker.locator('.stage-soul-unavailable [contenteditable]');
  await input.waitFor({state:'visible'});
  await input.fill('У этого пояса нет слотов для душ.');
  const ruSave=page.waitForResponse(res=>
   res.url().endsWith('/api/admin/override')&&res.request().postDataJSON()?.key===key,
   {timeout:12000});
  await input.press('Tab');
  assert.equal((await ruSave).status(),200);
  await page.waitForFunction(()=>document.querySelector(
   '#stagePicker .stage-soul-unavailable')?.textContent==='У этого пояса нет слотов для душ.',
   null,{timeout:12000});
  assert.equal(JSON.parse(values[key]).ru,'У этого пояса нет слотов для душ.');
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  picker=await openBelt(page);
  await picker.locator('.stage-soul-unavailable-pencil').click();
  const enInput=picker.locator('.stage-soul-unavailable [contenteditable]');
  await enInput.fill('This belt has no Soul sockets.');
  const enSave=page.waitForResponse(res=>
   res.url().endsWith('/api/admin/override')&&res.request().postDataJSON()?.key===key,
   {timeout:12000});
  await enInput.press('Tab');
  assert.equal((await enSave).status(),200);
  assert.deepEqual(JSON.parse(values[key]),{
   ru:'У этого пояса нет слотов для душ.',en:'This belt has no Soul sockets.'
  });
  assert.equal(writes.length,2);
 }finally{await owner.close()}
 // A fresh guest browser with only public D1 reads sees BOTH saved languages.
 const guest=await newContext(),view=await guest.newPage();
 view.on('pageerror',error=>errors.push(error.message));
 try{
  await view.goto(publicOrigin+'/',{waitUntil:'domcontentloaded'});
  await view.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  let picker=await openBelt(view);
  assert.equal((await picker.locator('.stage-soul-unavailable').innerText()).trim(),
   'У этого пояса нет слотов для душ.');
  await guestAssertions(view);
  await view.locator('#locale [data-locale="en"]').click();
  await view.waitForFunction(()=>document.documentElement.lang==='en');
  picker=await openBelt(view);
  assert.equal((await picker.locator('.stage-soul-unavailable').innerText()).trim(),
   'This belt has no Soul sockets.');
  await guestAssertions(view);
  assert.deepEqual(errors,[]);
 }finally{await guest.close()}
 console.log('Chromium D1 public copy 874: owner RU/EN CAS saves, guest reload and no admin UI passed');
}
