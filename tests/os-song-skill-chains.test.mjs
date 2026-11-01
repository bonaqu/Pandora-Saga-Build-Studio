import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const C=scope.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const full=(jobKey,branchMasteries,skillCatalog=skills,level=55,branchCaps=classes[jobKey].branchCaps)=>
 C.songSkillPreview({jobKey,branchMasteries,skillCatalog,level,branchCaps});
const allMasteries=jobKey=>Object.fromEntries(['benevolence','blessing','hymn'].map(
 key=>[key,classes[jobKey].branchCaps[key]]));

test('real current OS hymn trees show the correct class-specific choices',()=>{
 const expected=[
  ['CLERIC',['minstrel','peaceful']],
  ['ENCHANTER',['minstrel','sage']],
  ['EXORCIST',['minstrel']],
  ['WARRIOR',[]],
  ['PRIEST',[]]
 ];
 for(const [job,keys] of expected){
  const preview=full(job,allMasteries(job));
  assert.deepEqual(preview.rows.map(row=>row.key),keys,job);
  assert.ok(preview.rows.every(row=>row.available===true&&row.active===false));
  assert.equal(preview.verified,false);
 }
 const cleric=full('CLERIC',allMasteries('CLERIC'));
 assert.deepEqual(cleric.rows.map(row=>row.id),[340001001,340003001]);
 for(const row of cleric.rows){
  assert.equal(row.name,skills[row.id].name);
  assert.equal(row.nameEn,en.skills[row.id].n);
 }
 assert.equal(full('ENCHANTER',allMasteries('ENCHANTER')).rows[1].descriptionEn.includes('cooldowns'),true);
 assert.deepEqual(full('CLERIC',allMasteries('CLERIC'),skills,56).rows,[]);
});
test('mastery threshold and caps are independent of viewing and of actual song activation',()=>{
 const zero=full('CLERIC',{benevolence:0,blessing:0,hymn:0});
 assert.deepEqual(zero.rows.map(row=>row.available),[false,false]);
 assert.deepEqual(zero.rows.map(row=>row.active),[false,false]);
 const almost=full('CLERIC',{benevolence:60,blessing:0,hymn:30});
 assert.deepEqual(almost.rows.map(row=>row.available),[true,false]);
 const ready=full('CLERIC',{benevolence:61,blessing:0,hymn:30});
 assert.deepEqual(ready.rows.map(row=>row.available),[true,true]);
 const invalid=full('CLERIC',{benevolence:200,blessing:0,hymn:30});
 assert.deepEqual(invalid.rows.map(row=>row.available),[false,false]);
 const wrongCaps={...classes.CLERIC.branchCaps,hymn:29};
 assert.deepEqual(full('CLERIC',allMasteries('CLERIC'),skills,55,wrongCaps).rows,[]);
 const enchanter=full('ENCHANTER',{hymn:30,blessing:71,benevolence:0});
 assert.deepEqual(enchanter.rows.map(row=>row.available),[true,true]);
 assert.deepEqual(full('CLERIC',null).rows.map(row=>row.available),[false,false]);
});
test('tampered song parent/middle/recipient skill cannot impersonate source-verified OS effect',()=>{
 const probes=[
  [340001001,{reqs:[{branch:'hymn',amount:0}]},'minstrel'],
  [340001001,{skillType:'ALLY'},'minstrel'],
  [340001001,{learnable:false},'minstrel'],
  [340001001,{funcs:skills[340001001].funcs.map(f=>f.ep==='EP_TOGGLE'?{...f,fv1:[0,0,-20,40]}:f)},'minstrel'],
  [340001002,{funcs:[{ep:'EP_SKILL_EXEC',dir:'TARGET',fv1:[0,0,0,340003003]}]},'minstrel'],
  [340001003,{funcs:[{ep:'EP_TOHIT_CONST',dir:'TARGET',fv1:[13,0,13,4]}]},'minstrel'],
  [340003001,{reqs:[{branch:'hymn',amount:30},{branch:'benevolence',amount:60}]},'peaceful'],
  [340003003,{funcs:[{ep:'EP_DAMAGE_CLEAR',dir:'TARGET',fv1:[60,0,30,99]}]},'peaceful'],
  [340004001,{classes:{CLERIC:1}},'sage'],
  [340004003,{funcs:skills[340004003].funcs.map(f=>({...f,dir:'CASTER'}))},'sage']
 ];
 for(const [id,changes,key] of probes){
  const forged={...skills,[id]:{...skills[id],...changes}};
  const job=key==='sage'?'ENCHANTER':'CLERIC';
  const found=full(job,allMasteries(job),forged).rows;
  assert.equal(found.some(row=>row.key===key),false,key+' / '+id);
 }
 assert.deepEqual(full('CLERIC',allMasteries('CLERIC'),{}).rows,[]);
});
test('song preview never adds a toggle-only effect to ordinary HP/MP/combat stats',()=>{
 const input={
  classData:classes.CLERIC,raceData:{vit:20,str:15,agi:20,dex:30,spi:50,int:45},
  jobData:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},
  allocation:{},level:55,
  combatContext:{jobKey:'CLERIC',skillCatalog:skills,branchMasteries:allMasteries('CLERIC')}
 };
 const ready=C.base(input);
 const none=C.base({...input,combatContext:{...input.combatContext,branchMasteries:{benevolence:0,blessing:0,hymn:0}}});
 assert.ok(ready&&none);
 assert.deepEqual(ready.songSkills.rows.map(x=>x.available),[true,true]);
 assert.deepEqual(none.songSkills.rows.map(x=>x.available),[false,false]);
 assert.equal(ready.hp,none.hp);
 assert.equal(ready.mp,none.mp);
 assert.deepEqual(ready.stats,none.stats);
 assert.deepEqual(ready.combat.attack,none.combat.attack);
});
test('bilingual song UI stays collapsed and communicates preview-only conditions',()=>{
 const stage=read('stage-attributes.js'),style=read('style.css'),calc=read('os-calculator.js');
 assert.match(stage,/make\('details',\{class:'stage-legacy-buff-previews stage-song-skills'\}\)/);
 assert.match(stage,/english\?entry.nameEn:entry.name/);
 assert.match(stage,/english\?entry.descriptionEn:entry.description/);
 assert.match(stage,/Бонусы не прибавляются к билду автоматически/);
 assert.match(stage,/Requirements met/);
 assert.match(stage,/Требования выполнены/);
 assert.match(style,/\.stage-song-skill-row/);
 assert.match(calc,/const songSkills=songSkillPreview/);
 assert.match(calc,/regeneration,legacyBuffs,songSkills,otherEquipment/);
});
