import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

export async function runAdminEntrySmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const calls=[],townOverrides=new Map();
 let sourceUnavailable=false,d1SourceSpoofed=false;
 const context=await browser.newContext({viewport:{width:1280,height:860}});
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname,method=route.request().method();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const json=(value,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(value)});
  if(path==='/api/admin/catalog/test-write'&&method==='POST'){
    assert.equal(route.request().headers().authorization,'Bearer '+ 'a'.repeat(43));
    calls.push('d1-write-check');
    return json({ok:true,readback:true,cleaned:true,
      overrideReadback:true,overrideCleaned:true,activeCatalogUnchanged:true});
  }
  if(path==='/api/admin/catalog/github-status'&&method==='GET')
   return json({configured:true});
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
   const existed=townOverrides.delete(data.key);
   return json({ok:true,key:data.key,deleted:existed});
  }
  if(path==='/api/admin/override'&&method==='POST'){
   const data=route.request().postDataJSON();
   townOverrides.set(data.key,data.value);
   assert.equal(route.request().headers().authorization,'Bearer '+'a'.repeat(43));
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
   return json({ok:true,key:data.key,value:data.value});
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
   return {pencil:!!pencil,rename:!!rename,actionsWithinHeading:within(actions,heading),
    intersectsClose:intersects(actions,close),intersectsNext:intersects(actions,next),
    intersectsChevron:intersects(groupActions,chevron),
    intersectsStatValue:intersects(tileActions,statValue)};
  });
  assert.equal(bookControls.pencil,true);
  assert.equal(bookControls.rename,true);
  assert.equal(await page.locator(
   '#stageAttributes .stage-attribute-tabs .stage-book-tab-owner>[role="tab"]').count(),6);
  assert.equal(await page.locator(
   '#stageAttributes .stage-attribute-tabs .stage-book-tab-owner>.stage-book-tab-pencil').count(),6);
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
   return {actionsInside:!!heading&&!!actions&&actions.left>=heading.left-1&&
     actions.right<=heading.right+1,closeSeparate:!!actions&&!!close&&
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
  assert.equal(await page.locator('.path-sections .path-tab-owner-wrap>.path-tab-pencil').count(),2);
  assert.equal(await page.locator('.path-sections [role="tab"] .path-tab-pencil').count(),0);
  await page.locator('#pathSkillsTab').click();
  const authoredPencil=page.locator('#pathSkillGallery .path-owner-pencil').first();
  await authoredPencil.waitFor({state:'visible'});
  assert.equal(await authoredPencil.getAttribute('type'),'button');
  await authoredPencil.click();
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
  const originAfter=await page.locator('.workspace>.left').evaluate(node=>node.getBoundingClientRect().height);
  assert.ok(Math.abs(originBefore-originAfter)<2,'The drawer must not stretch the stat column');
  await edge.click();
  assert.equal(await edge.getAttribute('aria-expanded'),'false');
  await edge.click();
  assert.match(await ownerPanel.innerText(),/Cloudflare D1/);
  assert.match(await ownerPanel.innerText(),/сохранение автоматически|сохранение автоматическое/);
  assert.equal(await ownerPanel.locator('.owner-workflow-guide[open]').count(),0,
   'The floating dock must start compact and not cover editable wiki rows');
  await ownerPanel.locator('.owner-workflow-guide>summary').click();
  assert.equal(await ownerPanel.locator('.owner-workflow-guide[open]').count(),1);
  assert.match(await ownerPanel.locator('.owner-workflow-glossary').innerText(),/Игровой каталог/);
  await ownerPanel.locator('.owner-workflow-guide>summary').click();
  assert.match(await ownerPanel.innerText(),/Экспорт в GitHub/);
  assert.match(await ownerPanel.innerText(),/Проверить сохранение/);
  assert.match(await ownerPanel.innerText(),/За этот сеанс: 0/);
  assert.match(await ownerPanel.innerText(),/записей в D1|запись в D1/);
  // Separate D1 label pencils must never click their actual admin action.
  const d1Action=ownerPanel.locator('.owner-dock-action-slot[data-owner-dock-key="testD1"]');
  assert.equal(await d1Action.locator('.owner-dock-action-pencil').count(),1);
  const d1Label='Сохранение проверено';
  const d1Key='guideedit.book.owner-dock.test-d1';
  const initialD1Calls=calls.filter(x=>x==='d1-write-check').length;
  await d1Action.locator('.owner-dock-action-pencil').click();
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
  await d1Action.locator('.owner-dock-action-pencil').click();
  const englishCaptionEditor=d1Action.locator('[contenteditable="plaintext-only"]');
  await englishCaptionEditor.waitFor({state:'visible'});
  await englishCaptionEditor.fill('Verify saving');
  await englishCaptionEditor.press('Tab');
  await page.waitForFunction(()=>document.querySelector('.owner-dock-d1-check')?.textContent==='Verify saving');
  assert.deepEqual(JSON.parse(townOverrides.get(d1Key)),{ru:d1Label,en:'Verify saving'});
  assert.match(await ownerPanel.innerText(),/Site editor|Editing enabled/);
  assert.equal(await ownerPanel.locator('.owner-dock-action-slot').count(),8);
  await page.locator('#locale [data-locale="ru"]').click();
  await page.waitForFunction(label=>
   document.querySelector('.owner-dock-d1-check')?.textContent===label,d1Label);
  assert.match(await ownerPanel.locator('[data-owner-recent]').innerText(),/За этот сеанс: 2/);
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
   await page.locator('[data-origin-edit-for="raceChoose"]').click();
   const field=page.locator('.origin-copy-input-slot [contenteditable]');
   await field.waitFor({state:'visible'});
   await field.fill(value);
   await field.press('Tab');
   await captionReady(page,value,stage);
  };
  assert.equal(await page.locator('[data-origin-edit-for="raceChoose"]').count(),1);
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
  await page.locator('#dockClose').click();
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
  await page.locator('.wiki-categories [data-wiki-chapter="honor"]').click();
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
  assert.equal(await subtitleCopy.locator('.wiki-honor-copy-pencil').count(),1);
  assert.equal(await honorPanel.locator('.wiki-honor-list-section h5 .wiki-honor-copy-pencil').count(),2);
  // Monthly rewards have two independent owner actions per group:
  // editable rank names and editable "Rewards" captions.
  assert.equal(await honorPanel.locator(
   '.wiki-honor-monthly-head small .wiki-honor-copy-pencil').count(),3);
  assert.equal(await honorPanel.locator(
   '.wiki-honor-monthly-head .wiki-honor-field-edit-row>.wiki-honor-direct-pencil').count(),3);
  await subtitleCopy.locator('.wiki-honor-copy-pencil').click();
  const subtitleEditor=subtitleCopy.locator('[data-owner-text-field="true"]');
  await subtitleEditor.waitFor({state:'visible'});
  assert.equal(await subtitleEditor.getAttribute('role'),'textbox');
  await subtitleEditor.fill('PvP · нации · звания · награды — RU');
  await subtitleEditor.blur();
  await page.waitForFunction(()=>document.querySelector('.wiki-honor-subtitle .wiki-honor-copy-owner-label')?.textContent.includes('— RU'));
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.honor-view.subtitle')).ru,
   'PvP · нации · звания · награды — RU');
  assert.equal(await honorPanel.locator('.wiki-honor-rank').count(),12);
  // Rank counts are derived from real records. The pencil beside a filter
  // edits a separate hidden host, never clicks/selects the filter itself.
  const monthlyFilter=honorPanel.locator(
   '.wiki-honor-filter-wrap:has(> [data-honor-filter="monthly"])');
  assert.equal(await monthlyFilter.locator('.wiki-honor-filter-pencil').count(),1);
  assert.equal(await honorPanel.locator('.wiki-honor-filter.chosen').getAttribute('data-honor-filter'),'all');
  await monthlyFilter.locator('.wiki-honor-filter-pencil').click();
  const monthlyEditor=monthlyFilter.locator('[data-owner-text-field="true"]');
  await monthlyEditor.waitFor({state:'visible'});
  await monthlyEditor.fill('Месячные звания');
  await monthlyEditor.blur();
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
  await chapterRow.locator('.wiki-category-edit').click();
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
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="en"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-categories [data-wiki-chapter="honor"]').click();
  const englishCaption=page.locator('.wiki-honor-subtitle');
  await englishCaption.locator('.wiki-honor-copy-pencil').click();
  const englishEditor=englishCaption.locator('[data-owner-text-field="true"]');
  await englishEditor.fill('PvP · nations · titles · rewards — EN');
  await englishEditor.blur();
  await page.waitForFunction(()=>document.querySelector('.wiki-honor-subtitle .wiki-honor-copy-owner-label')?.textContent.includes('— EN'));
  assert.deepEqual(JSON.parse(townOverrides.get('guideedit.book.honor-view.subtitle')),
   {ru:'PvP · нации · звания · награды — RU',en:'PvP · nations · titles · rewards — EN'});
  // Undo the latest EN edit without refreshing the game catalog, jumping
  // away from Honor, or discarding the independent RU edit.
  const catalogCallsBeforeUndo=calls.filter(value=>value.startsWith('game-source:')).length;
  await page.locator('#ownerDock [data-owner-undo]').click();
  await page.waitForFunction(()=>document.querySelector('.wiki-honor-subtitle .wiki-honor-copy-owner-label')
   ?.textContent==='PvP · nations · titles · rewards');
  assert.deepEqual(JSON.parse(townOverrides.get('guideedit.book.honor-view.subtitle')),
   {ru:'PvP · нации · звания · награды — RU'});
  assert.equal(calls.filter(value=>value.startsWith('game-source:')).length,
   catalogCallsBeforeUndo,'Undo of editorial text reloaded the game source');
  await page.locator('#dockClose').click();
  await page.locator('#locale [data-locale="ru"]').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('.wiki-categories [data-wiki-chapter="honor"]').click();
  assert.match(await page.locator('.wiki-honor-subtitle').innerText(),/— RU/);
  // Reuse the existing authenticated admin smoke to check the real OS workbench.
  // All catalog requests are mocked; no production Worker or D1 is mutated.
  await page.locator('#ownerDock').getByRole('button',{name:'Игровой каталог',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:/Обновление игрового каталога/});
  await dialog.waitFor({state:'visible'});
  // A pencil next to the LIVE catalog check must edit only its RU/EN copy.
  // The real check button retains its normal behavior and accessible name.
  // Scope :has() to each wrapper, not to the outer dialog.
  // #390: catalog checkbox captions are editable independently of their
  // checkbox and dynamic approval counts. The test fixture reveals the
  // optional review section without publishing any catalog change.
  const choices=dialog.locator('.os-sync-choice-editor');
  assert.equal(await choices.count(),2);
  const structures=await choices.evaluateAll(nodes=>nodes.map(node=>({
   pencilInsideLabel:Boolean(node.querySelector('label .os-sync-choice-pencil')),
   pencilCount:node.querySelectorAll(':scope>.os-sync-choice-pencil').length,
   count:node.querySelector('small.os-sync-choice-count')?.textContent||'',
   label:node.querySelector('label>span')?.textContent||''
  })));
  assert.ok(structures.every(x=>!x.pencilInsideLabel&&x.pencilCount===1),
   'Catalog checkbox pencils must be siblings of the clickable native label');
  const formattingChoice=choices.first();
  await formattingChoice.evaluate(el=>{
   el.closest('.os-sync-review-steps').hidden=false;
   el.closest('.os-sync-formatting-review').hidden=false;
  });
  const checkboxBefore=await formattingChoice.locator('input[type="checkbox"]').isChecked();
  const sourceCallsBefore=calls.filter(x=>x.startsWith('game-source:')).length;
  const originalCaption='Привести переносы строк в описаниях к виду игрового сайта';
  for(const value of ['Настройка переносов строк QA',originalCaption]){
   await formattingChoice.locator('.os-sync-choice-pencil').click();
   const editor=formattingChoice.locator('[contenteditable]').first();
   await editor.waitFor({state:'visible'});
   await editor.fill(value);
   await editor.press('Tab');
   await page.waitForFunction(text=>
    document.querySelector('.os-sync-choice-editor .os-sync-formatting-option>span')
     ?.textContent===text,value,{timeout:12000});
  }
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.formatting-label')).ru,
   originalCaption,'Checkbox caption is stored in the same D1 owner-copy store');
  assert.equal(await formattingChoice.locator('input[type="checkbox"]').isChecked(),checkboxBefore);
  assert.equal(calls.filter(x=>x.startsWith('game-source:')).length,sourceCallsBefore,
   'Editing a catalog caption must not launch a comparison or D1 game publication');
  await formattingChoice.evaluate(el=>{
   el.closest('.os-sync-formatting-review').hidden=true;
   el.closest('.os-sync-review-steps').hidden=true;
  });
  const liveAction=dialog.locator('.os-sync-action-editor:has(> .os-sync-main-check)');
  const actionPencil=liveAction.locator('.os-sync-owner-pencil');
  const actionState=await dialog.evaluate(node=>({
   ownerPencils:node.querySelectorAll('.os-sync-owner-pencil').length,
   actionWrappers:node.querySelectorAll('.os-sync-action-editor').length,
   liveActionClass:node.querySelector('.os-sync-main-check')?.parentElement?.className
  }));
  assert.equal(await actionPencil.count(),1,
   'Live catalog edit action missing or incorrectly nested: '+JSON.stringify(actionState));
  const expectedCalls=calls.filter(value=>value.startsWith('game-source:')).length;
  for(const caption of ['Проверить игровой источник QA','Проверить изменения в текущей игре']){
   await actionPencil.click();
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
  await liveSource.hover();
  await page.waitForTimeout(330);
  assert.equal(await page.getByRole('tooltip').isVisible(),false,
   'Admin hints must not appear immediately after pointer entry');
  await page.getByRole('tooltip').filter({hasText:/pandorasaga-os[.]com/}).waitFor({state:'visible',timeout:3500});
  await page.mouse.move(2,2);
  await page.getByRole('tooltip').waitFor({state:'hidden'});
  await liveSource.hover();
  await page.waitForTimeout(150);
  await page.mouse.move(2,2);
  await page.waitForTimeout(1050);
  assert.equal(await page.getByRole('tooltip').isVisible(),false,
   'Leaving an admin button cancels the tooltip timer');
  // 0.614: the help ? is independent of the action and updates the original
  // tooltip target after a D1 save, without adding duplicate hover handlers.
  const hintPencil=liveAction.locator('.os-sync-hint-pencil');
  assert.equal(await hintPencil.count(),1);
  await hintPencil.click();
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

  assert.equal(await dialog.locator('.os-sync-review-steps button').filter({hasText:'Применить выбранные изменения'}).isDisabled(),true);
  await dialog.locator('.os-sync-archive-choice>summary').click();
  await dialog.getByRole('button',{name:'Сверить с сохранённой копией'}).click();
  await page.waitForFunction(()=>
   document.querySelector('.os-sync [role=status]')?.textContent?.includes('Найдено изменений:'),
   null,{timeout:30000});
  // 0.612: reloading results may update checksum evidence but must not
  // erase the D1-editable explanation or the adjacent touch pencil.
  const checksumRow=dialog.locator(
   '.os-sync-advanced .os-sync-copy-field:has(> .os-sync-meta-status)');
  const checksumPencil=checksumRow.locator('.os-sync-copy-pencil');
  const checksumStructure=await dialog.evaluate(node=>({
   explanationCount:node.querySelectorAll('.os-sync-meta-status').length,
   parentClass:node.querySelector('.os-sync-meta-status')?.parentElement?.className,
   advancedPencils:node.querySelectorAll('.os-sync-advanced .os-sync-copy-pencil').length
  }));
  assert.equal(await checksumPencil.count(),1,
   'Checksum copy pencil disappeared after refreshing the catalog: '+
    JSON.stringify(checksumStructure));
  assert.match(await dialog.locator('.os-sync-meta-detail').textContent(),
   /Сведения об источнике:/);
  const originalChecksum=await dialog.locator('.os-sync-meta-status').textContent();
  await checksumPencil.click();
  const checksumInput=checksumRow.locator('[contenteditable]');
  await checksumInput.fill('Контрольные суммы описывают целостность файлов.');
  await checksumInput.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.os-sync-meta-status')?.textContent===
   'Контрольные суммы описывают целостность файлов.',null,{timeout:15000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.checksum-explanation')).ru,
   'Контрольные суммы описывают целостность файлов.');
  assert.equal(await checksumPencil.count(),1,
   'Saving the explanation must preserve its separate edit control');
  assert.ok(originalChecksum.length>30);
  // 0.613: safe static status and archive banner text can be D1-edited
  // without running the data comparison, catalog publication or D1 probe.
  const originalCompareCalls=calls.filter(x=>x.startsWith('game-source:')).length;
  const banner=dialog.locator('.os-sync-source-banner');
  assert.match(await banner.innerText(),/сохранённой копии/,
   'Archive warning should be present before an editor replaces its text');
  const state=dialog.locator('.os-sync-status');
  assert.equal(await banner.locator('.os-sync-state-pencil').count(),1);
  assert.equal(await state.locator('.os-sync-state-pencil').count(),1);
  await banner.locator('.os-sync-state-pencil').click();
  const bannerEditor=banner.locator('[contenteditable]');
  await bannerEditor.fill('Архивный источник проверен отдельно.');
  await bannerEditor.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.os-sync-source-banner .os-sync-state-caption')
    ?.textContent==='Архивный источник проверен отдельно.',null,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.source-archive-notice')).ru,
   'Архивный источник проверен отдельно.');
  await state.locator('.os-sync-state-pencil').click();
  const statusEditor=state.locator('[contenteditable]');
  await statusEditor.fill('Сверка завершена. Изменения не выбраны.');
  await statusEditor.press('Tab');
  await page.waitForFunction(()=>
   document.querySelector('.os-sync-status .os-sync-state-caption')?.textContent===
   'Сверка завершена. Изменения не выбраны.',null,{timeout:12000});
  assert.equal(JSON.parse(townOverrides.get('guideedit.book.catalog-sync.comparison-found')).ru,
   'Сверка завершена. Изменения не выбраны.');
  assert.equal(calls.filter(x=>x.startsWith('game-source:')).length,originalCompareCalls);
  assert.equal(await banner.locator('.os-sync-state-pencil').count(),1);
  assert.equal(await state.locator('.os-sync-state-pencil').count(),1);
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
  assert.equal(await dialog.locator('.os-sync-review-steps button').filter({hasText:'Применить выбранные изменения'}).isEnabled(),true);
  let publishPrompt='';
  page.once('dialog',confirmation=>{
    publishPrompt=confirmation.message();
    confirmation.dismiss();
  });
  await dialog.locator('.os-sync-review-steps button')
    .filter({hasText:'Применить выбранные изменения'}).click();
  assert.match(publishPrompt,/сохранённая копия проекта/);
  assert.equal(calls.filter(x=>x==='d1-import').length,0,'dismissal prevents catalog publication');
  await dialog.getByRole('button',{name:'Снять весь выбор'}).click();
  assert.equal(await dialog.locator('.os-sync-review-steps button').filter({hasText:'Применить выбранные изменения'}).isDisabled(),true);
  await dialog.getByRole('button',{name:'Выбрать понятные изменения',exact:true}).click();
  const downloadPromise=page.waitForEvent('download');
  await dialog.getByRole('button',{name:'Скачать выбранное для GitHub'}).click();
  const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'pandora-studio-reviewed-catalog.json');
  assert.match(await dialog.locator('.os-sync [role=status]').last().innerText(),/GitHub не изменён/);
  // Exercise the authenticated game-data proxy as well as archive preview.
  await dialog.getByRole('button',{name:'Проверить изменения в текущей игре'}).click();
  await page.waitForFunction(()=>document.querySelector('.os-sync [role=status]')?.textContent?.includes('Найдено изменений:'),
    null,{timeout:30000});
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
  await page.waitForFunction(()=>document.querySelector('.os-sync-status')?.textContent
    ?.includes('Сверка завершена.'),null,{timeout:30000});
  assert.equal(await dialog.locator('.os-sync-review-steps button')
    .filter({hasText:'Применить выбранные изменения'}).isDisabled(),true);
  // The new Honor smoke opened the Wiki workbench earlier in this same
  // scenario. Restore the original navigation context before re-entering Wiki:
  // page-level #nav is intentionally hidden while a workbench is open.
  await dialog.getByRole('button',{name:/Закрыть/}).click();
  await page.locator('#dockClose').click();
  await page.locator('#nav [data-tab="wiki"]').click();
  // Do not inherit Honor from the preceding regression: item editing starts
  // in the equipment chapter, regardless of the user's last visited chapter.
  await page.locator('.wiki-categories [data-wiki-chapter="item"]').click();
  const wikiSearch=page.locator('input[name="pandora-studio-encyclopedia-filter"]');
  await wikiSearch.waitFor({state:'visible'});
  const speedCheck=page.locator('.wiki-speed-check');
  await speedCheck.waitFor({state:'visible'});
  await speedCheck.click();
  await page.waitForFunction(()=>document.querySelector('.wiki-speed-result')?.textContent?.includes('мс'),null,{timeout:15000});
  assert.match(await page.locator('.wiki-speed-result').innerText(),/записей/);
  assert.equal(await wikiSearch.getAttribute('autocomplete'),'off');
  assert.equal(await wikiSearch.getAttribute('data-lpignore'),'true');
  await wikiSearch.click();
  await wikiSearch.fill('Старое название из D1');
  // The owner panel intentionally stays open across navigation. A user may
  // hide it to reach wiki entries covered by the floating panel; the admin
  // editing permission stays enabled when only the drawer is collapsed.
  assert.equal(await edge.getAttribute('aria-expanded'),'true');
  await edge.click();
  assert.equal(await edge.getAttribute('aria-expanded'),'false');
  const firstItem=page.locator('[data-wiki-record="1"]');
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
  await page.locator('.wiki-categories [data-wiki-chapter="npc"]').click();
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
  await page.locator('#dockClose').click();
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
  // Create an entirely new D1 location, then edit its sections and tags in place.
  await page.locator('.wiki-categories [data-wiki-chapter="map"]').click();
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
  await page.locator('.wiki-map-tag-form [aria-label="Тег на русском"]').fill('Государство');
  await page.locator('.wiki-map-tag-form [aria-label="Tag in English"]').fill('Nation');
  await page.locator('.wiki-map-tag-form .wiki-owner-plus').click();
  await page.locator('.wiki-map-tag-label').filter({hasText:'Nation'})
   .waitFor({state:'visible',timeout:20000});
  assert.deepEqual(JSON.parse(townOverrides.get(customMapKeys[0])).tags,
   [{ru:'Государство',en:'Nation'}]);
  await page.locator('.wiki-map-add-section').click();
  await page.locator('.wiki-map-custom-form [aria-label="Section title RU"]')
   .fill('История');
  await page.locator('.wiki-map-custom-form [aria-label="Section title EN"]')
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
  await page.locator('.wiki-categories [data-wiki-chapter="map"]').click();
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
  await npcForm.locator('[aria-label="New NPC name RU"]').fill('Мастер арены Алиса');
  await npcForm.locator('[aria-label="New NPC name EN"]').fill('Arena Master Alice');
  await npcForm.locator('[aria-label="New NPC service"]').fill('Управляет ареной');
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
  const historyButton=ownerPanel.locator('.owner-dock-history');
  if(!await historyButton.isVisible()){
   const toggle=ownerPanel.locator('[data-owner-collapse]');
   if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
  }
  await historyButton.click();
  const history=page.getByRole('dialog',{name:'Все ручные правки'});
  await history.waitFor({state:'visible'});
  const intro=history.locator('[data-owner-copy-section="owner-history"][data-owner-copy-id="intro"]');
  await intro.waitFor({state:'visible'});
  const introWrap=intro.locator('xpath=..');
  assert.equal(await introWrap.locator('.owner-history-pencil').count(),1);
  const beforeCatalogCalls=calls.filter(x=>x==='d1-import'||x.startsWith('game-source:')).length;
  await introWrap.locator('.owner-history-pencil').click();
  const introInput=introWrap.locator('[contenteditable]').first();
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
  await history.locator('button.close').click();
  // #390: exercise the Hero Book's real RU/EN author-copy editor under a
  // logged-in admin with an isolated, mocked Cloudflare D1 override response.
  if(await page.locator('#dockClose').isVisible())await page.locator('#dockClose').click();
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
  const bookCaption=page.locator(
   '#stageBookPanel p.stage-attribute-note[data-owner-copy-key]').first();
  await bookCaption.waitFor({state:'visible',timeout:20000});
  const bookKey=await bookCaption.getAttribute('data-owner-copy-key');
  assert.match(bookKey,/^book-[a-z0-9-]+-[a-f0-9]{8}$/);
  const bookEdit=bookCaption.locator(
   'xpath=following-sibling::button[contains(@class,"account-copy-pencil")][1]');
  assert.equal(await bookEdit.count(),1,'One compact pencil, not duplicate editors');
  await bookEdit.click();
  const bookInput=page.locator('#stageBookPanel .account-copy-edit-host [contenteditable]').first();
  await bookInput.waitFor({state:'visible'});
  const longBookCopy='Настройки персонажа обновляют итоговые характеристики в других разделах Книги героя. Текст тестовой правки сохраняется полностью.';
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
  await page.locator('#stageBookPanel p.stage-attribute-note').first().waitFor({state:'visible'});
  assert.match(await page.locator('#stageBookPanel p.stage-attribute-note').first().innerText(),
   /Settings apply to this build immediately/);
  await page.locator('#locale [data-locale="ru"]').click();
  assert.equal(await page.locator('#stageBookPanel p.stage-attribute-note').first().innerText(),
   longBookCopy,'RU saved copy survives EN->RU and does not change the hero');
  assert.deepEqual(errors,[]);
  console.log('Chromium Book editorial passed: long RU D1 copy, EN fallback, no duplicate pencil');
  const other=await context.newPage();
  await other.goto(base+'/',{waitUntil:'domcontentloaded'});
  for(let i=0;i<5;i++)await other.locator('.brand').click();
  await other.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await other.close();
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
    editorTop:editor.getBoundingClientRect().top,
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
  assert.ok(stable.every(x=>Math.abs(x.editorTop-stable[0].editorTop)<=1),
   'The expanded mastery track must NOT jump vertically: '+JSON.stringify(stable));
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
