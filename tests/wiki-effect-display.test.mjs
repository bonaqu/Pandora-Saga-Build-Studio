import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const items=JSON.parse(read('data/os/items.json'));
const root={};
Function('window',read('pandora-studio-item-owner-editor.js'))(root);
const presenter=root.PandoraStudioItemOwnerEditor;

test('all 81 observed effect codes have English descriptions with no raw game codes',()=>{
 const seen=new Set(Object.values(items).flatMap(item=>(item.effects||[]).map(effect=>effect.func)));
 assert.equal(seen.size,81);
 for(const code of seen){
  const english=presenter.effectDisplayLabel(code,'en');
  assert.ok(english&&english!=='Item effect'&&!english.startsWith('EP_'),code);
  assert.doesNotMatch(english,/\p{Script=Cyrillic}/u,code);
 }
 assert.equal(presenter.effectDisplayLabel('EP_UNKNOWN_NEW_EFFECT','en'),'Item effect');
 assert.equal(presenter.effectDisplayLabel('EP_UNKNOWN_NEW_EFFECT','ru'),'Игровой эффект');
});

test('skill IDs and unsupported game parameters are not rendered as numeric bonuses',()=>{
 for(const code of [
  'EP_SKILL_EXEC','EP_SKILL_EXEC_BALM','EP_SKILL_EXEC_MAPIN',
  'EP_ONHIT_SKILL_EXEC','EP_ONHIT_SKILL_EXEC_ATTACKER',
  'EP_ONDAMAGE_SKILL_EXEC','EP_ONDAMAGE_SKILL_EXEC_ATTACKER',
  'EP_ONDAMAGE_ELEM_SKILL_EXEC'
 ])assert.equal(presenter.effectHasDisplayAmount(code),false,code);
 for(const code of [
  'EP_DESTINED_POISON','EP_ONHIT_STUN','EP_RANDOM_BOX',
  'EP_RECOVERY_POISON','EP_ABILITY_RESET','EP_UNKNOWN_NEW_EFFECT'
 ])assert.equal(presenter.effectHasDisplayAmount(code),false,code);
 for(const code of [
  'EP_MAXLIFE_CONST','EP_DAMAGERATE_CONST','EP_HEAL_LIFE',
  'EP_HEAL_LIFE_RATE','EP_ONDAMAGE_FIN_DAMAGE_SCALE'
 ])assert.equal(presenter.effectHasDisplayAmount(code),true,code);
 assert.equal(presenter.effectUsesSkillId('EP_ONHIT_SKILL_EXEC'),true);
 assert.equal(presenter.effectUsesSkillId('EP_MAXLIFE_CONST'),false);
});

test('editable effect options retain IDs and are localized for owners',()=>{
 const ru=presenter.effectOptions(items,null,'ru');
 const en=presenter.effectOptions(items,null,'en');
 assert.equal(ru.length,en.length);
 assert.equal(en.find(row=>row.value==='EP_SKILL_EXEC_BALM')?.label,
  'Activates consumable skill');
 assert.equal(ru.find(row=>row.value==='EP_SKILL_EXEC_BALM')?.label,
  'Применение лечебного средства');
 const app=read('pandora-studio-app.js');
 assert.match(app,/const effectOptions=adminEditing&&adminToken\?/);
 assert.match(app,/itemEditor\.effectHasDisplayAmount\(effect\.func\)/);
 assert.match(app,/itemEditor\.effectUsesSkillId\(effect\.func\)/);
 assert.doesNotMatch(app,/allEffectOptions/);
});

test('player encyclopedia hides empty verification tab and technical notes',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/if\(id==='review'&&!hasReviewItems\)continue/);
 assert.match(app,/missingDescription/);
 assert.doesNotMatch(app,/not a verified chance or damage value/);
 assert.doesNotMatch(app,/Both skills use EP_CAUSE_POISON/);
 assert.doesNotMatch(app,/неизучаемая техническая запись/);
});
