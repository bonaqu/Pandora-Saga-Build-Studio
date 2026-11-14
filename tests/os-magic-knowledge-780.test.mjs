import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-target-damage.js'))(host);
const D=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const mods=(ally=0,enchant=0,gear=0)=>({
 combat:{spellDamageEquipmentRate:gear,priestSong:{sageElementDamage:ally}},
 priestApplied:{priestEnchantment:{magicRate:enchant}}
});
const opt=(jobKey='WARLOCK',options={})=>({
 skillCatalog:skills,classes,jobKey,level:45,
 masteries:{element:50,darkness:25,exorcism:20,charm:20},
 branchCaps:classes[jobKey].branchCaps,
 stats:{dex:70,int:80,spi:50},equipment:[],tables,itemForth:{},
 unison:{},modifiers:mods(),...options
});
const hits=(jobKey,options)=>D.supportedSkillHits(opt(jobKey,options));
const get=(job,options,id=410001001)=>hits(job,options).find(s=>s.skillId===id);
test('Current OS magic passive exists for precisely three Lv20+ advanced mage classes',()=>{
 const rec=skills['940110001'];
 assert.equal(rec.name,'Магические знания');
 assert.equal(english.skills['940110001'].n.length>0,true);
 assert.equal(rec.charLevel,20);
 assert.equal(rec.skillType,'PASSIVE');
 assert.deepEqual(rec.funcs[0].fv1,[0,0,6,20]);
 assert.deepEqual(Object.keys(rec.classes),['WIZARD','WARLOCK','CONJURER']);
 for(const job of ['WIZARD','WARLOCK','CONJURER']){
  const h=get(job,{masteries:{element:20,darkness:0,exorcism:0,charm:0}});
  assert.ok(h,job);
  assert.equal(h.magicKnowledgeRate,20);
 }
 const none=get('MAGE',{masteries:{element:20,darkness:0,exorcism:0,charm:0}});
 assert.ok(none);
 assert.equal(none.magicKnowledgeRate,0);
 assert.equal(none.magicKnowledgeAverageGain,undefined);
 assert.equal(get('WARLOCK',{level:19}).magicKnowledgeRate,0);
});
test('Public OS elemental packet gets passive +20 in the SAME rate stage as gear and buffs',()=>{
 const spell=get('WARLOCK',{});
 assert.deepEqual([spell.min,spell.average,spell.max],[6,27,36]);
 assert.equal(spell.magicKnowledgeRate,20);
 assert.equal(spell.magicKnowledgeAverageGain,6);
 assert.equal(spell.bonusRate,20);
 // A passive is not applied to Sniper/trap; they use their own data channels.
 const other=get('MAGE',{masteries:{element:20,darkness:0,exorcism:0,charm:0}});
 assert.equal(other.bonusRate,0);
 const boosted=get('WARLOCK',{modifiers:mods(21,15)});
 assert.equal(boosted.bonusRate,56);
 assert.ok(boosted.average>spell.average);
 assert.equal(boosted.allyAverageGain,boosted.average-
  get('WARLOCK',{}).average);
 assert.ok(boosted.magicKnowledgeAverageGain>=0);
 assert.equal(boosted.allyAverageGain>0,true);
 assert.equal(boosted.magicKnowledgeAverageGain>0,true);
});
test('Source drift or impossible Sorcery-green values cannot generate fake magic damage',()=>{
 for(const change of [
  s=>s.funcs[0].fv1[3]++,
  s=>s.funcs[0].fv2[3]=1,
  s=>s.classes.WIZARD=0,
  s=>s.charLevel=19,
  s=>s.skillType='MYSELF',
  s=>s.damage={kernel:'element',slotIndex:0}
 ]){
  const modified=structuredClone(skills);
  change(modified['940110001']);
  assert.equal(get('WARLOCK',{skillCatalog:modified}),undefined);
  // No other class receives its effect.
  assert.equal(get('MAGE',{skillCatalog:modified,
   masteries:{element:20,darkness:0,exorcism:0,charm:0}}).magicKnowledgeRate,0);
 }
 assert.equal(get('WARLOCK',{masteries:{sorcery:99,element:50,darkness:25}}),undefined);
 assert.equal(get('WARLOCK',{branchCaps:{...classes.WARLOCK.branchCaps,sorcery:99}}),undefined);
});
test('Same compact Book details; no invented direct ATK/MATK addition',()=>{
 const book=read('pandora-studio-hero-book.js');
 const code=read('pandora-studio-target-damage.js');
 assert.match(book,/Магические знания/);
 assert.match(book,/Magic Knowledge/);
 assert.match(code,/sourceMagicKnowledge\(options\)/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
