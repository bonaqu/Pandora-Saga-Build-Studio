import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const sample=(slash,selected=true,source=skills)=>C.combatPreview({
 stats,jobKey:'WARRIOR',level:45,
 skillCatalog:source,branchMasteries:{slash},combatBuffs:{combatConcentration:selected}
});
test('current OS Concentration is Remaked +100 accuracy with 26 slash Adeptness',()=>{
 const source=skills[100054001];
 assert.equal(source.name,'Сосредоточенность');
 assert.deepEqual(source.reqs,[{branch:'slash',amount:26}]);
 assert.equal(source.funcs.find(e=>e.ep==='EP_TOHIT_CONST').fv1[3],100);
 assert.equal(C.combatSkillIds.concentration,100054001);
 assert.equal(C.combatSkillSource(skills,'concentration').effects.EP_TOHIT_CONST,100);
});
test('green mastered 25->26 switches +100 accuracy exactly once without changing other stats',()=>{
 const before=sample(25),after=sample(26);
 assert.equal(before.activeSkills.concentration,false);
 assert.equal(before.accuracy.activeBonus,0);
 assert.equal(after.activeSkills.concentration,true);
 assert.equal(after.accuracy.activeBonus,100);
 assert.equal(after.accuracy.known-before.accuracy.known,100);
 assert.equal(after.dodge.known,before.dodge.known);
 assert.equal(after.attack.known,before.attack.known);
 assert.equal(sample(26,false).accuracy.activeBonus,0);
});
test('catalog EP changes follow source while missing mastery and missing record fail closed',()=>{
 const changed=structuredClone(skills);
 changed[100054001].funcs.find(e=>e.ep==='EP_TOHIT_CONST').fv1[3]=80;
 assert.equal(sample(26,true,changed).accuracy.activeBonus,80);
 assert.equal(C.activeCombatSkills({selected:{combatConcentration:true},
  skillCatalog:skills,jobKey:'WARRIOR',level:45}).concentration,false);
 const lost=structuredClone(skills);delete lost[100054001];
 assert.equal(sample(26,true,lost).activeSkills.concentration,false);
});
test('book gates Concentration by the same trained slash skill and saves it in links',()=>{
 const app=read('app.js'),book=read('stage-attributes.js');
 assert.match(app,/branchMasteries=\{slash:window\.PandoraSkillProgression\.groupAdeptness/);
 assert.match(app,/combatConcentration:'concentration'/);
 assert.match(app,/rawAttributes\[key\]===true/);
 assert.match(app,/combatConcentration'\]/);
 assert.match(book,/\['combatConcentration','Сосредоточенность'\]/);
 assert.match(book,/cm\.accuracy\.activeBonus/);
});
