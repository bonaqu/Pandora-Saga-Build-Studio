import assert from 'node:assert/strict';

// The item picker is exercised with the published source snapshot only.
// No game client, production D1, private account, or external request is used.
export async function runItemPropertiesArrow866Smoke(browser,base){
 for(const [lang,width] of [['ru',1280],['en',390]]){
  const context=await browser.newContext({viewport:{width,height:800}});
  await context.addInitScript(({lang})=>{
   localStorage.setItem('ps-build-lang',lang);
   localStorage.setItem('ps-build-studio.v1',JSON.stringify({
    race:1,gender:0,job:7,level:45,name:'Arrow QA',
    stats:{},points:{},mastery:{},
    equipment:{5:{id:13041,name:'Железные поножи'}},
    souls:{},refinements:{},gems:{}
   }));
  },{lang});
  await context.route('**/*',route=>
   route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
   await page.locator('.equipment-slot[data-slot-index="5"]').click();
   const picker=page.locator('#stagePicker');
   const properties=picker.locator('[data-stage-tab="details"].chosen');
   await properties.waitFor({state:'visible',timeout:15000});
   await picker.locator('[data-stage-tab="choose"]').click();
   const link=picker.locator('.stage-picker-mode-link');
   await link.waitFor({state:'visible',timeout:15000});
   assert.equal(await link.getAttribute('aria-label'),
    lang==='en'?'Go to properties':'Перейти к свойствам');
   assert.equal(await link.getAttribute('data-gear-action-icon'),'→',
    'Forward shortcut must use the shared icon source');
   const glyph=await link.evaluate(el=>getComputedStyle(el,'::before').content);
   assert.ok(glyph.includes('→'),'Arrow must point right toward properties: '+glyph);
   assert.equal(await link.getAttribute('title'),null,
    'No duplicate native tooltip on a self-explanatory arrow');
   await link.hover();
   await page.waitForTimeout(430);
   assert.equal(await page.locator('#stage-guide-tooltip:visible').count(),0,
    'Forward navigation must not create a duplicate guide popup');
   await link.click();
   await properties.waitFor({state:'visible',timeout:15000});
   assert.equal(await picker.locator('.stage-picker-slot-title').count(),1);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 }
 console.log('Chromium properties arrow 866: right-facing glyph, RU/EN, touch-width layout, no extra tooltip');
}
