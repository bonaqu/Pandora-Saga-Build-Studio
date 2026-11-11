import assert from 'node:assert/strict';

// Read-only public code path used by the actual owner change history.
// This test never authenticates or posts data to production D1.
export async function runOwnerHistory652Smoke(browser,base){
 const ctx=await browser.newContext({viewport:{width:1365,height:850}});
 await ctx.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await ctx.newPage();
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.PandoraOwnerChangeReview?.inspect)&&
   Boolean(window.PandoraItemPresentation?.slotLabel));
  const content=await page.evaluate(()=>{
   const base={items:{50:{name:'Ключ',nameEn:'Key'},
    60:{name:'Сундук',nameEn:'Chest'}},chests:{boxes:[{i:60}],npc:[]},
    classes:{warrior:{name:'Воин',nameEn:'Warrior'}}};
   const inspect=window.PandoraOwnerChangeReview.inspect;
   const fields=(key,patch,lang)=>inspect(key,JSON.stringify(patch),{
    base,items:base.items,classes:base.classes,lang
   }).changes.map(row=>({field:row.field,after:row.after}));
   return{
    chestEn:fields('chestedit.60',[[{i:50,n:2,p:30},{gold:1,p:70}]],'en'),
    chestRu:fields('chestedit.60',[[{i:50,n:2,p:30},{gold:1,p:70}]],'ru'),
    itemEn:fields('itemedit.50',{slots:['weapon','shield'],
     classes:{warrior:true}},'en'),
    itemRu:fields('itemedit.50',{slots:['weapon','shield'],
     classes:{warrior:true}},'ru')
   };
  });
  const find=(rows,field)=>rows.find(row=>row.field===field)?.after;
  assert.equal(find(content.chestEn,'Chest contents'),
   'Draw 1: Key ×2 · 30%, Gold · 70%');
  assert.equal(find(content.chestRu,'Содержимое сундука'),
   'Розыгрыш 1: Ключ ×2 · 30%, Золото · 70%');
  assert.equal(find(content.itemEn,'Compatible slots'),'Weapon, Shield');
  assert.equal(find(content.itemRu,'Совместимые слоты'),'Оружие, Щит');
  assert.equal(find(content.itemEn,'Eligible classes'),'Warrior');
  assert.equal(find(content.itemRu,'Доступные классы'),'Воин');
  console.log('Owner change history 652: EN/RU chest, slots and professions verified');
 }finally{await ctx.close()}
}
