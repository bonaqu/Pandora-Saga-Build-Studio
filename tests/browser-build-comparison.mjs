import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

// Genuine Chromium interactions, with a fixed local library and no production
// Cloudflare writes. The A/B table is inside the builds workbench, not a dialog.
export async function runBuildComparisonSmoke(browser,base){
 const idA='a'.repeat(32),idB='b'.repeat(32),idC='d'.repeat(32);
 const secret='c'.repeat(64),token='t'.repeat(43),username='comparison_user';
 const first={race:1,job:16,gender:0,level:10,name:'Витальный жрец',
  points:{benevolence:1},stats:{Выносливость:0,Ловкость:2,Сноровка:3,Дух:4},
  equipment:{},souls:{},refinements:{},gems:{},
  vitalsBuffs:{guildHp:0,guildMp:0},
  attributeBuffs:{guildAll:0,priestEnabled:false}};
 const second={...structuredClone(first),level:40,name:'Жрец 40-го уровня',
  points:{benevolence:10},stats:{Выносливость:20,Ловкость:7,Сноровка:3,Дух:5},
  vitalsBuffs:{guildHp:5,guildMp:4},
  attributeBuffs:{guildAll:3,priestEnabled:true}};
 const library=[
  {id:idA,name:'Жрец A',at:100,data:first},
  {id:idB,name:'Жрец B',at:101,data:second},
  {id:idC,name:'Как A',at:102,data:structuredClone(first)}
 ];
 const original=JSON.stringify(library);
 const context=await browser.newContext({viewport:{width:1240,height:850}});
 await context.addInitScript(({secret,library,token,username})=>{
  localStorage.setItem('ps-build-library-secret.v1',secret);
  localStorage.setItem('ps-account-session.v1',JSON.stringify({token,username,expires:Number.MAX_SAFE_INTEGER}));
  localStorage.setItem('ps-build-owner-scope.v1','account:'+username);
  localStorage.setItem('ps-build-library.v1',JSON.stringify(library));
 },{secret,library,token,username});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // The compact comparison requires the validated calculator tables, unlike
  // the retired snapshot-input comparison that could render while booting.
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('.build-card').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.build-signin-gate').count(),0,
   'An authenticated owner sees the actual comparison library');
  assert.equal(await page.locator('.build-card').count(),3);
  // Compare belongs in the upper-right; four commands stay on one row.
  const assertCardGeometry=async()=>{
   const metrics=await page.locator('.build-card').first().evaluate(card=>{
    const rect=element=>{const r=element.getBoundingClientRect();
     return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
    const buttons=[...card.querySelectorAll('.build-card-actions>button')];
    return{card:rect(card),compare:rect(card.querySelector('.build-card-compare')),
     actions:buttons.map(rect),labels:buttons.map(node=>node.querySelector('.build-card-action-label')?.textContent.trim()),
     compareAccessible:Boolean(card.querySelector('.build-card-compare input[aria-label]'))};
   });
   assert.equal(metrics.actions.length,4);
   const names=metrics.labels.map(s=>s.replace(/^[↻🔗]\s*/u,''));
   assert.equal(names[0],'Открыть');
   assert.equal(names[1],'Перезаписать');
   assert.deepEqual(names.slice(2),['Поделиться','Удалить']);
   assert.equal(metrics.compareAccessible,true);
   const compareStyle=await page.locator('.build-card-compare').first().evaluate(el=>{
    const s=getComputedStyle(el);
    return{border:s.borderTopWidth,background:s.backgroundColor,boxShadow:s.boxShadow};
   });
   assert.equal(compareStyle.border,'0px','Compare label must not have its own frame');
   assert.equal(compareStyle.background,'rgba(0, 0, 0, 0)',
    'Compare checkbox label should be visually transparent');
   assert.equal(compareStyle.boxShadow,'none','No duplicate highlight ring around Compare');
   assert.ok(metrics.compare.right<=metrics.card.right+1);
   assert.ok(metrics.compare.top<metrics.actions[0].top);
   assert.ok(metrics.actions.every((r,i)=>i===0||
    (Math.abs(r.top-metrics.actions[0].top)<2&&r.left>metrics.actions[i-1].left)),
    'All four actions must share one horizontal row');
  };
  await assertCardGeometry();
  await mkdir('artifacts/layout',{recursive:true});
  await page.screenshot({path:'artifacts/layout/saved-build-cards-desktop.jpg',
   type:'jpeg',quality:76,animations:'disabled'});
  const panel=page.locator('[data-build-compare]');
  await panel.waitFor({state:'visible'});
  assert.equal(await page.locator('#modalRoot .modal').count(),0);
  await panel.getByRole('button',{name:'Развернуть сравнение'}).click();
  const selects=panel.locator('[data-compare-select]');
  await selects.nth(0).selectOption(idA);
  await selects.nth(1).selectOption(idB);
  const hp=panel.locator('[data-compare-row="stat.hp"]');
  await hp.waitFor({state:'visible',timeout:20000});
  assert.equal((await hp.innerText()).trim(),'ОЗ');
  const hpA=panel.locator('[data-compare-a="stat.hp"]');
  const hpB=panel.locator('[data-compare-b="stat.hp"]');
  const firstA=(await hpA.innerText()).trim();
  const firstB=(await hpB.innerText()).trim();
  assert.notEqual(firstA,firstB,'Different calculated health must be visible');
  assert.equal(await hpB.getAttribute('data-compare-advantage'),'',
   'Higher HP in B should be bold');
  assert.equal(await hpA.getAttribute('data-compare-advantage'),null);
  assert.equal(await panel.locator('.build-compare-table thead th').count(),6);
  assert.equal(await panel.locator('[data-compare-delta]').count(),0);
  assert.match(await panel.locator('.build-compare-summary').innerText(),/Отличий:/);
  const rows=panel.locator('[data-compare-row]'),count=await rows.count();
  assert.ok(count>=1&&count<=26,'Only main Remaked-style stats: '+count);
  assert.equal(await panel.locator('.build-compare-table tbody tr').count(),
   Math.ceil(count/2),'Two distinct stat/A/B groups must share each table row');
  assert.equal(await panel.locator('[data-compare-equal="true"]').count(),0);
  assert.equal(await panel.locator('.build-compare-group').count(),0);
  assert.equal(await panel.locator('[data-compare-category]').count(),0);
  assert.equal(await panel.locator('[data-compare-differences]').count(),0);
  assert.equal(await panel.locator('.build-compare-search').count(),0);
  assert.equal(await panel.locator('[data-compare-row^="gear."]').count(),0);
  assert.equal(await panel.locator('[data-compare-row^="branch."]').count(),0);
  await panel.getByRole('button',{name:'Поменять билды A и B местами'}).click();
  assert.equal((await hpA.innerText()).trim(),firstB);
  assert.equal((await hpB.innerText()).trim(),firstA);
  assert.equal(await hpA.getAttribute('data-compare-advantage'),'',
   'Swapping builds must move the bold reading to A');
  assert.equal(await hpB.getAttribute('data-compare-advantage'),null);
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
  await assertCardGeometry();
  await page.screenshot({path:'artifacts/layout/saved-build-cards-mobile.jpg',
   type:'jpeg',quality:76,animations:'disabled'});
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
 const secret='c'.repeat(64),token='u'.repeat(43),username='english_user';
 const library=Array.from({length:6},(_,i)=>({
  id:(i+1).toString(16).repeat(32),
  name:i===5?'Сияние героя':i===4?'Тёмный герой':'Build '+(i+1),at:100+i,
  data:{race:1,gender:0,job:16,level:10+i,name:'Сияние героя'}
 }));
 const original=JSON.stringify(library);
 const context=await browser.newContext({viewport:{width:1280,height:860}});
 await context.addInitScript(({secret,library,token,username})=>{
  localStorage.setItem('ps-build-library-secret.v1',secret);
  localStorage.setItem('ps-account-session.v1',JSON.stringify({token,username,expires:Number.MAX_SAFE_INTEGER}));
  localStorage.setItem('ps-build-owner-scope.v1','account:'+username);
  localStorage.setItem('ps-build-library.v1',JSON.stringify(library));
 },{secret,library,token,username});
 await context.route('**/*',route=>route.request().url().startsWith(base+'/')?
  route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  // A fully bilingual interface includes screen-reader controls as well as
  // visible labels. Game record/player-provided names are not translated.
  assert.equal((await page.locator('main h1').innerText()).trim(),
   'Pandora Saga Build Studio — character planner');
  assert.equal(await page.locator('#workspace').getAttribute('aria-label'),
   'Character planner workspace');
  assert.equal(await page.locator('#raceGrid').getAttribute('aria-label'),
   'Race portrait carousel');
  assert.match(await page.locator('#raceGrid img').getAttribute('aria-label'),/^Choose /);
  assert.doesNotMatch(await page.locator('#raceGrid img').getAttribute('alt'),/Человек|мужчина|женщина/);
  assert.equal(await page.locator('#raceGrid .race-slide-arrow.previous').getAttribute('aria-label'),
   'Previous portrait');
  assert.equal(await page.locator('#raceGrid .race-slide-arrow.next').getAttribute('aria-label'),
   'Next portrait');
  assert.equal(await page.locator('#pathSkillSearch').getAttribute('aria-label'),'Search skills');
  assert.equal(await page.locator('#pathSkillStatus').getAttribute('aria-label'),'Skill filter');
  await page.locator('[data-origin-tab="stats"]').click();
  assert.deepEqual(await page.locator('#originVitals .origin-vital span').allTextContents(),
   ['HP','MP']);
  assert.match(await page.locator('#originVitals').getAttribute('aria-label'),/^HP/);
  await page.locator('#nav [data-tab="builds"]').click();
  assert.equal((await page.locator('#detailPanel .eyebrow').innerText()).trim(),
   'Character workshop');
  assert.equal(await page.locator('#dockClose').getAttribute('aria-label'),
   'Close workbench');
  const cards=page.locator('.build-card');
  await cards.first().waitFor({state:'visible',timeout:20000});
  assert.equal(await cards.count(),6,'Six saved builds must be present');
  assert.equal(await page.locator('.build-signin-gate').count(),0);
  assert.equal(await page.locator('.build-transfer').count(),0,
   'The bilingual account library must not show the retired old-build importer');
  const hero=cards.filter({has:page.getByRole('heading',{name:'Сияние героя'})});
  assert.equal(await hero.count(),1,'Player-authored names are never translated');
  assert.match(await hero.locator('p').first().innerText(),/^Elf · /);
  const search=page.locator('.build-library-search');
  assert.equal(await search.getAttribute('placeholder'),'Search by name, class or level…');
  await search.fill('Elf');
  assert.equal(await page.locator('.build-card:visible').count(),6);
  await search.fill('Эльф');
  assert.equal(await page.locator('.build-card:visible').count(),6);
  await search.fill('Elf   15');
  assert.equal(await page.locator('.build-card:visible').count(),1,
   'Race and level search terms must match across different card fields');
  assert.equal(await hero.isVisible(),true,'The matching saved build must stay visible');
  await search.fill('Эльф 12');
  assert.equal(await page.locator('.build-card:visible').count(),1,
   'Search terms must work in the alternate language');
  await search.fill('темный Elf 14');
  assert.equal(await page.locator('.build-card:visible').count(),1,
   'Build search must match ё/е across RU name, EN race and level');
  await search.fill('ГЕРОЙ   ТЕМНЫЙ');
  assert.equal(await page.locator('.build-card:visible').count(),1,
   'Case, whitespace and reordered words must be ignored');
  await search.fill('Human');
  assert.equal(await page.locator('.build-card:visible').count(),0);
  assert.match(await page.locator('.build-grid + .muted').innerText(),
   /No builds match this search/);
  await search.fill('');
  // A delayed D1 refresh must not erase an unsaved name, search focus or
  // scroll position; all requests in this test are synthetic.
  const refreshStarted=new Promise(resolve=>{page.__refreshStarted=resolve});
  let releaseRefresh=null;
  await page.route('**/api/library',async route=>{
   if(route.request().method()!=='GET')return route.abort();
   page.__refreshStarted();
   await new Promise(resolve=>{releaseRefresh=resolve});
   await route.fulfill({status:200,contentType:'application/json',
    headers:{'access-control-allow-origin':'*'},
    body:JSON.stringify({records:library.map(entry=>({id:entry.id,entry}))})});
  });
  await page.locator('.build-toolbar button').filter({
   hasText:/Refresh library|Обновить библиотеку/
  }).click();
  await refreshStarted;
  const typed='Unsaved title during cloud refresh';
  await page.locator('.build-name-input').fill(typed);
  await search.fill('темный');
  const beforeScroll=await page.locator('#detailContent').evaluate(el=>{
   el.style.maxHeight='140px';
   el.scrollTop=65;
   return el.scrollTop;
  });
  releaseRefresh();
  await page.waitForFunction(()=>
   document.querySelector('.cloud-library-status')?.textContent?.includes('connected')||
   document.querySelector('.cloud-library-status')?.textContent?.includes('подключена'),
   null,{timeout:15000});
  assert.equal(await page.locator('.build-name-input').inputValue(),typed,
   'Cloud refresh must retain a typed but unsaved build name');
  assert.equal(await search.inputValue(),'темный');
  assert.equal(await search.evaluate(el=>document.activeElement===el),true,
   'Cloud refresh must restore typing focus to search');
  assert.equal(await page.locator('#detailContent').evaluate(el=>el.scrollTop),beforeScroll,
   'Cloud refresh must retain the drawer scroll offset');
  assert.equal(await page.locator('.build-card:visible').count(),1);
  await search.fill('');
  await hero.getByRole('button',{name:'Overwrite',exact:true}).click();
  const warning=await hero.locator('.build-overwrite-choice p').innerText();
  assert.match(warning,/^Overwrite saved build “Сияние героя”/);
  assert.match(warning,/cannot be restored\.$/);
  assert.doesNotMatch(warning,/Перезаписать|Предыдущую/);
  assert.equal(await hero.getByRole('button',{name:'Confirm overwrite'}).isVisible(),true);
  const persisted=await page.evaluate(()=>
   JSON.parse(localStorage.getItem('ps-build-library.v1')||'[]'));
  const byId=rows=>rows.slice().sort((a,b)=>a.id.localeCompare(b.id));
  assert.deepEqual(byId(persisted),byId(library),
   'Cloud refresh may sort build cards, but must preserve every saved build and field');
  await hero.locator('.build-overwrite-choice').getByRole('button',{name:'Cancel'}).click();
  await search.fill('Сияние героя');
  assert.equal(await page.locator('.build-card:visible').count(),1);
  await hero.getByRole('button',{name:'Delete',exact:true}).click();
  await hero.getByRole('button',{name:'Delete build'}).click();
  // Removing one of six saved records leaves five. The active search must
  // remain visible, with zero matches instead of leaking unfiltered cards.
  await search.waitFor({state:'visible'});
  assert.equal(await search.inputValue(),'Сияние героя');
  assert.equal(await page.locator('.build-card').count(),5);
  assert.equal(await page.locator('.build-card:visible').count(),0);
  assert.match(await page.locator('.build-grid + .muted').innerText(),
   /No builds match this search/);
  assert.deepEqual(errors,[]);
  console.log('Chromium saved-build EN passed: localized race, bilingual search, dynamic prompt');
 }finally{await context.close()}
}
