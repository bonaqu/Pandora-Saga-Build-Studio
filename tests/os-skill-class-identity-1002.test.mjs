import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const clone=()=>structuredClone(skills);
const move=(job,catalog=skills,level=45,masteries={})=>
 C.scalingSkillPreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:classes[job].branchCaps,branchMasteries:masteries,
  combat:{attack:{walkingBase:200},defense:{directRaw:50},
   dodge:{base:100},accuracy:{base:100}},
  stats:{vit:40,str:50,agi:70,dex:50,spi:50,int:50}}).movement;
const get=(rows,id)=>rows.find(x=>x.id===id);
const strike=catalog=>C.directStrikeCoefficientPreview({
 skillCatalog:catalog,jobKey:'JUGGERNAUT',level:50,
 branchCaps:classes.JUGGERNAUT.branchCaps,
 branchMasteries:{brush:40},weaponKind:'1H_AXE'});
const chains=catalog=>C.skillExecutionChains({
 skillCatalog:catalog,jobKey:'AGENT',level:55,
 branchCaps:classes.AGENT.branchCaps,
 branchMasteries:classes.AGENT.branchCaps,weaponKind:'BARE_HAND'});
const craft=(job,catalog=skills)=>C.craftingSkillPreview({
 skillCatalog:catalog,jobKey:job,level:45,
 branchCaps:classes[job].branchCaps,
 branchMasteries:classes[job].branchCaps});

test('direct strike models only accept exact numeric class ownership',()=>{
 assert.equal(get(strike(skills),142002001)?.coefficientModels[0].amount,20);
 for(const bad of ['1',true,[],{},null,0]){
  const altered=clone();altered['142002001'].classes.JUGGERNAUT=bad;
  assert.equal(get(strike(altered),142002001),undefined,
   'Forged JUGGERNAUT source '+String(bad));
  assert.ok(get(strike(altered),100102001),
   'Unrelated valid attacks survive a forged neighboring source');
 }
 const altered=clone();
 altered['110101001'].classes.JUGGERNAUT='1';
 const upgraded=C.directStrikeCoefficientPreview({
  skillCatalog:altered,jobKey:'JUGGERNAUT',level:50,
  branchCaps:classes.JUGGERNAUT.branchCaps,
  branchMasteries:{slash:71},weaponKind:'1H_SWORD'});
 assert.equal(get(upgraded,110101002),undefined,
  'Advanced strike cannot be validated by a string-class parent');
 assert.equal(skills['110101001'].classes.JUGGERNAUT,1);
});

test('own movement class and parent identity require numeric 1',()=>{
 assert.equal(get(move('SNIPER',skills,45,{warding:70}),260003001)?.amount,200);
 for(const bad of ['1',true,[],{},null,0]){
  const altered=clone();altered['260003001'].classes.SNIPER=bad;
  assert.equal(get(move('SNIPER',altered,45,{warding:70}),260003001),
   undefined,'Forged self movement source '+String(bad));
  assert.equal(get(move('SNIPER',altered,45,{warding:70}),320004001)?.amount,40);
 }
 const parent=clone();
 parent['168002001'].classes.PALADIN='1';
 assert.equal(get(move('PALADIN',parent,45,{defense:41}),168002003),undefined,
  'Advanced mobility source cannot use a forged class in its parent');
 assert.equal(get(move('PALADIN',skills,45,{defense:41}),168002003)?.amount,-20);
});

test('both external movement buffs validate real source-caster classes, not recipient class',()=>{
 assert.equal(Object.keys(skills['260010001'].classes).length,28);
 for(const [id,job] of [[260010001,'WARRIOR'],[320004001,'ARCHER']]){
  assert.ok(get(move('WIZARD'),id),'Any recipient may see a valid external model');
  for(const mutation of [
   s=>{s.classes={};},
   s=>{s.classes[job]='1';},
   s=>{s.classes.UNKNOWN_CASTER=1;},
   s=>{s.charLevel+=1;}
  ]){
   const altered=clone();mutation(altered[String(id)]);
   assert.equal(get(move('WIZARD',altered),id),undefined,
    'Invalid caster metadata cannot unlock '+id);
   const other=id===260010001?320004001:260010001;
   assert.ok(get(move('WIZARD',altered),other),
    'Other validated ally movement source survives');
  }
 }
});

test('ordinary execution chain root and predecessor classes are exact numeric IDs',()=>{
 assert.deepEqual(get(chains(skills).rows,240005001)?.paths,
  [[240005001,240005002,240005003]]);
 for(const bad of ['1',true,{},null,0]){
  const altered=clone();altered['240005001'].classes.AGENT=bad;
  assert.equal(get(chains(altered).rows,240005001),undefined);
 }
 const remaining=chains(skills);
 assert.equal(remaining.verified,false);
 assert.equal(get(remaining.rows,240005001).sourceOnly,true);
});

test('source-only crafting recipes reject truthy nonnumeric class flags',()=>{
 const job=Object.keys(classes).find(name=>get(craft(name).rows,220002001));
 assert.ok(job,'A current class can access the genuine recipe');
 assert.equal(get(craft(job).rows,220002001)?.produces.id,50056);
 for(const bad of ['1',true,[],{},null,0]){
  const altered=clone();altered['220002001'].classes[job]=bad;
  assert.equal(get(craft(job,altered).rows,220002001),undefined,
   'A forged recipe class cannot be treated as authentic');
 }
});

test('all 28 jobs and levels 1..55 keep external movement source models recipient-neutral',()=>{
 let compared=0;
 for(const job of Object.keys(classes))for(let level=1;level<=55;level++){
  const rows=move(job,skills,level);
  for(const [id,magnitude] of [[260010001,200],[320004001,40]]){
   const row=get(rows,id);
   assert.equal(row?.amount,magnitude,job+' L'+level+' movement '+id);
   assert.equal(row.recipient,true);
   assert.equal(row.modelOnly,true);
   assert.equal(row.uncertain,true);
  }
  compared++;
 }
 assert.equal(compared,1540);
});

test('no catalog changes or unsupported final server combat claims',()=>{
 assert.equal(Object.keys(skills).length,571);
 assert.equal(Object.keys(classes).length,28);
 assert.match(read('pandora-os-character-calculator.js'),/ownedAllyCasterClasses\(record,id\)/);
 assert.ok(!('finalDamage' in get(chains(skills).rows,240005001)));
});
