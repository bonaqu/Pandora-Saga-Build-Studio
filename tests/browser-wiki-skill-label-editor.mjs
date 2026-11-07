import assert from 'node:assert/strict';

export async function runWikiSkillLabelEditorSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1040,height:780}});
 const writes=[],errors=[];
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
   return json({ok:true,key:post.key,value:post.value});
  }
  if(url.endsWith('/api/overrides'))return json({values:{}});
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#nav [data-tab="wiki"]').click();
  await page.locator('[data-wiki-chapter="skill"]').click();
  await page.locator('.wiki-skill-type').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.wiki-skill-label-editor').count(),0,
   'Public readers must not see editing controls');

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
  const disclosure=page.locator('.wiki-skill-label-editor');
  await disclosure.locator('summary').click();
  assert.equal(await disclosure.locator('[data-skill-filter-label]').count(),7,
   'Owner must be able to edit every filter without opening a native option');

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

  await control.selectOption('unknown');
  assert.equal(await control.inputValue(),'unknown');
  await disclosure.locator('summary').click();
  await page.setViewportSize({width:390,height:780});
  const overflow=await page.evaluate(()=>Math.max(
   document.documentElement.scrollWidth,document.body.scrollWidth)-
   document.documentElement.clientWidth);
  assert.ok(overflow<=15,'Owner editing controls overflow mobile width: '+overflow);
  assert.deepEqual(errors,[]);
  console.log('Chromium skill label owner editing passed: 7 categories, autosave, stable selection, mobile');
 }finally{await context.close()}
}
