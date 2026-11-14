import assert from 'node:assert/strict';

export async function runHeroBookMonsterPicker785Smoke(browser,base){
 const context=await browser.newContext({viewport:{width:900,height:700}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  await page.evaluate(async()=>{
   const files=await Promise.all([
    'data/os/skills.json','data/os/classes.json','data/os/tables.json',
    'data/os/monsters.json','data/os/strings.en.json'
   ].map(async path=>{
    const response=await fetch(path);
    if(!response.ok)throw Error('Missing OS data '+path);
    return response.json();
   }));
   const [skills,classes,tables,monsters,english]=files;
   const host=document.createElement('div');
   host.id='monster-785-qa';
   host.setAttribute('style','width:350px;height:640px;overflow:auto');
   document.body.append(host);
   const C=window.PandoraOSTargetDamage,B=window.PandoraStageAttributes;
   const available=C.availableMonsterTargets({
    monsters,englishMonsters:english.monsters});
   const stats={dex:70,int:20};
   const modifiers={mp:220,stats,combat:{spellDamageEquipmentRate:0,
    priestSong:{}},priestApplied:{},healingSpells:{rows:[]},
    periodicRecovery:{rows:[]}};
   let selected=22104;
   const draw=()=>{
    const results=C.supportedSkillHits({
     skillCatalog:skills,classes,jobKey:'DISTURBANCE',level:45,
     masteries:{trap:41},branchCaps:classes.DISTURBANCE.branchCaps,
     stats,equipment:[],itemForth:{},unison:{},tables,
     monsters,englishMonsters:english.monsters,
     targetMonsterId:selected,modifiers
    });
    B.render(host,{page:'effects',modifiers,
     gameTerms:{skills,englishSkills:english.skills,
      branchLabels:{trap:'Ловушки'},englishBranches:{trap:'Trapping'},
      classes,englishClasses:english.classes},
     heroJobKey:'DISTURBANCE',heroLevel:45,
     heroMasteries:{trap:41},
     heroBranchCaps:classes.DISTURBANCE.branchCaps,
     targetMonsterChoices:available,targetMonsterId:selected,
     targetSkillDamages:results,
     onTargetMonster:id=>{selected=id;draw();}
    });
   };
   window.__monster785={draw,selected:()=>selected,
    force:id=>{selected=id;draw();}};
   document.documentElement.lang='ru';
   draw();
  });
  const select=page.locator('#monster-785-qa .stage-book-damage-target select');
  assert.equal(await select.count(),1);
  assert.equal(await select.locator('option').count(),702);
  assert.equal(await select.inputValue(),'22104');
  assert.match(await page.locator('#monster-785-qa .stage-target-damage-row strong').first().textContent(),
   /Гигантский огр.*34–194 ОЗ/);
  await select.selectOption('11104');
  assert.equal(await page.evaluate(()=>window.__monster785.selected()),11104);
  assert.equal(await select.inputValue(),'11104');
  const russian=await page.locator('#monster-785-qa .stage-target-damage-row strong').first().textContent();
  assert.match(russian,/Рыжий динго/);
  assert.doesNotMatch(russian,/Гигантский огр/);
  await page.evaluate(()=>{document.documentElement.lang='en';window.__monster785.draw();});
  assert.equal(await select.inputValue(),'11104');
  assert.match(await page.locator('#monster-785-qa .stage-book-damage-target').textContent(),
   /Damage target/);
  const english=await page.locator('#monster-785-qa .stage-target-damage-row strong').first().textContent();
  assert.match(english,/HP/);
  assert.doesNotMatch(english,/Ogre Bouncer/);
  assert.equal(await page.locator('#monster-785-qa .stage-target-damage-row').count(),2,
   'The current Traps mastery learns two distinct attacks, not duplicate results');
  const allHits=await page.locator('#monster-785-qa .stage-target-damage-row strong').allTextContents();
  const selectedName=(await select.locator('option:checked').textContent()).split(' · ')[0];
  assert.ok(allHits.every(row=>row.includes(selectedName)),
   'Switching target must refresh every available strike');
  await select.selectOption('22104');
  assert.equal(await select.inputValue(),'22104');
  assert.match(await page.locator('#monster-785-qa .stage-target-damage-row strong').first().textContent(),
   /Ogre Bouncer.*34–194 HP/);
  assert.equal(await page.locator('#monster-785-qa .stage-book-damage-target').count(),1);
  assert.equal(await page.locator('#monster-785-qa .stage-book-damage-target select[aria-label]').count(),1);
  await page.evaluate(()=>window.__monster785.force(99999999));
  assert.equal(await select.inputValue(),'',
   'A disappeared monster must not silently switch to Ogre');
  assert.match(await select.locator('option:checked').textContent(),/Choose a monster/);
  assert.equal(await page.locator('#monster-785-qa .stage-target-damage-row').count(),0);
  await select.selectOption('22104');
  assert.equal(await select.inputValue(),'22104');
  assert.equal(await page.locator('#monster-785-qa .stage-target-damage-row').count(),2);
  assert.deepEqual(errors,[]);
  console.log('Chromium Hero Book 785: 702 verified monsters, RU/EN, target change, no stale Ogre');
 }finally{await context.close()}
}
