import assert from 'node:assert/strict';

export async function runRemakedBuffParity669Smoke(browser,base){
 const context=await browser.newContext({viewport:{width:1100,height:860}});
 await context.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#startupOverlay').waitFor({state:'hidden',timeout:30000});
  const probe=await page.evaluate(async()=>{
   const names=['data/os/skills.json','data/os/meta.json','data/os/strings.en.json'];
   const [skills,meta,english]=await Promise.all(names.map(async name=>{
    const r=await fetch(name);if(!r.ok)throw Error('Missing '+name);
    return r.json();
   }));
   const buffs=window.PandoraRemakedBuffs,C=window.PandoraOSCalculator;
   if(!buffs||!C)throw Error('Missing buff and calculator source');
   const rows=buffs.choices({skills,englishSkills:english.skills,
    jobKey:'WARRIOR',level:45,weapon:{kind:'1H_AXE'},
    branchMasteries:{brush:20,defense:21},
    branchLabels:meta.branchLabels||{},englishBranches:english.branches||{}});
   const host=document.createElement('div');
   host.id='buff-parity-qa';host.style='width:790px;min-height:680px;';
   document.body.append(host);
   const terms={skills,englishSkills:english.skills,
    branchLabels:meta.branchLabels||{},englishBranches:english.branches||{}};
   window.__buffQARows=rows;window.__buffQATerms=terms;
   window.__buffQAUpdates=[];
   window.PandoraStageAttributes.render(host,{
    page:'buffs',remakedBuffRows:rows,modifiers:null,
    gameTerms:terms,buffs:{remakedSkillIds:[],priestEnabled:false},
    vitalsBuffs:{},honorTitles:C.honorTitles,
    skillIconForId:id=>'assets/skills/icons/skill_'+id+'.webp',
    availability:{combatWarCry:true,combatWindAssist:true,
     combatWindBlessing:true},
    onBuff:(key,value)=>window.__buffQAUpdates.push([key,value])
   });
   return {count:rows.length,extras:rows.filter(x=>!x.existing).length,
    mass:rows.find(x=>x.id===100055001)?.available,
    cold:rows.find(x=>x.id===142051001)?.reason,
    iron:rows.find(x=>x.id===168052001)?.available};
  });
  assert.equal(probe.count,36);
  assert.equal(probe.extras,21);
  assert.equal(probe.mass,true);
  assert.match(probe.cold,/21/);
  assert.equal(probe.iron,true);

  const party=page.locator('#buff-parity-qa .stage-book-buff-group')
   .filter({hasText:'Усиления от союзников'});
  const personal=page.locator('#buff-parity-qa .stage-book-buff-group')
   .filter({hasText:'Личные умения'});
  assert.equal(await party.count(),1);
  assert.equal(await personal.count(),1);
  assert.equal(await party.getAttribute('open'),null,
   'Party buffs start collapsed');
  assert.equal(await personal.getAttribute('open'),null,
   'Personal buffs start collapsed');
  await party.locator('summary').click();
  await personal.locator('summary').click();
  const groupBuff=party.locator('[data-book-setting="legacySkill:100055001"]');
  const blessing=party.locator('[data-book-setting="legacySkill:330004001"]');
  const coldBlood=personal.locator('[data-book-setting="legacySkill:142051001"]');
  const ironScale=personal.locator('[data-book-setting="legacySkill:168052001"]');
  assert.equal(await groupBuff.isEnabled(),true);
  assert.equal(await blessing.isEnabled(),true);
  assert.equal(await coldBlood.isDisabled(),true);
  assert.match(await coldBlood.locator('xpath=..').innerText(),/21/);
  assert.equal(await ironScale.isEnabled(),true);
  await groupBuff.check();
  assert.deepEqual(await page.evaluate(()=>window.__buffQAUpdates),
   [['legacySkill:100055001',true]]);

  await page.evaluate(()=>{
   document.documentElement.lang='en';
   const rows=window.__buffQARows,host=document.querySelector('#buff-parity-qa');
   window.PandoraStageAttributes.render(host,{
    page:'buffs',remakedBuffRows:rows,modifiers:null,
    gameTerms:window.__buffQATerms,buffs:{remakedSkillIds:[100055001],
     priestEnabled:false},vitalsBuffs:{},
    skillIconForId:id=>'assets/skills/icons/skill_'+id+'.webp',
    availability:{combatWarCry:true,combatWindAssist:true,combatWindBlessing:true}
   });
  });
  const ally=page.locator('#buff-parity-qa .stage-book-buff-group')
   .filter({hasText:'Ally buffs'});
  assert.equal(await ally.count(),1);
  assert.equal(await ally.locator('[data-book-setting="legacySkill:100055001"]').isChecked(),true);
  assert.equal(await ally.locator('[data-book-setting="legacySkill:330004001"]').isEnabled(),true);
  assert.deepEqual(errors,[]);
  console.log('Chromium 669: 36 verified Remaked buff slots, 21 additional choices, any party recipient, self 21-mastery gate and RU/EN');
 }finally{await context.close()}
}
