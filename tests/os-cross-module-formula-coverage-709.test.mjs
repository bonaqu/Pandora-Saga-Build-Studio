import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const calculator=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const report=(catalog=skills)=>auditOsSkillFormulaCoverage({
 skills:catalog,classes,calculator});
const row=(report,id)=>report.rows.find(x=>x.id===id);

test('cross-module census counts modeled OS abilities once regardless of UI tab',()=>{
 const audit=report();
 assert.equal(audit.summary.skillRecords,569);
 assert.equal(audit.summary.effectRecords,1070);
 assert.equal(audit.summary.uniqueEffectTypes,283);
 assert.equal(audit.summary.inspectedClasses,28);
 assert.ok(audit.summary.statuses['unmodeled-learnable']<=55,
  'cross-module coverage and triggered OS helper classification must be complete');
 assert.ok(audit.summary.statuses['numeric-preview']>=69);
 assert.equal(audit.summary.statuses['source-parameter'],3);
 for(const id of [100061001,440008001,440006001]){
  const source=row(audit,id);
  assert.equal(source.status,'source-parameter',String(id));
  assert.deepEqual(source.sourceModules,['skill-effects']);
  assert.equal(source.numericPreview,false);
 }
 assert.match(audit.methodology,/cross-module census/);
 assert.match(audit.certainty,/NOT server parity proof/);
 for(const entry of audit.rows){
  assert.ok(Array.isArray(entry.sourceModules));
  assert.equal(new Set(entry.sourceModules).size,entry.sourceModules.length,
   'a skill has one audited provenance per module');
  if(entry.sourceModules.length)assert.equal(entry.sourcePreview,true);
 }
});
test('all current OS healing ranks remain source-backed in separate Remaked stage',()=>{
 const audit=report();
 for(const id of [310001001,310001002,310004001,310004002,
  310021001,310021002,310023001]){
  const item=row(audit,id);
  assert.ok(item.sourceModules.includes('healing-spells'),id+' has own formula');
  assert.equal(item.numericPreview,true);
  assert.equal(item.status,'numeric-preview');
  assert.equal(item.targetSideOnly,false);
 }
 assert.equal(row(audit,310023002).status,'internal-or-triggered-source',
  'Sanctuary execution helper has no caster class and is triggered by 310023001');
 assert.equal(row(audit,310023002).triggeredChild,true);
});
test('periodic recovery, song sources and duplicate family IDs retain provenance',()=>{
 const audit=report();
 const restoration=row(audit,310022001);
 assert.ok(restoration.sourceModules.includes('healing-spells'));
 assert.ok(restoration.sourceModules.includes('periodic-recovery'));
 assert.equal(restoration.sourceModules.filter(x=>x==='periodic-recovery').length,1);
 for(const id of [310002001,330005001])
  assert.ok(row(audit,id).sourceModules.includes('periodic-recovery'));
 assert.ok(row(audit,340001001).sourceModules.includes('song-source'));
 assert.equal(row(audit,100058001).coefficientModel,true);
 assert.equal(row(audit,410011001).coefficientModel,false,
  'unsupported secondary spell coefficient must stay unmodeled');
});
test('enemy-target resistance is counted without mislabeling it a permanent passive',()=>{
 const audit=report();
 for(const id of [410003001,410015001,410025001,430054001,440005501]){
  const item=row(audit,id);
  assert.equal(item.sourceModules.includes('target-resistance'),true);
  assert.equal(item.numericPreview,true,'source signed magnitude is available');
  assert.equal(item.targetSideOnly,true,'incoming enemy spell is NOT own passive');
 }
 assert.equal(row(audit,330004001).targetSideOnly,false,
  'Divine Blessing is a separate ally/party source');
 assert.equal(row(audit,330004001).sourceModules.includes('target-resistance'),true);
});
test('mutations of OS source coefficients remove only the affected coverage',()=>{
 const before=report();
 const changedHealing=structuredClone(skills);
 changedHealing['310004001'].funcs[0].fv1[0]+=1;
 const invalidHealing=report(changedHealing);
 assert.equal(row(invalidHealing,310004001).sourceModules.includes('healing-spells'),false);
 assert.equal(row(invalidHealing,310004002).sourceModules.includes('healing-spells'),true);
 assert.ok(invalidHealing.summary.statuses['unmodeled-learnable']>
  before.summary.statuses['unmodeled-learnable']);
 const changedResistance=structuredClone(skills);
 changedResistance['410003001'].funcs[0].fv2[3]=10;
 const invalidResistance=report(changedResistance);
 assert.equal(row(invalidResistance,410003001).sourceModules.includes('target-resistance'),false);
 assert.equal(row(invalidResistance,410015001).sourceModules.includes('target-resistance'),true);
 const changedPeriodic=structuredClone(skills);
 changedPeriodic['310002001'].funcs[0].fv2[3]=99;
 assert.equal(row(report(changedPeriodic),310002001).sourceModules.includes('periodic-recovery'),false);
});
test('already applied party buffs appear once in the cross-module source audit',()=>{
 const audit=report();
 const repose=row(audit,320002001),life=row(audit,320005001);
 assert.equal(repose.name,'Благословенный покой');
 assert.equal(life.name,'Знак жизни');
 for(const [item,module] of [
  [repose,'party-recovery-buff'],[life,'party-max-hp-buff']
 ]){
  assert.equal(item.status,'numeric-preview');
  assert.equal(item.numericPreview,true);
  assert.equal(item.targetSideOnly,false,'Party buff is not an incoming enemy debuff');
  assert.deepEqual(item.sourceModules,[module]);
 }
 assert.equal(audit.summary.statuses['numeric-preview'],72);
 assert.equal(audit.summary.statuses['unmodeled-learnable'],50);

 // Check the actual existing models, not invented replacement formulas.
 const originalBuffs={};
 Function('window',read('pandora-studio-remaked-buffs.js'))(originalBuffs);
 const applied=originalBuffs.PandoraRemakedBuffs.applied({
  selected:[320002001],skills,jobKey:'WARRIOR',level:1,
  branchMasteries:{},branchCaps:classes.WARRIOR.branchCaps});
 assert.deepEqual(applied.blessedRepose,{manaRecoverySpeed:90},
  '90 means recovery speed index, not 90 MP per tick');
 const tables=JSON.parse(read('data/os/tables.json'));
 const params={classData:classes.WARRIOR,raceData:tables.raceInit.ELF,
  jobData:tables.jobInit.WARRIOR,
  allocation:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},
  level:45,records:[]};
 const before=calculator.base({...params,enhancements:{lifeSign:false}});
 const after=calculator.base({...params,enhancements:{lifeSign:true}});
 assert.ok(before&&after);
 assert.equal(after.hp-before.hp,250+Math.floor(before.hpBase*15/100));
 assert.equal(after.mp,before.mp);
});
test('party source audit rejects mutated FV1/FV2/direction and preserves unrelated buffs',()=>{
 const initial=report();
 const edits=[
  [320002001,source=>{source.funcs[0].fv1[3]=91}],
  [320002001,source=>{source.funcs[0].dir='CASTER'}],
  [320002001,source=>{source.funcs[0].fv2[0]=1}],
  [320005001,source=>{source.funcs[1].fv1[3]=16}],
  [320005001,source=>{source.funcs[0].fv2[3]=1}],
  [320005001,source=>{source.funcs.push(structuredClone(source.funcs[0]))}]
 ];
 for(const [id,mutate] of edits){
  const changed=structuredClone(skills);
  mutate(changed[String(id)]);
  const next=report(changed);
  assert.equal(row(next,id).status,'unmodeled-learnable',String(id));
  assert.deepEqual(row(next,id).sourceModules,[]);
  const other=id===320002001?320005001:320002001;
  assert.equal(row(next,other).status,'numeric-preview','Unrelated buff must survive');
  assert.equal(next.summary.statuses['numeric-preview'],
   initial.summary.statuses['numeric-preview']-1);
  assert.equal(next.summary.statuses['unmodeled-learnable'],
   initial.summary.statuses['unmodeled-learnable']+1);
 }
});
test('missing formula module aborts the census rather than inventing unmodeled sources',()=>{
 const {healingSpellsPreview,...missing}=calculator;
 assert.throws(()=>auditOsSkillFormulaCoverage({skills,classes,calculator:missing}),
  /all OS formula inspectors/);
});
test('audit leaves OS source immutable and produces deterministic statuses',()=>{
 const source=JSON.stringify(skills),caps=JSON.stringify(classes);
 assert.deepEqual(report(),report());
 assert.equal(JSON.stringify(skills),source);
 assert.equal(JSON.stringify(classes),caps);
 assert.equal(report().summary.statuses['internal-or-triggered-source'],336);
});
