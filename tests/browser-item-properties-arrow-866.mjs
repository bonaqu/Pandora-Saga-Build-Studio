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
    socketCapacities:{'5:13041':2},
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
   const chooseGroup=picker.locator('.stage-rich-choose-group');
   const settings=picker.locator('.stage-rich-settings-group');
   assert.equal(await chooseGroup.locator('[data-stage-tab="choose"]').count(),1);
   assert.equal(await settings.locator('[data-stage-tab="details"]').count(),1);
   assert.equal(await settings.locator('[data-stage-tab="souls"]').count(),1);
   const chooseBox=await chooseGroup.boundingBox(),settingsBox=await settings.boundingBox();
   assert.ok(chooseBox.x+chooseBox.width<=settingsBox.x-4,
    'Choose is visually separated from grouped item settings');
   assert.ok(Math.abs(chooseBox.y-settingsBox.y)<2,
    'Both groups share one compact row');
   const soulDivider=await settings.locator('[data-stage-tab="souls"]').evaluate(
    element=>getComputedStyle(element.closest('.stage-action-edit-wrap')||element).borderLeftWidth);
   assert.notEqual(soulDivider,'0px','Properties and Souls have a visible separator');
   await picker.locator('[data-stage-tab="choose"]').click();
   const link=picker.locator('.stage-picker-mode-link');
   await link.waitFor({state:'visible',timeout:15000});
   assert.equal(await link.getAttribute('aria-label'),
    lang==='en'?'Go to properties':'Перейти к свойствам');
   assert.equal(await link.locator('svg[data-gear-icon="arrow-right"]').count(),1,
     'Forward shortcut must reuse the common right-facing SVG');
    assert.equal((await link.locator('.stage-picker-mode-caption').innerText()).trim(),
     lang==='en'?'Properties':'Свойства');
    assert.equal(await link.locator('svg path').first().getAttribute('d'),'M5 12h14',
     'Arrow shaft should point right');
    assert.equal(await link.locator('svg path').nth(1).getAttribute('d'),'M13 6l6 6-6 6',
     'Arrow tip must be inside the 24x24 SVG viewBox, not clipped');
    const tip=await link.locator('svg path').nth(1).evaluate(path=>{
     const {x,y,width,height}=path.getBBox();return{x,y,width,height}
    });
    assert.ok(tip.x>=0&&tip.y>=0&&tip.width>0&&tip.height>0&&
     tip.x+tip.width<=24&&tip.y+tip.height<=24,
     'Right arrowhead is visible inside the icon: '+JSON.stringify(tip));
   const unequip=picker.locator('.stage-picker-unequip');
   assert.equal(await unequip.count(),1);
   assert.equal(await unequip.locator('svg[data-gear-icon="remove"]').count(),1);
   assert.equal((await unequip.innerText()).trim(),lang==='en'?'Unequip item':'Снять предмет');
   assert.equal(await unequip.isEnabled(),true);
   assert.equal(await unequip.evaluate(el=>getComputedStyle(el).borderRadius),'4px');
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
