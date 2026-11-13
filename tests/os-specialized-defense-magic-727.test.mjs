import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const cases=[
 [168001004,'Блокирование','Blocking','defense'],
 [168002002,'Защита в движении','Defensive March','defense'],
 [168003001,'Удар щитом','Shield Bash','defense'],
 [168051001,'Автозащита','Auto-guard','defense'],
 [420001001,'Озарение','Soul Bright','magic'],
 [420001002,'Озарение','Soul Bright','magic'],
 [420005001,'Летящее лезвие','Psychic Blade','magic'],
 [420005002,'Летящее лезвие','Psychic Blade','magic']
];
const inspect=(job,catalog=skills,level=55,ranks=classes[job].branchCaps)=>
 C.specializedSkillPreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:classes[job].branchCaps,branchMasteries:ranks,
  branchLabels:meta.branchLabels,englishBranches:en.branches});
const find=(data,id)=>[...data.defense,...data.magic].find(x=>x.id===id);
const owner=id=>Object.keys(classes).find(j=>find(inspect(j),id));
test('all eight skill identities have canonical RU/EN names and source-only previews',()=>{
 for(const [id,ru,english,kind] of cases){
  assert.equal(skills[id].name,ru,id);
  assert.equal(en.skills[id].n,english,id);
  const job=owner(id);assert.ok(job,'no class '+id);
  const result=inspect(job),row=find(result,id);
  assert.ok(result[kind].some(x=>x.id===id));
  assert.equal(row.mana,skills[id].mana);
  assert.equal(row.cooldown,skills[id].cooldown);
  assert.equal(row.sourceOnly,true);
  assert.equal(row.finalAmount,null);
  assert.equal(row.appliedToHero,false);
  assert.ok(row.noteRu.length>10&&row.noteEn.length>10);
 }
 assert.equal(skills[168001004].prereq,168001001);
 assert.equal(skills[168002002].prereq,168002001);
 assert.equal(skills[420001002].prereq,420001001);
 assert.equal(skills[420005002].prereq,420005001);
 assert.equal(skills[420001002].funcs.find(f=>f.ep==='EP_SKILL_EXEC').fv1[3],420001003);
 assert.equal(skills[420005001].funcs.find(f=>f.ep==='EP_SKILL_EXEC_DIFFUSION').fv1[3],420005004);
 assert.equal(skills[420005002].funcs.find(f=>f.ep==='EP_SKILL_EXEC_DIFFUSION').fv1[3],420005003);
});
test('mutating root, triggered child or prerequisite fails closed',()=>{
 const corrupt=[
  s=>s.funcs[0].fv1[3]++,
  s=>s.funcs[0].fv2[2]++,
  s=>s.funcs[0].dir='WRONG',
  s=>s.funcs.push(structuredClone(s.funcs[0])),
  s=>s.mana++,s=>s.cooldown++,s=>s.charLevel++,
  s=>s.reqLevel++,s=>s.learnable=false,
  s=>s.reqs.push({branch:'embody',amount:99}),
  s=>{s.classes[Object.keys(s.classes)[0]]=0}
 ];
 for(const [id] of cases)for(const mutate of corrupt){
  const changed={...skills,[id]:structuredClone(skills[id])};
  mutate(changed[id]);
  const result=inspect(owner(id),changed);
  assert.equal(find(result,id),undefined,'stale source '+id);
  assert.ok(result.rejected.includes(id));
 }
 for(const [root,dep] of [[168001004,168001001],[168002002,168002001],
  [420001002,420001001],[420001002,420001003],
  [420005001,420005004],[420005002,420005001],
  [420005002,420005003]]){
  const changed={...skills,[dep]:structuredClone(skills[dep])};
  changed[dep].funcs[0].fv1[3]++;
  const result=inspect(owner(root),changed);
  assert.equal(find(result,root),undefined,'stale linked source '+root);
  assert.ok(result.rejected.includes(root));
 }
});
test('class caps, level 45/50 and branch mastery remain independent requirements',()=>{
 const paladin=inspect('PALADIN',skills,44);
 assert.equal(find(paladin,168001004).requirementsMet,false);
 assert.match(find(paladin,168001004).reasonRu,/Нужен уровень 45/);
 assert.equal(find(inspect('PALADIN',skills,45),168001004).requirementsMet,true);
 assert.equal(find(inspect('CONJURER',skills,49),420005002).requirementsMet,false);
 assert.equal(find(inspect('CONJURER',skills,50),420005002).requirementsMet,true);
 const low={...classes.CONJURER.branchCaps,embody:40};
 assert.equal(find(inspect('CONJURER',skills,55,low),420005001).requirementsMet,false);
 assert.equal(find(inspect('CONJURER',skills,55,low),420005002).requirementsMet,false);
 assert.equal(find(inspect('WARRIOR'),420005001),undefined);
});
test('400 synthetic class/level/mastery combinations leave permanent stats unchanged',()=>{
 const initial=JSON.stringify(skills),jobs=Object.keys(classes);
 for(let i=0;i<400;i++){
  const job=jobs[i%jobs.length],caps=classes[job].branchCaps,level=i%55+1;
  const ranks=Object.fromEntries(Object.entries(caps).map(([b,max])=>[b,Math.min(max,i%91)]));
  const result=inspect(job,skills,level,ranks);
  for(const row of [...result.defense,...result.magic]){
   const s=skills[row.id];
   const ready=level>=s.charLevel&&s.reqs.every(r=>ranks[r.branch]>=r.amount);
   assert.equal(row.requirementsMet,ready);
   assert.equal(row.finalAmount,null);
   assert.equal(row.appliedToHero,false);
  }
 }
 assert.equal(JSON.stringify(skills),initial);
});
test('eight distinct IDs improve cross-module coverage without duplicate models',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(report.summary.statuses['numeric-preview'],65);
 assert.equal(report.summary.statuses['qualitative-preview'],38);
 assert.equal(report.summary.statuses['unmodeled-learnable'],71);
 for(const [id] of cases){
  const row=report.rows.find(x=>x.id===id);
  assert.equal(row.status,'qualitative-preview');
  assert.deepEqual(row.sourceModules,['specialized-skill-source']);
 }
});
test('localized Book has two compact groups and uses standard skill tooltips',()=>{
 const src=read('pandora-studio-hero-book.js');
 for(const phrase of ['Дополнительные защитные умения','Особые магические умения',
  'Additional defensive skills','Special magic skills',
  'specializedSkillPreview','stage-skill-specialized-row','gameSkillBadge']){
  assert.ok(src.includes(phrase),phrase);
 }
 assert.ok(src.includes('&&!specialSkills?.defense?.length&&!specialSkills?.magic?.length'));
});
