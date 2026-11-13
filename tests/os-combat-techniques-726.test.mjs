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
 [161201001,'Парирование','Parry'],
 [161202001,'Контратака','Riposte'],
 [168001001,'Блокирование','Blocking'],
 [168001003,'Блокирование','Blocking'],
 [100051001,'Рывок','Lunge'],
 [100054001,'Сосредоточенность','Concentration'],
 [121705001,'Могучий удар','Dismounting Stab'],
 [142503001,'Удар по щиту','Shield Break']
];
const inspect=(job,catalog=skills,level=55,ranks=classes[job].branchCaps,weapon='2H_SWORD')=>
 C.combatTechniquePreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:classes[job].branchCaps,branchMasteries:ranks,weaponKind:weapon,
  branchLabels:meta.branchLabels,englishBranches:en.branches});
const owner=id=>Object.keys(classes).find(j=>inspect(j).rows.some(x=>x.id===id));
test('eight current OS skills keep source RU/EN identities without imagined combat totals',()=>{
 for(const [id,ru,english] of cases){
  assert.equal(skills[id].name,ru,id);
  assert.equal(en.skills[id].n,english,id);
  const job=owner(id);assert.ok(job,'missing eligible class '+id);
  const row=inspect(job).rows.find(x=>x.id===id);
  assert.equal(row.mana,skills[id].mana);
  assert.equal(row.cooldown,skills[id].cooldown);
  assert.equal(row.sourceOnly,true);
  assert.equal(row.finalAmount,null);
  assert.equal(row.appliedToHero,false);
  assert.ok(row.noteRu.length>12&&row.noteEn.length>12);
 }
 assert.equal(skills[168001003].prereq,168001001);
 assert.deepEqual(skills[161202001].funcs.filter(f=>f.ep==='EP_SKILL_PARRY_COUNTER').map(f=>f.fv1[3]),[161202050]);
 assert.deepEqual(skills[142503001].funcs.filter(f=>f.ep==='EP_ATTACK_BLOCK_BREAK').map(f=>f.fv1[3]),[142503002]);
});
test('all root attributes and related child vectors are validated before display',()=>{
 const corrupt=[
  s=>s.funcs[0].fv1[3]++,
  s=>s.funcs[0].fv2[3]++,
  s=>s.funcs[0].dir='WRONG',
  s=>s.funcs.push(structuredClone(s.funcs[0])),
  s=>s.mana++,s=>s.cooldown++,s=>s.charLevel++,
  s=>s.learnable=false,s=>s.reqLevel++,
  s=>s.reqs.push({branch:'slash',amount:999}),
  s=>{s.classes[Object.keys(s.classes)[0]]=0}
 ];
 for(const [id] of cases){
  const job=owner(id);
  for(const mutate of corrupt){
   const changed={...skills,[id]:structuredClone(skills[id])};
   mutate(changed[id]);
   const out=inspect(job,changed);
   assert.equal(out.rows.some(row=>row.id===id),false,id+' stale root');
   assert.ok(out.rejected.includes(id));
  }
 }
 for(const [root,child] of [[161202001,161202050],[142503001,142503002],
  [168001003,168001001]]){
  const changed={...skills,[child]:structuredClone(skills[child])};
  changed[child].funcs[0].fv1[3]++;
  const out=inspect(owner(root),changed);
  assert.equal(out.rows.some(row=>row.id===root),false,'stale child '+root);
  assert.ok(out.rejected.includes(root));
 }
});
test('levels, mastery and equipped weapons affect availability correctly',()=>{
 const general=inspect('GENERAL',skills,44,classes.GENERAL.branchCaps,'2H_SWORD');
 assert.equal(general.rows.find(x=>x.id===168001003).requirementsMet,false);
 assert.match(general.rows.find(x=>x.id===168001003).reasonRu,/Нужен уровень 45/);
 assert.equal(inspect('GENERAL',skills,45,classes.GENERAL.branchCaps,'2H_SWORD')
  .rows.find(x=>x.id===168001003).requirementsMet,true);
 const ranks={...classes.GENERAL.branchCaps,defense:7};
 assert.equal(inspect('GENERAL',skills,55,ranks).rows.find(x=>x.id===168001001).requirementsMet,false);
 const parry=inspect('GENERAL',skills,55,classes.GENERAL.branchCaps,'BARE_HAND').rows.find(x=>x.id===161201001);
 assert.equal(parry.requirementsMet,false);
 assert.match(parry.reasonRu,/подходящее оружие/);
 const mage=inspect('MAGE');
 assert.ok(mage.rows.every(row=>skills[row.id].classes.MAGE===1));
});
test('400 character combinations retain source facts without modifying permanent stats',()=>{
 const initial=JSON.stringify(skills),names=Object.keys(classes);
 for(let i=0;i<400;i++){
  const job=names[i%names.length],level=i%55+1,caps=classes[job].branchCaps;
  const points=Object.fromEntries(Object.entries(caps).map(([key,n])=>[key,Math.min(n,i%97)]));
  const weapon=i%2===0?'2H_SWORD':'BARE_HAND';
  for(const row of inspect(job,skills,level,points,weapon).rows){
   const source=skills[row.id];
   // Four post-0.740 MELEE parent skills use combined trained green, not
   // a zero-cap independently allocatable martial branch.
   const eligible=level>=source.charLevel&&source.reqs.every(r=>
    source.branchRaw==='MELEE'&&r.branch==='martial'?
     ['slash','thrust','brush','blow','defense']
      .reduce((sum,branch)=>sum+points[branch],0)>=r.amount:
     points[r.branch]>=r.amount)&&
    (!source.weaponUse||source.weaponUse.includes(weapon));
   assert.equal(row.requirementsMet,eligible);
   assert.equal(row.finalAmount,null);
   assert.equal(row.appliedToHero,false);
  }
 }
 assert.equal(JSON.stringify(skills),initial);
});
test('cross-module audit counts exactly eight additional qualitative skills',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.ok(report.summary.statuses['numeric-preview']>=69);
 assert.ok(report.summary.statuses['qualitative-preview']>=50);
 assert.ok(report.summary.statuses['unmodeled-learnable']<=55);
 for(const [id] of cases){
  const row=report.rows.find(r=>r.id===id);
  assert.equal(row.status,'qualitative-preview');
  assert.deepEqual(row.sourceModules,['combat-techniques-source']);
 }
});
test('Source-only os-combat-techniques-726 knowledge belongs in the Encyclopedia, not build stats',()=>{
 const wiki=read('pandora-studio-wiki-skill-insights.js');
 const app=read('pandora-studio-app.js');
 const book=read('pandora-studio-hero-book.js');
 assert.ok(wiki.includes('combatTechniquePreview'),'source inspector must stay enabled');
 assert.ok(app.includes('PandoraWikiSkillInsights?.inspect'),'Wiki renders verified insights');
 assert.ok(!book.includes('stage-skill-combat-technique'),'Book must not duplicate Wiki metadata');
});
