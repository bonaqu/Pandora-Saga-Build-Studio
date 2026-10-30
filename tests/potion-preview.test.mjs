import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};Function('window',read('os-calculator.js'))(ctx);
const calc=ctx.PandoraOSCalculator,app=read('app.js'),html=read('index.html');
test('Modern Remaked 4.23 has 14 original potion formulas and 10 verified item identities',()=>{
 const rows=calc.potionPreview({enabled:false});
 assert.equal(rows.length,14);
 assert.equal(rows.filter(x=>x.current).length,10);
 assert.equal(rows[0].base,20);
 assert.equal(rows[1].value,'60');
 assert.equal(rows[6].base,20,'current Hepatica is 20 HP');
 assert.equal(rows[11].value,'15%');
 assert.equal(rows[4].current,false);
 assert.equal(rows[7].current,false);
 assert.equal(rows[12].current,false);
 assert.equal(rows[13].current,false);
});
test('opt-in fixed potion recovery uses original floor order',()=>{
 const rows=calc.potionPreview({enabled:true,potionRate:120,maxHp:3145});
 assert.equal(rows[0].value,'24');
 assert.equal(rows[1].value,'72');
 assert.equal(rows[5].value,'174'); // 145 HP current Mysterious Potion
 assert.equal(rows[6].value,'24');
});
test('opt-in percentage potion recovery uses ceil(rate * percent), then floor(max HP * result /10000)',()=>{
 const rows=calc.potionPreview({enabled:true,potionRate:104,maxHp:3145});
 assert.equal(rows[11].value,
  String(Math.floor(3145*Math.ceil(15*104)/10000)));
 assert.equal(rows[11].value,'490');
 assert.equal(rows[10].value,
  String(Math.floor(3145*Math.ceil(5*104)/10000)));
});
test('disabled preview does not calculate or invent unknown recovery',()=>{
 const rows=calc.potionPreview({enabled:false,potionRate:null,maxHp:null});
 assert.equal(rows[1].value,'60');
 assert.equal(rows[11].value,'15%');
 const unavailable=calc.potionPreview({enabled:true,potionRate:null,maxHp:null});
 assert.equal(unavailable[1].value,null);
 assert.equal(unavailable[11].value,null);
});
test('player UI never labels historical slots as real current items',()=>{
 const a=app.indexOf('function renderPotionPreview(calculated){');
 const b=app.indexOf('\nfunction renderOriginVitals(){',a);
 assert.ok(a>0&&b>a);
 const fragment=app.slice(a,b);
 const root={children:[],replaceChildren(){this.children=[]},append(x){this.children.push(x)}};
 const h=(tag,attrs={},kids=[])=>({tag,attrs,children:kids});
 const state={attributeBuffs:{potionEffectsEnabled:false}};
 const render=Function('$','window','state','h','lang',fragment+
  '\nreturn renderPotionPreview;')(id=>id==='originPotionResults'?root:null,
  {PandoraOSCalculator:calc},state,h,'ru');
 render({hp:3145,potion:{percent:104}});
 assert.equal(root.children.length,10);
 assert.ok(root.children.some(x=>x.children[0].attrs.text==='Подснежник'));
 assert.ok(root.children.every(x=>!/\bID\s*\d+/.test(x.children[0].attrs.text)));
 const before=root.children.find(x=>x.children[0].attrs.text==='Сильное исцеляющее зелье');
 assert.equal(before.children[1].attrs.text,'15%');
 state.attributeBuffs.potionEffectsEnabled=true;
 render({hp:3145,potion:{percent:104}});
 const after=root.children.find(x=>x.children[0].attrs.text==='Сильное исцеляющее зелье');
 assert.equal(after.children[1].attrs.text,'490');
});
test('view is collapsed by default and toggle is retained in validated build links',()=>{
 assert.match(html,/<details class="origin-potions">/);
 assert.match(html,/id="originUsePotionEffects"/);
 assert.match(html,/id="originPotionResults"/);
 assert.match(app,/safe\.attributeBuffs\.potionEffectsEnabled=rawAttributes\.potionEffectsEnabled===true/);
 assert.match(app,/setAttributeBuff\(key,event\.target\.checked\)/);
});
