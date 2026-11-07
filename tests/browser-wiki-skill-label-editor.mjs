import assert from 'node:assert/strict';

export async function runWikiSkillLabelEditorSmoke(browser,base){
 const context=await browser.newContext({viewport:{width:1040,height:780}});
 const writes=[],errors=[];
 await context.route('**/*',route=>{
  const url=route.request().url();
  if(url.endsWith('/api/admin/override')){
   const post=route.request().postDataJSON();
   writes.push(post);
   return route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({ok:true})});
  }
  return url.startsWith(base+'/')?route.continue():route.abort();
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

  // Set only this isolated browser's test session to owner mode. All external
  // network writes are captured by the route above; production D1 is untouched.
  await page.evaluate(()=>{
   adminToken='fake-local-test-token';
   adminEditing=true;
   renderDetails();
  });
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
