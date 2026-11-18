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
  assert.deepEqual(errors,[]);
  console.log('Chromium Soul 852: bilingual aliases, spaced keywords, source ID safety and slot gates passed');
 }finally{await context.close()}
}
