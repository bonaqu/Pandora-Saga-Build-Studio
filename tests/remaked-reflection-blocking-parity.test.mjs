import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const c={};Function('window',read('os-calculator.js'))(c);
const C=c.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json')),souls=JSON.parse(read('data/os/souls.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const reflect=souls['103001'];
const boots=items['15077'];
const evaluateGrade=grade=>C.base({classData:classes.WARRIOR,
 raceData:{vit:40,str:50,agi:40,dex:40,spi:30,int:30},
 jobData:zeros,allocation:zeros,level:55,
 combatContext:{jobKey:'WARRIOR',skillCatalog:{}},
 records:[['item:15077',boots,0],['soul:103001',reflect,grade]]});
test('current OS combat boots feed Remaked block-break resistance stat',()=>{
 assert.equal(boots.name,'Боевые башмаки');
 assert.equal(boots.effects.find(x=>x.func==='EP_BLOCK_BREAK_RESIST').a,1);
 assert.equal(evaluateGrade(0).resistances.status.blockBreak,1);
});
test('mirror soul changes reflect from 3 to 5 at refinement +8 exactly once',()=>{
 assert.equal(reflect.name,'Душа зеркала');
 const below=evaluateGrade(7),above=evaluateGrade(8);
 assert.equal(below.resistances.physicalReflection,3);
 assert.equal(above.resistances.physicalReflection,5);
 assert.equal(above.combat.secondary.physicalReflection,5);
});
test('reflect and block resistance are independent of HP and core armor',()=>{
 const before=evaluateGrade(7),after=evaluateGrade(8);
 assert.equal(after.hp,before.hp);
 assert.equal(after.mp,before.mp);
 assert.equal(after.combat.defense.known,before.combat.defense.known);
});
test('book displays blocking resistance and melee reflection',()=>{
 const book=read('stage-attributes.js');
 assert.match(book,/blockBreak:'Пробитие блока'/);
 assert.match(book,/Отражение ближнего физического урона/);
});
