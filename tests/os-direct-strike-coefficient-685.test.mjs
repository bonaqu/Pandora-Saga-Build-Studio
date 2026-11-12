import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator, skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const preview=(job,m={},weapon='1H_SWORD',source=skills)=>
 C.directStrikeCoefficientPreview({skillCatalog:source,jobKey:job,level:50,
  branchMasteries:m,branchCaps:classes[job].branchCaps,weaponKind:weapon});
const by=(rows,id)=>rows.find(r=>r.id===id);
const coeff=(rows,id)=>by(rows,id)?.coefficientModels[0]?.amount;
test('all 19 learnable direct strike IDs have a source signature; internal triggered variants are excluded',()=>{
 const source=Object.values(skills).filter(s=>s.learnable&&
  s.funcs?.some(x=>x.ep==='EP_ONHIT_DAMAGE_SCALE'&&x.dir==='CASTER'&&
   x.fv1?.[0]===0&&x.fv1?.[1]===0));
 assert.equal(source.length,19);
 const internal=[100059002,100059003,121703511,121703512,121704002];
 const combined=['JUGGERNAUT','KNIGHT','SNIPER','ASSASSIN','PREDATOR'].flatMap(
  job=>preview(job,Object.fromEntries(Object.entries(classes[job].branchCaps)
   .map(([b,v])=>[b,Math.max(0,v)]))));
 for(const id of internal)assert.equal(by(combined,id),undefined);
 assert.ok(combined.length>10);
});
test('current OS direct hits generate per-mastery coefficient models, not final target damage',()=>{
 assert.equal(coeff(preview('JUGGERNAUT',{slash:41}),100102001),-12);
 assert.equal(coeff(preview('JUGGERNAUT',{brush:40},'1H_AXE'),142002001),20);
 assert.equal(coeff(preview('JUGGERNAUT',{brush:41},'2H_AXE'),142001001),70);
 assert.equal(coeff(preview('SNIPER',{archery:40},'BOW'),213601001),58);
 assert.equal(coeff(preview('ASSASSIN',{assassin:80},'1H_TRUMP_WEAPON'),233005001),24);
 assert.equal(coeff(preview('ASSASSIN',{assassin:20},'1H_TRUMP_WEAPON'),233101001),24);
 const row=by(preview('JUGGERNAUT',{brush:40},'1H_AXE'),142002001);
 assert.equal(row.amount,null);
 assert.equal(row.uncertain,true);
 assert.equal(row.coefficientModels[0].confidence,'coefficient-model');
 assert.equal(row.available,true);
});
test('skill variant upgrade replaces previous row only after source requirements are met',()=>{
 const a=preview('JUGGERNAUT',{slash:70},'1H_SWORD');
 assert.ok(by(a,110101001));
 assert.equal(by(a,110101002),undefined);
 const b=preview('JUGGERNAUT',{slash:71},'1H_SWORD');
 assert.equal(by(b,110101001),undefined);
 assert.equal(coeff(b,110101002),1);
});
test('250 synthetic mastery scenarios are monotone, distinct from real damage, source-immutable',()=>{
 const suite=[
  ['JUGGERNAUT','slash',100102001,'1H_SWORD'],
  ['JUGGERNAUT','brush',142002001,'1H_AXE'],
  ['KNIGHT','thrust',121702001,'LANCE'],
  ['SNIPER','archery',213601001,'BOW'],
  ['ASSASSIN','assassin',233101001,'1H_TRUMP_WEAPON']
 ];
 const sourceBefore=JSON.stringify(skills);
 let n=0;
 for(const [job,branch,id,weapon] of suite)for(let mastery=0;mastery<50;mastery++){
  const current=preview(job,{[branch]:mastery},weapon);
  const next=preview(job,{[branch]:mastery+1},weapon);
  assert.ok(by(current,id)&&by(next,id),job+' '+id+' at '+mastery);
  assert.ok(coeff(next,id)>=coeff(current,id));
  assert.equal(by(current,id).amount,null);
  n++;
 }
 assert.equal(n,250);
 assert.equal(JSON.stringify(skills),sourceBefore);
});
test('changed direction, vector shape, identity and invalid class exclude a model',()=>{
 const changed=structuredClone(skills);
 changed['142002001'].funcs[0].dir='TARGET';
 assert.equal(by(preview('JUGGERNAUT',{brush:40},'1H_AXE',changed),142002001),undefined);
 changed['142002001'].funcs[0].dir='CASTER';
 changed['142002001'].funcs[0].fv1[2]=1000;
 assert.equal(by(preview('JUGGERNAUT',{brush:40},'1H_AXE',changed),142002001),undefined);
 assert.equal(by(preview('WARRIOR',{assassin:0}),233101001),undefined);
});
test('every strike coefficient is rendered by the existing Path-style Hero Book inspector',()=>{
 const book=read('pandora-studio-hero-book.js');
 const calculator=read('pandora-os-character-calculator.js');
 assert.match(calculator,/directStrikeCoefficientPreview\(\{/);
 assert.match(calculator,/result\.offense\.push\(strike\)/);
 assert.match(book,/skill\.coefficientModels/);
 assert.match(book,/Параметры умения:/);
});

test('malformed successor never hides predecessor or unrelated source-backed attacks',()=>{
 const forged=structuredClone(skills);
 forged['110101002'].funcs.find(x=>x.ep==='EP_ONHIT_DAMAGE_SCALE').fv1[2]=999;
 const rows=preview('JUGGERNAUT',{slash:71},'1H_SWORD',forged);
 assert.ok(by(rows,110101001),'valid predecessor must remain when upgrade is malformed');
 assert.equal(by(rows,110101002),undefined);
 assert.ok(by(rows,100102001),'unrelated slash attacks must survive the malformed upgrade');
 const badLineage=structuredClone(skills);
 badLineage['110101002'].prereq=999999999;
 const unaffected=preview('JUGGERNAUT',{slash:71},'1H_SWORD',badLineage);
 assert.ok(by(unaffected,100102001),'bad lineage must not abort all previews');
});
