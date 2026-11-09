import assert from 'node:assert/strict';

// Keyboard semantics of the real account gate dialog, not a synthetic DOM model.
// The current hero and its local draft must remain unchanged after Escape.
export async function runModalKeyboardSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 async function check(width){
  const context=await browser.newContext({viewport:{width,height:820}});
  const errors=[],calls=[];
  await context.route('**/*',route=>{
   const req=route.request(),url=req.url();
   if(url.startsWith(base+'/'))return route.continue();
   if(!url.startsWith(api+'/'))return route.abort();
   calls.push(url);
   const headers={'access-control-allow-origin':'*',
    'access-control-allow-headers':'Authorization,Content-Type',
    'access-control-allow-methods':'GET,POST,OPTIONS'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   return route.fulfill({status:401,headers,contentType:'application/json',
    body:JSON.stringify({error:'Sign in required'})});
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0,
    null,{timeout:30000});
   const opener=page.locator('#nav [data-tab="builds"]');
   await opener.click();
   await page.locator('.build-signin-gate').waitFor({state:'visible'});
   const savedBefore=await page.evaluate(()=>localStorage.getItem('ps-build-studio.v1'));
   // A URL hashchange has no clicked invoker of its own. Focus the stable
   // navigation control explicitly to test real focus restoration.
   await opener.focus();
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-tab')),'builds');
   await page.evaluate(()=>{location.hash='#b/A1234567890'});
   const dialog=page.getByRole('dialog',{name:'Вход для открытия билда'});
   await dialog.waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>document.activeElement?.tagName),'H2');
   assert.match(await page.evaluate(()=>document.activeElement?.textContent),/Вход для открытия билда/);
   await page.keyboard.press('Tab');
   assert.match(await page.evaluate(()=>document.activeElement?.textContent),/Закрыть/);
   await page.keyboard.press('Shift+Tab');
   assert.match(await page.evaluate(()=>document.activeElement?.textContent),/Регистрация/);
   await page.keyboard.press('Tab');
   assert.match(await page.evaluate(()=>document.activeElement?.textContent),/Закрыть/);
   await page.keyboard.press('Tab');
   assert.match(await page.evaluate(()=>document.activeElement?.textContent),/Войти/);
   await page.keyboard.press('Escape');
   await dialog.waitFor({state:'hidden'});
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-tab')),'builds',
    'Esc returns focus to the navigation control that was focused before link dialog');
   assert.equal(await page.evaluate(()=>localStorage.getItem('ps-build-studio.v1')),savedBefore,
    'Keyboard cancellation must not replace or save the current character');
   assert.equal(await page.evaluate(()=>location.hash),'#b/A1234567890',
    'Closing the sign-in dialog must not erase an incoming shared link');
   assert.equal(calls.filter(url=>url.includes('/api/library')||url.includes('/api/shared')).length,0,
    'A guest must not fetch account builds while navigating the sign-in dialog');
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 }
 await check(1280);
 await check(390);
 console.log('Chromium modal keyboard focus: Tab, Shift+Tab, Escape, draft safety and mobile passed');
}
