import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const window={};Function('window',read('os-calculator.js'))(window);
const preview=window.PandoraOSCalculator.healingSpellsPreview;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const sample={level:50,int:90,spi:70,benevolence:60,healingPercent:120,skillCatalog:skills};
const withJob=(jobKey,extra={})=>({...sample,jobKey,
 benevolenceCap:classes[jobKey].branchCaps.benevolence,...extra});
test('ordinary healing exact Legacy FirstAid/Heal/HealingAura/Sanctuary formulas',()=>{
 const p=preview(withJob('PRIEST'));
 assert.deepEqual(p.rows.map(x=>x.amount),[388,1044,1164,600,27]);
 assert.equal(p.clericLevel50,false);
});
test('Cleric level 50 switches to special healing coefficients and floor rounding',()=>{
 const p=preview(withJob('CLERIC'));
 assert.deepEqual(p.rows.map(x=>x.amount),[705,1686,1506,600,27]);
 assert.equal(p.clericLevel50,true);
 assert.ok(p.rows.every(x=>x.available));
 assert.deepEqual(p.rows.map(x=>x.skillId),
  [310001002,310004002,310021002,310023001,310022001]);
});
test('Cleric level 49 uses ordinary coefficients rather than level 50 bonuses',()=>{
 const p=preview(withJob('CLERIC',{level:49}));
 const basic=preview(withJob('PRIEST',{level:49}));
 assert.deepEqual(p.rows.map(x=>x.amount),basic.rows.map(x=>x.amount));
});
test('Restoration per-period value does not get scaled by skill healing percentage',()=>{
 const p=preview(withJob('PRIEST',{healingPercent:250}));
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

test('healing preview respects OS skill catalog, race-independent class caps and actual learnability',()=>{
 const cleric=preview(withJob('CLERIC'));
 assert.equal(cleric.rows.every(x=>x.available),true);
 assert.equal(cleric.verified,false,'exact skill source does not prove live healing packet');
 assert.deepEqual(cleric.rows.map(x=>x.nameEn),
  ['First Aid','Heal','Healing Aura','Sanctuary','Restoration']);
 assert.deepEqual(cleric.rows.map(x=>x.requiresEn),
  ['Healing mastery 8','Acolyte class, level 18','Healing mastery 54',
   'Cleric class, level 45','Healing mastery 41']);
 const warrior=preview(withJob('WARRIOR'));
 assert.equal(warrior.rows.every(x=>x.available),false,
  'Warrior may not spend into a zero-cap benevolence branch');
 assert.equal(classes.WARRIOR.branchCaps.benevolence,0);
 const acolyte=preview(withJob('ACOLYTE',{level:18,benevolence:18}));
 assert.deepEqual(acolyte.rows.map(x=>x.available),[true,true,false,false,false]);
 const missing=preview(withJob('CLERIC',{skillCatalog:null}));
 assert.equal(missing.rows.every(x=>!x.available),true);
 assert.deepEqual(missing.rows.map(x=>x.amount),cleric.rows.map(x=>x.amount),
  'lack of OS catalog must not alter preserved Remaked magnitudes');
 const tooLow=preview(withJob('CLERIC',{benevolenceCap:40}));
 assert.equal(tooLow.rows.every(x=>!x.available),true);
});
test('forged skill identity, effect, target, class or prerequisites cannot authorize healing',()=>{
 const cases=[
  [310001002,{id:1}],
  [310001002,{classes:{}}],
  [310001002,{reqs:[{branch:'hymn',amount:8}]}],
  [310001002,{charLevel:1}],
  [310001002,{prereq:999}],
  [310001002,{learnable:false}],
  [310001002,{funcs:[{ep:'EP_HEAL_LIFE',dir:'TARGET',fv1:[300,250,280,26]}]}],
  [310004002,{funcs:[{ep:'EP_DAMAGE',dir:'TARGET',fv1:[1000,300,500,50]}]}],
  [310021002,{funcs:[{ep:'EP_HEAL_LIFE',dir:'CASTER',fv1:[850,200,400,150]}]}],
  [310023002,{funcs:[{ep:'EP_HEAL_LIFE',dir:'TARGET',fv1:[201,0,200,100]}]}],
  [310022001,{funcs:[{ep:'EP_HEAL_LIFE_REGENERATOR',dir:'TARGET',fv1:[99,5,5,5]}]}]
 ];
 const idx={310001002:0,310004002:1,310021002:2,310023002:3,310022001:4};
 for(const [id,change] of cases){
  const forged={...skills,[id]:{...skills[id],...change}};
  const rows=preview(withJob('CLERIC',{skillCatalog:forged})).rows;
  assert.equal(rows[idx[id]].available,false,'modified source '+id+' '+Object.keys(change));
 }
});
test('base() supplies class cap and OS catalog; no automatic use or HP inflation',()=>{
 const s=read('os-calculator.js'),stage=read('stage-attributes.js');
 assert.match(s,/benevolenceCap:classData\.branchCaps\?\.benevolence/);
 assert.match(s,/skillCatalog:combatContext\.skillCatalog/);
 assert.match(stage,/row\.nameEn\|\|row\.name/);
 assert.match(stage,/row\.requiresEn\|\|row\.requires/);
 assert.match(stage,/skillNamesEn\[entry\.id\]/);
 assert.match(stage,/english\?'Recovery every 2 seconds'/);
});
