import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const window={};Function('window',read('os-calculator.js'))(window);
const preview=window.PandoraOSCalculator.healingSpellsPreview;
const sample={level:50,int:90,spi:70,benevolence:60,healingPercent:120};
test('ordinary healing exact Legacy FirstAid/Heal/HealingAura/Sanctuary formulas',()=>{
 const p=preview({...sample,jobKey:'PRIEST'});
 assert.deepEqual(p.rows.map(x=>x.amount),[388,1044,1164,600,27]);
 assert.equal(p.clericLevel50,false);
});
test('Cleric level 50 switches to special healing coefficients and floor rounding',()=>{
 const p=preview({...sample,jobKey:'CLERIC'});
 assert.deepEqual(p.rows.map(x=>x.amount),[705,1686,1506,600,27]);
 assert.equal(p.clericLevel50,true);
 assert.ok(p.rows.every(x=>x.available));
});
test('Cleric level 49 uses ordinary coefficients rather than level 50 bonuses',()=>{
 const p=preview({...sample,level:49,jobKey:'CLERIC'});
 const basic=preview({...sample,level:49,jobKey:'PRIEST'});
 assert.deepEqual(p.rows.map(x=>x.amount),basic.rows.map(x=>x.amount));
});
test('Restoration per-period value does not get scaled by skill healing percentage',()=>{
 const p=preview({...sample,jobKey:'PRIEST',healingPercent:250});
 assert.equal(p.rows[4].amount,27);
 assert.equal(p.rows[4].scaledBySkill,false);
});
test('unlearned skills retain theoretical numbers but are marked unavailable',()=>{
 const p=preview({level:10,int:15,spi:10,benevolence:5,healingPercent:100,jobKey:'WARRIOR'});
 assert.ok(p.rows.every(x=>x.available===false));
});
test('existing book receives computed skill values, not duplicate stat formulas',()=>{
 const a=read('app.js'),ui=read('stage-attributes.js');
 assert.match(a,/benevolenceMastery=window\.PandoraSkillProgression\.groupAdeptness/);
 assert.match(ui,/modifiers\.healingSpells/);
 assert.match(ui,/row\.scaledBySkill/);
});
