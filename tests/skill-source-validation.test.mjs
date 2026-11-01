import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('hero-path.js'),css=read('style.css');
const host={PandoraSkillProgression:{
 potential:(state,key)=>state.points?.[key]||0,
 trained:(state,key)=>state.mastery?.[key]||0
}};
Function('window','document',source)(host,{});
const check=host.PandoraHeroPath.readiness;
const skill=()=>({id:1234,name:'Fixture',classes:{CLERIC:1},charLevel:1,reqLevel:0,
 reqs:[{branch:'benevolence',amount:8}],learnable:true,prereq:null});
const api={lang:'en',job:'CLERIC',state:{level:55,points:{benevolence:12},mastery:{benevolence:12}},
 skillCatalog:[],cap:key=>key==='benevolence'?90:0,branchName:key=>key};
function verdict(s){return check(s,{...api,skillCatalog:[s]})}
test('honest class eligibility rejects absent, disabled and corrupted class entries',()=>{
 assert.equal(verdict(skill()).learned,true);
 for(const classes of [{CLERIC:0},{CLERIC:false},{CLERIC:'false'},[],null,undefined,{WARRIOR:1}]){
  const row={...skill(),classes};
  const result=verdict(row);
  assert.equal(result.learned,false,JSON.stringify(classes));
  assert.ok(result.problems.includes('Unavailable to this class'));
 }
 assert.equal(verdict({...skill(),classes:{CLERIC:true}}).learned,true);
});
test('bad character levels cannot silently turn into level-zero requirements',()=>{
 for(const charLevel of [null,false,-1,2.5,'not-a-level',{}]){
  const result=verdict({...skill(),charLevel});
  assert.equal(result.learned,false,String(charLevel));
  assert.ok(result.problems.includes('Unknown character level requirement'));
 }
 assert.equal(verdict({...skill(),charLevel:0}).learned,true);
 assert.equal(verdict({...skill(),charLevel:50}).learned,true);
 assert.equal(verdict({...skill(),charLevel:56}).learned,false);
});
test('malformed skill requirements and learnability fields fail closed',()=>{
 for(const reqs of [null,{branch:'benevolence',amount:8},'8']){
  const r=verdict({...skill(),reqs});
  assert.equal(r.learned,false);
  assert.ok(r.problems.includes('Unknown skill requirements'));
 }
 for(const learnable of ['false',0,null,{},[]]){
  const r=verdict({...skill(),learnable});
  assert.equal(r.learned,false);
  assert.ok(r.problems.includes('Unknown learning method'));
 }
 assert.equal(verdict({...skill(),learnable:false}).learned,false);
});
test('unverified malformed supplemental mastery requirement is rejected',()=>{
 for(const reqLevel of [null,false,-3,'invalid',2.7]){
  const r=verdict({...skill(),reqLevel});
  assert.equal(r.learned,false);
  assert.ok(r.problems.includes('Unknown additional requirement'));
 }
});
test('official OS catalog has validated entry types and still supports planning to level 55',()=>{
 const catalog=Object.values(JSON.parse(read('data/os/skills.json')));
 assert.equal(catalog.length,569);
 for(const row of catalog){
  assert.equal(typeof row.charLevel,'number',row.id);
  assert.ok(Number.isInteger(row.charLevel)&&row.charLevel>=0,row.id);
  assert.equal(typeof row.learnable,'boolean',row.id);
  assert.equal(typeof row.reqLevel,'number',row.id);
  assert.ok(Array.isArray(row.reqs),row.id);
  assert.ok(row.classes&&!Array.isArray(row.classes)&&typeof row.classes==='object',row.id);
  for(const value of Object.values(row.classes))assert.ok(value===1||value===true,row.id);
 }
});
test('muted locked rail keeps a visible boundary and original pointer behavior',()=>{
 const selector='.inline-mastery-track.path-integrated-track .inline-mastery-locked{';
 const start=css.indexOf(selector);
 assert.ok(start>0);
 const rule=css.slice(start,css.indexOf('}',start));
 assert.match(rule,/background:repeating-linear-gradient/);
 assert.match(rule,/border-color:#94746a/);
 assert.doesNotMatch(rule,/#aa4b42|#d48c76/);
 assert.match(css,/\.inline-mastery-track \.inline-mastery-locked\{[^}]*pointer-events:none/);
 assert.match(css,/\.inline-mastery-track\.path-integrated-track \.path-unlock-notch\{/);
 assert.match(source,/const visualMax=Math.max\(90,cap,points\)/);
});

test('readiness rejects arrays, objects, non-decimal text and unsafe numbers in branch requirements',()=>{
 for(const amount of [[8],{value:8},'1e1','0x10','8.5','Infinity',
  Number.MAX_SAFE_INTEGER+2,[],true]){
  const result=verdict({...skill(),reqs:[{branch:'benevolence',amount}]});
  assert.equal(result.learned,false,'invalid '+String(amount));
  assert.ok(result.problems.includes('Unknown requirement'));
 }
 for(const amount of [8,'8','08','8.0','+8',' 8 ']){
  assert.equal(verdict({...skill(),reqs:[{branch:'benevolence',amount}]}).learned,true,
   'valid '+String(amount));
 }
});

test('official source requirements agree on positive safe-integer validation',()=>{
 const catalog=Object.values(JSON.parse(read('data/os/skills.json')));
 for(const row of catalog){
  for(const req of row.reqs){
   assert.ok(Number.isSafeInteger(req.amount)&&req.amount>0,'skill ID '+row.id);
  }
 }
});

test('shared class predicate agrees between readiness, skill gallery and growth',()=>{
 const good={...skill(),classes:{CLERIC:1}};
 assert.equal(verdict(good).learned,true);
 for(const classes of [{CLERIC:'false'},{CLERIC:2},null,undefined]){
  const bad={...skill(),classes};
  const result=verdict(bad);
  assert.equal(result.learned,false);
  assert.ok(result.problems.includes('Unavailable to this class'));
 }
 assert.equal(source.split('allowedForJob(').length-1,4,
  'One helper plus growth, readiness and skill gallery call sites');
});
