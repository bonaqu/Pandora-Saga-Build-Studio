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

  // The real Hero Book renderer uses a *different* element factory than the
  // app; this previously missed the common search policy (the screenshot).
  await page.evaluate(async()=>{
   const files=await Promise.all([
    'data/os/skills.json','data/os/classes.json','data/os/tables.json',
    'data/os/monsters.json','data/os/strings.en.json'
   ].map(async path=>{
    const response=await fetch(path);
    if(!response.ok)throw Error('Cannot open '+path);
    return response.json();
   }));
   const [skills,classes,tables,monsters,english]=files;
   const host=document.createElement('div');
   host.id='global-search-797-book';
   host.setAttribute('style','position:relative;width:440px;height:700px;overflow:auto');
   document.body.append(host);
   const choices=window.PandoraOSTargetDamage.availableMonsterTargets({
    monsters,englishMonsters:english.monsters});
   window.PandoraStageAttributes.render(host,{
    page:'effects',
    modifiers:{mp:220,stats:{dex:70,int:20},
     combat:{spellDamageEquipmentRate:0,priestSong:{}},
     priestApplied:{},healingSpells:{rows:[]},
     periodicRecovery:{rows:[]}},
    gameTerms:{skills,englishSkills:english.skills,
     classes,englishClasses:english.classes},
    heroJobKey:'DISTURBANCE',heroLevel:45,
    heroMasteries:{trap:41},heroBranchCaps:classes.DISTURBANCE.branchCaps,
    targetMonsterChoices:choices,targetMonsterId:22104
   });
  });
  const bookSearch=page.locator('#global-search-797-book .stage-book-target-search');
  await bookSearch.waitFor({state:'attached'});
  assert.equal(await bookSearch.getAttribute('data-ps-noncredential-search'),'true');
  assert.equal(await bookSearch.getAttribute('autocomplete'),'none');
  assert.match(await bookSearch.getAttribute('name'),/^ps-filter-/);
  assert.equal(await bookSearch.evaluate(input=>input.readOnly),true);
  const blocked=await bookSearch.evaluate(input=>{
   let observed=0;
   input.addEventListener('input',()=>observed++);
   input.value='administrator';
   input.dispatchEvent(new InputEvent('input',{
    bubbles:true,inputType:'insertReplacementText'
   }));
   return {value:input.value,observed};
  });
  assert.deepEqual(blocked,{value:'',observed:0},
   'The target search must not accept injected login text');
  await bookSearch.click();
  await bookSearch.fill('динго');
  const choice=page.locator('#global-search-797-book select[data-book-setting="damageTarget"]');
  assert.ok(await choice.locator('option').count()<40);
  assert.equal(await choice.inputValue(),'22104',
   'Filtering never changes the selected target automatically');
  await bookSearch.press('Tab');
  assert.equal(await bookSearch.evaluate(input=>input.readOnly),true);

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
  console.log('Chromium autofill 797: YaBrowser marker, Hero Book target, native search, manual editing, auth isolation');
 }finally{await context.close()}
}
