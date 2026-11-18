import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};Function('window',read('pandora-os-character-calculator.js'))(ctx);
const calc=ctx.PandoraOSCalculator,app=read('pandora-studio-app.js'),html=read('index.html');
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
test('potion catalog differentiates current item identity from historical models',()=>{
 const active=calc.potionPreview({enabled:false}).filter(x=>x.current);
 assert.equal(active.length,10);
 assert.ok(active.some(x=>x.ru==='Подснежник'));
 assert.ok(active.every(x=>typeof x.ru==='string'&&!/\bID\s*\d+/.test(x.ru)));
 const current=calc.potionPreview({enabled:true,potionRate:104,maxHp:3145})
  .filter(x=>x.current);
 assert.equal(current.length,10);
 assert.equal(current.find(x=>x.ru==='Сильное исцеляющее зелье')?.value,'490');
});
test('Book-only potion toggle persists without restoring invisible Origin controls',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.doesNotMatch(html,/id="originPotionResults"|id="originUsePotionEffects"|class="origin-potions"/);
 assert.match(book,/'data-book-setting':'potionEffectsEnabled'/);
 assert.match(book,/onBuff\('potionEffectsEnabled',event\.target\.checked\)/);
 assert.match(app,/safe\.attributeBuffs\.potionEffectsEnabled=rawAttributes\.potionEffectsEnabled===true/);
});
