import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const warrior=(records=[])=>C.base({classData:classes.WARRIOR,
 raceData:tables.raceInit.ELF,jobData:tables.jobInit.WARRIOR,
 allocation:zero,level:1,records,itemForth});

test('real OS item and Soul IDs must match the source before their effects count',()=>{
 const dagger=items['1862'];
 const real=C.sourceEffects('item:1862',dagger,7,itemForth);
 assert.ok(real.some(e=>e.func==='EP_IMMUNE_BURN'&&e.a===5));
 assert.ok(real.some(e=>e.func==='EP_ELEMENT_DAMAGE_SCALE_FIRE'&&e.a===1));
 assert.deepEqual(C.sourceEffects('item:1863',dagger,7,itemForth),[]);
 const synthetic=C.sourceEffects('item:fixture',dagger,7,itemForth);
 assert.equal(synthetic.some(e=>e.func==='EP_ELEMENT_DAMAGE_SCALE_FIRE'),false);
 for(const grade of [-1,11,'7',null])
  assert.deepEqual(C.sourceEffects('item:1862',dagger,grade,itemForth),[]);
 const soul=souls['104002'];
 assert.ok(C.sourceEffects('soul:104002',soul,4,itemForth).length);
 assert.deepEqual(C.sourceEffects('soul:104003',soul,4,itemForth),[]);
 assert.equal(C.gatherEffects([['item:fixture',{effects:[
  {func:'EP_VITARITY_CONST',a:3}]},0]]).flat.vit,3);
});

test('invalid OS numeric fields never become 0/1/8 through implicit coercion',()=>{
 const effects=[
  {func:'EP_VITARITY_CONST',a:null},
  {func:'EP_VITARITY_CONST',a:'8'},
  {func:'EP_VITARITY_CONST',a:true},
  {func:'EP_VITARITY_CONST',a:NaN},
  {func:'EP_VITARITY_CONST',a:2},
  {func:'EP_MAXLIFE_CONST',a:'100'},
  {func:'EP_MAXLIFE_CONST',a:15},
  {func:'EP_MAXMANA_SCALE',a:'9'},
  {func:'EP_MAXMANA_SCALE',a:4},
  {func:'EP_MAGIC_RESISTANCE_CONST',a:false},
  {func:'EP_MAGIC_RESISTANCE_CONST',a:5}
 ];
 const actual=C.gatherEffects([['item:fixture',{effects},0]]);
 assert.equal(actual.flat.vit,2);
 assert.equal(actual.health.hp,15);
 assert.deepEqual(actual.percent.mp.map(x=>x.value),[4]);
 assert.equal(actual.bonuses.magic,5);
 assert.ok(actual.ignored.includes('EP_VITARITY_CONST'));
});

test('null rows and inherited object properties cannot corrupt flat attributes',()=>{
 const item={id:777,effects:[null,undefined,false,0,{},'invalid',
  {func:'toString',a:8},{func:'__proto__',a:9},
  {func:'EP_SPIRITUAL_CONST',a:2}]};
 const out=C.gatherEffects([['item:777',item,0]]);
 assert.equal(out.flat.spi,2);
 assert.ok(Object.values(out.flat).every(Number.isFinite));
 assert.ok(out.ignored.includes('toString'));
 assert.ok(out.ignored.includes('__proto__'));
 const forth={777:{7:[null,{func:'EP_MAXLIFE_CONST',a:30},false]}};
 const withForth=C.gatherEffects([['item:777',item,7]],forth);
 assert.equal(withForth.health.hp,30);
 assert.equal(withForth.flat.spi,2);
});

test('a forged imported ring cannot alter the verified Elf Warrior 149/44 vector',()=>{
 const ring=items['19004'];
 const normal=warrior(),correct=warrior([['item:19004',ring,0]]),
  forged=warrior([['item:19005',ring,0]]);
 assert.deepEqual([normal.hp,normal.mp],[149,44]);
 assert.deepEqual([correct.hp,correct.mp],[155,44]);
 assert.deepEqual([forged.hp,forged.mp],[149,44]);
 assert.equal(forged.effects.flat.vit,0);
});
