import assert from 'node:assert/strict';

// Browser-level cloud reconciliation with a fake Worker: production D1 is untouched.
export async function runCloudConflictSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const id='e'.repeat(32),secret='f'.repeat(64);
 const local={id,name:'Local Hero',at:100,data:{race:1,job:16,gender:0,level:55}};
 const remote={...local,name:'Cloud Hero',data:{...local.data,level:54}};
 const cloud=new Map([[id,remote]]),writes=[];
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.addInitScript(({secret,local})=>{
  if(sessionStorage.getItem('ps-cloud-conflict-test-seeded')==='1')return;
  sessionStorage.setItem('ps-cloud-conflict-test-seeded','1');
  localStorage.setItem('ps-build-library-secret.v1',secret);
  localStorage.setItem('ps-build-library.v1',JSON.stringify([local]));
  localStorage.setItem('ps-build-studio.v1',JSON.stringify(local.data));
  localStorage.setItem('ps-active-build-id.v1',local.id);
 },{secret,local});
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=route.request().method();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'content-type,authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const json=(data,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(path==='/api/library'){
   if(method==='GET')return json({records:[...cloud.values()].map(entry=>({
    id:entry.id,entry,deleted:false
   }))});
   const body=route.request().postDataJSON();
   if(body?.action==='put'){writes.push(body.entry);cloud.set(body.entry.id,body.entry);
    return json({ok:true,revision:body.entry.at})}
   return json({error:'Invalid test write'},400);
  }
  return route.abort();
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
   try{return JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]').length===2}
   catch{return false}
  },null,{timeout:20000});
  const result=await page.evaluate(()=>{
   const rows=JSON.parse(localStorage.getItem('ps-build-library.v1'));
   return{rows,active:localStorage.getItem('ps-active-build-id.v1')};
  });
  assert.equal(result.rows.find(b=>b.id===id).data.level,54);
  const copy=result.rows.find(b=>b.id!==id);
  assert.ok(copy,'Lost local build instead of preserving it as a new ID');
  assert.equal(copy.data.level,55);
  assert.equal(copy.localOnly,true);
  assert.match(copy.name,/локальная копия/);
  assert.equal(result.active,copy.id);
  await page.waitForFunction(id=>Array.from(JSON.parse(localStorage.getItem(
   'ps-build-library.v1')||'[]')).some(x=>x.id!==id),id);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0);
  const retained=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]'));
  assert.equal(retained.length,2,'Reload caused repeated conflict copies');
  assert.equal(retained.find(b=>b.id===id)?.data.level,54);
  assert.ok(retained.some(b=>b.id!==id&&b.data.level===55));
  assert.equal(cloud.size,1,'Conflict copy must never be uploaded by refresh');
  assert.equal(writes.length,0);
  await page.locator('#nav [data-tab="builds"]').click();
  const note=page.locator('.build-local-only-note');
  await note.waitFor({state:'visible'});
  await page.locator('.build-card').filter({has:note}).getByRole('button',{name:'Поделиться'}).click();
  assert.equal(writes.length,0,'Sharing a local-only copy must not create a cloud build');
  assert.match(await page.locator('.build-card').filter({has:note}).innerText(),/Сначала откройте эту локальную копию/);
  await page.locator('.build-card').filter({has:note}).getByRole('button',{name:'Перезаписать'}).click();
  assert.equal(writes.length,0,'Opening overwrite confirmation must not PUT');
  await page.getByRole('button',{name:'Подтвердить перезапись'}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')
   .some(x=>x.id!=='eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'&&x.localOnly!==true&&x.data.level===55));
  await page.waitForTimeout(400);
  assert.equal(writes.length,1,'Explicit overwrite must upload exactly once');
  assert.equal(cloud.size,2,'Both cloud original and deliberately saved copy remain');
  assert.deepEqual(errors,[]);
  console.log('Chromium cloud merge smoke passed: conflict retained in separate saved copy across reload');
 }finally{await context.close();}
}
