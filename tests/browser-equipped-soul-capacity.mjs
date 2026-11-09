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
  const emptyWeapon=page.locator('.equipment-slot[data-slot-index="0"]');
  assert.match(await emptyWeapon.getAttribute('aria-label'),/^Weapon · Empty$/);
  assert.equal((await emptyWeapon.locator('small').innerText()).trim(),'Weapon');
  assert.match(await page.locator('.equipment-slot[data-slot-index="11"]')
   .getAttribute('aria-label'),/^Belt · /);
  await openSlot(0);
  assert.equal((await props.locator('.stage-picker-head strong').innerText()).trim(),'Choose: Weapon');
  assert.equal(await props.locator('input[type="search"]').getAttribute('placeholder'),'Search by name');
  assert.equal(await props.locator('.stage-picker-head button[aria-label="Close item picker"]').count(),1);
  assert.equal((await props.locator('.stage-picker-foot button').first().innerText()).trim(),'Unequip item');
  assert.match(await props.locator('.stage-picker-count').innerText(),/matching · \d+ shown/);
  assert.deepEqual(errors,[]);
  console.log('Chromium per-equipped Soul capacity passed: pants 2, belt 1, change, reload, RU/EN');
 }finally{await context.close();}

 // Old saved copy: two valid leg Souls, but the bundled catalog still says
 // one socket. Loading a catalog must not permanently erase Soul #2 before
 // the player chooses the actual 2-socket physical item.
 const old=await browser.newContext({viewport:{width:1366,height:900}});
 await old.addInitScript(()=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify({
   race:1,gender:0,job:7,level:45,
   equipment:{5:{id:13041,name:'Железные поножи'}},
   souls:{5:[{id:103001},{id:103002}]},
   soulOwners:{5:'13041'},socketCapacities:{}
  }));
 });
 await old.route('**/*',r=>r.request().url().startsWith(base+'/')?
  r.continue():r.abort());
 const pageOld=await old.newPage(),extraErrors=[];
 pageOld.on('pageerror',error=>extraErrors.push(error.message));
 try{
  await pageOld.goto(base+'/',{waitUntil:'domcontentloaded'});
  await pageOld.waitForFunction(()=>document.querySelector('#catalogStatus')
   ?.textContent?.includes('предметов')&&
   document.querySelector('.equipment-slot[data-slot-index="5"].socket-conflict'),null,
   {timeout:25000});
  const stored=await pageOld.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.deepEqual(stored.souls[5].map(s=>s.id),[103001,103002],
   'Catalog refresh must preserve two saved Souls despite one default socket');
  const warning=pageOld.locator('.equipment-slot[data-slot-index="5"] .stage-conflict');
  assert.match(await warning.getAttribute('aria-label'),/сохранено 2, доступно 1/);
  assert.match(await warning.getAttribute('aria-label'),/не действуют/);
  await pageOld.locator('.equipment-slot[data-slot-index="5"]').click();
  const picker=pageOld.locator('#stagePicker');
  assert.equal(await picker.locator('[data-socket-capacity="1"]')
   .getAttribute('aria-pressed'),'true');
  await picker.locator('[data-stage-tab="souls"]').click();
  assert.equal(await picker.locator('[data-socket-index]').count(),1,
   'The second Soul stays inactive before choosing real copy capacity');
  await picker.locator('[data-stage-tab="details"]').click();
  await picker.locator('[data-socket-capacity="2"]').click();
  assert.equal(await picker.locator('[data-socket-capacity="2"]')
   .getAttribute('aria-pressed'),'true');
  await picker.locator('[data-stage-tab="souls"]').click();
  assert.equal(await picker.locator('[data-socket-index]').count(),2);
  assert.match(await picker.locator('[data-socket-index="1"]')
   .getAttribute('aria-label'),/Душа волка/);
  assert.equal(await pageOld.locator('.equipment-slot[data-slot-index="5"].socket-conflict').count(),0);
  assert.deepEqual((await pageOld.evaluate(()=>
   JSON.parse(localStorage.getItem('ps-build-studio.v1')))).souls[5]
   .map(s=>s.id),[103001,103002]);
  assert.deepEqual(extraErrors,[]);
  console.log('Chromium Soul recovery: two saved leg Souls survive one-socket catalog and activate with item override');
 }finally{await old.close()}
}

export async function runSavedSocketRecoverySmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 const token='t'.repeat(43),username='socket_recovery';
 const saved={id:'c'.repeat(32),name:'Старый билд со слотами',
  data:{race:1,gender:0,job:7,level:45,name:'Старый билд со слотами',
   equipment:{5:{id:13041,name:'Железные поножи'}},
   socketCapacities:'invalid'}};
 await context.addInitScript(({saved,token,username})=>{
  localStorage.setItem('ps-build-library-secret.v1','e'.repeat(64));
  localStorage.setItem('ps-build-library.v1',JSON.stringify([saved]));
  localStorage.setItem('ps-account-session.v1',JSON.stringify({token,username,expires:Number.MAX_SAFE_INTEGER}));
  localStorage.setItem('ps-build-owner-scope.v1','account:'+username);
 },{saved,token,username});
 await context.route('**/*',route=>{
  if(route.request().url().startsWith(base+'/'))return route.continue();
  const url=new URL(route.request().url());
  if(url.pathname==='/api/account/me')return route.fulfill({status:200,
   contentType:'application/json',
   headers:{'access-control-allow-origin':'*'},body:JSON.stringify({account:{username}})});
  return route.abort();
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#catalogStatus')
   ?.textContent?.includes('предметов'),null,{timeout:25000});
  await page.locator('#nav [data-tab="builds"]').click();
  const card=page.locator('.build-card').first();
  await card.waitFor({state:'visible'});
  await card.getByRole('button',{name:'Открыть',exact:true}).click();
  const choice=card.locator('.build-open-choice');
  if(await choice.isVisible())
   await choice.getByRole('button',{name:'Открыть без сохранения'}).click();
  await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='45');
  await page.locator('.equipment-slot[data-slot-index="5"]').click();
  const option=page.locator('#stagePicker [data-socket-capacity="2"]');
  await option.waitFor({state:'visible'});
  await option.click();
  assert.equal(await option.getAttribute('aria-pressed'),'true');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps-build-studio.v1')));
  assert.equal(draft.socketCapacities['5:13041'],2,
   'Opening malformed data must permit setting copy capacity');
  assert.deepEqual(errors,[]);
  console.log('Chromium saved build: invalid socket data can be corrected via UI');
 }finally{await context.close()}
}
