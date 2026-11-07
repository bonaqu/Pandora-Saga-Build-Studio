import assert from 'node:assert/strict';
import {cpus,platform,arch} from 'node:os';

// Timings are from Chromium running on this machine with bundled OS data.
// Off-site requests are blocked so results are comparable across runs.
export async function runEncyclopediaPerformanceSmoke(browser,base,{environment='CI runner'}={}){
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
  for(const chapter of ['item','utility','monster','skill','soul']){
   await page.locator('[data-wiki-chapter="'+chapter+'"]').click();
   await page.locator('.wiki-list [data-wiki-record]').first()
    .waitFor({state:'visible',timeout:20000});
   const result=await page.evaluate(async()=>{
    const browse=document.querySelector('.wiki-list');
    const input=document.querySelector('.wiki-controls input[type="search"]');
    const render=[],search=[],knownMatchSearch=[];
    let rowCount=browse.querySelectorAll('[data-wiki-record]').length;
    for(let i=0;i<5;i++){
     const more=browse.querySelector('.wiki-more');
     if(!more)break;
     const start=performance.now();more.click();
     render.push(+(performance.now()-start).toFixed(2));
     rowCount=Math.max(rowCount,browse.querySelectorAll('[data-wiki-record]').length);
    }
    // Focus unlocks the approved anti-autofill readOnly guard, just as a
    // real user does before entering a query. The input event still measures
    // the same debounced UI handler independent of keyboard typing speed.
    input.focus();
    const measure=(term,nonempty=false)=>new Promise((resolve,reject)=>{
     let done=false;
     const start=performance.now();
     const stop=(error)=>{
      if(done)return;done=true;clearTimeout(timeout);observer.disconnect();
      if(error)reject(error);else resolve(+(performance.now()-start).toFixed(2));
     };
     const observer=new MutationObserver(()=>{
      const rows=browse.querySelectorAll('[data-wiki-record]').length;
      if(nonempty?rows>0:rows===0)stop();
     });
     observer.observe(browse,{childList:true,subtree:true});
     const timeout=setTimeout(()=>stop(new Error('Wiki search UI did not settle')),3500);
     input.value=term;
     input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    for(let i=0;i<3;i++){
     search.push(await measure('unlikely-encyclopedia-test-'+i));
     search.push(await measure('',true));
    }
    // An actual popular single-letter term exercises live matching and
    // visible-row rendering, unlike only searching an impossible string.
    for(let i=0;i<2;i++){
     knownMatchSearch.push(await measure('а',true));
     search.push(await measure('',true));
    }
    return {rowsExpanded:rowCount,expandedClicks:render.length,
     expansionMs:render,searchMs:search,knownMatchSearchMs:knownMatchSearch,
     restored:browse.querySelectorAll('[data-wiki-record]').length};
   });
   assert.ok(result.restored>0,chapter+' must restore results after searching');
   results.push({chapter,...result});
  }
  assert.deepEqual(errors,[],'Browser console exceptions during performance audit');
  const quantile=(values,q)=>{
   if(!values.length)return null;
   const sorted=values.slice().sort((a,b)=>a-b);
   return sorted[Math.max(0,Math.ceil(sorted.length*q)-1)];
  };
  const report=results.map(row=>({
   chapter:row.chapter,rowsExpanded:row.rowsExpanded,expandedClicks:row.expandedClicks,
   expansionMedianMs:quantile(row.expansionMs,0.5),expansionP95Ms:quantile(row.expansionMs,0.95),
   searchMedianMs:quantile(row.searchMs,0.5),searchP95Ms:quantile(row.searchMs,0.95),
   knownMatchMedianMs:quantile(row.knownMatchSearchMs,0.5),
   knownMatchP95Ms:quantile(row.knownMatchSearchMs,0.95),
   samples:{expansion:row.expansionMs,search:row.searchMs,
    matching:row.knownMatchSearchMs}
  }));
  const cpu=cpus()[0]?.model||'unavailable';
  console.log('Chromium encyclopedia performance: '+JSON.stringify({
   runner:{platform:platform(),arch:arch(),cpu},measurement:'actual headless Chromium on '+environment,
   dataSource:'local bundled game snapshot; off-site traffic blocked',chapters:report
  }));
 }finally{await context.close()}
}
