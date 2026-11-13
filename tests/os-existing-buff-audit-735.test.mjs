import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-remaked-buffs.js'))(host);
Function('window',read('pandora-os-character-calculator.js'))(host);
const B=host.PandoraRemakedBuffs,C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const audit=source=>auditOsSkillFormulaCoverage({
 skills:source,classes,calculator:C});
const find=(result,id)=>result.rows.find(x=>x.id===id);
const selected=(source=skills)=>({
 selected:[260008001],skills:source,jobKey:'ARCHER',level:45,
 branchCaps:classes.ARCHER.branchCaps,branchMasteries:{warding:41}
});
test('the existing +100 Evasion model requires both exact OS effects',()=>{
 const record=skills['260008001'];
 assert.equal(record.name,'Ускользание');
 assert.deepEqual(record.funcs.map(x=>x.ep),
  ['EP_AVOIDANCE_CONST','EP_LOST_WARDING_DAMAGE']);
 assert.deepEqual(B.applied(selected()).avoidance,{dodge:100});
 assert.equal(B.choices({...selected()}).find(x=>x.id===260008001).counted,true);
 const before=JSON.stringify(skills);
 const variants=[
  s=>{s.funcs[0].fv1[3]=101},
  s=>{s.funcs[1].fv1[3]=3},
  s=>{s.funcs[1].fv2[0]=1},
  s=>{s.funcs[1].dir='CASTER'},
  s=>{s.funcs.push(structuredClone(s.funcs[1]))}
 ];
 for(const mutate of variants){
  const wrong=structuredClone(skills);
  mutate(wrong['260008001']);
  assert.equal(B.applied(selected(wrong)).avoidance,undefined);
  assert.equal(B.choices({...selected(wrong)}).find(x=>x.id===260008001).counted,false);
 }
 assert.equal(JSON.stringify(skills),before);
});
test('the ordinary Remaked combat calculator receives avoidance once',()=>{
 const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
 const common={stats,jobKey:'ARCHER',level:45,weapon:{W:42,kind:'BOW'},
  skillCatalog:skills,branchMasteries:{warding:41},
  branchCaps:classes.ARCHER.branchCaps};
 const base=C.combatPreview({...common,combatBuffs:{remakedSkillIds:[]}});
 const active=C.combatPreview({...common,combatBuffs:{remakedSkillIds:[260008001,260008001]}});
 assert.equal(active.dodge.known-base.dodge.known,100);
});
test('the two previously existing abilities are audited in separate classes',()=>{
 const result=audit(skills);
 assert.deepEqual(result.summary.statuses,{
  'numeric-preview':73,'coefficient-model':27,'source-parameter':3,
  'qualitative-preview':60,'passive-source':29,
  'internal-or-triggered-source':336,'unmodeled-learnable':41
 });
 const dodge=find(result,260008001),cast=find(result,320006001);
 assert.equal(dodge.status,'numeric-preview');
 assert.deepEqual(dodge.sourceModules,['existing-self-avoidance']);
 assert.equal(cast.status,'qualitative-preview');
 assert.equal(cast.numericPreview,false);
 assert.deepEqual(cast.sourceModules,['existing-ally-casting-source']);
 assert.equal(cast.targetSideOnly,false);
});
test('both audit records reject changed FV1/FV2 and leave the other intact',()=>{
 const unchanged=audit(skills);
 const mutations=[
  [260008001,s=>{s.funcs[0].fv1[3]=101}],
  [260008001,s=>{s.funcs[1].fv2[3]=1}],
  [260008001,s=>{s.funcs[1].dir='CASTER'}],
  [320006001,s=>{s.funcs[0].fv1[0]=1}],
  [320006001,s=>{s.funcs[1].fv1[3]=51}],
  [320006001,s=>{s.funcs[1].fv2[1]=1}],
  [320006001,s=>{s.funcs.push(structuredClone(s.funcs[1]))}]
 ];
 for(const [id,mutate] of mutations){
  const wrong=structuredClone(skills);mutate(wrong[String(id)]);
  const result=audit(wrong),item=find(result,id);
  assert.equal(item.status,'unmodeled-learnable',id+' should fail closed');
  assert.deepEqual(item.sourceModules,[]);
  assert.equal(find(result,id===260008001?320006001:260008001)
   .status,id===260008001?'qualitative-preview':'numeric-preview');
  const kind=id===260008001?'numeric-preview':'qualitative-preview';
  assert.equal(result.summary.statuses[kind],
   unchanged.summary.statuses[kind]-1);
 }
});
test('Book validates both casting-source actions, never inventing a tick or damage',()=>{
 const src=read('pandora-studio-hero-book.js');
 assert.match(src,/funcs\?\.length===2&&/);
 assert.match(src,/osVector\(320006001,'EP_CANCEL_IDENTITY',\[0,0,0,0\]\)/);
 assert.match(src,/osVector\(320006001,'EP_SKILL_DELAY_FIN',\[0,0,0,50\]\)/);
 assert.match(src,/Точное время применения пока неизвестно/);
});
