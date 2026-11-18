import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('combat and guild actives live in the Hero Book without the retired form',()=>{
 const html=get('index.html'),book=get('pandora-studio-hero-book.js');
 assert.doesNotMatch(html,/id="legacyBuffControls"|id="originCombatLunge"|id="originGuildArouse"/);
 for(const key of ['combatLunge','combatWarCry','combatRage','combatDefender','guildArouse'])
  assert.ok(book.includes("'"+key+"'"),'Hero Book controls: '+key);
 assert.match(book,/data-book-setting':key/);
 assert.match(book,/onchange:event=>\(vital\?onVital:onBuff\)/);
});
test('shared builds safely validate and persist combat choices',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/rawAttributes\[key\]===true/);
 assert.match(app,/safe\.attributeBuffs\.combatDefender=false/);
 assert.match(app,/\['guildArouse',3\]/);
 assert.match(app,/current\.combatRage/);
 assert.match(app,/current\.combatDefender/);
});
test('attack and defense views show contribution of chosen skills',()=>{
 const stage=get('pandora-studio-hero-book.js'),calc=get('pandora-os-character-calculator.js');
 assert.match(stage,/row\('АТК','ATK',c.attack\?\.known,'',clientAttack\)/);
 assert.match(calc,/activeAtk=baseAtk/);
 assert.match(stage,/row\('Защита','Defense',c.defense\?\.known\)/);
 assert.match(calc,/activeDef=\(actives\.raging/);
 assert.match(calc,/actives\.lunge/);
});
