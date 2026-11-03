import assert from 'node:assert/strict';

// Genuine Chromium interactions, with a fixed local library and no production
// Cloudflare writes. The A/B table is inside the builds workbench, not a dialog.
export async function runBuildComparisonSmoke(browser,base){
 const idA='a'.repeat(32),idB='b'.repeat(32),secret='c'.repeat(64);
 const first={race:1,job:16,gender:0,level:10,
  name:'Витальный жрец',points:{slash:1},stats:{Выносливость:0},
  equipment:{},souls:{},refinements:{},gems:{},
  vitalsBuffs:{guildHp:0,guildMp:0},attributeBuffs:{guildAll:0,priestEnabled:false}};
 const second={...structuredClone(first),level:40,name:'Жрец 40-го уровня',
  points:{slash:10},stats:{Выносливость:20},
  vitalsBuffs:{guildHp:10,guildMp:20},attributeBuffs:{guildAll:3,priestEnabled:true}};
 const library=[{id:idA,name:'Жрец A',at:100,data:first},
  {id:idB,name:'Жрец B',at:101,data:second}];
 const original=JSON.stringify(library);
 const context=await browser.newContext({viewport:{width:1240,height:850}});
 await context.addInitScript(({secret,library})=>{
  localStorage.setItem('ps-build-library-secret.v1',secret);
  localStorage.setItem('ps-build-library.v1',JSON.stringify(library));
 },{secret,library});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('.build-card').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.build-card').count(),2);
  const panel=page.locator('[data-build-compare]');
  await panel.waitFor({state:'visible'});
  assert.equal(await page.locator('#modalRoot .modal').count(),0,
   'Compare cannot open a separate modal');
  await panel.getByRole('button',{name:'Развернуть сравнение'}).click();
  const selects=panel.locator('[data-compare-select]');
  await selects.nth(0).selectOption(idA);
  await selects.nth(1).selectOption(idB);
  const level=panel.locator('[data-compare-row="level"]');
  await level.waitFor({state:'visible',timeout:20000});
  assert.equal((await level.locator('[data-compare-a]').innerText()).trim(),'10');
  assert.equal((await level.locator('[data-compare-b]').innerText()).trim(),'40');
  assert.equal((await level.locator('[data-compare-delta]').innerText()).trim(),'+30');
  assert.equal(await panel.locator('.build-compare-table').isVisible(),true);
  assert.match(await panel.locator('.build-compare-summary').innerText(),/Отличаются/);
  const diff=panel.locator('[data-compare-differences]');
  assert.equal(await diff.isChecked(),true,'Differences should be default');
  const countDiff=await panel.locator('[data-compare-row]:visible').count();
  await diff.uncheck();
  const countAll=await panel.locator('[data-compare-row]:visible').count();
  assert.ok(countAll>countDiff,'All metrics must include identical fields');
  assert.ok(countAll>40,'Full matrix must cover hero results, branches, gear and buffs');
  await panel.locator('[data-compare-category="character"]').click();
  assert.equal(await level.isVisible(),true);
  assert.equal(await panel.locator('[data-compare-row="gear.0"]').isVisible(),false);
  await panel.locator('[data-compare-category="all"]').click();
  const search=panel.getByRole('searchbox',{name:'Поиск по сравнительным характеристикам'});
  await search.fill('Уровень');
  assert.equal(await level.isVisible(),true);
  assert.ok(await panel.locator('[data-compare-row]:visible').count()<countAll);
  await search.fill('');
  await panel.getByRole('button',{name:'Поменять билды A и B местами'}).click();
  assert.equal((await level.locator('[data-compare-delta]').innerText()).trim(),'-30');
  assert.equal(await selects.nth(0).inputValue(),idB);
  assert.equal(await selects.nth(1).inputValue(),idA);
  const persisted=await page.evaluate(()=>JSON.stringify(
   JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')));
  assert.equal(persisted,original,
   'Comparing saved builds must not rewrite either saved snapshot');
  await panel.getByRole('button',{name:'Скрыть сравнение'}).click();
  assert.equal(await panel.locator('.build-compare-table').isVisible(),false);
  assert.equal(await page.locator('.build-card').count(),2,'Build manager stays mounted');
  // Narrow screens may scroll the stat table internally, but not overflow
  // the entire document or force navigation to another dialog.
  await page.setViewportSize({width:390,height:780});
  await panel.getByRole('button',{name:'Развернуть сравнение'}).click();
  const overflow=await page.evaluate(()=>
   Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-
   document.documentElement.clientWidth);
  assert.ok(overflow<=14,'Comparison created page-level overflow: '+overflow);
  assert.deepEqual(errors,[]);
  console.log('Chromium inline build comparison passed: A/B, real delta, all/diff/filter, swap and responsive UI');
 }finally{await context.close()}
}
