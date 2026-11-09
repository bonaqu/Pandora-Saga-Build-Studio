import assert from 'node:assert/strict';

// Replays reported player failures with an OPEN Hero Book, offline OS data and
// the real browser editor. No account login or production D1 writes.
export async function runHeroBookLiveRecalcSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const saved={race:1,gender:0,job:8,level:45,name:'Live Hero Book regression',
  stats:{'Сноровка':3},points:{archery:50,alchemy:26},
  masteryAuto:false,masteryFormat:2,mastery:{archery:55,alchemy:30},
  equipment:{},souls:{},refinements:{},gems:{},
  vitalsBuffs:{guildHp:0,guildMp:0},attributeBuffs:{guildAll:0,priestEnabled:false}};
 await context.addInitScript(({saved})=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify(saved));
  sessionStorage.setItem('ps-studio-navigation.v2',JSON.stringify({
   origin:'stats',skillGroup:'tactics',groupTouched:true,expandedBranch:'alchemy'
  }));
 },{saved});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
   document.querySelector('#catalogStatus')?.textContent?.includes('навыков') &&
   document.querySelector('#originStats .origin-stat-input')?.value,
   null,{timeout:25000});
  const dex=page.locator('#originStats .origin-stat-input').nth(3);
  assert.equal(await dex.inputValue(),'9');
  const book=page.locator('#stageAttributes');
  await page.locator('#hero').click();
  await book.waitFor({state:'visible'});
  const result=label=>page.locator('#stageBookPanel .stage-result-tile').filter({hasText:label}).locator('strong');
  const numeric=async label=>Number((await result(label).innerText()).replace(/[^\d.-]/g,''));
  assert.equal(await numeric('Шанс крита'),1);
  const chapter=page.locator('#stageAttributes [data-book-page="summary"]');
  assert.equal(await chapter.getAttribute('aria-selected'),'true');

  // Spy on the real calculator without changing its return values. Previously
  // Origin and the open Book independently repeated the full base() pass.
  await page.evaluate(()=>{
   const calc=window.PandoraOSCalculator;
   window.__psCalculationCalls=0;
   window.PandoraOSCalculator={...calc,base:(...args)=>{
    window.__psCalculationCalls++;return calc.base(...args);
   }};
  });
  await dex.fill('10');await dex.press('Tab');
  assert.ok((await page.evaluate(()=>window.__psCalculationCalls))<=2,
   'Editing one stat must not run the same combat calculator again just for the Book');
  assert.equal(await numeric('Шанс крита'),2,'10 DEX did not update OPEN Book');
  await dex.fill('20');await dex.press('Tab');
  assert.equal(await numeric('Шанс крита'),3,'20 DEX did not update OPEN Book');
  assert.equal(await chapter.getAttribute('aria-selected'),'true','Book chapter changed on stat update');

  // The Archer passive reads the COMBINED green Tactics, not the blue bars.
  const accuracy85=await numeric('Точность');
  const alchemy=page.locator('[data-branch-control="alchemy:mastery-number"]');
  await alchemy.waitFor({state:'visible'});
  assert.equal(await alchemy.inputValue(),'30');
  await alchemy.fill('10');await alchemy.press('Tab');
  const accuracy65=await numeric('Точность');
  assert.equal(accuracy85-accuracy65,2,'85→65 Tactics did not update accuracy live');

  // Auto-mastering and resetting points use the same live calculation path.
  await page.locator('#pathAutoMastery').check();
  const accuracyAuto=await numeric('Точность');
  // Auto also trains SCOUT's 3 Assassin + 3 Warding starting points.
  assert.equal(accuracyAuto-accuracy85,1);
  await page.locator('#pathAutoMastery').uncheck();
  assert.equal(await numeric('Точность'),accuracy65);
  await page.locator('#pathAutoMastery').check();
  const slider=page.locator('[data-branch-control="alchemy:potential-range"]');
  await slider.evaluate(node=>{
   node.value='10';node.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await numeric('Точность'),accuracy65+1,
   'Dragging allocated points with auto mastery must recalculate live');
  assert.equal(await book.isVisible(),true);
  // A whole-site rerender previously rendered the same open Book three times
  // (stage picker, explicit Book call, and Origin vitals). Bound this cost.
  await page.evaluate(()=>{
   const book=window.PandoraStageAttributes;
   window.__psBookRenderCalls=0;
   window.PandoraStageAttributes={...book,render:(...args)=>{
    window.__psBookRenderCalls++;return book.render(...args);
   }};
  });
  await page.locator('#level').evaluate(node=>{
   node.value='46';node.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.ok((await page.evaluate(()=>window.__psBookRenderCalls))<=2,
   'A full redraw must not mount the already-open Hero Book three times');
  assert.equal(await book.isVisible(),true);
  assert.equal(await chapter.getAttribute('aria-selected'),'true');
  assert.deepEqual(errors,[]);
  console.log('Chromium live Hero Book passed: DEX 9→10→20, green Tactics 85→65, auto and slider');
 }finally{await context.close()}
}
