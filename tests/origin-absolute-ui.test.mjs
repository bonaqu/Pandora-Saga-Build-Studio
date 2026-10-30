import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const lib={};
Function('window',read('attribute-progression.js'))(lib);
const model=lib.PandoraAttributeProgression;
const tables=JSON.parse(read('data/os/tables.json'));
const names=['Выносливость','Сила','Ловкость','Сноровка','Дух','Интеллект'];
const labels=['vit','str','agi','dex','spi','int'].map((code,i)=>({code,name:names[i],short:code}));
const app=read('app.js');
const code=app.slice(app.indexOf('function renderOriginStats(){'),app.indexOf('\nfunction renderOriginPassives(){'));
assert.ok(code.startsWith('function renderOriginStats(){'),'origin renderer must exist');
class Element{
 constructor(tag){
  this.tag=tag;this.children=[];this.listeners={};this.value='';this.textContent='';
  this.disabled=false;this.classList={toggle(){},contains(){return false}};
 }
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=[...items]}
 addEventListener(type,fn){this.listeners[type]=fn}
}
function fixture(level=55){
 const roots={originStats:new Element('root'),originStatSummary:new Element('summary'),
  detailPanel:new Element('div'),detailContent:new Element('div')};
 const get=id=>roots[id];
 const h=(tag,attrs={},children=[])=>{
  const node=new Element(tag);
  for(const [k,v] of Object.entries(attrs)){
   if(k==='text')node.textContent=v;
   else node[k]=v;
  }
  node.append(...children);return node;
 };
 const state={stats:Object.fromEntries(names.map(k=>[k,0]))};
 const snapshot=()=>model.snapshot({tables,race:'RAPIN',klass:'SCOUT',level,
  added:names.map(k=>state.stats[k])});
 let persisted=0;
 const change=(i,value)=>{
  if(!model.allowed(snapshot(),i,value))return false;
  state.stats[names[i]]=value;persisted++;return true;
 };
 const estimate=()=>{
  const s=snapshot();
  return {stats:Object.fromEntries(labels.map((label,i)=>[
   label.code,s.values[i]+(label.code==='dex'?11:0)]))};
 };
 const render=Function('$','h','STATS','ORIGIN_STAT_LABELS','state',
  'attributeSnapshot','previewBaseStats','setAttributePoints','window','renderDetails','activeTab',
  code+'\nreturn renderOriginStats;')(get,h,names,labels,state,snapshot,estimate,change,
  {PandoraAttributeProgression:model},()=>{},'character');
 render();
 return{rows:roots.originStats.children[0].children,state,snapshot,get persisted(){return persisted}};
}
test('all origin fields show Rapin Scout base rather than zero invested points',()=>{
 const f=fixture();
 assert.deepEqual(f.rows.map(row=>row.children[2].value),['3','3','7','7','8','6']);
 assert.deepEqual(f.rows.map(row=>row.children[2].min),['3','3','7','7','8','6']);
 assert.ok(f.rows.every(row=>row.children[2].max==='99'));
});
test('typing below racial base keeps the base; typing 100 caps at 99 without clamping gear bonus',()=>{
 const f=fixture(),vit=f.rows[0].children,dex=f.rows[3].children;
 vit[2].value='1';vit[2].listeners.change();assert.equal(vit[2].value,'3');
 dex[2].value='100';dex[2].listeners.change();
 assert.equal(dex[2].value,'99');
 assert.equal(f.state.stats['Сноровка'],92,'saved state remains invested-only');
 assert.equal(dex[4].children[0].textContent,'110','effective DEX = 99 + 11');
 assert.equal(dex[4].children[1].textContent,'+11 бонус');
 dex[1].listeners.click();assert.equal(dex[2].value,'98');
 dex[3].listeners.click();assert.equal(dex[2].value,'99');
});
test('level 1 budget prevents spending even if a large absolute value is entered',()=>{
 const f=fixture(1),dex=f.rows[3].children;
 dex[2].value='100';dex[2].listeners.change();
 assert.equal(dex[2].value,'7');
 assert.equal(f.state.stats['Сноровка'],0);
});
test('Soul and enhancement changes rerender visible base/effective stats',()=>{
 const source=read('app.js');
 assert.match(source,/updateGrade:n=>[\s\S]*?renderOriginStats\(\);renderHudEstimates\(\)/);
 assert.match(source,/assignSoul:entry=>[\s\S]*?renderOriginStats\(\);renderHudEstimates\(\)/);
});
