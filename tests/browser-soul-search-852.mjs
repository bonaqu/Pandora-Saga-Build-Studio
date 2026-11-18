import assert from 'node:assert/strict';

// Real Chromium control/render test, not a claim of observing the game client.
export async function runSoulSearch852Smoke(browser,base){
 const context=await browser.newContext({viewport:{width:900,height:740}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.PandoraStageItemUI?.matchesSoulSearch&&
   window.PandoraEquipmentPlan?.canSocket),null,{timeout:20000});
  // Module initialization and the first rendered controls precede the end
  // of the mandatory startup dialog. Native inert blocks interaction until
  // the overlay has actually disappeared.
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.evaluate(()=>{
   const panel=document.createElement('section');
   panel.id='soul-search-852';
   panel.setAttribute('style','position:fixed;inset:70px auto auto 10px;z-index:99999;width:440px;min-height:200px;background:#211818;color:white;overflow:auto');
   document.body.append(panel);
   const catalog={souls:{
    101000:{id:101000,name:"Marksman's Soul",sourceNameRu:'Душа стрелка',
     sourceNameEn:"Marksman's Soul",slots:['weapon'],desc:'ACC +8.'},
    101001:{id:101001,name:'Fortune Soul',sourceNameRu:'Душа счастья',
     sourceNameEn:'Fortune Soul',slots:['weapon'],desc:'Critical chance +2%'},
    201000:{id:201000,name:'Belt Spirit',sourceNameRu:'Душа пояса',
     slots:['belt']}
   }};
   window.__soulSearch852Catalog=catalog;
   window.PandoraStageItemUI.render(panel,{
    record:{id:1,name:'Gladius',slot:'weapon',soulslot:1},
    slot:'weapon',mode:'souls',capacity:1,souls:[null],
    selectedSocket:0,catalog,icons:()=>null,canEdit:false,
    soulQuery:'',onSoulQuery(){},openSocket(){},assignSoul(){},
    changeMode(){throw Error('Unexpected navigation during search')}
   });
  });
  const rows=page.locator('#soul-search-852 .stage-rich-result');
  const fill=async value=>page.evaluate(text=>{
   const query=document.querySelector('#soul-search-852 [data-soul-query]');
   query.value=text;
   query.dispatchEvent(new Event('input',{bubbles:true}));
  },value);
  await fill('  СТРЕЛКА   душа  ');
  assert.equal(await rows.count(),1);
  assert.match(await rows.first().innerText(),/Marksman/);
  await fill('Marksman Soul');
  assert.equal(await rows.count(),1);
  await fill('счастья');
  assert.equal(await rows.count(),1);
  assert.match(await rows.first().innerText(),/Fortune/);
  await fill('101000');
  assert.equal(await rows.count(),0,'Internal Soul IDs are not names');
  await fill('');
  assert.equal(await rows.count(),2,'A belt-only Soul may not appear in weapon results');
  const original=await page.evaluate(()=>window.__soulSearch852Catalog.souls[101000]);
  assert.equal(original.name,"Marksman's Soul");
  assert.equal(original.sourceNameRu,'Душа стрелка');

  // A future catalog can contain far more than 80 compatible Souls.
  // Validate real DOM paging, incremental append, state restoration and
  // keyboard access using synthetic records, not guessed game drops.
  await page.evaluate(()=>{
   const panel=document.createElement('section');
   panel.id='soul-search-many';
   panel.setAttribute('style','position:fixed;inset:70px 10px auto auto;z-index:99998;'+
    'width:320px;height:480px;background:#211818;color:white;overflow:auto');
   document.body.append(panel);
   const souls={};
   for(let n=1;n<=186;n++)souls[310000+n]={
    id:310000+n,name:'Synthetic Soul '+String(n).padStart(3,'0'),
    slots:['weapon'],sourceNameRu:'Тестовая душа '+n
   };
   for(let n=1;n<=4;n++)souls[400000+n]={
    id:400000+n,name:'Belt only '+n,slots:['belt']
   };
   const state={shown:80,query:'',selected:null,counts:[],ownerEdits:[]};
   window.__soulPagingState=state;
   window.__renderSoulPaging=(owner=false)=>{
    panel.replaceChildren();
    window.PandoraStageItemUI.render(panel,{
     record:{id:10,name:'Test weapon',slot:'weapon',soulslot:1},
     slot:'weapon',mode:'souls',capacity:1,souls:[null],
     selectedSocket:0,catalog:{souls},icons:()=>null,canEdit:owner,
     soulQuery:state.query,soulShown:state.shown,
     copyLabel:(key,ru,en)=>key==='soulShowMore'?
      (document.documentElement.lang==='en'?'View more Souls':'Ещё совместимые души'):
      document.documentElement.lang==='en'?en:ru,
     editLabel:(node,key)=>{node.dataset.ownerEditKey=key;state.ownerEdits.push(key)},
     onSoulQuery:value=>{state.query=value;state.shown=80},
     onSoulShown:value=>{state.shown=value;state.counts.push(value)},
     openSocket(){},assignSoul:record=>{
      state.selected=record?.id||null;window.__renderSoulPaging(owner);
     },
     changeMode(){throw Error('Unexpected Soul mode switch')}
    });
   };
   window.__renderSoulPaging();
  });
  const panel=page.locator('#soul-search-many');
  const many=panel.locator('.stage-rich-result');
  const more=panel.locator('[data-soul-more]');
  assert.equal(await many.count(),80,'Initial render is bounded even with 186 Souls');
  assert.equal(await panel.locator('.stage-rich-list').getAttribute('data-soul-total'),'186');
  assert.equal(await more.count(),1,'The other 106 compatible Souls must be reachable');
  await many.first().evaluate(el=>el.dataset.alreadyRendered='kept');
  await more.click();
  assert.equal(await many.count(),160);
  assert.equal(await many.first().getAttribute('data-already-rendered'),'kept',
   'Show more appends rows without destroying existing previews or owner editors');
  assert.equal(await panel.locator('[data-soul-progress]').innerText(),'Душ: 160 из 186');
  assert.equal(await panel.locator('[data-soul-progress-label]').innerText(),'Душ');
  assert.equal(await panel.locator('[data-soul-progress-count]').innerText(),': 160 из 186');
  await panel.locator('[data-soul-progress-count]').evaluate(el=>el.dataset.stable='yes');
  await more.focus();
  await page.keyboard.press('Enter');
  assert.equal(await many.count(),186,'Every compatible Soul can be reached');
  assert.equal(await panel.locator('[data-soul-progress-count]').innerText(),': 186 из 186');
  assert.equal(await panel.locator('[data-soul-progress-count]').getAttribute('data-stable'),'yes',
   'The completed progress is the original live node');
  assert.equal(await more.isHidden(),true,'Completed list hides only the More button');
  assert.equal(await panel.locator('[data-soul-progress]').innerText(),'Душ: 186 из 186');
  assert.equal(await panel.evaluate(node=>document.activeElement?.classList.contains('stage-rich-result')),
   true,'Keyboard focus moves to the newly revealed items after last page');
  assert.deepEqual(await page.evaluate(()=>window.__soulPagingState.counts),[160,186]);
  assert.equal(await many.last().innerText(),'Synthetic Soul 186',
   'Original catalog order is preserved without resorting player data');
  await many.last().click();
  assert.equal(await many.count(),186,
   'After choosing a Soul the previously expanded list is restored');
  assert.equal(await page.evaluate(()=>window.__soulPagingState.selected),310186);
  assert.equal(await panel.locator('.stage-rich-list').getAttribute('data-soul-visible'),'186');
  await panel.locator('[data-soul-query]').fill('Synthetic Soul 185');
  assert.equal(await many.count(),1,'Search intersects all records beyond the first page');
  assert.equal(await more.isHidden(),true,'One result needs no More button');
  assert.equal(await panel.locator('[data-soul-progress]').innerText(),'Душ: 1 из 1');
  assert.equal(await page.evaluate(()=>window.__soulPagingState.shown),80);
  await panel.locator('[data-soul-query]').fill('');
  assert.equal(await many.count(),80,'Changing the query resets disclosure to one page');
  await page.evaluate(()=>{
   document.documentElement.lang='en';
   window.__renderSoulPaging();
  });
  assert.equal(await more.innerText(),'View more Souls');
  assert.equal(await panel.locator('[data-soul-progress]').innerText(),'80 of 186 Souls');
  assert.equal(await panel.locator('[data-soul-progress-label]').innerText(),'Souls');
  assert.equal(await panel.locator('[data-soul-progress-count]').innerText(),'80 of 186');
  await page.evaluate(()=>window.__renderSoulPaging(true));
  assert.equal(await panel.locator('[data-owner-edit-key="soulProgressLabel"]').count(),1,
   'The progress caption is owner-editable but the numeric span is not');
  assert.equal(await panel.locator('[data-soul-progress-count][data-owner-edit-key]').count(),0);
  assert.equal(await panel.locator('.stage-soul-progress .stage-control-pencil').count(),1);
  assert.equal(await panel.locator('[data-owner-edit-key="soulShowMore"]').count(),1,
   'The short RU/EN caption supports the existing owner inline editor');
  assert.equal(await more.count(),1);
  assert.equal(await many.count(),80,'Editing never renders or mutates the entire catalog');
  await page.evaluate(()=>window.__soulPagingState.shown=186);
  await page.evaluate(()=>window.__renderSoulPaging(true));
  assert.equal(await panel.locator('.stage-soul-progress .stage-control-pencil').count(),1);
  assert.equal(await panel.locator('[data-soul-progress-count]').count(),1,
   'Owner may edit the caption but never the numeric total');
  assert.equal(await panel.locator('[data-soul-more]').isHidden(),true);
  assert.equal(await panel.locator('[data-owner-edit-key="soulShowMore"]').isHidden(),true,
   'Owner More action and its pencil hide together');
  assert.equal(await panel.locator('[data-soul-progress]').innerText(),'186 of 186 Souls');
  assert.equal(await page.evaluate(()=>window.__soulPagingState.selected),310186);
  assert.deepEqual(errors,[]);
  console.log('Chromium Soul 852: bilingual aliases and 186-item progressive paging, keyboard, rerender and owner copy passed');
 }finally{await context.close()}
}
