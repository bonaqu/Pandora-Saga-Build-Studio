import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const contracts=C.ordinarySkillExecLinks;
const ordinary=rec=>rec.funcs.filter(x=>x.ep==='EP_SKILL_EXEC');
const view=(job,catalog=skills,level=55,onHit=false,masteries=null)=>C.skillExecutionChains({
 skillCatalog:catalog,jobKey:job,level,onHit,
 branchCaps:classes[job].branchCaps,
 branchMasteries:masteries||classes[job].branchCaps,
 weaponKind:'BARE_HAND'
});
const row=(job,id,catalog=skills)=>view(job,catalog).rows.find(x=>x.id===id);
const clone=()=>structuredClone(skills);

test('current 91 parent contracts precisely cover 99 nonzero ordinary EP edges',()=>{
 assert.equal(Object.keys(skills).length,571);
 assert.equal(Object.keys(classes).length,28);
 assert.equal(Object.isFrozen(contracts),true);
 assert.equal(Object.keys(contracts).length,91);
 let count=0,special=0;
 for(const [id,expected] of Object.entries(contracts)){
  const source=skills[id],actual=ordinary(source);
  assert.ok(source,'missing parent '+id);
  assert.equal(actual.length,expected.length,'edge count '+id);
  assert.equal(Object.isFrozen(expected),true);
  assert.equal(C.ordinarySkillExecMatches(Number(id),actual),true,id);
  for(let i=0;i<expected.length;i++){
   const [target,mode]=expected[i],f=actual[i];
   assert.ok(Number.isSafeInteger(target)&&target>0);
   assert.equal(Object.isFrozen(expected[i]),true);
   assert.equal(skills[target]?.id,target,'unknown target '+id+' -> '+target);
   assert.deepEqual(f.fv1,[0,0,0,target],id);
   assert.deepEqual(f.fv2,[0,0,mode,mode],id);
   if(mode===9)special++;
   count++;
  }
 }
 assert.equal(count,99);
 assert.equal(special,3);
 for(const id of [620002061,700000001]){
  assert.equal(ordinary(skills[id]).length,1);
  assert.equal(ordinary(skills[id])[0].fv1[3],0);
  assert.equal(contracts[id],undefined,
   'Zero target is a placeholder, not a child identity');
 }
});

test('99 individual pointer swaps are rejected even if the new ID is valid',()=>{
 let rejected=0;
 const knownIds=Object.keys(skills).map(Number);
 for(const [parentId,entries] of Object.entries(contracts)){
  const original=ordinary(skills[parentId]);
  for(let i=0;i<entries.length;i++){
   const bad=structuredClone(original);
   // Choose another EXISTING skill, never a fake missing ID.
   const target=knownIds.find(id=>id!==entries[i][0]);
   assert.ok(Number.isSafeInteger(target));
   bad[i].fv1[3]=target;
   assert.equal(C.ordinarySkillExecMatches(Number(parentId),bad),false,
    'Wrong existing target must be rejected '+parentId+' index '+i);
   rejected++;
  }
 }
 assert.equal(rejected,99);
});

test('unknown FV2 modes, extra links, reordered edges and nonzero control lanes reject',()=>{
 for(const [id,expected] of Object.entries(contracts)){
  const original=ordinary(skills[id]);
  const invalid=[
   fx=>{fx[0].fv2[2]=fx[0].fv2[2]===0?9:0},
   fx=>{fx[0].fv2[3]=fx[0].fv2[3]===0?9:0},
   fx=>{fx[0].fv1[0]=1},
   fx=>{fx[0].dir='CASTER'},
   fx=>{fx.push(structuredClone(fx[0]))},
   fx=>{fx.pop()}
  ];
  for(const edit of invalid){
   const bad=structuredClone(original);edit(bad);
   assert.equal(C.ordinarySkillExecMatches(Number(id),bad),false,
    'Malformed link '+id+' '+edit);
  }
  if(expected.length>1){
   const reordered=structuredClone(original).reverse();
   assert.equal(C.ordinarySkillExecMatches(Number(id),reordered),false);
  }
 }
});

test('actual engine-facing traversal rejects a same-branch valid-but-wrong child',()=>{
 assert.deepEqual(row('AGENT',240005001)?.paths,
  [[240005001,240005002,240005003]]);
 const changed=clone();
 changed[240005001].funcs.find(f=>f.ep==='EP_SKILL_EXEC').fv1[3]=240002050;
 assert.equal(changed[240002050].branch,changed[240005001].branch,
  'This is a realistic substitution in the same branch');
 assert.equal(row('AGENT',240005001,changed),undefined);
 assert.ok(view('AGENT',changed).rejected.includes(240005001));
 // A forged yet perfectly zero-shaped additional link is not permitted.
 const extra=clone();
 extra[440003001].funcs.push({
  ep:'EP_SKILL_EXEC',dir:'TARGET',
  fv1:[0,0,0,240002050],fv2:[0,0,0,0]
 });
 assert.equal(row('CALAMITY',440003001,extra),undefined);
 assert.ok(view('CALAMITY',extra).rejected.includes(440003001));
});

test('legitimate cross-branch, classless-learnable and split root variants survive',()=>{
 const examples=[
  ['CLERIC',310023001,[[310023001,310023002]]],
  ['WARLOCK',410002001,[[410002001,500000005]]],
  ['CALAMITY',430059001,[[430059001,230001002]]],
  ['CALAMITY',430058001,[
   [430058001,430058002,430058003,500000004],
   [430058001,430058002,430058003,500000003]]],
  ['CALAMITY',440003001,[
   [440003001,440003002],[440003001,440003003]]]
 ];
 for(const [job,id,expected] of examples){
  const found=row(job,id);
  assert.deepEqual(found?.paths,expected,'Legitimate chain removed '+id);
  assert.equal(found.sourceOnly,true);
  assert.equal('finalDamage' in found,false);
 }
 assert.equal(skills[310023002].learnable,true);
 assert.equal(Object.values(skills[310023002].classes).filter(Boolean).length,0);
 assert.notEqual(skills[410002001].branch,skills[500000005].branch);
 assert.notEqual(skills[430059001].branch,skills[230001002].branch);
});

test('28 professions x 55 levels never claim server damage or a hidden new link',()=>{
 let cases=0,distinctRoots=new Set();
 const accepted=new Set(Object.keys(contracts).map(Number));
 for(const [job,cls] of Object.entries(classes))for(let level=1;level<=55;level++){
  const result=view(job,skills,level);
  assert.equal(result.verified,false);
  for(const entry of result.rows){
   distinctRoots.add(entry.id);
   assert.equal(entry.sourceOnly,true);
   assert.equal(entry.trigger,'cast');
   assert.equal('finalDamage' in entry,false);
   assert.equal('finalAmount' in entry,false);
   for(const path of entry.paths){
    for(let i=1;i<path.length;i++){
     assert.ok(accepted.has(path[i-1]));
     assert.ok(contracts[path[i-1]].some(([to])=>to===path[i]),
      'Unpinned edge '+path[i-1]+'->'+path[i]);
    }
   }
  }
  cases++;
 }
 assert.equal(cases,1540);
 assert.equal(distinctRoots.size,39);
 for(const [job,cls] of Object.entries(classes)){
  const condition=view(job,skills,55,true);
  for(const entry of condition.rows){
   assert.equal(entry.trigger,'on-hit');
   assert.equal(entry.sourceOnly,true);
   assert.equal('finalDamage' in entry,false);
  }
 }
});

test('new contract does not mutate live skills or create an effect outside the Wiki',()=>{
 const before=JSON.stringify(skills);
 const viewRows=view('CALAMITY').rows;
 assert.ok(viewRows.length>0);
 assert.equal(JSON.stringify(skills),before);
 const book=read('pandora-studio-hero-book.js');
 const wiki=read('pandora-studio-wiki-skill-insights.js');
 assert.match(wiki,/skillExecutionChains/);
 assert.doesNotMatch(book,/stage-skill-chain-effects|stage-skill-onhit-effects/);
});
