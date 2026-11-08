import assert from 'node:assert/strict';

// Real Chromium: the user's level-15 scout chest, at desktop/mobile sizes and
// in both OS locales. Never needs production credentials or D1 writes.
export async function runChestRewardLayoutSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1366,height:850}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const openChest=async()=>{
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="chest"]').click();
  await page.locator('[data-wiki-record="51013"]').click();
  await page.locator('.wiki-level-reward').waitFor({state:'visible',timeout:20000});
 };
 const verify=async(locale)=>{
  const title=locale==='ru'?'Награда за достижение уровня':'Reward for reaching level';
  const level=locale==='ru'?'Уровень 15':'Level 15';
  const classText=locale==='ru'?'Класс: Следопыт':'Class: Scout';
  const card=page.locator('.wiki-level-reward');
  assert.equal(await card.locator('small').innerText(),title);
  assert.equal(await card.locator('strong').innerText(),level);
  assert.equal(await card.locator('.wiki-level-reward-class').innerText(),classText);
  const geo=await page.evaluate(()=>{
   const card=document.querySelector('.wiki-level-reward').getBoundingClientRect();
   const lv=document.querySelector('.wiki-level-reward-details strong').getBoundingClientRect();
   const chip=document.querySelector('.wiki-level-reward-class').getBoundingClientRect();
   return{cardWidth:card.width,left:card.left,right:card.right,
    levelBottom:lv.bottom,chipTop:chip.top,
    viewport:document.documentElement.clientWidth,
    overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-
     document.documentElement.clientWidth};
  });
  assert.ok(geo.cardWidth<=480+1,'Reward block is stretched: '+JSON.stringify(geo));
  assert.ok(geo.left>=-2&&geo.right<=geo.viewport+2,'Reward card exceeds viewport');
  assert.ok(geo.chipTop>=geo.levelBottom-2,
   'Class chip must be separate below level, not squeezed onto the same row');
  assert.ok(geo.overflow<=15,'Chest UI has horizontal overflow: '+JSON.stringify(geo));
 };
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await openChest();
  await verify('ru');
  assert.ok(await page.locator('.wiki-chest-assured-grid .wiki-chest-reward').count()>1,
   'The real scout chest should display its 100%-listed rewards');
  await page.setViewportSize({width:390,height:844});
  await verify('ru');
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await openChest();
  await verify('en');
  // Source NPC chest 52002 includes real gold-only reward ranges (no item
  // ID). These must not become ghost item links or hidden "undefined" rows.
  const openNpcChest=async()=>{
   if(await page.locator('#dockClose').isVisible())
    await page.locator('#dockClose').click();
   await page.locator('#nav [data-tab="wiki"]').click();
   await page.locator('[data-wiki-chapter="chest"]').click();
   await page.locator('[data-wiki-record="52002"]').click();
   await page.locator('.wiki-chest-gold-reward').first()
    .waitFor({state:'visible',timeout:20000});
  };
  await openNpcChest();
  assert.equal(await page.locator('.wiki-chest-gold-reward').first().innerText(),
   'Gold: 60,000–100,000');
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await openNpcChest();
  const ruGold=(await page.locator('.wiki-chest-gold-reward').first().innerText())
   .replace(/\\s/g,' ');
  assert.equal(ruGold,'Золото: 60 000–100 000');
  assert.deepEqual(errors,[],'Browser JS error in scout or NPC chests');
  console.log('Chromium chest rewards passed: scout level 15 and NPC gold ranges in RU/EN');
 }finally{await context.close()}
}
