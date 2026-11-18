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
  const synthetic=await staticSearch.evaluate(input=>{
   input.dispatchEvent(new KeyboardEvent('keydown',{key:'a',bubbles:true}));
   input.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
   return input.readOnly;
  });
  assert.equal(synthetic,true,'Untrusted JS events must not unlock an idle search');
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
  // Numerics share the identical capture guard. A login-looking value
  // must never be delivered to stat listeners before a trusted gesture.
  const numericIdle=await page.evaluate(()=>{
   const input=document.createElement('input');
   input.type='number';input.value='21';input.id='numeric-guard-907';
   document.body.append(input);
   window.PandoraNumericField.prepare(input);
   let calls=0;input.addEventListener('input',()=>calls++);
   input.value='444';
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new KeyboardEvent('keydown',{key:'A',bubbles:true}));
   return {value:input.value,locked:input.readOnly,calls};
  });
  assert.deepEqual(numericIdle,{value:'21',locked:true,calls:0},
   'Synthetic numeric replacement cannot become Hero stats');
  const numeric=page.locator('#numeric-guard-907');
  await numeric.click();
  await numeric.fill('35');
  assert.equal(await numeric.inputValue(),'35','User can still edit the number');
  await numeric.press('Tab');
  assert.equal(await numeric.evaluate(el=>el.readOnly),true);
  const numericAfter=await numeric.evaluate(input=>{
   let calls=0;input.addEventListener('input',()=>calls++);
   input.value='909';
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new Event('change',{bubbles:true}));
   return {value:input.value,calls};
  });
  assert.deepEqual(numericAfter,{value:'35',calls:0},
   'An idle numeric field keeps the last authorized value after user edits');
  // The real + / - control deliberately updates the numeric value without
  // typing. That new authoritative value must survive future focus and blur.
  await numeric.evaluate(input=>{
   input.value='42';window.PandoraNonCredentialGuard.sync(input);
  });
  await numeric.click();
  assert.equal(await numeric.inputValue(),'42');
  await numeric.press('Tab');
  const afterStep=await numeric.evaluate(input=>{
   input.value='999';input.dispatchEvent(new Event('change',{bubbles:true}));
   return input.value;
  });
  assert.equal(afterStep,'42','Idle autofill cannot revert a legitimate stat increment');
  await numeric.evaluate(el=>el.remove());
  const ownedSearch=await page.evaluate(()=>{
   const input=document.createElement('input');
   input.type='search';input.value='before';document.body.append(input);
   window.PandoraSearchField.prepare(input);
   let seen=0;input.addEventListener('input',()=>seen++);
   window.PandoraNonCredentialGuard.emitInput(input,'from-app');
   const result={value:input.value,seen,locked:input.readOnly};
   input.remove();return result;
  });
  assert.deepEqual(ownedSearch,{value:'from-app',seen:1,locked:true});
  const untouched=await page.evaluate(()=>{
   const auth=document.createElement('input');auth.type='password';
   auth.autocomplete='current-password';
   window.PandoraSearchField.prepare(auth);
   return {autocomplete:auth.autocomplete,locked:auth.readOnly,
    guarded:auth.hasAttribute('data-ps-noncredential-search')};
  });
  assert.deepEqual(untouched,{autocomplete:'current-password',locked:false,guarded:false});
  assert.deepEqual(errors,[]);
  console.log('Chromium input safety 907: shared Yandex search/numeric protection, synthetic replacement, real typing, auth isolation');
 }finally{await context.close()}
}
