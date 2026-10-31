import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};Function('window',read('os-calculator.js'))(root);
const calc=root.PandoraOSCalculator;
const classes=JSON.parse(read('data/os/classes.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const fixture=(attributeBuffs={},records=[])=>calc.base({
 classData:classes.CLERIC,level:45,raceData:{...zero,vit:49,spi:53,str:2,agi:2,dex:2,int:2},
 jobData:zero,allocation:zero,attributeBuffs,records
});
test('13 exclusive Honor titles match the Remaked Legacy catalog order',()=>{
 assert.equal(calc.honorTitles.length,14);
 assert.equal(calc.honorTitles[1].effects.allAttributes,1);
 assert.equal(calc.honorTitles[11].effects.potionRecovery,5);
 assert.equal(calc.honorTitles[12].effects.accuracy,-10);
 assert.equal(calc.honorTitles[13].effects.frontAttack,10);
 assert.equal(calc.honorTitles[9].effects.dark,10);
});
test('Honors are exclusive, so potion title and attribute title never stack',()=>{
 const strength=fixture({honorTitle:1,honorCuriosity:false});
 const sturdy=fixture({honorTitle:11,honorCuriosity:true});
 assert.equal(strength.stats.vit,50);
 assert.equal(strength.potion.honor,0);
 assert.equal(sturdy.stats.vit,49);
 assert.equal(sturdy.potion.honor,5);
 assert.equal(sturdy.honor.id,11);
});
test('old Honor curiosity boolean is interpreted when no title is present',()=>{
 const prev=fixture({honorCuriosity:true});
 assert.equal(prev.honor.id,1);
 assert.equal(prev.stats.vit,50);
 assert.equal(fixture({honorCuriosity:true,honorTitle:null}).honor.id,1);
});
test('potion efficiency uses Remaked floor(vit squared * 2/1000)',()=>{
 const base=fixture();
 assert.equal(base.potion.base,100+Math.floor(49*49*2/1000));
 assert.equal(base.potion.percent,104);
 assert.equal(fixture({guildAll:4}).potion.base,105);
});
test('current OS retains item and honor potion bonuses but never adds the historical rune',()=>{
 const potionSoul=Object.values(souls).find(s=>s.name==='Душа зелий');
 assert.ok(potionSoul);
 const result=fixture({honorTitle:11,runeJoEun:true},[['soul:potion',potionSoul,0]]);
 assert.equal(result.potion.base,104);
 assert.equal(result.potion.honor,5);
 assert.equal(result.potion.equipment,8);
 assert.equal(result.potion.rune,0);
 assert.equal(result.potion.percent,117);
});
test('an unequipped or unusable potion Soul does not supply its bonus',()=>{
 const example={effects:[{func:'EP_MASTERY_POTION',a:8,min:7,max:10}]};
 assert.equal(fixture({},[['item:test',example,0]]).potion.equipment,0);
 assert.equal(fixture({},[['item:test',example,7]]).potion.equipment,8);
});
test('honor invalid input is rejected, never coerced from remote strings',()=>{
 assert.equal(fixture({honorTitle:14}),null);
 assert.equal(fixture({honorTitle:'11'}),null);
 assert.equal(fixture({honorTitle:-1}),null);
});
test('UI exposes exclusive title and potion preview, no old Honor checkbox',()=>{
 const html=read('index.html'),app=read('app.js');
 assert.match(html,/id="originHonorTitle"/);
 assert.match(html,/id="originPotionRecovery"/);
 assert.doesNotMatch(html,/id="originRuneJoEun"/);
 assert.doesNotMatch(html,/id="originHonorCuriosity"/);
 assert.match(app,/setAttributeBuff\('honorTitle',event\.target\.value\)/);
 assert.match(app,/safe\.attributeBuffs\.honorTitle=rawAttributes\.honorTitle/);
});
