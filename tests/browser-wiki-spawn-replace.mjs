import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Real browser UI path, but with a private in-memory Cloudflare D1 stub.
// No live administrator credentials or production writes are ever sent.
export async function runWikiSpawnReplacementSmoke(browser,base){
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 const stored=new Map(),writes=[],errors=[],createAttempts=[],failedTypes=new Set();
 const source=JSON.parse(readFileSync(
  new URL('../data/os/maps.json',import.meta.url),'utf8'));
 const before=Object.entries(source)
  .filter(([,row])=>(row.mobs||[]).some(id=>String(id)==='13101'))
  .map(([id])=>id);
 assert.ok(before.includes('2001001'));
 assert.ok(!before.includes('2003301'));
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.route('**/*',route=>{
  const req=route.request(),url=req.url(),method=req.method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const path=new URL(url).pathname;
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS',
   'access-control-expose-headers':'X-PS-Catalog-Snapshot',
   'x-ps-catalog-snapshot':'wiki-spawn-snapshot'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const reply=(data,status=200)=>route.fulfill({
   status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(path.startsWith('/api/catalog/')&&path.endsWith('.json')){
   const key=path.split('/').pop().slice(0,-5),
    file=key==='stringsEn'?'strings.en':key;
   if(file==='legacyLocale')return reply({});
   return reply(JSON.parse(readFileSync(new URL(
    '../data/os/'+file+'.json',import.meta.url),'utf8')));
  }
  if(path==='/api/library')return reply({records:[]});
  if(path==='/api/overrides')return reply({values:Object.fromEntries(stored)});
  if(path==='/api/admin/login'&&method==='POST')
   return reply({token:'a'.repeat(43),expires:Date.now()+600000});
  if(path==='/api/admin/override'&&method==='POST'){
   assert.equal(req.headers().authorization,'Bearer '+'a'.repeat(43));
   const body=req.postDataJSON();
   assert.equal(body.expectedValue,stored.has(body.key)?stored.get(body.key):null,
    'A spawn replacement must not bypass Worker CAS');
   const family=body.key.startsWith('wikiedit.monster.owner-monster-')?'monster':
    body.key.startsWith('wikiedit.map.custom-')?'map':
    body.key.startsWith('wikiedit.npc.owner-npc-')?'npc':null;
   if(family){
    createAttempts.push({key:body.key,family});
    if(!failedTypes.has(family)){
     failedTypes.add(family);
     if(family==='monster'){
      // The CAS write succeeded in D1 but its Worker reply was lost.
      // A verified GET must complete this action without a second POST.
      writes.push(body);stored.set(body.key,body.value);
      return reply({error:'Worker reply lost after commit'},503);
     }
     if(family==='map'){
      // A malformed 200 acknowledgment is also ambiguous, not proof of
      // failure or success until the same D1 payload is read back.
      writes.push(body);stored.set(body.key,body.value);
      return reply({ok:true,key:body.key,value:'wrong receipt',conditional:false});
     }
     // Unwritten NPC must still fail closed, retaining its original ID
     // for a deliberate user retry.
     return reply({error:'Temporary creation failure'},503);
    }
   }
   writes.push(body);stored.set(body.key,body.value);
   return reply({ok:true,key:body.key,value:body.value.trim(),conditional:true});
  }
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // A fast mocked D1 may finish on first launch. Retry only if the public
  // startup dialog actually offers it, never click a hidden retry button.
  const retry=page.locator('#startupRetry');
  if(await retry.isVisible())await retry.click();
  await page.waitForFunction(()=>document.querySelector('#startupOverlay')?.hidden===true,
   null,{timeout:20000});
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  await page.locator('#ownerDock').waitFor({state:'visible'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="monster"]').click();
  const search=page.locator('.wiki-controls input[type="search"]');
  await search.click();await search.fill('Слизень');
  await page.locator('[data-wiki-record="13101"]').waitFor({state:'visible'});
  await page.locator('[data-wiki-record="13101"]').click();
  const relations=page.locator('.wiki-page .wiki-owner-relations')
   .filter({has:page.locator('h4').getByText('Локации',{exact:true})});
  await relations.locator('.wiki-owner-replace').first().waitFor({state:'visible'});
  const original=await relations.locator('.wiki-owner-replace').first()
   .getAttribute('aria-label');
  assert.match(original,/Северная дорога Ветров/);
  await relations.locator('.wiki-owner-replace').first().click();
  const picker=relations.locator('.wiki-owner-relation-picker');
  await picker.waitFor({state:'visible'});
  const lookup=picker.locator('.wiki-owner-search');
  // Reuse the actual pointer unlock for the anti-autofill-protected field.
  await lookup.click();
  await lookup.fill('холмы Туманные');
  const persisted=page.waitForResponse(response=>
   response.url()===api+'/api/admin/override'&&
   response.request().method()==='POST'&&
   response.request().postDataJSON()?.key==='spawnedit.13101',
   {timeout:20000});
  await picker.locator('select').selectOption('2003301');
  await persisted;
  // The picker already contains the target text, so wait for the REAL
  // refreshed chip list instead of matching text in a still-open dropdown.
  await page.waitForFunction(()=>{
   const relations=[...document.querySelectorAll('.wiki-owner-relations')];
   return relations.some(group=>group.querySelector('h4')?.textContent==='Локации'&&
    group.querySelector('.wiki-entity-flow')?.textContent.includes('Туманные холмы')&&
    !group.querySelector('.wiki-entity-flow')?.textContent.includes('Северная дорога Ветров'));
  },null,{timeout:20000});
  assert.equal(writes.length,1,'One pencil replacement must publish a single D1 override');
  assert.equal(writes[0].key,'spawnedit.13101');
  const links=JSON.parse(writes[0].value);
  assert.ok(links.some(x=>x.type==='map'&&x.id==='2003301'));
  assert.equal(links.some(x=>x.type==='map'&&x.id==='2001001'),false);
  for(const other of before.filter(id=>id!=='2001001'))
   assert.ok(links.some(x=>x.type==='map'&&x.id===other),
    'An unrelated original spawn was lost: '+other);
  // Test three genuinely distinct D1 outcomes through real Wiki forms:
  // committed-but-503, committed-but-invalid-ack, and rejected 503 + retry.
  await page.locator('[data-wiki-chapter="monster"]').click();
  await page.locator('.wiki-monster-create').click();
  const monsterForm=page.locator('.wiki-owner-monster-form');
  await monsterForm.locator('[role="textbox"][aria-label="Название монстра RU"]').fill('Тестовый монстр');
  await monsterForm.locator('[role="textbox"][aria-label="Название монстра EN"]').fill('Test monster');
  await monsterForm.locator('input[type="number"]').fill('27');
  // The owner edits a live caption while creation data is already typed.
  // D1 changes only the public copy, never the player's authored record.
  const monsterCaptions=monsterForm.locator('.studio-owner-interface-editor');
  await monsterCaptions.locator('summary').click();
  const saveCaption=monsterCaptions.locator('.studio-owner-interface-row:has([data-owner-copy-id="createMonsterSave"])');
  await saveCaption.locator('.studio-owner-interface-pencil').click();
  const monsterCopyInput=saveCaption.locator('[data-owner-text-field]');
  await monsterCopyInput.fill('Добавить монстра в энциклопедию');
  await monsterCopyInput.press('Tab');
  await monsterCopyInput.waitFor({state:'detached',timeout:15000});
  const monsterCaptionKey='guideedit.book.wiki.monster.text.create-monster-save';
  assert.deepEqual(JSON.parse(stored.get(monsterCaptionKey)),
   {ru:'Добавить монстра в энциклопедию'});
  assert.equal(await monsterForm.locator('[role="textbox"][aria-label="Название монстра RU"]').textContent(),
   'Тестовый монстр','Editing a caption must not erase an entered monster name');
  assert.equal(await monsterForm.locator('[role="textbox"][aria-label="Название монстра EN"]').textContent(),
   'Test monster');
  const monsterSave=monsterForm.getByRole('button',{name:'Добавить монстра в энциклопедию'});
  await monsterSave.click();
  await page.waitForFunction(()=>document.querySelector('.wiki-page')
    ?.textContent.includes('Тестовый монстр'),null,{timeout:18000});
  const monsterAttempts=createAttempts.filter(x=>x.family==='monster');
  assert.equal(monsterAttempts.length,1,
   'Readback-proved monster creation must not trigger another POST');

  await page.locator('[data-wiki-chapter="map"]').click();
  await page.locator('.wiki-map-create').click();
  const mapForm=page.locator('.wiki-map-create-form');
  await mapForm.locator('[role="textbox"][aria-label="Название локации на русском"]').fill('Тестовая локация');
  await mapForm.locator('[role="textbox"][aria-label="Название локации на английском"]').fill('Test location');
  const mapCaptions=mapForm.locator('.studio-owner-interface-editor');
  await mapCaptions.locator('summary').click();
  const mapPlaceholder=mapCaptions.locator('.studio-owner-interface-row:has([data-owner-copy-id="createMapNameRuPlaceholder"])');
  await mapPlaceholder.locator('.studio-owner-interface-pencil').click();
  const mapCopyInput=mapPlaceholder.locator('[data-owner-text-field]');
  await mapCopyInput.fill('Новое название местности · RU');
  await mapCopyInput.press('Tab');
  await mapCopyInput.waitFor({state:'detached',timeout:15000});
  const mapCaptionKey='guideedit.book.wiki.map.text.create-map-name-ru-placeholder';
  assert.deepEqual(JSON.parse(stored.get(mapCaptionKey)),
   {ru:'Новое название местности · RU'});
  const mapName=mapForm.locator('[role="textbox"][aria-label="Название локации на русском"]');
  assert.equal(await mapName.getAttribute('placeholder'),'Новое название местности · RU');
  assert.equal(await mapName.getAttribute('data-placeholder'),'Новое название местности · RU',
   'A contenteditable placeholder needs its visible data-placeholder updated');
  assert.equal(await mapName.textContent(),'Тестовая локация',
   'Editing a location hint must not overwrite its authored name');
  const mapSave=mapForm.getByRole('button',{name:'Создать',exact:true});
  await mapSave.click();
  await page.locator('.wiki-map-create-npc').waitFor({state:'visible',timeout:18000});
  const mapAttempts=createAttempts.filter(x=>x.family==='map');
  assert.equal(mapAttempts.length,1,
   'Malformed success ack may be resolved only by exact D1 readback');

  await page.locator('.wiki-map-create-npc').click();
  const npcForm=page.locator('.wiki-map-create-npc-form');
  await npcForm.locator('[role="textbox"]').nth(0).fill('Тестовый торговец');
  await npcForm.locator('[role="textbox"]').nth(1).fill('Test merchant');
  const npcSave=npcForm.getByRole('button',{name:'Сохранить NPC'});
  await npcSave.click();
  await npcForm.locator('.inline-owner-error').getByText('Temporary creation failure').waitFor();
  await npcSave.click();
  await page.waitForFunction(()=>document.querySelector('.wiki-page')
    ?.textContent.includes('Тестовый торговец'),null,{timeout:18000});
  const npcAttempts=createAttempts.filter(x=>x.family==='npc');
  assert.equal(npcAttempts.length,2);
  assert.equal(npcAttempts[0].key,npcAttempts[1].key);
  assert.deepEqual(createAttempts.map(x=>x.family),['monster','map','npc','npc']);
  assert.equal(new Set(createAttempts.map(x=>x.key)).size,3,
   'Three creates must recover as three stable records, not duplicate orphans');
  assert.equal(writes.filter(x=>x.key.startsWith('wikiedit.')).length,3,
   'Readback confirmations and retried rejected NPC must leave exactly three D1 records');
  // Real EN edition shares each semantic key with RU and leaves NPC/location
  // source data untouched. Close the modal workbench before using the
  // global locale selector; it must never allow click-through.
  await page.locator('#dockClose').click();
  await page.locator('#detailPanel').waitFor({state:'hidden',timeout:10000});
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('#detailPanel.is-open').waitFor({state:'visible',timeout:10000});
  await page.locator('[data-wiki-chapter="map"]').click();
  await page.locator('.wiki-map-create').click();
  const englishForm=page.locator('.wiki-map-create-form');
  const englishPanels=englishForm.locator('.studio-owner-interface-editor');
  await englishPanels.locator('summary').click();
  const englishRow=englishPanels.locator('.studio-owner-interface-row:has([data-owner-copy-id="createMapNameRuPlaceholder"])');
  await englishRow.locator('.studio-owner-interface-pencil').click();
  const enCopy=englishRow.locator('[data-owner-text-field]');
  await enCopy.fill('Name for a new place · RU');
  await enCopy.press('Tab');
  await enCopy.waitFor({state:'detached',timeout:15000});
  assert.deepEqual(JSON.parse(stored.get(mapCaptionKey)),{
   ru:'Новое название местности · RU',en:'Name for a new place · RU'});
  assert.equal(await englishForm.locator('[role="textbox"][aria-label="Location name in Russian"]')
   .getAttribute('data-placeholder'),'Name for a new place · RU');
  assert.deepEqual(errors,[]);
  console.log('Chromium Wiki: spawn CAS, committed 503, bad 200 receipt, rejected 503 retry; 3 records, no duplicates');
 }finally{await context.close()}
}
