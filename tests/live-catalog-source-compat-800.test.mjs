import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const older=JSON.parse(read('data/catalog-history/pre-2026-11-15/skills.json'));
const live=JSON.parse(read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/skills.json'));
const classes=JSON.parse(read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/classes.json'));
const oldClasses=JSON.parse(read('data/catalog-history/pre-2026-11-15/classes.json'));
const candidates=[['bundled historical',older,oldClasses],['published D1',live,classes]];
const hymn=(catalog,job)=>C.songSkillPreview({
 skillCatalog:catalog,jobKey:job,level:55,
 branchCaps:classes[job].branchCaps,branchMasteries:classes[job].branchCaps
});

test('Inspiration receives identical SOURCE 50 with one or two exact effects',()=>{
 for(const [label,catalog] of candidates){
  const output=C.alliedInspirationPreview({skillCatalog:catalog});
  assert.deepEqual(output,{
   id:320006001,castTimePercent:50,castTimeReductionPercent:50,
   speedMultiplier:2,sourceConfirmed:true
  },label);
 }
 assert.equal(older[320006001].funcs.length,2);
 assert.equal(live[320006001].funcs.length,1);
 for(const change of [
  row=>row.funcs[0].fv1[3]=49,
  row=>row.funcs[0].fv2[3]=1,
  row=>row.funcs.push({...row.funcs[0],ep:'EP_CANCEL_IDENTITY'}),
  row=>row.reqs[0].amount=53,
  row=>row.learnable=false
 ]){
  const altered=structuredClone(live);
  change(altered[320006001]);
  assert.equal(C.alliedInspirationPreview({skillCatalog:altered}),null);
 }
});

test('two full hymn source controls preserve recipient-side magnitudes',()=>{
 for(const [label,catalog] of candidates){
  const cleric=hymn(catalog,'CLERIC');
  const enchanter=hymn(catalog,'ENCHANTER');
  assert.deepEqual(cleric.rows.map(row=>row.id),[340001001,340003001,340001004],label);
  assert.deepEqual(enchanter.rows.map(row=>row.id),[340001001,340004001,340001004],label);
  assert.ok([...cleric.rows,...enchanter.rows].every(row=>row.active===false),
   'Browsing a song must not activate a buff on the hero');
  const values=C.priestCastPreviews({spi:134,blessing:71,hymn:30,exorcism:26,skills:catalog});
  assert.equal(values.peaceful,99,label);
  assert.equal(values.minstrel,4+Math.floor(134*.13)+Math.floor(30*.13),label);
  assert.equal(values.sage,4+Math.floor(134*.08)+Math.floor(30*.08),label);
  assert.equal(values.sageCooldownDelta,-(5+Math.floor(134*.28)+Math.floor(30*.17)),label);
 }
 const skills=structuredClone(live);
 skills[340001001].funcs[3].fv2[0]=1;
 assert.equal(hymn(skills,'CLERIC').rows.some(r=>r.id===340001001),false);
 const alt=structuredClone(live);
 alt[340003001].funcs[0].fv2[3]=3;
 assert.equal(C.alliedPeaceSongPreview({spi:134,hymn:30,skills:alt,classes}),null);
 const alternate=structuredClone(live);
 alternate[340001004].funcs[3].fv2[2]=1;
 assert.equal(hymn(alternate,'CLERIC').rows.some(r=>r.id===340001004),false);
 const unknown=structuredClone(live);
 unknown[340004001].funcs[3].ep='EP_UNKNOWN_NEW_EFFECT';
 assert.equal(hymn(unknown,'ENCHANTER').rows.some(r=>r.id===340004001),false);
});

test('new D1 Psychic Blade upgrade keeps exact linked proof and current cooldown',()=>{
 for(const [label,catalog] of candidates){
  const p=C.specializedSkillPreview({
   skillCatalog:catalog,jobKey:'CONJURER',level:55,
   branchCaps:classes.CONJURER.branchCaps,
   branchMasteries:classes.CONJURER.branchCaps
  });
  const row=p.magic.find(x=>x.id===420005002);
  assert.ok(row,'Missing approved source-only skill: '+label);
  assert.equal(row.cooldown,catalog[420005002].cooldown);
  assert.equal(row.mana,catalog[420005002].mana);
  assert.equal(row.finalAmount,null);
  assert.equal(row.appliedToHero,false);
 }
 assert.equal(older[420005002].cast,3.5);
 assert.equal(live[420005002].cast,2);
 assert.equal(older[420005002].cooldown,10);
 assert.equal(live[420005002].cooldown,12);
 for(const change of [
  row=>row.cooldown=13,row=>row.cast=3,
  row=>row.funcs[0].fv1[3]++,
  row=>row.reqs[0].amount++
 ]){
  const corrupted=structuredClone(live);
  change(corrupted[420005002]);
  const result=C.specializedSkillPreview({
   skillCatalog:corrupted,jobKey:'CONJURER',level:55,
   branchCaps:classes.CONJURER.branchCaps,
   branchMasteries:classes.CONJURER.branchCaps
  });
  assert.ok(result.rejected.includes(420005002));
  assert.equal(result.magic.some(x=>x.id===420005002),false);
 }
});

test('current game ID and caster cap changes remain explicit, not fabricated',()=>{
 assert.deepEqual(Object.keys(live).filter(id=>!Object.hasOwn(older,id)),
  ['420007101','420007102']);
 assert.equal(live[420007101].funcs[0].fv1[3],420007102);
 assert.equal(live[420007102].learnable,false);
 assert.equal(classes.CONJURER.branchCaps.warding,10);
 assert.equal(oldClasses.CONJURER.branchCaps.warding,5);
 assert.deepEqual(live[420004002].funcs.map(x=>x.ep),[
  'EP_CASTINGCANCEL_RESISTANCE_CONST','EP_ALL_RESISTANCE_CONST'
 ]);
 assert.equal(live[420004002].cast,1);
 assert.equal(older[420004002].cast,5);
 // New skill data does not itself establish a hit roll, sleep probability
 // or final AoE damage. No numeric skill is auto-added to the hero.
});

test('formula audit covers current Inspiration as source-only on both snapshots',()=>{
 for(const [label,skills,classData] of candidates){
  const audit=auditOsSkillFormulaCoverage({skills,classes:classData,calculator:C});
  const inspiration=audit.rows.find(row=>row.id===320006001);
  assert.ok(inspiration,label);
  assert.ok(inspiration.sourceModules.includes('existing-ally-casting-source'),label);
  assert.equal(inspiration.status,'qualitative-preview',label);
 }
});
