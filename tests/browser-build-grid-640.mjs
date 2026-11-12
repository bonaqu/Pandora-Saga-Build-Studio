import assert from 'node:assert/strict';

// Real CSS geometry and search filtering in Chromium; no production D1 calls.
export async function runSavedBuildGridSmoke(browser,base){
 const names=['QA one two three four five','QA two three four five',
  'QA three four five','QA four five','QA five','QA solo'];
 const builds=names.map((name,index)=>({
  id:(index+1).toString(16).repeat(32),name,
  createdAt:100+index,at:900-index,
  data:{race:1,job:8,level:10,name,points:{},mastery:{},stats:{},
   equipment:{},souls:{},refinements:{},gems:{}}
 }));
 const original=JSON.stringify([...builds].reverse());
 for(const width of [1680,390]){
  const context=await browser.newContext({viewport:{width,height:830}});
  await context.addInitScript(({token,library})=>{
   localStorage.setItem('ps-build-library-secret.v1','f'.repeat(64));
   localStorage.setItem('ps-account-session.v1',
    JSON.stringify({token,username:'grid_qa',expires:Number.MAX_SAFE_INTEGER}));
   localStorage.setItem('ps-build-owner-scope.v1','account:grid_qa');
   localStorage.setItem('ps-build-library.v1',library);
  },{token:'t'.repeat(43),library:original});
  await context.route('**/*',route=>
   route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
   await page.locator('#nav [data-tab="builds"]').click();
   await page.locator('.build-card').first().waitFor({state:'visible'});
   const cards=page.locator('.build-card');
   assert.deepEqual(await cards.locator('h3').allInnerTexts(),names,
    'Creation order wins over reverse storage order and newer at revisions');
   const buttons=cards.first().locator('.build-card-actions > button');
   assert.equal(await buttons.count(),4,'Every card has four actions');
   assert.deepEqual(await cards.first().locator('.build-card-action-icon').allInnerTexts(),
    ['📂','↻','🔗','🗑'],'Icons for all four actions');
   assert.deepEqual(await cards.first().locator('.build-card-action-label').allInnerTexts(),
    ['Открыть','Перезаписать','Поделиться','Удалить'],'Readable action labels');
   assert.deepEqual(await buttons.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('type'))),
    ['button','button','button','button'],'Action buttons cannot submit a form');
   const tips=[
    'Загрузить этого героя в редактор.',
    'Заменить этот билд текущим героем.',
    'Создать ссылку для отправки билда.',
    'Удалить билд и отозвать его ссылки.'
   ];
   const popup=page.locator('#stage-guide-tooltip');
   for(let i=0;i<tips.length;i++){
    assert.equal(await buttons.nth(i).getAttribute('title'),null,
     'No duplicate native browser tooltip on action '+i);
    await buttons.nth(i).hover();
    await popup.waitFor({state:'visible',timeout:5000});
    assert.equal(await popup.innerText(),tips[i]);
    assert.match(await buttons.nth(i).getAttribute('aria-describedby')||'',
     /stage-guide-tooltip/,'Screen readers receive transient description');
    const rect=await popup.boundingBox();
    assert.ok(rect&&rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+1,
     'Game-style tooltip remains within the '+width+'px viewport');
    await page.mouse.move(1,1);
    await popup.waitFor({state:'hidden',timeout:3000});
    assert.equal(await buttons.nth(i).getAttribute('aria-describedby'),null,
     'Leaving the button removes transient description');
   }
   // Keyboard-only focus opens the same read-only hint without a mouse.
   await buttons.first().focus();
   await page.keyboard.press('Tab');
   await popup.waitFor({state:'visible',timeout:3000});
   assert.equal(await popup.innerText(),tips[1]);
   await page.keyboard.press('Escape');
   await popup.waitFor({state:'hidden',timeout:3000});
   assert.equal(await cards.count(),6,'Escape must not close the build library');
   const search=page.locator('.build-library-search');
   const grid=page.locator('.build-grid');
   for(const [term,count] of [['one',1],['two',2],['three',3],
    ['four',4],['five',5],['',6]]){
    await search.fill(term);
    const geo=await grid.evaluate(node=>{
     const children=[...node.children].filter(el=>!el.hidden);
     const cards=children.map(el=>{
      const b=el.getBoundingClientRect();
      return{left:b.left,top:b.top,width:b.width,right:b.right};
     });
     return{columns:getComputedStyle(node).gridTemplateColumns.split(' ').length,
      viewport:node.clientWidth,scrollWidth:node.scrollWidth,
      cards,overflow:Math.max(document.body.scrollWidth,
       document.documentElement.scrollWidth)-document.documentElement.clientWidth};
    });
    assert.equal(geo.cards.length,count,term+': visible card count');
    assert.equal(geo.columns,Math.min(count,4),term+': no unused scroll tracks');
    assert.ok(geo.cards.every(c=>Math.abs(c.width-390)<1),
     term+': saved card width remains constant');
    if(count>=5){
     assert.ok(Math.abs(geo.cards[0].top-geo.cards[3].top)<2,
      'First row contains exactly four cards');
     assert.ok(geo.cards[4].top>geo.cards[0].top+20,
      'Fifth card starts the next row');
     assert.ok(Math.abs(geo.cards[4].left-geo.cards[0].left)<2,
      'Fifth card starts at first column');
    }
    const needed=count>4?4:count;
    const contentWidth=needed*390+(needed-1)*12;
    assert.equal(geo.scrollWidth>geo.viewport+1,contentWidth>geo.viewport+1,
     term+': horizontal scrollbar occurs only when cards exceed available width');
    assert.ok(geo.overflow<=14,'No document-level horizontal overflow: '+geo.overflow);
   }
   // Additional RU/EN parity check after the real search/layout interactions.
   await page.locator('#dockClose').click();
   await page.locator('#locale [data-locale="en"]').click();
   await page.waitForFunction(()=>document.documentElement.lang==='en');
   await page.locator('#nav [data-tab="builds"]').click();
   await page.locator('.build-card').first().waitFor({state:'visible'});
   const enButtons=page.locator('.build-card').first().locator('.build-card-actions > button');
   assert.deepEqual(await enButtons.locator('.build-card-action-label').allInnerTexts(),
    ['Open','Overwrite','Share','Delete']);
   for(const [i,help] of [
    'Load this character in the editor.',
    'Replace this build with your current character.',
    'Create a link to share this build.',
    'Delete this build and revoke its links.'
   ].entries()){
    await enButtons.nth(i).hover();
    await popup.waitFor({state:'visible',timeout:5000});
    assert.equal(await popup.innerText(),help);
    await page.mouse.move(1,1);
    await popup.waitFor({state:'hidden',timeout:3000});
   }
   const englishSearch=page.locator('.build-library-search');
   assert.equal(await englishSearch.getAttribute('placeholder'),'Search by name, class or level…');
   assert.equal(await englishSearch.getAttribute('aria-label'),'Find a saved build');
   await englishSearch.fill('no such build');
   assert.match(await page.locator('.build-grid + .muted').innerText(),/No builds match this search/);
   await englishSearch.fill('');
   // Filtering, hover and locale switching must not mutate saved player data.
   assert.equal(await page.evaluate(()=>localStorage.getItem('ps-build-library.v1')),original);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 }
 console.log('Chromium fixed four-slot build grid passed: 1–6 cards, search, overflow and order');
}
