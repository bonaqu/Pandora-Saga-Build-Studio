import assert from 'node:assert/strict';

async function fresh(browser,base,equipment,extras={}){
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 await context.addInitScript(({equipment,extras})=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:3,gender:0,job:21,level:55,equipment,...extras
  }));
 },{equipment,extras});
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?
  r.continue():r.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#catalogStatus')?.textContent
  ?.includes('предметов')&&document.querySelectorAll('.equipment-slot').length===14,
  null,{timeout:25000});
 return {page,context,errors};
}

export async function runEquipmentQuickMenuSmoke(browser,base){
 const first=await fresh(browser,base,{
  5:{id:13041,name:'Железные поножи'},
  11:{id:21001,name:'Пояс'}
 },{
  socketCapacities:{'5:13041':2,'11:21001':0},
  refinements:{'5:13041':3},gems:{'5:13041':{element:'fire'}},
  souls:{5:[{id:103001,name:'Душа'}]},soulOwners:{5:'13041'}
 });
 try{
  const {page,errors}=first;
  const pants=page.locator('.equipment-slot[data-slot-index="5"]');
  const belt=page.locator('.equipment-slot[data-slot-index="11"]');
  const menu=page.locator('.stage-gear-context-menu[role="menu"]');
  const action=id=>menu.locator('[data-gear-context-action="'+id+'"]');
  const right=async locator=>locator.click({button:'right'});
  const emptyWeapon=page.locator('.equipment-slot[data-slot-index="0"]');
  await right(emptyWeapon);
  await menu.waitFor({state:'visible'});
  assert.equal(await menu.locator('[role="menuitem"]').count(),1);
  assert.equal((await action('choose').innerText()).trim(),'+\nВыбрать вещь');
  await action('choose').click();
  assert.equal(await page.locator('#stagePicker .stage-picker-list').isVisible(),true);
  await page.locator('#stagePicker .stage-picker-head button[aria-label="Закрыть выбор"]').click();

  await right(pants);
  await menu.waitFor({state:'visible'});
  assert.equal(await menu.locator('[role="menuitem"]').count(),4);
  assert.deepEqual(await menu.locator('[role="menuitem"]').allTextContents(),
   ['◇Свойства','◈Управление душами','⇄Выбрать другую вещь','×Снять вещь']);
  assert.equal(await action('souls').isEnabled(),true);
  const bounds=await menu.boundingBox();
  assert.ok(bounds.x>=7&&bounds.x+bounds.width<=1366-7,
   'Context menu overlaps right screen edge: '+JSON.stringify(bounds));
  assert.ok(bounds.y>=7&&bounds.y+bounds.height<=900-7,
   'Context menu overlaps bottom screen edge: '+JSON.stringify(bounds));
  await action('properties').click();
  assert.equal(await menu.count(),0);
  assert.equal(await page.locator('#stagePicker [data-stage-tab="details"]')
   .getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#stagePicker .stage-rich-fields dd[data-soul-fill]')
   .innerText(),'1/2');
  await page.locator('#stagePicker .stage-picker-head button').first().click();

  await right(pants);
  await action('souls').click();
  assert.equal(await page.locator('#stagePicker [data-stage-tab="souls"]')
   .getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#stagePicker [data-socket-index]').count(),2);
  const soulInput=page.locator('#stagePicker [data-soul-query]');
  assert.equal(await soulInput.getAttribute('autocomplete'),'none');
  assert.equal(await soulInput.getAttribute('data-lpignore'),'true');
  await soulInput.fill('bonaqu');
  assert.equal(await soulInput.inputValue(),'bonaqu','Ordinary Soul search remains editable');
  await page.locator('#stagePicker .stage-picker-head button').first().click();

  await pants.focus();
  await pants.press('Shift+F10');
  await menu.waitFor({state:'visible'});
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.gearContextAction),
   'souls','Keyboard ArrowDown selects the next valid action');
  await page.keyboard.press('Escape');
  assert.equal(await menu.count(),0);
  assert.equal(await pants.evaluate(el=>document.activeElement===el),true,
   'Escape returns focus to the equipped slot without opening Properties');

  await right(pants);
  await action('replace').click();
  assert.equal(await page.locator('#stagePicker .stage-picker-list').isVisible(),true);
  assert.equal(await page.locator('.equipment-slot[data-slot-index="5"].equipped').count(),1);
  await page.locator('#stagePicker .stage-picker-head button[aria-label="Закрыть выбор"]').click();

  await right(belt);
  await menu.waitFor({state:'visible'});
  assert.equal(await action('souls').isDisabled(),true,
   'No Soul sockets: menu explains why Manage Souls is unavailable');
  assert.match(await action('souls').getAttribute('title'),/нет доступных слотов/i);
  await page.mouse.click(5,5);
  assert.equal(await menu.count(),0,'Outside click dismisses menu');

  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await right(belt);
  assert.match(await action('properties').innerText(),/Properties/);
  assert.match(await action('souls').innerText(),/Manage Souls/);
  assert.match(await action('replace').innerText(),/Choose another item/);
  assert.match(await action('remove').innerText(),/Unequip item/);
  await page.keyboard.press('Escape');

  await right(pants);
  await action('remove').click();
  await page.waitForFunction(()=>!document.querySelector(
   '.equipment-slot[data-slot-index="5"]')?.classList.contains('equipped'));
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.equal(saved.equipment[5],undefined);
  assert.equal(saved.souls?.[5],undefined,
   'Unequipping via context menu must use normal Soul cleanup logic');
  assert.equal(saved.equipment[11]?.id,21001,'Other worn items remain untouched');
  for(const key of ['refinements','gems','socketCapacities'])
   assert.equal(saved[key]?.['5:13041'],undefined,
    'Unequipped copy must discard '+key);
  await right(page.locator('.equipment-slot[data-slot-index="5"]'));
  await menu.waitFor({state:'visible'});
  assert.equal(await menu.locator('[role="menuitem"]').count(),1);
  assert.match(await action('choose').innerText(),/Choose item/);
  await action('choose').click();
  assert.equal(await page.locator('#stagePicker .stage-picker-list').isVisible(),true);
  const original=page.locator('#stagePicker [data-stage-choice="13041"]');
  if(await original.count()){
   await original.click();
   const now=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
   assert.equal(Number(now.equipment[5]?.id),13041);
   assert.equal(now.refinements?.['5:13041'],undefined);
   assert.equal(now.gems?.['5:13041'],undefined);
   assert.equal(now.socketCapacities?.['5:13041'],undefined);
   assert.equal(now.souls?.[5],undefined);
  }
  assert.deepEqual(errors,[]);
  console.log('Chromium quick gear menu passed: left/right, four actions, keyboard, RU/EN and Soul cleanup');
 }finally{await first.context.close()}

 // A projected leg slot represents one actual piece of armor; menu operations
 // must modify its owning armor slot, not invent a duplicated leg item.
 const outfit=await fresh(browser,base,{
  3:{id:12616,name:'Зеленое астирское платье'}
 });
 try{
  const {page,errors}=outfit;
  const legs=page.locator('.equipment-slot[data-slot-index="5"]');
  assert.match(await legs.getAttribute('class'),/shared-outfit/);
  await legs.click({button:'right'});
  const menu=page.locator('.stage-gear-context-menu');
  await menu.waitFor({state:'visible'});
  await menu.locator('[data-gear-context-action="properties"]').click();
  assert.match(await page.locator('#stagePicker .stage-picker-head strong').innerText(),/Броня/);
  await page.locator('#stagePicker .stage-picker-head button').first().click();
  await legs.click({button:'right'});
  await menu.locator('[data-gear-context-action="replace"]').click();
  assert.equal(await page.locator('#stagePicker .stage-picker-list').isVisible(),true,
   'Replacing projected pants still opens the pants catalog');
  await page.locator('#stagePicker .stage-picker-head button[aria-label="Закрыть выбор"]').click();
  await legs.click({button:'right'});
  await menu.locator('[data-gear-context-action="remove"]').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.equal(saved.equipment[3],undefined,'Removing projected garment removes real armor');
  assert.equal(saved.equipment[5],undefined,'No phantom pants are ever persisted');
  assert.deepEqual(errors,[]);
  console.log('Chromium one-piece garment context menu passed: owner slot, replace and unequip');
 }finally{await outfit.context.close()}
}
