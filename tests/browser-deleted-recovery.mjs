import assert from 'node:assert/strict';

export async function runDeletedBuildRecoverySmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const removedId='d'.repeat(32),secret='7'.repeat(64);
 const local={id:removedId,name:'Lost offline hero',at:120,
  data:{race:1,job:16,gender:0,level:55}};
 const cloud=new Map(),writes=[];
 const ctx=await browser.newContext({viewport:{width:1365,height:850}});
 await ctx.addInitScript(({secret,local})=>{
  if(sessionStorage.getItem('ps-tombstone-test-seeded'))return;
  sessionStorage.setItem('ps-tombstone-test-seeded','1');
  localStorage.setItem('ps-build-library-secret.v1',secret);
  localStorage.setItem('ps-build-library.v1',JSON.stringify([local]));
  localStorage.setItem('ps-build-studio.v1',JSON.stringify(local.data));
  localStorage.setItem('ps-active-build-id.v1',local.id);
 },{secret,local});
 await ctx.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=route.request().method();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  const send=(body,status=200)=>route.fulfill({status,headers,
   contentType:'application/json',body:JSON.stringify(body)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/library'){
   if(method==='GET')return send({records:[
    {id:removedId,deleted:true,entry:null},
    ...[...cloud.values()].map(entry=>({id:entry.id,entry,deleted:false}))
   ]});
   const body=route.request().postDataJSON();
   writes.push(body);
   if(body.action==='put'&&body.entry.id!==removedId){
    cloud.set(body.entry.id,body.entry);return send({ok:true});
   }
   return send({error:'Deleted ID must never be recreated'},409);
  }
  return route.abort();
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(id=>{
   const list=JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]');
   return list.length===1&&list[0].id!==id&&list[0].localOnly===true;
  },removedId,{timeout:20000});
  const recovery=await page.evaluate(()=>{
   const items=JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]');
   return {item:items[0],active:localStorage.getItem('ps-active-build-id.v1')};
  });
  assert.equal(recovery.item.data.level,55);
  assert.match(recovery.item.name,/копия удалённого билда/);
  assert.equal(recovery.active,recovery.item.id);
  assert.equal(writes.length,0,'No automatic D1 PUT for a deleted saved build');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0);
  const afterReload=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]'));
  assert.equal(afterReload.length,1);
  assert.equal(afterReload[0].id,recovery.item.id);
  await page.locator('#nav [data-tab="builds"]').click();
  await page.getByRole('button',{name:'Перезаписать'}).click();
  assert.equal(writes.length,0);
  await page.getByRole('button',{name:'Подтвердить перезапись'}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')
   .some(x=>x.localOnly!==true));
  await page.waitForFunction(()=>document.querySelector('.cloud-library-status')?.textContent.includes('Сохранено в облаке'));
  assert.equal(writes.length,1);
  assert.equal(writes[0].entry.id,recovery.item.id);
  assert.equal(cloud.size,1);
  assert.equal(cloud.has(removedId),false);
  assert.deepEqual(errors,[]);
  console.log('Chromium deleted-build recovery passed: local-only copy, stable after refresh, explicit publication');
 }finally{await ctx.close()}
}
