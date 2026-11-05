import assert from 'node:assert/strict';

// Independent browser context: a public reader never receives admin controls,
// and historic places are separate from the active OS map snapshot.
export async function runHonorGuideSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1280,height:850}});
 await context.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-categories [data-wiki-chapter="honor"]').click();
  const panel=page.locator('.wiki-page');
  await panel.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.doesNotMatch(await panel.innerText(),
   /23.10.2026|Официальная новость|Источники:/);
  assert.equal(await panel.locator('.wiki-honor-dual,.wiki-honor-resource').count(),0,
   'Honor has no duplicate resource cards');
  assert.equal(await panel.locator('.wiki-honor-monthly-card').count(),3);
  assert.match(await panel.locator('.wiki-honor-monthly-card').first().innerText(),/Герцог/);
  assert.doesNotMatch(await panel.locator('.wiki-honor-list-section').first()
   .innerText(),/Muldian Uncivilized District|El Beht|Underground of Astir/);
  assert.equal(await panel.locator('.wiki-honor-rank').count(),12);
  assert.equal(await panel.locator('.wiki-honor-joining').count(),0,
   'Starting Honor belongs to the Squire rank, not a duplicated callout');
  assert.match(await panel.locator('#honor-rank-0 .wiki-honor-requirement').innerText(),/1 000/);
  // Every rank uses its exact original 23x23 game sprite, not drawn shapes.
  const sprites=panel.locator('.wiki-honor-emblem-source');
  assert.equal(await sprites.count(),12);
  await page.waitForFunction(()=>[...document.querySelectorAll(
   '.wiki-honor-emblem-source')].every(img=>img.complete&&img.naturalWidth===23),
   null,{timeout:15000});
  for(let i=0;i<12;i++)assert.ok(
   (await panel.locator('#honor-rank-'+i+' img').getAttribute('src'))
    .endsWith('/'+i+'.svg'));
  // naturalWidth alone isn't enough: an SVG can load while an embedded PNG
  // is blocked. Verify that the browser actually paints sprite pixels.
  const rendered=await sprites.first().evaluate(img=>{
   const canvas=document.createElement('canvas');canvas.width=23;canvas.height=23;
   const context=canvas.getContext('2d');context.drawImage(img,0,0,23,23);
   const image=context.getImageData(0,0,23,23).data;
   let opaque=0;
   for(let i=3;i<image.length;i+=4)if(image[i]>20)opaque++;
   return opaque;
  });
  assert.ok(rendered>8,'The actual source rank emblem must render, not a blank SVG');

  // Honor's left four-section menu must remain pinned as #detailContent
  // scrolls through the long article; the browser window itself does not scroll.
  const menu=page.locator('.wiki-layout-honor > .wiki-list-panel');
  const pane=page.locator('#detailContent');
  assert.equal(await menu.evaluate(el=>getComputedStyle(el).position),'sticky');
  const maxScroll=await pane.evaluate(el=>el.scrollHeight-el.clientHeight);
  assert.ok(maxScroll>900,'Honor article must exceed one viewport');
  const stickyPosition=async()=>{
   await page.waitForTimeout(65);
   const menuRect=await menu.boundingBox(),paneRect=await pane.boundingBox();
   assert.ok(menuRect&&paneRect);
   assert.ok(menuRect.top>=paneRect.top-2&&menuRect.bottom<paneRect.bottom+2,
    'The four section buttons must stay visible inside the workbench');
   return menuRect.top;
  };
  await pane.evaluate(el=>el.scrollTo({top:Math.min(850,el.scrollHeight-el.clientHeight),behavior:'instant'}));
  const firstTop=await stickyPosition();
  await pane.evaluate(el=>el.scrollTo({top:Math.min(1400,el.scrollHeight-el.clientHeight),behavior:'instant'}));
  const secondTop=await stickyPosition();
  assert.ok(Math.abs(secondTop-firstTop)<3,'Honor sidebar must follow article scroll');
  assert.equal(await menu.locator('.wiki-honor-nav-link').count(),4);
  await menu.locator('[data-honor-section="overview"]').click();
  await pane.evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));
  const cloaks=panel.locator('.wiki-honor-cloak-link');
  assert.equal(await cloaks.count(),9,'All 9 cloak rewards resolve to catalog items');
  await cloaks.first().hover();
  await page.locator('#stage-gear-tooltip').waitFor({state:'visible'});
  await cloaks.first().click();
  assert.match(await panel.locator('h3').innerText(),/плащ победителя/);
  await page.goBack({waitUntil:'domcontentloaded'});
  await panel.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.match(await panel.locator('.wiki-honor-monthly-head').first().innerText(),/Награды/);
  assert.match(await panel.locator('.wiki-honor-rank.is-moon').innerText(),
   /Министр|129\s*000/);
  assert.equal(await panel.locator('.wiki-honor-list-section').count(),2);
  assert.equal(await panel.locator('.wiki-honor-list-section').first()
   .locator('.wiki-honor-list-row').count(),3);
  assert.equal(await panel.locator('.wiki-honor-list-section').last()
   .locator('.wiki-honor-list-row').count(),2);
  assert.equal(await panel.locator('.wiki-honor-add').count(),0,
   'Public readers cannot edit zones or wars');
  // The encyclopedia is a modal workbench. Close it before switching locale
  // through the actual clickable header control; opening Wiki restores Honor.
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.equal((await page.locator('.wiki-honor-title').innerText()).trim(),
   'Honor');
  assert.match(await panel.locator('.wiki-honor-rank.is-moon').innerText(),/Count/);
  assert.doesNotMatch(await panel.locator('.wiki-honor-list-section').first()
   .innerText(),/Покинутые земли Мальдии|Подземные руины Астира/);
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  const zone=panel.locator('.wiki-honor-list-row')
   .filter({hasText:'Эль Ведд'}).locator('.wiki-link');
  await zone.click();
  const native=page.locator('.wiki-page .wiki-map-monsters');
  await native.waitFor({state:'visible',timeout:20000});
  assert.equal(await native.locator('.wiki-mob-row').count(),22);
  assert.ok(await native.locator('.wiki-mob-row .wiki-link').count()>=19);
  assert.match(await native.innerText(),/Страж вожака/);
  assert.equal(await page.locator('.wiki-historic-notice,.wiki-historic-tag').count(),0);
  assert.doesNotMatch(await panel.innerText(),/Историческая PvP-локация|не представленная в актуальной карте OS/);
  assert.equal(await panel.locator('.wiki-map-roster-actions').count(),0,
   'Only authenticated administrators can edit the future monster roster');
  await page.locator('.wiki-categories [data-wiki-chapter="map"]').click();
  const ruins=page.locator('.wiki-list [data-wiki-record="astir-underground"]');
  await ruins.waitFor({state:'visible',timeout:15000});
  await ruins.click();
  assert.equal((await panel.locator('h3').innerText()).trim(),'Подземные руины Астира');
  assert.doesNotMatch(await panel.innerText(),/Историческая PvP-локация|недоступна на OS/);
  // Regression: a deep-linked NPC record must never make Honor unclickable.
  await page.locator('.wiki-categories [data-wiki-chapter="npc"]').click();
  await page.locator('.wiki-list [data-wiki-record]').first().click();
  await page.locator('.wiki-categories [data-wiki-chapter="honor"]').click();
  await panel.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.equal((await panel.locator('.wiki-honor-rank').count()),12);
  // The Phoenix Flame explanation previously displaced the hovered term
  // and triggered an endless show/hide layout oscillation.
  await page.goto(base+'/#wiki/item/252',{waitUntil:'domcontentloaded'});
  const phoenix=page.locator('.wiki-conditional-term');
  await phoenix.waitFor({state:'visible',timeout:20000});
  await phoenix.scrollIntoViewIfNeeded();
  const localPosition=()=>phoenix.evaluate(node=>{
   const row=node.closest('.wiki-conditional-row').getBoundingClientRect();
   const term=node.getBoundingClientRect();
   return {x:term.left-row.left,y:term.top-row.top};
  });
  const before=await localPosition();
  await phoenix.hover();
  const explanation=page.locator('.wiki-phoenix-explanation');
  await explanation.waitFor({state:'visible'});
  await page.waitForTimeout(250);
  assert.equal(await explanation.isVisible(),true,
   'Phoenix Flame tooltip must stay visible without a pointer oscillation');
  const after=await localPosition();
  assert.ok(Math.abs(after.x-before.x)<1&&Math.abs(after.y-before.y)<1,
   'Opening the tooltip must not move its trigger inside the effect row');
  assert.equal(await explanation.evaluate(node=>getComputedStyle(node).position),
   'absolute','The tooltip must float over the page rather than relayout it');
  assert.deepEqual(errors,[]);
  console.log('Chromium Honor: 12 real game rank icons, sticky navigation, cloaks, previews and RU/EN');
 }finally{await context.close()}
}
