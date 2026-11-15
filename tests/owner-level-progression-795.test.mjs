import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import worker from '../worker/index.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={window:{}};
for(const file of [
 'pandora-studio-level-progression.js',
 'pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js',
 'pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'
])vm.runInNewContext(read(file),ctx,{filename:file});
const model=ctx.window.PandoraLevelProgression;
const attr=ctx.window.PandoraAttributeProgression;
const skills=ctx.window.PandoraSkillProgression;
const safety=ctx.window.PandoraCatalogSafety;
const tables=JSON.parse(read('data/os/tables.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const data={tables,classes};

test('original 1–55 bonuses and cumulative attribute/skill budgets are preserved',()=>{
 const defaults=model.defaults();
 assert.equal(model.maxLevel(),55);
 assert.equal(model.rows().length,55);
 assert.deepEqual([defaults.attributes[1],defaults.skills[1]],[0,0]);
 for(const [level,stats,masteries] of [
  [1,0,0],[2,6,1],[45,432,104],[46,446,107],
  [47,460,110],[48,474,113],[49,488,116],[50,504,119],
  [51,512,122],[52,520,125],[53,528,128],[54,536,131],[55,544,134]
 ]){
  assert.equal(attr.budget(level),stats);
  assert.equal(skills.spending(tables.abilityPoint,level,{}).total,masteries);
 }
 assert.equal(safety.check(data).ok,true,safety.check(data).issues.join(';'));
});

test('admin explicitly increases to 60 and independent D1 rules affect full planner',()=>{
 const configured=model.resize(model.defaults(),60);
 assert.ok(configured);
 for(let i=56;i<=60;i++){
  assert.equal(configured.attributes[i],0);
  assert.equal(configured.skills[i],0);
  configured.attributes[i]=8;configured.skills[i]=3;
 }
 assert.equal(model.configure(JSON.stringify(configured)).ok,true);
 assert.equal(model.maxLevel(),60);
 assert.equal(attr.budget(55),544);
 assert.equal(attr.budget(60),584);
 assert.equal(skills.spending(tables.abilityPoint,60,{}).total,149,
  'The game table may still end at 55 but owner progression works');
 assert.equal(skills.skillGrant(60),3);
 const checked=safety.check({...data,tables:{...tables,levelCap:50}});
 assert.equal(checked.ok,true,checked.issues.join(';'));
 assert.equal(checked.plannerMax,60);
 assert.equal(checked.attributesAtMax,584);
 assert.equal(checked.skillsAtMax,149);
 const hero={race:'HUMAN',klass:'WARRIOR',level:60,
  stats:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},points:{}};
 const snapshot=safety.project(data,hero);
 assert.equal(snapshot.attributeBudget,584);
 assert.equal(snapshot.skillBudget,149);
 const base=ctx.window.PandoraOSCalculator.base({
  classData:classes.WARRIOR,raceData:tables.raceInit.HUMAN,jobData:tables.jobInit.WARRIOR,
  allocation:{},level:60
 });
 assert.ok(base&&Number.isFinite(base.hp)&&Number.isFinite(base.mp));
 // Live edits to existing levels also change accumulated totals.
 configured.attributes[50]=20;
 configured.skills[50]=5;
 assert.equal(model.configure(configured).ok,true);
 assert.equal(attr.budget(55),548);
 assert.equal(skills.spending(tables.abilityPoint,55,{}).total,136);
 assert.equal(safety.check(data).ok,true);
 model.configure(null);
 assert.equal(model.maxLevel(),55);
});

test('owner can edit grants even at the first level while default remains zero',()=>{
 const custom=model.defaults();
 custom.attributes[1]=7;custom.skills[1]=2;
 assert.equal(model.configure(custom).ok,true);
 assert.equal(attr.budget(1),7);
 assert.equal(skills.spending(tables.abilityPoint,1,{}).total,2);
 assert.equal(attr.budget(55),551);
 assert.equal(skills.spending(tables.abilityPoint,55,{}).total,136);
 model.configure(null);
 assert.equal(attr.budget(1),0);
 assert.equal(skills.spending(tables.abilityPoint,1,{}).total,0);
});

test('invalid owner tables are rejected without discarding the active version',()=>{
 const cases=[];
 const baseline=model.defaults();
 cases.push({...baseline,maxLevel:121});
 cases.push({...baseline,maxLevel:54,attributes:baseline.attributes.slice(0,55),
  skills:baseline.skills.slice(0,55)});
 cases.push({...baseline,attributes:[...baseline.attributes.slice(0,-1)]});
 cases.push({...baseline,attributes:[...baseline.attributes.slice(0,55),3.5]});
 cases.push({...baseline,skills:[...baseline.skills.slice(0,55),-1]});
 cases.push({...baseline,attributes:[...baseline.attributes.slice(0,55),501]});
 cases.push({...baseline,skills:[...baseline.skills.slice(0,55),1e100]});
 for(const invalid of cases){
  assert.equal(model.validate(invalid).ok,false);
  assert.equal(model.configure(invalid).ok,false);
  assert.equal(model.maxLevel(),55);
 }
});

test('owner controls appear in admin UI and sync via CAS with read-back',()=>{
 const app=read('pandora-studio-app.js'),html=read('index.html');
 const source=read('pandora-studio-progression-owner-editor.js');
 assert.match(html,/pandora-studio-level-progression\.js/);
 assert.match(html,/pandora-studio-progression-owner-editor\.js/);
 assert.match(app,/class:'owner-dock-levels'/);
 assert.match(app,/async function showOwnerLevelProgression/);
 assert.match(app,/apiRequest\('\/api\/admin\/override',\{key,value\}\)/);
 assert.match(app,/apiRequest\('\/api\/overrides',null,''\)/);
 assert.match(app,/applyPlannerOverride\(confirmed\)/);
 assert.match(app,/Math\.min\(window\.PandoraLevelProgression\.maxLevel\(\)/);
 assert.match(source,/canClose:.*=>!saving/);
 assert.match(source,/model\.validate\(draft\)/);
 assert.match(source,/onApplied\(serialized\)/);
 assert.match(read('worker/index.js'),/validPlannerProgression\(value\)/);
});

const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
const AUTH='Bearer '+'a'.repeat(43);
function makeFakeD1(){
 const store=new Map();
 return {store,DB:{prepare(sql){
  let args=[];
  return {
   bind(...v){args=v;return this},
   async first(){
    if(sql.includes('SELECT id FROM sessions'))return{id:1};
    throw Error('Unexpected first: '+sql);
   },
   async all(){
    if(sql.startsWith('SELECT key,value FROM overrides'))
     return{results:[...store].map(([key,value])=>({key,value}))};
    throw Error('Unexpected all: '+sql);
   },
   async run(){
    if(sql.startsWith('INSERT INTO overrides')){
     if(store.has(args[0]))return{meta:{changes:0}};
     store.set(args[0],args[1]);return{meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE overrides SET value=')){
     if(store.get(args[2])!==args[3])return{meta:{changes:0}};
     store.set(args[2],args[0]);return{meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM overrides WHERE key=? AND value=?')){
     if(store.get(args[0])!==args[1])return{meta:{changes:0}};
     store.delete(args[0]);return{meta:{changes:1}};
    }
    throw Error('Unexpected run: '+sql);
   }
  };
 }}};
}
const request=(path,payload,authorized=true)=>new Request(API+path,{
 method:'POST',headers:{Origin:'https://bonaqu.github.io',
  'Content-Type':'application/json',
  ...(authorized?{Authorization:AUTH}:{})},body:JSON.stringify(payload)
});

test('Worker accepts only authenticated and CAS-conditioned owner progression writes',async()=>{
 const fake=makeFakeD1(),key=model.KEY;
 const initial=JSON.stringify(model.defaults());
 const url='/api/admin/override';
 const denied=await worker.fetch(request(url,{key,value:initial,expectedValue:null},false),{DB:fake.DB});
 assert.equal(denied.status,401);
 const outdated=await worker.fetch(request(url,{key,value:initial}),{DB:fake.DB});
 assert.equal(outdated.status,428);
 const saved=await worker.fetch(request(url,{key,value:initial,expectedValue:null}),{DB:fake.DB});
 assert.equal(saved.status,200,await saved.clone().text());
 assert.equal(fake.store.get(key),initial);
 const other=model.resize(model.defaults(),60);
 const serial=JSON.stringify(other);
 const conflict=await worker.fetch(request(url,{key,value:serial,expectedValue:null}),{DB:fake.DB});
 assert.equal(conflict.status,409);
 const changed=await worker.fetch(request(url,{key,value:serial,expectedValue:initial}),{DB:fake.DB});
 assert.equal(changed.status,200,await changed.clone().text());
 assert.equal(fake.store.get(key),serial);
 const published=await worker.fetch(new Request(API+'/api/overrides'),{DB:fake.DB});
 assert.equal((await published.json()).values[key],serial);
 const bad={...other,skills:[...other.skills.slice(0,-1)]};
 const rejected=await worker.fetch(request(url,{
  key,value:JSON.stringify(bad),expectedValue:serial
 }),{DB:fake.DB});
 assert.equal(rejected.status,400);
 assert.equal(fake.store.get(key),serial);
 const reset=await worker.fetch(request('/api/admin/reset',{key,expectedValue:serial}),{DB:fake.DB});
 assert.equal(reset.status,200);
 assert.equal(fake.store.has(key),false);
});
