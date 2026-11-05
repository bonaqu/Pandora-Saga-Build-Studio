import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-theme.css');
const host={};
Function('window',read('pandora-studio-attribute-progression.js'))(host);
Function('window',read('pandora-studio-skill-progression.js'))(host);
const stats=host.PandoraAttributeProgression;
const skills=host.PandoraSkillProgression;
const os=JSON.parse(read('data/os/tables.json'));

test('a clean character and New Build require explicit race/class selection',()=>{
 assert.match(app,/function fresh\(\)\{return\{race:null,gender:0,job:null,level:1/);
 assert.match(app,/function newBlankBuild\(\)\{\s*selectActiveBuild\(null\);state=fresh\(\)/);
 assert.match(app,/function previewBaseStats\(snap=state\)\{[\s\S]*?return null;/);
 assert.match(app,/function attributeSnapshot\(\)\{\s*if\(!Number\.isInteger\(state\.race\)\|\|!Number\.isInteger\(state\.job\)\)return null/);
 assert.match(app,/originCopyLabel\(select,chosen\?'raceChosen':'raceChoose'/);
 assert.match(app,/chosen\?'✓ Выбрано':'Выбрать эту расу'/);
 assert.doesNotMatch(read('index.html'),/id="activeJob">Клирик|id="raceTitle">Эльф/);
});

test('all 55 level gains match Remaked BPt for both independent pools',()=>{
 let statBudget=0,skillBudget=0;
 for(let lv=1;lv<=55;lv++){
  const statGain=lv===1?0:lv<=9?6:lv<=19?8:lv<=29?10:lv<=39?12:lv<=49?14:lv===50?16:8;
  const skillGain=lv===1?0:lv<=10?1:lv<=20?2:3;
  statBudget+=statGain;
  skillBudget+=skillGain;
  assert.equal(stats.perLevel[lv],statGain,'attribute gain at level '+lv);
  assert.equal(stats.budget(lv),statBudget,'attribute budget at level '+lv);
  assert.equal(skills.skillGrant(lv),skillGain,'skill gain at level '+lv);
  const data=skills.spending(os.abilityPoint,lv,{slash:0});
  assert.equal(data.total,skillBudget,'skill budget at level '+lv);
  assert.equal(data.remaining,skillBudget,'available skill points at level '+lv);
 }
 assert.equal(statBudget,544);
 assert.equal(skillBudget,134);
 assert.equal(skills.spending(os.abilityPoint,1,{slash:1}).remaining,-1);
 assert.equal(skills.canAllocate(os.abilityPoint,1,{slash:0},'slash',90,1),false);
 assert.equal(skills.canAllocate(os.abilityPoint,2,{slash:0},'slash',90,1),true);
 assert.equal(skills.canAllocate(os.abilityPoint,2,{slash:1},'slash',90,2),false);
});

test('selected specialization has a distinct confirmed state at all three levels',()=>{
 assert.match(app,/const selectedCurrent=Boolean\(current&&state\.job===current\.i\)/);
 assert.match(app,/i===depth&&selectedCurrent\?' selected'/);
 assert.match(app,/class:'class-current-select'\+\(selectedCurrent\?' selected':''\)/);
 assert.match(css,/\.class-current-select\.selected\{/);
 assert.match(css,/\.class-wizard-step\.selected\{/);
 assert.match(css,/\.class-wizard-breadcrumbs button\.selected\{/);
});

function fakeClock(){
 let time=0,nextId=1;
 const jobs=new Map();
 function schedule(fn,ms,interval=false){
  const id=nextId++;jobs.set(id,{at:time+ms,fn,step:interval?ms:0});return id;
 }
 function advance(ms){
  const target=time+ms;
  while(true){
   const job=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];
   if(!job||job[1].at>target)break;
   const [id,task]=job;time=task.at;
   if(task.step)task.at+=task.step;else jobs.delete(id);
   task.fn();
  }
  time=target;
 }
 return {advance,setTimeout:(fn,ms)=>schedule(fn,ms),
  clearTimeout:id=>jobs.delete(id),setInterval:(fn,ms)=>schedule(fn,ms,true),
  clearInterval:id=>jobs.delete(id),pending:()=>jobs.size};
}
function fakeButton(){
 const handlers=new Map(),classes=new Set();
 return {disabled:false,isConnected:true,classes,attributes:{},
  classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},
  addEventListener:(type,fn)=>handlers.set(type,fn),
  setAttribute(k,v){this.attributes[k]=v},
  dispatch(type,details={}){handlers.get(type)?.({button:0,isPrimary:true,detail:1,key:null,...details})}};
}
function binder(clock){
 const source=app.slice(app.indexOf('function bindHoldStep('),app.indexOf('function setAttributePoints('));
 assert.ok(source.startsWith('function bindHoldStep('));
 return Function('setTimeout','clearTimeout','setInterval','clearInterval','lang',
  source+'; return bindHoldStep;')(
    clock.setTimeout,clock.clearTimeout,clock.setInterval,clock.clearInterval,'ru');
}

test('short pointer click adjusts by exactly one; keyboard clicks still work',()=>{
 const clock=fakeClock(),button=fakeButton();let count=0;
 binder(clock)(button,()=>{count++});
 button.dispatch('pointerdown');clock.advance(200);
 button.dispatch('pointerup');button.dispatch('click');
 assert.equal(count,1,'release click must not double-count the pointer press');
 clock.advance(2000);assert.equal(count,1);
 button.dispatch('click',{detail:0});
 assert.equal(count,2,'keyboard click changes by one');
 assert.equal(clock.pending(),0);
});
test('holding repeatedly adds points until release, leave, or a disabled cap',()=>{
 const clock=fakeClock(),button=fakeButton();let count=0;
 binder(clock)(button,()=>{count++;if(count===5)button.disabled=true});
 button.dispatch('pointerdown');
 clock.advance(339);assert.equal(count,1);
 clock.advance(1+85*4);assert.equal(count,5);
 assert.equal(clock.pending(),0,'repeating stops at cap');
 button.dispatch('pointerup');button.dispatch('click');
 assert.equal(count,5);
 button.disabled=false;
 button.dispatch('pointerdown');clock.advance(340);
 assert.equal(button.classes.has('is-repeating'),true);
 button.dispatch('pointerleave');
 assert.equal(button.classes.has('is-repeating'),false);
 const previous=count;clock.advance(1000);assert.equal(count,previous);
 button.dispatch('click',{detail:0});
 assert.equal(count,previous+1,'a cancelled pointer gesture must not eat the next keyboard click');
 assert.equal(clock.pending(),0);
});
test('race passive selection flows to the book calculator, not only the visual checkmark',()=>{
 assert.match(app,/potionContext:\{racialPassiveId:window\.PandoraGameNavigation\.canonicalRacialPassiveId\(/);
 assert.match(app,/state\.racialPassiveId=selected\?null:id;persist\(\);renderOriginPassives\(\);\s*renderOriginVitals\(\);renderOriginStats\(\);if\(stageAttributesPage\)renderStageAttributes\(\)/);
});
