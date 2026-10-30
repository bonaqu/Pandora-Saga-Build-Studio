import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sources=Object.fromEntries(['hero-path.js','skill-progression.js','game-navigation.js','app.js'].map(p=>[p,read(p)]));
const classes=JSON.parse(read('data/os/classes.json')),tables=JSON.parse(read('data/os/tables.json'));
class BrowserElement {
 constructor(tag){
  this.tag=tag;this.children=[];this.attributes={};this.listeners={};this.style={};
  this.className='';this.textContent='';this.value='';this._disabled=false;this._checked=false;
  this.hidden=false;this.scrollTop=0;this.dataset={};
 }
 append(...parts){this.children.push(...parts)}
 replaceChildren(...parts){this.children=[...parts]}
 setAttribute(name,value){
  this.attributes[name]=String(value);
  if(name==='disabled')this._disabled=true;
  if(name==='value')this.value=String(value);
 }
 get disabled(){return this._disabled}
 set disabled(value){
  this._disabled=Boolean(value);
  if(value)this.attributes.disabled='';else delete this.attributes.disabled;
 }
 get checked(){return this._checked}
 set checked(value){this._checked=Boolean(value)}
 addEventListener(name,callback){this.listeners[name]=callback}
 replaceWith(){}
}
const doc={createElement:tag=>new BrowserElement(tag),createTextNode:text=>({tag:'#text',textContent:text})};
const walk=node=>[node,...(node.children||[]).flatMap(x=>x.tag==='#text'?[x]:walk(x))];
const root={};
for(const path of ['skill-progression.js','game-navigation.js'])Function('window',sources[path])(root);
Function('window','document',sources['hero-path.js'])(root,doc);
const points=root.PandoraSkillProgression;
function fixture(job='CLERIC',section='prayer',branch='benevolence'){
 const state={level:45,points:{},masteryAuto:true,mastery:{}};
 const budget=()=>points.spending(tables.abilityPoint,state.level,state.points);
 const api={
  state,job,groups:root.PandoraGameNavigation.groups,selectedGroup:section,
  expandedBranch:branch,skillCatalog:[],catalogReady:false,allocationReady:true,
  budget:budget(),lang:'ru',branchName:key=>key,
  cap:key=>classes[job].branchCaps[key]??0,
  milestones:()=>[],icon:()=>null,hover:()=>{},
  onGroup:()=>{},onExpand:()=>{},onSkill:()=>{},onMastery:()=>{},
  onAllocate:(key,requested)=>{
   const current=points.potential(state,key),b=budget(),cap=classes[job].branchCaps[key]??0;
   const target=requested<=current?Math.max(0,requested):
    Math.min(requested,Math.max(0,Math.min(cap,b.total-b.spent+current)));
   if(!points.canAllocate(tables.abilityPoint,state.level,state.points,key,cap,target))return current;
   points.setPotential(state,key,target);return target;
  }
 };
 const target=new BrowserElement('root');
 root.PandoraHeroPath.viewGrowth(target,api);
 const range=walk(target).find(x=>x.tag==='input'&&x.attributes.type==='range');
 return {state,api,target,range,budget};
}
test('45-level Cleric with 103 available points has actually ENABLED skill range',()=>{
 const {range,budget}=fixture();
 assert.equal(budget().remaining,103);assert.ok(range);
 assert.equal(range.disabled,false);
 assert.equal(Object.hasOwn(range.attributes,'disabled'),false);
 assert.equal(range.attributes.max,'90');
});
test('range input spends 10, 30 points and refunds all back to 103',()=>{
 const {range,state,budget}=fixture();
 range.value='10';range.listeners.input();
 assert.equal(state.points.benevolence,10);assert.equal(budget().remaining,93);
 range.value='30';range.listeners.input();
 assert.equal(state.points.benevolence,30);assert.equal(budget().remaining,73);
 range.value='0';range.listeners.input();
 assert.equal(state.points.benevolence,0);assert.equal(budget().remaining,103);
});
test('zero class-cap cannot be spent',()=>{
 const {range,budget}=fixture('CLERIC','melee','slash');
 assert.ok(range);assert.equal(range.disabled,true);assert.equal(budget().remaining,103);
});
test('actual app category handler collapses and reopens on repeated click',()=>{
 const match=sources['app.js'].match(/onGroup:(key=>\{[\s\S]*?\n  \}),\n  onExpand:/);
 assert.ok(match,'handler not found');
 const run='let selectedSkillGroup="prayer",inlineBranchId="benevolence",pathGroupTouched=false;'+
  'const branchCap=k=>k==="benevolence"?90:0,renderBranches=()=>{},saveView=()=>{};'+
  'const onGroup='+match[1]+';'+
  'return {onGroup,read:()=>({selectedSkillGroup,inlineBranchId,pathGroupTouched})};';
 const x=Function('groups','document',run)(root.PandoraGameNavigation.groups,{querySelector:()=>null});
 x.onGroup('prayer');
 assert.equal(x.read().selectedSkillGroup,null);
 assert.equal(x.read().inlineBranchId,null);
 x.onGroup('prayer');
 assert.equal(x.read().selectedSkillGroup,'prayer');
 assert.equal(x.read().inlineBranchId,'benevolence');
});
test('HTML boolean attributes in app factory use actual property semantics',()=>{
 const app=sources['app.js'],begin=app.indexOf('function h('),end=app.indexOf('\nfunction imageUrl',begin);
 assert.ok(begin>=0&&end>begin);
 const h=Function('document',app.slice(begin,end)+'\nreturn h;')(doc);
 const enabled=h('button',{disabled:false,text:'Enabled'});
 const disabled=h('button',{disabled:true,text:'Disabled'});
 assert.equal(enabled.disabled,false);
 assert.equal(Object.hasOwn(enabled.attributes,'disabled'),false);
 assert.equal(disabled.disabled,true);
});
