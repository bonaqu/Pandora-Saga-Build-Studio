import assert from 'node:assert/strict';

// Real guest and signed-in character edits while the browser refuses writes.
export async function runDraftPersistenceWarningSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 async function check({account=false,english=false}={}){
  const user='draft_warn_01',token='v'.repeat(43);
  const context=await browser.newContext({viewport:{width:1250,height:850}});
  if(account||english)await context.addInitScript(({account,english,user,token})=>{
   if(english)localStorage.setItem('ps-build-lang','en');
   if(account)localStorage.setItem('ps-account-session.v1',
    JSON.stringify({username:user,token,expires:Number.MAX_SAFE_INTEGER}));
  },{account,english,user,token});
  const errors=[];
  await context.route('**/*',route=>{
   const req=route.request(),url=req.url();
   if(url.startsWith(base+'/'))return route.continue();
   if(!url.startsWith(api+'/'))return route.abort();
   const headers={'access-control-allow-origin':'*',
    'access-control-allow-headers':'Authorization,Content-Type',
    'access-control-allow-methods':'GET,POST,OPTIONS'};
   const send=(data,status=200)=>route.fulfill({
    status,headers,contentType:'application/json',body:JSON.stringify(data)});
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(new URL(url).pathname==='/api/account/me')return send({account:{username:user}});
   if(new URL(url).pathname==='/api/library')return send({records:[]});
   return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0,
    null,{timeout:30000});
   if(account)await page.waitForFunction(()=>
    document.querySelector('#profileTrigger')?.dataset.accountBootstrap==='verified',
    null,{timeout:20000});
   await page.locator('[data-origin-tab="stats"]').click();
   await page.evaluate(()=>{
    window.__draftTestSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
     if(String(key).startsWith('ps-build-scope-cache.v1:'))
      throw new DOMException('Simulated quota','QuotaExceededError');
     return window.__draftTestSetItem.call(this,key,value);
    };
   });
   await page.locator('#level').focus();
   await page.locator('#level').press('ArrowRight');
   const warning=page.locator('#draftStorageWarning');
   await warning.waitFor({state:'visible'});
   assert.match(await warning.innerText(),english?/not saved/i:/не сохранены/);
   const count=await page.locator('#draftStorageWarning').count();
   await page.locator('#level').press('ArrowRight');
   assert.equal(await page.locator('#draftStorageWarning').count(),count,
    'Only one persistent warning is shown during repeated failed writes');
   await page.evaluate(()=>{
    Storage.prototype.setItem=window.__draftTestSetItem;
    delete window.__draftTestSetItem;
   });
   await page.locator('#level').press('ArrowRight');
   await warning.waitFor({state:'detached'});
   const current=Number(await page.locator('#levelOut').textContent());
   const saved=await page.evaluate(()=>JSON.parse(
    localStorage.getItem('ps-build-studio.v1')||'null'));
   assert.equal(saved.level,current,
    'After recovery the latest draft must be stored, not the stale value');
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 }
 await check();
 await check({account:true,english:true});
 console.log('Chromium guest/account draft persistence warning and recovery passed');
}
