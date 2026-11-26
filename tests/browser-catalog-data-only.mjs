import assert from 'node:assert/strict';
// Real browser boots with whichever reviewed JSON snapshot is currently published.
export async function runCatalogDataBrowserSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  const status=await page.evaluate(async()=>{
   const names=['meta','classes','skills','items','souls','monsters','drops','maps',
    'instances','racialPassives','itemForth','unison','trades','tables','expertise',
    'chests','strings.en'];
   const rows=await Promise.all(names.map(async name=>{
    const response=await fetch('data/os/'+name+'.json');
    if(!response.ok)throw Error('Game catalog is unavailable: '+name);
    return [name,await response.json()];
   }));
   const data=Object.fromEntries(rows);
   for(const [name,expected] of Object.entries(data.meta.counts)){
    if(!Object.hasOwn(data,name))continue;
    const found=name==='trades'?data.trades.trades.length:
     name==='instances'?data.instances.length:Object.keys(data[name]).length;
    if(found!==expected)throw Error('Source count mismatch: '+name);
   }
   return {datasets:rows.length,monsters:Object.keys(data.monsters).length,
    chests:data.chests.boxes.length,appReady:Boolean(document.querySelector('#nav'))};
  });
  assert.equal(status.datasets,17);
  assert.ok(status.monsters>0&&status.chests>0&&status.appReady);
  assert.deepEqual(errors,[]);
  console.log('Chromium catalog fast path: live app boot and 17 JSON datasets passed');
 }finally{await context.close()}
}
