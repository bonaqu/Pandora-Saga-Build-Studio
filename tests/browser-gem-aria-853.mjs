import assert from 'node:assert/strict';

// Current website widget in Chromium; source-backed interface behavior only.
export async function runGemOptionAria853Smoke(browser,base){
 const context=await browser.newContext({viewport:{width:1024,height:760}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.PandoraStageItemUI?.render&&
   window.PandoraEnchantModel?.types),null,{timeout:20000});
  await page.evaluate(()=>{
   const panel=document.createElement('section');
   panel.id='gem-aria-853';document.body.append(panel);
   const ownerCopy={
    gemTypeLabel:'Способ улучшения',gemElementLabel:'Стихия',
    'gem.type.physical':'Классический','gem.element.fire':'Пламя'
   };
   const copy=(key,ru,en)=>ownerCopy[key]||ru;
   window.PandoraStageItemUI.render(panel,{
    record:{id:1,name:'Gladius',slot:'weapon',soulslot:0,
     W:10,PEN:80,AC:0,atkspeed:1,range:100,level:1,kind:'1H_SWORD'},
    slot:'weapon',mode:'details',capacity:0,souls:[],refinement:0,
    gems:{type:'physical',element:'fire'},catalog:{souls:{}},gameTables:{},
    icons:()=>null,selectedSocket:0,canEdit:true,copyLabel:copy,
    editLabel(){},
    bindInterfaceText:(node,key,ru,en,attribute='text',suffix='')=>{
     const value=copy(key,ru,en)+suffix;
     if(attribute==='text')node.textContent=value;
     else node.setAttribute(attribute,value);
     return node;
    },
    assignGem(){throw Error('Rendering a label must not alter enhancements')},
    updateGrade(){},changeMode(){},close(){}
   });
  });
  const physical=page.locator('#gem-aria-853 [data-enchant-key="type"][data-enchant-value="physical"]');
  const fire=page.locator('#gem-aria-853 [data-enchant-key="element"][data-enchant-value="fire"]');
  assert.equal(await physical.getAttribute('aria-label'),'Способ улучшения: Классический');
  assert.equal(await fire.getAttribute('aria-label'),'Стихия: Пламя');
  assert.match(await physical.innerText(),/Классический/);
  assert.match(await fire.innerText(),/Пламя/);
  assert.equal(await page.locator('#gem-aria-853 [data-enchant-key="type"]').count(),2);
  assert.equal(await page.locator('#gem-aria-853 [data-enchant-key="element"]').count(),7);
  assert.deepEqual(errors,[]);
  console.log('Chromium Gem 853: D1 edited RU option captions and accessible names agree');
 }finally{await context.close()}
}
