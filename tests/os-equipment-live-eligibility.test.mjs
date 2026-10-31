import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('rules.js'))(host);
Function('window',read('ui-planner.js'))(host);
Function('window',read('equipment-plan.js'))(host);
const items=JSON.parse(read('data/os/items.json'));
const eligible=(item,slot,job,level,race=1,gender=0)=>
 host.PandoraStudioRules.equipment(item,{slot,job,level}).allowed&&
 host.PandoraUIPlanner.raceCompatible(item,race,gender);
test('saved equipment still exists but its source restrictions control whether effects may apply',()=>{
 const sword=items[1],hat=items[11094];
 assert.equal(sword.level,40);assert.equal(hat.level,38);
 assert.equal(eligible(sword,'weapon','WARRIOR',39),false);
 assert.equal(eligible(sword,'weapon','WARRIOR',40),true);
 assert.equal(eligible(sword,'weapon','MAGE',55),false);
 assert.equal(eligible(sword,'head','WARRIOR',55),false);
 assert.equal(eligible(hat,'head','WARRIOR',37),false);
 assert.equal(eligible(hat,'head','WARRIOR',38),true);
 assert.equal(hat.effects.find(e=>e.func==='EP_MAXLIFE_CONST').a,50);
 const original=read('app.js');
 assert.match(original,/if\(!item\|\|equipmentIssue\(item,Number\(slot\)\)\.length\)continue/);
 assert.match(original,/const weapon=selectedWeapon&&!equipmentIssue\(selectedWeapon,0\)\.length\?selectedWeapon:null/);
 assert.match(original,/issue:equipmentIssue\(rec,Number\(slot\)\)/);
 assert.match(original,/issue\.length\?' unavailable':'/);
 assert.match(read('stage-attributes.js'),/Не действует: /);
});
test('Astir race/gender restrictions survive stale saved loadout without discarding items',()=>{
 const dress=items[12611];
 assert.ok(dress&&host.PandoraUIPlanner.isAstirDress(dress));
 assert.equal(host.PandoraUIPlanner.raceCompatible(dress,3,0),true);
 assert.equal(host.PandoraUIPlanner.raceCompatible(dress,1,1),false);
 assert.equal(host.PandoraUIPlanner.raceCompatible(dress,1,0),true);
});
test('hero book and calculator share every trained mastery and only eligible weapon/shield',()=>{
 const app=read('app.js');
 assert.equal(app.split('trainedBranchMasteries(').length>=3,true);
 assert.match(app,/const branchMasteries=trainedBranchMasteries\(innate\)/);
 assert.match(app,/skillCatalog:skillMap,jobKey:cls,level:state\.level,branchMasteries/);
 assert.match(app,/const equippedShield=shieldCandidate&&!equipmentIssue\(shieldCandidate,1\)\.length/);
 assert.match(app,/const equippedWeapon=weaponCandidate&&!equipmentIssue\(weaponCandidate,0\)\.length/);
});

test('authentic OS two-handed swords suppress shield while retaining future build selection',()=>{
 const sword=items[401],shield=items[17001],oneHand=items[1],future=items[422];
 assert.equal(sword.twoHanded,true);
 assert.equal(shield.slot,'shield');
 assert.equal(eligible(sword,'weapon','WARRIOR',4),true);
 assert.equal(eligible(shield,'shield','WARRIOR',4),true);
 assert.equal(host.PandoraEquipmentPlan.occupiesOffhand(sword,true),true);
 assert.equal(host.PandoraEquipmentPlan.occupiesOffhand(sword,false),false,
  'An unusable future weapon must not deactivate a usable shield');
 assert.equal(host.PandoraEquipmentPlan.occupiesOffhand(oneHand,true),false);
 assert.equal(host.PandoraEquipmentPlan.occupiesOffhand(shield,true),false);
 assert.equal(future.level,53);
 assert.equal(eligible(future,'weapon','WARRIOR',45),false);
 assert.equal(eligible(future,'weapon','WARRIOR',55),true,
  'Planning still reaches items above the current live server cap 45');
 const app=read('app.js');
 assert.match(app,/if\(slot===1&&item\.slot==='shield'\)/);
 assert.match(app,/PandoraEquipmentPlan\.occupiesOffhand\(weapon,Boolean\(usable\)\)/);
 assert.match(app,/Двуручное оружие занимает обе руки/);
 assert.match(app,/if\(!item\|\|equipmentIssue\(item,Number\(slot\)\)\.length\)continue/);
});
