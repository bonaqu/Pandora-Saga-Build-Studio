import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.className='';
  this.listeners={};this.textContent='';this.style={};this.value='';this.checked=false;
 }
 append(...nodes){this.children.push(...nodes)}
 prepend(...nodes){this.children.unshift(...nodes)}
 replaceChildren(...nodes){this.children=[...nodes]}
 setAttribute(key,value){this.attributes[key]=String(value)}
 addEventListener(name,fn){this.listeners[name]=fn}
 remove(){}
}
const document={createElement:tag=>new Element(tag),
 createTextNode:text=>Object.assign(new Element('#text'),{textContent:text})};
const root={};
Function('window',read('os-calculator.js'))(root);
Function('window','document',read('stage-attributes.js'))(root,document);
const render=root.PandoraStageAttributes.render;
const walk=node=>[node,...(node.children||[]).flatMap(walk)];
test('Recovery book shows real item icons and opens the chosen potion in wiki',()=>{
 const target=new Element('root'),opened=[],enabled=[];
 const ids=new Set(root.PandoraOSCalculator.potionPreview({enabled:false})
  .filter(row=>row.current).map(row=>row.id));
 render(target,{page:'recovery',modifiers:{hp:3145,potion:{percent:104},
  healingSkill:{percent:100}},buffs:{potionEffectsEnabled:true},
  itemById:id=>ids.has(id)?{id,name:'Зелье '+id,icon:'I_050001_00'}:null,
  icon:rec=>'https://pandorasaga-os.com/icons/items/'+rec.icon+'.webp',
  onItem:id=>opened.push(id),onBuff:(key,value)=>enabled.push([key,value])});
 const buttons=walk(target).filter(node=>node.tag==='button'&&
  node.attributes['aria-label']?.startsWith('Открыть в энциклопедии'));
 assert.equal(buttons.length,10);
 assert.ok(buttons.every(row=>row.children.some(x=>x.tag==='img')));
 assert.ok(buttons.every(row=>row.children.some(x=>x.tag==='strong')));
 buttons[0].listeners.click();
 assert.deepEqual(opened,[root.PandoraOSCalculator.potionPreview({enabled:false})
  .find(row=>row.current).id]);
 const checkbox=walk(target).find(node=>node.tag==='input'&&
  node.attributes['data-book-setting']==='potionEffectsEnabled');
 assert.ok(checkbox);
 checkbox.listeners.change({target:{checked:false}});
 assert.deepEqual(enabled,[['potionEffectsEnabled',false]]);
});
test('Defense renders known elemental resistances including zero and vulnerability',()=>{
 const target=new Element('root');
 render(target,{page:'defense',modifiers:{resistances:{
  elements:{fire:0,ice:20,poison:-5},states:{physical:0,mental:0},
  status:{},mitigation:{physical:0,magic:0}
 }}});
 const tiles=walk(target).filter(x=>x.className?.startsWith('stage-resistance-tile'));
 assert.equal(tiles.length,3);
 assert.ok(tiles.some(x=>x.children[0].textContent==='Огонь'&&x.children[1].textContent==='0'));
 assert.ok(tiles.some(x=>x.className.includes('negative')&&
  x.children[1].textContent==='-5'));
});
