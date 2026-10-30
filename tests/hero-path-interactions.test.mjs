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
 removeAttribute(name){delete this.attributes[name]}
 querySelector(tag){return walk(this).find(item=>item.tag===tag)||null}
 focus(){this.focused=true}
 prepend(...items){this.children.unshift(...items)}
 remove(){}
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
 assert.equal(x.read().inlineBranchId,'');
 x.onGroup('prayer');
 assert.equal(x.read().selectedSkillGroup,'prayer');
 assert.equal(x.read().inlineBranchId,'');
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

test('automatic category selection prioritizes real class branch caps over arbitrary first group',()=>{
 const nav=root.PandoraGameNavigation.groups;
 const classGroup=job=>nav.map(group=>({
  id:group.id,
  total:group.branches.filter(key=>key!=='race')
   .reduce((sum,key)=>sum+(classes[job]?.branchCaps[key]??0),0)
 })).sort((a,b)=>b.total-a.total)[0]?.id;
 assert.equal(classGroup('CLERIC'),'prayer');
 assert.equal(classGroup('MAGE'),'magic');
 assert.equal(classGroup('WARRIOR'),'melee');
 assert.equal(classGroup('PREDATOR'),'tactics');
 assert.match(sources['app.js'],/const ranked=groups\.map\(group=>/);
 assert.match(sources['app.js'],/selectedSkillGroup=ranked\[0\]\.id/);
});

test('real class change handler preserves all invested points and resets only navigation',()=>{
 const source=sources['app.js'];
 const match=source.match(/function selectJob\(index\)\{[\s\S]*?\n\}\nfunction renderJobs/);
 assert.ok(match,'selectJob implementation is missing');
 const body=match[0].replace(/\nfunction renderJobs$/,'');
 const state={job:16,points:{benevolence:31,blessing:9},mastery:{benevolence:27}};
 let renderCount=0,persistCount=0,saveCount=0;
 const runtime=Function('state','jobKeys','render','persist','saveView',
  "let selectedSkillGroup='prayer',inlineBranchId='benevolence',pathGroupTouched=true,selectedSkill={id:2};\n"+
  body+
  "\nreturn {selectJob,view:()=>({selectedSkillGroup,inlineBranchId,pathGroupTouched,selectedSkill})};"
 )(state,Array.from({length:28},(_,i)=>String(i)),()=>renderCount++,()=>persistCount++,()=>saveCount++);
 runtime.selectJob(21);
 assert.equal(state.job,21);
 assert.deepEqual(state.points,{benevolence:31,blessing:9});
 assert.equal(state.mastery.benevolence,27);
 assert.equal(runtime.view().selectedSkillGroup,null);
 assert.equal(runtime.view().inlineBranchId,null);
 assert.equal(runtime.view().pathGroupTouched,false);
 assert.equal(runtime.view().selectedSkill,null);
 assert.equal(renderCount,1);assert.equal(persistCount,1);assert.equal(saveCount,1);
});
test('OS skills above class cap stay visible as locked milestone data',()=>{
 const catalog=Object.values(JSON.parse(read('data/os/skills.json')));
 const library={};
 Function('window',read('skill-milestones.js'))(library);
 const source=sources['app.js'];
 const m=source.match(/milestones:(\(skills,key,cap\)=>\{[\s\S]*?\n  \}),\n  onGroup:/);
 assert.ok(m,'Hero Path milestone adapter missing');
 const adapter=Function('window','return ('+m[1]+')')({PandoraSkillMilestones:library.PandoraSkillMilestones});
 const skills=catalog.filter(s=>s.classes?.CLERIC&&s.reqs?.some(r=>r.branch==='brush'));
 const cap=classes.CLERIC.branchCaps.brush;
 assert.equal(cap,15);
 const marks=adapter(skills,'brush',cap);
 const beyond=marks.find(m=>m.threshold===41);
 assert.ok(beyond,'known source threshold 41 is missing');
 assert.equal(beyond.locked,true);
 assert.ok(beyond.skills.some(s=>s.name==='Раскол'));
 assert.ok(marks.every(mark=>mark.locked?mark.threshold>cap:mark.threshold<=cap));
});

test('closing a group clears child expansion and reopening leaves all branches folded',()=>{
 const app=sources['app.js'];
 assert.match(app,/inlineBranchId='';\s*renderBranches\(\)/);
 assert.match(app,/bootView\.groupTouched&&bootView\.expandedBranch===''/);
 assert.match(app,/if\(selected&&\(inlineBranchId===null/);
});

test('real OS class milestones are tiny pins instead of overlapping image buttons',()=>{
 Function('window',read('skill-milestones.js'))(root);
 const app=sources['app.js'];
 const m=app.match(/milestones:(\(skills,key,cap\)=>\{[\s\S]*?\n  \}),\n  onGroup:/);
 assert.ok(m);
 const adapter=Function('window','return ('+m[1]+')')({PandoraSkillMilestones:root.PandoraSkillMilestones});
 const f=fixture('CLERIC','melee','brush');
 f.api.milestones=adapter;
 f.api.skillCatalog=Object.values(JSON.parse(read('data/os/skills.json')));
 let hovered=0;
 f.api.hover=(node,skills)=>{if(Array.isArray(skills)&&skills.length)hovered++};
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const pins=walk(f.target).filter(x=>String(x.className).includes('path-milestone-pin'));
 assert.ok(pins.length>=1);
 assert.ok(pins.some(x=>String(x.attributes['data-milestone-points']).split(',').includes('41')));
 assert.ok(pins.every(x=>x.children.every(child=>child.tag!=='img')));
 assert.ok(pins.every(x=>!Object.hasOwn(x.style,'top')));
 assert.equal(hovered,pins.length);
});

test('close thresholds open a compact picker with each skill independently selectable',()=>{
 const f=fixture('CLERIC','prayer','benevolence');
 const skills=[8,10,42].map((threshold,index)=>({
  id:900+index,name:'Fixture '+threshold,classes:{CLERIC:true},
  branch:'benevolence',reqs:[{branch:'benevolence',amount:threshold}]
 }));
 let selected=null;
 f.api.skillCatalog=skills;
 f.api.milestones=()=>skills.map((skill,index)=>({
  threshold:skill.reqs[0].amount,skills:[skill],locked:false
 }));
 f.api.onSkill=skill=>{selected=skill};
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const pins=walk(f.target).filter(el=>String(el.className).includes('path-milestone-pin'));
 assert.equal(pins.length,2,'8/10 share a pin; 42 remains independent');
 assert.equal(pins[0].attributes['data-milestone-points'],'8,10');
 assert.ok(pins.every(pin=>!Object.hasOwn(pin.style,'top')),'pins use CSS rather than high inline offsets');
 const picker=walk(f.target).find(el=>el.className==='path-milestone-picker');
 assert.ok(picker);
 assert.equal(picker.hidden,true);
 pins[0].listeners.click();
 assert.equal(picker.hidden,false);
 assert.equal(pins[0].attributes['aria-expanded'],'true');
 const options=walk(picker).filter(el=>el.tag==='button');
 assert.equal(options.length,3,'two skills and a close control');
 options[1].listeners.click();
 assert.equal(selected.id,901,'second skill, not always first, is selectable');
 picker.listeners.keydown({key:'Escape',preventDefault(){}});
 assert.equal(picker.hidden,true);
 assert.equal(pins[0].attributes['aria-expanded'],'false');
 pins[1].listeners.click();
 assert.equal(selected.id,902,'single marker directly opens its skill');
});

test('skill progress slider does not show a duplicate native text tooltip',()=>{
 const f=fixture('CLERIC','prayer','benevolence');
 const tracks=walk(f.target).filter(el=>String(el.className).includes('inline-mastery-track'));
 assert.ok(tracks.length);
 assert.ok(tracks.every(el=>!el.title),'no native title that covers marker tooltip');
 assert.match(f.range.attributes['aria-valuetext'],/вложено/);
});

test('grouped markers preserve individual point thresholds and class locks',()=>{
 const f=fixture('CLERIC','melee','brush');
 const skills=[8,12].map((threshold,index)=>({
  id:980+index,name:'Grouped '+threshold,classes:{CLERIC:true},
  branch:'brush',reqs:[{branch:'brush',amount:threshold}]
 }));
 f.api.skillCatalog=skills;
 f.api.milestones=()=>[
  {threshold:8,skills:[skills[0]],locked:false},
  {threshold:12,skills:[skills[1]],locked:true}
 ];
 let selected=null;
 f.api.onSkill=skill=>selected=skill;
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const pin=walk(f.target).find(el=>String(el.className).includes('path-milestone-pin'));
 assert.ok(pin);
 assert.equal(pin.attributes['data-milestone-points'],'8,12');
 pin.listeners.click();
 const picker=walk(f.target).find(el=>el.className==='path-milestone-picker');
 const descriptions=walk(picker).filter(el=>el.tag==='small').map(el=>el.textContent);
 assert.ok(descriptions.some(text=>text.includes('8 очков')));
 assert.ok(descriptions.some(text=>text.includes('12 очков')&&text.includes('За пределом класса')));
 const options=walk(picker).filter(el=>el.tag==='button');
 options[1].listeners.click();
 assert.equal(selected.id,981);
 const heading=walk(f.target).find(el=>String(el.className).includes('game-tree-head active'));
 assert.ok(walk(heading).some(el=>el.tag==='small'&&el.textContent==='0 вложено'));
});
