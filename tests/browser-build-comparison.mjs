import assert from 'node:assert/strict';

// Genuine Chromium interactions, with a fixed local library and no production
// Cloudflare writes. The A/B table is inside the builds workbench, not a dialog.
export async function runBuildComparisonSmoke(browser,base){
 const idA='a'.repeat(32),idB='b'.repeat(32),secret='c'.repeat(64);
 const first={race:1,job:16,gender:0,level:10,
  name:'Витальный жрец',points:{slash:1},stats:{Выносливость:0,Ловкость:2,Сноровка:3,Дух:4},
  equipment:{},souls:{},refinements:{},gems:{},
  vitalsBuffs:{guildHp:0,guildMp:0},attributeBuffs:{guildAll:0,priestEnabled:false}};
 const second={...structuredClone(first),level:40,name:'Жрец 40-го уровня',
  points:{slash:10},stats:{Выносливость:20,Ловкость:7,Сноровка:3,Дух:5},
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
  // Saved snapshots still use AGI=Ловкость, DEX=Сноровка, SPI=Дух.
  // Player-facing comparison must instead share Origin's corrected RU names.
  const agility=panel.locator('[data-compare-row="points.agi"]');
  assert.equal((await agility.locator('th').innerText()).trim(),'Проворность');
  assert.equal((await agility.locator('[data-compare-a]').innerText()).trim(),'2');
  assert.equal((await agility.locator('[data-compare-b]').innerText()).trim(),'7');
  assert.equal((await agility.locator('[data-compare-delta]').innerText()).trim(),'+5');
  const dexterity=panel.locator('[data-compare-row="points.dex"]');
  assert.equal((await dexterity.locator('th').innerText()).trim(),'Ловкость');
  assert.equal((await dexterity.locator('[data-compare-a]').innerText()).trim(),'3');
  const spirit=panel.locator('[data-compare-row="points.spi"]');
  assert.equal((await spirit.locator('th').innerText()).trim(),'Сила духа');
  assert.equal((await spirit.locator('[data-compare-a]').innerText()).trim(),'4');
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
  // The workbench is aria-modal; the global language control is intentionally
  // outside the active dialog. English A/B data is covered by model tests.
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

export async function runSavedBuildEnglishSmoke(browser,base){
 const secret='c'.repeat(64);
 const library=Array.from({length:6},(_,i)=>({
  id:(i+1).toString(16).repeat(32),
  name:i===5?'Сияние героя':'Build '+(i+1),at:100+i,
  data:{race:1,gender:0,job:16,level:10+i,name:'Сияние героя'}
 }));
 const original=JSON.stringify(library);
 const context=await browser.newContext({viewport:{width:1280,height:860}});
 await context.addInitScript(({secret,library})=>{
  localStorage.setItem('ps-build-library-secret.v1',secret);
  localStorage.setItem('ps-build-library.v1',JSON.stringify(library));
 },{secret,library});
 await context.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.locator('#nav [data-tab="builds"]').click();
  const cards=page.locator('.build-card');
  await cards.first().waitFor({state:'visible',timeout:20000});
  assert.equal(await cards.count(),6,'Six saved builds must be present');
  const hero=cards.filter({has:page.getByRole('heading',{name:'Сияние героя'})});
  assert.equal(await hero.count(),1,'Player-authored names are never translated');
  assert.match(await hero.locator('p').first().innerText(),/^Elf · /);
  const search=page.locator('.build-library-search');
  assert.equal(await search.getAttribute('placeholder'),'Search by name, class or level…');
  await search.fill('Elf');
  assert.equal(await page.locator('.build-card:visible').count(),6);
  await search.fill('Эльф');
  assert.equal(await page.locator('.build-card:visible').count(),6);
  await search.fill('Human');
  assert.equal(await page.locator('.build-card:visible').count(),0);
  assert.match(await page.locator('.build-grid + .muted').innerText(),
   /No builds match this search/);
  await search.fill('');
  await hero.getByRole('button',{name:'↻ Save to this build'}).click();
  const warning=await hero.locator('.build-overwrite-choice p').innerText();
  assert.match(warning,/^Overwrite saved build “Сияние героя”/);
  assert.match(warning,/cannot be restored\.$/);
  assert.doesNotMatch(warning,/Перезаписать|Предыдущую/);
  assert.equal(await hero.getByRole('button',{name:'Confirm overwrite'}).isVisible(),true);
  const persisted=await page.evaluate(()=>
   JSON.stringify(JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')));
  assert.equal(persisted,original,'Previewing overwrite must not change saved data');
  assert.deepEqual(errors,[]);
  console.log('Chromium saved-build EN passed: localized race, bilingual search, dynamic prompt');
 }finally{await context.close()}
}
