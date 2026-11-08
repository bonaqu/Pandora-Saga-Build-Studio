import assert from 'node:assert/strict';

// Genuine Chromium interactions, with a fixed local library and no production
// Cloudflare writes. The A/B table is inside the builds workbench, not a dialog.
export async function runBuildComparisonSmoke(browser,base){
 const idA='a'.repeat(32),idB='b'.repeat(32),idC='d'.repeat(32);
 const secret='c'.repeat(64);
 const first={race:1,job:16,gender:0,level:10,name:'Витальный жрец',
  points:{slash:1},stats:{Выносливость:0,Ловкость:2,Сноровка:3,Дух:4},
  equipment:{},souls:{},refinements:{},gems:{},
  vitalsBuffs:{guildHp:0,guildMp:0},
  attributeBuffs:{guildAll:0,priestEnabled:false}};
 const second={...structuredClone(first),level:40,name:'Жрец 40-го уровня',
  points:{slash:10},stats:{Выносливость:20,Ловкость:7,Сноровка:3,Дух:5},
  vitalsBuffs:{guildHp:10,guildMp:20},
  attributeBuffs:{guildAll:3,priestEnabled:true}};
 const library=[
  {id:idA,name:'Жрец A',at:100,data:first},
  {id:idB,name:'Жрец B',at:101,data:second},
  {id:idC,name:'Как A',at:102,data:structuredClone(first)}
 ];
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
  assert.equal(await page.locator('.build-card').count(),3);
  const panel=page.locator('[data-build-compare]');
  await panel.waitFor({state:'visible'});
  assert.equal(await page.locator('#modalRoot .modal').count(),0);
  await panel.getByRole('button',{name:'Развернуть сравнение'}).click();
  const selects=panel.locator('[data-compare-select]');
  await selects.nth(0).selectOption(idA);
  await selects.nth(1).selectOption(idB);
  const hp=panel.locator('[data-compare-row="stat.hp"]');
  await hp.waitFor({state:'visible',timeout:20000});
  assert.equal((await hp.locator('th').innerText()).trim(),'ОЗ');
  const hpA=(await hp.locator('[data-compare-a]').innerText()).trim();
  const hpB=(await hp.locator('[data-compare-b]').innerText()).trim();
  assert.notEqual(hpA,hpB,'Different calculated health must be visible');
  const delta=(await hp.locator('[data-compare-delta]').innerText()).trim();
  assert.match(delta,/^[+-][0-9]/);
  assert.match(await panel.locator('.build-compare-summary').innerText(),/Отличий:/);
  const rows=panel.locator('[data-compare-row]'),count=await rows.count();
  assert.ok(count>=1&&count<=26,'Only main Remaked-style stats: '+count);
  assert.equal(await panel.locator('[data-compare-equal="true"]').count(),0);
  assert.equal(await panel.locator('.build-compare-group').count(),0);
  assert.equal(await panel.locator('[data-compare-category]').count(),0);
  assert.equal(await panel.locator('[data-compare-differences]').count(),0);
  assert.equal(await panel.locator('.build-compare-search').count(),0);
  assert.equal(await panel.locator('[data-compare-row^="gear."]').count(),0);
  assert.equal(await panel.locator('[data-compare-row^="branch."]').count(),0);
  await panel.getByRole('button',{name:'Поменять билды A и B местами'}).click();
  assert.equal((await hp.locator('[data-compare-a]').innerText()).trim(),hpB);
  assert.equal((await hp.locator('[data-compare-b]').innerText()).trim(),hpA);
  assert.equal((await hp.locator('[data-compare-delta]').innerText()).trim(),
   delta.startsWith('+')?'-'+delta.slice(1):'+'+delta.slice(1));
  assert.equal(await selects.nth(0).inputValue(),idB);
  assert.equal(await selects.nth(1).inputValue(),idA);
  await selects.nth(0).selectOption(idC);
  assert.match(await panel.locator('.build-compare-summary').innerText(),
   /характеристик отличий нет/);
  assert.equal(await panel.locator('.build-compare-table').isVisible(),false);
  await selects.nth(0).selectOption(idB);
  assert.equal(await hp.isVisible(),true);
  const persisted=await page.evaluate(()=>JSON.stringify(
   JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]')));
  assert.equal(persisted,original,'Comparison cannot rewrite saved builds');
  await panel.getByRole('button',{name:'Скрыть сравнение'}).click();
  assert.equal(await panel.locator('.build-compare-table').isVisible(),false);
  assert.equal(await page.locator('.build-card').count(),3);
  await page.setViewportSize({width:390,height:780});
  await panel.getByRole('button',{name:'Развернуть сравнение'}).click();
  const overflow=await page.evaluate(()=>
   Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-
   document.documentElement.clientWidth);
  assert.ok(overflow<=14,'Comparison created page-level overflow: '+overflow);
  assert.deepEqual(errors,[]);
  console.log('Chromium compact A/B passed: differences, swap, identical results, mobile');
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
