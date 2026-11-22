import assert from 'node:assert/strict';

export async function runWikiSkillLabelEditorSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1040,height:780}});
 const writes=[],resets=[],values={},errors=[];
 const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
 await context.route('**/*',route=>{
  const url=route.request().url(),method=route.request().method();
  if(url.startsWith(base+'/'))return route.continue();
  if(!url.startsWith(api+'/'))return route.abort();
  const headers={'access-control-allow-origin':'*',
   'access-control-allow-headers':'Content-Type,Authorization',
   'access-control-allow-methods':'GET,POST,OPTIONS'};
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  const json=value=>route.fulfill({status:200,headers,
   contentType:'application/json',body:JSON.stringify(value)});
  if(url.endsWith('/api/admin/login')){
   assert.equal(route.request().postDataJSON().password,'Correct admin password!');
   return json({token:'a'.repeat(43),expires:Date.now()+600000});
  }
  if(url.endsWith('/api/admin/override')){
   assert.equal(route.request().headers().authorization,'Bearer '+'a'.repeat(43));
   const post=route.request().postDataJSON();
   assert.equal(post.expectedValue,Object.hasOwn(values,post.key)?values[post.key]:null,
    'Every owner field save must use the current D1 value as a precondition');
   writes.push(post);
   values[post.key]=post.value;
   return json({ok:true,key:post.key,value:post.value,conditional:true});
  }
  if(url.endsWith('/api/admin/reset')){
   const post=route.request().postDataJSON();
   assert.equal(post.expectedValue,Object.hasOwn(values,post.key)?values[post.key]:null,
    'Undo must not delete another browser’s newer owner edit');
   resets.push(post);
   const deleted=Object.hasOwn(values,post.key);
   delete values[post.key];
   return json({ok:true,key:post.key,deleted,conditional:true});
  }
  if(url.endsWith('/api/overrides'))return json({values});
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  // Wait until the mandatory D1 modal actually releases native inert.
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="skill"]').click();
  await page.locator('.wiki-skill-type').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-skill-edit-toggle,.wiki-skill-edit-list').count(),0,
   'Public readers must not see editable category controls');

  // Exercise the actual password-protected owner path in an isolated
  // network-stubbed browser. No test backdoor is added to production code.
  await page.keyboard.press('Control+Alt+Shift+P');
  await page.getByRole('dialog',{name:'Служебный вход'}).waitFor({state:'visible'});
  await page.locator('input[placeholder="Пароль администратора"]')
   .fill('Correct admin password!');
  await page.locator('.modal').getByRole('button',{name:'Войти',exact:true}).click();
  try{await page.locator('#ownerDock').waitFor({state:'visible',timeout:10000})}
  catch(error){
   const feedback=await page.locator('.modal .error').allTextContents().catch(()=>[]);
   throw new Error('Admin dock unavailable: '+JSON.stringify({feedback,pageErrors:errors})+
    '; '+error.message);
  }
  const control=page.locator('.wiki-skill-type');
  await control.waitFor({state:'visible',timeout:20000});
  assert.equal(await control.inputValue(),'player');
  const disclosure=page.locator('.wiki-skill-edit-list');
  const toggle=page.locator('.wiki-skill-edit-toggle');
  const selectBox=await control.boundingBox(),editBox=await toggle.boundingBox();
  assert.ok(selectBox&&editBox&&selectBox.x+selectBox.width<=editBox.x+1,
   'Owner category-label disclosure must sit beside the select without overlap');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.equal(await disclosure.locator('[data-skill-filter-label]').count(),8,
   'Owner must be able to edit every filter without opening a native option');
  assert.equal(await disclosure.locator('[data-skill-filter-label="racial"]').count(),1);
  assert.equal(await disclosure.locator('button').count(),0,
   'The text list must not recreate a pencil for every editable label');

  const target=disclosure.locator('[data-skill-filter-label="unknown"]');
  await target.locator('.wiki-skill-label-caption').dblclick();
  const editable=target.locator('[contenteditable]');
  await editable.waitFor({state:'visible'});
  await editable.fill('Дополнительные навыки');
  await editable.press('Enter');
  await page.waitForFunction(()=>{
   const option=document.querySelector('.wiki-skill-type option[value="unknown"]');
   return option?.textContent.startsWith('Дополнительные навыки');
  },null,{timeout:10000});
  assert.equal(await control.inputValue(),'player',
   'Editing a label must not silently change the selected category');
  assert.equal(writes.length,1);
  assert.equal(writes[0].key,'guideedit.wiki.labels');
  assert.equal(JSON.parse(writes[0].value).skill_filter_unknown_ru,
   'Дополнительные навыки');

  const playerRow=disclosure.locator('[data-skill-filter-label="player"]');
  await playerRow.locator('.wiki-skill-label-caption').dblclick();
  const playerField=playerRow.locator('[contenteditable]');
  await playerField.waitFor({state:'visible'});
  await playerField.fill('Умения героев');
  await playerField.press('Enter');
  await page.waitForFunction(()=>
   document.querySelector('.wiki-skill-type option[value="player"]')
    ?.textContent.startsWith('Умения героев'),null,{timeout:10000});
  assert.equal(writes.length,2);
  assert.deepEqual(JSON.parse(writes[1].value),{
   skill_filter_unknown_ru:'Дополнительные навыки',
   skill_filter_player_ru:'Умения героев'
  },'Subsequent inline saves must merge the previous changes');

  // The standalone caption is keyboard-editable without an extra pencil.
  const racialCaption=disclosure.locator(
   '[data-skill-filter-label="racial"] .wiki-skill-label-caption');
  await racialCaption.focus();
  await racialCaption.press('F2');
  const racialDraft=disclosure.locator(
   '[data-skill-filter-label="racial"] [contenteditable]');
  await racialDraft.waitFor({state:'visible',timeout:6000});
  await racialDraft.press('Escape');
  assert.equal(writes.length,2,'Escape from F2 must not write D1');
  assert.equal(await racialCaption.textContent(),'Расовая пассивка');

  // Touch uses the same direct editor; cancel leaves category/selection intact.
  const guildCaption=disclosure.locator(
   '[data-skill-filter-label="guild"] .wiki-skill-label-caption');
  await guildCaption.dispatchEvent('pointerdown',{
   pointerType:'touch',isPrimary:true,button:0,pointerId:283,
   clientX:22,clientY:22
  });
  await page.waitForTimeout(570);
  const guildDraft=disclosure.locator(
   '[data-skill-filter-label="guild"] [contenteditable]');
  await guildDraft.waitFor({state:'visible',timeout:6000});
  await guildDraft.press('Escape');
  await guildCaption.dispatchEvent('pointerup',{
   pointerType:'touch',isPrimary:true,pointerId:283
  });
  assert.equal(writes.length,2,'Touch Escape must not write D1');
  assert.equal(await control.inputValue(),'player');

  await control.selectOption('unknown');
  assert.equal(await control.inputValue(),'unknown');
  assert.equal(await disclosure.isVisible(),false,
   'Changing a category should close the inline editor without leaving an overlay');
  await page.setViewportSize({width:390,height:780});
  const overflow=await page.evaluate(()=>Math.max(
   document.documentElement.scrollWidth,document.body.scrollWidth)-
   document.documentElement.clientWidth);
  assert.ok(overflow<=15,'Owner editing controls overflow mobile width: '+overflow);

  // The first edit creates guideedit.wiki.labels, so Undo must eventually
  // DELETE it rather than leaving a stale row in D1. The immediately
  // preceding edit must restore the previous JSON without losing RU labels.
  const dock=page.locator('#ownerDock');
  if(await dock.locator('[data-owner-collapse]').getAttribute('aria-expanded')==='false')
   await dock.locator('[data-owner-collapse]').click();
  const undo=dock.locator('[data-owner-undo]');
  await undo.click();
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-skill-type option[value="player"]')?.textContent
   .startsWith('Умения персонажа'),null,{timeout:10000});
  assert.deepEqual(JSON.parse(values['guideedit.wiki.labels']),{
   skill_filter_unknown_ru:'Дополнительные навыки'
  });
  await undo.click();
  await page.waitForFunction(()=>document.querySelector(
   '.wiki-skill-type option[value="unknown"]')?.textContent
   .startsWith('Неуточнённые'),null,{timeout:10000});
  assert.equal(Object.hasOwn(values,'guideedit.wiki.labels'),false,
   'Undo of the first owner label change must delete the new override');
  assert.deepEqual(resets,[{key:'guideedit.wiki.labels',
   expectedValue:JSON.stringify({skill_filter_unknown_ru:'Дополнительные навыки'})}]);

  // The preceding mobile-width Undo deliberately expands the fixed owner
  // drawer. Restore an ordinary desktop viewport and collapse the drawer
  // before clicking the REAL locale switch: no forced pointer bypass.
  // Mobile scrolling and overflow have already been asserted above.
  await page.setViewportSize({width:1040,height:780});
  if(await dock.locator('[data-owner-collapse]').getAttribute('aria-expanded')==='true')
   await dock.locator('[data-owner-collapse]').click();
  // Reopen in English: a saved EN caption must use its own D1 field,
  // leaving the original RU label and the selected skill filter untouched.
  await page.locator('#locale [data-locale="en"]').click();
  await page.waitForFunction(()=>
   document.querySelector('.wiki-skill-type option[value="unknown"]')
    ?.textContent.startsWith('Unresolved'),null,{timeout:12000});
  const enFilter=page.locator('.wiki-skill-type');
  assert.equal(await enFilter.inputValue(),'unknown');
  const enToggle=page.locator('.wiki-skill-edit-toggle');
  await enToggle.click();
  const enTarget=page.locator(
   '.wiki-skill-edit-list [data-skill-filter-label="unknown"]');
  const enCaption=enTarget.locator('.wiki-skill-label-caption');
  await enCaption.focus();
  await enCaption.press('F2');
  const enDraft=enTarget.locator('[contenteditable]');
  await enDraft.waitFor({state:'visible',timeout:6000});
  await enDraft.fill('Needs icon review');
  await enDraft.press('Enter');
  await page.waitForFunction(()=>
   document.querySelector('.wiki-skill-type option[value="unknown"]')
    ?.textContent.startsWith('Needs icon review'),null,{timeout:10000});
  assert.equal(writes.length,3);
  assert.deepEqual(JSON.parse(values['guideedit.wiki.labels']),{
   skill_filter_unknown_en:'Needs icon review'
  },'English save must not write a stale Russian field');
  assert.equal(await enFilter.inputValue(),'unknown');
  await undo.click();
  await page.waitForFunction(()=>
   document.querySelector('.wiki-skill-type option[value="unknown"]')
    ?.textContent.startsWith('Unresolved'),null,{timeout:10000});
  assert.equal(Object.hasOwn(values,'guideedit.wiki.labels'),false);
  assert.equal(resets.length,2);
  assert.deepEqual(errors,[]);
  console.log('Chromium skill labels: RU/EN CAS and Undo, F2/Escape, long-press, no pencils, mobile');
 }finally{await context.close()}
}
