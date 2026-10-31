import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../os-calculator.js',import.meta.url),'utf8'),win={};
Function('window',code)(win);
const calc=win.PandoraOSCalculator;
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const equipped=[['item:shield',{id:1,name:'Щит',slot:'shield',AC:40},0]];
const preview=(jobKey,level,combatBuffs={},records=equipped,guildArouse=0)=>calc.combatPreview({
 stats,jobKey,level,combatBuffs,records,guildArouse,weapon:{W:48}});
test('War Cry, Lunge and Raging Soul require Gladiator job and levels 28,18,35',()=>{
 const s={combatWarCry:true,combatRage:true,combatLunge:true};
 const low=preview('GLADIATOR',17,s);
 assert.deepEqual(low.activeSkills,{warCry:false,raging:false,defender:false,lunge:false,concentration:false});
 const middle=preview('GLADIATOR',28,s);
 assert.deepEqual([middle.activeSkills.warCry,middle.activeSkills.raging,
  middle.activeSkills.lunge],[true,false,true]);
 const high=preview('GLADIATOR',35,s);
 assert.equal(high.activeSkills.raging,true);
 assert.equal(high.attackSpeed.lunge,15);
 assert.equal(high.defense.activeBonus,-24);
 assert.ok(high.attack.activeBonus>middle.attack.activeBonus);
});
test('current OS Shieldbearer uses -20% attack, +40% defense, requires shield',()=>{
 const on=preview('KNIGHT',35,{combatDefender:true});
 assert.equal(on.activeSkills.defender,true);
 assert.equal(on.defense.activeBonus,16);
 assert.equal(on.attack.activeBonus,Math.floor(on.attack.raw*-.2));
 assert.equal(on.defense.known,56);
 const noShield=preview('KNIGHT',35,{combatDefender:true},[]);
 assert.equal(noShield.activeSkills.defender,false);
 assert.equal(noShield.defense.activeBonus,0);
 const invalid=preview('GLADIATOR',35,{combatDefender:true});
 assert.equal(invalid.activeSkills.defender,false);
});
test('current OS percent and original Remaked rounding are separated from passives',()=>{
 const plain=preview('GLADIATOR',35);
 const cry=preview('GLADIATOR',35,{combatWarCry:true});
 assert.equal(cry.attack.activeBonus,10+Math.ceil(plain.attack.raw*.2));
 const rage=preview('GLADIATOR',35,{combatRage:true});
 assert.equal(rage.attack.activeBonus,Math.ceil(plain.attack.raw*.3));
 const arr=preview('GLADIATOR',35,{},equipped,2);
 assert.equal(arr.attack.guildBonus,Math.ceil(plain.attack.raw*.04));
 assert.equal(arr.magicAttack.guild,4);
});
test('bad saved class effects are ignored, never silently used after class change',()=>{
 const wrong=preview('WIZARD',50,{combatWarCry:true,combatRage:true,
  combatDefender:true,combatLunge:true});
 assert.ok(Object.values(wrong.activeSkills).every(v=>v===false));
});
