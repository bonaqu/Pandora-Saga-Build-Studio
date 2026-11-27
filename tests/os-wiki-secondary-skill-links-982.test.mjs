import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(host);
const C=host.PandoraOSCalculator,W=host.PandoraWikiSkillInsights;
const specs=[
 {id:142503001,child:142503002,job:'EXORCIST',kind:'combatTechniquePreview',
  ep:'EP_ATTACK_BLOCK_BREAK',dir:'CASTER'},
 {id:161202001,child:161202050,job:'JUGGERNAUT',kind:'combatTechniquePreview',
  ep:'EP_SKILL_PARRY_COUNTER',dir:'TARGET'},
 {id:420005001,child:420005004,job:'CONJURER',kind:'specializedSkillPreview',
  ep:'EP_SKILL_EXEC_DIFFUSION',dir:'TARGET'},
 {id:420005002,child:420005003,job:'CONJURER',kind:'specializedSkillPreview',
  ep:'EP_SKILL_EXEC_DIFFUSION',dir:'TARGET'},
 {id:420001002,child:420001003,job:'CONJURER',kind:'specializedSkillPreview',
  ep:'EP_SKILL_EXEC',dir:'TARGET'}
];
const readRows=(id,job,source=skills,level=55)=>{
 const cls=classes[job],opts={skillCatalog:source,jobKey:job,
  level,branchCaps:cls.branchCaps,branchMasteries:cls.branchCaps,
  weaponKind:'2H_AXE'};
 const s=specs.find(x=>x.id===id);
 const r=C[s.kind](opts);
 return [...(r.rows||[]),...(r.defense||[]),...(r.magic||[])];
};
const inspect=(id,source=skills)=>
 W.inspect({skillCatalog:source,classes,id,calculator:C});
const clone=()=>structuredClone(skills);

test('five source-pinned nonnumeric child identities are navigable in the Wiki',()=>{
 assert.equal(Object.keys(classes).length,28);
 for(const {id,child,ep,dir,job} of specs){
  const root=skills[id],fx=root.funcs.find(f=>f.ep===ep);
  assert.equal(fx?.dir,dir,id);
  assert.equal(fx?.fv1?.[3],child,id);
  assert.equal(skills[child]?.id,child);
  assert.ok(root.name.length>0&&english[id]?.n?.length>0);
  const p=inspect(id);
  assert.ok(p,'Expected Wiki record '+id);
  assert.deepEqual(p.paths,[[id,child]],id);
  assert.equal(p.sourceOnly,true);
  assert.equal(p.finalAmount,null);
  assert.ok(p.notes.some(n=>n.ru.length>15&&n.en.length>15));
  const row=readRows(id,job).find(x=>x.id===id);
  assert.ok(row,'Source-validated inspector not found '+id);
  assert.deepEqual(row.paths,[[id,child]]);
  assert.equal(row.sourceOnly,true);
  assert.equal(row.finalAmount,null);
  assert.equal(row.appliedToHero,false);
  assert.equal('damage' in row,false);
  assert.equal('hitCount' in row,false);
 }
});

test('wrong existing targets or altered child payloads hide four new Wiki paths',()=>{
 for(const {id,child,ep} of specs.filter(x=>x.ep!=='EP_SKILL_EXEC')){
  const rootMutation=clone();
  const action=rootMutation[id].funcs.find(f=>f.ep===ep);
  const other=specs.find(x=>x.child!==child).child;
  assert.ok(rootMutation[other]);
  action.fv1[3]=other;
  assert.equal(inspect(id,rootMutation)?.paths?.length||0,0,
   'Do not show a forged but existing child '+id);
  const childMutation=clone();
  const childFx=childMutation[child].funcs[0];
  childFx.fv1[0]+=1;
  assert.equal(inspect(id,childMutation)?.paths?.length||0,0,
   'Do not show a changed child result as the old validated one '+id);
  // Technical actions keep source-only semantics even on real originals.
  assert.equal(inspect(id)?.finalAmount,null);
 }
});

test('the already-documented ordinary link remains unique instead of duplicating',()=>{
 const id=420001002,child=420001003;
 const p=inspect(id);
 assert.deepEqual(p.paths,[[id,child]]);
 assert.equal(p.notes.length,1);
});

test('28 class x 55 level inspectors never promote linked paths into final damage',()=>{
 let scenarios=0,count=0;
 const known=new Map(specs.map(x=>[x.id,x]));
 for(const [job,cls] of Object.entries(classes))for(let level=1;level<=55;level++){
  const opts={skillCatalog:skills,jobKey:job,level,
   branchCaps:cls.branchCaps,branchMasteries:cls.branchCaps,weaponKind:'2H_AXE'};
  const a=C.combatTechniquePreview(opts),b=C.specializedSkillPreview(opts);
  for(const entry of [...a.rows,...b.defense,...b.magic]){
   const spec=known.get(entry.id);
   if(!spec)continue;
   count++;
   assert.deepEqual(entry.paths,[[spec.id,spec.child]]);
   assert.equal(entry.sourceOnly,true);
   assert.equal(entry.finalAmount,null);
   assert.equal(entry.appliedToHero,false);
  }
  scenarios++;
 }
 assert.equal(scenarios,1540);
 assert.ok(count>30,'Five links should appear across at least some classes');
});

test('no Book combat row and no item/soul or catalog mutation was created',()=>{
 const before=JSON.stringify(skills);
 const view=inspect(420005001);
 assert.deepEqual(view.paths,[[420005001,420005004]]);
 assert.equal(JSON.stringify(skills),before);
 const book=read('pandora-studio-hero-book.js');
 assert.doesNotMatch(book,/stage-skill-chain-effects|stage-skill-onhit-effects/);
 assert.equal(viewsFinal(view),null);
});
const viewsFinal=v=>v?.finalAmount??null;

test('Wiki cache rejects child source mutation on the SAME catalog object',()=>{
 const mutable=clone(),id=420005001,child=420005004;
 const initial=inspect(id,mutable);
 assert.deepEqual(initial?.paths,[[id,child]]);
 assert.strictEqual(inspect(id,mutable),initial,'Unchanged snapshots stay cached');
 mutable[child].funcs[0].fv1[0]+=1;
 assert.equal(inspect(id,mutable)?.paths?.length||0,0,
  'An edited child must not keep an old validated navigation link');
 mutable[child].funcs[0].fv1[0]-=1;
 assert.deepEqual(inspect(id,mutable)?.paths,[[id,child]]);
});

test('Wiki cache refreshes after same-object class caps and root pointers change',()=>{
 const mutable=clone(),liveClasses=structuredClone(classes),id=420005001;
 const readCurrent=()=>W.inspect({
  skillCatalog:mutable,classes:liveClasses,id,calculator:C
 });
 assert.deepEqual(readCurrent()?.paths,[[id,420005004]]);
 liveClasses.CONJURER.branchCaps.embody=0;
 assert.equal(readCurrent()?.paths?.length||0,0,
  'Ineligible class must not retain an earlier learned action');
 liveClasses.CONJURER.branchCaps.embody=classes.CONJURER.branchCaps.embody;
 assert.deepEqual(readCurrent()?.paths,[[id,420005004]]);
 mutable[id].funcs.find(f=>f.ep==='EP_SKILL_EXEC_DIFFUSION').fv1[3]=420005003;
 assert.equal(readCurrent()?.paths?.length||0,0,
  'A swapped but existing child ID must invalidate the cached proof');
});
