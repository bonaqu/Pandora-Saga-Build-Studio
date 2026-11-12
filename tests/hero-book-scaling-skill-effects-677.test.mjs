import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const book=read('pandora-studio-hero-book.js');
const stats={vit:50,str:70,agi:70,dex:55,spi:80,int:35};
const combat={attack:{walkingBase:160},defense:{directRaw:80},
 accuracy:{base:100},dodge:{base:130}};
const inspect=(jobKey,options={})=>C.scalingSkillPreview({
 skillCatalog:skills,jobKey,level:45,branchMasteries:{},
 branchCaps:classes[jobKey]?.branchCaps||{},stats,combat,...options
});
const find=(rows,id)=>rows.find(row=>row.id===id);
const ids=rows=>rows.map(row=>row.id);

test('full OS audit includes build-dependent recipient skills and excludes all static buffs',()=>{
 const warrior=inspect('WARRIOR');
 assert.equal(find(warrior.offense,320001001).amount,42);
 assert.equal(find(warrior.offense,100055001).amount,35);
 assert.equal(find(warrior.defense,260006001).amount,34);
 const all=[...warrior.offense,...warrior.defense];
 for(const id of [260001001,260008001,260002001,213702001,320002001,
  100054001,320004001,330004001,910110001])
  assert.ok(!all.some(row=>row.id===id),'Static or passive skill leaked: '+id);
});

test('preview values do not depend on switches and never activate defensive skills',()=>{
 const knight=inspect('KNIGHT',{hasShield:false});
 const bastion=find(knight.defense,100053001);
 assert.equal(bastion.amount,32);
 assert.equal(bastion.available,false);
 assert.match(bastion.reason,/щит/);
 const equipped=find(inspect('KNIGHT',{hasShield:true}).defense,100053001);
 assert.equal(equipped.amount,32);
 assert.equal(equipped.available,true);
 const scale=find(knight.defense,168052001);
 assert.equal(scale.amount,-65);
 assert.deepEqual(combat.attack,{walkingBase:160},'inspection cannot modify attack');
 assert.deepEqual(combat.defense,{directRaw:80},'inspection cannot modify defense');
 assert.deepEqual(combat.dodge,{base:130});
});

test('only source-backed self-cast skills accessible to the job are shown',()=>{
 const priest=inspect('PRIEST',{branchMasteries:{blessing:33,exorcism:26}});
 assert.equal(find(priest.defense,320008001).amount,8);
 assert.equal(find(priest.defense,320003001).amount,-16);
 assert.equal(find(priest.offense,320007001).amount,14);
 assert.equal(find(priest.offense,330051001).amount,6);
 assert.ok(!ids(priest.offense).includes(320012001),
  'Blessing 61 is impossible for this class, never claim the skill is possible');
 const sniper=inspect('SNIPER',{branchMasteries:{archery:40,warding:45},
  weaponKind:'CROSSBOW'});
 assert.ok(Number.isFinite(find(sniper.offense,213605001).amount),
  'Sniping displays a modeled attack gain, not final live damage');
 assert.equal(find(sniper.offense,213605001).modelOnly,true);
 assert.equal(find(sniper.defense,260005001).amount,19,
  'Skill Effects use the same floored value as the selected Quick Avoidance buff');
 assert.ok(!ids(sniper.offense).includes(320011001));
});

test('the original Remaked song steps use current OS inner constants',()=>{
 const enchanter=inspect('ENCHANTER',{branchMasteries:{blessing:78,hymn:40}});
 assert.equal(find(enchanter.offense,340001001)?.amount,19);
 assert.equal(find(enchanter.offense,340004001)?.amount,13);
 const noSong=inspect('WARRIOR');
 assert.ok(!ids(noSong.offense).includes(340001001));
});

test('forged current OS coefficients fail closed',()=>{
 const forged=structuredClone(skills);
 forged['320001001'].funcs.find(x=>x.ep==='EP_DAMAGERATE_SCALE').fv1[3]=200;
 forged['320008001'].funcs.find(x=>x.ep==='EP_ARMORCLASS_CONST').fv1[0]=300;
 const out=C.scalingSkillPreview({skillCatalog:forged,jobKey:'PRIEST',level:45,
  stats,combat,branchCaps:classes.PRIEST.branchCaps,
  branchMasteries:{blessing:33}});
 assert.equal(find(out.offense,320001001),undefined);
 assert.equal(find(out.defense,320008001),undefined);
});

test('Skill Effects uses the read-only source model rather than active buff state',()=>{
 const page=book.slice(book.indexOf('function skillEffectsPage('),
  book.indexOf('// Remaked uses three DISTINCT source matrices'));
 assert.match(page,/scalingSkillPreview\?\.\(/);
 assert.match(page,/branchCaps:heroBranchCaps/);
 assert.match(page,/stats:modifiers\?\.stats,combat:modifiers\?\.combat/);
 assert.doesNotMatch(page,/if\(active\.|otherBuffs|stage-supporting-skills|supportRows/);
 assert.doesNotMatch(page,/renderSongSkills\(/);
 assert.match(page,/stage-attacking-skills/);
 assert.match(page,/stage-defensive-skills/);
});
