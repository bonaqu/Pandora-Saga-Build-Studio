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

test('canonical numeric item and Soul sources require a matching record ID',()=>{
 const bare={effects:[{func:'EP_VITARITY_CONST',a:9000}]};
 const stringId={id:'777',effects:bare.effects};
 for(const source of ['item:777','soul:777']){
  assert.deepEqual(C.sourceEffects(source,bare,0),[],source);
  assert.deepEqual(C.sourceEffects(source,stringId,0),[],source);
  assert.equal(C.gatherEffects([[source,bare,0]]).flat.vit,0,source);
 }
 assert.equal(C.gatherEffects([['item:fixture',bare,0]]).flat.vit,9000);
 assert.deepEqual(C.sourceEffects('item:777',{id:777,effects:bare.effects},0),
  bare.effects);
});


test('malformed grade bounds never grant equipment or Soul attributes',()=>{
 const invalid=[
  {min:'5',max:10},{min:NaN,max:10},{min:Infinity,max:10},
  {min:8,max:3},{min:-1,max:10},{min:5,max:11},
  {min:null,max:10},{max:'10'}, {min:5.5,max:10}
 ];
 for(const [kind,id] of [['item',777],['soul',777]]){
  for(const bounds of invalid){
   const record={id,effects:[{func:'EP_VITARITY_CONST',a:500,...bounds}]};
   const source=kind+':'+id;
   assert.deepEqual(C.sourceEffects(source,record,0),[],
    'Bad '+kind+' bounds '+JSON.stringify(bounds));
   assert.equal(C.gatherEffects([[source,record,0]]).flat.vit,0);
   assert.equal(C.effectCoverage({records:[[source,record,0]]}).total,0);
  }
  const eligible={id,effects:[{func:'EP_VITARITY_CONST',a:5,min:5,max:10}]};
  const source=kind+':'+id;
  assert.equal(C.gatherEffects([[source,eligible,4]]).flat.vit,0);
  assert.equal(C.gatherEffects([[source,eligible,5]]).flat.vit,5);
  assert.equal(C.gatherEffects([[source,eligible,10]]).flat.vit,5);
 }
});

test('corrupted Forth breakpoints cannot fall back to older bonuses or narrative',()=>{
 const item={id:2,desc:'За каждые 2 единицы улучшения: ОМ +30',
  effects:[{func:'EP_SPIRITUAL_CONST',a:1}]};
 const normal={2:{6:[{func:'EP_MAXMANA_CONST',a:50}],
  7:[{func:'EP_MAXMANA_CONST',a:60}]}};
 const good=C.sourceEffects('item:2',item,7,normal);
 assert.ok(good.some(e=>e.func==='EP_MAXMANA_CONST'&&e.a===60));
 assert.ok(good.some(e=>e.func==='EP_SPIRITUAL_CONST'&&e.a===1));
 for(const corrupted of [
  null, 'invalid', [{func:'EP_MAXMANA_CONST',a:'60'}],
  [{func:'EP_MAXMANA_CONST',a:60,min:'7'}],
  [{func:'EP_MAXMANA_CONST',a:60,b:Infinity}]
 ]){
  const forth={2:{6:normal[2][6],7:corrupted}};
  const actual=C.sourceEffects('item:2',item,7,forth);
  assert.deepEqual(actual,item.effects,
   'Malformed current Forth level must preserve only verified base effects');
  const stats=C.gatherEffects([['item:2',item,7]],forth);
  assert.equal(stats.health.mp,0);
  assert.equal(stats.flat.spi,1);
 }
 // Without a structured Forth record, historical textual fallback remains.
 assert.ok(C.sourceEffects('item:2',item,7,null)
  .some(e=>e.func==='EP_MAXMANA_CONST'&&e.fromRefinement));
});

test('a later valid Forth level reuses only the nearest verified breakpoint',()=>{
 const item={id:2,effects:[]};
 const forth={2:{2:[{func:'EP_MAXMANA_CONST',a:20}],
   5:[{func:'EP_MAXMANA_CONST',a:40}],
   10:[{func:'EP_MAXMANA_CONST',a:80}]}};
 assert.deepEqual(C.sourceEffects('item:2',item,1,forth),[]);
 assert.deepEqual(C.sourceEffects('item:2',item,3,forth),forth[2][2]);
 assert.deepEqual(C.sourceEffects('item:2',item,7,forth),forth[2][5]);
 assert.deepEqual(C.sourceEffects('item:2',item,10,forth),forth[2][10]);
});
