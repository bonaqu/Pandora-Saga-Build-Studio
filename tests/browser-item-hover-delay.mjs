import assert from 'node:assert/strict';

// Reproduces the reported path: Equipment -> Spata -> Used in NPC trades
// -> hover "Прочная спата". The shared item-preview controller is also used
// by monster loot, Honor cloaks, chest rewards, souls and equipped gear.
export async function runItemHoverDelaySmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:850}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const tooltip=page.locator('#stage-gear-tooltip');
 const clearPointer=()=>page.mouse.move(1,1);
 const hover=async(locator,step)=>{
  try{await locator.hover({timeout:6500})}
  catch(error){
   const state=await page.evaluate(()=>({
    hash:location.hash,active:document.activeElement?.tagName,
    references:[...document.querySelectorAll('.wiki-recipe-use a.wiki-recipe-result')]
     .map(node=>({text:node.textContent,visible:!!node.getClientRects().length,
      box:node.getBoundingClientRect().toJSON()}))
   }));
   throw new Error('Hover '+step+' failed '+JSON.stringify(state)+'; '+error.message);
  }
 };
 // Observe the actual hover and first DOM insertion in the SAME browser
 // clock. A 140ms Playwright wait can take >650ms on a busy CI runner and
 // falsely accuse the site of opening an instant tooltip.
 const timedHover=async(locator,step)=>{
  await clearPointer();
  assert.equal(await tooltip.count(),0,'No tooltip before '+step+' pointerenter');
  await locator.evaluate(node=>{
   const sample={entered:null,shown:null};
   window.__itemHoverClock=sample;
   node.addEventListener('pointerenter',()=>{sample.entered=performance.now()},
    {capture:true,once:true});
   const watch=new MutationObserver(()=>{
    if(sample.shown!==null)return;
    if(document.querySelector('#stage-gear-tooltip')){
     sample.shown=performance.now();
     watch.disconnect();
    }
   });
   watch.observe(document.body,{childList:true,subtree:true});
  });
  await hover(locator,step);
  await tooltip.waitFor({state:'visible',timeout:2500});
  const elapsed=await page.evaluate(()=>{
   const probe=window.__itemHoverClock;
   return probe?.entered!=null&&probe?.shown!=null?
    probe.shown-probe.entered:null;
  });
  assert.ok(typeof elapsed==='number'&&elapsed>=550,
   step+' should wait for the shared 650ms hover delay; observed '+elapsed);
 };
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>/\d+ навыков · \d+ предметов · \d+ душ/.test(
   document.querySelector('#catalogStatus')?.textContent||''),null,{timeout:20000});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-equipment-type').waitFor({state:'visible'});
  await page.locator('.wiki-list [data-wiki-record]').first().click();
  await page.waitForURL(/#wiki\/item\/1$/);
  const spata=page.locator('#detailContent .wiki-recipe-use a.wiki-recipe-result')
   .filter({hasText:'Прочная спата'}).first();
  await spata.waitFor({state:'visible',timeout:20000});
  await spata.scrollIntoViewIfNeeded();
  await timedHover(spata,'Spata NPC trade');
  assert.match(await tooltip.locator('.stage-rich-head strong').innerText(),
   /Прочная спата/);
  const owner=await page.evaluate(()=>{
   const popup=document.querySelector('#stage-gear-tooltip');
   const anchor=document.querySelector('[aria-describedby="stage-gear-tooltip"]');
   return {text:anchor?.textContent||'',connected:!!anchor?.isConnected,
    popupConnected:!!popup?.isConnected};
  });
  assert.equal(owner.connected,true,'Preview must belong to a connected item link');
  assert.equal(owner.popupConnected,true);
  assert.match(owner.text,/Прочная спата/);
  assert.equal(await tooltip.evaluate(node=>getComputedStyle(node).pointerEvents),
   'none','A floating rich tooltip must not steal pointer events');
  await clearPointer();
  assert.equal(await tooltip.count(),0,'The rich preview must close on pointer exit');

  // A brief cursor pass must never open a tooltip later, after the reader
  // has already moved on to a different part of the article.
  await hover(spata,'Spata NPC trade');
  await page.waitForTimeout(120);
  await clearPointer();
  await page.waitForTimeout(750);
  assert.equal(await tooltip.count(),0,
   'Cancelled hover must never produce a delayed stray preview');

  // Crossing neighboring item links must cancel the first timer and
  // display only the item currently under the pointer.
  const allRewards=page.locator('#detailContent .wiki-recipe-use a.wiki-recipe-result');
  assert.ok(await allRewards.count()>=2,'Spata must have multiple NPC-trade outputs');
  const another=allRewards.filter({hasNotText:'Прочная спата'}).first();
  await another.scrollIntoViewIfNeeded();
  await clearPointer();
  await hover(spata,'Spata NPC trade');
  await page.waitForTimeout(110);
  await hover(another,'neighboring Spata recipe');
  await page.waitForTimeout(150);
  assert.equal(await tooltip.count(),0,'Switching items must not show a stale preview');
  await tooltip.waitFor({state:'visible',timeout:2500});
  assert.equal((await tooltip.locator('.stage-rich-head strong').innerText()).trim(),
   (await another.innerText()).trim(),'Only the currently hovered item may be previewed');
  assert.equal(await page.locator('#stage-gear-tooltip').count(),1);
  await clearPointer();
  assert.equal(await tooltip.count(),0);

  // Scrolling moves the pointer off an article link and must cancel its
  // pending tooltip; if a link stays hovered, the timer is re-armed.
  await spata.scrollIntoViewIfNeeded();
  await clearPointer();
  await hover(spata,'Spata NPC trade');
  await page.waitForTimeout(100);
  await page.locator('#detailContent').evaluate(node=>{
   const max=node.scrollHeight-node.clientHeight;
   node.scrollTop=node.scrollTop>max/2?0:max;
  });
  await page.waitForFunction(()=>
   ![...document.querySelectorAll('.wiki-recipe-use a.wiki-recipe-result')]
    .some(node=>node.textContent.includes('Прочная спата')&&node.matches(':hover')),
   null,{timeout:2000});
  await page.waitForTimeout(780);
  assert.equal(await tooltip.count(),0,
   'Scrolling off an item must not leave a pending rich tooltip');
  await spata.scrollIntoViewIfNeeded();
  await clearPointer();

  await page.keyboard.press('Tab');
  await spata.focus();
  assert.equal(await spata.evaluate(node=>node.matches(':focus-visible')),true,
   'Keyboard navigation must retain its visible focus indicator');
  await tooltip.waitFor({state:'visible',timeout:2000});
  assert.equal(await spata.getAttribute('aria-describedby'),'stage-gear-tooltip');
  await page.keyboard.press('Escape');
  assert.equal(await tooltip.count(),0,'Escape closes focused item preview');
  await page.waitForTimeout(100);
  assert.equal(await tooltip.count(),0,'Escape must cancel post-focus animation-frame preview too');
  assert.equal(await spata.getAttribute('aria-describedby'),null);
  assert.equal(await page.evaluate(()=>location.hash),'#wiki/item/1',
   'First Escape must preserve Spata article and navigation state');
  assert.equal(await page.locator('#detailPanel').getAttribute('aria-modal'),'true',
   'Closing a preview must not close the Encyclopedia workbench');
  await spata.evaluate(node=>node.blur());

  // Escape must also cancel a scheduled (not yet visible) preview.
  await hover(spata,'Spata pending hover');
  await page.waitForTimeout(110);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(710);
  assert.equal(await tooltip.count(),0,'Escape cancels a not-yet-visible tooltip');
  assert.equal(await page.evaluate(()=>location.hash),'#wiki/item/1');
  await clearPointer();

  // A pending hover cannot leak into the next page after a click.
  await hover(spata,'Spata NPC trade');
  await page.waitForTimeout(90);
  await spata.click();
  await page.waitForURL(/#wiki\/item\/2(?:\/1)?$/);
  await page.waitForTimeout(750);
  assert.equal(await tooltip.count(),0,'Navigation cancels pending item preview');

  // Same delay and cancellation policy in a different encyclopedia chapter.
  await page.goto(base+'/#wiki/monster/21103',{waitUntil:'domcontentloaded'});
  const loot=page.locator('.wiki-loot-chip a.wiki-link').first();
  await loot.waitFor({state:'visible',timeout:20000});
  await loot.scrollIntoViewIfNeeded();
  await timedHover(loot,'monster loot');
  await clearPointer();
  assert.equal(await tooltip.count(),0);

  // The cloak uses the same shared handler, not an immediate Honor-only copy.
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-categories [data-wiki-chapter="honor"]').click();
  const cloak=page.locator('.wiki-honor-cloak-link').first();
  await cloak.waitFor({state:'visible',timeout:20000});
  await cloak.scrollIntoViewIfNeeded();
  await timedHover(cloak,'Honor cloak');
  // A rebuild can detach the hovered link without dispatching pointerleave.
  await cloak.evaluate(node=>node.remove());
  await tooltip.waitFor({state:'detached',timeout:2000});
  assert.equal(await tooltip.count(),0,'Removed cloak source must close rich preview');
  assert.deepEqual(errors,[]);
  console.log('Chromium item tooltip timing: Spata NPC trade, loot, Honor cloak, keyboard, Escape and navigation');
 }finally{await context.close()}
}
