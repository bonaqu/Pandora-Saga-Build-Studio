import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),app=read('app.js'),css=read('style.css');
const classes=JSON.parse(read('data/os/classes.json'));

test('Origin labels show only ОЗ/ОМ, no icons or approximation marks',()=>{
 assert.match(html,/<span>ОЗ<\/span><strong id="originHp">/);
 assert.match(html,/<span>ОМ<\/span><strong id="originMp">/);
 assert.doesNotMatch(html,/♥ ОЗ|✦ ОМ|Выбери облик/);
 assert.match(html,/Раса <span>Выбери расу<\/span>/);
 assert.match(css,/\.origin-vital\{[\s\S]*?min-height:66px/);
});
test('HP/MP are calculated integers and coverage limitations remain transparent',()=>{
 const a=app.indexOf('function renderOriginVitals(){');
 const b=app.indexOf('\nfunction budgetSummary(){',a);
 assert.ok(a>=0&&b>a);
 const code=app.slice(a,b),nodes={
  originHp:{textContent:''},originMp:{textContent:''},
  originVitals:{attributes:{},setAttribute(key,value){this.attributes[key]=value},title:'old'}
 };
 let calc={hp:2066,mp:543};
 const render=Function('$','previewBaseStats',code+'\nreturn renderOriginVitals;')(
  k=>nodes[k],()=>calc);
 render();
 assert.equal(nodes.originHp.textContent,'2066');
 assert.equal(nodes.originMp.textContent,'543');
 assert.match(nodes.originVitals.attributes['aria-label'],/без некоторых эффектов/);
 assert.equal(nodes.originVitals.title,'');
 calc={hp:2077,mp:550};render();
 assert.equal(nodes.originHp.textContent,'2077');
 calc=null;render();
 assert.equal(nodes.originHp.textContent,'—');
 assert.equal(nodes.originMp.textContent,'—');
 assert.doesNotMatch(code,/['"]≈['"]|≈\+/);
 const calculator=read('os-calculator.js');
 assert.match(calculator,/verified:false/,'server-game parity is not established');
});
class El{
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.listeners={};
 this.className='';this.textContent=''}
 append(...a){this.children.push(...a)}
 replaceChildren(...a){this.children=a}
}
const h=(tag,attrs={},children=[])=>{
 const e=new El(tag);
 for(const [k,v]of Object.entries(attrs)){
  if(k==='class')e.className=v;
  else if(k==='text')e.textContent=v;
  else if(k.startsWith('on'))e.listeners[k.slice(2)]=v;
  else if(v!==null&&v!==undefined)e.attributes[k]=String(v);
 }
 e.append(...children);return e;
};
const walk=e=>[e,...e.children.flatMap(x=>x instanceof El?walk(x):[])];
function chosenProfession(){
 const fallback=app.match(/const CLASS_PARENT_FALLBACK=\{[^\n]+\};/)?.[0];
 const start=app.indexOf('function renderJobs(){'),end=app.indexOf('let workbenchReturnFocus',start);
 assert.ok(fallback&&start>0&&end>start);
 const jobKeys=Object.keys(classes),jobs=jobKeys.map(k=>classes[k].name||k);
 const state={job:jobKeys.indexOf('JUGGERNAUT')},grid=new El('div');
 assert.ok(state.job>=0);
 let saves=0;
 const runtime=Function('h','$','jobKeys','jobs','catalog','state','editableValue','saveView',
  fallback+'\nlet jobPathKey=null;\nfunction selectJob(index){state.job=index;renderJobs()}\n'+
  app.slice(start,end)+'\nreturn {renderJobs,state,get:()=>jobPathKey};')(
  h,()=>grid,jobKeys,jobs,{classes},state,(_,v)=>v,()=>saves++);
 const buttons=()=>walk(grid).filter(x=>x.tag==='button');
 const matching=key=>buttons().find(x=>x.className.includes('class-wizard-choice')&&
  x.children[0]?.textContent===jobs[jobKeys.indexOf(key)]);
 const label=e=>e.children.map(x=>x.textContent||'').join(' ');
 return{runtime,matching,buttons,label,grid,jobs,jobKeys,get saves(){return saves}};
}
test('after selecting final class, root directions display the actual specialization',()=>{
 const f=chosenProfession();f.runtime.renderJobs();
 const root=f.matching('WARRIOR');
 assert.ok(root);
 assert.match(f.label(root),/Джаггернаут/);
 assert.equal(root.attributes['aria-pressed'],'false','ancestor is not the actual selected leaf');
 assert.match(root.attributes['aria-label'],/выбранная специализация/);
 assert.ok(walk(f.grid).some(x=>x.className==='class-wizard-selected'&&
  x.textContent.includes('Джаггернаут')));
});
test('Back navigation retains the selection at every parent level',()=>{
 const f=chosenProfession();f.runtime.renderJobs();
 f.matching('WARRIOR').listeners.click();
 assert.match(f.label(f.matching('GLADIATOR')),/Джаггернаут/);
 f.matching('GLADIATOR').listeners.click();
 assert.ok(f.matching('JUGGERNAUT'));
 f.buttons().find(x=>x.className==='class-back').listeners.click();
 assert.match(f.label(f.matching('GLADIATOR')),/Джаггернаут/);
 f.buttons().find(x=>x.className==='class-back').listeners.click();
 assert.match(f.label(f.matching('WARRIOR')),/Джаггернаут/);
 assert.equal(f.jobKeys[f.runtime.state.job],'JUGGERNAUT');
 assert.equal(f.saves,4);
});
test('Origin height tracks center portrait stage only on desktop',()=>{
 const start=app.indexOf('function syncOriginPanelHeight(){');
 const end=app.indexOf("\nwindow.addEventListener('resize',syncOriginPanelHeight",start);
 assert.ok(start>0&&end>start);
 const styles={value:null,setProperty(k,v){this.value=v},removeProperty(k){this.value=null}};
 const origin={style:styles},stage={getBoundingClientRect(){return {height:734.6}}};
 const dom={querySelector:selector=>selector==='.workspace>.left'?origin:
  selector==='.workspace>.stage'?stage:null};
 const window={innerWidth:1920};
 const fn=Function('window','document',app.slice(start,end)+'\nreturn syncOriginPanelHeight;')(window,dom);
 fn();assert.equal(styles.value,'735px');
 window.innerWidth=390;fn();assert.equal(styles.value,null);
 assert.match(css,/\.workspace>.left\{min-height:var\(--character-stage-height,700px\)/);
});
