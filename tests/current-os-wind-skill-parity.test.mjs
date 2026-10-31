import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const preview=(jobKey,selected={},skillCatalog=skills,level=45)=>
 C.combatPreview({stats,level,jobKey,combatBuffs:selected,skillCatalog});
test('OS exposes two verified Wind skills with exact classes and EP effects',()=>{
 const ascetic=skills[260006001],archer=skills[320004001];
 assert.equal(ascetic.name,'Помощь ветра');
 assert.equal(ascetic.charLevel,28);
 assert.ok(ascetic.classes.ASCETIC);
 assert.ok(ascetic.classes.MONK);
 assert.ok(ascetic.classes.EXORCIST);
 assert.equal(archer.name,'Благословение ветра');
 assert.equal(archer.charLevel,28);
 assert.ok(archer.classes.ARCHER);
 assert.deepEqual(C.supportSkillSource(skills,'windAssist').values,
  {EP_AVOIDANCE_CONST:15,EP_AVOIDANCE_SCALE:15});
 assert.deepEqual(C.supportSkillSource(skills,'windBlessing').values,
  {EP_MOVESPEED_SCALE:40});
});
test('Remaked Wind Assist floor(15+15% base Dodge) stacks once for Ascetic',()=>{
 const before=preview('ASCETIC'),active=preview('ASCETIC',{combatWindAssist:true});
 assert.equal(before.dodge.base,140);
 assert.equal(active.supportSkills.windAssist,true);
 assert.equal(active.dodge.windAssist,36);
 assert.equal(active.dodge.known-before.dodge.known,36);
 assert.equal(active.attack.known,before.attack.known);
});
test('Wind Blessing gives Archer +40 movement and does not affect other classes',()=>{
 const before=preview('ARCHER'),active=preview('ARCHER',{combatWindBlessing:true});
 assert.equal(active.supportSkills.windBlessing,true);
 assert.equal(active.movementSpeed.active,40);
 assert.equal(active.movementSpeed.known-before.movementSpeed.known,40);
 assert.equal(preview('WIZARD',{combatWindBlessing:true}).supportSkills.windBlessing,false);
 assert.equal(preview('ARCHER',{combatWindBlessing:true},skills,27).movementSpeed.active,0);
});
test('missing source and corrupted EP cannot create unsupported wind buffs',()=>{
 const corrupt=JSON.parse(JSON.stringify(skills));
 corrupt[260006001].funcs[0].fv1[3]=null;
 const x=preview('ASCETIC',{combatWindAssist:true},corrupt);
 assert.equal(x.supportSkills.windAssist,false);
 assert.equal(x.dodge.windAssist,0);
 const empty=preview('ARCHER',{combatWindBlessing:true},{});
 assert.equal(empty.supportSkills.windBlessing,false);
 assert.equal(empty.movementSpeed.active,0);
});
test('book controls are built from both actual skill records and saved choices',()=>{
 const app=read('app.js'),book=read('stage-attributes.js');
 assert.match(app,/supportSkillAvailability\(/);
 assert.match(app,/combatWindAssist/);
 assert.match(app,/combatWindBlessing/);
 assert.match(app,/rawAttributes\[key\]===true/);
 assert.match(book,/\['combatWindAssist','Помощь ветра'\]/);
 assert.match(book,/\['combatWindBlessing','Благословение ветра'\]/);
 assert.match(book,/cm\.dodge\.windAssist/);
 assert.match(book,/cm\.movementSpeed\.active/);
});

test('Wind skill source fails closed for unseen prerequisites and non-learnable skills',()=>{
 const chosen={combatWindAssist:true},modified=JSON.parse(JSON.stringify(skills));
 modified[260006001].reqs=[{branch:'exorcism',amount:26}];
 assert.equal(preview('ASCETIC',chosen,modified).supportSkills.windAssist,false);
 const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
 const allowed=C.combatPreview({stats,level:45,jobKey:'ASCETIC',
  combatBuffs:chosen,skillCatalog:modified,branchMasteries:{exorcism:26}});
 assert.equal(allowed.supportSkills.windAssist,true);
 modified[260006001].prereq=42;
 assert.equal(C.combatPreview({stats,level:45,jobKey:'ASCETIC',combatBuffs:chosen,
  skillCatalog:modified,branchMasteries:{exorcism:99}}).supportSkills.windAssist,false);
 modified[260006001].prereq=null;
 modified[260006001].learnable=false;
 assert.equal(C.combatPreview({stats,level:45,jobKey:'ASCETIC',combatBuffs:chosen,
  skillCatalog:modified,branchMasteries:{exorcism:99}}).supportSkills.windAssist,false);
});
test('Wind effects reject non-finite or out-of-game numerical modifiers',()=>{
 const invalid=JSON.parse(JSON.stringify(skills));
 invalid[320004001].funcs[0].fv1[3]=50000;
 assert.equal(C.supportSkillSource(invalid,'windBlessing'),null);
 assert.equal(preview('ARCHER',{combatWindBlessing:true},invalid).movementSpeed.active,0);
});
