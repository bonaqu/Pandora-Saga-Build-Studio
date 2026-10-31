import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',read('os-calculator.js'))(host);
const progress={};
Function('window',read('skill-progression.js'))(progress);
const calc=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const combat=(jobKey,selected,catalog=skills,branchMasteries={})=>calc.combatPreview({
 stats,level:55,jobKey,combatBuffs:selected,skillCatalog:catalog,branchMasteries
});
test('frontend passes every known green mastery branch instead of Slash only',()=>{
 const app=read('app.js');
 assert.match(app,/branchMasteries=Object\.fromEntries\(branches\.map\(\(\{id\}\)=>\[/);
 assert.match(app,/groupAdeptness\(state,\[id\],initialBranches\)/);
 const state={points:{slash:26,exorcism:30},masteryAuto:false,
  mastery:{slash:26,exorcism:28}};
 const innate={slash:0,exorcism:1};
 const branchMasteries=Object.fromEntries(['slash','exorcism'].map(id=>[
  id,progress.PandoraSkillProgression.groupAdeptness(state,[id],innate)
 ]));
 assert.deepEqual(branchMasteries,{slash:26,exorcism:29});
 const changed=structuredClone(skills);
 changed[260006001].reqs=[{branch:'exorcism',amount:29}];
 assert.equal(combat('ASCETIC',{combatWindAssist:true},changed,branchMasteries).supportSkills.windAssist,true);
 changed[260006001].reqs=[{branch:'exorcism',amount:30}];
 assert.equal(combat('ASCETIC',{combatWindAssist:true},changed,branchMasteries).supportSkills.windAssist,false,
  'Blue Potential does not satisfy green mastery requirement');
});
test('unlearnable and unresolved combat skill records cannot grant active bonuses',()=>{
 const selected={combatWarCry:true,combatRage:true};
 const baseline=combat('GLADIATOR',selected);
 assert.equal(baseline.activeSkills.warCry,true);
 assert.equal(baseline.activeSkills.raging,true);
 const changed=structuredClone(skills);
 changed[320001001].learnable=false;
 changed[100052001].prereq=100051001;
 const blocked=combat('GLADIATOR',selected,changed);
 assert.equal(blocked.activeSkills.warCry,false);
 assert.equal(blocked.activeSkills.raging,false);
 assert.equal(blocked.attack.activeBonus,0);
 assert.equal(calc.activeCombatSkills({selected,jobKey:'GLADIATOR',level:55,
  skillCatalog:changed}).warCry,false);
});
test('standalone support and combat entry points accept levels 1–55 only',()=>{
 assert.equal(calc.combatPreview({stats,level:56}),null);
 assert.equal(calc.combatPreview({stats,level:0}),null);
 assert.equal(calc.combatPreview({stats,level:5.5}),null);
 assert.ok(calc.combatPreview({stats,level:55}));
 assert.equal(calc.activeCombatSkills({selected:{combatWarCry:true},jobKey:'GLADIATOR',
  level:56}).warCry,false);
 assert.equal(calc.supportSkillAvailability({
  selected:{combatWindBlessing:true},jobKey:'ARCHER',level:56,skillCatalog:skills
 }).windBlessing,false);
});
