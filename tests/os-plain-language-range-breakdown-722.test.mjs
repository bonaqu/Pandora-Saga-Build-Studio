import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
const C=root.PandoraOSCalculator;
const skillCatalog=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};Function('window','document',read('pandora-studio-hero-book.js'))(
 host,{documentElement:{lang:'ru'}});
const combat={attack:{walkingBase:200},defense:{directRaw:50},
 accuracy:{base:150},dodge:{base:120}};
const stats={vit:70,str:80,agi:90,dex:80,spi:70,int:70};
const preview=(job,skills=skillCatalog)=>C.scalingSkillPreview({
 skillCatalog:skills,jobKey:job,level:55,
 branchCaps:classes[job].branchCaps,
 branchMasteries:classes[job].branchCaps,
 weaponKind:job==='PREDATOR'?'CROSSBOW':'BOW',
 combat,stats
});
test('game-specific range bonuses stay singular in Skill Effects',()=>{
 const sniper=preview('SNIPER').offense.find(x=>x.id===213605001);
 const hunter=preview('PREDATOR').offense.find(x=>x.id===213703001);
 assert.ok(sniper);assert.ok(hunter);
 assert.equal(sniper.coefficientModels.filter(x=>x.ep==='EP_ATTACKRANGE_CONST').length,1);
 assert.equal(hunter.coefficientModels.filter(x=>x.ep==='EP_ATTACKRANGE_CONST').length,1);
 assert.equal(hunter.coefficientModels.filter(x=>x.ep==='EP_ATTACKCARRY_CONST').length,0);
 const source=C.skillAttackRangePreview({
  skillCatalog,jobKey:'PREDATOR',level:55,weapon:{slot:'weapon',kind:'CROSSBOW'},
  branchCaps:classes.PREDATOR.branchCaps,branchMasteries:{archery:55}});
 assert.equal(source.rows[0].sourceBonus,595);
 assert.equal(source.rows[0].sourceMasteryPart,495);
 assert.equal(source.rows[0].sourceConstant,100);
 assert.equal(source.appliedToPermanentRange,false);
});
test('Skill Effects suppresses old projections when ANY extra range action changes',()=>{
 for(const id of [213605001,213703001]){
  const broken={...skillCatalog,[id]:structuredClone(skillCatalog[id])};
  broken[id].funcs.find(x=>x.ep==='EP_ATTACKCARRY_CONST').fv1[3]++;
  const job=id===213605001?'SNIPER':'PREDATOR';
  assert.equal(preview(job,broken).offense.find(x=>x.id===id),undefined);
  const unrelated=preview(job,broken);
  assert.ok(Array.isArray(unrelated.defense));
 }
});
test('Skill Effects user explanations contain no internal formula-source names',()=>{
 for(const job of ['SNIPER','PREDATOR','WARLOCK','PRIEST','JUGGERNAUT','ASSASSIN']){
  const result=preview(job);
  for(const entry of [...result.offense,...result.defense,...result.movement,...result.utility]){
   for(const s of [entry.detailRu||'',entry.detailEn||'']){
    assert.doesNotMatch(s,/\b(?:Remaked|OS|FV1|FV2|EP_)\b/,'player description '+entry.id);
   }
  }
 }
 const book=read('pandora-studio-hero-book.js');
 assert.ok(!book.includes('базовый коэффициент +40%'));
 assert.ok(!book.includes('коэффициент масштабирования мастерства 35'));
});
test('Book skill range caption, tooltip and itemized terms share official locale names',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/guideLabel\(title,'attack\.caption\.skillRange'/);
 assert.match(book,/guideLabel\(help,'attack\.skillRangeHelp'/);
 assert.match(book,/gameSkillBadge\(row\.id,row\.name,official\?\.n,terms,english/);
 assert.match(book,/От умения: \+'/);
 assert.match(book,/gameBranchName\('archery',terms,false\)/);
 assert.match(book,/skillIconForId\}/);
 assert.ok(host.PandoraStageAttributes);
});
