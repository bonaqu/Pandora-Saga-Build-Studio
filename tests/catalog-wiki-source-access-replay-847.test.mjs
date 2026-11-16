import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const window={};
for(const path of ['pandora-os-character-calculator.js',
 'pandora-studio-wiki-skill-insights.js',
 'pandora-studio-attribute-progression.js',
 'pandora-studio-skill-progression.js','pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(path),{window});
const C=window.PandoraOSCalculator,W=window.PandoraWikiSkillInsights,
 S=window.PandoraCatalogSafety;
const load=n=>JSON.parse(read('data/os/'+n+'.json'));
const source={skills:load('skills'),classes:load('classes'),tables:load('tables')};
const inspect=(skills=source.skills,classes=source.classes)=>
 auditOsSkillFormulaCoverage({skills,classes,calculator:C,wikiInsights:W});
const byId=(report,id)=>report.rows.find(row=>row.id===id);
test('all 571 game skills have an honest classed source status or access limit',()=>{
 const original=JSON.stringify(source);
 const report=inspect();
 assert.equal(report.summary.skillRecords,571);
 assert.equal(report.summary.statuses['source-access-limited'],3);
 assert.equal(report.summary.statuses['unmodeled-learnable'],0);
 assert.deepEqual(report.rows.filter(x=>x.status==='source-access-limited').map(x=>x.id),
  [260006002,300001001,300002001]);
 for(const id of [260006002,300001001,300002001]){
  const result=byId(report,id);
  assert.equal(result.numericPreview,false);
  assert.equal(result.sourcePreview,false);
  assert.equal(result.sourceModules.length,0);
  assert.equal(result.coefficientModel,false);
 }
 assert.equal(JSON.stringify(source),original);
});
test('Wind Aid is not double-counted and the two barriers exceed current class caps',()=>{
 const report=inspect();
 const wind=byId(report,260006002);
 assert.equal(wind.accessNoticeKind,'no-class-variant');
 assert.equal(wind.relatedSkillId,260006001);
 for(const id of [300001001,300002001]){
  const row=byId(report,id);
  assert.equal(row.accessNoticeKind,'above-class-cap');
  assert.equal(row.accessRequired,102);
  assert.equal(row.accessMaximum,90);
 }
});
test('all three access notices fail closed after linked FV or requirement drift',()=>{
 for(const [id,mutation] of [
  [260006002,s=>{s.funcs[0].fv1[3]++;}],
  [300001001,s=>{s.funcs[0].fv1[3]++;}],
  [300002001,s=>{s.reqs[0].amount=90;}]
 ]){
  const next=structuredClone(source.skills);
  mutation(next[String(id)]);
  const report=inspect(next);
  assert.equal(byId(report,id).status,'unmodeled-learnable',String(id));
  assert.equal(byId(report,id).accessNoticeKind,undefined);
  const replay=S.replaySkills(source,{...source,skills:next});
  assert.equal(replay.ok,false,String(id)+' lost published access evidence');
  assert.ok(replay.lostByModule['source-access-notice']>=1);
  assert.ok(replay.lostEntries.some(row=>row.id===String(id)));
 }
});
test('editing parent Wind Aid removes inaccessible variant evidence before D1',()=>{
 const next=structuredClone(source.skills);
 next['260006001'].funcs[0].fv1[3]++;
 const report=S.replaySkills(source,{...source,skills:next});
 assert.equal(report.ok,false);
 assert.ok(report.lostEntries.some(row=>row.id==='260006002'&&
  row.module==='source-access-notice'));
});
test('metadata-only updates preserve the three access notices and no combat model appears',()=>{
 const next=structuredClone(source.skills);
 for(const id of [260006002,300001001,300002001])next[id].mana++;
 const before=JSON.stringify(source),after={...source,skills:next};
 const replay=S.replaySkills(source,after);
 assert.equal(replay.ok,true);
 assert.equal(replay.lostByModule['source-access-notice']??0,0);
 assert.equal(replay.accessNoticesChecked,3);
 const compatibility=S.compatibility(source,after);
 assert.equal(compatibility.totals.sourceOnly,3);
 assert.equal(compatibility.totals.verified,0);
 assert.equal(JSON.stringify(source),before);
});
test('the independent old auditor remains conservative without Wiki access data',()=>{
 const plain=auditOsSkillFormulaCoverage({
  skills:source.skills,classes:source.classes,calculator:C});
 assert.equal(plain.summary.statuses['source-access-limited'],0);
 assert.equal(plain.summary.statuses['unmodeled-learnable'],3);
});
