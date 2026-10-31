import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const combat=(weapon,combatLunge=true)=>C.combatPreview({
 stats,level:45,jobKey:'GLADIATOR',weapon,skillCatalog:skills,
 combatBuffs:{combatLunge}
});
test('OS 2026-10-03 level 45 cap drives default sliders and current app',()=>{
 assert.equal(tables.levelCap,45);
 const html=read('index.html'),app=read('app.js');
 assert.match(html,/id="level"[^>]*max="45"[^>]*value="45"/);
 assert.match(html,/id="levelCapLabel">45/);
 assert.match(html,/id="levelCapNotice"/);
 assert.match(app,/function fresh\(\)\{return\{race:1,gender:0,job:16,level:45,/);
 assert.match(app,/function currentLevelCap\(\)/);
 assert.match(app,/gameTables\?\.levelCap/);
 assert.match(app,/state\.level=Math\.max\(1,Math\.min\(currentLevelCap\(\),/);
 assert.match(app,/syncLevelLimit\(\);renderAllocationWarning\(\);state\.gender/);
 assert.match(app,/Сохранённый билд в библиотеке не изменён/);
});
test('OS Lunge weapon restrictions forbid bows and crossbows without losing valid bare-hand use',()=>{
 const skill=skills[100051001];
 assert.ok(skill.weaponUse.includes('BARE_HAND'));
 assert.ok(skill.weaponUse.includes('1H_SWORD'));
 assert.ok(!skill.weaponUse.includes('BOW'));
 assert.ok(!skill.weaponUse.includes('CROSSBOW'));
 const none=combat(null);
 const sword=combat({kind:'1H_SWORD',W:48});
 const bow=combat({kind:'BOW',W:48});
 const crossbow=combat({kind:'CROSSBOW',W:48});
 assert.equal(none.activeSkills.lunge,true);
 assert.equal(sword.activeSkills.lunge,true);
 assert.equal(sword.attackSpeed.lunge,15);
 assert.equal(bow.activeSkills.lunge,false);
 assert.equal(bow.attackSpeed.lunge,0);
 assert.equal(crossbow.activeSkills.lunge,false);
 assert.equal(crossbow.attackSpeed.lunge,0);
 assert.equal(combat({kind:'1H_SWORD',W:48},false).activeSkills.lunge,false);
});
test('the book and calculator ask the same source weapon eligibility question',()=>{
 const app=read('app.js'),calc=read('os-calculator.js'),book=read('stage-attributes.js');
 assert.match(app,/hasShield:equippedShield\?\.slot==='shield',skillCatalog:skillMap/);
 assert.match(app,/weapon:equippedWeapon/);
 assert.match(app,/!ability\.weaponUse\.includes\(equippedWeapon\?\.kind\?\?'BARE_HAND'\)/);
 assert.match(calc,/record\.weaponUse\.includes\(weapon\?\.kind\?\?'BARE_HAND'\)/);
 assert.match(book,/Недоступно для героя/);
});
test('incoming critical damage uses defensive metric; outgoing damage stays under Attack',()=>{
 const book=read('stage-attributes.js');
 assert.match(book,/\['Входящий крит\. урон',battle\.criticalIncomingDamage/);
 assert.match(book,/Исходящий критический урон: /);
 assert.ok(!book.includes("['Критический урон',battle.criticalDamage"));
 assert.ok(!book.includes('Базовый исходящий критический урон:'));
});
