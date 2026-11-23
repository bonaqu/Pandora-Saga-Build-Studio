import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

export async function runAdminEntrySmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const calls=[],townOverrides=new Map();
 // This browser regression must remain valid after every release bump.
 // Offer exactly the next revision after the HTML currently under test.
 const runningRelease=JSON.parse(readFileSync(new URL('../site-version.json',import.meta.url),'utf8')).release;
 const futureRelease=runningRelease.replace(/\.\d+$/,suffix=>'.'+(Number(suffix.slice(1))+1));
 let sourceUnavailable=false,d1SourceSpoofed=false,offerNewSiteVersion=false;
 const context=await browser.newContext({viewport:{width:1280,height:860}});
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/')){
   if(offerNewSiteVersion&&url.includes('/site-version.json?check='))
    return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify({release:futureRelease})});
   return route.continue();
  }
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=route.request().method();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/runtime-capabilities'&&method==='GET')
   return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({ownerProgressionD1:true})});
  const json=(value,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(value)});
  if(path==='/api/admin/catalog/test-write'&&method==='POST'){
    assert.equal(route.request().headers().authorization,'Bearer '+ 'a'.repeat(43));
    calls.push('d1-write-check');
    return json({ok:true,readback:true,cleaned:true,
      overrideReadback:true,overrideCleaned:true,activeCatalogUnchanged:true});
  }
  // Owner export review is mocked; no real PR is created by this scenario.
  if(path==='/api/admin/catalog/owner-review'&&method==='GET'){
   calls.push('owner-review');
   return json({configured:true,count:2,fingerprint:'qa-owner-fingerprint'});
  }
  if(path==='/api/admin/catalog/owner-pr'&&method==='POST'){
   calls.push('owner-pr');
   return json({url:'https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/246'});
  }
  if(path==='/api/admin/catalog/github-status'&&method==='GET')
   return json({configured:true,connected:true,writeAccess:true});
  if(path==='/api/admin/catalog/status'&&method==='POST')
   return json({active:'ps-browser-snapshot'});
  if(path==='/api/admin/catalog/github-pr'&&method==='POST'){
   const data=route.request().postDataJSON();
   assert.equal(data.expectedActive,'ps-browser-snapshot');
   assert.equal(route.request().headers().authorization,'Bearer '+ 'a'.repeat(43));
   calls.push('github-pr');
   return json({number:246,url:'https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/246'});
  }
  if(path.startsWith('/api/admin/catalog/source/')&&method==='GET'){
   if(sourceUnavailable)return json({error:'Game data source temporarily unavailable',code:'network'},502);
   const name=path.slice('/api/admin/catalog/source/'.length,-5);
   assert.equal(route.request().headers().authorization,'Bearer '+ 'a'.repeat(43),
    'Only a confirmed administrator token may retrieve the live source');
   calls.push('game-source:'+name);
   const source=JSON.parse(readFileSync(new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
   // Introduce a new game-item reference only in the mocked upstream data.
   if(name==='items')source['2'].desc+=' Получить <item 300001>.';
   return json(source);
  }
  if(path==='/api/catalog/legacyLocale.json'){
   const approved=JSON.parse(readFileSync(new URL('../data/localization/legacy-approved.v1.json',import.meta.url),'utf8'));
   const rows={};let i=0;
   for(const namespace of ['game','ui'])for(const locale of ['ru','en','jp','tw']){
    for(const [key,text] of Object.entries(approved[namespace]?.[locale]||{})){
     if(typeof text!=='string'||!text.trim())continue;
     rows[String(i++).padStart(6,'0')]={namespace,locale,key,text,source:'Legacy approved terminology'};
    }
   }
   return route.fulfill({status:200,headers:{
    ...headers,'access-control-expose-headers':'X-PS-Catalog-Snapshot, X-PS-Catalog',
    'x-ps-catalog-snapshot':'ps-browser-snapshot',
     'x-ps-catalog':d1SourceSpoofed?'archive':'d1'},
    contentType:'application/json',body:JSON.stringify(rows)});
  }
  if(path.startsWith('/api/catalog/')&&path.endsWith('.json')){
   const key=path.split('/').pop().slice(0,-5);
   const name=key==='stringsEn'?'strings.en':key;
   const content=JSON.parse(readFileSync(new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
   // One item differs in D1; the OS archive is the authoritative local test source.
   if(name==='items')content['1'].name='Старое название из D1';
   return route.fulfill({status:200,headers:{
    ...headers,'access-control-expose-headers':'X-PS-Catalog-Snapshot, X-PS-Catalog',
    'x-ps-catalog-snapshot':'ps-browser-snapshot',
     'x-ps-catalog':d1SourceSpoofed?'archive':'d1'},
    contentType:'application/json',body:JSON.stringify(content)});
  }
  if(path==='/api/admin/reset'&&method==='POST'){
   const data=route.request().postDataJSON();
   assert.equal(route.request().headers().authorization,'Bearer '+'a'.repeat(43));
   const previous=townOverrides.has(data.key)?townOverrides.get(data.key):null;
   if(previous===null||data.expectedValue!==previous)
    return json({error:'Mock concurrent edit',code:'OWNER_EDIT_CONFLICT'},409);
   townOverrides.delete(data.key);
   return json({ok:true,key:data.key,deleted:true,conditional:true});
  }
  if(path==='/api/admin/override'&&method==='POST'){
   const data=route.request().postDataJSON();
   assert.equal(route.request().headers().authorization,'Bearer '+'a'.repeat(43));
   const previous=townOverrides.has(data.key)?townOverrides.get(data.key):null;
   if(data.expectedValue!==previous)
    return json({error:'Mock concurrent edit',code:'OWNER_EDIT_CONFLICT'},409);
   townOverrides.set(data.key,data.value);
   if(data.key.startsWith('acquireedit.')){
    assert.ok(JSON.parse(data.value).some(row=>row.type==='npc'));
    calls.push('owner-acquire-edit');
   }
   if(data.key.startsWith('tradeedit.')){
    const rec=JSON.parse(data.value).recipe;
    assert.ok(rec&&rec.npc.length&&rec.i>0);
    calls.push('owner-trade-edit');
   }
   if(data.key.startsWith('itemedit.')){
    assert.match(data.key,/^itemedit\.[0-9]+$/);
    const patch=JSON.parse(data.value);
    assert.equal(patch.W,99);
    if(Array.isArray(patch.effects))calls.push('owner-effect-edit');
    calls.push('owner-item-edit');
   }
   return json({ok:true,key:data.key,value:data.value.trim(),conditional:true});
  }
  if(path==='/api/library')return json({records:[]});
  if(path==='/api/overrides')return json({values:Object.fromEntries(townOverrides)});
  if(path.startsWith('/api/account/')){
   calls.push(path);
   return json({error:'Аккаунты ещё не активированы в D1: требуется миграция 0005'},503);
  }
  if(path==='/api/admin/login'&&method==='POST'){
   const body=route.request().postDataJSON();
   calls.push(path);
   assert.equal(body.username,'administrator');
   assert.equal(body.password,'Correct admin password!');
   return json({token:'a'.repeat(43),expires:Date.now()+600000});
  }
  return route.abort();
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Mouse caption actions defer single-click until a double-click can be ruled out.
 const closeWorkbench=async()=>{
  await page.locator('#dockClose').click();
  await page.locator('#detailPanel.is-open').waitFor({state:'hidden',timeout:15000});
 };
 const chooseWikiChapter=async key=>{
  await page.locator('.wiki-categories [data-wiki-chapter="'+key+'"]').click();
  await page.waitForFunction(chapterKey=>{
   const tab=document.querySelector('.wiki-categories [data-wiki-chapter="'+chapterKey+'"]');
   return tab?.classList.contains('chosen')&&tab.dataset.ownerCaptionPending!=='1';
  },key,{timeout:15000});
 };
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#profileTrigger').click();
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await page.getByRole('button',{name:'Вход администратора'}).count(),0);
  assert.equal(await page.locator('.account-admin-entry').count(),0);
  // Admin UI remains reachable only via documented hidden gestures.
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  assert.equal(calls.filter(p=>p==='/api/account/login').length,0);
  await page.locator('input[placeholder="Пароль администратора"]').fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  assert.deepEqual(calls.filter(p=>p==='/api/admin/login'),['/api/admin/login']);
  // The hero must remain the Book entry even with owner permissions.
  assert.equal(await page.locator('#hero').getAttribute('data-edit-key'),null);
  await page.locator('#hero').click();
  await page.locator('#stageAttributes').waitFor({state:'visible'});
  assert.equal(await page.locator('.inline-owner-editor').count(),0);
  const bookControls=await page.evaluate(()=>{
   const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
   const pencil=rect('.stage-book-heading .stage-guide-edit-hint');
   const rename=rect('.stage-book-heading .stage-guide-edit-name');
   const actions=rect('.stage-book-heading>.stage-guide-actions');
   const heading=rect('.stage-book-heading');
   const close=rect('#stageAttributes .stage-book-close');
   const next=rect('#stageAttributes .stage-book-arrow[aria-label="Следующая страница"]');
   const groupActions=rect('#stageBookPanel .stage-result-section-head .stage-guide-actions');
   const chevron=rect('#stageBookPanel .stage-result-section-head .stage-result-chevron');
   const tileActions=rect('#stageBookPanel .stage-result-tile .stage-guide-actions');
   const statValue=rect('#stageBookPanel .stage-result-tile>strong');
   const intersects=(a,b)=>Boolean(a&&b&&a.left<b.right&&a.right>b.left&&
    a.top<b.bottom&&a.bottom>b.top);
   const within=(a,b)=>Boolean(a&&b&&a.left>=b.left-1&&a.right<=b.right+1&&
    a.top>=b.top-1&&a.bottom<=b.bottom+1);
   return {pencil:!!pencil,rename:!!rename,actionsWithinHeading:!actions||within(actions,heading),
    intersectsClose:intersects(actions,close),intersectsNext:intersects(actions,next),
    intersectsChevron:intersects(groupActions,chevron),
    intersectsStatValue:intersects(tileActions,statValue)};
  });
  assert.ok(await page.locator('.stage-book-heading .stage-guide-edit-hint').count()<=1);
  assert.equal(bookControls.rename,false,'Book title is directly editable');
  assert.equal(await page.locator(
   '#stageAttributes .stage-attribute-tabs [role="tab"]').count(),6);
  assert.equal(await page.locator(
   '#stageAttributes .stage-attribute-tabs .stage-book-tab-pencil').count(),0);
  assert.equal(await page.locator(
   '#stageAttributes .stage-attribute-tabs [role="tab"] .stage-book-tab-pencil').count(),0);
  for(const key of ['actionsWithinHeading','intersectsClose','intersectsNext',
   'intersectsChevron','intersectsStatValue'])
   assert.equal(bookControls[key],key==='actionsWithinHeading',key+': Book controls overlap');
  // A portrait resize can invalidate the current overlaid Book geometry.
  // Reopen it at the mobile breakpoint, as a real user would, before measuring.
  await page.locator('#stageAttributes .stage-book-close').click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('#hero').click();
  await page.locator('#stageAttributes').waitFor({state:'visible'});
  // This scenario has no selected class and therefore no calculated groups.
  // Check the always-present chapter-title toolbar and close control here;
  // result-group geometry is covered by scenarios with a real character.
  const narrow=await page.evaluate(()=>{
   const box=x=>document.querySelector(x)?.getBoundingClientRect();
   const heading=box('.stage-book-heading');
   const actions=box('.stage-book-heading .stage-guide-actions');
   const close=box('#stageAttributes .stage-book-close');
   return {actionsInside:!actions||!!heading&&actions.left>=heading.left-1&&
     actions.right<=heading.right+1,closeSeparate:!actions||!!close&&
     actions.right<=close.left+1};
  });
  assert.equal(narrow.actionsInside,true,
   'Hero Book owner buttons overflow mobile title: '+JSON.stringify(narrow));
  assert.equal(narrow.closeSeparate,true,
   'Hero Book owner buttons collide with mobile Close: '+JSON.stringify(narrow));
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#stageAttributes .stage-book-close').click();
  await page.locator('#hero').focus();
  await page.keyboard.press('Enter');
  await page.locator('#stageAttributes').waitFor({state:'visible'});
  await page.locator('#stageAttributes .stage-book-close').click();
  assert.equal(await page.locator('.path-sections .path-tab-owner-wrap>[role="tab"]').count(),2);
  assert.equal(await page.locator('.path-sections .path-tab-owner-wrap>.path-tab-pencil').count(),0);
  assert.equal(await page.locator('.path-sections [role="tab"] .path-tab-pencil').count(),0);
  await page.locator('#pathSkillsTab').click();
  // A live owner search/skill-label edit must survive a repeated Path render.
  // No D1 mutation is needed: Escape must restore the unsaved draft safely.
  const searchCopy=page.locator('#ownerSkillSearchCopy');
  await searchCopy.waitFor({state:'visible'});
  await searchCopy.locator('summary').click();
  const caption=searchCopy.locator('.studio-owner-interface-value').first();
  await caption.dblclick();
  const draft=searchCopy.locator('[data-owner-text-field]').first();
  await draft.waitFor({state:'visible'});
  await draft.fill('Тест незавершённого текста');
  await page.evaluate(()=>document.getElementById('pathSkillsTab').click());
  assert.equal(await draft.innerText(),'Тест незавершённого текста',
   'Path re-render must not destroy an active owner copy editor');
  await draft.press('Escape');
  await page.locator('#pathGrowthTab').click();
  assert.equal(await searchCopy.count(),1,
   'The hidden Skills owner panel remains mounted when Growth is open');
  await page.locator('#pathSkillsTab').click();
  assert.equal(await searchCopy.count(),1);
  assert.equal(await searchCopy.evaluate(node=>node.open),true,
   'The compact owner panel keeps its expanded state across Path navigation');
  assert.equal(await page.locator('#ownerPathMetricsCopy').count(),1,
   '18 source-independent metric captions share a collapsed editor');
  // #390: direct caption editing replaces the redundant rename pencil.
  const authoredCaption=page.locator('#pathSkillGallery .path-skill-count-caption');
  await authoredCaption.waitFor({state:'visible'});
  assert.equal(await page.locator('#pathSkillGallery .path-owner-pencil').count(),0,
   'Ordinary skill captions must not have redundant rename pencils');
  await authoredCaption.dblclick();
  const quickEditor=page.locator('#pathSkillGallery [data-owner-text-field="true"]').first();
  await quickEditor.waitFor({state:'visible'});
  await quickEditor.press('Escape');
  await page.locator('#pathGrowthTab').click();
  const ownerPanel=page.locator('#ownerDock');
  assert.equal(await ownerPanel.evaluate(node=>node.parentElement===document.body),true,
   'Editor must float above the page, not live inside the stat column');
  assert.equal(await ownerPanel.locator('.owner-dock-panel').evaluate(node=>node.inert),true);
  assert.equal(await ownerPanel.getAttribute('class'),'owner-dock owner-dock-collapsed');
  const originBefore=await page.locator('.workspace>.left').evaluate(node=>node.getBoundingClientRect().height);
  const edge=ownerPanel.locator('[data-owner-collapse]');
  assert.equal(await edge.getAttribute('aria-expanded'),'false');
  await edge.click();
  assert.equal(await edge.getAttribute('aria-expanded'),'true');
  assert.equal(await ownerPanel.locator('.owner-dock-panel').evaluate(node=>node.inert),false);
  assert.equal(await ownerPanel.locator('.owner-dock-primary').evaluate(node=>document.activeElement===node),true,
   'Opening the drawer should focus its first action for keyboard navigation');
  const ownerGeometry=await ownerPanel.evaluate(node=>{
   const box=node.querySelector('.owner-dock-panel');
   const content=node.querySelector('.owner-dock-body');
   const toggle=node.querySelector('[data-owner-collapse]');
   const bounds=box.getBoundingClientRect();
   const handle=toggle.getBoundingClientRect();
   return{width:bounds.width,innerScroll:getComputedStyle(content).overflowY,
    outerScroll:getComputedStyle(box).overflowY,
    writingMode:getComputedStyle(toggle).writingMode,
    handleTop:handle.top,boxTop:bounds.top};
  });
  assert.ok(ownerGeometry.width>=430,'Editor should fit more content: '+JSON.stringify(ownerGeometry));
  assert.equal(ownerGeometry.innerScroll,'auto');
  assert.equal(ownerGeometry.outerScroll,'hidden');
  assert.equal(ownerGeometry.writingMode,'horizontal-tb');
  assert.ok(ownerGeometry.handleTop>=ownerGeometry.boxTop,
   'Expanded editor handle must be inside the panel, not sticking out');
  // 0.790: all eight action/editor pairs retain their actual handlers.
  // The Finish action lives outside the sole scroll region and remains visible.
  const dockStructure=await ownerPanel.evaluate(root=>{
   const panel=root.querySelector('.owner-dock-panel').getBoundingClientRect();
   const body=root.querySelector('.owner-dock-body').getBoundingClientRect();
   const footer=root.querySelector('.owner-dock-footer').getBoundingClientRect();
   const groups=[...root.querySelectorAll('.owner-dock-action-group')]
    .map(node=>node.dataset.ownerGroup);
   const keys=[...root.querySelectorAll('.owner-dock-action-slot')]
    .map(node=>node.dataset.ownerDockKey);
   const collides=[...root.querySelectorAll('.owner-dock-action-slot')]
    .some(slot=>{
     return slot.querySelectorAll('button').length!==1;
    });
   return {groups,keys,footerBelowBody:footer.top>=body.bottom-2,
    footerInside:footer.bottom<=panel.bottom+2,
    finishOutsideScroll:root.querySelector('.owner-dock-footer .owner-dock-finish')!==null,
    collides};
  });
  assert.deepEqual(dockStructure.groups,['editing','game','tools']);
  assert.equal(dockStructure.keys.length,9);
  assert.equal(new Set(dockStructure.keys).size,9);
  assert.equal(dockStructure.finishOutsideScroll,true);
  assert.equal(dockStructure.footerBelowBody,true,'Finish footer must be outside scrolling content');
  assert.equal(dockStructure.footerInside,true,'Finish footer must fit inside the editor panel');
  assert.equal(dockStructure.collides,false,'Owner action slot must contain one real button, no caption pencils');
  // 0.795 owner progression editor: make an unsaved 60-level plan, verify
  // the derived table and discard without writing any D1 override.
  assert.ok(dockStructure.keys.includes('levels'));
  const gameButtons=await ownerPanel.locator(
   '.owner-dock-action-group[data-owner-group="game"] .owner-dock-action-grid').evaluate(node=>{
    const catalog=node.querySelector('.owner-dock-catalog')?.getBoundingClientRect();
    const levels=node.querySelector('.owner-dock-levels')?.getBoundingClientRect();
    return {sideBySide:!!catalog&&!!levels&&Math.abs(catalog.top-levels.top)<4&&
     catalog.right<=levels.left+2};
   });
  assert.equal(gameButtons.sideBySide,true,'Catalog and level tools should share an uncluttered row');
  const dockLevelAction=ownerPanel.locator('.owner-dock-levels');
  assert.match(await dockLevelAction.getAttribute('data-guide-hint'),/максимум героя/);
  await dockLevelAction.hover();
  await page.locator('#stage-guide-tooltip').waitFor({state:'visible',timeout:3000});
  assert.match(await page.locator('#stage-guide-tooltip').innerText(),/Сохранение — отдельно/);
  await dockLevelAction.click();
  const levelDialog=page.getByRole('dialog',{name:/Очки за уровни/});
  await levelDialog.waitFor({state:'visible'});
  assert.equal(await levelDialog.locator('.ps-level-editor-table tbody tr').count(),55);
  const jump=levelDialog.getByRole('spinbutton',{name:'Номер уровня для перехода'});
  const go=levelDialog.getByRole('button',{name:'Перейти',exact:true});
  const filter=levelDialog.getByRole('checkbox',{name:'Только изменённые уровни'});
  await jump.fill('45');await go.click();
  assert.equal(await levelDialog.locator('tr[data-level="45"] input').first()
   .evaluate(el=>document.activeElement===el),true,
   'Jump should focus the requested row without editing D1');
  await filter.check();
  assert.equal(await levelDialog.locator('.ps-level-editor-table tbody tr:visible').count(),0,
   'No edits means no changed rows');
  await filter.uncheck();
  const capInput=levelDialog.getByRole('spinbutton',{name:'Максимальный уровень героя'});
  await capInput.fill('60');
  await capInput.press('Tab');
  assert.equal(await levelDialog.locator('.ps-level-editor-table tbody tr').count(),60);
  const row56=levelDialog.locator('.ps-level-editor-table tbody tr[data-level="56"]');
  const levelAttr=row56.getByRole('spinbutton',{name:'Очки характеристик за уровень 56'});
  const levelSkill=row56.getByRole('spinbutton',{name:'Очки умений за уровень 56'});
  await levelAttr.fill('8');
  await levelSkill.fill('3');
  assert.match(await levelDialog.locator('.ps-level-editor-summary').innerText(),/552 характеристик · 137 умений/);
  const fillNew=levelDialog.getByRole('button',{name:'Заполнить пустые новые уровни'});
  assert.equal(await fillNew.isEnabled(),true);
  assert.match(await levelDialog.locator('.ps-level-editor-fill-hint').innerText(),
   /С уровня 55: \+8 характеристик \/ \+3 умений/);
  // The action is not a mysterious mass reset. It preserves manually edited
  // 56 while filling only empty new rows 57–60. Still no D1 write.
  await levelAttr.fill('10');
  await levelSkill.fill('4');
  await fillNew.click();
  assert.equal(await levelAttr.inputValue(),'10');
  assert.equal(await levelSkill.inputValue(),'4');
  for(let level=57;level<=60;level++){
   const row=levelDialog.locator('.ps-level-editor-table tbody tr[data-level="'+level+'"]');
   assert.equal(await row.locator('input').nth(0).inputValue(),'8');
   assert.equal(await row.locator('input').nth(1).inputValue(),'3');
  }
  assert.match(await levelDialog.locator('.ps-level-editor-summary').innerText(),/586 характеристик · 150 умений/);
  await filter.check();
  assert.equal(await levelDialog.locator('.ps-level-editor-table tbody tr:visible').count(),5,
   'Only five new 56–60 rows differ from the saved table');
  await jump.fill('56');await go.click();
  assert.equal(await filter.isChecked(),false,'Jump makes the target row visible');
  assert.equal(await row56.locator('input').first().evaluate(el=>el===document.activeElement),true);
  assert.equal(await fillNew.isDisabled(),true);
  assert.equal(townOverrides.has('planner.progression.v1'),false,
   'Draft edits must not write to D1');
  await levelDialog.getByRole('button',{name:'Отменить несохранённое'}).click();
  assert.equal(await levelDialog.locator('.ps-level-editor-table tbody tr').count(),55);
  assert.equal(await levelDialog.getByRole('button',{name:'Сохранить в D1'}).isDisabled(),true);
  await levelDialog.getByRole('button',{name:/Закрыть/}).click();
  assert.equal(townOverrides.has('planner.progression.v1'),false);
  const originAfter=await page.locator('.workspace>.left').evaluate(node=>node.getBoundingClientRect().height);
  assert.ok(Math.abs(originBefore-originAfter)<2,'The drawer must not stretch the stat column');
  await edge.click();
  assert.equal(await edge.getAttribute('aria-expanded'),'false');
  await edge.click();
  await ownerPanel.locator('.owner-workflow-guide>summary').focus();
  await page.keyboard.press('Escape');
  assert.equal(await edge.getAttribute('aria-expanded'),'false',
   'Escape from the drawer should collapse it');
  assert.equal(await edge.evaluate(node=>document.activeElement===node),true,
   'Closing with Escape should restore launcher focus');
  await edge.click();
  assert.match(await ownerPanel.innerText(),/Cloudflare D1/);
  assert.match(await ownerPanel.innerText(),/сохранение автоматически|сохранение автоматическое/);
  assert.equal(await ownerPanel.locator('.owner-workflow-guide[open]').count(),0,
   'The floating dock must start compact and not cover editable wiki rows');
  await ownerPanel.locator('.owner-workflow-guide>summary').click();
  assert.equal(await ownerPanel.locator('.owner-workflow-guide[open]').count(),1);
  assert.match(await ownerPanel.locator('.owner-workflow-glossary').innerText(),/Игровой каталог/);
  await ownerPanel.locator('.owner-workflow-guide>summary').click();
  assert.match(await ownerPanel.innerText(),/Копия в GitHub/);
  assert.match(await ownerPanel.innerText(),/Проверить сохранение/);
  assert.match(await ownerPanel.innerText(),/За этот сеанс: 0/);
  assert.match(await ownerPanel.innerText(),/записей в D1|запись в D1/);
  // D1 caption dblclick must never execute the diagnostic action.
  const d1Action=ownerPanel.locator('.owner-dock-action-slot[data-owner-dock-key="testD1"]');
  assert.equal(await d1Action.locator('.owner-dock-action-pencil').count(),0);
  const d1Label='Сохранение проверено';
  const d1Key='guideedit.book.owner-dock.test-d1';
  const initialD1Calls=calls.filter(x=>x==='d1-write-check').length;
  await d1Action.locator('.owner-dock-d1-check').dblclick();
  assert.equal(await d1Action.locator('.owner-dock-d1-check').isVisible(),false);
  const ownerCaptionEditor=d1Action.locator('[contenteditable="plaintext-only"]');
  await ownerCaptionEditor.waitFor({state:'visible'});
  await ownerCaptionEditor.fill(d1Label);
  await ownerCaptionEditor.press('Tab');
  await page.waitForFunction(label=>
   document.querySelector('.owner-dock-d1-check')?.textContent?.trim()===label,
   d1Label,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get(d1Key)).ru,d1Label);
  assert.equal(calls.filter(x=>x==='d1-write-check').length,initialD1Calls,
   'Editing the diagnostic label must not execute the diagnostic');
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.querySelector('.owner-dock-d1-check')?.textContent==='Test saving');
  assert.match(await ownerPanel.locator('[data-owner-dock-static]').first().getAttribute('aria-keyshortcuts'),
   /F2/,'Help-pencil accessibility label should follow English locale');
  await d1Action.locator('.owner-dock-d1-check').dblclick();
  const englishCaptionEditor=d1Action.locator('[contenteditable="plaintext-only"]');
  await englishCaptionEditor.waitFor({state:'visible'});
  await englishCaptionEditor.fill('Verify saving');
  await englishCaptionEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector('.owner-dock-d1-check')?.textContent==='Verify saving');
  assert.deepEqual(JSON.parse(townOverrides.get(d1Key)),{ru:d1Label,en:'Verify saving'});
  assert.match(await ownerPanel.innerText(),/Site editor|Editing enabled/);
  assert.equal(await ownerPanel.locator('.owner-dock-action-slot').count(),9);
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(label=>
   document.querySelector('.owner-dock-d1-check')?.textContent===label,d1Label);
  assert.match(await ownerPanel.locator('[data-owner-dock-static]').first().getAttribute('aria-keyshortcuts'),
   /F2/,'Help-pencil accessibility label should return to Russian');
  assert.match(await ownerPanel.locator('[data-owner-recent]').innerText(),/За этот сеанс: 2/);
  // 0.883: grouped owner-drawer headings/hints are authored copy, not
  // hardcoded labels. Edit RU/EN and a second group without invoking actions.
  const editingGroup=ownerPanel.locator('[data-owner-group="editing"]');
  assert.equal(await editingGroup.locator('.owner-dock-group-pencil').count(),0);
  assert.equal(await ownerPanel.locator('.owner-dock-group-pencil').count(),0);
  const editingKey='guideedit.book.owner-dock.group-editing-title';
  const beforeGroupUrl=page.url(),d1ChecksBefore=calls.filter(x=>x==='d1-write-check').length;
  await editingGroup.locator('[data-owner-group-copy="groupEditingTitle"]').dblclick();
  const captionRU=editingGroup.locator(
   '[data-owner-group-copy="groupEditingTitle"] [contenteditable="plaintext-only"]');
  await captionRU.waitFor({state:'visible'});
  await captionRU.fill('Правки и история');
  await captionRU.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '[data-owner-group-copy="groupEditingTitle"]')?.textContent==='Правки и история');
  assert.equal(JSON.parse(townOverrides.get(editingKey)).ru,'Правки и история');
  assert.equal(page.url(),beforeGroupUrl);
  assert.equal(calls.filter(x=>x==='d1-write-check').length,d1ChecksBefore,
   'Editing a heading must not trigger the Cloudflare diagnostic action');
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.querySelector(
   '[data-owner-group-copy="groupEditingTitle"]')?.textContent==='Editing');
  await editingGroup.locator('[data-owner-group-copy="groupEditingTitle"]').dblclick();
  const captionEN=editingGroup.locator(
   '[data-owner-group-copy="groupEditingTitle"] [contenteditable="plaintext-only"]');
  await captionEN.waitFor({state:'visible'});
  await captionEN.fill('Edits and history');
  await captionEN.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '[data-owner-group-copy="groupEditingTitle"]')?.textContent==='Edits and history');
  assert.deepEqual(JSON.parse(townOverrides.get(editingKey)),
   {ru:'Правки и история',en:'Edits and history'});
  assert.equal(await editingGroup.locator('[data-owner-group-copy="groupEditingTitle"]')
   .getAttribute('aria-keyshortcuts'),'F2 Enter');
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.querySelector(
   '[data-owner-group-copy="groupEditingTitle"]')?.textContent==='Правки и история');
  const gameGroup=ownerPanel.locator('[data-owner-group="game"]');
  assert.match(await gameGroup.locator('[data-owner-group-copy="groupGameHint"]')
   .innerText(),/Каталог, очки и переводы/);
  const hintKey='guideedit.book.owner-dock.group-game-hint';
  await gameGroup.locator('[data-owner-group-copy="groupGameHint"]').dblclick();
  const hintEditor=gameGroup.locator(
   '[data-owner-group-copy="groupGameHint"] [contenteditable="plaintext-only"]');
  await hintEditor.waitFor({state:'visible'});
  await hintEditor.fill('Каталог и перевод');
  await hintEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '[data-owner-group-copy="groupGameHint"]')?.textContent==='Каталог и перевод');
  assert.equal(JSON.parse(townOverrides.get(hintKey)).ru,'Каталог и перевод');
  // The ordinary Undo mechanism reverts just the latest D1 key in place.
  await ownerPanel.locator('[data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '[data-owner-group-copy="groupGameHint"]')?.textContent==='Каталог, очки и переводы');
  assert.equal(townOverrides.has(hintKey),false);
  assert.equal(JSON.parse(townOverrides.get(editingKey)).ru,'Правки и история');

  // Origin captions share the same authenticated inline D1 path as approved
  // encyclopedia editing: pencil -> focus/blur -> independent RU/EN fields.
  const raceCopy='guideedit.book.origin.race-choose';
  await edge.click(); // owner drawer must not overlay the actual inline caption
  assert.equal(await edge.getAttribute('aria-expanded'),'false');
  const captionReady=async (target,value,stage)=>{
   try{await target.waitForFunction(expected=>
    document.querySelector('.race-slide-select')?.textContent?.trim()===expected,
    value,{timeout:12000})}
   catch(error){
    const detail=await target.evaluate(()=>({
     lang:document.documentElement.lang,
     shown:document.querySelector('.race-slide-select')?.textContent,
     editor:document.querySelector('.origin-copy-input-slot')?.textContent,
     catalog:document.querySelector('#catalogStatus')?.textContent,
     status:document.querySelector('#startupStatus')?.textContent
    }));
    throw Error('Origin edit stage '+stage+': '+JSON.stringify(detail)+'; '+error.message);
   }
  };
  const originEditor=async (value,stage)=>{
   // #390: direct double-click on the actual visible caption, no extra ✎.
   await page.locator('.race-slide-select').dblclick();
   const field=page.locator('.origin-copy-input-slot [contenteditable]');
   await field.waitFor({state:'visible'});
   await field.fill(value);
   await field.press('Tab');
   await captionReady(page,value,stage);
  };
  assert.equal(await page.locator('[data-origin-edit-for="raceChoose"]').count(),0);
  await originEditor('Выбрать расу','RU-save');
  assert.equal(JSON.parse(townOverrides.get(raceCopy)).ru,'Выбрать расу');
  await page.locator('#locale [data-locale="en"]').click();
  await captionReady(page,'Choose this race','EN-default');
  await originEditor('Select race','EN-save');
  assert.deepEqual(JSON.parse(townOverrides.get(raceCopy)),
   {ru:'Выбрать расу',en:'Select race'});
  await page.locator('#locale [data-locale="ru"]').click();
  await captionReady(page,'Выбрать расу','RU-return');
  assert.equal(await page.locator('#originTabs [data-origin-copy-key="tabRace"]').count(),1);
  await edge.click();
  assert.equal(await edge.getAttribute('aria-expanded'),'true');
  // Undo a bilingual Origin label without remounting the current race picker.
  await page.evaluate(()=>{window.__qaOriginSelect=document.querySelector('.race-slide-select')});
  const undoOrigin=page.waitForResponse(response=>response.url().endsWith('/api/admin/override')&&
   response.request().postDataJSON()?.key===raceCopy);
  await page.locator('#ownerDock [data-owner-undo]').click();
  await undoOrigin;
  assert.equal(await page.evaluate(()=>
   window.__qaOriginSelect===document.querySelector('.race-slide-select')),true);
  assert.deepEqual(JSON.parse(townOverrides.get(raceCopy)),{ru:'Выбрать расу'});
  await page.locator('#locale [data-locale="en"]').click();
  await captionReady(page,'Choose this race','EN-after-origin-undo');
  await page.locator('#locale [data-locale="ru"]').click();
  await captionReady(page,'Выбрать расу','RU-after-origin-undo');
  // A floating owner drawer must preserve explicit expansion across workbenches.
  await page.locator('#nav [data-tab="builds"]').click();
  await page.locator('#detailPanel.is-open').waitFor({state:'visible'});
  assert.equal(await edge.getAttribute('aria-expanded'),'true',
   'Opening saved builds must not collapse the editor');
  await closeWorkbench();
  assert.equal(await edge.getAttribute('aria-expanded'),'true');
  await ownerPanel.locator('.owner-dock-primary').click();
  await page.locator('#detailPanel.is-open').waitFor({state:'visible'});
  assert.equal(await edge.getAttribute('aria-expanded'),'true',
   'Opening Wiki must not collapse the editor');
  const expandedOnWiki=await ownerPanel.locator('.owner-dock-panel').evaluate(node=>{
   const bounds=node.getBoundingClientRect();
   return{left:bounds.left,right:bounds.right,width:bounds.width,
    viewport:document.documentElement.clientWidth};
  });
  assert.ok(Math.abs(expandedOnWiki.left)<2&&
   expandedOnWiki.right<=expandedOnWiki.viewport+2&&expandedOnWiki.width>=430,
   'Expanded editor not docked at left in Wiki: '+JSON.stringify(expandedOnWiki));
  const hitArea=async()=>edge.evaluate(button=>{
   const rect=button.getBoundingClientRect();
   const target=document.elementFromPoint(
    rect.left+rect.width/2,rect.top+rect.height/2);
   return target===button||button.contains(target);
  });
  assert.equal(await hitArea(),true,'Sticky heading intercepted Hide');
  await edge.click();
  assert.equal(await edge.getAttribute('aria-expanded'),'false');
  const collapsedAfterWiki=await edge.evaluate(node=>{
   const rect=node.getBoundingClientRect(),root=
    document.querySelector('#ownerDock').getBoundingClientRect();
   return{left:rect.left,rootLeft:root.left,
    position:getComputedStyle(node).position,
    mode:getComputedStyle(node).writingMode};
  });
  assert.ok(Math.abs(collapsedAfterWiki.left)<2&&
   Math.abs(collapsedAfterWiki.rootLeft)<2,
   'Collapsed editor must remain flush left: '+JSON.stringify(collapsedAfterWiki));
  assert.equal(collapsedAfterWiki.position,'relative');
  assert.equal(collapsedAfterWiki.mode,'horizontal-tb');
  await edge.hover();
  const hoverFrames=await edge.evaluate(async button=>{
   const samples=[];
   for(let i=0;i<6;i++){
    await new Promise(resolve=>setTimeout(resolve,130));
    const bounds=button.getBoundingClientRect();
    const top=document.elementFromPoint(bounds.left+bounds.width/2,
     bounds.top+bounds.height/2);
    const style=getComputedStyle(button);
    samples.push({left:bounds.left,opacity:Number(style.opacity),
     visible:style.visibility,display:style.display,
     topmost:top===button||button.contains(top)});
   }
   return samples;
  });
  assert.ok(hoverFrames.every(x=>x.visible==='visible'&&x.display!=='none'&&
   x.opacity>=.99&&x.topmost&&Math.abs(x.left)<2),
   'Hover must never blink or shift the editor launcher: '+JSON.stringify(hoverFrames));
  await edge.click();
  assert.equal(await edge.getAttribute('aria-expanded'),'true');
  // Honor is directly editable and D1-saving must preserve the encyclopedia
  // scroll position rather than rebuilding the entire workbench from the top.
  await chooseWikiChapter('honor');
  const honorPanel=page.locator('.wiki-page');
  await honorPanel.locator('.wiki-honor-rank').first().waitFor({state:'visible'});
  assert.doesNotMatch(await honorPanel.innerText(),
   /RULE UPDATE|ИЗМЕНЕНИЕ ПРАВИЛ|Официальная новость|Источники:/);
  assert.doesNotMatch(await honorPanel.locator('.wiki-honor-list').first().innerText(),
   /Muldian Uncivilized District|El Beht|Underground of Astir/);
  assert.ok(await honorPanel.locator('.wiki-honor-location-select').first()
   .locator('option').count()>4,'Location picker must include existing maps');
  // Five Honor interface captions are D1-editable, but their links, ranks
  // and filter actions must remain unchanged by a pencil click.
  const subtitleCopy=honorPanel.locator('.wiki-honor-subtitle');
  assert.equal(await subtitleCopy.locator('.wiki-honor-copy-pencil').count(),0);
  assert.equal(await honorPanel.locator('.wiki-honor-list-section h5 .wiki-honor-copy-pencil').count(),0);
  // Monthly rewards have two independent owner actions per group:
  // editable rank names and editable "Rewards" captions.
  assert.equal(await honorPanel.locator(
   '.wiki-honor-monthly-head small .wiki-honor-copy-pencil').count(),0);
  assert.equal(await honorPanel.locator(
   '.wiki-honor-monthly-head .wiki-honor-field-edit-row>.wiki-honor-direct-pencil').count(),0);
  await subtitleCopy.dblclick();
  const subtitleEditor=subtitleCopy.locator('[data-owner-text-field="true"]');
  await subtitleEditor.waitFor({state:'visible'});
  assert.equal(await subtitleEditor.getAttribute('role'),'textbox');
  await subtitleEditor.fill('PvP · нации · звания · награды — RU');
  await subtitleEditor.blur();
  await page.waitForFunction(()=>document.querySelector('.wiki-honor-subtitle')?.textContent.includes('— RU'));
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.honor-view.subtitle')).ru,
   'PvP · нации · звания · награды — RU');
  assert.equal(await honorPanel.locator('.wiki-honor-rank').count(),12);
  // Rank counts are derived from real records. The pencil beside a filter
  // edits a separate hidden host, never clicks/selects the filter itself.
  const monthlyFilter=honorPanel.locator(
   '.wiki-honor-filter-wrap:has(> [data-honor-filter="monthly"])');
  assert.equal(await monthlyFilter.locator('.wiki-honor-filter-pencil').count(),0);
  assert.equal(await honorPanel.locator('.wiki-honor-filter.chosen').getAttribute('data-honor-filter'),'all');
  await monthlyFilter.locator('.wiki-honor-filter-caption').dblclick();
  const monthlyEditor=monthlyFilter.locator('[data-owner-text-field="true"]');
  await monthlyEditor.waitFor({state:'visible'});
  await monthlyEditor.fill('Месячные звания');
  // A completed neighboring owner write can remount an editor just as a
  // Playwright locator is resolved. Blur the focused input by keyboard
  // instead of querying for an already-detached element a second time.
  // The subsequent D1 persistence and Undo assertions must still succeed.
  await page.keyboard.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '[data-honor-filter="monthly"] .wiki-honor-filter-caption')?.textContent==='Месячные звания');
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.honor-view.filter-monthly')).ru,
   'Месячные звания');
  assert.equal(await honorPanel.locator('.wiki-honor-filter.chosen').getAttribute('data-honor-filter'),'all');
  assert.equal(await honorPanel.locator('.wiki-honor-rank:not([hidden])').count(),12);
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector(
   '[data-honor-filter="monthly"] .wiki-honor-filter-caption')?.textContent==='Месячные');
  assert.equal(townOverrides.has('guideedit.book.honor-view.filter-monthly'),false);
  assert.equal(await honorPanel.locator('.wiki-honor-filter.chosen').getAttribute('data-honor-filter'),'all');
  // A chapter's text is editable without mutating its stable data-wiki-chapter.
  const chapterRow=page.locator('.wiki-category-line')
   .filter({has:page.locator('[data-wiki-chapter="honor"]')});
  await chapterRow.locator('.wiki-category-text').dblclick();
  const chapterEditor=chapterRow.locator('[data-owner-text-field="true"]');
  await chapterEditor.waitFor({state:'visible'});
  await chapterEditor.fill('Честь и ранги');
  await chapterEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '[data-wiki-chapter="honor"] .wiki-category-text')?.textContent==='Честь и ранги');
  assert.equal(JSON.parse(townOverrides.get('guideedit.wiki.labels')).chapter_honor_ru,
   'Честь и ранги');
  const gainHeading=honorPanel.locator('#honor-gain .wiki-honor-heading');
  await gainHeading.dblclick();
  const gainEditor=gainHeading.locator('[data-owner-text-field="true"]');
  await gainEditor.fill('Получение и потеря чести — тест');
  await gainEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '#honor-gain .wiki-honor-heading')?.textContent==='Получение и потеря чести — тест');
  assert.equal(JSON.parse(townOverrides.get('guideedit.wiki.labels')).honor_gain_ru,
   'Получение и потеря чести — тест');
  const rankBenefit=honorPanel.locator('#honor-rank-8 .wiki-honor-rank-benefit');
  await rankBenefit.dblclick();
  // The inline editor intentionally uses a plaintext-only contenteditable,
  // not a textarea. Exercise the real visible editor element.
  const editInput=rankBenefit.locator('[data-owner-text-field="true"][contenteditable="plaintext-only"]');
  await editInput.waitFor({state:'visible'});
  assert.equal(await editInput.getAttribute('role'),'textbox');
  assert.equal(await editInput.getAttribute('aria-multiline'),'true');
  const updatedBenefit='Новые предметы в обменнике предметов за честь!';
  await editInput.fill(updatedBenefit);
  const honorScrollBefore=await page.locator('#detailContent').evaluate(n=>n.scrollTop);
  assert.ok(honorScrollBefore>150,'Scroll restoration test must start below article top');
  await editInput.blur();
  await page.waitForFunction(expected=>{
   const text=document.querySelector('#honor-rank-8 .wiki-honor-rank-benefit')?.textContent;
   return text===expected;
  },updatedBenefit,{timeout:20000});
  const honorScrollAfter=await page.locator('#detailContent').evaluate(n=>n.scrollTop);
  assert.ok(Math.abs(honorScrollAfter-honorScrollBefore)<18,
   'Saving Honor jumps to top: '+JSON.stringify({honorScrollBefore,honorScrollAfter}));
  assert.equal(JSON.parse(townOverrides.get('guideedit.honor.rank.8')).benefitRu,
   updatedBenefit);
  // The Wiki workbench is modal; close it before using the global
  // language switch, then reopen the same Honor article.
  // The other locale has its own D1 field, not a replacement for RU.
  await closeWorkbench();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await chooseWikiChapter('honor');
  const englishCaption=page.locator('.wiki-honor-subtitle');
  await englishCaption.dblclick();
  const englishEditor=englishCaption.locator('[data-owner-text-field="true"]');
  await englishEditor.fill('PvP · nations · titles · rewards — EN');
  await englishEditor.blur();
  await page.waitForFunction(()=>document.querySelector('.wiki-honor-subtitle')?.textContent.includes('— EN'));
  assert.deepEqual(JSON.parse(townOverrides.get('guideedit.book.honor-view.subtitle')),
   {ru:'PvP · нации · звания · награды — RU',en:'PvP · nations · titles · rewards — EN'});
  // Undo the latest EN edit without refreshing the game catalog, jumping
  // away from Honor, or discarding the independent RU edit.
  const catalogCallsBeforeUndo=calls.filter(value=>value.startsWith('game-source:')).length;
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector('.wiki-honor-subtitle')
   ?.textContent==='PvP · nations · titles · rewards');
  assert.deepEqual(JSON.parse(townOverrides.get('guideedit.book.honor-view.subtitle')),
   {ru:'PvP · нации · звания · награды — RU'});
  assert.equal(calls.filter(value=>value.startsWith('game-source:')).length,
   catalogCallsBeforeUndo,'Undo of editorial text reloaded the game source');
  await closeWorkbench();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await chooseWikiChapter('honor');
  assert.match(await page.locator('.wiki-honor-subtitle').innerText(),/— RU/);
  // Reuse the existing authenticated admin smoke to check the real OS workbench.
  // All catalog requests are mocked; no production Worker or D1 is mutated.
  await page.locator('#ownerDock').getByRole('button',{name:'Игровой каталог',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:/Обновление игрового каталога/});
  await dialog.waitFor({state:'visible'});
  // Catalog action captions are double-click editable; only independently
  // authored hover hints keep a separate pencil. Ordinary clicks still work.
  // Scope :has() to each wrapper, not to the outer dialog.
  // #390: catalog checkbox captions are editable independently of their
  // checkbox and dynamic approval counts. The test fixture reveals the
  // optional review section without publishing any catalog change.
  const choices=dialog.locator('.os-sync-choice-editor');
  assert.equal(await choices.count(),2);
  const structures=await choices.evaluateAll(nodes=>nodes.map(node=>({
   pencilInsideLabel:Boolean(node.querySelector('label .os-sync-choice-pencil')),
   pencilCount:node.querySelectorAll('.os-sync-choice-pencil').length,
   count:node.querySelector('small.os-sync-choice-count')?.textContent||'',
   label:node.querySelector('label>span')?.textContent||''
  })));
  assert.ok(structures.every(x=>!x.pencilInsideLabel&&x.pencilCount===0),
   'Checkbox captions must have no edit pencil');
  const formattingChoice=choices.first();
  // #390: owner captions are independent of disabled checkboxes. Browser
  // dblclick on a span INSIDE a disabled native label is refused as disabled.
  assert.equal(await formattingChoice.locator('.os-sync-formatting-option').evaluate(
   node=>node.tagName),'DIV');
  assert.equal(await formattingChoice.locator('input[type="checkbox"]').isDisabled(),true);
  assert.equal(await formattingChoice.locator('.os-sync-formatting-option>span').first().isEnabled(),true,
   'Owner text stays editable even while its gameplay checkbox is locked');
  await formattingChoice.evaluate(el=>{
   el.closest('.os-sync-review-steps').hidden=false;
   el.closest('.os-sync-formatting-review').hidden=false;
  });
  const checkboxBefore=await formattingChoice.locator('input[type="checkbox"]').isChecked();
  const sourceCallsBefore=calls.filter(x=>x.startsWith('game-source:')).length;
  const originalCaption='Привести переносы строк в описаниях к виду игрового сайта';
  for(const value of ['Настройка переносов строк QA',originalCaption]){
   // Async status refresh can hide this optional section again. Restore
   // the isolated test fixture before each interaction, without publishing.
   await formattingChoice.evaluate(el=>{
    el.closest('.os-sync-review-steps').hidden=false;
    el.closest('.os-sync-formatting-review').hidden=false;
   });
   await formattingChoice.locator('.os-sync-formatting-option>span').dblclick();
   const editor=formattingChoice.locator('[contenteditable]').first();
   await editor.waitFor({state:'visible'});
   await editor.fill(value);
   await editor.press('Tab');
   await page.waitForFunction(text=>
    document.querySelector('.os-sync-choice-editor .os-sync-formatting-option>span')
     ?.textContent===text,value,{timeout:12000});
   // Text can already match before the D1 CAS request finishes. Wait for the
   // editor to restore rather than reopening a saving contenteditable.
   await formattingChoice.locator('[data-owner-text-field]').waitFor({state:'detached',timeout:12000});
  }
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.formatting-label')).ru,
   originalCaption,'Checkbox caption is stored in the same D1 owner-copy store');
  assert.equal(await formattingChoice.locator('input[type="checkbox"]').isChecked(),checkboxBefore);
  assert.equal(calls.filter(x=>x.startsWith('game-source:')).length,sourceCallsBefore,
   'Editing a catalog caption must not launch a comparison or D1 game publication');
  // Even disabled catalog actions must allow direct caption editing without
  // unblocking the action or accidentally publishing game records.
  await formattingChoice.evaluate(el=>{el.closest('.os-sync-review-steps').hidden=false});
  const disabledPublish=dialog.locator('.os-sync-review-actions .os-sync-action-editor:has(> .primary)');
  assert.equal(await disabledPublish.locator('button.primary').isDisabled(),true);
  await disabledPublish.dblclick();
  const disabledCopy=disabledPublish.locator('.os-sync-action-edit-host [contenteditable]');
  await disabledCopy.waitFor({state:'visible'});
  await disabledCopy.press('Escape');
  assert.equal(await disabledPublish.locator('button.primary').isDisabled(),true);
  assert.equal(calls.filter(x=>x.startsWith('game-source:')).length,sourceCallsBefore);
  assert.equal(calls.filter(x=>x==='catalog-publish').length,0);
  await formattingChoice.evaluate(el=>{
   el.closest('.os-sync-formatting-review').hidden=true;
   el.closest('.os-sync-review-steps').hidden=true;
  });
  const liveAction=dialog.locator('.os-sync-action-editor:has(> .os-sync-main-check)');
  assert.equal(await dialog.locator('.os-sync-owner-pencil,.os-sync-copy-pencil,'+
   '.os-sync-state-pencil,.os-sync-choice-pencil').count(),0,
   'All catalog text captions must be free of redundant pencils');
  assert.equal(await liveAction.count(),1,
   'The live catalog button remains in a direct-edit wrapper');
  const expectedCalls=calls.filter(value=>value.startsWith('game-source:')).length;
  for(const caption of ['Проверить игровой источник QA','Проверить изменения в текущей игре']){
   await liveAction.locator('.os-sync-main-check').dblclick();
   const input=liveAction.locator('.os-sync-action-edit-host [contenteditable]');
   await input.waitFor({state:'visible'});
   await input.fill(caption);
   await input.press('Tab');
   await page.waitForFunction(text=>
    document.querySelector('.os-sync-main-check')?.textContent===text,caption,
    {timeout:12000});
  }
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.live-button')).ru,
   'Проверить изменения в текущей игре');
  assert.equal(calls.filter(value=>value.startsWith('game-source:')).length,
   expectedCalls,'Editing the button must not start a catalog download');
  assert.equal(await dialog.locator('.os-sync-main-check').count(),1);
  const liveSource=dialog.getByRole('button',{name:'Проверить изменения в текущей игре'});
  // Previous inline-edit actions can leave the pointer already inside this
  // button with a pending hint. Actually leave it first, cancelling that
  // timer, then measure the delay from a fresh user pointerenter.
  await page.mouse.move(2,2);
  await page.getByRole('tooltip').waitFor({state:'hidden',timeout:3500});
  await liveSource.hover();
  await page.waitForTimeout(330);
  assert.equal(await page.getByRole('tooltip').isVisible(),false,
   'Admin hints must not appear immediately after a fresh pointer entry');
  await page.getByRole('tooltip').filter({hasText:/17 разделов доступных игровых данных/}).waitFor({state:'visible',timeout:3500});
  await page.mouse.move(2,2);
  await page.getByRole('tooltip').waitFor({state:'hidden'});
  await liveSource.hover();
  await page.waitForTimeout(150);
  await page.mouse.move(2,2);
  await page.waitForTimeout(1050);
  assert.equal(await page.getByRole('tooltip').isVisible(),false,
   'Leaving an admin button cancels the tooltip timer');
  // Hover hint ✎ is independent of the action and updates the original
  // tooltip target after a D1 save, without adding duplicate hover handlers.
  const hintPencil=liveAction.locator('.os-sync-hint-pencil');
  assert.equal(await hintPencil.count(),1);
  await hintPencil.click();
  assert.equal(await liveAction.locator('.os-sync-action-edit-host [contenteditable]').count(),0,
   'Opening a hover-hint editor must not open the action caption editor too');
  const hintInput=liveAction.locator('.os-sync-hint-edit-host [contenteditable]');
  await hintInput.waitFor({state:'visible'});
  await hintInput.fill('Подсказка проверки игрового источника QA.');
  await hintInput.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.os-sync-main-check')?.dataset.guideHint===
   'Подсказка проверки игрового источника QA.',null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.hint-live')).ru,
   'Подсказка проверки игрового источника QA.');
  assert.equal(calls.filter(value=>value.startsWith('game-source:')).length,
   expectedCalls,'Changing help text must not start the catalog download');
  assert.equal(await hintPencil.count(),1);
  await liveSource.hover();
  await page.getByRole('tooltip').filter({hasText:'Подсказка проверки игрового источника QA.'})
   .waitFor({state:'visible',timeout:3500});
  await page.mouse.move(2,2);
  await page.getByRole('tooltip').waitFor({state:'hidden'});
  assert.match(await dialog.locator('.os-sync-intro').innerText(),/не ищет файлы на твоём компьютере/);
  assert.match(await dialog.locator('.os-sync-archive-choice>summary').innerText(),/сайт игры/);
  // 0.615: disclosure help edits must not toggle the native <details> element
  // or invoke a catalog operation. The hover target remains the summary.
  const archiveBlock=dialog.locator('.os-sync-secondary-hint:has(> .os-sync-archive-choice)');
  const archiveDetails=archiveBlock.locator('details.os-sync-archive-choice');
  assert.equal(await archiveDetails.evaluate(el=>el.open),false);
  await archiveBlock.locator('.os-sync-secondary-pencil').click();
  const archiveHelp=archiveBlock.locator('.os-sync-secondary-host [contenteditable]');
  await archiveHelp.waitFor({state:'visible'});
  await archiveHelp.fill('Подсказка архивной сверки QA.');
  await archiveHelp.press('Tab');
  await page.waitForFunction(()=>document.querySelector('.os-sync-archive-choice>summary')
   ?.dataset.guideHint==='Подсказка архивной сверки QA.',null,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.hint-archive-disclosure')).ru,
   'Подсказка архивной сверки QA.');
  assert.equal(await archiveDetails.evaluate(el=>el.open),false,
   'Editing a summary tooltip must not expand its details element');
  assert.equal(calls.filter(x=>x.startsWith('game-source:')).length,expectedCalls);
  // A PR is generated from the published D1 snapshot via Worker, not the
  // browser's downloaded JSON. No GitHub token enters the client.
  const advancedBlock=dialog.locator('.os-sync-secondary-hint:has(> .os-sync-advanced)');
  await advancedBlock.locator('.os-sync-secondary-pencil').click();
  const advancedHelp=advancedBlock.locator('.os-sync-secondary-host [contenteditable]');
  await advancedHelp.waitFor({state:'visible'});
  await advancedHelp.fill('Подсказка дополнительных инструментов QA.');
  await advancedHelp.press('Tab');
  await page.waitForFunction(()=>document.querySelector('.os-sync-advanced>summary')
   ?.dataset.guideHint==='Подсказка дополнительных инструментов QA.',null,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.hint-advanced-disclosure')).ru,
   'Подсказка дополнительных инструментов QA.');
  assert.equal(await advancedBlock.locator('details').evaluate(el=>el.open),false);
  await dialog.locator('.os-sync-advanced>summary').click();
  const prButton=dialog.getByRole('button',{name:'Создать PR в GitHub'});
  await prButton.waitFor({state:'visible'});
  await page.waitForFunction(()=>!Array.from(document.querySelectorAll('.os-sync-actions button'))
    .find(button=>button.textContent?.includes('Создать PR в GitHub'))?.disabled);
  page.once('dialog',dialog=>dialog.accept());
  await prButton.click();
  await dialog.getByRole('link',{name:'Открыть PR #246'}).waitFor({state:'visible'});
  assert.deepEqual(calls.filter(x=>x==='github-pr'),['github-pr']);
  page.once('dialog',confirmation=>confirmation.accept());
  await dialog.getByRole('button',{name:'Проверить сохранение правок'}).click();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.os-sync [role=status]'))
    .some(node=>node.textContent?.includes('Сохранение работает')));
  assert.deepEqual(calls.filter(x=>x==='d1-write-check'),['d1-write-check']);

  // Only a confirmed success message is authorial D1 copy. A real inline
  // blur-save must not touch the live game catalog or confirmation proof.
  const writeSuccess=dialog.locator('.os-sync-status .os-sync-state-caption');
  await writeSuccess.waitFor({state:'visible',timeout:12000});
  await writeSuccess.dblclick();
  const writeSuccessEditor=writeSuccess.locator('[contenteditable]');
  await writeSuccessEditor.waitFor({state:'visible',timeout:6000});
  await writeSuccessEditor.fill('Пробные записи безопасно проверены.');
  await writeSuccessEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.os-sync-status .os-sync-state-caption')?.textContent===
   'Пробные записи безопасно проверены.',null,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get(
   'guideedit.book.catalog-sync.test-write-success')).ru,
   'Пробные записи безопасно проверены.');
  assert.deepEqual(calls.filter(x=>x==='d1-write-check'),['d1-write-check']);

  // A failed owner comparison must expose the real visible error rather
  // than hiding it behind a generic Playwright timeout. No test condition is
  // relaxed: the exact same captions are still required for success.
  const waitForCatalogResult=async(stage,condition)=>{
   try{await page.waitForFunction(condition,null,{timeout:30000})}
   catch(error){
    const diagnostics=await page.evaluate(()=>({
     status:document.querySelector('.os-sync-status')?.textContent,
     messages:[...document.querySelectorAll('.os-sync [role="status"]')]
      .slice(0,4).map(node=>node.textContent),
     ownerState:document.querySelector('[data-owner-save-state]')?.dataset.state,
     reviewVisible:!document.querySelector('.os-sync-review-steps')?.hidden,
     currentLanguage:document.documentElement.lang,
     diagnosticHidden:document.querySelector('.os-sync-diagnostics')?.hidden,
     diagnostic:document.querySelector('.os-sync-diagnostics>p')?.textContent
    }));
    throw Error('Owner catalog stage '+stage+': '+
     JSON.stringify({...diagnostics,
      sourceRequests:calls.filter(value=>value.startsWith('game-source:'))})+
     '; '+error.message);
   }
  };
  assert.equal(await dialog.locator('.os-sync-review-steps button').filter({hasText:'Применить выбранные изменения'}).isDisabled(),true);
  await dialog.locator('.os-sync-archive-choice>summary').click();
  await dialog.getByRole('button',{name:'Сверить с сохранённой копией'}).click();
  await waitForCatalogResult('archive comparison',
   () => document.querySelector('.os-sync [role=status]')?.textContent?.includes('Найдено изменений:'));
  // 0.612: reloading results may update checksum evidence but must not
  // erase the directly editable D1 explanation.
  const checksumRow=dialog.locator(
   '.os-sync-advanced .os-sync-copy-field:has(> .os-sync-meta-status)');
  const checksumCaption=checksumRow.locator('.os-sync-meta-status');
  assert.equal(await checksumCaption.count(),1,
   'Direct-edit checksum copy survives catalog refresh');
  assert.equal(await checksumRow.locator('.os-sync-copy-pencil').count(),0);
  assert.match(await dialog.locator('.os-sync-meta-detail').textContent(),
   /Сведения об источнике:/);
  const originalChecksum=await dialog.locator('.os-sync-meta-status').textContent();
  await checksumCaption.dblclick();
  const checksumInput=checksumRow.locator('[contenteditable]');
  await checksumInput.fill('Контрольные суммы описывают целостность файлов.');
  await checksumInput.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.os-sync-meta-status')?.textContent===
   'Контрольные суммы описывают целостность файлов.',null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.checksum-explanation')).ru,
   'Контрольные суммы описывают целостность файлов.');
  assert.equal(await checksumRow.locator('.os-sync-copy-pencil').count(),0,
   'Saving must not restore a redundant caption pencil');
  assert.ok(originalChecksum.length>30);
  // 0.613: safe static status and archive banner text can be D1-edited
  // without running the data comparison, catalog publication or D1 probe.
  const originalCompareCalls=calls.filter(x=>x.startsWith('game-source:')).length;
  const banner=dialog.locator('.os-sync-source-banner');
  assert.match(await banner.innerText(),/сохранённой копии/,
   'Archive warning should be present before an editor replaces its text');
  const state=dialog.locator('.os-sync-status');
  assert.equal(await banner.locator('.os-sync-state-pencil').count(),0);
  assert.equal(await state.locator('.os-sync-state-pencil').count(),0);
  await banner.locator('.os-sync-state-caption').dblclick();
  const bannerEditor=banner.locator('[contenteditable]');
  await bannerEditor.fill('Архивный источник проверен отдельно.');
  await bannerEditor.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.os-sync-source-banner .os-sync-state-caption')
    ?.textContent==='Архивный источник проверен отдельно.',null,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.source-archive-notice')).ru,
   'Архивный источник проверен отдельно.');
  await state.locator('.os-sync-state-caption').dblclick();
  const statusEditor=state.locator('[contenteditable]');
  await statusEditor.fill('Сверка завершена. Изменения не выбраны.');
  await statusEditor.press('Tab');
  const savedComparisonKey='guideedit.book.catalog-sync.comparison-found';
  const savedComparisonRu='Сверка завершена. Изменения не выбраны.';
  // The DOM may optimistically update before the asynchronous mocked Worker
  // commits the override. Assert the actual saved value, not just the label.
  await page.waitForFunction(expected=>
   document.querySelector('.os-sync-status .os-sync-state-caption')?.textContent===
   expected,savedComparisonRu,{timeout:12000});
  const readSavedComparison=()=>{
   const value=townOverrides.get(savedComparisonKey);
   if(!value)return null;
   try{return JSON.parse(value)}catch{return null}
  };
  const savedAt=Date.now();
  while(readSavedComparison()?.ru!==savedComparisonRu){
   if(Date.now()-savedAt>12000)
    throw Error('Mock D1 did not commit '+savedComparisonKey+
     ' after editor blur; current state: '+String(townOverrides.get(savedComparisonKey)));
   await new Promise(resolve=>setTimeout(resolve,30));
  }
  assert.equal(readSavedComparison().ru,savedComparisonRu);
  assert.equal(calls.filter(x=>x.startsWith('game-source:')).length,originalCompareCalls);
  assert.equal(await banner.locator('.os-sync-state-pencil').count(),0);
  assert.equal(await state.locator('.os-sync-state-pencil').count(),0);
  await dialog.getByRole('button',{name:/Новые · 0/}).click();
  assert.equal(await dialog.locator('.os-sync-record').count(),0,'No added records');
  await dialog.getByRole('button',{name:/Изменённые · 1/}).click();
  assert.equal(await dialog.locator('.os-sync-record').count(),1,'Only changed records');
  await dialog.getByRole('button',{name:/Все · 1/}).click();
  assert.equal(await dialog.locator('.os-sync-source-banner .os-sync-state-caption').textContent(),
   'Архивный источник проверен отдельно.',
   'After D1 edit, the authored archive message must remain visible');
  assert.match(await dialog.locator('.os-sync-overview').innerText(),/Предметы · 1/);
  const searchBlock=dialog.locator('.os-sync-search-field');
  assert.equal(await dialog.locator('.os-sync-source-banner').getAttribute('data-source'),'archive',
   'Archive comparisons must remain visually distinguishable from live data');
  const catalogClear=searchBlock.locator('.os-sync-search-clear');
  assert.equal(await catalogClear.isDisabled(),true);
  await dialog.locator('.os-sync-search').fill('no-matching-catalog-entry-792');
  assert.equal(await catalogClear.isEnabled(),true);
  assert.equal(await dialog.locator('.os-sync-record').count(),0);
  await catalogClear.click();
  assert.equal(await dialog.locator('.os-sync-search').inputValue(),'');
  assert.equal(await dialog.locator('.os-sync-record').count(),1,
   'Clearing catalog search must restore the review without changing selection');
  assert.equal(await searchBlock.locator('.os-sync-secondary-pencil').count(),1);
  await searchBlock.locator('.os-sync-secondary-pencil').click();
  const searchHelp=searchBlock.locator('.os-sync-secondary-host [contenteditable]');
  await searchHelp.waitFor({state:'visible'});
  await searchHelp.fill('Подсказка поиска изменений QA.');
  await searchHelp.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.os-sync-search')?.dataset.guideHint==='Подсказка поиска изменений QA.',
   null,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.hint-search')).ru,
   'Подсказка поиска изменений QA.');
  assert.equal(await dialog.locator('.os-sync-search').inputValue(),'',
   'Editing help must not overwrite the search query');
  assert.equal(await dialog.locator('.os-sync-stat').count(),0,
    'redundant four-card metrics dashboard is no longer present');
  assert.equal(await dialog.locator('.os-sync-results').evaluate(el=>getComputedStyle(el).overflowY),'visible',
    'no nested review scrollbar');
  assert.equal(await dialog.locator('.os-sync-record').count(),1);
  assert.equal(await dialog.locator('.os-sync-raw-details').isVisible(),false,
    'raw IDs and JSON are hidden until owner explicitly opens details');
  await dialog.getByRole('button',{name:/Расшифрованы · 1/}).click();
  assert.equal(await dialog.locator('.os-sync-record').count(),1,
    'readable changes can be shown independently');
  await dialog.getByRole('button',{name:/Требует проверки · 0/}).click();
  assert.equal(await dialog.locator('.os-sync-record').count(),0,
    'unknown fields have an independent review filter');
  await dialog.getByRole('button',{name:/Все · 1/}).click();
  const groups=dialog.locator('.os-sync-group');
  assert.equal(await groups.count(),1,'Exactly one intentionally changed D1 item');
  await groups.locator('summary.os-sync-group-heading').click();
  const explanation=dialog.locator('.os-sync-change-summary').first();
  assert.notEqual((await explanation.innerText()).length,0,'gameplay change explanation is visible');
  assert.doesNotMatch(await explanation.innerText(),/\[\{|resists\.|sha\.|@dataset/);
  const decision=dialog.locator('.os-sync-record input[type=checkbox]');
  await decision.waitFor({state:'visible'});
  assert.equal(await decision.isChecked(),false,'Changes must be declined by default');
  assert.equal(await dialog.locator('.os-sync-review-steps button').filter({hasText:'Применить выбранные изменения'}).isDisabled(),true);
  await decision.check();
  assert.equal(await dialog.locator('.os-sync-review-steps button')
   .filter({hasText:'Применить выбранные изменения'}).isDisabled(),true,
   'Archived sources must require an explicit caution acknowledgement');
  await dialog.locator('.os-sync-risk-approval input').check();
  assert.equal(await dialog.locator('.os-sync-review-steps button').filter({hasText:'Применить выбранные изменения'}).isEnabled(),true);
  // Owner copy actions defer one pointer click to distinguish it from
  // a double-click edit gesture. The browser confirmation is asynchronous:
  // do not inspect an empty variable before the 500 ms action fires.
  const archivePrompt=page.waitForEvent('dialog',{timeout:12000}).then(async confirmation=>{
    const warning=confirmation.message();
    await confirmation.dismiss();
    assert.match(warning,/архивная копия/);
  });
  await dialog.locator('.os-sync-review-steps button')
    .filter({hasText:'Применить выбранные изменения'}).click();
  await archivePrompt;
  assert.equal(calls.filter(x=>x==='d1-import').length,0,'dismissal prevents catalog publication');
  // The same owner double-click guard defers Clear selection / Select safe
  // by one click interval. Wait for the actual selection state, not just
  // Playwright's pointer dispatch, before asserting or exporting.
  const waitForClearedCatalogSelection=()=>page.waitForFunction(()=>{
    const choices=[...document.querySelectorAll(
     '.os-sync-record input[type="checkbox"]')];
    const publish=document.querySelector(
     '.os-sync-review-actions button.primary');
    return choices.length>0&&choices.every(input=>!input.checked)&&
      publish?.disabled===true;
  },null,{timeout:12000});
  await dialog.getByRole('button',{name:'Снять весь выбор'}).click();
  await waitForClearedCatalogSelection();
  assert.equal(await dialog.locator('.os-sync-review-steps button').filter({hasText:'Применить выбранные изменения'}).isDisabled(),true);
  await dialog.getByRole('button',{name:'Выбрать понятные изменения',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll(
   '.os-sync-record input[type="checkbox"]')].some(input=>input.checked),
   null,{timeout:12000});
  const downloadPromise=page.waitForEvent('download');
  await dialog.getByRole('button',{name:'Скачать выбранное для GitHub'}).click();
  const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'pandora-studio-reviewed-catalog.json');
  assert.match(await dialog.locator('.os-sync [role=status]').last().innerText(),/GitHub не изменён/);
  // Exercise the authenticated game-data proxy as well as archive preview.
  // The archived comparison already has a matching success caption. Wait for
  // the new *network calls*, not for that stale caption, before inspecting
  // the authenticated live-result counters.
  const liveMetaBefore=calls.filter(x=>x==='game-source:meta').length;
  await dialog.getByRole('button',{name:'Проверить изменения в текущей игре'}).click();
  for(let n=0;n<240&&calls.filter(x=>x==='game-source:meta').length<liveMetaBefore+2;n++)
   await page.waitForTimeout(50);
  await waitForCatalogResult('live source comparison',
   () => document.querySelector('.os-sync [role=status]')?.textContent?.includes('Найдено изменений:'));
  assert.equal(calls.filter(x=>x==='game-source:meta').length,2,
    'meta must be fetched twice to detect mixed server revisions');
  assert.equal(calls.filter(x=>x.startsWith('game-source:')).length,18,
    'all 17 datasets and one final meta revision check are required');
  assert.equal(await dialog.locator('.os-sync-review-steps button').filter({hasText:'Применить выбранные изменения'}).isDisabled(),true,
    'a fresh live comparison must reject all changes by default');
  await dialog.getByRole('button',{name:/Игровые ссылки · 1/}).click();
  assert.equal(await dialog.locator('.os-sync-record').count(),1,
   'A changed item reference has its own review filter');
  await dialog.locator('.os-sync-group-heading').click();
  const linked=dialog.locator('.os-sync-record');
  assert.match(await linked.innerText(),/Связь с предметом изменилась/);
  assert.equal(await linked.locator('input[type="checkbox"]').isChecked(),false);
  await dialog.getByRole('button',{name:'Выбрать понятные изменения',exact:true}).click();
  assert.equal(await linked.locator('input[type="checkbox"]').isChecked(),false,
   'Bulk approval must not accept a changed item reference');
  await linked.locator('.os-sync-field-details>summary').click();
  const reference=linked.locator('.os-sync-item-ref').first();
  await reference.click();
  assert.equal(await reference.getAttribute('aria-expanded'),'true');
  const goto=linked.locator('.os-sync-reference-open').first();
  assert.equal(await goto.getAttribute('href'),'#wiki/item/300001');
  assert.equal(await goto.getAttribute('target'),'_blank');
  await dialog.getByRole('button',{name:/Требует проверки · 1/}).click();
  assert.equal(await dialog.locator('.os-sync-record').count(),1);
  await dialog.getByRole('button',{name:/Игровые ссылки · 1/}).click();
  await dialog.locator('.os-sync-search').fill('Билет испытаний');
  assert.equal(await dialog.locator('.os-sync-record').count(),1,
   'A source reference is searchable by its resolved item name');
  await dialog.locator('.os-sync-search').fill('');
  await dialog.getByRole('button',{name:/Все · 2/}).click();
  // 0.793: reproduce the actual owner sequence with an isolated source:
  // Check the current game, Select all, review risks, and cancel publish.
  assert.equal(await dialog.locator('.os-sync-source-banner').getAttribute('data-source'),'server');
  const publishButton=dialog.getByRole('button',{name:'Применить выбранные изменения'});
  const decisionReview793=dialog.locator('.os-sync-decision-preview');
  const bulkConfirm=page.waitForEvent('dialog').then(async selectionDialog=>{
   assert.match(selectionDialog.message(),/Выбрать все/);
   await selectionDialog.accept();
  });
  await dialog.getByRole('button',{name:'Выбрать все найденные изменения'}).click();
  await bulkConfirm;
  await page.waitForFunction(()=>
    document.querySelector('.os-sync-decision-preview')?.textContent?.includes('Будет обновлено: 2'));
  assert.match(await decisionReview793.innerText(),/Будет обновлено: 2 изменений из 2/);
  assert.match(await decisionReview793.innerText(),/проверки|Связи и скрытые отличия/);
  assert.equal(await publishButton.isDisabled(),true,
   'High-risk Select all must require explicit review acknowledgment');
  const approval=decisionReview793.locator('.os-sync-risk-approval input');
  await approval.check();
  assert.equal(await publishButton.isEnabled(),true);
  const publishRequests=[];
  page.on('request',request=>{
   if(/\/api\/admin\/catalog\/(?:batch|publish|initialize)/.test(request.url()))
    publishRequests.push(request.url());
  });
  const finalConfirm=page.waitForEvent('dialog').then(async finalDialog=>{
   assert.match(finalDialog.message(),/Применить выбранные изменения/);
   await finalDialog.dismiss();
  });
  await publishButton.click();
  await finalConfirm;
  assert.deepEqual(publishRequests,[],
   'Rejecting final confirmation cannot write a catalog snapshot');
  // Changing the selection must invalidate the previous risky approval.
  await dialog.getByRole('button',{name:'Снять весь выбор'}).click();
  await waitForClearedCatalogSelection();
  assert.equal(await approval.isChecked(),false);
  assert.equal(await publishButton.isDisabled(),true);
  // The exact failure reported by an administrator must NOT suggest a live
  // comparison succeeded. The archived comparison stays explicitly separate.
  // A catalog with a forged source header may not become the admin baseline.
  d1SourceSpoofed=true;
  await dialog.getByRole('button',{name:'Проверить изменения в текущей игре'}).click();
  await page.waitForFunction(()=>document.querySelector('.os-sync-status')
    ?.textContent?.includes('Сверка не завершена.'),null,{timeout:15000});
  assert.equal(await dialog.locator('.os-sync-review-steps').isHidden(),true,
   'A forged provenance must disable catalog publication');
  d1SourceSpoofed=false;
  sourceUnavailable=true;
  await dialog.getByRole('button',{name:'Проверить изменения в текущей игре'}).click();
  await page.waitForFunction(()=>document.querySelector('.os-sync-status')?.textContent
    ?.includes('Cloudflare Worker не смог установить соединение с сайтом игры'),null,{timeout:15000});
  await dialog.locator('.os-sync-diagnostics>summary').click();
  assert.match(await dialog.locator('.os-sync-diagnostics').innerText(),/Причина: network/);
  // Game-source requests are parallel: the first failed data file is
  // not always meta.json. Preserve the source, HTTP and network checks.
  assert.match(await dialog.locator('.os-sync-diagnostics').innerText(),
   /Этап: [a-zA-Z0-9_-]+[.]json · Ответ Worker: 502/);
  assert.equal(await dialog.locator('.os-sync-archive-choice').getAttribute('open'),'');
  assert.equal(await dialog.locator('.os-sync-review-steps').isHidden(),true,
    'a failed game-source check cannot leave publishing enabled');
  await dialog.getByRole('button',{name:'Сверить с сохранённой копией'}).click();
  await waitForCatalogResult('recovery after unavailable source',
   () => document.querySelector('.os-sync-status')?.textContent
    ?.includes('Сверка завершена.'));
  assert.equal(await dialog.locator('.os-sync-review-steps button')
    .filter({hasText:'Применить выбранные изменения'}).isDisabled(),true);
  // The new Honor smoke opened the Wiki workbench earlier in this same
  // scenario. Restore the original navigation context before re-entering Wiki:
  // page-level #nav is intentionally hidden while a workbench is open.
  await dialog.getByRole('button',{name:/Закрыть/}).click();
  await closeWorkbench();
  // #390: English owner sees the real source failure and a complete,
  // cancelable publication warning. Only the mocked Worker is involved.
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#ownerDock').getByRole('button',{name:'Game catalog',exact:true}).click();
  const enCatalog=page.getByRole('dialog',{name:/Game catalog updates/});
  await enCatalog.waitFor({state:'visible'});
  await enCatalog.getByRole('button',{name:'Check live game updates'}).click();
  await page.waitForFunction(()=>document.querySelector('.os-sync-status')?.textContent
    ?.includes('Cloudflare Worker could not connect to the game site.'),
    null,{timeout:15000});
  await enCatalog.locator('.os-sync-diagnostics>summary').click();
  assert.match(await enCatalog.locator('.os-sync-diagnostics').innerText(),
    /Stage: [a-zA-Z0-9_-]+[.]json · Worker response: 502 · Reason: network/);
  assert.equal(await enCatalog.locator('.os-sync-review-steps').isHidden(),true);
  const englishWritesBefore=calls.filter(x=>x==='catalog-publish'||x==='d1-import').length;
  await enCatalog.getByRole('button',{name:'Compare saved snapshot'}).click();
  await enCatalog.locator('.os-sync-review-steps').waitFor({state:'visible'});
  await enCatalog.locator('.os-sync-group-heading').first().click();
  await enCatalog.locator('.os-sync-record input[type="checkbox"]').first().check();
  await enCatalog.locator('.os-sync-risk-approval input').check();
  const englishConfirm=page.waitForEvent('dialog',{timeout:12000}).then(async confirmation=>{
    const warning=confirmation.message();
    assert.match(warning,/SOURCE: the archive may be outdated/);
    assert.match(warning,/Only the Build Studio catalog changes, NOT the game/);
    assert.match(warning,/Nothing is published before you confirm/);
    await confirmation.dismiss();
  });
  await enCatalog.getByRole('button',{name:'Publish selected changes'}).click();
  await englishConfirm;
  assert.equal(calls.filter(x=>x==='catalog-publish'||x==='d1-import').length,
    englishWritesBefore,'English cancellation must not write D1');
  await enCatalog.getByRole('button',{name:/Close/}).click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  // Do not inherit Honor from the preceding regression: item editing starts
  // in the equipment chapter, regardless of the user's last visited chapter.
  await chooseWikiChapter('item');
  const wikiSearch=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  await wikiSearch.waitFor({state:'visible'});
  const speedCheck=page.locator('.wiki-speed-check');
  await speedCheck.waitFor({state:'visible'});
  await speedCheck.click();
  await page.waitForFunction(()=>document.querySelector('.wiki-speed-result')?.textContent?.includes('мс'),null,{timeout:15000});
  assert.match(await page.locator('.wiki-speed-result').innerText(),/записей/);
  assert.equal(await wikiSearch.getAttribute('autocomplete'),'none');
  assert.equal(await wikiSearch.getAttribute('data-ps-noncredential-search'),'true');
  assert.equal(await wikiSearch.getAttribute('data-lpignore'),'true');
  await wikiSearch.click();
  // Search-name overrides can change while a mock catalog refreshes. This
  // journey checks keyboard item editing, not a particular temporary name.
  await wikiSearch.fill('');
  // The owner panel intentionally stays open across navigation. A user may
  // hide it to reach wiki entries covered by the floating panel; the admin
  // editing permission stays enabled when only the drawer is collapsed.
  assert.equal(await edge.getAttribute('aria-expanded'),'true');
  await edge.click();
  assert.equal(await edge.getAttribute('aria-expanded'),'false');
  const firstItem=page.locator('.wiki-list [data-wiki-record]').first();
  await firstItem.waitFor({state:'visible',timeout:20000});
  // The wiki list can redraw while indexed search settles. Keyboard
  // activation is stable across re-renders and verifies accessible links.
  await firstItem.press('Enter');
  await page.locator('.wiki-page .item-fields').waitFor({state:'visible',timeout:20000});
  const attackLabel=page.locator('.item-fields dt').filter({hasText:'Атака'}).first();
  const attack=attackLabel.locator('xpath=following-sibling::dd[1]');
  await attack.dblclick();
  await attack.getByRole('spinbutton',{name:'Изменить значение'}).fill('99');
  await attackLabel.click(); // clicking outside autosaves without a separate confirmation
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.item-fields dd'))
   .some(node=>node.textContent==='99'),null,{timeout:20000});
  assert.deepEqual(calls.filter(x=>x==='owner-item-edit'),['owner-item-edit']);
  assert.ok(await page.locator('.item-fields dd.wiki-edit-value').count()>0);
  assert.equal(await page.getByRole('button',{name:'Дополнительные эффекты'}).count(),0);
  const effectEditor=page.locator('.wiki-owner-effects');
  await effectEditor.waitFor({state:'visible'});
  const oldEffects=await effectEditor.locator('.wiki-owner-effect').count();
  await effectEditor.getByRole('button',{name:'Добавить эффект'}).click();
  const effectList=page.getByRole('combobox',{name:'Выбери эффект'});
  assert.ok(await effectList.locator('option').count()>10);
  assert.equal(await effectList.locator('option[value="EP_RANDOM_BOX"]').count(),0);
  assert.equal(await effectList.locator('option[value="EP_BOW_RANGE"]').count(),0);
  assert.ok(await effectList.locator('option[value="EP_STRENGTH_CONST"]').count()>0);
  await effectList.selectOption({index:1});
  await page.waitForFunction(count=>
   document.querySelectorAll('.wiki-owner-effects .wiki-owner-effect').length===count+1,
   oldEffects,{timeout:20000});
  assert.ok(calls.includes('owner-effect-edit'));

  await page.getByRole('button',{name:/Добавить источник/}).click();
  await page.getByRole('combobox',{name:'Тип получения'}).selectOption('npc');
  const sourceTarget=page.getByRole('combobox',{name:'У кого получить'});
  assert.ok(await sourceTarget.locator('option').count()>1);
  await sourceTarget.selectOption({index:1});
  const newSource=page.locator('.wiki-source-token:has(.wiki-owner-remove) a[href^="#wiki/npc/"]').first();
  await newSource.waitFor({state:'visible',timeout:20000});
  await newSource.click();
  const createTrade=page.getByRole('button',{name:/Добавить обмен/});
  await createTrade.waitFor({state:'visible'});
  const tradeCount=await page.locator('.wiki-trade-card').count();
  await createTrade.click();
  await page.getByRole('combobox',{name:'Выбери предмет'}).selectOption({index:1});
  await page.waitForFunction(n=>document.querySelectorAll('.wiki-trade-card').length===n+1,
   tradeCount,{timeout:20000});

  // Mocked D1 bridge: owner edits the real city NPC profile, including
  // RU/EN names and its map relation; no production D1 writes.
  // The owner workbench is already open. Its backdrop intentionally blocks
  // top-level locale/navigation clicks until the panel is closed.
  await chooseWikiChapter('npc');
  const npcFilter=page.locator('.wiki-controls input[type="search"]');
  await npcFilter.click();
  await npcFilter.fill('Кларис');
  const npcListing=page.locator('.wiki-list [data-wiki-record="astir-npc-kingdom-claris"]');
  try{await npcListing.waitFor({state:'visible',timeout:5000})}
  catch{
   const state=await page.evaluate(()=>({
    hash:location.hash,
    search:document.querySelector('.wiki-controls input[type="search"]')?.value,
    chapter:document.querySelector('.wiki-categories .chosen')?.textContent,
    rows:document.querySelectorAll('.wiki-list [data-wiki-record]').length,
    owner:Boolean(document.querySelector('#ownerDock')),
    detail:document.querySelector('.wiki-page')?.textContent?.slice(0,160)
   }));
   throw Error('NPC listing diagnostic: '+JSON.stringify(state));
  }
  await npcListing.click();
  const npcHeading=page.locator('.wiki-page h3[data-owner-record="npc:astir-npc-kingdom-claris"]');
  try{await npcHeading.waitFor({state:'visible',timeout:8000})}
  catch{
   const state=await page.evaluate(()=>({hash:location.hash,
    title:document.querySelector('.wiki-page h3')?.textContent,
    owner:Boolean(document.querySelector('#ownerDock')),
    adminRecords:document.querySelectorAll('[data-owner-record]').length}));
   throw Error('NPC inline-edit visibility: '+JSON.stringify(state));
  }
  await npcHeading.dblclick();
  const editor=npcHeading.locator('[data-owner-text-field]');
  await editor.fill('Кларис — проверка D1');
  await editor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-page h3[data-owner-record="npc:astir-npc-kingdom-claris"]'
  )?.textContent==='Кларис — проверка D1',null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('wikiedit.npc.astir-npc-kingdom-claris')).name,
   'Кларис — проверка D1');
  // A workbench intentionally collapses the owner drawer; a completed save
  // must still be tracked even while its status row is offscreen.
  const status=ownerPanel.locator('[data-owner-save-state]');
  await page.waitForFunction(()=>document.querySelector(
   '#ownerDock [data-owner-save-state]')?.dataset.state==='saved',null,{timeout:15000});
  assert.match(await status.textContent(),/Сохранено в Cloudflare D1/);
  if(await edge.getAttribute('aria-expanded')==='false'){
   await edge.click();
   await status.waitFor({state:'visible'});
   await edge.click();
  }
  // The long NPC title must stay entirely visible INSIDE its editable field,
  // not be clipped at the old 320px/nowrap limit.
  const longName='Мастер арены Алиса — координатор состязаний и тренировочного турнира';
  await npcHeading.dblclick();
  const fullEditor=npcHeading.locator('[data-owner-text-field]');
  assert.equal((await fullEditor.innerText()).trim(),'Кларис — проверка D1');
  await fullEditor.fill(longName);
  const bounds=await fullEditor.evaluate(node=>({
   scroll:node.scrollWidth,client:node.clientWidth,
   whiteSpace:getComputedStyle(node).whiteSpace,overflow:getComputedStyle(node).overflow
  }));
  assert.match(bounds.whiteSpace,/pre-wrap|normal/);
  assert.ok(bounds.scroll<=bounds.client+3,'Long NPC name clipped: '+JSON.stringify(bounds));
  await fullEditor.press('Tab');
  await page.waitForFunction(value=>document.querySelector(
   '.wiki-page h3[data-owner-record="npc:astir-npc-kingdom-claris"]'
  )?.textContent===value,longName,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('wikiedit.npc.astir-npc-kingdom-claris')).name,
   longName);
  // This value changes before the async owner POST finishes. Observe the
  // actual isolated mock write instead of racing the optimistic select UI.
  const savedLocation=page.waitForResponse(response=>{
   if(!response.url().endsWith('/api/admin/override')||
      response.request().method()!=='POST')return false;
   try{
    const data=response.request().postDataJSON();
    return data.key==='wikiedit.npc.astir-npc-kingdom-claris'&&
     JSON.parse(data.value).maps?.includes('astir-union');
   }catch{return false}
  },{timeout:15000});
  await page.locator('.wiki-page .wiki-town-npc-location').selectOption('astir-union');
  await savedLocation;
  assert.deepEqual(JSON.parse(townOverrides.get('wikiedit.npc.astir-npc-kingdom-claris')).maps,
   ['astir-union']);
  await closeWorkbench();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  const enHeading=page.locator('.wiki-page h3[data-owner-field="nameEn"]');
  await enHeading.waitFor({state:'visible',timeout:15000});
  await enHeading.dblclick();
  const enEditor=enHeading.locator('[data-owner-text-field]');
  await enEditor.fill('Claris Test');
  await enEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-page h3[data-owner-field="nameEn"]')?.textContent==='Claris Test',
   null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('wikiedit.npc.astir-npc-kingdom-claris')).nameEn,
   'Claris Test');
  // Astir districts previously used a separate, non-cancellable NPC form.
  // Verify the shared bilingual D1 editor, cancellation, creation, visibility,
  // and removal of a newly created NPC; no game client or production writes.
  await chooseWikiChapter('map');
  const districtFilter=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  await districtFilter.fill('Kingdom District');
  await page.locator('.wiki-list [data-wiki-record="astir-kingdom"]')
   .waitFor({state:'visible',timeout:15000});
  await page.locator('.wiki-list [data-wiki-record="astir-kingdom"]').click();
  const district=page.locator('.wiki-page');
  await district.locator('.wiki-map-create-npc').waitFor({state:'visible',timeout:15000});
  await district.locator('.wiki-map-create-npc').click();
  let districtForm=district.locator('.wiki-map-create-npc-form');
  await districtForm.locator('[data-owner-interface-key="npcNameRu"]')
   .fill('Тестовый житель Астира');
  await districtForm.locator('[data-owner-interface-key="npcSave"]').click();
  assert.match(await districtForm.locator('.inline-owner-error').innerText(),
   /both RU and EN names/i,'District requires bilingual names');
  await districtForm.locator('[data-owner-interface-key="npcCancel"]').click();
  assert.equal(await district.locator('.wiki-map-create-npc-form').count(),0,
   'Cancel removes the form without an owner D1 write');
  assert.equal([...townOverrides.keys()].some(key=>/^wikiedit\.npc\.owner-npc-/.test(key)),
   false);
  await district.locator('.wiki-map-create-npc').click();
  districtForm=district.locator('.wiki-map-create-npc-form');
  await districtForm.locator('[data-owner-interface-key="npcNameRu"]')
   .fill('Тестовый житель Астира');
  await districtForm.locator('[data-owner-interface-key="npcNameEn"]')
   .fill('Astir QA Resident');
  await districtForm.locator('[data-owner-interface-key="npcService"]')
   .fill('Test fixture');
  const districtPost=page.waitForResponse(response=>{
   if(!response.url().endsWith('/api/admin/override'))return false;
   try{return /^wikiedit\.npc\.owner-npc-/.test(response.request().postDataJSON().key)}
   catch{return false}
  },{timeout:20000});
  await districtForm.locator('[data-owner-interface-key="npcSave"]').click();
  await districtPost;
  const districtKeys=[...townOverrides.keys()].filter(key=>
   /^wikiedit\.npc\.owner-npc-/.test(key));
  assert.equal(districtKeys.length,1);
  const districtId=districtKeys[0].slice('wikiedit.npc.'.length);
  assert.deepEqual(JSON.parse(townOverrides.get(districtKeys[0])).maps,['astir-kingdom']);
  assert.equal(JSON.parse(townOverrides.get(districtKeys[0])).nameEn,'Astir QA Resident');
  const districtNpcLink=district.locator('.wiki-map-npc a[href="#wiki/npc/'+districtId+'"]');
  await districtNpcLink.waitFor({state:'visible',timeout:15000});
  await districtNpcLink.click();
  const deleteNpc=page.locator('.wiki-page .wiki-owner-delete-record');
  await deleteNpc.waitFor({state:'visible',timeout:15000});
  page.once('dialog',dialog=>void dialog.dismiss());
  await deleteNpc.click();
  assert.equal(townOverrides.has(districtKeys[0]),true,
   'Rejecting confirmation must preserve the D1 NPC');
  page.once('dialog',dialog=>void dialog.accept());
  const deletedDistrictNpc=page.waitForResponse(response=>{
   if(!response.url().endsWith('/api/admin/reset'))return false;
   try{return response.request().postDataJSON().key===districtKeys[0]}
   catch{return false}
  },{timeout:15000});
  await deleteNpc.click();
  await deletedDistrictNpc;
  assert.equal(townOverrides.has(districtKeys[0]),false,
   'Confirmed delete removes only the owner-created NPC');
  console.log('Chromium Astir district owner NPC D1: bilingual, validation, cancel, save, read-back and delete passed');

  // Create an entirely new D1 location, then edit its sections and tags in place.
  await chooseWikiChapter('map');
  await page.locator('.wiki-map-create').waitFor({state:'visible'});
  await page.locator('.wiki-map-create').click();
  await page.locator('.wiki-map-create-form [aria-label="Location name in Russian"]')
   .fill('Тестовая локация');
  await page.locator('.wiki-map-create-form [aria-label="Location name in English"]')
   .fill('Smoke location');
  await page.locator('.wiki-map-create-form .wiki-owner-plus').click();
  await page.locator('.wiki-page h3').filter({hasText:'Smoke location'})
   .waitFor({state:'visible',timeout:20000});
  const customMapKeys=[...townOverrides.keys()].filter(x=>/^wikiedit\.map\.custom-/.test(x));
  assert.equal(customMapKeys.length,1,'New location is saved to a dedicated D1 override');
  const customMap=JSON.parse(townOverrides.get(customMapKeys[0]));
  assert.equal(customMap.name,'Тестовая локация');
  assert.equal(customMap.nameEn,'Smoke location');
  assert.ok(await page.locator('.wiki-map-section-switches button').count()>=4);
  await page.locator('.wiki-map-tag-section .wiki-owner-plus').click();
  await page.locator('.wiki-map-tag-form [data-owner-interface-key="tagRu"]').fill('Государство');
  await page.locator('.wiki-map-tag-form [data-owner-interface-key="tagEn"]').fill('Nation');
  await page.locator('.wiki-map-tag-form .wiki-owner-plus').click();
  await page.locator('.wiki-map-tag-label').filter({hasText:'Nation'})
   .waitFor({state:'visible',timeout:20000});
  assert.deepEqual(JSON.parse(townOverrides.get(customMapKeys[0])).tags,
   [{ru:'Государство',en:'Nation'}]);
  await page.locator('.wiki-map-add-section').click();
  await page.locator('.wiki-map-custom-form [data-owner-interface-key="sectionTitleRu"]')
   .fill('История');
  await page.locator('.wiki-map-custom-form [data-owner-interface-key="sectionTitleEn"]')
   .fill('History');
  await page.locator('.wiki-map-custom-form .wiki-owner-plus').click();
  await page.locator('.wiki-map-extra-section').filter({hasText:'History'})
   .waitFor({state:'visible',timeout:20000});
  assert.equal(JSON.parse(townOverrides.get(customMapKeys[0])).extraSections[0].titleEn,
   'History');
  // Deleting a D1-only location must leave the official game maps untouched.
  const removedKey=customMapKeys[0];
  page.once('dialog',dialog=>void dialog.accept());
  const resetCompleted=page.waitForResponse(response=>{
   if(!response.url().endsWith('/api/admin/reset'))return false;
   try{return response.request().postDataJSON().key===removedKey}
   catch{return false}
  },{timeout:15000});
  await page.locator('.wiki-page .wiki-owner-delete-record').click();
  await resetCompleted;
  await page.waitForFunction(key=>!document.querySelector(
   '.wiki-list [data-wiki-record="'+key+'"]'
  ),removedKey.replace('wikiedit.map.',''),{timeout:15000});
  assert.equal(townOverrides.has(removedKey),false,'Owner location removed from D1');
  // The owner's verified El Beht roster is editable without inventing OS
  // numeric IDs. Create an owner monster from an unmatched report and link it.
  await chooseWikiChapter('map');
  const futureFilter=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  await futureFilter.click();
  await futureFilter.fill('Эль Ведд');
  await page.locator('.wiki-list [data-wiki-record="el-beht"]')
   .waitFor({state:'visible',timeout:20000});
  await page.locator('.wiki-list [data-wiki-record="el-beht"]').click();
  const elBeht=page.locator('.wiki-page');
  await elBeht.locator('.wiki-map-monsters .wiki-mob-row').first()
   .waitFor({state:'visible',timeout:20000});
  assert.equal(await elBeht.locator('.wiki-map-monsters .wiki-mob-row').count(),22);
  assert.equal(await elBeht.locator('.wiki-historic-notice,.wiki-historic-tag').count(),0);
  const soldier=elBeht.locator('.wiki-mob-row')
   .filter({hasText:'Кровавый ящер-солдат'}).first();
  await soldier.getByRole('button',{name:/Create card|Создать карточку/}).click();
  const form=soldier.locator('.wiki-owner-monster-form');
  await form.waitFor({state:'visible',timeout:10000});
  await form.locator('[aria-label="Monster name EN"]').fill('Blood Lizard Soldier');
  const savedRoster=page.waitForResponse(response=>{
   if(!response.url().endsWith('/api/admin/override'))return false;
   try{return response.request().postDataJSON().key==='wikiedit.map.el-beht'}
   catch{return false}
  },{timeout:20000});
  await form.getByRole('button',{name:/Save monster|Сохранить монстра/}).click();
  try{await savedRoster}
  catch(error){
   const current=await page.evaluate(()=>({
    message:document.querySelector('.wiki-owner-monster-form .inline-owner-error')?.textContent||null,
    currentCard:document.querySelector('.wiki-page h3')?.textContent||null,
    selected:document.querySelector('.wiki-list [aria-current="page"]')?.getAttribute('data-wiki-record')||null
   }));
   throw new Error('Monster link save did not finish: '+JSON.stringify({
    current,monsterKeys:[...townOverrides.keys()].filter(k=>k.startsWith('wikiedit.monster.')),
    mapRecord:townOverrides.get('wikiedit.map.el-beht')||null
   }),{cause:error});
  }
  const ownerMonsterKeys=[...townOverrides.keys()].filter(x=>/^wikiedit\.monster\.owner-monster-/.test(x));
  assert.equal(ownerMonsterKeys.length,1,'Owner created monster has a dedicated D1 key');
  assert.equal(JSON.parse(townOverrides.get(ownerMonsterKeys[0])).level,47);
  const createdId=ownerMonsterKeys[0].slice('wikiedit.monster.'.length);
  const storedFuture=JSON.parse(townOverrides.get('wikiedit.map.el-beht'));
  assert.equal(storedFuture.roster.find(x=>x.name==='Кровавый ящер-солдат').monsterId,createdId);
  assert.ok(storedFuture.mobs.includes(createdId));
  await elBeht.locator('.wiki-map-monsters .wiki-link[href="#wiki/monster/'+createdId+'"]')
   .waitFor({state:'visible',timeout:20000});
  assert.equal(await elBeht.locator('.wiki-map-monsters .wiki-mob-row').count(),22);
  // Create a genuine administrator-owned NPC from the same confirmed map.
  await elBeht.locator('.wiki-map-create-npc').click();
  const npcForm=elBeht.locator('.wiki-map-create-npc-form');
  await npcForm.locator('[data-owner-interface-key="npcNameRu"]').fill('Мастер арены Алиса');
  await npcForm.locator('[data-owner-interface-key="npcNameEn"]').fill('Arena Master Alice');
  await npcForm.locator('[data-owner-interface-key="npcService"]').fill('Управляет ареной');
  const savedNpc=page.waitForResponse(response=>{
   if(!response.url().endsWith('/api/admin/override'))return false;
   try{return /^wikiedit\.npc\.owner-npc-/.test(response.request().postDataJSON().key)}
   catch{return false}
  },{timeout:8000}).then(()=>true,()=>false);
  await npcForm.getByRole('button',{name:/Save NPC|Сохранить NPC/}).click();
  if(!await savedNpc){
   const diagnostic=await page.evaluate(()=>({
    error:document.querySelector('.wiki-map-create-npc-form .inline-owner-error')?.textContent,
    status:document.querySelector('#ownerDock [data-owner-save-state]')?.textContent,
    form:document.querySelector('.wiki-map-create-npc-form')?.textContent?.slice(0,220),
    selected:document.querySelector('.wiki-page h3')?.textContent,
    jsErrors:document.querySelector('#siteNotice')?.textContent
   }));
   throw Error('Owner NPC creation did not POST: '+JSON.stringify(diagnostic)+
    '; browser errors: '+errors.join('; '));
  }
  const newNpcKeys=[...townOverrides.keys()].filter(key=>/^wikiedit\.npc\.owner-npc-/.test(key));
  assert.equal(newNpcKeys.length,1);
  const newNpc=JSON.parse(townOverrides.get(newNpcKeys[0]));
  assert.equal(newNpc.name,'Мастер арены Алиса');
  assert.deepEqual(newNpc.maps,['el-beht']);
  const newNpcId=newNpcKeys[0].slice('wikiedit.npc.'.length);
  await elBeht.locator('.wiki-owner-location-residents a[href="#wiki/npc/'+newNpcId+'"]')
   .waitFor({state:'visible',timeout:20000});
  // The drawer may be collapsed after Wiki navigation; textContent still
  // represents the saved D1 count, unlike hidden-element innerText.
  assert.match(await ownerPanel.locator('[data-owner-count]').textContent(),/запис|D1 edits/);
  console.log('Chromium future-map NPC D1 passed: create, link and display bilingual owner NPC');
  console.log('Chromium future-map roster D1 passed: owner monster creation and cross-link');
  console.log('Chromium owner location created and edited through D1: RU/EN, tags, sections');
  console.log('Chromium admin town NPC D1 passed: inline RU/EN edits and relocation');
  assert.deepEqual(calls.filter(x=>x==='owner-acquire-edit'),['owner-acquire-edit']);
  assert.deepEqual(calls.filter(x=>x==='owner-trade-edit'),['owner-trade-edit']);
  assert.deepEqual(errors,[]);
  // #390 admin history help: use the same D1 editor and independent pencil,
  // not a second modal or a write to the game catalog.
  // The NPC Wiki workbench is modal and covers the language switch.
  // Close it using the real X button before changing language.
  if(await page.locator('#detailPanel.is-open').count())
   await closeWorkbench();
  // NPC admin flow can finish in EN; guarantee the RU editor writes RU.
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  const historyButton=ownerPanel.locator('.owner-dock-history');
  if(!await historyButton.isVisible()){
   const toggle=ownerPanel.locator('[data-owner-collapse]');
   if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
  }
  await historyButton.click();
  const history=page.getByRole('dialog',{name:'Все ручные правки'});
  await history.waitFor({state:'visible'});
  // History controls are owned RU/EN copy, not live record names or values.
  const historySearch=history.locator('.owner-manager-search');
  assert.equal(await historySearch.getAttribute('aria-label'),'Поиск среди ручных изменений');
  assert.equal(await history.locator('.owner-manager-section').getAttribute('aria-label'),
   'Раздел ручных правок');
  // Two distinct owner panels are legitimate. Select the actual search
  // caption panel by its semantic field, not whichever summary is first.
  const historySourcePanel=history.locator('.studio-owner-interface-editor').filter({
   has:history.locator('[data-owner-copy-id="searchPlaceholder"]')
  });
  await historySourcePanel.locator(':scope > summary').click();
  const placeholderCaption=history.locator('.studio-owner-interface-editor '+
   '[data-owner-copy-id="searchPlaceholder"]');
  await placeholderCaption.dblclick();
  const placeholderInput=placeholderCaption.locator('[data-owner-text-field]');
  await placeholderInput.waitFor({state:'visible'});
  await placeholderInput.fill('Найти запись истории · QA');
  await placeholderInput.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.owner-manager-search')?.dataset.placeholder===
   'Найти запись истории · QA',null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-history.search-placeholder')).ru,
   'Найти запись истории · QA');
  // Owner-authored independent hover text must not mutate button caption
  // or the user's actual search. Its accessible description tracks D1 CAS.
  const hoverCopy=history.locator('.studio-owner-interface-editor '+
   '[data-owner-copy-id="clearHelp"]');
  await historySearch.fill('Поиск не должен исчезнуть при правке подсказки');
  await hoverCopy.dblclick();
  const hoverInput=hoverCopy.locator('[data-owner-text-field]');
  await hoverInput.waitFor({state:'visible'});
  await hoverInput.fill('Подсказка очистки истории · QA');
  await hoverInput.press('Tab');
  await page.waitForFunction(()=>document.querySelector('.owner-manager-search-clear')
   ?.dataset.guideHint==='Подсказка очистки истории · QA',null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-history.clear-help')).ru,
   'Подсказка очистки истории · QA');
  assert.equal(await history.locator('.owner-manager-search-clear').getAttribute('aria-description'),
   'Подсказка очистки истории · QA');
  assert.equal(await history.locator('.owner-history-clear-copy').textContent(),'Очистить');
  assert.equal((await historySearch.textContent()).trim(),
   'Поиск не должен исчезнуть при правке подсказки');
  const sessionCaption=history.locator('.owner-history-session-copy');
  assert.equal(await history.locator('.owner-manager-session input').isChecked(),false);
  await sessionCaption.dblclick();
  const sessionEditor=sessionCaption.locator('[data-owner-text-field]');
  await sessionEditor.waitFor({state:'visible'});
  await sessionEditor.fill('Правки этого сеанса · QA');
  await sessionEditor.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.owner-history-session-copy')?.textContent===
   'Правки этого сеанса · QA',null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-history.session')).ru,
   'Правки этого сеанса · QA');
  assert.equal(await history.locator('.owner-manager-session input').isChecked(),false,
   'Double-click editing must not change the native checkbox');
  assert.equal(await history.locator('.owner-manager-search-clear').getAttribute('aria-label'),
   'Очистить поиск по правкам');
  assert.equal(await history.locator('.owner-manager-section option[value=""]').textContent(),
   'Все разделы');
  // A normal click on the same authored caption must still toggle the filter.
  await sessionCaption.click();
  await page.waitForFunction(()=>document.querySelector('.owner-manager-session input')
   ?.checked===true,null,{timeout:4000});
  await history.locator('.owner-manager-session input').uncheck();
  // Native search query remains editable and the button still clears it.
  await historySearch.fill('Проверка настоящего поискового значения');
  await history.locator('.owner-history-clear-copy').click();
  await page.waitForFunction(()=>!document.querySelector('.owner-manager-search')
   ?.value,null,{timeout:4500});
  const sections=history.locator('.owner-manager-section');
  const sessionFilter=history.locator('.owner-manager-session input');
  assert.ok(await sections.locator('option').count()>=1,
   'History needs a native section filter, even with an empty archive');
  assert.equal(await sessionFilter.isChecked(),false);
  const allHistory=await history.locator('.owner-review-row').count();
  await sessionFilter.check();
  assert.ok(await history.locator('.owner-review-row').count()<=allHistory,
   'Session filter cannot add unrelated D1 edits');
  await sessionFilter.uncheck();
  if(await sections.locator('option').count()>1){
   await sections.selectOption({index:1});
   assert.ok(await history.locator('.owner-review-row').count()<=allHistory);
   await sections.selectOption('');
  }
  assert.match(await history.locator('.owner-manager-summary').innerText(),/Показано/);
  const summaryHistory=history.locator('.owner-manager-summary');
  const historyTotals=summaryHistory.locator('.owner-history-live-count');
  const beforeTotalValues=await historyTotals.allTextContents();
  assert.equal(beforeTotalValues.length,2);
  // One real history record: edit only source captions, never counts or
  // original before/after values. Dblclick on reset cannot delete the record.
  const historyRow=history.locator('.owner-review-row').first();
  assert.ok(await historyRow.count()>0,'History fixture must include an actual edit');
  if(!await historyRow.evaluate(node=>node.open))
   await historyRow.locator('.owner-review-heading').click();
  const originalRowCount=await history.locator('.owner-review-row').count();
  const fieldCount=historyRow.locator('.owner-history-field-count');
  const originalFieldCount=await fieldCount.textContent();
  const changedCaption=historyRow.locator('.owner-history-fields-copy');
  await changedCaption.dblclick();
  assert.equal(await historyRow.evaluate(node=>node.open),true,
   'Editing count caption inside native summary must not collapse the row');
  const changedInput=changedCaption.locator('[data-owner-text-field]');
  await changedInput.waitFor({state:'visible'});
  await changedInput.fill('Изменённые поля · QA');
  await changedInput.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.owner-history-fields-copy')?.textContent==='Изменённые поля · QA',
   null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-history.fields-changed')).ru,
   'Изменённые поля · QA');
  assert.equal(await fieldCount.textContent(),originalFieldCount);
  const resetCaption=historyRow.locator('.owner-history-reset-copy');
  await resetCaption.dblclick();
  const resetInput=resetCaption.locator('[data-owner-text-field]');
  await resetInput.waitFor({state:'visible'});
  await resetInput.fill('Восстановить запись · QA');
  await resetInput.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.owner-history-reset-copy')?.textContent==='Восстановить запись · QA',
   null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-history.restore-original')).ru,
   'Восстановить запись · QA');
  assert.equal(await history.locator('.owner-review-row').count(),originalRowCount,
   'Editing a reset caption must not reset any real D1 override');
  assert.deepEqual(await historyTotals.allTextContents(),beforeTotalValues);
  assert.equal(await history.locator('.owner-history-pencil').count(),0);
  assert.equal(await history.locator('.owner-history-pending-saving').count(),1);
  assert.equal(await history.locator('.owner-history-pending-error').count(),1);
  const historyLead=summaryHistory.locator('[data-owner-copy-id="shownLead"]');
  const historyLeadOriginal=await historyLead.textContent();
  assert.equal(historyLeadOriginal,'Показано');
  await historyLead.dblclick();
  const liveEditor=historyLead.locator('[contenteditable]');
  await liveEditor.waitFor({state:'visible',timeout:9000});
  await liveEditor.fill('Найдено');
  await liveEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector(
   '.owner-manager-summary [data-owner-copy-id="shownLead"]')?.textContent==='Найдено',
   null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-history.shown-lead')).ru,
   'Найдено');
  assert.deepEqual(await historyTotals.allTextContents(),beforeTotalValues,
   'Owner copy edits cannot change the live totals');
  assert.match(await summaryHistory.innerText(),/^Найдено \d+ из \d+ правок$/);
  assert.equal(await summaryHistory.locator('.owner-history-pencil').count(),0);
  const compareCopy=history.locator('.owner-history-comparison-copy').first();
  if(await compareCopy.count()){
   const card=compareCopy.locator('xpath=ancestor::details[1]');
   if(!await card.evaluate(node=>node.open))
    await card.locator('.owner-review-heading').click();
   await compareCopy.waitFor({state:'visible',timeout:9000});
   const firstBefore=await history.locator('.owner-review-before p').first().textContent();
   const firstAfter=await history.locator('.owner-review-after p').first().textContent();
   await compareCopy.dblclick();
   const headingEditor=compareCopy.locator('[contenteditable]');
   await headingEditor.waitFor({state:'visible',timeout:8000});
   await headingEditor.fill('Исходно');
   await headingEditor.press('Tab');
   await page.waitForFunction(()=>document.querySelector(
    '.owner-history-comparison-copy[data-owner-copy-id="beforeHeading"]')
    ?.textContent==='Исходно',null,{timeout:15000});
   assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-history.before-heading')).ru,
    'Исходно');
   assert.equal(await history.locator('.owner-review-before p').first().textContent(),
    firstBefore);
   assert.equal(await history.locator('.owner-review-after p').first().textContent(),
    firstAfter);
  }

  const intro=history.locator('[data-owner-copy-section="owner-history"][data-owner-copy-id="intro"]');
  await intro.waitFor({state:'visible'});
  const introWrap=intro.locator('xpath=..');
  assert.equal(await introWrap.locator('.owner-history-pencil').count(),0);
  const beforeCatalogCalls=calls.filter(x=>x==='d1-import'||x.startsWith('game-source:')).length;
  await intro.dblclick();
  const introInput=intro.locator('[contenteditable]').first();
  await introInput.waitFor({state:'visible'});
  const historyCopy='История правок QA: записи сохраняются в Cloudflare D1 и доступны для проверки и отмены.';
  await introInput.fill(historyCopy);
  await introInput.press('Tab');
  await page.waitForFunction(value=>
   document.querySelector('.owner-history-caption')?.textContent===value,
   historyCopy,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-history.intro')).ru,
   historyCopy,'History copy saves via the established D1 override path');
  assert.equal(calls.filter(x=>x==='d1-import'||x.startsWith('game-source:')).length,
   beforeCatalogCalls,'History copy editing must not publish the game catalog');
  // A direct double click on the actual modal title must save D1 copy and
  // synchronize the native dialog accessible name without remounting the form.
  const titleCaption=page.locator('#modalRoot .modal h2').first();
  await titleCaption.dblclick();
  const titleInput=titleCaption.locator('[data-owner-text-field]');
  await titleInput.waitFor({state:'visible'});
  await titleInput.fill('История сохранённых правок · QA');
  await titleInput.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('#modalRoot .modal[role="dialog"]')?.getAttribute('aria-label')===
   'История сохранённых правок · QA',null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-history.dialog-title')).ru,
   'История сохранённых правок · QA');
  await page.locator('#modalRoot .modal button.close').click();
  // Issue #390: real owner-export modal, with independent pencil and D1 save.
  // The publication endpoint must not run when the owner edits its caption.
  await ownerPanel.locator('.owner-dock-export').click();
  const exportModal=page.getByRole('dialog',{name:'Необязательная копия энциклопедии в GitHub'});
  await exportModal.waitFor({state:'visible'});
  assert.match(await exportModal.locator('.owner-dialog-live-count').innerText(),/2/);
  const exportIntro=exportModal.locator('[data-owner-copy-section="owner-dialog"]'+
   '[data-owner-copy-id="githubExplanation"]');
  const introRow=exportIntro.locator('xpath=..');
  assert.equal(await introRow.locator('.owner-dialog-pencil').count(),0);
  const beforePRCalls=calls.filter(x=>x==='owner-pr').length;
  await exportIntro.dblclick();
  const exportInput=exportIntro.locator('[contenteditable]').first();
  await exportInput.waitFor({state:'visible'});
  const russianExport='Проверяй изменения перед экспортом в GitHub. Тестовое пояснение.';
  await exportInput.fill(russianExport);
  await exportInput.press('Tab');
  await page.waitForFunction(value=>
   document.querySelector('[data-owner-copy-id="githubExplanation"]')?.textContent===value,
   russianExport,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-dialog.github-explanation')).ru,
   russianExport);
  const exportAction=exportModal.locator('.owner-dialog-action-editor');
  assert.equal(await exportAction.locator('button.owner-dialog-action').count(),1);
  await exportAction.locator('button.owner-dialog-action').dblclick();
  const exportActionInput=exportAction.locator('[contenteditable]').first();
  await exportActionInput.waitFor({state:'visible'});
  await exportActionInput.fill('Создать PR после проверки');
  await exportActionInput.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.owner-dialog-action')?.textContent==='Создать PR после проверки',
   null,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.owner-dialog.github-create-button')).ru,
   'Создать PR после проверки');
  assert.equal(calls.filter(x=>x==='owner-pr').length,beforePRCalls,
   'The export pencil must never invoke the publication endpoint');
  await exportModal.locator('button.close').click();
  // EN localization is independent; editing the RU copy must not overwrite it.
  await page.locator('#locale [data-locale="en"]').click();
  await ownerPanel.locator('.owner-dock-export').click();
  const exportEn=page.getByRole('dialog',{name:'Optional GitHub encyclopedia copy'});
  await exportEn.waitFor({state:'visible'});
  assert.match(await exportEn.locator('[data-owner-copy-id="githubExplanation"]').innerText(),
   /GitHub export is OPTIONAL/);
  assert.equal(await exportEn.locator('.owner-dialog-action').innerText(),
   'Prepare copy PR');
  assert.match(await exportEn.locator('.owner-dialog-live-count').innerText(),/2/);
  await exportEn.locator('button.close').click();
  await page.locator('#locale [data-locale="ru"]').click();
  // #390: exercise the Hero Book's real RU/EN author-copy editor under a
  // logged-in admin with an isolated, mocked Cloudflare D1 override response.
  if(await page.locator('#dockClose').isVisible())await closeWorkbench();
  // Previous scenario deliberately ends in English. Select RU for the RU
  // write first, then verify untouched EN fallback and restoration.
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='ru');
  await page.locator('#hero').click();
  await page.locator('#stageBookTab_buffs').click();
  const bookDebug=await page.evaluate(()=>({
   lang:document.documentElement.lang,
   stageHidden:document.querySelector('#stageAttributes')?.hidden,
   bookVisible:document.querySelector('#stageBookPanel')?.dataset.bookVisible,
   paragraphs:[...document.querySelectorAll('#stageBookPanel p')].slice(0,5)
    .map(x=>({text:x.textContent?.slice(0,110),key:x.dataset.ownerCopyKey})),
   bookCaptionCount:document.querySelectorAll('#stageBookPanel [data-owner-copy-key]').length,
   tab:document.querySelector('#stageBookTab_buffs')?.getAttribute('aria-selected')
  }));
  console.log('Book editorial probe',JSON.stringify(bookDebug));
  // The editable explanation now lives in the standard standalone
  // Elemental Resistance disclosure, not the removed nested accordion.
  const showBookNote=async()=>{
   const details=page.locator('#stageBookPanel .stage-book-buff-group').filter({
    has:page.locator('[data-guide-key="buffs.section.elemental"]')
   });
   await details.waitFor({state:'attached'});
   if(!(await details.evaluate(node=>node.open)))
    await details.locator(':scope > summary').click();
  };
  await showBookNote();
  const bookCaption=page.locator(
   '#stageBookPanel p.stage-attribute-note[data-owner-copy-key]').first();
  await bookCaption.waitFor({state:'visible',timeout:20000});
  const bookKey=await bookCaption.getAttribute('data-owner-copy-key');
  assert.match(bookKey,/^book-[a-z0-9-]+-[a-f0-9]{8}$/);
  assert.equal(await page.locator('#stageBookPanel .account-copy-pencil').count(),0,
   'Book prose must not have a caption-pencil');
  await bookCaption.dblclick();
  const bookInput=page.locator('#stageBookPanel .account-copy-edit-host [contenteditable]').first();
  await bookInput.waitFor({state:'visible'});
  const longBookCopy='Отмечай только действующие на героя эффекты. Проверка длинного текста и сохранения без потери введённых данных.';
  await bookInput.fill(longBookCopy);
  const editorHeight=await bookInput.evaluate(node=>node.getBoundingClientRect().height);
  assert.ok(editorHeight>=34,'Long copy must remain visible in an expanding editor');
  await bookInput.press('Tab');
  await page.waitForFunction(text=>
   document.querySelector('#stageBookPanel p.stage-attribute-note')?.textContent===text,
   longBookCopy,{timeout:20000});
  const bookSaved=JSON.parse(townOverrides.get('guideedit.book.ui.label.'+bookKey)||'null');
  assert.equal(bookSaved?.ru,longBookCopy,'Real in-screen copy write must reach D1 transport mock');
  await page.locator('#locale [data-locale="en"]').click();
  await showBookNote();
  await page.locator('#stageBookPanel p.stage-attribute-note').first().waitFor({state:'visible'});
  assert.match(await page.locator('#stageBookPanel p.stage-attribute-note').first().innerText(),
   /Only one spell can be active at a time/);
  await page.locator('#locale [data-locale="ru"]').click();
  await showBookNote();
  assert.equal(await page.locator('#stageBookPanel p.stage-attribute-note').first().innerText(),
   longBookCopy,'RU saved copy survives EN->RU and does not change the hero');
  assert.deepEqual(errors,[]);
  console.log('Chromium Book editorial passed: long RU D1 copy, EN fallback, no duplicate pencil');
  const other=await context.newPage();
  await other.goto(base+'/',{waitUntil:'domcontentloaded'});
  for(let i=0;i<5;i++)await other.locator('.brand').click();
  await other.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await other.close();
  // Regression 0.898: owner Finish ends editing while retaining credentials.
  // Reproduce the broken update click with a mocked future release.
  if(await page.locator('#stageAttributes').isVisible())
   await page.locator('#stageAttributes .stage-book-close').click();
  offerNewSiteVersion=true;
  // A separate client with no owner login must be able to update immediately.
  // This is the real browser/runtime path, not a mocked admin predicate.
  const freshPage=await context.newPage();
  await freshPage.goto(base+'/',{waitUntil:'domcontentloaded'});
  await freshPage.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await freshPage.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  const freshBanner=freshPage.locator('#studio-update-banner');
  await freshBanner.waitFor({state:'visible',timeout:10000});
  assert.deepEqual(await freshPage.evaluate(()=>window.PandoraStudioOwnerUpdateState?.()),
   {editing:false,saving:false});
  assert.match(await freshBanner.locator('[data-update-role="message"]').innerText(),
   /Новая версия опубликована|A new version is available/i);
  const freshNavigation=freshPage.waitForRequest(request=>request.isNavigationRequest()&&
   new URL(request.url()).searchParams.get('ps-revision')===futureRelease);
  await freshBanner.locator('[data-update-role="apply"]').click();
  await freshNavigation;
  await freshPage.close();
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  const updateBanner=page.locator('#studio-update-banner');
  await updateBanner.waitFor({state:'visible',timeout:10000});
  const updateButton=updateBanner.locator('[data-update-role="apply"]');
  await updateButton.click();
  // The owner-editable action separates one click from direct dblclick text
  // editing; assert the resulting feedback, not the stale pre-click banner.
  await page.waitForFunction(()=>
   /выйди из режима владельца/i.test(document.querySelector(
    '#studio-update-banner [data-update-role="message"]')?.textContent||''),
   null,{timeout:12000});
  assert.match(await updateBanner.locator('[data-update-role="message"]').innerText(),
   /выйди из режима владельца/i,'Active owner cannot refresh during editing');
  const ownerLauncher=page.locator('#ownerDock [data-owner-collapse]');
  if(await ownerLauncher.getAttribute('aria-expanded')!=='true')await ownerLauncher.click();
  await page.locator('#ownerDock .owner-dock-finish').click();
  await page.locator('#ownerDock').waitFor({state:'detached',timeout:12000});
  assert.equal(await page.evaluate(()=>window.PandoraStudioAdminActive?.()),false,
   'Finish ends owner editing even with retained authorization');
  assert.match(await updateBanner.locator('[data-update-role="message"]').innerText(),
   /Новая версия опубликована/i,
   'Owner Finish removes stale update blocker without page reload');
  const refreshRequest=page.waitForRequest(request=>request.isNavigationRequest()&&
   new URL(request.url()).searchParams.get('ps-revision')===futureRelease);
  await updateButton.click();
  await refreshRequest;
  console.log('Chromium hidden admin entry passed: no public button, keyboard and five-logo gestures, independent authentication');
 }finally{await context.close()}
}

export async function runInlineMilestonesSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#raceGrid')?.children.length>0);
  // The initial race UI renders before the D1/local catalog has finished
  // loading. Opening the branch during catalog replacement is a timing race.
  // Require the real fully validated catalog before exercising the tree.
  await page.waitForFunction(()=>/\d+ навыков · \d+ предметов · \d+ душ/.test(
   document.querySelector('#catalogStatus')?.textContent||''),null,{timeout:20000});
  // A blank hero no longer silently starts as a Cleric. Choose the
  // correct profession before inspecting the source-backed prayer track.
  await page.locator('#raceGrid .race-slide-select').click();
  await page.locator('[data-origin-tab="class"]').click();
  await page.locator('#classGrid .class-wizard-choice').nth(2).click(); // Acolyte
  await page.locator('#classGrid .class-wizard-choice').first().click(); // Priest
  await page.locator('#classGrid .class-wizard-choice').first().click(); // Cleric
  assert.match(await page.locator('#activeJob').innerText(),/Клирик/);
  // A brand-new level-1 hero has no allocatable mastery points. Set the
  // planning level to 45 before exercising a real 0 -> 1 -> 2 allocation.
  await page.locator('#level').evaluate(input=>{
   input.value='45';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent?.trim()==='45');
  const group=page.locator('[data-path-group="prayer"]');
  if(await group.getAttribute('aria-expanded')!=='true')await group.click();
  const branch=page.locator('[data-path-branch="benevolence"]');
  if(await branch.getAttribute('aria-expanded')!=='true')await branch.click();
  const mark=page.locator('.path-unlock-notch').first();
  await mark.waitFor({state:'visible',timeout:20000});
  const result=await page.evaluate(()=>{
   const marks=[...document.querySelectorAll('.path-integrated-track .path-unlock-notch')];
   const mark=marks[0],bar=mark.closest('.path-integrated-track');
   const bed=bar.querySelector('.inline-mastery-bed');
   const range=bar.querySelector('input[type=range]');
   const barRect=bed.getBoundingClientRect();
   const geom=marks.map(x=>({
    x:x.getBoundingClientRect().x,top:x.getBoundingClientRect().top,
    bottom:x.getBoundingClientRect().bottom,height:x.getBoundingClientRect().height,
    width:x.getBoundingClientRect().width,
    pointer:getComputedStyle(x).pointerEvents
   }));
   return {geom,barLeft:barRect.left,barRight:barRect.right,barTop:barRect.top,barBottom:barRect.bottom,
    rangeZ:Number(getComputedStyle(range).zIndex),
    markerZ:Number(getComputedStyle(mark).zIndex),
    thumbCenterStart:range.getBoundingClientRect().left+9};
  });
  const legend=page.locator('.path-track-legend').first();
  assert.ok(await legend.isVisible(),'Skill scale labels must be visible below the drag track');
  assert.ok((await legend.innerText()).includes('Лимит (оч.): '));
  assert.ok((await legend.innerText()).includes('90'));
  assert.ok(result.geom.length>=3,'Expected several source-backed unlock thresholds');
  assert.ok(result.geom.every(x=>x.top>=result.barTop-1&&x.bottom<=result.barBottom+1),
   'Every skill threshold belongs inside the SAME horizontal bar: '+JSON.stringify(result));
  assert.ok(result.geom.every(x=>x.x+x.width/2>=result.barLeft-1&&
   x.x+x.width/2<=result.barRight+1),'Unlock thresholds must stay within 0–90 rail');
  assert.ok(result.geom.every(x=>x.width===3&&x.height===12&&x.pointer==='none'),
   'Vertical skill ticks must remain compact and never steal slider events');
  assert.ok(result.geom.every((x,i,a)=>i===0||x.x>a[i-1].x),
   'Thresholds must be ordered left to right, not staggered over rows');
  assert.ok(result.geom.every(x=>Math.abs(x.top-result.geom[0].top)<=1));
  assert.ok(result.rangeZ>result.markerZ,'The slider must own pointer events');
  // User regression: 0 -> 1 inserts a green mastery count into the branch header
  // and previously made the branch editor jump vertically while dragging.
  const measureBranch=()=>page.evaluate(()=>{
   const row=document.querySelector('[data-path-branch="benevolence"]');
   const editor=row.nextElementSibling;
   const rail=editor.querySelector('.inline-mastery-bed').getBoundingClientRect();
   const duplicatePoints=editor.querySelectorAll('.inline-branch-value').length;
   const exactControls=editor.querySelectorAll('.path-point-controls input[type=number]').length;
   const range=editor.querySelector('input[type=range]');
   const notch=editor.querySelector('.path-current-notch');
   const notchRect=notch.getBoundingClientRect();
   return {height:row.getBoundingClientRect().height,duplicatePoints,exactControls,
    // Browser scrolling changes the absolute viewport top, not the layout
    // relationship between the row and the expanded track beneath it.
    editorGap:editor.getBoundingClientRect().top-row.getBoundingClientRect().bottom,
    extraMasteryLine:row.querySelector('span')?.textContent||'',
    points:row.querySelector('.count')?.textContent||'',
    notchX:notchRect.left+notchRect.width/2,
    expectedX:rail.left+Number(range.value)/Number(range.max)*rail.width,
    notchWidth:notchRect.width,notchHeight:notchRect.height,
    notchPointer:getComputedStyle(notch).pointerEvents,
    notchAria:notch.getAttribute('aria-hidden'),
    thumbWidth:range.getBoundingClientRect().width};
  });
  const drag=async value=>{
   await page.locator('[data-branch-control="benevolence:potential-range"]').evaluate((input,n)=>{
    input.value=String(n);input.dispatchEvent(new Event('input',{bubbles:true}));
   },value);
   await page.evaluate(()=>new Promise(requestAnimationFrame));
   return measureBranch();
  };
  const stable=[await measureBranch(),await drag(6),await drag(7),await drag(5)];
  assert.ok(stable.every(x=>x.duplicatePoints===0&&x.exactControls===2),
   'The duplicate points row is absent; both exact controls remain');
  assert.ok(stable[0].points.includes('5 / 90'),'Cleric starts with five branch points, but no manual green');
  assert.ok(stable[1].points.includes('6 / 90')&&stable[2].points.includes('7 / 90'),
   'Blue branch level grows but the class limit remains 90');
  assert.ok(stable.every(x=>Math.abs(x.height-stable[0].height)<=1),
   'Mastery changes must NOT increase the branch row height: '+JSON.stringify(stable));
  assert.ok(stable.every(x=>Math.abs(x.editorGap-stable[0].editorGap)<=1),
   'The expanded mastery track must NOT jump relative to its row: '+JSON.stringify(stable));
  assert.ok(stable.every(x=>x.extraMasteryLine===''),
   'Mastery lives in the green numeric field, not an inserted header row');
  assert.ok(stable.every(x=>Math.abs(x.notchX-x.expectedX)<=1.25),
   'The vertical value notch must follow the exact current range value: '+JSON.stringify(stable));
  assert.ok(stable.every(x=>x.notchWidth===4&&x.notchHeight===26&&
   x.notchPointer==='none'&&x.notchAria==='true'),
   'The decorative notch must stay narrow and never steal slider input');
  // The invisible native 18px thumb still exposes normal keyboard and
  // pointer hit testing, even though the value marker itself is only 4px wide.
  const arrowRange=page.locator('[data-branch-control="benevolence:potential-range"]');
  await arrowRange.focus();await page.keyboard.press('ArrowRight');
  assert.equal(await arrowRange.inputValue(),'6','Keyboard allocation remains functional');
  await drag(5);
  const exact=page.locator('[data-branch-control="benevolence:potential-number"]');
  await drag(7);
  await exact.fill('');
  await exact.press('Tab');
  assert.equal(await exact.inputValue(),'0','Clearing and blurring precise field must refund points');
  assert.equal(await page.locator('[data-branch-control="benevolence:potential-range"]').inputValue(),'5');
  await drag(10);
  assert.match(await page.locator('[data-path-branch="benevolence"] .count').innerText(),/10\s*\/\s*90/);
  assert.equal(await page.locator('.inline-branch-value').count(),0);
  await page.locator('#pathAutoMastery').uncheck();
  const mastery=page.locator('[data-branch-control="benevolence:mastery-number"]');
  assert.equal(await mastery.isEnabled(),true,'manual mastery control must be editable');
  await mastery.fill('9');await mastery.press('Tab');
  assert.equal(await mastery.inputValue(),'9');
  await mastery.fill('');await mastery.press('Tab');
  assert.equal(await mastery.inputValue(),'0','Clearing manual mastery resets to true zero');
  assert.equal(await page.locator('[data-branch-control="benevolence:potential-range"]').inputValue(),'10',
   'Clearing manual green must not refund invested blue points');
  await drag(5);
  await page.locator('#pathAutoMastery').check();
  const points=Number(await mark.getAttribute('data-milestone-points'));
  const range=page.locator('.path-integrated-track input[type=range]').first();
  const rect=await range.boundingBox();
  const travel=rect.width-18;
  await page.mouse.move(rect.x+9+points/Number(await range.getAttribute('max'))*travel,rect.y+rect.height/2);
  await mark.locator('.path-milestone-tooltip').waitFor({state:'visible',timeout:4000});
  assert.ok((await mark.locator('.path-milestone-preview').count())>=1);
  assert.ok((await mark.locator('.path-milestone-cost').count())>=1,
   'Skill hover must expose current source-backed MP cost');
  assert.match(await mark.locator('.path-milestone-cost').first().innerText(),/Затрат ОМ: [0-9]+/);
  const fields=page.locator('.path-point-controls').first();
  await fields.waitFor({state:'visible'});
  assert.deepEqual(await fields.locator('.path-point-group .path-point-name').allTextContents(),
   ['Вложено','Мастерство']);
  const inputHeights=await fields.locator('input[type=number]').evaluateAll(inputs=>
   inputs.map(input=>Math.round(input.getBoundingClientRect().height)));
  assert.deepEqual(inputHeights,[35,35],'Both redesigned numeric fields have equal height');
  const controlsPosition=await fields.locator('.path-point-group').evaluateAll(labels=>
   labels.map(label=>({top:Math.round(label.getBoundingClientRect().top),
    bottom:Math.round(label.getBoundingClientRect().bottom)})));
  const controlsWidth=await fields.evaluate(el=>el.getBoundingClientRect().width);
  assert.ok(controlsPosition.every(item=>item.top===controlsPosition[0].top)||
   controlsWidth<197&&controlsPosition[1].top>controlsPosition[0].top,
   'Two controls share a row when space allows, and stack otherwise; width '+
   controlsWidth+' positions '+JSON.stringify(controlsPosition));
  // Exercise a genuinely narrow branch editor without changing the viewport
  // or forcing the whole site into an unrelated mobile layout.
  await fields.evaluate(element=>{element.style.width='175px'});
  const narrow=await fields.locator('.path-point-group').evaluateAll(labels=>
   labels.map(label=>({top:Math.round(label.getBoundingClientRect().top),
    right:label.getBoundingClientRect().right})));
  assert.ok(narrow[1].top>narrow[0].top,
   'At constrained widths, both compact controls must wrap cleanly');
  await fields.evaluate(element=>{element.style.removeProperty('width')});
  await mark.focus();
  await mark.locator('.path-milestone-tooltip').waitFor({state:'visible'});
  const glow=await mark.evaluate(element=>getComputedStyle(element).boxShadow);
  assert.match(glow,/0px 0px 1px 0px/,'Focused skill tick glow radius must be 1px');
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.querySelector('#locale [data-locale="en"]')
   ?.getAttribute('aria-pressed')==='true'&&
   document.querySelector('#startupOverlay')?.hidden===true,null,{timeout:20000});
  assert.ok((await page.locator('.path-track-legend').first().innerText()).includes('Limit (pts):'));
  await page.locator('#pathSkillsTab').click();
  await page.locator('.path-skill-count').waitFor({state:'visible'});
  assert.match(await page.locator('.path-skill-count').innerText(),/skills/);
  await page.locator('.path-skill-card').first().click();
  await page.locator('#pathSkillDetails').waitFor({state:'visible'});
  assert.match(await page.locator('#pathSkillDetails').innerText(),/Character level/);
  assert.deepEqual(errors,[]);
  console.log('Chromium skill track passed: thin notches share one bar, slider takes input, pointer and keyboard tooltips work');
 }finally{await context.close()}
}
