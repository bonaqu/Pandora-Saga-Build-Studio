import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const runtime={};Function('window',read('pandora-os-character-calculator.js'))(runtime);
const C=runtime.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const englishStrings=JSON.parse(read('data/os/strings.en.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};

test('source-verified poisonous root and poison potion have no health recovery',()=>{
 const expected=[50022,50056],p=C.harmfulConsumablePreview({items});
 assert.deepEqual(p.rows.map(x=>x.id),expected);
 for(const row of p.rows){
  const item=items[row.id],en=englishStrings.items[row.id];
  assert.equal(item.kind,'POTION');
  assert.match(item.name,/Ядовит/);
  assert.match(item.desc,/нельзя есть|Не пить/);
  assert.match(en.d,/poison|deadly/i);
  assert.deepEqual(item.effects.filter(x=>x.func==='EP_DESTINED_POISON')
   .map(e=>({a:e.a,dir:e.dir})),[{a:50,dir:'TARGET'}]);
  assert.equal(row.sourceValue,50);
  assert.equal(row.verified,false);
  assert.equal(item.effects.some(x=>/EP_HEAL_LIFE|EP_HEAL_MANA/.test(x.func)),false);
 }
 assert.ok(p.excluded.includes('poison damage'));
 assert.ok(p.excluded.includes('server activation chance'));
});

test('poison warnings reject forged records and mixed-in healing effects',()=>{
 for(const id of [50022,50056]){
  const changed={...items[id],id:id+1};
  const source={...items,[id]:changed};
  assert.equal(C.harmfulConsumablePreview({items:source}).rows.some(x=>x.id===id),false);
  const healed={...items[id],effects:[...items[id].effects,
   {func:'EP_HEAL_LIFE',dir:'TARGET',a:100}]};
  assert.equal(C.harmfulConsumablePreview({items:{...items,[id]:healed}})
   .rows.some(x=>x.id===id),false);
  const duplicate={...items[id],effects:[...items[id].effects,...items[id].effects]};
  assert.equal(C.harmfulConsumablePreview({items:{...items,[id]:duplicate}})
   .rows.some(x=>x.id===id),false);
 }
 assert.deepEqual(C.harmfulConsumablePreview().rows,[]);
});

test('full character returns hazardous consumables without adding their poison parameter to HP/MP',()=>{
 const opts={classData:classes.WARRIOR,raceData:tables.raceInit.ELF,
  jobData:tables.jobInit.WARRIOR,allocation:zeros,level:1};
 const plain=C.base(opts),withCatalog=C.base({...opts,consumableItems:items});
 assert.deepEqual([withCatalog.hp,withCatalog.mp],[plain.hp,plain.mp]);
 assert.deepEqual(withCatalog.harmfulConsumables.rows.map(x=>x.id),[50022,50056]);
 assert.equal(withCatalog.consumableRecovery.allRows.some(x=>x.id===50022||x.id===50056),false);
});

test('Hero Book never lists poisonous consumables or a poisonous-items chapter',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.doesNotMatch(book,/harmfulConsumables|stage-poison-consumables|Ядовитые расходники|Poisonous consumables/);
 assert.match(book,/modifiers\?\.statusCures/);
});

test('book translation entries are cached without changing RU/EN output or user-owned names',()=>{
 const source=read('pandora-studio-hero-book.js');
 assert.match(source,/const bookLineHeadEntries=Object\.entries\(bookLineHeads\)/);
 assert.match(source,/const bookLineFragmentEntries=Object\.entries\(bookLineFragments\)/);
 const start=source.indexOf('function bookText(value){');
 const end=source.indexOf('function make(tag',start);
 const body=source.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.doesNotMatch(body,/Object\.entries\(/,'no map allocation per generated node');
 const doc={documentElement:{lang:'en'}},root={};
 Function('window','document',source)(root,doc);
 const tr=root.PandoraStageAttributes.bookText;
 assert.equal(tr('Скорость естественного восстановления'),'Passive recovery speed');
 assert.equal(tr('Точность: +12'),'Accuracy: +12');
 assert.equal(tr('ОЗ: Меч игрока'),'ОЗ: Меч игрока',
  'do not translate player/item names with coincidental stat prefix');
 doc.documentElement.lang='ru';
 assert.equal(tr('Точность: +12'),'Точность: +12');
});
