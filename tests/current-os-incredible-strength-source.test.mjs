import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const window={};Function('window',read('pandora-os-character-calculator.js'))(window);
const C=window.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const items=JSON.parse(read('data/os/items.json'));
const stats={vit:10,str:72,agi:72,dex:40,spi:5,int:1};
const options={stats,level:45,jobKey:'DRAGOON',skillCatalog:skills,weapon:items[1483]};

test('Incredible Strength is an available melee on-hit effect for Dragoon 45, not ATK',()=>{
 const skill=skills['910110001'];
 assert.equal(skill.name,'Невероятная сила');
 assert.equal(skill.funcs.length,1);
 assert.equal(skill.funcs[0].ep,'EP_ONHIT_FIN_DAMAGE_CONST');
 assert.deepEqual(skill.funcs[0].fv1,[0,0,10,5]);
 const passive=C.incredibleStrengthPreview(options);
 assert.deepEqual([passive.id,passive.applies,passive.addsAttack],
  [910110001,true,0]);
 assert.deepEqual(passive.sourceParameters,[0,0,10,5]);
 const preview=C.combatPreview(options);
 assert.deepEqual(preview.incredibleStrength,passive);
 assert.equal(preview.attack.known,C.combatPreview({
  ...options,skillCatalog:{...skills,910110001:undefined}
 }).attack.known,'On-hit damage cannot be added to character-sheet ATK');
});
test('class, level and exact OS source gate this passive',()=>{
 assert.equal(C.incredibleStrengthPreview({...options,level:19}),null);
 assert.equal(C.incredibleStrengthPreview({...options,jobKey:'WARRIOR'}),null);
 assert.equal(C.incredibleStrengthPreview({...options,skillCatalog:{}}),null);
 const damage=structuredClone(skills['910110001']);
 damage.funcs[0].ep='EP_DAMAGERATE_CONST';
 assert.equal(C.incredibleStrengthPreview({...options,
  skillCatalog:{...skills,910110001:damage}}),null);
});
test('passive on-hit effect remains in combat preview but is not a castable Skill Effects row',()=>{
 const book=read('pandora-studio-hero-book.js');
 const effects=book.slice(book.indexOf('function skillEffectsPage('),
  book.indexOf('// Remaked uses three DISTINCT source matrices'));
 assert.doesNotMatch(effects,/hitPassive|incredibleStrength/);
 assert.match(effects,/scalingSkillPreview/);
 assert.match(read('pandora-os-character-calculator.js'),/incredibleStrengthPreview/);
});
test.todo('game-client parity #386: full level-45 Enkidu Dragoon +8 Zephyr ATK 219 and 266 with War Cry; current Legacy strength rate yields 231/281');
