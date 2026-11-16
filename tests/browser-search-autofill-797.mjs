import assert from 'node:assert/strict';

export async function runGlobalSearchAutofill797Smoke(browser,base){
 // A Chromium engine with the exact Yandex UA marker checks the project's
 // conditional guard. Browser-owned YaBrowser credential UI itself cannot be
 // simulated or certified through Chromium.
 const context=await browser.newContext({
  viewport:{width:950,height:750},
  userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 YaBrowser/26.11.0.0 Safari/537.36'
 });
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  const staticSearch=page.locator('#pathSkillSearch');
  assert.equal(await staticSearch.getAttribute('data-ps-noncredential-search'),'true');
  assert.equal(await staticSearch.getAttribute('autocomplete'),'none');
  assert.equal(await staticSearch.evaluate(input=>input.readOnly),true);
  const idle=await staticSearch.evaluate(input=>{
   let called=0;input.addEventListener('input',()=>called++);
   input.value='administrator';
   input.dispatchEvent(new InputEvent('input',{
    bubbles:true,inputType:'insertReplacementText'
   }));
   return {value:input.value,called,locked:input.readOnly};
  });
  assert.deepEqual(idle,{value:'',called:0,locked:true},
   'Unexpected login fill must be discarded while native search is idle');
  await page.locator('#pathSkillsTab').click();
  await staticSearch.click();
  assert.equal(await staticSearch.evaluate(input=>input.readOnly),false);
  await staticSearch.fill('Секущий');
  assert.equal(await staticSearch.inputValue(),'Секущий');
  await staticSearch.press('Tab');
  assert.equal(await staticSearch.evaluate(input=>input.readOnly),true);

  // Hero Book no longer has a target search. Its removal must not
  // weaken common credential-autofill protections for the remaining searches.
  await page.evaluate(async()=>{
   const [skills,classes,english]=await Promise.all([
    'data/os/skills.json','data/os/classes.json','data/os/strings.en.json'
   ].map(async path=>{
    const response=await fetch(path);
    if(!response.ok)throw Error('Cannot open '+path);
    return response.json();
   }));
   const host=document.createElement('div');
   host.id='global-search-797-book';
   host.setAttribute('style','position:relative;width:440px;height:700px;overflow:auto');
   document.body.append(host);
   window.PandoraStageAttributes.render(host,{
    page:'effects',
    modifiers:{mp:220,stats:{dex:70,int:20},
     combat:{spellDamageEquipmentRate:0,priestSong:{}},
     priestApplied:{},healingSpells:{rows:[]},
     periodicRecovery:{rows:[]}},
    gameTerms:{skills,englishSkills:english.skills,
     classes,englishClasses:english.classes},
    heroJobKey:'DISTURBANCE',heroLevel:45,
    heroMasteries:{trap:41},heroBranchCaps:classes.DISTURBANCE.branchCaps
   });
  });
  assert.equal(await page.locator('#global-search-797-book .stage-book-page').count(),1);
  assert.equal(await page.locator('#global-search-797-book .stage-book-target-search').count(),0);
  assert.equal(await page.locator('#global-search-797-book [data-book-setting="damageTarget"]').count(),0);

  // Any future search created by a different module is also guarded by the
  // observer, without reimplementing or invoking a legacy input factory.
  const observed=await page.evaluate(async()=>{
   const field=document.createElement('input');
   field.type='search';field.placeholder='Найти предмет…';
   document.body.append(field);
   await new Promise(resolve=>setTimeout(resolve,0));
   const secured={
    protected:field.getAttribute('data-ps-noncredential-search')==='true',
    readonly:field.readOnly,
    autocomplete:field.getAttribute('autocomplete'),
    name:field.getAttribute('name')
   };
   field.remove();return secured;
  });
  assert.deepEqual(observed,{
   protected:true,readonly:true,autocomplete:'none',name:observed.name
  },'Newly added native search must receive shared guard');
  assert.match(observed.name,/^ps-filter-/);
  const untouched=await page.evaluate(()=>{
   const auth=document.createElement('input');auth.type='password';
   auth.autocomplete='current-password';
   window.PandoraSearchField.prepare(auth);
   return {autocomplete:auth.autocomplete,locked:auth.readOnly,
    guarded:auth.hasAttribute('data-ps-noncredential-search')};
  });
  assert.deepEqual(untouched,{autocomplete:'current-password',locked:false,guarded:false});
  assert.deepEqual(errors,[]);
  console.log('Chromium autofill 797: YaBrowser marker, Book without retired target, native search, manual editing, auth isolation');
 }finally{await context.close()}
}
