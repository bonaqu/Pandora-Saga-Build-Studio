import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const items=JSON.parse(readFileSync(new URL('../data/os/items.json',import.meta.url),'utf8'));
const dress=items['12616'];
const weapon=Object.values(items).find(item=>item?.slot==='weapon'&&
 Number(item.soulslot)>=2&&Number(item.soulslot)<=3&&
 Number(item.level||1)<=55&&item.isCostumeOverlay!==true);
assert.ok(dress?.slot==='body'&&weapon,'Local OS equipment test fixtures are missing');

async function contextFor(browser,base,equipment){
 const context=await browser.newContext({viewport:{width:1365,height:900}});
 await context.addInitScript(equipment=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:3,gender:0,job:21,level:55,equipment
  }));
 },equipment);
 await context.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#catalogStatus')?.textContent?.includes('предметов')&&
  document.querySelector('.equipment-slot[data-slot-index="5"]'),null,{timeout:25000});
 return {page,context,errors};
}
const scrollState=page=>page.locator('#stagePicker').evaluate(root=>({
 body:root.querySelector('.stage-rich-body')?.scrollTop||0,
 list:root.querySelector('.stage-rich-list')?.scrollTop||0
}));

export async function runOutfitSoulScrollSmoke(browser,base){
 const first=await contextFor(browser,base,{3:{id:dress.id,name:dress.name}});
 try{
  const {page,errors}=first;
  await page.locator('[data-origin-tab="class"]').click();
  const wizardSteps=page.locator('.class-wizard-progress .class-wizard-step');
  assert.equal(await wizardSteps.count(),3,'Profession wizard has exactly three steps');
  const wizardGeometry=await wizardSteps.evaluateAll(rows=>rows.map(row=>{
   const rect=row.getBoundingClientRect(),label=row.lastElementChild?.getBoundingClientRect();
   return {top:Math.round(rect.top),bottom:Math.round(rect.bottom),
    labelCenter:label?Math.round(label.top+label.height/2):null};
  }));
  assert.ok(wizardGeometry.every(row=>row.top===wizardGeometry[0].top&&
   row.bottom===wizardGeometry[0].bottom&&row.labelCenter===wizardGeometry[0].labelCenter),
   'Direction, Profession and Specialization stay aligned: '+JSON.stringify(wizardGeometry));
  const armor=page.locator('.equipment-slot[data-slot-index="3"]');
  const pants=page.locator('.equipment-slot[data-slot-index="5"]');
  assert.match(await armor.getAttribute('class'),/equipped/);
  assert.match(await pants.getAttribute('class'),/equipped/);
  assert.match(await pants.getAttribute('class'),/shared-outfit/);
  assert.match(await pants.getAttribute('aria-label'),/Занято бронёй/);
  assert.equal(await pants.locator('.stage-shared-mark').innerText(),'🔒',
   'Projected one-piece garment has an unobtrusive lock icon');
  assert.equal(await pants.isEnabled(),true,
   'The visual lock is not a disabled button; pants must remain replaceable');
  const dimmed=await pants.locator('small').first().evaluate(el=>getComputedStyle(el).filter);
  assert.match(dimmed,/brightness/,'Projected dress appearance must be visually subdued');
  assert.match(await page.locator('#catalogStatus').innerText(),
   /^Наша база данных состоит из: \d+ навыков · \d+ предметов · \d+ душ$/);
  assert.equal(await page.locator('#iconStatus').isHidden(),true);
  assert.equal(await page.locator('header a small').first().innerText(),'CHARACTER PLANNER');
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')).equipment);
  assert.equal(before[3].id,dress.id);
  assert.equal(before[5],undefined,'one outfit is stored once, not double counted');

  await pants.click();
  const list=page.locator('#stagePicker .stage-picker-list');
  const choices=list.locator('.stage-picker-item');
  assert.ok(await choices.count()>0,'Pants remain selectable despite the dress');
  const selected=choices.first();
  assert.match(await selected.locator('.stage-picker-item-label small').innerText(),
   /^Уровень (?:\d+|—) · Слоты: (?:\d+|—)$/,
   'Every equipment candidate exposes its exact source-backed socket capacity');
  await selected.hover();
  await page.locator('#stage-gear-tooltip').waitFor({state:'visible',timeout:5000});
  assert.ok((await page.locator('#stage-gear-tooltip').innerText()).trim().length>5,
   'actual rich item hover works inside equipment choice lists');
  const selectedId=Number(await selected.getAttribute('data-stage-choice'));
  await selected.click();
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')).equipment);
  assert.equal(after[3],undefined,'Choosing pants removes the dress from armor');
  assert.equal(Number(after[5].id),selectedId,'Chosen pants occupy the pants slot');
  assert.doesNotMatch(await pants.getAttribute('class'),/shared-outfit/);
  await page.locator('.equipment-slot[data-slot-index="0"]').click();
  const weapons=page.locator('#stagePicker .stage-picker-item');
  assert.ok(await weapons.count()>0,'Weapon picker has equipment choices');
  await weapons.first().hover();
  await page.locator('#stage-gear-tooltip').waitFor({state:'visible',timeout:5000});
  assert.deepEqual(errors,[]);
 }finally{await first.context.close()}

 const second=await contextFor(browser,base,{0:{id:weapon.id,name:weapon.name}});
 try{
  const {page,errors}=second;
  await page.locator('.equipment-slot[data-slot-index="0"]').click();
  const gradeButtons=page.locator('#stagePicker .stage-grade button');
  assert.equal(await gradeButtons.count(),11,'All forge levels +0…+10 must remain available');
  const gradeTops=await gradeButtons.evaluateAll(nodes=>
   nodes.map(el=>Math.round(el.getBoundingClientRect().top)));
  assert.ok(gradeTops.every(top=>top===gradeTops[0]),
   'All eleven forge grades remain on one horizontal row, not two');
  const elements=page.locator('#stagePicker [data-enchant-key="element"]');
  assert.equal(await elements.count(),7,'All seven source elements are still selectable');
  const elementTops=await elements.evaluateAll(nodes=>
   nodes.map(el=>Math.round(el.getBoundingClientRect().top)));
  assert.equal(new Set(elementTops).size,2,'Element selector is a compact 4+3 layout');
  assert.match(await page.locator('#stagePicker [data-enchant-value="fire"]').innerText(),/🔥/);
  assert.match(await page.locator('#stagePicker [data-enchant-value="rainbow"]').innerText(),/🌈/);
  await page.locator('#stagePicker [data-enchant-key="element"][data-enchant-value="ice"]').click();
  assert.equal(await page.locator('#stagePicker [data-enchant-key="element"][data-enchant-value="ice"]').getAttribute('aria-pressed'),'true',
   'Choosing a compact element remains a functional, persisted selection');
  await gradeButtons.nth(4).click();
  assert.equal(await page.locator('#stagePicker [data-grade="4"]').getAttribute('aria-pressed'),'true',
   'Condensed grade controls must still change the actual selected grade');
  const choose=page.locator('#stagePicker [data-stage-tab="choose"]');
  assert.equal(await choose.count(),1);
  await page.locator('#stagePicker [data-stage-tab="souls"]').click();
  const soulTab=page.locator('#stagePicker .stage-rich-tabs').getByRole('button',{name:'Души'});
  assert.equal(await soulTab.getAttribute('aria-pressed'),'true');
  const results=page.locator('#stagePicker .stage-rich-result');
  assert.ok(await results.count()>2,'Soul catalog is available in the first socket');
  const target=results.nth(Math.min(15,(await results.count())-1));
  await target.scrollIntoViewIfNeeded();
  await page.locator('#stagePicker .stage-rich-list').evaluate(list=>{
   list.scrollTop=Math.min(list.scrollHeight-list.clientHeight,Math.max(0,Math.floor(list.scrollHeight*.3)));
   list.dispatchEvent(new Event('scroll'));
  });
  // A real click naturally scrolls its own target into view. Align it BEFORE
  // taking the baseline; otherwise the test confuses browser auto-scroll with
  // a picker rerender jumping to the top.
  await target.scrollIntoViewIfNeeded();
  const initial=await scrollState(page);
  await target.click();
  const afterSoul=await scrollState(page);
  assert.ok(Math.abs(afterSoul.list-initial.list)<=10,
   'Inserting a soul must not jump the soul list back to the beginning: '+
   JSON.stringify({initial,afterSoul}));
  await page.locator('#stagePicker [data-socket-index="1"]').click();
  const afterSwitch=await scrollState(page);
  assert.ok(Math.abs(afterSwitch.list-initial.list)<=10,
   'Changing from first to second socket retains the soul-list position: '+
   JSON.stringify({initial,afterSwitch}));
  assert.ok(Math.abs(afterSwitch.body-afterSoul.body)<=10,
   'Soul picker main body must also retain scroll state');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.ok(saved.souls?.[0]?.[0]?.id!=null,'The chosen soul must actually be saved');
  // The separate inventory picker replaces the rich properties tabs.
  // Visit it AFTER the Soul workflow, as a real player would.
  await page.locator('#stagePicker [data-stage-tab="choose"]').click();
  const selectedEquipment=page.locator('#stagePicker .stage-picker-item').first();
  assert.match(await selectedEquipment.locator('.stage-picker-item-label small').innerText(),
   /^Уровень (?:\d+|—) · Слоты: (?:\d+|—)$/);
  assert.deepEqual(errors,[]);
 }finally{await second.context.close()}
 console.log('Chromium 0.389 accepted: shared armor+pants, choice hover, pants replacement, soul list scroll');
}
