import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};
Function('window',read('os-calculator.js'))(root);
const calc=root.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const shield=[['item:shield',{id:21,slot:'shield',name:'Shield',AC:40},0]];
const preview=(jobKey,combatBuffs={},extra={})=>calc.combatPreview({
 stats,jobKey,level:35,records:shield,weapon:{W:48},skillCatalog:skills,
 combatBuffs,...extra
});
test('current OS source records match four known combat buff IDs, classes and EP types',()=>{
 const expected={
  lunge:['EP_ATTACKINTERVAL_SCALE',15,'WARRIOR',18],
  warCry:['EP_DAMAGERATE_SCALE',20,'GLADIATOR',28],
  raging:['EP_ARMORCLASS_SCALE',-60,'GLADIATOR',35],
  defender:['EP_ARMORCLASS_SCALE',40,'KNIGHT',35]
 };
 for(const [key,[ep,value,job,level]] of Object.entries(expected)){
  const record=skills[calc.combatSkillIds[key]];
  assert.ok(record&&record.classes[job],key+' class');
  assert.equal(record.charLevel,level,key+' level');
  assert.equal(calc.combatSkillSource(skills,key).effects[ep],value);
 }
});
test('catalog-backed active skills reproduce checked attack, defense and attack speed values',()=>{
 const plain=preview('GLADIATOR');
 const cry=preview('GLADIATOR',{combatWarCry:true});
 const rage=preview('GLADIATOR',{combatRage:true});
 const lunge=preview('GLADIATOR',{combatLunge:true});
 const defender=preview('KNIGHT',{combatDefender:true});
 assert.equal(cry.attack.activeBonus,10+Math.ceil(plain.attack.raw*.2));
 assert.equal(rage.attack.activeBonus,Math.ceil(plain.attack.raw*.3));
 assert.equal(rage.defense.activeBonus,Math.ceil(40*-.6));
 assert.equal(lunge.attackSpeed.known,plain.attackSpeed.known+15);
 assert.equal(defender.defense.activeBonus,Math.floor(40*.4));
 assert.equal(defender.attack.activeBonus,Math.floor(plain.attack.raw*-.2));
});
test('changing source EP percentages changes the actual calculation',()=>{
 const changed=JSON.parse(JSON.stringify(skills));
 changed[calc.combatSkillIds.warCry].funcs
  .find(x=>x.ep==='EP_DAMAGERATE_SCALE').fv1[3]=25;
 const current=preview('GLADIATOR',{combatWarCry:true});
 const updated=preview('GLADIATOR',{combatWarCry:true},{skillCatalog:changed});
 assert.equal(updated.attack.activeBonus,10+Math.ceil(updated.attack.raw*.25));
 assert.equal(updated.attack.known-current.attack.known,4);
});
test('missing or corrupted published skill data fails closed without invented bonuses',()=>{
 const partial=JSON.parse(JSON.stringify(skills));
 delete partial[calc.combatSkillIds.warCry];
 const missing=preview('GLADIATOR',{combatWarCry:true},{skillCatalog:partial});
 assert.equal(missing.activeSkills.warCry,false);
 assert.equal(missing.attack.activeBonus,0);
 const corrupt=JSON.parse(JSON.stringify(skills));
 corrupt[calc.combatSkillIds.raging].funcs=[];
 const invalid=preview('GLADIATOR',{combatRage:true},{skillCatalog:corrupt});
 assert.equal(invalid.activeSkills.raging,false);
 assert.equal(invalid.defense.activeBonus,0);
 const locked=JSON.parse(JSON.stringify(skills));
 locked[calc.combatSkillIds.warCry].charLevel=55;
 assert.equal(preview('GLADIATOR',{combatWarCry:true},{skillCatalog:locked})
  .activeSkills.warCry,false);
 assert.equal(preview('KNIGHT',{combatWarCry:true}).activeSkills.warCry,false);
});
test('book controller forwards source catalog to calculator and exposes same skill access',()=>{
 const app=read('app.js');
 assert.match(app,/skillCatalog:catalog\.skills/);
 assert.match(app,/combatSkillCatalog\.activeCombatSkills\(/);
 assert.match(app,/combatSkillCatalog\.combatSkillSource\(skillMap,name\)/);
 assert.match(app,/combatSkillCards\[setting\]=ability/);
 assert.match(app,/availability,combatSkillCards,skillModel/);
});
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.listeners={};
  this.className='';this.textContent='';this.style={};this.checked=false;this.disabled=false;}
 append(...values){this.children.push(...values)}
 prepend(...values){this.children.unshift(...values)}
 replaceChildren(...values){this.children=[...values]}
 setAttribute(key,value){this.attributes[key]=String(value)}
 addEventListener(key,fn){this.listeners[key]=fn}
}
const document={createElement:t=>new Element(t),
 createTextNode:t=>Object.assign(new Element('#text'),{textContent:t})};
const stage={};
Function('window','document',read('stage-attributes.js'))(stage,document);
const walk=x=>[x,...(x.children||[]).flatMap(walk)];
test('book uses real skill art, tooltip, bonus summary and disallows stale saved buffs',()=>{
 const target=new Element('root'),updates=[];
 stage.PandoraStageAttributes.render(target,{page:'buffs',
  buffs:{combatWarCry:true,combatDefender:true},
  availability:{combatWarCry:true,combatDefender:false},
  combatSkillCards:{
   combatWarCry:{name:'Боевой клич',desc:'Увеличивает атаку отряда',level:28,
    icon:'https://pandorasaga-os.com/icons/skills/skill_1.webp',
    summary:'+10 атаки · +20% атаки'},
   combatDefender:{name:'Бастион',desc:'Увеличивает защиту',level:35,
    icon:'https://pandorasaga-os.com/icons/skills/skill_2.webp',
    summary:'−20% атаки · +40% защиты'}
  },
  onBuff:(key,value)=>updates.push([key,value])
 });
 const findInput=key=>walk(target).find(x=>x.tag==='input'&&
  x.attributes['data-book-setting']===key);
 assert.equal(findInput('combatWarCry').checked,true);
 assert.equal(findInput('combatDefender').checked,false);
 assert.equal(findInput('combatDefender').disabled,true);
 const cards=walk(target).filter(x=>x.className.includes('stage-combat-buff'));
 assert.equal(cards.length,2);
 assert.ok(cards.every(x=>x.children.some(n=>n.tag==='img')));
 assert.ok(walk(target).some(x=>x.textContent==='+10 атаки · +20% атаки'));
 findInput('combatWarCry').listeners.change({target:{checked:false}});
 assert.deepEqual(updates,[['combatWarCry',false]]);
});
