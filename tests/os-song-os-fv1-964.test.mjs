import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const preview=(spi,blessing,hymn,catalog=skills)=>
 C.priestCastPreviews({spi,blessing,hymn,exorcism:26,skills:catalog});
const sourceFV=(catalog,id,ep)=>
 catalog[String(id)].funcs.find(f=>f.ep===ep).fv1;
const staged=(fv,spi,rank)=>fv[3]+Math.floor(spi*fv[0]/100)+
 Math.floor(rank*fv[2]/100);

test('current OS all five priest/song components use original FV1 and Remaked separate floors',()=>{
 const original=JSON.stringify(skills);
 const encouragement=sourceFV(skills,320012001,'EP_STRENGTH_CONST');
 const peaceful=sourceFV(skills,340003003,'EP_DAMAGE_CLEAR');
 const minstrel=sourceFV(skills,340001003,'EP_TOHIT_CONST');
 const sage=sourceFV(skills,340004003,'EP_ELEMENT_DAMAGE_SCALE');
 const cooldown=sourceFV(skills,340004003,'EP_SKILL_BENCH_FIN');
 assert.deepEqual(encouragement,[0,0,10,0]);
 assert.deepEqual(peaceful,[60,0,30,10]);
 assert.deepEqual(minstrel,[13,0,13,4]);
 assert.deepEqual(sage,[8,0,8,4]);
 assert.deepEqual(cooldown,[-28,0,-17,-5]);
 let checked=0;
 for(let spi=0;spi<=225;spi+=9)
 for(let blessing=0;blessing<=90;blessing+=5)
 for(let hymn=0;hymn<=60;hymn+=10){
  const got=preview(spi,blessing,hymn);
  assert.equal(got.encouragement,staged(encouragement,0,blessing));
  assert.equal(got.peaceful,staged(peaceful,spi,hymn));
  assert.equal(got.minstrel,staged(minstrel,spi,hymn));
  assert.equal(got.sage,staged(sage,spi,hymn));
  assert.equal(got.sageCooldownDelta,cooldown[3]-
   Math.floor(spi*(-cooldown[0])/100)-
   Math.floor(hymn*(-cooldown[2])/100));
  assert.equal(got.verified,false);
  checked++;
 }
 assert.equal(checked,26*19*7);
 assert.equal(JSON.stringify(skills),original,'source JSON must never be mutated');
});

test('updated trusted OS FV1 for five numeric outputs is replayed without code editing',()=>{
 const catalog=structuredClone(skills);
 for(const ep of ['EP_STRENGTH_CONST','EP_AGILITY_CONST','EP_INTELIGENCE_CONST'])
  sourceFV(catalog,320012001,ep)[2]=15;
 sourceFV(catalog,340003003,'EP_DAMAGE_CLEAR')[0]=64;
 for(const ep of ['EP_TOHIT_CONST','EP_AVOIDANCE_CONST'])
  sourceFV(catalog,340001003,ep)[2]=19;
 sourceFV(catalog,340004003,'EP_ELEMENT_DAMAGE_SCALE')[0]=12;
 sourceFV(catalog,340004003,'EP_SKILL_BENCH_FIN')[0]=-31;
 const x=preview(134,90,30,catalog);
 assert.equal(x.encouragement,Math.floor(90*.15));
 assert.equal(x.peaceful,10+Math.floor(134*.64)+Math.floor(30*.30));
 assert.equal(x.minstrel,4+Math.floor(134*.13)+Math.floor(30*.19));
 assert.equal(x.sage,4+Math.floor(134*.12)+Math.floor(30*.08));
 assert.equal(x.sageCooldownDelta,-5-Math.floor(134*.31)-Math.floor(30*.17));
 const song=C.songSkillPreview({skillCatalog:catalog,jobKey:'CLERIC',
  level:55,branchCaps:classes.CLERIC.branchCaps,
  branchMasteries:classes.CLERIC.branchCaps});
 assert.ok(song.rows.some(r=>r.key==='peaceful'&&r.available));
 assert.ok(song.rows.some(r=>r.key==='minstrel'&&r.available));
});

test('all 28 jobs × Lv 1–55 retain strict linked song requirements, no automatic game-buff grant',()=>{
 let scanned=0;
 for(const [jobKey,job] of Object.entries(classes))
 for(let level=1;level<=55;level++){
  const out=C.songSkillPreview({skillCatalog:skills,jobKey,level,
   branchCaps:job.branchCaps,branchMasteries:job.branchCaps});
  assert.ok(Array.isArray(out.rows));
  assert.equal(out.verified,false);
  assert.ok(out.rows.every(row=>row.active===false&&row.verified===false));
  for(const row of out.rows){
   const source=skills[String(row.id)];
   assert.equal(source.classes[jobKey],1);
  }
  scanned++;
 }
 assert.equal(scanned,1540);
});

test('invalid family direction, unsigned inversion, new level channel, changed child link or unequal trio fail closed',()=>{
 const invalid=[
  [320012001,'encouragement',c=>{sourceFV(c,320012001,'EP_AGILITY_CONST')[2]=11}],
  [320012001,'encouragement',c=>{sourceFV(c,320012001,'EP_STRENGTH_CONST')[1]=3}],
  [340003003,'peaceful',c=>{sourceFV(c,340003003,'EP_DAMAGE_CLEAR')[1]=1}],
  [340003003,'peaceful',c=>{sourceFV(c,340003003,'EP_DAMAGE_CLEAR')[0]=-1}],
  [340001003,'minstrel',c=>{sourceFV(c,340001003,'EP_TOHIT_CONST')[2]=12}],
  [340001003,'minstrel',c=>{c['340001003'].funcs[0].fv2[3]=3}],
  [340004003,'sage',c=>{sourceFV(c,340004003,'EP_ELEMENT_DAMAGE_SCALE')[2]=-1}],
  [340004003,'sageCooldownDelta',c=>{sourceFV(c,340004003,'EP_SKILL_BENCH_FIN')[0]=1}],
  [340004002,'sage',c=>{sourceFV(c,340004002,'EP_SKILL_EXEC')[3]+=1}]
 ];
 for(const [id,key,change] of invalid){
  const corrupt=structuredClone(skills);
  change(corrupt);
  const x=preview(134,90,30,corrupt);
  assert.equal(x[key],null,String(id)+' '+key);
 }
 // Malformed song chain must not turn a bad source coefficient into
 // a permanent character effect or a fake learned ability.
 const bad=structuredClone(skills);
 bad['340001001'].funcs[0].fv1[3]=340004002;
 const song=C.songSkillPreview({skillCatalog:bad,jobKey:'CLERIC',
  level:55,branchCaps:classes.CLERIC.branchCaps,
  branchMasteries:classes.CLERIC.branchCaps});
 assert.ok(!song.rows.some(r=>r.key==='minstrel'));
});

test('source-derived individual recipient values do not change unrelated models',()=>{
 const original=preview(134,90,30);
 const x=structuredClone(skills);
 sourceFV(x,340004003,'EP_ELEMENT_DAMAGE_SCALE')[0]=13;
 const updated=preview(134,90,30,x);
 assert.equal(updated.sage,4+Math.floor(134*.13)+Math.floor(30*.08));
 assert.equal(updated.enchantAuraRate,original.enchantAuraRate);
 assert.equal(updated.enchantAuraFlat,original.enchantAuraFlat);
 assert.equal(updated.holyWeapon,original.holyWeapon);
 assert.equal(updated.lapisMedio,original.lapisMedio);
 assert.equal(updated.gratia,original.gratia);
});
