import assert from 'node:assert/strict';
const samples=[
 {index:0,slot:'weapon',id:51,name:'Тыквенный меч',ru:'этого оружия',en:'weapon'},
 {index:1,slot:'shield',id:16001,name:'Малый пехотный щит',ru:'этого щита',en:'shield'},
 {index:2,slot:'head',id:11001,name:'Кожаный шлем',ru:'этого шлема',en:'helmet'},
 {index:3,slot:'body',id:12012,name:'Хлопковая туника',ru:'этой брони',en:'armor'},
 {index:4,slot:'gloves',id:14001,name:'Стеганые рукавицы',ru:'этих перчаток',en:'gloves'},
 {index:5,slot:'legs',id:13083,name:'Золотые поножи',ru:'этих штанов',en:'pants'},
 {index:6,slot:'feet',id:15001,name:'Стеганые сапоги',ru:'этой обуви',en:'boots'},
 {index:11,slot:'belt',id:21001,name:'Пояс',ru:'этого пояса',en:'belt'}
];
// Source-only browser acceptance: never calls the game client or changes D1.
export async function runZeroSoulTabs873Smoke(browser,base){
 for(const [lang,width] of [['ru',1280],['en',390]]){
  const context=await browser.newContext({viewport:{width,height:820}});
  await context.addInitScript(({lang,samples})=>{
   const equipment=Object.fromEntries(samples.map(x=>[x.index,{id:x.id,name:x.name}]));
   // The override models one copy with 0 sockets even when another has sockets.
   equipment[0]={id:1,name:'Спата'};
   equipment[7]={id:18001,name:'Плащ мастерства'};
   localStorage.setItem('ps-build-lang',lang);
   localStorage.setItem('ps-build-studio.v1',JSON.stringify({
    race:1,gender:0,job:7,level:45,name:'Socket zero QA',
    stats:{},points:{},mastery:{},equipment,
    socketCapacities:{'0:1':0},souls:{},refinements:{},gems:{}
   }));
  },{lang,samples});
  await context.route('**/*',route=>route.request().url().startsWith(base+'/')?
   route.continue():route.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
   for(const entry of samples){
    await page.locator('.equipment-slot[data-slot-index="'+entry.index+'"]').click();
    const picker=page.locator('#stagePicker');
    const tabs=picker.locator('.stage-rich-tabs.has-souls');
    await tabs.waitFor({state:'visible',timeout:15000});
    assert.equal(await tabs.locator('[data-stage-tab="souls"]').count(),1,
     'Must show Soul tab for '+entry.slot+' even at zero');
    const tab=tabs.locator('[data-stage-tab="souls"]');
    assert.equal(await tab.isEnabled(),true);
    await tab.click();
    const msg=picker.locator('[data-soul-unavailable="zero"]');
    await msg.waitFor({state:'visible'});
    assert.equal(await msg.getAttribute('data-soul-slot-type'),entry.slot);
    const expected=entry.index===0?
     (lang==='en'?'Soul management for this weapon is unavailable: 0 Soul slots.':
      'Управление душами этого оружия недоступно: 0 слотов для душ.'):
     (lang==='en'?'Soul management for this '+entry.en+' is unavailable: 0 Soul slots.':
      'Управление душами '+entry.ru+' недоступно: 0 слотов для душ.');
    assert.equal((await msg.innerText()).trim(),expected);
    assert.equal(await picker.locator('[data-socket-index]').count(),0);
    assert.equal(await picker.locator('[data-soul-query]').count(),0);
   }
   // Switch the same equipped weapon from 0 -> 1 socket without replacing it.
   await page.locator('.equipment-slot[data-slot-index="0"]').click();
   await page.locator('#stagePicker [data-stage-tab="details"]').click();
   await page.locator('#stagePicker [data-socket-capacity="1"]').click();
   await page.locator('#stagePicker [data-stage-tab="souls"]').click();
   assert.equal(await page.locator('#stagePicker [data-socket-index]').count(),1);
   assert.equal(await page.locator('#stagePicker [data-soul-query]').count(),1);
   assert.equal(await page.locator('#stagePicker [data-soul-unavailable]').count(),0);
   // Cloak remains a genuine non-Soul slot and retains two-action layout.
   await page.locator('.equipment-slot[data-slot-index="7"]').click();
   await page.locator('#stagePicker .stage-rich-tabs.no-souls').waitFor({state:'visible'});
   assert.equal(await page.locator('#stagePicker [data-stage-tab="souls"]').count(),0);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 }
 console.log('Chromium 0-socket Souls 873: 8 slot types, RU/EN, 0 -> 1, and cloak exclusion passed');
}
