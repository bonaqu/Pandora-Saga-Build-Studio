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
   writes.push(post);
   values[post.key]=post.value;
   return json({ok:true,key:post.key,value:post.value});
  }
  if(url.endsWith('/api/admin/reset')){
   const post=route.request().postDataJSON();
   resets.push(post);
   const deleted=Object.hasOwn(values,post.key);
   delete values[post.key];
   return json({ok:true,key:post.key,deleted});
  }
  if(url.endsWith('/api/overrides'))return json({values});
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
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
  await page.locator('#ownerDock').waitFor({state:'visible'});
  const control=page.locator('.wiki-skill-type');
  await control.waitFor({state:'visible',timeout:20000});
  assert.equal(await control.inputValue(),'player');
  const disclosure=page.locator('.wiki-skill-edit-list');
  const toggle=page.locator('.wiki-skill-edit-toggle');
  const selectBox=await control.boundingBox(),editBox=await toggle.boundingBox();
  assert.ok(selectBox&&editBox&&selectBox.x+selectBox.width<=editBox.x+1,
   'Owner edit pencil must sit next to the compact select without overlap');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.equal(await disclosure.locator('[data-skill-filter-label]').count(),8,
   'Owner must be able to edit every filter without opening a native option');
  assert.equal(await disclosure.locator('[data-skill-filter-label="racial"]').count(),1);

  const target=disclosure.locator('[data-skill-filter-label="unknown"]');
  await target.locator('.wiki-skill-label-edit').click();
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
  await playerRow.locator('.wiki-skill-label-edit').click();
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
  assert.deepEqual(resets,[{key:'guideedit.wiki.labels'}]);
  assert.deepEqual(errors,[]);
  console.log('Chromium skill labels: reused Encyclopedia category UI, 7 editable labels, autosave, stable selection, mobile');
 }finally{await context.close()}
}
