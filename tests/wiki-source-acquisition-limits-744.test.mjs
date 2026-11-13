import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(host);
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const inspect=(id,catalog=skills,jobs=classes,calc=host.PandoraOSCalculator)=>
 host.PandoraWikiSkillInsights.inspect({skillCatalog:catalog,classes:jobs,
  id,calculator:calc});
test('the classless OS Speedy Gale is documented without duplicating the party bonus',()=>{
 const result=inspect(260006002);
 assert.equal(skills[260006002].name,'Помощь ветра');
 assert.equal(english[260006002].n,'Speedy Gale');
 assert.equal(result?.accessNotice?.kind,'no-class-variant');
 assert.equal(result.accessNotice.relatedSkillId,260006001);
 assert.equal(result.sourceOnly,true);
 assert.equal(result.finalAmount,null);
 assert.deepEqual(result.notes,[]);
 assert.deepEqual(result.extra,[]);
 assert.match(result.accessNotice.ru,/нет профессий/);
 assert.match(result.accessNotice.en,/no assigned classes/);
 const a=skills[260006001],b=skills[260006002];
 assert.equal(Object.keys(b.classes).length,0);
 assert.deepEqual(a.funcs,b.funcs);
});
test('both OS barrier sources have Healing 102 above the greatest current class cap',()=>{
 const caps=Object.values(classes).map(x=>x.branchCaps.benevolence||0);
 assert.equal(Math.max(...caps),90);
 for(const [id,ep,vec,name] of [
  [300001001,'EP_SPECIAL_WARDING',[0,0,0,100],'Преграда'],
  [300002001,'EP_ELEMENT_BARRIER',[0,0,0,1],'Магическая преграда']]){
  const s=skills[id],info=inspect(id);
  assert.equal(s.name,name);
  assert.equal(s.reqs[0].amount,102);
  assert.equal(s.funcs[0].ep,ep);
  assert.deepEqual(s.funcs[0].fv1,vec);
  assert.equal(info?.accessNotice?.kind,'above-class-cap');
  assert.equal(info.accessNotice.required,102);
  assert.equal(info.accessNotice.maximum,90);
  assert.match(info.accessNotice.ru,/Особые способы.+не подтверждены/);
  assert.match(info.accessNotice.en,/Special acquisition methods are unverified/);
  assert.equal(info.finalAmount,null);
  assert.deepEqual(info.notes,[]);
 }
});
test('access notes fail closed for modified game functions and increased class limits',()=>{
 const mutations=[
  x=>{x[260006002].funcs[0].fv1[3]=16},
  x=>{x[260006002].classes={MONK:1}},
  x=>{x[300001001].funcs[0].fv2[3]++},
  x=>{x[300002001].reqs[0].amount=101}
 ];
 for(const [i,mutate] of mutations.entries()){
  const changed=structuredClone(skills);mutate(changed);
  const id=i<2?260006002:i===2?300001001:300002001;
  assert.equal(inspect(id,changed),null,
   'mutated source must not keep acquisition notice '+id);
 }
 const jobs=structuredClone(classes);
 jobs.CLERIC.branchCaps.benevolence=102;
 assert.equal(inspect(300001001,skills,jobs),null);
 assert.equal(inspect(300002001,skills,jobs),null);
});
test('three inaccessible entries need no expensive class-maximum combat simulations',()=>{
 const calculator=new Proxy({},{
  get(_target,name){
   if(name===Symbol.toStringTag)return undefined;
   throw Error('Do not run unrelated game previews for source-only access notes: '+String(name));
  }
 });
 for(const id of [260006002,300001001,300002001])
  assert.ok(inspect(id,skills,classes,calculator).accessNotice);
});
test('Wiki-only advice keeps all other numerical models and audit statuses unchanged',()=>{
 const report=auditOsSkillFormulaCoverage({
  skills,classes,calculator:host.PandoraOSCalculator});
 assert.equal(report.summary.skillRecords,569);
 assert.equal(report.summary.statuses['numeric-preview'],74);
 assert.equal(report.summary.statuses['qualitative-preview'],97);
 assert.equal(report.summary.statuses['unmodeled-learnable'],3);
 assert.deepEqual(report.rows.filter(x=>x.status==='unmodeled-learnable')
  .map(x=>x.id),[260006002,300001001,300002001]);
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 assert.match(app,/wiki-skill-access-notice/);
 assert.match(app,/access\.relatedSkillId/);
 assert.doesNotMatch(book,/wiki-skill-access-notice/);
});
