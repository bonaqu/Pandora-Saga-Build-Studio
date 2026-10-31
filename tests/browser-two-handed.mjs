import assert from 'node:assert/strict';

// Real UI check against the current OS catalog; no remote services are touched.
export async function runTwoHandedSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(()=>{
  if(sessionStorage.getItem('ps-offhand-seeded')==='1')return;
  sessionStorage.setItem('ps-offhand-seeded','1');
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:0,level:40,equipment:{
    0:{id:401,name:'Меч двойного удара'},1:{id:17001,name:'Легкий щит'}
   }
  }));
 });
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const shield=page.locator('.equipment-slot[data-slot-index="1"]');
  await page.waitForFunction(()=>
   document.querySelector('.equipment-slot[data-slot-index="1"].unavailable')&&
   document.querySelector('#levelOut')?.textContent==='40',null,{timeout:20000});
  assert.match(await shield.getAttribute('aria-label'),/Двуручное оружие занимает обе руки/);
  await page.locator('#level').evaluate(el=>{
   el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>
   document.querySelector('#levelOut')?.textContent==='3'&&
   !document.querySelector('.equipment-slot[data-slot-index="1"].unavailable'),
   null,{timeout:20000});
  assert.equal(await shield.count(),1,'Lower level may not erase the saved shield');
  await page.locator('#level').evaluate(el=>{
   el.value='55';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>
   document.querySelector('#levelOut')?.textContent==='55'&&
   document.querySelector('.equipment-slot[data-slot-index="1"].unavailable'),
   null,{timeout:20000});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.equal(saved.equipment[0].id,401);assert.equal(saved.equipment[1].id,17001);
  assert.deepEqual(errors,[]);
  console.log('Chromium two-handed conflict passed: shield preserved, inactive only when 2H weapon usable');
 }finally{await context.close();}
}
