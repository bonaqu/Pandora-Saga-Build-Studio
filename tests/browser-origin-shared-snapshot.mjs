import assert from 'node:assert/strict';

// Real calculator invocation count under current game data. No synthetic
// formula and no production API calls: every remote request is blocked.
export async function runOriginSharedSnapshotSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const saved={race:1,gender:0,job:8,level:45,name:'Single-pass derived stats',
  stats:{'Сноровка':3},points:{archery:25},masteryAuto:true,
  equipment:{},souls:{},refinements:{},gems:{},
  vitalsBuffs:{guildHp:0,guildMp:0},attributeBuffs:{guildAll:0,priestEnabled:false}};
 await context.addInitScript(value=>{
  localStorage.setItem('ps-build-studio.v1',JSON.stringify(value));
 },saved);
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
   document.querySelector('#catalogStatus')?.textContent.includes('навыков')&&
   document.querySelector('#originHp')?.textContent!=='—',
   null,{timeout:25000});
  await page.locator('#hero').click();
  const book=page.locator('#stageAttributes');
  await book.waitFor({state:'visible'});
  const total=label=>page.locator('#stageBookPanel .stage-result-tile')
   .filter({hasText:label}).locator('strong');
  assert.equal(Number(await total('Шанс крита').innerText().then(v=>v.replace('%',''))),1);
  const firstHp=Number(await page.locator('#originHp').innerText());

  await page.evaluate(()=>{
   const original=window.PandoraOSCalculator;
   window.__originBaseCalls=0;
   window.PandoraOSCalculator={...original,base:(...args)=>{
    window.__originBaseCalls++;return original.base(...args);
   }};
  });
  const count=()=>page.evaluate(()=>window.__originBaseCalls);
  const clear=()=>page.evaluate(()=>{window.__originBaseCalls=0});
  await book.locator('[data-book-page="buffs"]').click();
  const guild=page.locator('#stageBookPanel [data-book-section="guild"]');
  assert.equal(await guild.getAttribute('open'),null,'Guild starts collapsed');
  await guild.locator('summary').click();
  await clear();
  await page.locator('#stageBookPanel [data-book-setting="guildAll"]').selectOption('1');
  assert.equal(await count(),1,
   'A guild-stat change must calculate once, not separately for Origin, Book and vitals');
  await book.locator('[data-book-page="summary"]').click();
  assert.equal(Number((await total('Шанс крита').innerText()).replace('%','')),2,
   '9 DEX + one guild stat must cross the 10 DEX critical breakpoint');
  await book.locator('[data-book-page="buffs"]').click();

  await clear();
  await page.locator('#stageBookPanel [data-book-setting="guildHp"]').selectOption('5');
  assert.equal(await count(),1,
   'A guild-HP change must reuse one snapshot between vitals and enhancement readout');
  const secondHp=Number(await page.locator('#originHp').innerText());
  assert.ok(secondHp>firstHp,'Guild HP changed but the Origin vitals did not');

  await clear();
  await page.locator('#level').evaluate(node=>{
   node.value='46';node.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.ok(await count()<=3,
   'A full site redraw should reuse one snapshot across the three Origin panels');
  await book.locator('[data-book-page="summary"]').click();
  assert.equal(Number((await total('Шанс крита').innerText()).replace('%','')),2);
  assert.equal(await book.isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('Chromium shared Origin snapshot passed: guild+1 DEX, guild HP and level redraw with bounded base() passes');
 }finally{await context.close()}
}
