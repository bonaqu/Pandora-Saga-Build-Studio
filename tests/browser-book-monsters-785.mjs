import assert from 'node:assert/strict';

// The target calculator stays independently source-tested, but a monster
// picker or guessed hit result must no longer appear anywhere in the Book.
export async function runHeroBookMonsterPicker785Smoke(browser,base){
 const context=await browser.newContext({viewport:{width:900,height:700}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  const source=await page.evaluate(async()=>{
   const [skills,classes,tables,monsters,english]=await Promise.all([
    'data/os/skills.json','data/os/classes.json','data/os/tables.json',
    'data/os/monsters.json','data/os/strings.en.json'
   ].map(async path=>{
    const response=await fetch(path);
    if(!response.ok)throw Error('Missing current OS data '+path);
    return response.json();
   }));
   window.__retiredMonsterBookSource={skills,classes,tables,monsters,english};
   const host=document.createElement('div');
   host.id='monster-785-qa';host.style.width='350px';
   host.style.height='640px';host.style.overflow='auto';
   document.body.append(host);
   const engine=window.PandoraOSTargetDamage;
   const common={
    skillCatalog:skills,classes,jobKey:'DISTURBANCE',level:45,
    masteries:{trap:41},branchCaps:classes.DISTURBANCE.branchCaps,
    stats:{dex:70,int:20},equipment:[],itemForth:{},unison:{},tables,
    monsters,englishMonsters:english.monsters,
    targetMonsterId:22104,
    modifiers:{combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}}
   };
   const original=engine.crawlingTrap(common);
   const changed=engine.crawlingTrap({...common,targetMonsterId:11104});
   const available=engine.availableMonsterTargets({
    monsters,englishMonsters:english.monsters});
   const render=(lang)=>{
    document.documentElement.lang=lang;
    const mods={mp:220,stats:{dex:70,int:20},combat:{
     spellDamageEquipmentRate:0,priestSong:{}},
     priestApplied:{},healingSpells:{rows:[]},periodicRecovery:{rows:[]}};
    // Old callers may still supply removed presentation-only props; they
    // must not revive target results or spawn an additional Book section.
    window.PandoraStageAttributes.render(host,{page:'effects',modifiers:mods,
     gameTerms:{skills,englishSkills:english.skills,
      branchLabels:{trap:'Ловушки'},englishBranches:{trap:'Trapping'},
      classes,englishClasses:english.classes},
     heroJobKey:'DISTURBANCE',heroLevel:45,
     heroMasteries:{trap:41},heroBranchCaps:classes.DISTURBANCE.branchCaps,
     targetMonsterChoices:available,targetMonsterId:22104,
     targetSkillDamages:[original,changed]});
   };
   window.__retiredMonsterBookRender=render;
   render('ru');
   return {count:available.length,ogre:[original.min,original.average,original.max],
    dingo:[changed.min,changed.average,changed.max]};
  });
  assert.equal(source.count,707);
  assert.deepEqual(source.ogre,[34,148,194]);
  assert.notDeepEqual(source.dingo,source.ogre,
   'Standalone source model still respects selected game monster');
  const book=page.locator('#monster-785-qa');
  assert.equal(await book.locator('.stage-book-page').count(),1);
  for(const selector of ['.stage-book-damage-target','.stage-book-target-search',
   '.stage-target-damage-row','[data-book-setting="damageTarget"]'])
   assert.equal(await book.locator(selector).count(),0,
    'Retired monster-target UI must never reappear: '+selector);
  assert.doesNotMatch(await book.innerText(),/Гигантский огр|Рыжий динго|Средний удар по цели/);
  await page.evaluate(()=>window.__retiredMonsterBookRender('en'));
  assert.equal(await book.locator('.stage-book-page').count(),1);
  assert.equal(await book.locator('.stage-target-damage-row').count(),0);
  assert.doesNotMatch(await book.innerText(),/Ogre Bouncer|Dingo|Average hit against/);
  assert.deepEqual(errors,[]);
  console.log('Chromium Hero Book 785: 707 standalone source targets, no Book target picker in RU/EN');
 }finally{await context.close()}
}
