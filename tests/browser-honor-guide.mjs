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
  assert.equal(await panel.locator('.wiki-honor-copy-pencil').count(),0,
   'Ordinary players must never see the Honor editorial pencils');
  assert.equal((await panel.locator('.wiki-honor-subtitle').textContent()).trim(),
   'PvP · нации · звания · награды',
   'Ordinary player copy must retain its original caption without editor markup');
  assert.doesNotMatch(await panel.innerText(),
   /23.10.2026|Официальная новость|Источники:/);
  assert.equal(await panel.locator('.wiki-honor-dual,.wiki-honor-resource').count(),0,
   'Honor has no duplicate resource cards');
  assert.equal(await panel.locator('.wiki-honor-monthly-card').count(),3);
  assert.match(await panel.locator('.wiki-honor-monthly-card').first().innerText(),/Герцог/);
  assert.doesNotMatch(await panel.locator('.wiki-honor-list-section').first()
   .innerText(),/Muldian Uncivilized District|El Beht|Underground of Astir/);
  assert.equal(await panel.locator('.wiki-honor-rank').count(),12);
  const rankFilters=panel.locator('.wiki-honor-rank-filters [data-honor-filter]');
  assert.equal(await rankFilters.count(),3);
  assert.equal((await rankFilters.nth(0).innerText()).trim(),'Все · 12');
  assert.equal((await rankFilters.nth(1).innerText()).trim(),'Обычные · 9');
  assert.equal((await rankFilters.nth(2).innerText()).trim(),'Месячные · 3');
  await rankFilters.nth(2).click();
  assert.equal(await panel.locator('.wiki-honor-rank:not([hidden])').count(),3);
  await rankFilters.nth(1).click();
  assert.equal(await panel.locator('.wiki-honor-rank:not([hidden])').count(),9);
  await rankFilters.nth(0).click();
  assert.equal(await panel.locator('.wiki-honor-rank:not([hidden])').count(),12);
  // Regression: Honor used to return from renderWiki before attaching the
  // universal search listener. Search the article, not the OS record index.
  const honorSearch=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  // The Wiki search intentionally starts readonly to reject password-manager
  // autofill. A real user click unlocks it before typing.
  await honorSearch.click();
  await honorSearch.fill('Эль Ведд');
  await page.waitForFunction(()=>
   document.querySelector('#honor-gain')?.hidden===false&&
   document.querySelector('#honor-ranks')?.hidden===true);
  const locationMatches=await panel.locator('.wiki-honor-list-row:not([hidden])').allInnerTexts();
  assert.ok(locationMatches.length>0,'Honor search must find at least one PvP location');
  assert.ok(locationMatches.every(text=>/Эль Ведд/u.test(text)),
   'Only matching Honor entries may remain visible: '+locationMatches.join(' | '));
  assert.equal(await page.locator('.wiki-honor-nav-link:not([hidden])').count(),1,
   'Honor sidebar follows real matches');
  await honorSearch.fill('Герцог');
  await page.waitForFunction(()=>
   document.querySelector('#honor-monthly')?.hidden===false);
  assert.equal(await panel.locator('.wiki-honor-monthly-card:not([hidden])').count(),1);
  assert.equal(await panel.locator('.wiki-honor-monthly-card:not([hidden])').first()
   .innerText().then(text=>/Герцог/.test(text)),true);
  await honorSearch.fill('несуществующийнеизвестныйранг');
  await panel.locator('.wiki-honor-search-empty').waitFor({state:'visible'});
  assert.equal(await panel.locator('.wiki-honor-section:not([hidden])').count(),0);
  await honorSearch.fill('');
  await page.waitForFunction(()=>
   document.querySelectorAll('.wiki-honor-section:not([hidden])').length===4);
  assert.equal(await panel.locator('.wiki-honor-rank:not([hidden])').count(),12);
  assert.equal(await page.locator('.wiki-honor-nav-link:not([hidden])').count(),4);
  await rankFilters.nth(1).click();
  assert.equal(await panel.locator('.wiki-honor-rank:not([hidden])').count(),9,
   'Rank type filters work after a search round trip');
  await rankFilters.nth(0).click();
  assert.equal(await panel.locator('.wiki-honor-joining').count(),0,
   'Starting Honor belongs to the Squire rank, not a duplicated callout');
  // In-world entity cards: match the established spawn-location design.
  assert.equal(await panel.locator('.wiki-honor-list.wiki-entity-flow').count(),2,
   'Both PvP collections reuse the canonical linked-entity flow');
  assert.equal(await panel.locator('.wiki-honor-location-link.wiki-entity-reference').count(),3);
  assert.equal(await panel.locator('.wiki-honor-war-link.wiki-entity-reference').count(),2);
  const pvpCard=panel.locator('.wiki-honor-location-link.wiki-entity-reference').first();
  assert.equal(await pvpCard.locator('.wiki-entity-reference-icon').innerText(),'◈');
  const cardStyle=await pvpCard.evaluate(node=>{
   const style=getComputedStyle(node),rect=node.getBoundingClientRect();
   return {display:style.display,border:style.borderTopStyle,
    minHeight:rect.height,background:style.backgroundImage};
  });
  assert.ok(['flex','inline-flex'].includes(cardStyle.display),
   'PvP location chip must be a flexible clickable card');
  assert.equal(cardStyle.border,'solid');
  assert.ok(cardStyle.minHeight>=32,'PvP location card must be a large click target');
  assert.match(cardStyle.background,/gradient/);
  assert.equal(await panel.locator('.wiki-honor-cloak-row').count(),9,
   'Monthly reward rows must align every nation and linked cloak');
  assert.equal(await panel.locator('.wiki-honor-cloak-row .wiki-honor-cloak-nation').count(),9);
  assert.equal(await panel.locator('.wiki-honor-cloak-row .wiki-honor-cloak-reward .wiki-honor-cloak-link').count(),9);
  const desktopColumns=await panel.locator('.wiki-honor-monthly-list').evaluate(node=>
   getComputedStyle(node).gridTemplateColumns.split(' ').length);
  assert.equal(desktopColumns,3,'Wide screens arrange monthly title groups in 3 columns');
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
  const firstCard=panel.locator('#honor-rank-0');
  assert.ok((await firstCard.boundingBox()).height<132,
   'Rank rows should not regain tall icon/requirement callouts');
  assert.equal(await firstCard.locator('.wiki-honor-emblem').evaluate(
   node=>Math.round(node.getBoundingClientRect().height)),34);
  assert.match(await sprites.first().evaluate(node=>getComputedStyle(node).filter),
   /sepia\(1\)/,'Original game pixels must use the site brass palette');
  const minister=await panel.locator('#honor-rank-7').evaluate(node=>({
   background:getComputedStyle(node).backgroundColor,
   border:getComputedStyle(node).borderLeftColor
  }));
  const marquis=await panel.locator('#honor-rank-6').evaluate(node=>({
   background:getComputedStyle(node).backgroundColor,
   border:getComputedStyle(node).borderLeftColor
  }));
  assert.deepEqual(minister,marquis,'Minister must not have separate styling');

  // Honor's left four-section menu must remain pinned as #detailContent
  // scrolls through the long article; the browser window itself does not scroll.
  const menu=page.locator('.wiki-layout-honor > .wiki-list-panel');
  const pane=page.locator('#detailContent');
  assert.equal(await menu.evaluate(el=>getComputedStyle(el).position),'sticky');
  const maxScroll=await pane.evaluate(el=>el.scrollHeight-el.clientHeight);
  assert.ok(maxScroll>900,'Honor article must exceed one viewport');
  const stickyPosition=async()=>{
   // Read both bounding boxes in the same browser layout snapshot. Two
   // separate Playwright calls can observe a changing scroll animation.
   await page.waitForTimeout(80);
   const geometry=await menu.evaluate(node=>{
    const scroll=document.querySelector('#detailContent');
    const menuRect=node.getBoundingClientRect();
    const paneRect=scroll.getBoundingClientRect();
    return {menuTop:menuRect.top,menuBottom:menuRect.bottom,
     paneTop:paneRect.top,paneBottom:paneRect.bottom,
     scrollTop:scroll.scrollTop};
   });
   assert.ok(geometry.menuTop>=geometry.paneTop-2&&
    geometry.menuBottom<=geometry.paneBottom+2,
    'Four Honor navigation links must stay visible: '+JSON.stringify(geometry));
   return geometry.menuTop;
  };
  await pane.evaluate(el=>el.scrollTo({top:Math.min(850,el.scrollHeight-el.clientHeight),behavior:'instant'}));
  const firstTop=await stickyPosition();
  await pane.evaluate(el=>el.scrollTo({top:Math.min(1400,el.scrollHeight-el.clientHeight),behavior:'instant'}));
  const secondTop=await stickyPosition();
  assert.ok(Math.abs(secondTop-firstTop)<3,'Honor sidebar must follow article scroll');
  assert.equal(await menu.locator('.wiki-honor-nav-link').count(),4);
  // Direct scroll/keyboard/wheel and clicking menu use the same active state.
  const autoHighlight=async section=>{
   await pane.evaluate((container,id)=>{
    const target=document.querySelector('#honor-'+id);
    const y=target.getBoundingClientRect().top-container.getBoundingClientRect().top;
    container.scrollTo({top:container.scrollTop+y-26,behavior:'instant'});
   },section);
   await page.waitForFunction(id=>
    document.querySelector('.wiki-honor-nav-link.selected')?.dataset.honorSection===id,
    section,{timeout:4000});
   assert.equal(await menu.locator('.wiki-honor-nav-link[aria-current="location"]').count(),1);
  };
  for(const chapter of ['overview','gain','ranks','monthly'])
   await autoHighlight(chapter);
  await autoHighlight('ranks');
  // Reproduce a reader dragging the scrollbar to the very end: the final
  // monthly heading cannot reach a 100px top threshold in this position.
  await pane.evaluate(el=>el.scrollTo({
   top:el.scrollHeight-el.clientHeight,behavior:'instant'
  }));
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-honor-nav-link.selected')?.dataset.honorSection==='monthly',
   null,{timeout:4000});
  assert.equal(await menu.locator('[data-honor-section="monthly"][aria-current="location"]').count(),1);
  await menu.locator('[data-honor-section="overview"]').click();
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-honor-nav-link.selected')?.dataset.honorSection==='overview');
  await pane.evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));
  const cloaks=panel.locator('.wiki-honor-cloak-link');
  await page.waitForFunction(()=>
   document.querySelectorAll('.wiki-honor-cloak-link').length===9,
   null,{timeout:20000});
  assert.equal(await cloaks.count(),9,
   'Honor must resolve all 9 cloak links after the catalog loads asynchronously');
  await cloaks.first().scrollIntoViewIfNeeded();
  await cloaks.first().hover();
  await page.locator('#stage-gear-tooltip').waitFor({state:'visible'});
  const cloakOrigin=await pane.evaluate(el=>el.scrollTop);
  await cloaks.first().click();
  assert.match(await panel.locator('h3').innerText(),/плащ победителя/);
  assert.equal((await page.locator('.wiki-page > .wiki-return-button').innerText()).trim(),
   '← Назад','Honor → cloak must not say Back to Equipment');
  await page.locator('.wiki-page > .wiki-return-button').click();
  await panel.locator('.wiki-honor-title').waitFor({state:'visible'});
  await page.waitForFunction(origin=>
   Math.abs(document.querySelector('#detailContent').scrollTop-origin)<10,
   cloakOrigin,{timeout:4000});
  assert.match(await panel.locator('.wiki-honor-monthly-head').first().innerText(),/Награды/);
  assert.match(await panel.locator('#honor-rank-7').innerText(),
   /Министр|129\s*000/);
  assert.equal(await panel.locator('.wiki-honor-list-section').count(),2);
  assert.equal(await panel.locator('.wiki-honor-list-section').first()
   .locator('.wiki-honor-list-row').count(),3);
  assert.equal(await panel.locator('.wiki-honor-list-section').last()
   .locator('.wiki-honor-list-row').count(),2);
  const warList=panel.locator('.wiki-honor-list-section').last();
  assert.equal(await warList.locator('a.wiki-honor-war-link').count(),2,
   'Existing wars and future D1 rows use their names as links');
  assert.equal(await warList.locator('.wiki-honor-war-rename').count(),0,
   'No administrative war edit affordances appear for public readers');
  const lidia=warList.locator('a.wiki-honor-war-link').filter({hasText:'Лидия'});
  await lidia.scrollIntoViewIfNeeded();
  const savedScroll=await pane.evaluate(el=>el.scrollTop);
  await lidia.click();
  await page.waitForURL(/#wiki\/honor\/war-lidia$/);
  assert.equal((await panel.locator('.wiki-honor-war-title').innerText()).trim(),'Лидия');
  assert.equal((await page.locator('.wiki-page > .wiki-return-button').innerText()).trim(),
   '← Назад','Honor → Lydia uses universal caption');
  assert.match(await panel.locator('.wiki-honor-war-eyebrow').innerText(),/pvp-война/i);
  assert.equal(await page.locator('.wiki-layout-honor .wiki-list .wiki-honor-war-link').count(),2,
   'War detail pages retain two linked war entries in the left navigation');
  assert.equal(await panel.locator('.wiki-honor-rank').count(),0,
   'War pages do not duplicate the full Honor rank article');
  await page.locator('.wiki-page > .wiki-return-button').click();
  await panel.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.equal(await panel.locator('a.wiki-honor-war-link').count(),2);
  await page.waitForFunction(expected=>
   Math.abs(document.querySelector('#detailContent').scrollTop-expected)<10,
   savedScroll,{timeout:4000});
  const siegheim=panel.locator('.wiki-honor-list-section').last()
   .locator('a.wiki-honor-war-link').filter({hasText:'Гихайм'});
  await siegheim.scrollIntoViewIfNeeded();
  const siegheimOrigin=await pane.evaluate(el=>el.scrollTop);
  await siegheim.click();
  await page.waitForURL(/#wiki\/honor\/war-siegheim$/);
  assert.equal((await panel.locator('.wiki-honor-war-title').innerText()).trim(),'Гихайм');
  assert.equal((await page.locator('.wiki-page > .wiki-return-button').innerText()).trim(),
   '← Назад','Honor → Siegheim uses universal caption');
  await page.locator('.wiki-page > .wiki-return-button').click();
  await panel.locator('.wiki-honor-monthly-card').first().waitFor({state:'visible'});
  assert.equal(await panel.locator('a.wiki-honor-war-link').count(),2);
  await page.waitForFunction(expected=>
   Math.abs(document.querySelector('#detailContent').scrollTop-expected)<10,
   siegheimOrigin,{timeout:4000});
  assert.equal(await panel.locator('.wiki-honor-add').count(),0,
   'Public readers cannot edit zones or wars');
  // The encyclopedia is a modal workbench. Close it before switching locale
  // through the actual clickable header control; opening Wiki restores Honor.
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-honor-title').waitFor({state:'visible'});
  const firstEnglishCloak=page.locator('.wiki-honor-cloak-link').first();
  await firstEnglishCloak.waitFor({state:'visible'});
  await firstEnglishCloak.click();
  assert.equal((await page.locator('.wiki-page > .wiki-return-button').innerText()).trim(),
   '← Back','English UI uses the same neutral caption');
  await page.locator('.wiki-page > .wiki-return-button').click();
  await page.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.equal((await page.locator('.wiki-honor-title').innerText()).trim(),
   'Honor');
  const honorSearchEn=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  await honorSearchEn.click();
  await honorSearchEn.fill('Honor ranks');
  await page.waitForFunction(()=>document.querySelector('#honor-ranks')?.hidden===false);
  assert.equal(await panel.locator('.wiki-honor-section:not([hidden])').count(),1);
  await honorSearchEn.fill('totally-unknown-honor-record');
  await panel.locator('.wiki-honor-search-empty').waitFor({state:'visible'});
  assert.match(await panel.locator('.wiki-honor-search-empty').innerText(),
   /No Honor matches found/);
  await honorSearchEn.fill('');
  await page.waitForFunction(()=>document.querySelectorAll(
   '.wiki-honor-section:not([hidden])').length===4);
  assert.match(await panel.locator('#honor-rank-7').innerText(),/Count/);
  assert.doesNotMatch(await panel.locator('.wiki-honor-list-section').first()
   .innerText(),/Покинутые земли Мальдии|Подземные руины Астира/);
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  assert.equal(await panel.locator('.wiki-honor-location-link').count(),3);
  assert.equal(await panel.locator('.wiki-honor-open-location').count(),0,
   'Do not add separate arrow targets beside PvP maps');
  const zone=panel.locator('.wiki-honor-list-row')
   .filter({hasText:'Эль Ведд'}).locator('a.wiki-honor-location-link');
  assert.match(await zone.innerText(),/Эль Ведд/);
  await zone.scrollIntoViewIfNeeded();
  const mapOrigin=await pane.evaluate(el=>el.scrollTop);
  await zone.click();
  assert.equal((await page.locator('.wiki-page > .wiki-return-button').innerText()).trim(),
   '← Назад','Honor → El Vedd must not say Back to Locations');
  const native=page.locator('.wiki-page .wiki-map-monsters');
  await native.waitFor({state:'visible',timeout:20000});
  assert.equal(await native.locator('.wiki-mob-row').count(),22);
  assert.ok(await native.locator('.wiki-mob-row .wiki-link').count()>=19);
  assert.match(await native.innerText(),/Страж вожака/);
  assert.equal(await page.locator('.wiki-historic-notice,.wiki-historic-tag').count(),0);
  assert.doesNotMatch(await panel.innerText(),/Историческая PvP-локация|не представленная в актуальной карте OS/);
  assert.equal(await panel.locator('.wiki-map-roster-actions').count(),0,
   'Only authenticated administrators can edit the future monster roster');
  // Nested Wiki navigation: map -> linked monster -> Back returns to exact
  // position inside the map, then Back returns to the Honor PvP-location link.
  const monsterLink=native.locator('.wiki-mob-row .wiki-link').first();
  await monsterLink.scrollIntoViewIfNeeded();
  const mapArticleScroll=await pane.evaluate(el=>el.scrollTop);
  const mapHash=await page.evaluate(()=>location.hash);
  await monsterLink.click();
  await page.waitForURL(/#wiki\/monster\//);
  assert.equal((await page.locator('.wiki-page > .wiki-return-button').innerText()).trim(),
   '← Назад','Map → monster keeps universal caption');
  await page.locator('.wiki-page > .wiki-return-button').click();
  await page.waitForFunction(expected=>location.hash===expected,mapHash);
  await page.waitForFunction(expected=>
   Math.abs(document.querySelector('#detailContent').scrollTop-expected)<10,
   mapArticleScroll,{timeout:4000});
  await page.locator('.wiki-page > .wiki-return-button').click();
  await panel.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.equal(await panel.locator('.wiki-honor-location-link').count(),3,
   'Back must restore the original Honor PvP-location links');
  await page.waitForFunction(expected=>
   Math.abs(document.querySelector('#detailContent').scrollTop-expected)<10,
   mapOrigin,{timeout:4000});
  await page.locator('.wiki-categories [data-wiki-chapter="map"]').click();
  const ruins=page.locator('.wiki-list [data-wiki-record="astir-underground"]');
  await ruins.waitFor({state:'visible',timeout:15000});
  await ruins.click();
  assert.equal((await panel.locator('h3').innerText()).trim(),'Подземные руины Астира');
  assert.equal((await page.locator('.wiki-page > .wiki-return-button').innerText()).trim(),
   '← Назад','Direct location pages use universal caption');
  assert.doesNotMatch(await panel.innerText(),/Историческая PvP-локация|недоступна на OS/);
  // Regression: a deep-linked NPC record must never make Honor unclickable.
  await page.locator('.wiki-categories [data-wiki-chapter="npc"]').click();
  await page.locator('.wiki-list [data-wiki-record]').first().click();
  await page.locator('.wiki-categories [data-wiki-chapter="honor"]').click();
  await panel.locator('.wiki-honor-title').waitFor({state:'visible'});
  assert.equal((await panel.locator('.wiki-honor-rank').count()),12);
  // Direct links to a war must also open after a fresh page load.
  await page.goto(base+'/#wiki/honor/war-lidia',{waitUntil:'domcontentloaded'});
  await panel.locator('.wiki-honor-war-title').waitFor({state:'visible',timeout:20000});
  assert.match(await panel.locator('.wiki-honor-war-title').innerText(),/Лидия/);
  const returnStyle=page.locator('.wiki-page > .wiki-return-button');
  await returnStyle.waitFor({state:'visible'});
  const appearance=await returnStyle.evaluate(button=>{
   const outer=button.closest('.wiki-page').getBoundingClientRect();
   const rect=button.getBoundingClientRect(),style=getComputedStyle(button);
   return {x:Math.round(rect.left-outer.left),
    y:Math.round(rect.top-outer.top),
    background:style.backgroundColor,border:style.borderTopColor,
    radius:style.borderTopLeftRadius,padding:style.padding,
    text:button.textContent};
  });
  assert.ok(appearance.x>=0&&appearance.x<=30,
   'Honor return button belongs in the left padded edge of the card');
  assert.equal(appearance.text.trim(),'← Назад');
  assert.equal(await panel.locator('.wiki-page-nav').count(),0);
  // Normal encyclopedia records must reproduce the war button, not
  // introduce another navigation bar or return alignment.
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').click();
  for(const category of [
   'item','monster','map','npc','chest','skill','soul','instance']){
   await page.locator('.wiki-categories [data-wiki-chapter="'+category+'"]').click();
   const first=page.locator('.wiki-list [data-wiki-record]').first();
   await first.waitFor({state:'visible',timeout:15000});
   await first.click();
   const back=page.locator('.wiki-page > .wiki-return-button');
   await back.waitFor({state:'visible'});
   assert.equal(await page.locator('.wiki-page-nav').count(),0,
    category+' must not create a second header toolbar');
   assert.equal((await back.innerText()).trim(),'← Назад',
    category+' must use neutral caption regardless of its origin');
   assert.equal(await back.getAttribute('aria-label'),'← Назад',
    category+' must expose the same accessible label');
   assert.equal(await page.locator('.wiki-list [data-wiki-record]').count()>0,true,
    category+' must have a usable record list');
   assert.ok((await page.locator('.wiki-page').innerText()).trim().length>15,
    category+' record must render substantive content');
   const state=await back.evaluate(button=>{
    const parent=button.closest('.wiki-page').getBoundingClientRect();
    const rect=button.getBoundingClientRect(),style=getComputedStyle(button);
    return {x:Math.round(rect.left-parent.left),
     y:Math.round(rect.top-parent.top),
     background:style.backgroundColor,border:style.borderTopColor,
     radius:style.borderTopLeftRadius,padding:style.padding,
     first:button.parentElement.firstElementChild===button};
   });
   assert.equal(state.first,true,'Back must be above the '+category+' heading');
   assert.deepEqual({...state,first:undefined},
    {x:appearance.x,y:appearance.y,background:appearance.background,
     border:appearance.border,radius:appearance.radius,
     padding:appearance.padding,first:undefined},
    category+' must match Honor Back position and appearance');
   await back.click();
   await page.waitForFunction(()=>!document.querySelector(
    '.wiki-page > .wiki-return-button'),null,{timeout:4000});
  }
  // Opening a record URL directly (without reversible session history)
  // still offers a safe return to its category rather than browser exit.
  await page.goto(base+'/#wiki/item/252',{waitUntil:'domcontentloaded'});
  await page.locator('.wiki-page > .wiki-return-button').waitFor({state:'visible'});
  await page.locator('.wiki-page > .wiki-return-button').click();
  await page.waitForURL(url=>!url.hash.startsWith('#wiki/'));
  assert.equal(await page.locator('.wiki-page > .wiki-return-button').count(),0);
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
  // Responsive audit: compact linked cards stay usable without creating
  // horizontal overflow, and the monthly rewards become a single column.
  await page.setViewportSize({width:390,height:820});
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-categories [data-wiki-chapter="honor"]').click();
  await panel.locator('.wiki-honor-location-link').first().waitFor({state:'visible'});
  const mobile=await panel.evaluate(node=>{
   const card=node.querySelector('.wiki-honor-location-link');
   const monthly=node.querySelector('.wiki-honor-monthly-list');
   const flow=node.querySelector('.wiki-honor-list.wiki-entity-flow');
   return {columns:getComputedStyle(monthly).gridTemplateColumns.split(' ').length,
    overflow:flow.scrollWidth-flow.clientWidth,
    cardHeight:card.getBoundingClientRect().height,
    maps:node.querySelectorAll('a.wiki-honor-location-link').length};
  });
  assert.equal(mobile.columns,1,'Mobile Honor reward groups must stack');
  assert.ok(mobile.overflow<=2,'Linked PvP cards must not overflow their container');
  assert.ok(mobile.cardHeight>=32,'PvP map links remain usable on touch screens');
  assert.equal(mobile.maps,3);
  // :focus-visible follows keyboard modality; a bare .focus() after mouse
  // navigation does not imply the user is navigating with a keyboard.
  await page.keyboard.press('Tab');
  await page.locator('.wiki-honor-location-link').first().focus();
  assert.equal(await page.locator('.wiki-honor-location-link').first().evaluate(node=>
   getComputedStyle(node).outlineStyle),'solid','Keyboard focus must be visible');
  assert.deepEqual(errors,[]);
  console.log('Chromium Honor: shared PvP entity chips, aligned monthly rewards, mobile layout, navigation and source icons');
 }finally{await context.close()}
}
