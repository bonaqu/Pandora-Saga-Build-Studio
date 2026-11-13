import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-book-skill-thresholds.js'))(host);
const C=host.PandoraOSCalculator,B=host.PandoraBookSkillThresholds;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const healing=(mastery=41)=>C.healingSpellsPreview({
 jobKey:'CLERIC',level:45,int:70,spi:95,benevolence:mastery,
 benevolenceCap:classes.CLERIC.branchCaps.benevolence,
 healingPercent:100,skillCatalog:skills
});
const action=row=>C.healingActionPreview({
 skillCatalog:skills,skillId:row.skillId
});
test('Direct healing sums the CURRENT hero calculated HP per receiver only',()=>{
 const first=healing().rows.find(r=>r.id==='firstAid');
 assert.equal(first.available,true);
 assert.equal(first.skillId,310001001);
 assert.equal(first.amount,264);
 assert.equal(first.breakdown.kind,'direct');
 assert.equal(action(first)?.mana,28);
 assert.deepEqual(B.directHealingBudget({row:first,action:action(first),
  maxMana:450}),{
   amount:264,total:4224,casts:16,maxMana:450,remainder:2,
   baseOnly:true
  });
 const party=healing(54).rows.find(r=>r.id==='healingAura');
 assert.equal(party.available,true);
 const projected=B.directHealingBudget({
  row:party,action:action(party),maxMana:450
 });
 assert.equal(projected?.casts,1);
 assert.equal(projected?.total,party.amount,
  'Party healing is per target; never invent number of recipients');
});
test('Periodic healing and invalid source or mana never create aggregate totals',()=>{
 const rows=healing().rows,periodic=rows.find(r=>r.id==='restoration');
 assert.equal(periodic.available,true);
 assert.equal(periodic.breakdown.kind,'periodic');
 assert.equal(B.directHealingBudget({row:periodic,
  action:action(periodic),maxMana:450}),null);
 const direct=rows.find(r=>r.id==='firstAid'),a=action(direct);
 const invalid=[
  [{...direct,available:false},a,450],
  [{...direct,skillId:310004001},a,450],
  [{...direct,breakdown:{kind:'periodic'}},a,450],
  [{...direct,amount:0},a,450],
  [{...direct,amount:Number.MAX_SAFE_INTEGER},a,450],
  [direct,a,0],[direct,a,450.5],[direct,{...a,mana:0},450]
 ];
 for(const [row,record,maxMana] of invalid)
  assert.equal(B.directHealingBudget({row,action:record,maxMana}),null);
});
test('Additional cast threshold is derived from full hero MP at OS base cost',()=>{
 for(const [cost,casts,required,missing] of [
  [28,16,476,26],[4,112,452,2],[30,15,480,30],[33,13,462,12]
 ])assert.deepEqual(B.nextManaUse({maxMana:450,baseCost:cost}),{
  maxMana:450,casts,required,missing,baseOnly:true
 });
 assert.equal(B.nextManaUse({maxMana:450,baseCost:0}),null);
 assert.equal(B.nextManaUse({maxMana:450.5,baseCost:4}),null);
 assert.equal(B.nextManaUse({maxMana:Number.MAX_SAFE_INTEGER,baseCost:2}),null);
});
test('Hero Book excludes crafting and material forecasts entirely',()=>{
 const book=read('pandora-studio-hero-book.js');
 const effects=book.slice(book.indexOf('function skillEffectsPage('),
  book.indexOf('function chapterNumber('));
 assert.ok(effects.includes('scalingSkillPreview'));
 assert.ok(effects.includes('directHealingBudget'));
 assert.doesNotMatch(book,/function materialSkillResults\(/);
 assert.doesNotMatch(book,/materialSkillResults\(body/);
 assert.doesNotMatch(effects,/craftingSkillPreview|trapSkillCostPreview|materialUseBudget/);
 assert.doesNotMatch(book,/stage-material-actions/);
 const wiki=read('pandora-studio-app.js');
 assert.match(wiki,/wiki-skill-source-recipe/);
 assert.match(wiki,/extra\.type==='trap'/);
 assert.match(wiki,/wiki-skill-source-material/);
});
test('One keyboard-accessible calculated skill badge opens full encyclopedia',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 assert.match(book,/interactive\?'button':'span'/);
 assert.match(book,/stage-effect-skill-link/);
 assert.match(book,/onclick:\(\)=>onSkill\(id\)/);
 assert.match(app,/onSkill:id=>openWiki\('skill',String\(id\)\)/);
 assert.match(book,/directHealingBudget/);
 assert.match(read('pandora-studio-hero-book-additions.css'),
  /button\.stage-effect-skill-link:focus-visible/);
});