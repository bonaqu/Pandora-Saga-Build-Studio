import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const W={};Function('window',read('pandora-studio-book-skill-thresholds.js'))(W);
const gates=W.PandoraBookSkillThresholds;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const path=read('pandora-studio-hero-path.js');
const app=read('pandora-studio-app.js'),book=read('pandora-studio-hero-book.js');
test('Current hero full MP / OS attack base cost computes affordable casts',()=>{
 const input={skillCatalog:skills,skillId:142002001,jobKey:'JUGGERNAUT',
  level:45,available:true,branchCaps:classes.JUGGERNAUT.branchCaps,
  branchMasteries:{brush:40}};
 const action=gates.sourceAction(input);
 assert.equal(action?.mana,19);
 assert.deepEqual(gates.baseManaBudget({maxMana:450,baseCost:action.mana}),
  {casts:23,remainder:13,maxMana:450,baseCost:19,baseOnly:true,
   usesCurrentMana:false});
 assert.equal(gates.sourceAction({...input,available:false}),null);
 assert.equal(gates.sourceAction({...input,branchMasteries:{brush:7}}),null);
 assert.equal(gates.baseManaBudget({maxMana:450,baseCost:0}),null);
});
test('Hero Path keeps class-gated OS lineage and bounded selected gallery',()=>{
 assert.equal(skills['110101002'].prereq,110101001);
 assert.equal(skills['110101001'].prereq,null);
 assert.equal(skills['110101002'].classes.JUGGERNAUT,1);
 assert.match(path,/const successors=api\.skillCatalog\.filter/);
 assert.match(path,/allowedForJob\(row,api\.job\)/);
 assert.match(path,/allowedForJob\(previous,api\.job\)/);
 assert.match(path,/api\.onNavigateSkill\(related\)/);
 assert.match(path,/aria-current/);
 assert.match(app,/onNavigateSkill:skill=>/);
 assert.match(app,/pathSkillFilter='all';pathSkillQuery=''/);
 assert.match(app,/pathSkillShown=24/);
});
test('Hero Book adds current full MP budget in existing single details',()=>{
 const begin=book.indexOf('for(const [groupName,captionRu,captionEn,sectionClass,rowClass]');
 const end=book.indexOf('// Effects from party skills are not abilities learned',begin);
 assert.ok(begin>0&&end>begin);
 const stage=book.slice(begin,end);
 assert.match(stage,/gates\?\.sourceAction/);
 assert.match(stage,/showBaseManaBudget\(more,action\)/);
 assert.match(stage,/stage-skill-more/);
 assert.match(book,/maxMana:modifiers\?\.mp/);
});
