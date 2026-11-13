import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-target-damage.js'))(host);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(host);
const D=host.PandoraOSTargetDamage,W=host.PandoraWikiSkillInsights;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const mods=rate=>({combat:{spellDamageEquipmentRate:rate,priestSong:{}},
 priestApplied:{}});
const opt=(overrides={})=>({
 skillCatalog:skills,classes,jobKey:'WARLOCK',level:45,
 masteries:{element:50,darkness:26,exorcism:20,charm:20},
 branchCaps:classes.WARLOCK.branchCaps,
 stats:{dex:70,int:80,spi:50},
 equipment:[],tables,itemForth,unison,modifiers:mods(0),...overrides
});
const results=override=>D.supportedSkillHits(opt(override));
const get=(rows,id)=>rows.find(r=>r.skillId===id);
const value=x=>[x?.min,x?.average,x?.max];
test('Source-locked Fire Storm and Rot: only the direct hit against Giant Ogre',()=>{
 const hits=results();
 assert.deepEqual(value(get(hits,410002001)),[10,46,61]);
 assert.deepEqual(value(get(hits,430053001)),[3,19,30]);
 for(const id of [410002001,430053001]){
  const hit=get(hits,id);
  assert.equal(hit.hitKind,'direct-part');
  assert.equal(hit.monsterId,22104);
  assert.equal(hit.levelPenalty,24);
  assert.equal(hit.heroInt,80);
  assert.equal(en.skills[String(id)].n.length>0,true);
 }
 assert.equal(get(hits,410004001),undefined,
  'Timed blast has an unresolved delay bonus; do not invent its cast total');
 assert.equal(hits.length,11);
});
test('Composite spells use the CURRENT branch, cap, class, stats and level',()=>{
 assert.equal(get(results({masteries:{element:25,darkness:25}}),410002001),undefined);
 assert.equal(get(results({masteries:{element:25,darkness:25}}),430053001),undefined);
 assert.ok(get(results({masteries:{element:26,darkness:26}}),410002001));
 assert.ok(get(results({masteries:{element:26,darkness:26}}),430053001));
 const mage=results({jobKey:'WIZARD',branchCaps:classes.WIZARD.branchCaps,
  masteries:{element:50,darkness:20}});
 assert.ok(get(mage,410002001));
 assert.equal(get(mage,430053001),undefined);
 const raised=results({stats:{dex:70,int:90,spi:65}});
 assert.ok(get(raised,410002001).max>get(results(),410002001).max);
 assert.ok(get(raised,430053001).max>get(results(),430053001).max);
});
test('Full root and linked status action signatures are source-gated, not just names',()=>{
 for(const id of [410002001,430053001]){
  const modified=structuredClone(skills);
  modified[String(id)].funcs[0].fv1[0]++;
  assert.equal(get(results({skillCatalog:modified}),id),undefined);
  const mutatedNext=structuredClone(skills);
  mutatedNext[String(id)].funcs[1].fv1[3]++;
  assert.equal(get(results({skillCatalog:mutatedNext}),id),undefined);
 }
 const burn=structuredClone(skills);
 burn['500000005'].funcs[0].fv2[3]=99;
 assert.equal(get(results({skillCatalog:burn}),410002001),undefined);
 assert.ok(get(results({skillCatalog:burn}),430053001));
 const decay=structuredClone(skills);
 decay['430053002'].funcs[0].fv1[0]=-5;
 assert.equal(get(results({skillCatalog:decay}),430053001),undefined);
 assert.ok(get(results({skillCatalog:decay}),410002001));
 const missing=structuredClone(skills);
 delete missing['430053002'];
 assert.equal(get(results({skillCatalog:missing}),430053001),undefined);
 const alteredStop=structuredClone(skills);
 alteredStop['430053002'].funcs[1].fv2[3]=2;
 assert.equal(get(results({skillCatalog:alteredStop}),430053001),undefined);
});
test('Matched fire and dark equipment buffs never leak into unrelated direct hits',()=>{
 const baseline=results();
 const gear=(school)=>[{record:{id:123321,slot:'weapon',effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE_'+school.toUpperCase(),a:40}]},
  issue:[],refinement:0,souls:[],gem:null}];
 const fire=results({equipment:gear('fire')});
 assert.ok(get(fire,410002001).max>get(baseline,410002001).max);
 assert.equal(get(fire,430053001).max,get(baseline,430053001).max);
 const dark=results({equipment:gear('dark')});
 assert.ok(get(dark,430053001).max>get(baseline,430053001).max);
 assert.equal(get(dark,410002001).max,get(baseline,410002001).max);
 const nonexistent=results({modifiers:mods(99)});
 assert.equal(nonexistent.length,0,'Forged item boost must fail closed');
});
test('Encyclopedia shows verified linked actions; Book does not import reference notes',()=>{
 const wiki=id=>W.inspect({skillCatalog:skills,classes,id,calculator:{}});
 const fire=wiki(410002001),rot=wiki(430053001),bomb=wiki(410004001);
 assert.deepEqual(fire.paths,[[410002001,500000005]]);
 assert.deepEqual(rot.paths,[[430053001,430053002]]);
 assert.deepEqual(bomb.paths,[]);
 assert.match(fire.notes[0].ru,/ожог/);
 assert.match(rot.notes[0].ru,/восстановление ОЗ/);
 assert.match(bomb.notes[0].en,/delayed/);
 assert.equal(fire.sourceOnly,true);
 const broken=structuredClone(skills);
 broken['430053002'].funcs[1].fv2[3]=6;
 assert.equal(W.inspect({skillCatalog:broken,classes,id:430053001,calculator:{}}),null);
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/прямой удар/);
 assert.match(book,/Средний прямой урон по цели/);
 assert.match(book,/gameTerms\.branchLabels/);
 assert.match(book,/gameTerms\.englishBranches/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
