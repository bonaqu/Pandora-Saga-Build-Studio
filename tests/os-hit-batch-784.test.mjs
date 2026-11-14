import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-studio-target-damage.js'))(host);
const D=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const items=JSON.parse(read('data/os/items.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const buff=(honor=0)=>({combat:{spellDamageEquipmentRate:0,priestSong:{}},
 priestApplied:{},honor:{id:honor},elementalMagic:{
  fire:honor===3?5:0,ice:honor===4?5:0,
  lightning:honor===5?5:0,poison:0,light:0,dark:0}});
const base=(extra={})=>({skillCatalog:skills,classes,monsters,tables,
 itemForth,unison,jobKey:'DISTURBANCE',level:45,masteries:{trap:41},
 branchCaps:classes.DISTURBANCE.branchCaps,stats:{dex:70,int:20},
 equipment:[],modifiers:buff(),...extra});
const trap=x=>D.crawlingTrap(base(x));
const batch=x=>D.supportedSkillHits(base(x));
const hit=(arr,id)=>arr.find(x=>x.skillId===id);
test('one shared target and gear snapshot preserves standalone trap numbers',()=>{
 for(const [dex,int,mastery] of [[70,20,41],[95,80,64],[120,110,90]]){
  const x={stats:{dex,int},masteries:{trap:mastery}};
  const standalone=trap(x),combined=hit(batch(x),240005001);
  assert.ok(standalone&&combined);
  assert.deepEqual([standalone.min,standalone.average,standalone.max],
   [combined.min,combined.average,combined.max]);
  assert.equal(standalone.bonusRate,combined.bonusRate);
 }
});
test('later batches respond to title, D1 target and equipment without stale cache',()=>{
 const mage={jobKey:'WARLOCK',level:55,
  branchCaps:classes.WARLOCK.branchCaps,
  masteries:{element:80,darkness:54,charm:26,exorcism:20},
  stats:{dex:70,int:115,spi:60}};
 const before=hit(batch(mage),410001001);
 assert.ok(before);
 assert.equal(hit(batch({...mage,modifiers:buff(3)}),410001001).honorRate,5);
 assert.equal(hit(batch({...mage,modifiers:buff(4)}),410012001).honorRate,5);
 assert.equal(hit(batch(mage),410001001).honorRate,0);
 const target=structuredClone(monsters);
 target['22104'].resists.fire=60;
 assert.ok(hit(batch({...mage,monsters:target}),410001001).average<before.average);
 assert.deepEqual(batch({...mage,monsters:{}}),[]);
 const item={record:items['1'],issue:[],refinement:10,
  gem:{type:'magical',element:'fire'},souls:[]};
 assert.ok(hit(batch({...mage,equipment:[item]}),410001001).average>before.average);
 assert.equal(hit(batch(mage),410001001).average,before.average);
});
test('changed Honor metadata never keeps an obsolete 5% school bonus',()=>{
 assert.equal(trap({modifiers:buff(3)}).honorRate,5);
 for(const change of [
  r=>r.branchRaw='OTHER',r=>r.element='FIRE',
  r=>r.powerStat='INT',r=>r.weaponUse=['BOW'],
  r=>r.classes={WARLOCK:1},r=>r.reqs=[{branch:'special',amount:1}],
  r=>r.charLevel=20,r=>r.cast=1,r=>r.range=900,r=>r.isLevelBased=false
 ]){
  const changed=structuredClone(skills);
  change(changed['950000003']);
  assert.equal(trap({skillCatalog:changed,modifiers:buff(3)}),null);
 }
 assert.equal(trap({modifiers:buff(4)}).honorRate,0);
});
test('Book stays current-build only: one target result, no recipes',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/stage-target-damage-row/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
