import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const preview=(job='DISTURBANCE',level=50,rank=26,source=skills)=>
 C.trapSkillCostPreview({skillCatalog:source,jobKey:job,level,
  branchCaps:classes[job].branchCaps,branchMasteries:{trap:rank}});
const mine=(job='DISTURBANCE',level=50,rank=26,source=skills)=>
 preview(job,level,rank,source).rows.find(x=>x.id===240002001);
test('verified current game class and both Russian/English skill identities',()=>{
 assert.equal(classes.DISTURBANCE.name,'Загонщик');
 assert.equal(en.classes.DISTURBANCE.n,'Saboteur');
 assert.equal(skills['240002001'].name,'Взрывающаяся ловушка');
 assert.equal(en.skills['240002001'].n,'Plant Mine');
 assert.equal(en.skills['240002002'].n,'Plant Mine');
 const ordinary=skills['240002001'],level50=skills['240002002'];
 assert.equal(ordinary.learnable,true);
 assert.equal(level50.learnable,false);
 assert.equal(level50.prereq,ordinary.id);
 assert.equal(level50.charLevel,50);
 assert.deepEqual(level50.classes,{DISTURBANCE:1});
 assert.equal(ordinary.funcs[1].fv1[3],240002050);
 assert.equal(level50.funcs[1].fv1[3],240002051);
 assert.equal(level50.funcs[2].fv1[3],240002050);
 assert.deepEqual(skills['240002050'].funcs[0].fv1,[350,100,70,50]);
 assert.deepEqual(skills['240002051'].funcs[0].fv1,[450,100,300,50]);
 assert.deepEqual(skills['240002050'].funcs[1],skills['240002051'].funcs[1]);
});
test('level-50 version is an extra source note; regular trap and consumption stay intact',()=>{
 const row=mine();assert.ok(row);
 assert.equal(row.linkedEffectId,240002050);
 assert.equal(row.count,1);
 assert.equal(row.level50Variant?.linkedEffectId,240002051);
 assert.equal(row.level50Variant?.itemCount,1);
 assert.equal(row.level50Variant?.levelMet,true);
 assert.equal(row.level50Variant?.masteryMet,true);
 assert.equal(row.level50Variant?.activationVerified,false);
 assert.equal(row.level50Variant?.damageVerified,false);
 assert.equal(row.level50Variant?.sourceOnly,true);
 assert.equal(row.finalDamage,undefined);
 assert.equal(row.level50Variant?.finalDamage,undefined);
});
test('variant belongs to Saboteur; level and trap mastery remain separate requirements',()=>{
 assert.equal(mine('SNIPER',50,26)?.level50Variant,undefined);
 const beforeLevel=mine('DISTURBANCE',49,26);
 assert.ok(beforeLevel?.level50Variant);
 assert.equal(beforeLevel.level50Variant.levelMet,false);
 const withoutTraining=mine('DISTURBANCE',55,25);
 assert.ok(withoutTraining?.level50Variant);
 assert.equal(withoutTraining.level50Variant.masteryMet,false);
 assert.equal(withoutTraining.requirementsMet,false);
 assert.equal(mine('DISTURBANCE',55,90)?.level50Variant.masteryMet,true);
});
test('any corrupted special root or child effect hides only the special note',()=>{
 const bad=[
 [240002002,s=>s.funcs[0].fv2[3]++],
 [240002002,s=>s.funcs[1].fv1[3]=240002050],
 [240002002,s=>s.funcs[2].fv1[3]=240002051],
 [240002002,s=>s.charLevel=49],
 [240002002,s=>s.prereq=null],
 [240002002,s=>s.classes={DISTURBANCE:1,SNIPER:1}],
 [240002002,s=>s.reqs[0].amount=28],
 [240002002,s=>s.aoe[1]=55],
 [240002051,s=>s.funcs[0].fv1[0]++],
 [240002051,s=>s.funcs[0].fv2[2]++],
 [240002051,s=>s.funcs[1].fv1[3]++],
 [240002051,s=>s.funcs[1].fv2[3]++],
 [240002051,s=>s.aoe[0]=100],
 [240002051,s=>s.damage.kernel='physical']
 ];
 for(const [id,mutate] of bad){
  const altered=structuredClone(skills);
  mutate(altered[id]);
  const row=mine('DISTURBANCE',50,26,altered);
  assert.ok(row,'ordinary trap still valid '+id);
  assert.equal(row.level50Variant,undefined,'variant should fail closed '+id);
 }
});
test('400 class/level/mastery variants stay non-destructive',()=>{
 const original=JSON.stringify(skills);
 const jobs=['DISTURBANCE','SNIPER','AGENT','PREDATOR'];
 for(let i=0;i<400;i++){
  const job=jobs[i%4],level=i%55+1,rank=i%91;
  const row=mine(job,level,rank);
  if(!row)continue;
  assert.equal(row.linkedEffectId,240002050);
  if(row.level50Variant){
   assert.equal(job,'DISTURBANCE');
   assert.equal(row.level50Variant.levelMet,level>=50);
   assert.equal(row.level50Variant.masteryMet,rank>=26&&rank<=90);
   assert.equal(row.level50Variant.activationVerified,false);
  }
 }
 assert.equal(JSON.stringify(skills),original);
});
test('Hero Book names official class without technical vectors in player text',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.ok(book.includes('Загонщик: с 50-го уровня'));
 assert.ok(book.includes('Saboteur: from level 50'));
 assert.ok(book.includes('Когда игра переключает ловушку на этот вариант, пока неизвестно.'));
 assert.ok(!book.includes('Возмутитель'));
});
