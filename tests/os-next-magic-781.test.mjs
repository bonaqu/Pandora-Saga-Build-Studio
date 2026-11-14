import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-target-damage.js'))(root);
const D=root.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const modifiers={combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}};
const options=(jobKey='WARLOCK',overrides={})=>({
 skillCatalog:skills,classes,jobKey,level:45,
 masteries:{element:50,darkness:25},branchCaps:classes[jobKey].branchCaps,
 stats:{int:80,dex:70,spi:50},equipment:[],tables,itemForth:{},
 unison:{},modifiers,...overrides
});
const hit=(o,id=410001001)=>D.supportedSkillHits(o).find(x=>x.skillId===id);
test('Source-locked next-attack Concentration requires Warlock Lv45 and its OS action chain',()=>{
 assert.deepEqual(D.nextMagicConcentrationPreview(options()),
  {skillId:410000101,damageRate:35,penetration:30,mastery:50});
 assert.equal(D.nextMagicConcentrationPreview(options('WARLOCK',{level:44})),null);
 assert.equal(D.nextMagicConcentrationPreview(options('WIZARD')),null);
 const bad=structuredClone(skills);
 bad['410000101'].funcs[2].ep='EP_ALWAYS_ON';
 assert.equal(D.nextMagicConcentrationPreview(options('WARLOCK',{skillCatalog:bad})),null);
});
test('Both damage and fire penetration are applied to just the next hit',()=>{
 const base=hit(options());
 assert.deepEqual([base.min,base.average,base.max],[6,27,36]);
 const boosted=hit(options('WARLOCK',{nextMagicConcentration:true}));
 assert.ok(boosted);
 assert.equal(boosted.magicKnowledgeRate,20);
 assert.equal(boosted.nextMagicRate,35);
 assert.equal(boosted.bonusRate,55);
 assert.equal(boosted.nextMagicPenetration,30);
 assert.ok(boosted.min>=base.min&&boosted.average>base.average&&boosted.max>base.max);
 assert.equal(boosted.nextMagicAverageGain,boosted.average-base.average);
 assert.equal(hit(options()).average,base.average);
});
test('Dark gets damage increase but no fire/cold/lightning penetration',()=>{
 const base=hit(options(),430001001);
 const next=hit(options('WARLOCK',{nextMagicConcentration:true}),430001001);
 assert.ok(base&&next);
 assert.equal(next.nextMagicRate,35);
 assert.equal(next.nextMagicPenetration,0);
 assert.ok(next.average>base.average);
});
test('Unsupported build or altered source cannot get invisible extra damage',()=>{
 assert.equal(hit(options('WIZARD',{nextMagicConcentration:true})).average,
  hit(options('WIZARD')).average);
 assert.equal(hit(options('WARLOCK',{level:44,nextMagicConcentration:true})).average,
  hit(options('WARLOCK',{level:44})).average);
 const bad=structuredClone(skills);
 bad['410000101'].funcs[1].fv1[3]=31;
 assert.equal(hit(options('WARLOCK',{nextMagicConcentration:true,skillCatalog:bad})).average,
  hit(options()).average);
});
test('Saved buff flows to the existing RU/EN Book without materials or new cards',()=>{
 const app=read('pandora-studio-app.js'),book=read('pandora-studio-hero-book.js');
 assert.match(app,/nextMagicConcentration:false/);
 assert.match(app,/nextMagicConcentration:state\.attributeBuffs\?\.nextMagicConcentration===true/);
 assert.match(book,/toggle\(skills,'Сосредоточенность','nextMagicConcentration'/);
 assert.match(book,/nextMagicAverageGain/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
