import assert from 'node:assert/strict';
export async function runFutureGearSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(()=>{
  if(sessionStorage.getItem('future-gear-boot'))return;
  sessionStorage.setItem('future-gear-boot','1');
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:0,level:45,equipment:{}
  }));
 });
 await context.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('.equipment-slot[data-slot-index="0"]').click();
  const search=page.locator('#stagePicker input[type="search"]');
  await search.waitFor({state:'visible',timeout:20000});
  await search.fill('Рычащий меч');
  const future=page.locator('#stagePicker .stage-picker-item.future');
  await future.waitFor({state:'visible',timeout:20000});
  assert.match(await future.innerText(),/Будет доступен с 53 уровня/);
  await future.click();
  const weapon=page.locator('.equipment-slot[data-slot-index="0"]');
  await weapon.waitFor({state:'visible'});
  assert.match(await weapon.getAttribute('class'),/unavailable/);
  await page.locator('#level').evaluate(el=>{
   el.value='53';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='53'&&
   !document.querySelector('.equipment-slot[data-slot-index="0"].unavailable'),null,{timeout:20000});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.equal(saved.equipment[0].id,422);
  assert.deepEqual(errors,[]);
  console.log('Chromium future gear passed: level-53 sword planned at 45, automatically available at 53');
 }finally{await context.close()}
}
