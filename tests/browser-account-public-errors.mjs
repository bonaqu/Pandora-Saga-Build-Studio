import assert from 'node:assert/strict';

// Public account feedback: the API speaks English; the UI follows RU/EN,
// while unexpected server diagnostics and transport exceptions stay hidden.
export async function runAccountPublicErrorsSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const context=await browser.newContext({viewport:{width:1160,height:850}});
 let responseKind='invalid',calls=0;
 await context.route('**/*',async route=>{
  const req=route.request(),url=req.url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Authorization,Content-Type',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  const send=(data,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(data)});
  const path=new URL(url).pathname;
  if(path==='/api/overrides')return send({values:{}});
  if(path==='/api/health')return send({status:'ok'});
  if(path==='/api/library')return send({records:[]});
  if(path==='/api/account/login'){
   calls++;
   if(responseKind==='offline')return route.abort('failed');
   if(responseKind==='diagnostic')
    return send({error:'Cloudflare Worker D1 SQL exception /api/admin/private'},503);
   return send({error:'Invalid username or password'},401);
  }
  return route.abort();
 });
 const page=await context.newPage(),pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 const feedback=()=>page.locator('#accountPanel .account-feedback');
 const showFeedback=async expected=>{
  await page.waitForFunction(value=>document.querySelector(
   '#accountPanel .account-feedback')?.textContent===value,expected,
   {timeout:15000});
  assert.equal(await feedback().textContent(),expected);
  assert.equal(await feedback().getAttribute('data-owner-copy-key'),null,
   'API errors cannot masquerade as owner-authored D1 copy');
 };
 const submit=async()=>{
  const form=page.locator('#accountPanel .account-form');
  await form.locator('input').nth(0).fill('example_user');
  await form.locator('input').nth(1).fill('wrong-password');
  await form.locator('button[type=submit]').click();
 };
 const switchLanguage=async lang=>{
  await page.locator('#locale [data-locale="'+lang+'"]').click();
  await page.waitForFunction(target=>document.documentElement.lang===target,lang);
  await page.waitForFunction(()=>!document.querySelector('#accountPanel')?.classList.contains('is-closing'),
   null,{timeout:12000});
  if(!(await page.locator('#accountPanel').isVisible()))
   await page.locator('#profileTrigger').click();
 };
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  await submit();
  await showFeedback('Неверный логин или пароль.');
  await switchLanguage('en');
  await showFeedback('Invalid username or password.');
  responseKind='diagnostic';
  await submit();
  await showFeedback('Service temporarily unavailable. Try again later.');
  assert.doesNotMatch(await feedback().textContent(),/Cloudflare|Worker|D1|SQL|api\/admin/i);
  await switchLanguage('ru');
  await showFeedback('Сервис временно недоступен. Повтори попытку позже.');
  responseKind='offline';
  await submit();
  await showFeedback('Не удалось подключиться. Проверь соединение и повтори попытку.');
  assert.equal(calls,3);
  assert.equal(await page.locator('#ownerDock,#authState,.ui-content-pencil').count(),0,
   'Guest must not see owner tools while an account error is displayed');
  assert.deepEqual(pageErrors,[]);
  console.log('Chromium account public errors: localized 401, 503, offline, RU/EN refresh and guest isolation passed');
 }finally{await context.close()}
}
