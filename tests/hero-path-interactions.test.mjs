import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sources=Object.fromEntries(['pandora-studio-hero-path.js','pandora-studio-skill-progression.js','pandora-studio-navigation.js','pandora-studio-app.js'].map(p=>[p,read(p)]));
const classes=JSON.parse(read('data/os/classes.json')),tables=JSON.parse(read('data/os/tables.json'));
class BrowserElement {
 constructor(tag){
  this.tag=tag;this.children=[];this.attributes={};this.listeners={};this.style={};
  this.className='';this.textContent='';this.value='';this._disabled=false;this._checked=false;
  this.hidden=false;this.scrollTop=0;this.dataset={};
  const setClass=(name,on)=>{
    const parts=new Set(this.className.split(/\s+/).filter(Boolean));
    if(on)parts.add(name);else parts.delete(name);
    this.className=[...parts].join(' ');
    return Boolean(on);
   };
   this.classList={toggle:setClass,add:name=>setClass(name,true),
    remove:name=>setClass(name,false),
    contains:name=>this.className.split(/\s+/).includes(name)};
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
for(const path of ['pandora-studio-skill-progression.js','pandora-studio-navigation.js'])Function('window',sources[path])(root);
Function('window','document',sources['pandora-studio-hero-path.js'])(root,doc);
const points=root.PandoraSkillProgression;
function fixture(job='CLERIC',section='prayer',branch='benevolence'){
 const state={level:45,points:{},masteryAuto:true,mastery:{},masteryFormat:2};
 const budget=()=>points.spending(tables.abilityPoint,state.level,state.points);
 const api={
  state,job,groups:root.PandoraGameNavigation.groups,selectedGroup:section,
  expandedBranch:branch,skillCatalog:[],catalogReady:false,allocationReady:true,
  budget:budget(),lang:'ru',branchName:key=>key,
  innate:tables.jobInit[classes[job].baseClass||job]?.branches||{},
  branchCaps:classes[job].branchCaps,
  cap:key=>classes[job].branchCaps[key]??0,
  milestones:()=>[],icon:()=>null,hover:()=>{},
  onGroup:()=>{},onExpand:()=>{},onSkill:()=>{},onMastery:()=>{},
  onAllocate:(key,requested)=>{
   const current=points.potential(state,key),b=budget(),cap=classes[job].branchCaps[key]??0;
   const base=points.branchBase(api.innate,key);
   const target=requested<=current?Math.max(0,requested):
    Math.min(requested,Math.max(0,cap>0?b.total-b.spent+current:0),Math.max(0,cap-base));
   if(!points.canAllocate(tables.abilityPoint,state.level,state.points,key,
    cap>0?Number.MAX_SAFE_INTEGER:0,target))return current;
   return points.setPotential(state,key,target,api.innate,api.branchCaps)?target:current;
  }
 };
 const target=new BrowserElement('root');
 root.PandoraHeroPath.viewGrowth(target,api);
 const range=walk(target).find(x=>x.tag==='input'&&x.attributes.type==='range');
 return {state,api,target,range,budget};
}
test('Hero Path owner group edit pencil is a sibling BUTTON, not nested in disclosure',()=>{
 const {target,api}=fixture();
 api.canEdit=true;
 api.copyLabel=(key,ru,en)=>ru;
 api.editLabel=()=>{};
 root.PandoraHeroPath.viewGrowth(target,api);
 const headers=walk(target).filter(x=>x.className==='game-tree-head-row');
 assert.ok(headers.length>0);
 for(const header of headers){
  const buttons=header.children.filter(x=>x.tag==='button');
  assert.equal(buttons.length,2,'one independent expand and one edit action');
  const [disclosure,pencil]=buttons;
  assert.match(disclosure.className,/game-tree-head/);
  assert.equal(pencil.className,'path-group-pencil');
  assert.equal(pencil.attributes.type,'button');
  assert.equal(disclosure.attributes['data-path-group']?.length>0,true);
  assert.equal(pencil.attributes.role,undefined);
  assert.equal(pencil.attributes.tabindex,undefined);
  assert.ok(!walk(disclosure).some(x=>x.className==='path-group-pencil'));
  assert.equal(typeof disclosure.listeners.click,'function');
  assert.equal(typeof pencil.listeners.click,'function');
 }
 const normal=fixture();
 assert.ok(walk(normal.target).filter(x=>x.className==='game-tree-head-row')
  .every(header=>header.children.filter(x=>x.tag==='button').length===1));
});

test('45-level Cleric with 104 available points has actually ENABLED skill range',()=>{
 const {range,budget}=fixture();
 assert.equal(budget().remaining,104);assert.ok(range);
 assert.equal(range.disabled,false);
 assert.equal(Object.hasOwn(range.attributes,'disabled'),false);
 assert.equal(range.attributes.max,'90');
});
test('range input spends 10, 30 points and refunds all back to 104',()=>{
 const {range,state,budget}=fixture();
 range.value='15';range.listeners.input();
 assert.equal(state.points.benevolence,10);assert.equal(budget().remaining,94);
 range.value='35';range.listeners.input();
 assert.equal(state.points.benevolence,30);assert.equal(budget().remaining,74);
 range.value='5';range.listeners.input();
 assert.equal(state.points.benevolence,0);assert.equal(budget().remaining,104);
});
test('zero class-cap cannot be spent',()=>{
 const {range,budget}=fixture('CLERIC','melee','slash');
 assert.ok(range);assert.equal(range.disabled,true);assert.equal(budget().remaining,104);
});
test('actual app category handler collapses and reopens on repeated click',()=>{
 const match=sources['pandora-studio-app.js'].match(/onGroup:(key=>\{[\s\S]*?\n  \}),\n  onExpand:/);
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
 const app=sources['pandora-studio-app.js'],begin=app.indexOf('function h('),end=app.indexOf('\nfunction imageUrl',begin);
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
 assert.match(sources['pandora-studio-app.js'],/const ranked=groups\.map\(group=>/);
 assert.match(sources['pandora-studio-app.js'],/selectedSkillGroup=ranked\[0\]\.id/);
});

test('real class change handler preserves all invested points and resets only navigation',()=>{
 const source=sources['pandora-studio-app.js'];
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
 Function('window',read('pandora-studio-skill-milestones.js'))(library);
 const source=sources['pandora-studio-app.js'];
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
 const app=sources['pandora-studio-app.js'];
 assert.match(app,/inlineBranchId='';\s*renderBranches\(\)/);
 assert.match(app,/bootView\.groupTouched&&bootView\.expandedBranch===''/);
 assert.match(app,/if\(selected&&\(inlineBranchId===null/);
});

test('real class milestone markers have preview tooltips without blocking the range',()=>{
 Function('window',read('pandora-studio-skill-milestones.js'))(root);
 const app=sources['pandora-studio-app.js'];
 const m=app.match(/milestones:(\(skills,key,cap\)=>\{[\s\S]*?\n  \}),\n  onGroup:/);
 assert.ok(m);
 const adapter=Function('window','return ('+m[1]+')')({PandoraSkillMilestones:root.PandoraSkillMilestones});
 const f=fixture('CLERIC','melee','brush');
 f.api.milestones=adapter;
 f.api.skillCatalog=Object.values(JSON.parse(read('data/os/skills.json')));
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const ticks=walk(f.target).filter(x=>String(x.className).includes('path-unlock-notch'));
 assert.ok(ticks.length>0);
 assert.ok(ticks.some(x=>x.attributes['data-milestone-points']==='41'));
 assert.ok(ticks.every(x=>x.tag==='span'));
 assert.ok(ticks.every(x=>!x.listeners.click));
 assert.ok(ticks.every(x=>walk(x).some(y=>y.className==='path-milestone-tooltip')));
 assert.ok(ticks.every(x=>!Object.hasOwn(x.style,'top')));
 assert.ok(f.range.listeners.input,'range has its own input handler');
 const disclosure=walk(f.target).find(x=>x.className==='path-unlock-details');
 assert.ok(disclosure);
 assert.equal(disclosure.tag,'details');
 assert.ok(disclosure.children.some(x=>x.tag==='summary'));
});

test('nearby skill thresholds remain individually inspectable without blocking the range',()=>{
 const f=fixture('CLERIC','prayer','benevolence');
 const skills=[8,10,42].map((threshold,index)=>({
  id:900+index,name:'Fixture '+threshold,classes:{CLERIC:true},
  branch:'benevolence',reqs:[{branch:'benevolence',amount:threshold}]
 }));
 let selected=null;
 f.api.skillCatalog=skills;
 f.api.milestones=()=>skills.map(skill=>({
  threshold:skill.reqs[0].amount,skills:[skill],locked:false
 }));
 f.api.onSkill=skill=>{selected=skill};
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const ticks=walk(f.target).filter(x=>String(x.className).includes('path-unlock-notch'));
 assert.deepEqual(ticks.map(x=>x.attributes['data-milestone-points']),['8','10','42']);
 assert.ok(ticks.every(x=>!x.listeners.click),'preview markers do not intercept range clicks');
 assert.ok(ticks.every(x=>x.attributes.tabindex==='0'),'markers are keyboard focusable');
 assert.ok(ticks.every(x=>walk(x).some(y=>y.className==='path-milestone-preview')));
 const details=walk(f.target).find(x=>x.className==='path-unlock-details');
 assert.ok(details);
 assert.equal(details.attributes.open,undefined,'skill list is collapsed by default');
 const options=walk(details).filter(x=>x.tag==='button');
 assert.equal(options.length,3);
 options[1].listeners.click();
 assert.equal(selected.id,901,'second skill remains separately selectable');
 options[2].listeners.click();
 assert.equal(selected.id,902,'last skill remains separately selectable');
 f.range.value='11';f.range.listeners.input();
 assert.equal(f.state.points.benevolence,6,'slider includes 5 initial + 6 invested');
});

test('skill progress slider does not show a duplicate native text tooltip',()=>{
 const f=fixture('CLERIC','prayer','benevolence');
 const tracks=walk(f.target).filter(el=>String(el.className).includes('inline-mastery-track'));
 assert.ok(tracks.length);
 assert.ok(tracks.every(el=>!el.title),'no native title');
 assert.match(f.range.attributes['aria-valuetext'],/вложено/);
});

test('class-limited skills keep individual numbers in the separate details list',()=>{
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
 const ticks=walk(f.target).filter(x=>String(x.className).includes('path-unlock-notch'));
 assert.deepEqual(ticks.map(x=>x.attributes['data-milestone-points']),['8','12']);
 const details=walk(f.target).find(x=>x.className==='path-unlock-details');
 const captions=walk(details).filter(x=>x.tag==='small').map(x=>x.textContent);
 assert.ok(captions.some(x=>x.includes('8 оч.')));
 assert.ok(captions.some(x=>x.includes('12 оч.')&&x.includes('выше лимита')));
 const options=walk(details).filter(x=>x.tag==='button');
 options[1].listeners.click();assert.equal(selected.id,981);
 const heading=walk(f.target).find(x=>String(x.className).includes('game-tree-head active'));
 assert.ok(walk(heading).some(x=>x.tag==='small'&&x.textContent.includes('освоено')));
});

test('requirements above 90 are visible only in the accessible list, never off the fixed track',()=>{
 const f=fixture('CLERIC','prayer','benevolence');
 const mk=(id,threshold)=>({id,name:'Skill '+id,branch:'benevolence',
  classes:{CLERIC:1},charLevel:1,reqs:[{branch:'benevolence',amount:threshold}]});
 const normal=mk(90001,20),future=mk(90002,95);
 f.api.skillCatalog=[normal,future];
 f.api.milestones=()=>[{threshold:20,skills:[normal],locked:false},
  {threshold:95,skills:[future],locked:true}];
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const nodes=walk(f.target);
 const ticks=nodes.filter(x=>String(x.className).includes('path-unlock-notch'));
 const list=nodes.filter(x=>String(x.className).includes('path-unlock-skill'));
 assert.deepEqual(ticks.map(x=>x.attributes['data-milestone-points']),['20']);
 assert.equal(list.length,2);
 assert.equal(list[1].className.includes('unreachable'),true);
});

test('milestone at 90 responds to allocated branch points, even when manual mastery is zero',()=>{
 const css=read('pandora-studio-theme.css');
 assert.match(css,/\.path-integrated-track \.path-unlock-notch\{/);
 const f=fixture('CLERIC','prayer','benevolence');
 f.state.masteryAuto=false;
 const skill={id:9099,name:'Skill at 90',branch:'benevolence',
  classes:{CLERIC:1},charLevel:1,reqs:[{branch:'benevolence',amount:90}]};
 f.api.skillCatalog=[skill];
 f.api.milestones=()=>[{threshold:90,skills:[skill],locked:false}];
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const tick=walk(f.target).find(x=>String(x.className).includes('path-unlock-notch'));
 assert.ok(tick&&!tick.className.includes('reached'));
 const range=walk(f.target).find(x=>x.tag==='input'&&x.attributes.type==='range');
 range.value='90';range.listeners.input();
 assert.equal(f.state.points.benevolence,85);
 assert.equal(points.branchMastery(f.state,'benevolence',f.api.innate,f.api.branchCaps),0);
 assert.ok(tick.className.includes('reached'),
  'first skill uses allocated branch points, no circular green mastery requirement');
});

test('invested 0,1,2,0 preserves compact header, auto green follows effective level',()=>{
 const f=fixture('CLERIC','prayer','benevolence');
 const row=walk(f.target).find(x=>x.attributes?.['data-path-branch']==='benevolence');
 assert.ok(row);
 assert.equal(row.children.length,2);
 assert.equal(row.children[0].children.length,1);
 const counter=row.children[1];
 const mastery=walk(f.target).find(x=>x.attributes?.['data-branch-control']==='benevolence:mastery-number');
 for(const n of [0,1,2,0]){
  f.range.value=String(5+n);f.range.listeners.input();
  assert.equal(row.children.length,2);
  assert.equal(row.children[0].children.length,1);
  assert.equal(counter.textContent,(5+n)+' / 90');
  assert.equal(mastery.value,String(5+n));
 }
 const css=read('pandora-studio-theme.css');
 assert.match(css,/\.game-tree-group \.branch-row>div>strong\{[\s\S]*?white-space:nowrap/);
 assert.match(css,/\.game-tree-group \.branch-row>\.count\{[\s\S]*?white-space:nowrap/);
});

test('clearing additional investment refunds only that branch; slider returns to its innate level',()=>{
 const f=fixture('CLERIC','prayer','benevolence');
 const field=walk(f.target).find(x=>x.attributes?.['data-branch-control']==='benevolence:potential-number');
 f.state.points.blessing=4;
 f.range.value='12';f.range.listeners.input();
 assert.equal(f.budget().spent,11);
 for(const raw of ['-1','1.5']){
  field.value=raw;field.listeners.change();
  assert.equal(f.state.points.benevolence,7);
  assert.equal(field.value,'7');
  assert.equal(f.range.value,'12');
 }
 field.value='';field.listeners.change();
 assert.equal(f.state.points.benevolence,0);
 assert.equal(f.state.points.blessing,4);
 assert.equal(f.budget().spent,4);
 assert.equal(field.value,'0');
 assert.equal(f.range.value,'5','the slider shows five class-start points');
 field.value='5';field.listeners.change();
 assert.equal(f.state.points.benevolence,5);
 field.value='0';field.listeners.change();
 assert.equal(f.state.points.benevolence,0);
});

test('empty manually trained mastery is zero and independent from starting branch allocation',()=>{
 const f=fixture('CLERIC','prayer','benevolence');
 f.state.masteryAuto=false;f.state.points.benevolence=8;
 f.state.masteryFormat=2;f.state.mastery.benevolence=6;
 const called=[];
 f.api.onMastery=(key,n)=>{
  called.push(n);return points.setTrained(f.state,key,n,f.api.innate,f.api.branchCaps)
 };
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const field=walk(f.target).find(x=>x.attributes?.['data-branch-control']==='benevolence:mastery-number');
 for(const raw of ['-2','2.5']){
  field.value=raw;field.listeners.change();
  assert.equal(field.value,'6');
  assert.equal(points.trained(f.state,'benevolence',f.api.innate,f.api.branchCaps),6);
 }
 assert.deepEqual(called,[]);
 field.value='';field.listeners.change();
 assert.deepEqual(called,[0]);
 assert.equal(points.trained(f.state,'benevolence',f.api.innate,f.api.branchCaps),0);
 assert.equal(f.state.points.benevolence,8);
 field.value='9';field.listeners.change();
 assert.equal(points.trained(f.state,'benevolence',f.api.innate,f.api.branchCaps),9);
 field.value='0';field.listeners.change();
 assert.equal(points.trained(f.state,'benevolence',f.api.innate,f.api.branchCaps),0);
});

test('real Vнезапный выстрел threshold 21 aligns with 18 invested above 3 class-start points',()=>{
 const skills=Object.values(JSON.parse(read('data/os/skills.json')));
 const ability=skills.find(x=>x.name==='Внезапный выстрел'&&x.learnable===true);
 assert.ok(ability,'official skill exists');
 assert.deepEqual(ability.reqs,[{branch:'archery',amount:50},{branch:'assassin',amount:21}]);
 const f=fixture('SNIPER','tactics','assassin');
 assert.equal(f.api.innate.assassin,3);
 assert.equal(points.setPotential(f.state,'assassin',18,f.api.innate,f.api.branchCaps),true);
 assert.equal(points.setPotential(f.state,'archery',45,f.api.innate,f.api.branchCaps),true);
 assert.equal(points.branchPotential(f.state,'assassin',f.api.innate,f.api.branchCaps),21);
 assert.equal(points.potential(f.state,'assassin'),18);
 assert.equal(root.PandoraHeroPath.readiness(ability,{...f.api,skillCatalog:[ability]}).learned,true,
  'unlock is reached with 18 manually invested points + 3 starting points');
 f.api.skillCatalog=[ability];
 f.api.milestones=()=>[{threshold:21,skills:[ability],locked:false}];
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const all=walk(f.target);
 const tick=all.find(node=>node.attributes?.['data-milestone-points']==='21');
 const numeric=all.find(node=>node.attributes?.['data-branch-control']==='assassin:potential-number');
 const mastery=all.find(node=>node.attributes?.['data-branch-control']==='assassin:mastery-number');
 const range=all.find(node=>node.attributes?.['data-branch-control']==='assassin:potential-range');
 const caption=walk(tick).find(node=>node.className==='path-milestone-investment');
 const notch=all.find(node=>node.className==='path-current-notch');
 assert.ok(tick&&numeric&&mastery&&caption&&notch);
 assert.equal(numeric.value,'18','Spent field excludes class start');
 assert.equal(range.value,'21','thumb displays total branch level');
 assert.equal(mastery.value,'21','automatic mastery follows branch level');
 assert.equal(tick.attributes['data-milestone-invested'],'18');
 assert.equal(caption.textContent,'Начально (оч.): 3 · Вложено (оч.): 18');
 assert.match(tick.attributes['aria-label'],/21 оч\. ветки.*Вложено \(оч\.\): 18/);
 const fraction=21/90,container=390,usable=container-42;
 const tickX=21+usable*21/90;
 const match=/calc\((\d+(?:\.\d+)?)% ([+-]) (\d+(?:\.\d+)?)px\)/.exec(notch.style.left);
 assert.ok(match);
 const notchX=container*Number(match[1])/100+
  (match[2]==='-'?-1:1)*Number(match[3]);
 assert.ok(Math.abs(notchX-tickX)<0.01,
  'milestone and current notch stay on the exact same 0..90 rail');
});

test('Tactics shows 44 trained / 44 learned / 29 invested, then 0 trained but 44 learned when auto is off',()=>{
 const f=fixture('SNIPER','tactics','assassin');
 f.state.points.archery=11;
 f.state.points.assassin=18;
 f.api.budget=f.budget();
 const count=()=>{
  root.PandoraHeroPath.viewGrowth(f.target,f.api);
  const head=walk(f.target).find(el=>el.attributes?.['data-path-group']==='tactics');
  assert.ok(head,'Tactics header must exist');
  return head.children.find(el=>el.tag==='small')?.textContent;
 };
 assert.equal(count(),'освоено 44 · изучено 44 · вложено 29');
 f.state.masteryAuto=false;
 f.state.mastery={};
 assert.equal(count(),'освоено 0 · изучено 44 · вложено 29');
});


test('Hero Path skill lookup is order-independent and hides internal ID in both languages',()=>{
 const skill={id:390077001,name:'Огненный удар',desc:'Игровой навык',
  classes:{WARRIOR:1},learnable:true,prereq:390077999,reqs:[]};
 const api={state:{level:20,points:{}},job:'WARRIOR',lang:'ru',
  skillCatalog:[skill],catalogReady:true,query:'удар   ОГНЕННЫЙ',
  filter:'all',shown:24,selectedSkill:skill,
  icon:()=>null,hover:()=>{},onInspect:()=>{}};
 const target=new BrowserElement('root'),details=new BrowserElement('root');
 const render=()=>root.PandoraHeroPath.viewSkills(target,details,api);
 render();
 assert.equal(walk(target).filter(x=>x.attributes?.['data-skill-id']==='390077001').length,1,
  'Reversed words must find the original skill');
 assert.ok(walk(details).some(x=>x.className==='path-skill-previous-label'&&
  x.textContent==='Предыдущее умение'));
 assert.ok(walk(details).some(x=>x.className==='path-skill-previous-value'&&
  x.textContent==='Умение отсутствует в каталоге'));
 assert.equal(walk(details).some(x=>x.tag==='dt'&&x.textContent==='ID умения'),false);
 assert.equal(walk(details).some(x=>String(x.textContent).includes('390077')),false,
  'A nontechnical player must not see unknown catalog identifiers');
 api.query='УДАР огненный';api.lang='en';
 render();
 assert.ok(walk(details).some(x=>x.className==='path-skill-previous-label'&&
  x.textContent==='Previous skill'));
 assert.ok(walk(details).some(x=>x.className==='path-skill-previous-value'&&
  x.textContent==='Skill not in catalog'));
 assert.equal(walk(details).some(x=>x.tag==='dt'&&x.textContent==='Skill ID'),false);
 api.query='390077001';render();
 assert.equal(walk(target).filter(x=>x.attributes?.['data-skill-id']==='390077001').length,1,
  'Internal ID search can still work without being displayed');
 api.query='огненный отсутствующий';render();
 assert.ok(walk(target).some(x=>x.textContent==='No skills match these filters.'));
});


test('English Hero Path skill search finds confirmed Russian source aliases without changing records',()=>{
 const skill={id:100051001,name:'Lunge',desc:'Increases Attack Speed',
  classes:{WARRIOR:1},learnable:true,reqs:[]};
 const sourceBefore=JSON.stringify(skill);
 const api={state:{level:40,points:{}},job:'WARRIOR',lang:'en',catalogReady:true,
  skillCatalog:[skill],query:'рывок',filter:'all',shown:24,selectedSkill:skill,
  skillSearchText:row=>[row.name,'Рывок',row.id].join(' '),
  icon:()=>null,hover:()=>{},onInspect:()=>{}};
 const target=new BrowserElement('root'),details=new BrowserElement('root');
 root.PandoraHeroPath.viewSkills(target,details,api);
 assert.equal(walk(target).filter(x=>x.attributes?.['data-skill-id']==='100051001').length,1);
 assert.ok(walk(details).some(x=>x.tag==='h3'&&x.textContent==='Lunge'));
 assert.equal(JSON.stringify(skill),sourceBefore,'Search must not rewrite official game data');
 api.query='LUNGE';root.PandoraHeroPath.viewSkills(target,details,api);
 assert.equal(walk(target).filter(x=>x.attributes?.['data-skill-id']==='100051001').length,1);
 api.query='разгон';root.PandoraHeroPath.viewSkills(target,details,api);
 assert.ok(walk(target).some(x=>x.textContent==='No skills match these filters.'));
 const app=sources['pandora-studio-app.js'];
 assert.ok(app.includes("catalogSource?.skills?.[String(skill.id)]?.name"),
  'Russian search alias must originate from the source game catalog');
 assert.ok(app.includes("officialEnglish?.skills?.[String(skill.id)]?.n"),
  'English search alias must originate from the verified EN catalog');
});


test('Hero Path detail omits zero character-level threshold rather than claiming unknown requirement',()=>{
 const rows=Object.values(JSON.parse(read('data/os/skills.json')));
 const noLevel=rows.find(skill=>skill.charLevel===0&&skill.learnable===true&&
  skill.classes?.WARRIOR===1&&skill.prereq==null&&
  Array.isArray(skill.reqs)&&skill.reqs.length>0);
 const levelFive=rows.find(skill=>skill.charLevel===5&&
  skill.classes?.WARRIOR===1&&skill.learnable===true);
 assert.ok(noLevel,'Test needs a real learnable level-zero Warrior skill');
 assert.ok(levelFive,'Test needs a real explicit character-level requirement');
 const target=new BrowserElement('root'),detail=new BrowserElement('root');
 const api={lang:'ru',state:{level:45,points:{}},job:'WARRIOR',
  skillCatalog:[noLevel,levelFive],catalogReady:true,query:'',filter:'all',
  shown:24,selectedSkill:noLevel,icon:()=>null,hover:()=>{},onInspect:()=>{},
  branchName:branch=>branch,innate:{},branchCaps:{}};
 root.PandoraHeroPath.viewSkills(target,detail,api);
 let captions=walk(detail).map(node=>node.textContent);
 assert.equal(captions.includes('Уровень персонажа'),false,
  'A sourced zero must not look like an unknown character-level restriction');
 assert.equal(captions.includes('Нет известного порога'),false);
 api.selectedSkill=levelFive;
 root.PandoraHeroPath.viewSkills(target,detail,api);
 captions=walk(detail).map(node=>node.textContent);
 assert.ok(captions.includes('Уровень персонажа'),
  'Known nonzero character-level requirement must remain visible');
 assert.ok(captions.includes('5'));
 api.lang='en';
 root.PandoraHeroPath.viewSkills(target,detail,api);
 captions=walk(detail).map(node=>node.textContent);
 assert.ok(captions.includes('Character level'));
 api.selectedSkill=noLevel;
 root.PandoraHeroPath.viewSkills(target,detail,api);
 captions=walk(detail).map(node=>node.textContent);
 assert.equal(captions.includes('Character level'),false);
 assert.equal(captions.includes('Unknown requirement'),false);
});


test('Hero Path displays localized element names without exposing OS codes or NONE',()=>{
 const skill=(id,name,element)=>({id,name,element,classes:{MAGE:1},learnable:true,reqs:[]});
 const ordinary=skill(1,'Ordinary skill','NONE'),fire=skill(2,'Fire skill','FIRE'),
  unknown=skill(3,'Unknown skill','UNMAPPED'),unnamed=skill(4,undefined,'COLD');
 const api={lang:'ru',state:{level:45,points:{}},job:'MAGE',catalogReady:true,
  skillCatalog:[ordinary,fire,unknown,unnamed],query:'',filter:'all',
  shown:24,selectedSkill:ordinary,icon:()=>null,hover:()=>{},onInspect:()=>{}};
 const target=new BrowserElement('root'),details=new BrowserElement('root');
 const render=()=>root.PandoraHeroPath.viewSkills(target,details,api);
 const captions=()=>walk(details).filter(n=>n.tag==='dt').map(n=>n.textContent);
 const values=()=>walk(details).filter(n=>n.tag==='dd').map(n=>n.textContent);
 render();
 assert.equal(captions().includes('Стихия'),false,'NONE must not be a shown element');
 api.selectedSkill=fire;render();
 assert.ok(captions().includes('Стихия'));
 assert.ok(values().includes('Огонь'));
 assert.equal(values().includes('FIRE'),false);
 api.lang='en';render();
 assert.ok(captions().includes('Element'));assert.ok(values().includes('Fire'));
 api.selectedSkill=unknown;render();
 assert.ok(values().includes('Unknown'));assert.equal(values().includes('UNMAPPED'),false);
 api.selectedSkill=unnamed;render();
 assert.ok(values().includes('Ice'));
 const card=walk(target).find(n=>n.attributes?.['data-skill-id']==='4');
 assert.ok(card?.attributes['aria-label'].includes('Unnamed skill'));
 assert.equal(card.attributes['aria-label'].includes('undefined'),false);
});

test('point-stepper hold instructions follow RU/EN Hero Path language',()=>{
 const {target,api}=fixture();
 const descriptions=()=>walk(target).filter(n=>n.attributes?.['aria-description'])
  .map(n=>n.attributes['aria-description']);
 assert.ok(descriptions().length>=2);
 assert.ok(descriptions().every(v=>v.startsWith('Нажмите,')));
 api.lang='en';root.PandoraHeroPath.viewGrowth(target,api);
 assert.ok(descriptions().length>=2);
 assert.ok(descriptions().every(v=>v==='Click to change by 1; hold to repeat.'));
});

test('Racial path remains disabled with an independent owner-copy pencil',()=>{
 const f=fixture('CLERIC','special','riding');f.api.canEdit=true;
 const edits=[];f.api.copyLabel=(key,ru)=>key==='racialBranch'?'Редакция':ru;
 f.api.editLabel=(node,key,ru,en)=>edits.push({key,ru,en,node});
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const ownerRows=walk(f.target).filter(x=>x.className==='path-racial-owner-row');
 assert.equal(ownerRows.length,1);
 const [race,label,pencil]=ownerRows[0].children;
 assert.equal(race.disabled,true);
 assert.equal(race.attributes['data-path-branch'],'race');
 assert.equal(pencil.tag,'button');
 assert.equal(pencil.attributes.type,'button');
 assert.equal(pencil.className,'path-racial-pencil');
 assert.equal(typeof pencil.listeners.click,'function');
 assert.equal(walk(label).find(x=>x.tag==='strong').textContent,'Редакция');
 assert.equal(walk(race).find(x=>x.tag==='strong'),undefined,
  'Editors must never be children of a disabled button');
 assert.ok(!walk(race).some(x=>x.className==='path-racial-pencil'));
 assert.equal(edits.find(x=>x.key==='racialBranch')?.ru,'Расовые');
 assert.equal(edits.find(x=>x.key==='racialBranch')?.en,'Racial');
 assert.equal(f.budget().remaining,104);
 const guest=fixture('CLERIC','special','riding');
 assert.equal(walk(guest.target).filter(x=>String(x.className).includes('path-racial-unavailable')).length,1);
 assert.equal(walk(guest.target).filter(x=>x.className==='path-racial-pencil').length,0);
});
test('Path group pencil accessible name tracks saved localized caption',()=>{
 const f=fixture();f.api.canEdit=true;
 const edits=[];f.api.copyLabel=(key,ru)=>ru;
 f.api.editLabel=(node,key,ru,en,callbacks)=>edits.push({node,callbacks});
 root.PandoraHeroPath.viewGrowth(f.target,f.api);
 const row=walk(f.target).find(x=>x.className==='game-tree-head-row');
 const pencil=row.children.find(x=>x.className==='path-group-pencil');
 const caption=row.children[0].children.find(x=>x.tag==='strong');
 assert.ok(pencil.attributes['aria-label'].includes(caption.textContent));
 caption.textContent='Новая подпись';
 edits.find(x=>x.node===caption).callbacks.onCommitted();
 assert.ok(pencil.attributes['aria-label'].includes('Новая подпись'));
});


test('Path Show More owner label is editable independently of live skill count',()=>{
 const f=fixture('CLERIC','special','riding');
 f.api.catalogReady=true;f.api.filter='all';f.api.query='';f.api.shown=24;
 f.api.skillCatalog=Array.from({length:26},(_,i)=>({
  id:i+1,name:'Test '+i,classes:{CLERIC:true},reqs:[]
 }));
 let calls=0;f.api.onMoreSkills=()=>calls++;f.api.onInspect=()=>{};
 f.api.canEdit=true;
 const edits=[];
 f.api.copyLabel=(key,ru)=>key==='skillShowMore'?'Другие навыки':ru;
 f.api.editLabel=(node,key,ru,en,callbacks)=>edits.push({node,key,ru,en,callbacks});
 const gallery=new BrowserElement('div'),details=new BrowserElement('div');
 root.PandoraHeroPath.viewSkills(gallery,details,f.api);
 const row=walk(gallery).find(x=>x.className==='path-more-owner-row');
 assert.ok(row);
 const [button,pencil]=row.children;
 assert.equal(button.tag,'button');
 assert.equal(button.className,'path-show-more');
 assert.equal(pencil.className,'path-more-pencil');
 assert.equal(button.children[0].textContent,'Другие навыки');
 assert.equal(button.children[1].textContent,' (2)');
 assert.equal(edits.find(x=>x.key==='skillShowMore')?.ru,'Показать ещё');
 assert.equal(edits.find(x=>x.key==='skillShowMore')?.en,'Show more');
 assert.ok(!walk(button).some(x=>x.className==='path-more-pencil'));
 button.listeners.click({target:{closest:()=>null}});
 assert.equal(calls,1);
 button.children[0].textContent='Ещё';
 edits.find(x=>x.key==='skillShowMore').callbacks.onCommitted();
 assert.match(pencil.attributes['aria-label'],/Ещё/);
 assert.equal(button.children[1].textContent,' (2)');
 const plain=new BrowserElement('div');f.api.canEdit=false;
 root.PandoraHeroPath.viewSkills(plain,new BrowserElement('div'),f.api);
 assert.equal(walk(plain).filter(x=>x.className==='path-more-owner-row').length,0);
 assert.equal(walk(plain).filter(x=>x.className==='path-show-more').length,1);
 assert.equal(f.budget().remaining,104);
});


test('previous-skill caption has separate RU/EN D1 editor and preserves source skill name',()=>{
 const skill={id:91003,name:'Текущий навык',desc:'',classes:{WARRIOR:1},learnable:true,
  prereq:91002,reqs:[]};
 const previous={id:91002,name:'Проверенный предшественник',classes:{WARRIOR:1},learnable:true,reqs:[]};
 const api={state:{level:45,points:{}},job:'WARRIOR',lang:'ru',
  skillCatalog:[skill,previous],catalogReady:true,query:'',filter:'all',shown:24,
  selectedSkill:skill,icon:()=>null,hover:()=>{},onInspect:()=>{},canEdit:true};
 const calls=[];
 api.copyLabel=(key,ru,en)=>key==='skillPreviousLabel'?'Ранее изученное':ru;
 api.editLabel=(node,key,ru,en,callbacks)=>calls.push({node,key,ru,en,callbacks});
 const gallery=new BrowserElement('root'),details=new BrowserElement('root');
 const render=()=>root.PandoraHeroPath.viewSkills(gallery,details,api);
 render();
 let row=walk(details).find(x=>String(x.className).includes('path-skill-previous-row'));
 assert.ok(row,'Previous skill requirement is visible');
 const caption=walk(row).find(x=>x.className==='path-owner-copy-text');
 const value=walk(row).find(x=>x.className==='path-skill-previous-value');
 const pencil=walk(row).find(x=>x.className==='path-owner-pencil');
 assert.equal(caption.textContent,'Ранее изученное');
 assert.equal(value.textContent,'Проверенный предшественник');
 assert.equal(pencil.tag,'button');
 assert.ok(!walk(value).some(x=>x.className==='path-owner-pencil'));
 assert.equal(calls.find(x=>x.key==='skillPreviousLabel')?.ru,'Предыдущее умение');
 assert.equal(calls.find(x=>x.key==='skillPreviousLabel')?.en,'Previous skill');
 api.lang='en';api.copyLabel=(key,ru,en)=>en;render();
 row=walk(details).find(x=>String(x.className).includes('path-skill-previous-row'));
 assert.equal(walk(row).find(x=>x.className==='path-owner-copy-text').textContent,'Previous skill');
 assert.equal(walk(row).find(x=>x.className==='path-skill-previous-value').textContent,
  'Проверенный предшественник','English UI copy must not change catalog skill names');
 api.canEdit=false;render();
 assert.equal(walk(details).filter(x=>x.className==='path-owner-pencil').length,0);
 assert.equal(skill.prereq,91002);
});

test('missing prerequisite copy can be edited without changing unknown source IDs',()=>{
 const missing={id:91005,name:'Скилл',classes:{WARRIOR:1},learnable:true,prereq:91004,reqs:[]};
 const api={state:{level:45,points:{}},job:'WARRIOR',lang:'ru',
  skillCatalog:[missing],catalogReady:true,query:'',filter:'all',shown:24,
  selectedSkill:missing,icon:()=>null,hover:()=>{},onInspect:()=>{},canEdit:true};
 const edits=[];api.copyLabel=(key,ru)=>key==='skillPrerequisiteMissing'?'Нет в базе':ru;
 api.editLabel=(node,key,ru,en)=>edits.push({node,key,ru,en});
 const gallery=new BrowserElement('root'),details=new BrowserElement('root');
 const render=()=>root.PandoraHeroPath.viewSkills(gallery,details,api);
 render();
 let row=walk(details).find(n=>String(n.className).includes('path-skill-previous-row'));
 assert.ok(row);
 let fallback=walk(row).find(n=>String(n.className).includes('path-skill-previous-value'));
 assert.ok(walk(fallback).some(n=>n.className==='path-owner-copy-text'&&n.textContent==='Нет в базе'));
 assert.ok(walk(fallback).some(n=>n.className==='path-owner-pencil'));
 assert.equal(edits.find(x=>x.key==='skillPrerequisiteMissing')?.ru,'Умение отсутствует в каталоге');
 assert.equal(edits.find(x=>x.key==='skillPrerequisiteMissing')?.en,'Skill not in catalog');
 assert.equal(missing.prereq,91004);
 api.lang='en';api.copyLabel=(key,ru,en)=>en;render();
 row=walk(details).find(n=>String(n.className).includes('path-skill-previous-row'));
 fallback=walk(row).find(n=>String(n.className).includes('path-skill-previous-value'));
 assert.ok(walk(fallback).some(n=>n.textContent==='Skill not in catalog'));
 api.canEdit=false;render();
 row=walk(details).find(n=>String(n.className).includes('path-skill-previous-row'));
 fallback=walk(row).find(n=>n.className==='path-skill-previous-value');
 assert.equal(fallback.textContent,'Skill not in catalog');
 assert.ok(!walk(details).some(n=>n.className==='path-owner-pencil'));
 assert.equal(missing.prereq,91004);
});
