import assert from 'node:assert/strict';

// A real catalog fire sword, equipped to a level-45 Warrior, not a fake
// invented item or an unverified game-client observation.
export async function runConditionalFire867Smoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 await context.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:0,level:45,
   equipment:{0:{id:252,name:'Огненный меч пламени'}},
   refinements:{'0:252':7},
   gems:{'0:252':{type:'physical',element:'fire'}}
  }));
 });
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  const slot=page.locator('.equipment-slot[data-slot-index="0"].equipped');
  await slot.waitFor({state:'visible',timeout:25000});
  assert.equal(await page.locator('.stage-elemental-proc').count(),0,
   'No unexplained star badge belongs on the hero rail');
  await slot.click();
  const panel=page.locator('#stagePicker');
  await panel.locator('.stage-rich-fields').waitFor({state:'visible'});
  const activeEffect=async()=>panel.locator('.stage-rich-fields').evaluate(dl=>{
   const headings=[...dl.querySelectorAll('dt')];
   const values=[...dl.querySelectorAll('dd')];
   const at=headings.findIndex(node=>['Особый эффект','Special effect']
    .includes(node.textContent.trim()));
   return at<0?null:values[at]?.textContent.trim()||null;
  });
  assert.equal(await activeEffect(),'Пламя феникса');
  const glyph=async name=>panel.locator('[data-stage-tab="'+name+'"]').evaluate(
   el=>getComputedStyle(el,'::before').content);
  assert.match(await glyph('choose'),/⇄/);
  assert.match(await glyph('souls'),/○/);
  await panel.locator('[data-grade="6"]').click();
  assert.equal(await activeEffect(),null,'+6 is below the fire effect gate');
  await panel.locator('[data-grade="7"]').click();
  assert.equal(await activeEffect(),'Пламя феникса');
  await panel.locator('[data-enchant-key="element"][data-enchant-value="ice"]').click();
  assert.equal(await activeEffect(),null,'Changing fire to ice deactivates Phoenix');
  await panel.locator('[data-enchant-key="element"][data-enchant-value="fire"]').click();
  assert.equal(await activeEffect(),'Пламя феникса');
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en',null,{timeout:20000});
  await page.waitForFunction(()=>[...document.querySelectorAll('#stagePicker .stage-rich-fields dd')]
   .some(node=>node.textContent.trim()==='Phoenix Flame'),null,{timeout:20000});
  assert.equal(await activeEffect(),'Phoenix Flame','English item status has its own label');
  assert.equal(await page.locator('.stage-elemental-proc').count(),0);
  assert.deepEqual(errors,[],'Unexpected browser exceptions');
  console.log('Chromium conditional fire UX: grade, element and RU/EN status passed');
 }finally{await context.close()}
}
