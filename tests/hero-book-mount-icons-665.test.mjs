import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-hero-book.js'))(host);
Function('window',read('pandora-studio-honor-guide.js'))(host);
const C=host.PandoraOSCalculator, B=host.PandoraStageAttributes;
const stats={str:50,dex:35,agi:70,vit:40,spi:30,int:15};
const baseline={stats,level:45,jobKey:'WARRIOR',weapon:{W:100}};

test('Remaked on-foot versus mounted status never confuses item W with additive status bonus',()=>{
 const foot=C.combatPreview(baseline);
 const horse=C.combatPreview({...baseline,combatBuffs:{mounted:true}});
 assert.equal(foot.mounted.enabled,false);
 assert.equal(foot.attack.known,137);
 assert.equal(foot.attack.weaponDamage,100);
 assert.equal(horse.mounted.enabled,true);
 assert.equal(horse.mounted.rate,10);
 assert.equal(horse.attack.known,14);
 assert.equal(horse.attack.weaponDamage,100);
 assert.equal(horse.attack.walkingBase,137);
 assert.equal(horse.attack.mountedBase,14);
 assert.equal(foot.accuracy.known,80);
 assert.equal(horse.accuracy.known,8);
 assert.equal(foot.dodge.known,140);
 assert.equal(horse.dodge.known,14);
 assert.equal(foot.movementSpeed.known,100);
 assert.equal(horse.movementSpeed.known,10);
 assert.equal(foot.castingSpeed.known,115);
 assert.equal(horse.castingSpeed.known,102);
 assert.equal(horse.defense.known,null,'Remaked hides physical defense on horseback');
 assert.equal(horse.attackSpeed.known,null,'Remaked hides attack speed on horseback');
 assert.equal(foot.defense.known,0);
 assert.equal(foot.attackSpeed.known,121);
 assert.equal(horse.verified,false,'Riding is still only a partial source-backed estimate');
});

test('mounted factor follows game profession, green mastery and honor with 100% cap',()=>{
 const at50=C.combatPreview({...baseline,jobKey:'DRAGOON',combatBuffs:{mounted:true}});
 assert.equal(at50.mounted.rate,50);
 assert.equal(at50.attack.known,69);
 const at84=C.combatPreview({...baseline,jobKey:'DRAGOON',ridingMastery:24,
  honorTitle:7,combatBuffs:{mounted:true}});
 assert.equal(at84.mounted.rate,84);
 assert.equal(at84.attack.mountedBase,116);
 const full=C.combatPreview({...baseline,jobKey:'DRAGOON',ridingMastery:70,
  combatBuffs:{mounted:true}});
 assert.equal(full.mounted.rate,120);
 assert.equal(full.attack.mountedBase,137);
});

test('defense labels come from actual current OS item descriptors, not English guesses',()=>{
 const items=JSON.parse(read('data/os/items.json'));
 assert.match(items['11214'].desc,/Сопротивляемость проклятиям/);
 assert.ok(items['11214'].effects.some(e=>e.func==='EP_IMMUNE_EVIL'));
 assert.match(items['13562'].desc,/Сопротивляемость слабости/);
 assert.ok(items['13562'].effects.some(e=>e.func==='EP_IMMUNE_CURSE'));
 assert.match(items['13572'].desc,/Сопротивляемость безумию/);
 assert.ok(items['13572'].effects.some(e=>e.func==='EP_IMMUNE_RAVING'));
 const rows=B.defenseChapterGroups({resistances:{status:{evil:10,curse:5,madness:5}}})
  .flatMap(g=>g.rows);
 assert.deepEqual(rows.map(x=>x.ru),['Проклятие','Слабость','Безумие']);
 assert.deepEqual(rows.map(x=>x.en),['Curse','Weakness','Madness']);
});

test('physical and mental anomaly hover help keeps first description plus separate examples',()=>{
 const physical=host.PandoraHonorGuide.summary({},38,'Сопр. аном. тел.','Physical conditions');
 const mental=host.PandoraHonorGuide.summary({},39,'Сопр. аном. дух.','Mental conditions');
 assert.match(physical.hintRu,/^Устойчивость[^\n]+\nНапример: ожог, оглушение, заморозка, падение\./);
 assert.match(mental.hintRu,/^Устойчивость[^\n]+\nНапример: сон, немота, безумие\./);
 assert.match(physical.hintEn,/\nExamples: burn, stun/);
 assert.match(mental.hintEn,/\nExamples: sleep, silence/);
 assert.match(read('pandora-studio-theme.css'),/\.stage-guide-popup\{white-space:pre-line/);
});

test('skill effects draw original skill icons using the same catalog resolver as Path and Buffs',()=>{
 const skills=JSON.parse(read('data/os/skills.json'));
 for(const id of [310001001,310004001,310021001,310023001,310022001,910110001])
  assert.equal(skills[String(id)].iconId,id,'Original OS skill icon for '+id);
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 assert.match(book,/function gameSkillBadge\(/);
 assert.match(book,/gameSkillBadge\(hitPassive\.id\|\|910110001/);
 assert.match(book,/renderSongSkills\(body,modifiers,gameTerms,skillIconForId\)/);
 assert.match(book,/skillEffectsPage\(body,\{modifiers,gameTerms,skillIconForId\}\)/);
 assert.match(app,/skillIconForId:id=>\{/);
 assert.match(app,/return record\?skillIcon\(record\.branch,id,record\):null/);
 assert.match(book,/class:'stage-mounted-toggle'/);
 assert.match(app,/'mounted'\]\.includes\(key\)/);
 const a=B.attackChapterGroups({combat:{attack:{
  unarmed:false,weaponDamage:100},weaponPhysical:1},mountedRelease:{known:50}});
 const rows=a.flatMap(g=>g.rows);
 assert.equal(rows.find(x=>x.key==='weaponBase').value,100);
 assert.ok(!rows.some(x=>x.key==='weaponPhysical'));
 assert.equal(rows.find(x=>x.key==='mountedRelease').ru,'Характеристики верхом');
});
