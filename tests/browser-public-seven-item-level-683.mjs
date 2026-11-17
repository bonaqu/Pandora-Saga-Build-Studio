// #683 post-publication acceptance in REAL Chromium against published Pages
// and public D1 Worker. No login, no admin session, no D1 write.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const SITE='https://bonaqu.github.io/Pandora-Saga-Build-Studio/';
const D1='https://ps-build-studio-cloud.bonaqu.workers.dev/api/catalog/items.json';
const IDS=['19010','19011','20027','20028','21019','21020','22022'];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1366,height:860}});
await context.addInitScript(()=>{
 localStorage.setItem('ps-build-studio.v1',JSON.stringify({
  race:1,gender:0,job:0,level:49,equipment:{
   8:{id:19010,name:'Магическое кольцо'}
  },souls:{},refinements:{},gems:{}
 }));
});
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(SITE,{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:60000});
 await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='49'&&
  document.querySelectorAll('.equipment-slot').length===14,
  null,{timeout:45000});
 // Invoke the deployed (not a test-mocked) game rules against the real
 // published D1 records, rather than the local GitHub backup.
 const validation=await page.evaluate(async({url,ids})=>{
  const response=await fetch(url+'?qa683='+Date.now(),{cache:'no-store'});
  if(!response.ok||response.headers.get('x-ps-catalog')!=='d1')
   throw Error('Live item response is not from D1');
  const items=await response.json();
  if(Object.keys(items).length!==1140)throw Error('D1 item count changed');
  const rules=window.PandoraStudioRules,planner=window.PandoraUIPlanner;
  if(!rules?.equipment||!planner?.equippable)throw Error('Deployed equipment rules unavailable');
  return ids.map(id=>{
   const item=items[id];
   if(!item)throw Error('Missing D1 item '+id);
   const args={slot:item.slot,job:'WARRIOR',level:49};
   const under=rules.equipment(item,args).allowed;
   const equal=rules.equipment(item,{...args,level:50}).allowed;
   const gated=planner.equippable([item],item.slot,'WARRIOR',49,(obj,ctx)=>
    rules.equipment(obj,ctx)).map(obj=>obj.id);
   const available=planner.equippable([item],item.slot,'WARRIOR',50,(obj,ctx)=>
    rules.equipment(obj,ctx)).map(obj=>obj.id);
   return {id,level:item.level,under,equal,gated,available};
  });
 },{url:D1,ids:IDS});
 for(const item of validation){
  assert.equal(item.level,50,item.id);
  assert.equal(item.under,false,item.id+' must be unavailable at 49');
  assert.equal(item.equal,true,item.id+' must become available at 50');
  assert.deepEqual(item.gated,[],item.id+' must be absent in available-only picker at 49');
  assert.deepEqual(item.available,[Number(item.id)],item.id+' must be selectable at 50');
 }
 // Verify a saved planned ring in the actual public DOM: unavailable at 49,
 // automatically active at 50. Then open the Hero Book with that gear.
 const ring=page.locator('.equipment-slot[data-slot-index="8"]');
 await ring.waitFor({state:'visible'});
 assert.ok(await ring.evaluate(node=>node.classList.contains('unavailable')),
  'Planned ring unexpectedly active at level 49');
 await page.locator('#level').evaluate(node=>{
  node.value='50';node.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='50'&&
  !document.querySelector('.equipment-slot[data-slot-index="8"]')?.classList.contains('unavailable'),
  null,{timeout:30000});
 assert.ok(await ring.evaluate(node=>node.classList.contains('equipped')),
  'Ring should remain equipped after level change');
 await page.locator('#hero').click();
 await page.locator('#stageAttributes').waitFor({state:'visible',timeout:30000});
 assert.ok(await page.locator('#stageBookPanel .stage-result-tile').count()>0,
  'Hero Book must render computed stats with the newly unlocked equipment');
 assert.deepEqual(errors,[],'Public Hero Book or gear UI script errors');
 console.log('PUBLIC CHROMIUM VERIFIED: D1 levels 50 for all seven; rule and picker 49=no / 50=yes; ring transitions, Book renders');
}finally{
 await context.close();
 await browser.close();
}
