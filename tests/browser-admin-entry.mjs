import assert from 'node:assert/strict';

export async function runAdminEntrySmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const calls=[],context=await browser.newContext({viewport:{width:1280,height:860}});
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=route.request().method();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const json=(value,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(value)});
  if(path==='/api/library')return json({records:[]});
  if(path==='/api/overrides')return json({values:{}});
  if(path.startsWith('/api/account/')){
   calls.push(path);
   return json({error:'Аккаунты ещё не активированы в D1: требуется миграция 0005'},503);
  }
  if(path==='/api/admin/login'&&method==='POST'){
   const body=route.request().postDataJSON();
   calls.push(path);
   assert.equal(body.username,'administrator');
   assert.equal(body.password,'Correct admin password!');
   return json({token:'a'.repeat(43),expires:Date.now()+600000});
  }
  return route.abort();
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  await page.locator('#accountPanel .account-form input').first().fill('administrator');
  await page.locator('#accountPanel .account-form input').nth(1).fill('Correct admin password!');
  await page.locator('#accountPanel .account-form button[type=submit]').click();
  assert.match(await page.locator('#accountPanel .account-feedback').innerText(),
   /Для administrator используйте/);
  assert.equal(calls.filter(p=>p==='/api/account/login').length,0,
   'Legacy admin must not be routed to player account login');
  await page.getByRole('button',{name:'Вход администратора'}).click();
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]').fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  assert.deepEqual(calls.filter(p=>p==='/api/admin/login'),['/api/admin/login']);
  assert.deepEqual(errors,[]);
  console.log('Chromium admin entry passed: player accounts offline, legacy administrator login unaffected');
 }finally{await context.close()}
}

export async function runInlineMilestonesSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0);
  const group=page.locator('[data-path-group="prayer"]');
  if(await group.getAttribute('aria-expanded')!=='true')await group.click();
  const branch=page.locator('[data-path-branch="benevolence"]');
  if(await branch.getAttribute('aria-expanded')!=='true')await branch.click();
  const mark=page.locator('.path-threshold-tick').first();
  await mark.waitFor({state:'visible',timeout:20000});
  const result=await page.evaluate(()=>{
   const mark=document.querySelector('.path-threshold-tick');
   const bar=mark.closest('.inline-mastery-track');
   const tickRect=mark.getBoundingClientRect(),barRect=bar.getBoundingClientRect();
   const range=bar.querySelector('input[type=range]');
   const css=getComputedStyle(mark);
   return {markerTop:tickRect.top,markerBottom:tickRect.bottom,
    barTop:barRect.top,barBottom:barRect.bottom,rangeZ:getComputedStyle(range).zIndex,
    markerZ:css.zIndex,markerPointer:css.pointerEvents,range:range.getBoundingClientRect().toJSON()};
  });
  assert.ok(result.markerTop>=result.barTop&&result.markerBottom<=result.barBottom,
   'Skill marks must sit inside the same progress bar, not on a detached upper row: '+JSON.stringify(result));
  assert.equal(result.markerPointer,'auto');
  await mark.hover({force:true});
  await mark.locator('.path-milestone-tooltip').waitFor({state:'visible',timeout:4000});
  assert.ok((await mark.locator('.path-milestone-preview').count())>=1);
  await mark.focus();
  await mark.locator('.path-milestone-tooltip').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);
  console.log('Chromium skill track passed: milestone symbols embedded in bar, hover and keyboard tooltips');
 }finally{await context.close()}
}
