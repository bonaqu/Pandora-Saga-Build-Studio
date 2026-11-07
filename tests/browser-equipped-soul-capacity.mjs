import assert from 'node:assert/strict';

export async function runEquippedSoulCapacitySmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 await context.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:7,level:45,
   equipment:{5:{id:13041,name:'Железные поножи'},11:{id:21001,name:'Пояс'}},
   socketCapacities:{'5:13041':2,'11:21001':1}
  }));
 });
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?
  r.continue():r.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const cap=n=>page.locator('#stagePicker [data-socket-capacity="'+n+'"]');
 const openSlot=n=>page.locator('.equipment-slot[data-slot-index="'+n+'"]').click();
 const props=page.locator('#stagePicker');
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#catalogStatus')
   ?.textContent?.includes('предметов')&&
   document.querySelector('.equipment-slot[data-slot-index="5"].equipped'),
   null,{timeout:25000});
  await openSlot(5);
  await cap(2).waitFor({state:'visible'});
  assert.equal(await cap(2).getAttribute('aria-pressed'),'true');
  assert.equal(await props.locator('[data-stage-tab="souls"]').count(),1);
  assert.equal(await props.locator('.stage-rich-fields').evaluate(dl=>{
   const labels=[...dl.querySelectorAll('dt')].map(x=>x.textContent.trim());
   return dl.querySelectorAll('dd')[labels.indexOf('Слоты')]?.textContent;
  }),'2');
  await props.locator('[data-stage-tab="souls"]').click();
  assert.equal(await props.locator('[data-socket-index]').count(),2);
  await props.locator('[data-stage-tab="details"]').click();
  await cap(3).click();
  assert.equal(await cap(3).getAttribute('aria-pressed'),'true');
  await cap(2).click();
  // The equipped pants' override is per physical copy and persists locally.
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1'))
   ?.socketCapacities?.['5:13041']===2);
  await openSlot(11);
  await cap(1).waitFor({state:'visible'});
  assert.equal(await cap(1).getAttribute('aria-pressed'),'true');
  await props.locator('[data-stage-tab="souls"]').click();
  assert.equal(await props.locator('[data-socket-index]').count(),1);
  await props.locator('[data-stage-tab="details"]').click();
  await cap(0).click();
  assert.equal(await props.locator('[data-stage-tab="souls"]').count(),0,
   'A specific zero-socket belt must hide the Souls tab');
  await cap(1).click();
  assert.equal(await props.locator('[data-stage-tab="souls"]').count(),1);
  let draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.equal(draft.socketCapacities['5:13041'],2);
  assert.equal(draft.socketCapacities['11:21001'],1);
  await props.locator('.stage-picker-head button[aria-label="Закрыть настройку"]').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.equipment-slot[data-slot-index="11"].equipped'));
  await openSlot(5);
  assert.equal(await cap(2).getAttribute('aria-pressed'),'true');
  await props.locator('.stage-picker-head button[aria-label="Закрыть настройку"]').click();
  await page.locator('#locale [data-locale="en"]').click();
  await openSlot(11);
  assert.equal(await cap(1).getAttribute('aria-pressed'),'true');
  assert.equal(await cap(1).getAttribute('aria-label'),'Soul slots: 1');
  assert.deepEqual(errors,[]);
  console.log('Chromium per-equipped Soul capacity passed: pants 2, belt 1, change, reload, RU/EN');
 }finally{await context.close();}
}
