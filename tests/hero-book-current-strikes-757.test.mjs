import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
const C=root.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const book=read('pandora-studio-hero-book.js');
const preview=(job,masteries,weapon,source=skills)=>
 C.scalingSkillPreview({skillCatalog:source,jobKey:job,level:45,
  branchMasteries:masteries,branchCaps:classes[job].branchCaps,
  weaponKind:weapon,stats:{str:70,agi:45,dex:35,spi:18,int:12},
  combat:{attack:{walkingBase:190},defense:{directRaw:100},
   accuracy:{base:120},dodge:{base:90}}});
const strikeOf=(result,id)=>result.offense.find(x=>x.id===id);
test('Real character mastery drives a modeled strike, not final damage',()=>{
 const skill=strikeOf(preview('JUGGERNAUT',{brush:40,slash:41},'1H_AXE'),142002001);
 assert.ok(skill);
 assert.equal(skill.available,true);
 assert.equal(skill.amount,null);
 assert.equal(skill.coefficientModels[0].amount,20);
 assert.equal(skill.coefficientModels[0].confidence,'coefficient-model');
 assert.equal(skill.coefficientModels[0].ep,'EP_ONHIT_DAMAGE_SCALE');
 assert.equal(strikeOf(preview('JUGGERNAUT',{brush:40,slash:41},'1H_SWORD'),142002001).available,false,
  'An incompatible equipped weapon is not a current castable strike');
 const malformed=structuredClone(skills);
 malformed['142002001'].funcs[0].fv1[2]=2000;
 assert.equal(strikeOf(preview('JUGGERNAUT',{brush:40},'1H_AXE',malformed),142002001),undefined);
});
test('Hero Book shows explicitly labeled direct strike model while keeping final amount unknown',()=>{
 const start=book.indexOf('// Only effects calculable for this hero remain here.');
 const end=book.indexOf('// Effects from party skills are not abilities learned',start);
 assert.ok(start>0&&end>start);
 const ui=book.slice(start,end);
 assert.match(ui,/skill\.available===true&&!skill\.hostile&&!skill\.recipient/);
 assert.match(ui,/part\.ep==='EP_ONHIT_DAMAGE_SCALE'/);
 assert.match(ui,/part\.confidence==='coefficient-model'/);
 assert.match(ui,/roundingParts\?\.method==='floor-components'/);
 assert.match(ui,/const amount=Number\.isFinite\(skill\.amount\)/);
 assert.match(ui,/    '—';/);
 assert.match(ui,/Параметры умения: /);
 assert.match(ui,/final combat result|не подтверждённый итоговый результат/);
 assert.doesNotMatch(ui,/stat\.attack\s*\+=|damageTotal/);
});
