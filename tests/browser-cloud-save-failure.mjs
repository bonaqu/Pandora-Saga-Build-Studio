import assert from 'node:assert/strict';

export async function runCloudSaveFailureSmoke(browser,base){
 const API='https://ps-build-studio-cloud.bonaqu.workers.dev',secret='6'.repeat(64);
 const id='c'.repeat(32),entry={id,at:101,name:'Offline Hero',
  data:{race:1,gender:0,job:16,level:45,name:'Offline Hero'}};
 const writes=[];
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.addInitScript(({entry,secret})=>{
  if(sessionStorage.getItem('ps-save-failure-seeded'))return;
  sessionStorage.setItem('ps-save-failure-seeded','1');
  localStorage.setItem('ps-build-library-secret.v1',secret);
  localStorage.setItem('ps-build-library.v1',JSON.stringify([entry]));
  localStorage.setItem('ps-build-studio.v1',JSON.stringify(entry.data));
  localStorage.setItem('ps-active-build-id.v1',entry.id);
 },{entry,secret});
 await context.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(API+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(route.request().method()==='OPTIONS')
   return route.fulfill({status:204,headers});
  const reply=(status,body)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(body)});
  if(new URL(url).pathname!=='/api/library')return route.abort();
  if(route.request().method()==='GET')
   return reply(200,{records:[{id,entry,deleted:false}]});
  writes.push(route.request().postDataJSON());
  return reply(503,{error:'Cloud temporarily unavailable'});
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0);
  await page.locator('[data-origin-tab="stats"]').click();
  await page.locator('#level').focus();
  await page.locator('#level').press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='46');
  await page.locator('#nav [data-tab="builds"]').click();
  await page.getByRole('button',{name:'Перезаписать'}).click();
  await page.getByRole('button',{name:'Подтвердить перезапись'}).click();
  await page.waitForFunction(()=>document.querySelector('.cloud-library-status')?.textContent.includes('облако недоступно'));
  assert.ok((await page.locator('#studioToast').innerText()).includes(
   'Сохранено в браузере. Проверяем запись в облаке…'));
  assert.ok(!(await page.locator('#studioToast').innerText()).includes(
   'Билд перезаписан по вашему запросу.'));
  assert.equal(writes.length,1);
  assert.equal(writes[0].entry.data.level,46);
  const locallySaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-library.v1')));
  assert.equal(locallySaved.find(x=>x.id===id).data.level,46);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
   const rows=JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]');
   return rows.some(x=>x.localOnly===true&&x.data.level===46);
  });
  assert.equal(writes.length,1,'Refresh must not auto-PUT a conflict recovery copy');
  assert.deepEqual(errors,[]);
  console.log('Chromium cloud failure passed: local overwrite preserved, no fake D1 success, conflict retained');
 }finally{await context.close()}
}
