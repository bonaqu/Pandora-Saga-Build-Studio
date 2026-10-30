import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};Function('window',get('os-calculator.js'))(ctx);
const calc=ctx.PandoraOSCalculator,source=get('app.js'),html=get('index.html');
const classes=JSON.parse(get('data/os/classes.json'));
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const make=(attributeBuffs={},records=[])=>calc.base({
 classData:classes.CLERIC,raceData:{...zero,vit:49,spi:53,str:2,agi:2,dex:2,int:2},
 jobData:zero,allocation:zero,level:45,records,attributeBuffs
});
test('Remaked SelBuffClan_9 contributes selected level to all six attributes',()=>{
 const result=make({guildAll:3});
 assert.deepEqual(result.attributeBuffs.flat,{vit:3,str:3,agi:3,dex:3,spi:3,int:3});
 assert.equal(result.stats.vit,52);
 assert.equal(result.stats.spi,56);
 assert.equal(result.hpBase,calc.classBase(classes.CLERIC.hp,45,52,'vit'));
 assert.equal(result.mpBase,calc.classBase(classes.CLERIC.mp,45,56,'spi'));
});
test('Remaked Honor=1 adds one to all six, including SPR in executed calc.js',()=>{
 const withHonor=make({honorCuriosity:true}),none=make();
 for(const k of Object.keys(zero))
  assert.equal(withHonor.stats[k],none.stats[k]+1,k);
 assert.equal(withHonor.mpBase,calc.classBase(classes.CLERIC.mp,45,54,'spi'));
});
test('Proelium 14_9 uses floor(InBuff_1/10) for STR AGI INT only',()=>{
 const x=make({proelium:true,proeliumPotency:79}),base=make();
 for(const k of ['str','agi','int'])assert.equal(x.stats[k],base.stats[k]+7);
 for(const k of ['vit','dex','spi'])assert.equal(x.stats[k],base.stats[k]);
 assert.equal(x.mp,x.mpBase,'Proelium must not invent MP multiplier');
 assert.equal(make({proelium:false,proeliumPotency:79}).stats.str,base.stats.str);
});
test('item attribute buffs combine with guild and honor before HP/MP calculation',()=>{
 const item={effects:[{func:'EP_VITARITY_CONST',a:4},{func:'EP_SPIRITUAL_CONST',a:3}]};
 const result=make({guildAll:2,honorCuriosity:true},[['item:fixture',item,0]]);
 assert.equal(result.stats.vit,49+4+2+1);
 assert.equal(result.stats.spi,53+3+2+1);
 assert.equal(result.hpBase,calc.classBase(classes.CLERIC.hp,45,56,'vit'));
 assert.equal(result.mpBase,calc.classBase(classes.CLERIC.mp,45,59,'spi'));
});
test('guild and potion parameters reject out-of-range values',()=>{
 assert.equal(make({guildAll:7}),null);
 assert.equal(make({guildAll:-1}),null);
 assert.equal(make({proelium:true,proeliumPotency:101}),null);
 assert.equal(make({proelium:true,proeliumPotency:-5}),null);
});
test('Origin contains optional nested controls without adding visible top-level clutter',()=>{
 for(const id of ['originGuildAll','originHonorCuriosity','originProelium','originProeliumPotency'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/<details class="origin-attribute-buffs">/);
 assert.match(source,/attributeBuffs:state\.attributeBuffs\|\|\{\}/);
 assert.match(source,/safe\.attributeBuffs\.honorCuriosity=rawAttributes\.honorCuriosity===true/);
 assert.match(source,/safe\.attributeBuffs\.proelium=rawAttributes\.proelium===true/);
});
