import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-book-skill-thresholds.js'))(host);
const C=host.PandoraOSCalculator,T=host.PandoraBookSkillThresholds;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const group=['slash','thrust','brush','blow','defense'];
const sum=caps=>group.reduce((total,k)=>total+(caps[k]||0),0);
const trained=(caps,target)=>{
 let remain=target;
 const result={};
 for(const key of group){
  const part=Math.min(caps[key]||0,remain);
  result[key]=part;remain-=part;
 }
 assert.equal(remain,0,'Class cannot train all expected melee points');
 return result;
};
const stats={str:72,vit:45,dex:55,agi:70,spi:80,int:40};
const combat={attack:{walkingBase:160},accuracy:{base:100},
 dodge:{base:130},defense:{directRaw:90}};
const inspect=(jobKey,branchMasteries={},options={})=>C.scalingSkillPreview({
 skillCatalog:skills,jobKey,level:55,branchCaps:classes[jobKey].branchCaps,
 branchMasteries,stats,combat,weaponKind:'2H_SWORD',hasShield:true,...options});
const by=(r,id)=>[...r.offense,...r.defense].find(row=>row.id===id);

test('three OS party skills calculate the RECIPIENT hero without applying a buff',()=>{
 const r=inspect('WARRIOR');
 for(const [id,ru,en,amount,source,base,flat,percent,next] of [
  [320001001,'Боевой клич','War Cry',42,'physicalAttack',160,10,20,165],
  [100055001,'Массовая сосредоточенность','Third Eye',35,'accuracy',100,20,15,107],
  [260006001,'Помощь ветра','Speedy Gale',34,'evasion',130,15,15,134]
 ]){
  const skill=by(r,id),basis=skill?.recipientBasis;
  assert.ok(skill,'missing beneficiary bonus '+id);
  assert.equal(skills[id].name,ru);
  assert.equal(english.skills[id].n,en);
  assert.equal(skill.available,true);
  assert.equal(skill.recipient,true);
  assert.equal(skill.amount,amount);
  assert.deepEqual(basis,{source,base,flat,percent,
   component:Math.floor(base*percent/100),nextBase:next,
   model:'flat-plus-floor-percent',applied:false});
 }
 assert.deepEqual(combat.attack,{walkingBase:160});
 assert.deepEqual(combat.accuracy,{base:100});
 assert.deepEqual(combat.dodge,{base:130});
});
test('source-matched party thresholds update from THIS build and round at exact breakpoints',()=>{
 for(let n=0;n<=200;n++){
  const r=inspect('WARRIOR',{},{
   combat:{...combat,attack:{walkingBase:n},accuracy:{base:n},dodge:{base:n}}
  });
  for(const [id,flat,percent] of [[320001001,10,20],
   [100055001,20,15],[260006001,15,15]]){
   const row=by(r,id);
   assert.ok(row?.recipient);
   const step=Math.floor(n*percent/100);
   assert.equal(row.amount,flat+step);
   const next=Math.ceil((step+1)*100/percent);
   assert.equal(row.recipientBasis.nextBase,next);
   assert.ok(next>n);
   const advance=inspect('WARRIOR',{},{
    combat:{...combat,attack:{walkingBase:next},accuracy:{base:next},
     dodge:{base:next}}
   });
   assert.equal(by(advance,id).amount,flat+Math.floor(next*percent/100));
   assert.ok(by(advance,id).amount>=row.amount+1);
  }
 }
});
test('all 28 OS classes use ONLY trained MELEE group for Ossify numeric attack cost',()=>{
 let candidates=0;
 for(const [job,klass] of Object.entries(classes)){
  const cap=sum(klass.branchCaps);
  const result=inspect(job,trained(klass.branchCaps,Math.min(cap,100)));
  const row=by(result,100057001);
  if(cap<100){
   assert.equal(row,undefined,'Class below required group cap '+job);
   continue;
  }
  candidates++;
  assert.ok(row,job+' eligible group source');
  assert.equal(row.available,true);
  assert.equal(row.amount,-80,'Minus 50% of base ATK 160');
  const fake=inspect(job,{martial:100});
  assert.equal(by(fake,100057001)?.available,false,
   'Raw martial points cannot fake green trained mastery '+job);
  const under=inspect(job,trained(klass.branchCaps,99));
  assert.equal(by(under,100057001)?.available,false);
  assert.match(by(under,100057001)?.reason,/Ближний бой/);
 }
 assert.ok(candidates>0);
});
test('full signed Ossify root rejects changed secondary game effects',()=>{
 for(const mutate of [
  s=>{s[100057001].funcs[0].fv1[3]++},
  s=>{s[100057001].funcs[3].fv2[3]++},
  s=>{s[100057001].mana++},
  s=>{s[100057001].branchRaw='OTHER'}
 ]){
  const tampered=structuredClone(skills);mutate(tampered);
  const rank=trained(classes.JUGGERNAUT.branchCaps,100);
  assert.equal(by(inspect('JUGGERNAUT',rank,{skillCatalog:tampered}),100057001),
   undefined,'An altered source may not produce numeric Book values');
 }
});
test('Book shows current level, green mastery and next user-confirmed MELEE threshold',()=>{
 const caps=classes.JUGGERNAUT.branchCaps;
 const view=rank=>T.nextMelee({skillCatalog:skills,jobKey:'JUGGERNAUT',
  branchCaps:caps,branchMasteries:trained(caps,rank),
  englishSkills:english.skills});
 for(const [rank,id,required] of [[0,100101001,3],
  [3,111201001,35],[34,111201001,35],
  [35,100056001,70],[70,100057001,100]]){
  const row=view(rank);
  assert.equal(row.id,id);
  assert.equal(row.required,required);
  assert.equal(row.current,rank);
  assert.equal(row.remaining,required-rank);
  assert.equal(row.nameRu,skills[id].name);
  assert.equal(row.nameEn,english.skills[id].n);
 }
 assert.equal(view(100),null);
 const current=T.requirements({id:100057001,skillCatalog:skills,
  jobKey:'JUGGERNAUT',level:55,branchCaps:caps,
  branchMasteries:trained(caps,100),
  branchLabels:meta.branchLabels,englishBranches:english.branches});
 assert.deepEqual(current.linesRu,['Освоенное мастерство «Ближний бой»: 100 / 100']);
 assert.deepEqual(current.linesEn,['Trained Melee mastery: 100 / 100']);
 const first=T.requirements({id:310001001,skillCatalog:skills,
  jobKey:'CLERIC',level:30,branchCaps:classes.CLERIC.branchCaps,
  branchMasteries:{benevolence:8},branchLabels:meta.branchLabels,
  englishBranches:english.branches});
 assert.match(first?.linesRu[0]||'',/Исцеление.*8 \/ 8/);
});
test('malformed or impossible source threshold cannot masquerade as player progress',()=>{
 const caps=classes.JUGGERNAUT.branchCaps;
 assert.equal(T.nextMelee({skillCatalog:skills,jobKey:'JUGGERNAUT',
  branchCaps:caps,branchMasteries:{slash:999}}),null);
 const altered=structuredClone(skills);
 altered[100101001].reqs[0].amount=4;
 const next=T.nextMelee({skillCatalog:altered,jobKey:'JUGGERNAUT',
  branchCaps:caps,branchMasteries:{}});
 assert.equal(next?.id,111201001,'False first requirement must fail closed');
 assert.equal(T.requirements({id:100057001,skillCatalog:skills,
  jobKey:'JUGGERNAUT',branchCaps:caps,branchMasteries:{slash:999}}),null);
});
test('Book is build-scoped, bilingual, and external-buff block is not a toggle',()=>{
 const book=read('pandora-studio-hero-book.js');
 const effects=book.slice(book.indexOf('function skillEffectsPage('),
  book.indexOf('\nfunction chapterNumber('));
 const index=read('index.html'),css=read('pandora-studio-hero-book-additions.css');
 assert.match(index,/pandora-studio-book-skill-thresholds\.js/);
 assert.match(effects,/PandoraBookSkillThresholds/);
 assert.match(effects,/stage-skill-gate-help/);
 assert.match(effects,/stage-skill-next-mastery/);
 assert.match(effects,/stage-skill-party-effects/);
 assert.match(effects,/skill\.recipient===true/);
 assert.match(effects,/applied===false/);
 assert.match(effects,/not enabled in the build/);
 assert.match(effects,/Расчётная модель по игровым данным/);
 assert.doesNotMatch(effects,/row\.recipient\?\.applied=true/);
 assert.match(css,/\.stage-skill-gate-help>summary/);
});
test('formula audit keeps every skill and reclassifies source-proved Ossify value',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 const byId=id=>report.rows.find(x=>x.id===id);
 assert.equal(report.summary.skillRecords,569);
 assert.equal(report.summary.statuses['unmodeled-learnable'],3);
 assert.equal(byId(100057001).status,'numeric-preview');
 assert.ok(byId(100057001).sourceModules.includes('skill-effects'));
 assert.ok(byId(100057001).sourceModules.includes('combat-techniques-source'));
});
