import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};Function('window',read('os-calculator.js'))(root);
const calc=root.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const stats={vit:56,spi:56},sample={burn:7,stun:3,numb:2,tumble:1};
const value=(other={})=>calc.resistancePreview({stats,bonuses:sample,...other});
test('three actual Remaked Honor titles increase only their corresponding status resistances',()=>{
 const fire=value({honorTitle:3}),ice=value({honorTitle:4}),lightning=value({honorTitle:5});
 assert.equal(fire.status.burn,12);assert.equal(fire.status.numb,2);assert.equal(fire.status.tumble,1);
 assert.equal(ice.status.numb,7);assert.equal(ice.status.burn,7);
 assert.equal(lightning.status.tumble,6);assert.equal(lightning.status.stun,3);
});
test('current OS Dwarf Heart passive gives stun and tumble +10, not all ailments',()=>{
 const dwarf=value({racialPassiveId:900030001});
 assert.equal(dwarf.status.stun,13);
 assert.equal(dwarf.status.tumble,11);
 assert.equal(dwarf.status.numb,2);
});
test('current OS Warding 26 passive contributes +15 to three target conditions exactly once',()=>{
 const input={jobKey:'SNIPER',wardingMastery:26,wardingCap:90,skillCatalog:skills};
 const passive=calc.wardingStatusPassive(input);
 assert.deepEqual(passive,{stun:15,numb:15,tumble:15});
 const activated=value({...input,honorTitle:4,racialPassiveId:900030001});
 assert.equal(activated.status.stun,28);
 assert.equal(activated.status.numb,22);
 assert.equal(activated.status.tumble,26);
 assert.deepEqual(activated.wardingPassive,passive);
 for(const mastery of [0,25,-1])assert.equal(calc.wardingStatusPassive({...input,wardingMastery:mastery}),null);
 assert.equal(calc.wardingStatusPassive({...input,jobKey:'UNKNOWN'}),null);
 assert.equal(calc.wardingStatusPassive({...input,wardingCap:5}),null);
 assert.equal(calc.wardingStatusPassive({...input,wardingCap:25}),null);
 assert.equal(calc.wardingStatusPassive({...input,wardingMastery:91}),null);
 assert.equal(calc.wardingStatusPassive({...input,skillCatalog:{}}),null);
});
test('duplicated CASTER row does not double Numb and corrupt skill row fails closed',()=>{
 const input={jobKey:'SNIPER',wardingMastery:26,wardingCap:90,skillCatalog:skills};
 const tampered=structuredClone(skills[260007001]);
 tampered.funcs=structuredClone(tampered.funcs);
 tampered.funcs.find(e=>e.ep==='EP_IMMUNE_STUN').fv1[3]=null;
 assert.equal(calc.wardingStatusPassive({...input,skillCatalog:{...skills,260007001:tampered}}),null);
 const wrong={...tampered,reqs:[]};
 assert.equal(calc.wardingStatusPassive({...input,skillCatalog:{...skills,260007001:wrong}}),null);
 assert.equal(calc.wardingStatusPassive(input).numb,15);
});
test('UI book labels resistance effects as combined sources, not only gear',()=>{
 const source=read('stage-attributes.js'),editor=read('app.js');
 assert.match(source,/Сопротивления состояниям/);
 assert.match(source,/Устойчивость: \+15/);
 assert.match(editor,/const wardingMastery=window.PandoraSkillProgression.groupAdeptness/);
 assert.match(editor,/ridingMastery,wardingMastery/);
});
