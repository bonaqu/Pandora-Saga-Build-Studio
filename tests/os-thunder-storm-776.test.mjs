import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-target-damage.js'))(host);
const damage=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const fixture=(more={})=>({
 skillCatalog:skills,classes,jobKey:'WARLOCK',level:45,
 masteries:{element:70,exorcism:40},branchCaps:classes.WARLOCK.branchCaps,
 stats:{int:80,dex:70,spi:50},equipment:[],tables,itemForth:{},unison:{},
 modifiers:{combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}},
 ...more
});
const storm=more=>damage.supportedSkillHits(fixture(more))
 .find(row=>row.skillId===410026001);
test('Storm uses the current hero, both OS mastery requirements and one direct lightning hit',()=>{
 assert.equal(skills[410026001].name,'Гроза');
 assert.equal(english.skills['410026001'].n,'Thunder Storm');
 assert.equal(skills[410026001].mana,227);
 assert.deepEqual(skills[410026001].reqs,
  [{branch:'element',amount:61},{branch:'exorcism',amount:40}]);
 const result=storm();
 assert.ok(result);
 assert.deepEqual([result.min,result.average,result.max],[1,6,15]);
 assert.equal(result.monsterId,22104);
 assert.equal(result.element,'lightning');
 assert.equal(result.heroMasteryKey,'element');
 assert.equal(result.heroMastery,70);
 assert.equal(result.hitKind,'direct-part');
 assert.equal(storm({masteries:{element:80,exorcism:40}}).average,7);
 for(const mastery of [{element:60,exorcism:40},{element:70,exorcism:39},
  {element:70,exorcism:0}])
  assert.equal(storm({masteries:mastery}),undefined);
 assert.equal(storm({jobKey:'WIZARD',branchCaps:classes.WIZARD.branchCaps}),undefined);
});
test('Every Storm stage and get-on side effect is pinned; stale source hides its hit',()=>{
 const entry=damage.linkedSpells.find(x=>x.id===410026001);
 assert.deepEqual(entry.path.map(x=>x.id),[410026001,410026002,410026004]);
 assert.equal(entry.sidecars[0].node.id,410026003);
 for(const id of [410026001,410026002,410026003,410026004]){
  const changed=structuredClone(skills);
  changed[String(id)].funcs[0].fv1[3]+=1;
  assert.equal(storm({skillCatalog:changed}),undefined,'changed stage '+id);
 }
 const broken=structuredClone(skills);
 broken['410026001'].reqs[1].amount=39;
 assert.equal(storm({skillCatalog:broken}),undefined);
 const missing=structuredClone(skills);
 delete missing['410026003'];
 assert.equal(storm({skillCatalog:missing}),undefined);
});
test('No status total, duplicate effect rows or crafting content in Hero Book',()=>{
 const hits=damage.supportedSkillHits(fixture());
 assert.equal(hits.filter(row=>row.skillId===410026001).length,1);
 assert.equal(hits.find(row=>row.skillId===410026001)?.hitKind,'direct-part');
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/stage-target-damage-row/);
 assert.match(book,/hitResult\.hitKind==='direct-part'/);
 assert.doesNotMatch(book,/function materialSkillResults\(/);
});
