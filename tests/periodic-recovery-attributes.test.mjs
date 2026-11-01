import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>JSON.parse(readFileSync(new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
const source=readFileSync(new URL('../os-calculator.js',import.meta.url),'utf8');
const host={};Function('window',source)(host);
const calc=host.PandoraOSCalculator;
const classes=read('classes'),skills=read('skills');
const race={vit:50,str:30,agi:30,dex:30,spi:59,int:40};
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const build=records=>calc.base({
 classData:classes.CLERIC,raceData:race,jobData:zeros,allocation:{},
 level:45,records,combatContext:{jobKey:'CLERIC',
 benevolenceMastery:41,skillCatalog:skills}
});
test('equipped +SPI contributes to Remaked two-second spell preview, not through hero level',()=>{
 const plain=build([]);
 const equipped=build([['item:123',{id:123,slot:'head',name:'SPI test headgear',
  effects:[{func:'EP_SPIRITUAL_CONST',a:2}]},0]]);
 assert.ok(plain?.periodicRecovery&&equipped?.periodicRecovery);
 assert.equal(plain.stats.spi,59);
 assert.equal(equipped.stats.spi,61);
 const amount=preview=>Object.fromEntries(preview.periodicRecovery.rows.map(x=>[x.key,x.amount]));
 const p=amount(plain),e=amount(equipped);
 assert.equal(p.regenerate,15+5+4);
 assert.equal(p.restoration,7+11+4);
 assert.equal(e.regenerate,15+6+4);
 assert.equal(e.restoration,7+12+4);
 assert.equal(e.regenerate-p.regenerate,1);
 assert.equal(e.restoration-p.restoration,1);
 assert.equal(plain.regeneration.hp.total,equipped.regeneration.hp.total,
  'instant periodic spell value must not change passive HP regeneration');
});
