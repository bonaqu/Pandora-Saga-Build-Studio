import assert from 'node:assert/strict';
import {cpus,platform,arch} from 'node:os';

// Real Chromium timings on the GitHub Actions runner, not estimates and not
// measurements of a user's own device. All off-site requests are blocked.
export async function runEncyclopediaPerformanceSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 await context.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const results=[];
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-list [data-wiki-record]').first()
   .waitFor({state:'visible',timeout:20000});
  for(const chapter of ['item','monster','soul']){
   await page.locator('[data-wiki-chapter="'+chapter+'"]').click();
   await page.locator('.wiki-list [data-wiki-record]').first()
    .waitFor({state:'visible',timeout:20000});
   const result=await page.evaluate(async()=>{
    const browse=document.querySelector('.wiki-list');
    const input=document.querySelector('.wiki-controls input[type="search"]');
    const render=[],search=[];
    let rowCount=browse.querySelectorAll('[data-wiki-record]').length;
    for(let i=0;i<5;i++){
     const more=browse.querySelector('.wiki-more');
     if(!more)break;
     const start=performance.now();more.click();
     render.push(+(performance.now()-start).toFixed(2));
     rowCount=Math.max(rowCount,browse.querySelectorAll('[data-wiki-record]').length);
    }
    const measure=term=>new Promise((resolve,reject)=>{
     let done=false;
     const start=performance.now();
     const stop=(error)=>{
      if(done)return;done=true;clearTimeout(timeout);observer.disconnect();
      if(error)reject(error);else resolve(+(performance.now()-start).toFixed(2));
     };
     const observer=new MutationObserver(()=>{
      const rows=browse.querySelectorAll('[data-wiki-record]').length;
      if(term?rows===0:rows>0)stop();
     });
     observer.observe(browse,{childList:true,subtree:true});
     const timeout=setTimeout(()=>stop(new Error('Wiki search UI did not settle')),3500);
     input.value=term;
     input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    for(let i=0;i<3;i++){
     search.push(await measure('unlikely-encyclopedia-test-'+i));
     search.push(await measure(''));
    }
    return {rowsExpanded:rowCount,expandedClicks:render.length,
     expansionMs:render,searchMs:search,restored:browse.querySelectorAll('[data-wiki-record]').length};
   });
   assert.ok(result.restored>0,chapter+' must restore results after searching');
   results.push({chapter,...result});
  }
  assert.deepEqual(errors,[],'Browser console exceptions during performance audit');
  const quantile=(values,q)=>{
   if(!values.length)return null;
   const sorted=values.slice().sort((a,b)=>a-b);
   return sorted[Math.floor((sorted.length-1)*q)];
  };
  const report=results.map(row=>({
   chapter:row.chapter,rowsExpanded:row.rowsExpanded,expandedClicks:row.expandedClicks,
   expansionMedianMs:quantile(row.expansionMs,0.5),expansionP95Ms:quantile(row.expansionMs,0.95),
   searchMedianMs:quantile(row.searchMs,0.5),searchP95Ms:quantile(row.searchMs,0.95),
   samples:{expansion:row.expansionMs,search:row.searchMs}
  }));
  const cpu=cpus()[0]?.model||'unavailable';
  console.log('Chromium encyclopedia performance: '+JSON.stringify({
   runner:{platform:platform(),arch:arch(),cpu},measurement:'actual headless Chromium on CI runner; not a user-device benchmark',
   dataSource:'local bundled game snapshot; off-site traffic blocked',chapters:report
  }));
 }finally{await context.close()}
}
