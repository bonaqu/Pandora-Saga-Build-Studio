import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectTrapTarget} from '../scripts/audit-os-trap-target.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-os-character-calculator.js'))(root);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(root);
const data={
 skills:JSON.parse(read('data/os/skills.json')),
 monsters:JSON.parse(read('data/os/monsters.json')),
 classes:JSON.parse(read('data/os/classes.json')),
 calculator:root.PandoraOSCalculator,
 insights:root.PandoraWikiSkillInsights
};
const inspect=patch=>inspectTrapTarget({...data,...patch});
test('Trap and Ogre source matrix is exact and intentionally has no final HP damage',()=>{
 const a=inspect();
 assert.equal(a?.skill.name,'Ползучая ловушка');
 assert.equal(a?.skill.jobName,'Загонщик');
 assert.equal(a?.skill.requiredTrapMastery,41);
 assert.equal(a?.skill.classTrapCap,90);
 assert.equal(a?.skill.baseMana,33);
 assert.deepEqual([a?.skill.consumedItemId,a?.skill.consumedCount],[65007,2]);
 assert.deepEqual(a?.skill.stages,[240005001,240005002,240005003]);
 assert.equal(a?.skill.element,'FIRE');
 assert.deepEqual(a?.skill.sourceVector,[680,0,350,155]);
 assert.deepEqual(a?.target,{id:22104,name:'Гигантский огр',level:53,hp:6126,
  defense:15,magicDefense:0,warding:89,fireResistance:0,
  magicResistance:17});
 assert.equal(a.finalDamage,null);
 assert.equal(a.verifiedFinalDamage,false);
 assert.equal(a.missingStages.length,4);
});
test('Malformed trap chain, coefficients or impossible class cap disables the proof',()=>{
 const s=structuredClone(data.skills);
 s['240005003'].funcs[0].fv1[0]=681;
 assert.equal(inspect({skills:s}),null);
 const missing=structuredClone(data.skills);
 delete missing['240005002'];
 assert.equal(inspect({skills:missing}),null);
 const cls=structuredClone(data.classes);
 cls.DISTURBANCE.branchCaps.trap=40;
 assert.equal(inspect({classes:cls}),null);
});
test('Malformed target resistance fails closed; Hero Book stays build-only',()=>{
 const m=structuredClone(data.monsters);
 m['22104'].resists.fire='unknown';
 assert.equal(inspect({monsters:m}),null);
 const book=read('pandora-studio-hero-book.js');
 const path=read('pandora-studio-hero-path.js');
 assert.doesNotMatch(book,/audit-os-trap-target|240005003/);
 assert.match(book,/result\.monsterId!==22104/,
  'A valid current character may now show OS-calculated damage by Ogre ID');
 assert.doesNotMatch(path,/path-next-melee|data-next-melee-skill-id/);
 assert.doesNotMatch(book,/stage-material-actions/);
});
