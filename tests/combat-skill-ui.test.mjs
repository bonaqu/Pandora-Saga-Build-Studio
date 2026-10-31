import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('collapsed player controls expose optional OS skill actives with exact rates',()=>{
 const html=get('index.html');
 for(const id of ['originCombatLunge','originCombatWarCry','originCombatRage',
  'originCombatDefender','originGuildArouse'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/Яростная атака · \+30% атаки, −60% защиты/);
 assert.match(html,/Бастион · −20% атаки, \+40% защиты/);
});
test('shared builds safely validate and persist combat choices',()=>{
 const app=get('app.js');
 assert.match(app,/rawAttributes\[key\]===true/);
 assert.match(app,/safe\.attributeBuffs\.combatDefender=false/);
 assert.match(app,/\['guildArouse',3\]/);
 assert.match(app,/current\.combatRage/);
 assert.match(app,/current\.combatDefender/);
});
test('attack and defense views show contribution of chosen skills',()=>{
 const stage=get('stage-attributes.js');
 assert.match(stage,/cm\.attack\?\.activeBonus/);
 assert.match(stage,/df\.activeBonus/);
 assert.match(stage,/cm\.activeSkills\?\.lunge/);
});
