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
   // The carousel mounts before asynchronous archive catalog bootstrap has
   // finished its initial draft persistence. Wait for the ready state so
   // a later startup write is never mistaken for an Escape-dialog write.
   await page.waitForFunction(()=>
    document.querySelector('#catalogStatus')?.textContent?.includes('навыков'),
    null,{timeout:30000});
   // Open from the normal editor, not from the separate My Builds backdrop:
   // a header control remains focusable while the link dialog is shown.
   const opener=page.locator('#profileTrigger');
   await opener.waitFor({state:'visible'});
   const savedBefore=await page.evaluate(()=>localStorage.getItem('ps-build-studio.v1'));
   await opener.focus();
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'profileTrigger');
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
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'profileTrigger',
    'Esc returns focus to the original visible header control');
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
