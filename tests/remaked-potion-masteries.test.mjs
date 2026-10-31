import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};
Function('window',read('os-calculator.js'))(ctx);
Function('window',read('skill-progression.js'))(ctx);
Function('window',read('game-navigation.js'))(ctx);
const calc=ctx.PandoraOSCalculator,progress=ctx.PandoraSkillProgression,nav=ctx.PandoraGameNavigation;
const passives=JSON.parse(read('data/os/racialPassives.json'));
const skills=JSON.parse(read('data/os/skills.json'));
const pot=(extra={})=>calc.potionRecovery({vit:50,jobKey:'WARRIOR',level:12,meleeMastery:0,...extra});
test('human Знахарство is verified OS passive +15, not a profession',()=>{
 assert.equal(passives.HUMAN.skills[2],900010003);
 assert.equal(skills[900010003].name,'Знахарство');
 assert.ok(skills[900010003].funcs.some(f=>f.ep==='EP_MASTERY_POTION'&&f.fv1[3]===15));
 assert.equal(pot().percent,105);
 assert.equal(pot({racialPassiveId:900010003}).percent,120);
 assert.equal(pot({racialPassiveId:900020003}).racial,0);
});
test('warrior green melee mastery level 12+: ten percent per full ten trained',()=>{
 for(const [points,want] of [[0,0],[9,0],[10,10],[29,20],[30,30],[49,40]])
  assert.equal(pot({meleeMastery:points}).mastery,want);
 for(const jobKey of ['WARRIOR','GLADIATOR','JUGGERNAUT','DRAGOON','KNIGHT','GENERAL','PALADIN'])
  assert.equal(pot({jobKey,meleeMastery:20}).mastery,20);
 for(const jobKey of ['SCOUT','CLERIC','MAGE','JESTER'])
  assert.equal(pot({jobKey,meleeMastery:20}).mastery,0);
 assert.equal(pot({level:11,meleeMastery:90}).mastery,0);
 assert.equal(pot({meleeMastery:-1}),null);
 assert.equal(pot({meleeMastery:'50'}),null);
});
test('training uses green mastery alone, never blue plus green',()=>{
 const state={points:{slash:20,thrust:15,brush:5,blow:10,defense:5},
  masteryAuto:false,mastery:{slash:8,thrust:7,brush:5,blow:0,defense:0}};
 const branches=['slash','thrust','brush','blow','defense'];
 let green=branches.reduce((sum,key)=>sum+progress.trained(state,key),0);
 assert.equal(green,20);
 assert.equal(pot({meleeMastery:green}).mastery,20);
 progress.setAuto(state,true,branches);
 green=branches.reduce((sum,key)=>sum+progress.trained(state,key),0);
 assert.equal(green,55);
 assert.equal(pot({meleeMastery:green}).mastery,50);
});
test('historical rune remains isolated from current OS character totals',()=>{
 const effects=[['soul:x',{effects:[{func:'EP_MASTERY_POTION',a:8}]},0]];
 const rate=pot({meleeMastery:30,racialPassiveId:900010003,
  honorTitle:11,runeJoEun:true,records:effects});
 assert.deepEqual([rate.base,rate.racial,rate.mastery,rate.honor,rate.equipment,rate.rune,rate.percent],
  [105,15,30,5,8,5,168]);
 const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
 const base=calc.base({classData:JSON.parse(read('data/os/classes.json')).KNIGHT,
  raceData:{...zero,vit:50},jobData:zero,allocation:zero,level:25,
  records:effects,attributeBuffs:{honorTitle:11,runeJoEun:true},
  potionContext:{jobKey:'KNIGHT',meleeMastery:30,racialPassiveId:900010003}});
 assert.equal(base.potion.percent,163);
 assert.equal(base.potion.rune,0);
 const injected=calc.base({classData:JSON.parse(read('data/os/classes.json')).KNIGHT,
  raceData:{...zero,vit:50},jobData:zero,allocation:zero,level:25,
  records:effects,attributeBuffs:{honorTitle:11},
  potionContext:{jobKey:'KNIGHT',meleeMastery:30,racialPassiveId:900010003,runeJoEun:true}});
 assert.equal(injected.potion.rune,0);
 assert.equal(injected.potion.percent,base.potion.percent);
 assert.equal(base.hp,base.hpBase+base.vitalsBonus.hp.total);
});
test('exact Remaked approved RU labels are mapped to 18 current OS racial skill IDs',()=>{
 const approved=JSON.parse(read('data/localization/legacy-approved.v1.json')).game.ru;
 const keys=['HUMAN','ELF','DWARF','MYLIN','ENKIDU','RAPIN'];
 assert.equal(Object.keys(nav.approvedRacialSkillNames).length,18);
 keys.forEach((key,i)=>passives[key].skills.forEach((id,j)=>
  assert.equal(nav.approvedRacialSkillNames[id],approved['racial_skill.'+i+'.'+j])));
 assert.equal(nav.approvedRacialSkillNames[900040001],'Охотничье чутьё');
 const app=read('app.js');
 assert.match(app,/potionContext:\{racialPassiveId:state\.racialPassiveId,jobKey:jobKeys\[state\.job\],meleeMastery\}/);
 assert.match(app,/\['slash','thrust','brush','blow','defense'\]/);
 assert.match(app,/localizedSkills\[id\]=\{\.\.\.localizedSkills\[id\],name\}/);
});
test('racial passive is applied to both Origin and character profile selections immediately',()=>{
 const app=read('app.js');
 assert.match(app,/state\.racialPassiveId=selected\?null:id;persist\(\);renderOriginPassives\(\);[\s\S]*?renderOriginVitals\(\);if\(stageAttributesPage\)renderStageAttributes\(\)/);
 assert.match(app,/state\.racialPassiveId=id;persist\(\);renderOriginPassives\(\);[\s\S]*?renderOriginVitals\(\);if\(stageAttributesPage\)renderStageAttributes\(\)/);
});
test('legacy class innate trained Adeptness is added exactly once before threshold rounding',()=>{
 const tables=JSON.parse(read('data/os/tables.json'));
 const innate=tables.jobInit.WARRIOR.branches;
 const keys=['slash','thrust','brush','blow','defense'];
 const state={masteryAuto:false,points:{slash:35,thrust:15,brush:0,blow:0,defense:0},
  mastery:{slash:8,thrust:7}};
 assert.equal(progress.groupAdeptness({points:{},masteryAuto:true},keys,innate),18);
 assert.equal(progress.groupAdeptness(state,keys,innate),33);
 assert.equal(pot({meleeMastery:33}).mastery,30);
 assert.equal(pot({meleeMastery:18}).mastery,10);
 const priest=progress.legacyPrayerSpirit('PRIEST',state,tables.jobInit.ACOLYTE.branches);
 assert.equal(priest,2,'innate prayer 15 yields +2 SPI at no invested prayer points');
 const app=read('app.js');
 assert.match(app,/const initialBranches=gameTables\?\.jobInit\?\.\[baseClass\]\?\.branches\|\|\{\}/);
 assert.match(app,/groupAdeptness\(/);
});
