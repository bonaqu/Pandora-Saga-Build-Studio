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
  // Synthetic two-reward view using real chest card DOM and production CSS:
  // auto-fit used to widen both to half the board. auto-fill must reserve
  // all eligible tracks, even when later track positions stay empty.
  const sparse=await page.evaluate(()=>{
   const real=document.querySelector('.wiki-chest-assured-grid');
   const cards=[...real.querySelectorAll('.wiki-chest-reward')].slice(0,2);
   const outer=document.createElement('div');
   outer.className='wiki-chest-board';
   outer.setAttribute('style','position:fixed;top:-10000px;left:0;width:1120px;visibility:hidden');
   const grid=document.createElement('div');
   grid.className='wiki-chest-assured-grid';
   for(const card of cards)grid.append(card.cloneNode(true));
   outer.append(grid);document.body.append(outer);
   const widths=[...grid.children].map(n=>n.getBoundingClientRect().width);
   const tracks=getComputedStyle(grid).gridTemplateColumns.split(' ').length;
   const groupWidth=grid.getBoundingClientRect().width;
   outer.remove();
   return {widths,tracks,groupWidth};
  });
  assert.equal(sparse.widths.length,2);
  assert.ok(sparse.tracks>=4,'Sparse guaranteed rewards need reserved tracks: '+JSON.stringify(sparse));
  assert.ok(sparse.widths.every(w=>w>170&&w<320),
   'Sparse rewards must not stretch to fill the entire row: '+JSON.stringify(sparse));
  assert.ok(Math.abs(sparse.widths[0]-sparse.widths[1])<1.5);
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
  const sourceChances=await page.locator('.wiki-chest-reward .wiki-reward-percent').allInnerTexts();
  const values=sourceChances.map(value=>Number(value.replace(/[,%\s]/g,'')));
  assert.ok(values.every((value,i)=>i===0||value<=values[i-1]),
   'NPC chest rewards must be sorted by descending listed chance');
  assert.equal(await page.locator('.wiki-chest-gold-reward').first().innerText(),
   'Gold: 1,000–4,999');
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await openNpcChest();
  const ruGold=(await page.locator('.wiki-chest-gold-reward').first().innerText())
   .replace(/\s/g,' ');
  assert.equal(ruGold,'Золото: 1 000–4 999');
  assert.deepEqual(errors,[],'Browser JS error in scout or NPC chests');
  console.log('Chromium chest rewards passed: scout level 15 and NPC gold ranges in RU/EN');
 }finally{await context.close()}
}
