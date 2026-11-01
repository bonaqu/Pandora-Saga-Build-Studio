import assert from 'node:assert/strict';

// Isolated browser exercise of OS source level gates with persisted old equipment.
export async function runEquipmentEligibilitySmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:850}});
 await context.addInitScript(()=>{
  if(sessionStorage.getItem('ps-gear-test-initialized'))return;
  sessionStorage.setItem('ps-gear-test-initialized','1');
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:0,level:1,equipment:{2:{id:11094,name:'Кардинальская шапка'}}
  }));
 });
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
   const hp=document.querySelector('#originHp')?.textContent;
   return hp&&hp!=='—'&&document.querySelector('.equipment-slot[data-slot-index="2"].unavailable');
  },null,{timeout:20000});
  const underLevel=Number(await page.locator('#originHp').textContent());
  assert.ok(Number.isFinite(underLevel));
  await page.locator('#level').evaluate(el=>{
   el.value='38';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.locator('#levelOut').textContent(),'38');
  assert.equal(await page.locator('.equipment-slot[data-slot-index="2"].unavailable').count(),0);
  const withHat=Number(await page.locator('#originHp').textContent());
  await page.locator('.equipment-slot[data-slot-index="2"]').click();
  // An equipped slot opens its Properties page. Removal is in the "Выбор" mode.
  await page.locator('#stagePicker .stage-rich-tabs').getByRole('button',{name:'Выбор'}).click();
  await page.getByRole('button',{name:'Снять предмет'}).click();
  const withoutHat=Number(await page.locator('#originHp').textContent());
  assert.equal(withHat-withoutHat,50,'Level-38 Cardinal Cap must give precisely its OS HP bonus');
  // In the actual female-elf gear picker, male-only Astir and tailored armor
  // must be absent, while corresponding female versions stay selectable.
  for(const [slot,male,female] of [
   [3,'Астирская куртка','Астирское платье'],
   [4,'Астирские краги','Астирские перчатки'],
   [6,'Астирские башмаки','Астирские туфли'],
   [3,'Жилет для эльфа (М)','Жилет для эльфа (Ж)']
  ]){
   await page.locator('.equipment-slot[data-slot-index="'+slot+'"]').click();
   const search=page.locator('#stagePicker input[type="search"]');
   await search.waitFor({state:'visible'});
   await search.fill(male);
   assert.equal(await page.locator('#stagePicker .stage-picker-item').count(),0,
    'Female elf must not see '+male);
   await search.fill(female);
   assert.ok(await page.locator('#stagePicker .stage-picker-item').count()>0,
    'Female elf must see '+female);
  }
  assert.deepEqual(errors,[]);
  console.log('Chromium gear eligibility smoke passed: saved underlevel gear grants no HP; +50 activates at required level');
 }finally{await context.close();}
}
