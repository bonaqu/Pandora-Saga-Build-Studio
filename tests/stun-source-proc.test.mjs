import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const items=JSON.parse(read('data/os/items.json'));
const scope={};Function('window',read('os-calculator.js'))(scope);
const calc=scope.PandoraOSCalculator;

test('Iron Staff source EP_ONHIT_STUN reports physical-hit 4% stun, not an imaginary skill ID',()=>{
 const staff=items['2802'];
 assert.equal(staff.name,'Железный посох');
 assert.match(staff.desc,/4% шанс Оглушить/);
 const p=calc.conditionalProcPreview({records:[['item:2802',staff,0]]});
 assert.equal(p.entries.length,1);
 assert.deepEqual({name:p.entries[0].skillName,chance:p.entries[0].chance,
  skillId:p.entries[0].skillId,trigger:p.entries[0].trigger},
 {name:'Оглушение',chance:4,skillId:null,trigger:'При физической атаке'});
});
test('staff stun is explicitly equip-sourced; unrelated weapon does not acquire the proc',()=>{
 assert.equal(calc.conditionalProcPreview({records:[['item:2802',items['2802'],0]]}).entries.length,1);
 assert.equal(calc.conditionalProcPreview({records:[['item:231',items['231'],0]]}).entries.length,0);
});
test('fake inconsistent description cannot silently become a precise chance',()=>{
 const staff={...items['2802'],desc:'При физической атаке 10% шанс Оглушить врага.'};
 const p=calc.conditionalProcPreview({records:[['item:2802',staff,0]]});
 assert.equal(p.entries[0].chance,null);
 assert.equal(p.entries[0].disputedChance,true);
});
test('stun stays a proc entry, not a flat status bonus',()=>{
 const staff=items['2802'],stats=calc.gatherEffects([['item:2802',staff,0]]);
 assert.equal(stats.bonuses.stun,undefined);
 assert.equal(calc.conditionalProcPreview({records:[]}).entries.length,0);
 assert.match(read('stage-attributes.js'),/Срабатывания предметов и душ/);
});
