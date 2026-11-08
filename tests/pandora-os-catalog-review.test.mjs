import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const ctx = {window: {}};
vm.runInNewContext(readFileSync(new URL('pandora-os-catalog-review.js', root), 'utf8'), ctx);
const review = ctx.window.PandoraOSCatalogReview;
const files = ['meta','classes','skills','items','souls','monsters','drops','maps',
  'instances','racialPassives','itemForth','unison','trades','tables','expertise','chests','strings.en'];
const snapshot = () => ({
  meta: {counts: {items: 2, skills: 1, trades: 1},
    localeCounts: {en: {items: 1, skills: 0, monsters: 0, souls: 0, classes: 0}},
    sha: {'item/item.csv':'source-hash'}},
  classes: {c: {name:'Class'}}, skills: {s: {name:'Skill'}},
  items: {'1': {id:1, name:'A'},'2':{id:2,name:'B'}},
  souls:{x:{id:'x'}}, monsters:{m:{id:'m'}}, drops:{d:{id:'d'}}, maps:{m:{id:'m'}},
  instances:[{id:7}], racialPassives:{r:{id:'r'}}, itemForth:{f:{id:'f'}},
  unison:{u:{id:'u'}}, trades:{trades:[{id:1}],npcs:{n:'NPC'},mapNames:{},limitMeta:{}},
  tables:{weaponPlus:{}}, expertise:{limit:{}}, chests:{boxes:[]},
  'strings.en':{locale:'en',items:{'1':{n:'A'}},skills:{},monsters:{},souls:{},classes:{}}
});
const plain = v => JSON.parse(JSON.stringify(v));

test('all record changes are reviewable, including changes beyond first 30', () => {
  const before = Object.fromEntries(Array.from({length:42}, (_,i)=>[i,{name:'Old '+i}]));
  const after = Object.fromEntries(Array.from({length:42}, (_,i)=>[i,{name:'New '+i}]));
  const changes = review.changes('items', before, after);
  assert.equal(changes.length,42);
  assert.ok(changes.some(change=>change.key==='41'));
});

test('per-record approval keeps rejected changes and recomputes D1 counts', () => {
  const before=snapshot(), after=snapshot();
  after.items['1'].name='Accepted'; delete after.items['2'];
  after.items['3']={id:3,name:'Rejected'};
  const selected = new Set([review.id('items','1'),review.id('items','2')]);
  const merged = review.compose(before,after,selected,files);
  assert.equal(merged.items['1'].name,'Accepted');
  assert.equal(merged.items['2'],undefined);
  assert.equal(merged.items['3'],undefined);
  assert.equal(merged.meta.counts.items,1);
  assert.equal(merged.meta.sha,undefined,'a curated export cannot claim official CSV hashes');
  assert.equal(merged.meta.curated,true);
  assert.equal(before.items['1'].name,'A','the original D1 snapshot must not be mutated');
  assert.equal(after.items['1'].name,'Accepted','the live source must not be mutated');
});

test('accepting every change preserves the whole source and its official metadata', () => {
  const before=snapshot(),after=snapshot();
  after.items['1'].name='Source A';after.meta.sha={'item/item.csv':'new-source'};
  const accepted=new Set([...review.changes('items',before.items,after.items).map(c=>c.id),review.id('meta','@dataset')]);
  const merged=review.compose(before,after,accepted,files);
  assert.deepEqual(plain(merged.items),plain(after.items));
  assert.deepEqual(plain(merged.meta.sha),plain(after.meta.sha));
  assert.equal(merged.meta.curated,undefined);
});

test('English translation decisions are independent by source section and stable ID', () => {
  const before=snapshot(),after=snapshot();
  after['strings.en'].items['1'].n='New A';
  after['strings.en'].items['2']={n:'New B'};
  const edits=review.changes('strings.en',before['strings.en'],after['strings.en']);
  assert.deepEqual(plain(edits.map(e=>e.key)),['items/1','items/2']);
  const merged=review.compose(before,after,new Set([review.id('strings.en','items/2')]),files);
  assert.equal(merged['strings.en'].items['1'].n,'A');
  assert.equal(merged['strings.en'].items['2'].n,'New B');
  assert.equal(merged.meta.localeCounts.en.items,2);
});

test('trades, tables and instances are atomic to avoid partial recipe corruption', () => {
  const before=snapshot(),after=snapshot();
  after.trades.trades.push({id:2});after.tables.weaponPlus={'4':{flat:8}};
  after.instances.push({id:8});
  for(const dataset of ['trades','tables','instances']){
    const list=review.changes(dataset,before[dataset],after[dataset]);
    assert.equal(list.length,1,dataset);assert.equal(list[0].key,'@dataset');
  }
  const merged=review.compose(before,after,new Set([review.id('trades','@dataset')]),files);
  assert.equal(merged.trades.trades.length,2);
  assert.equal(merged.meta.counts.trades,2);
  assert.deepEqual(plain(merged.tables),plain(before.tables));
});

test('unreviewed sources or mismatched English locale cannot be staged',()=>{
  const before=snapshot(),after=snapshot();
  delete after.souls;
  assert.throws(()=>review.compose(before,after,new Set(),files),/Missing reviewed dataset/);
  const corrupt=snapshot();corrupt['strings.en'].locale='ru';
  assert.throws(()=>review.compose(before,corrupt,new Set(),files),/Invalid English locale/);
});

test('real checked-in OS catalog remains importable after a selective item/translation review',()=>{
  const read=name=>JSON.parse(readFileSync(new URL('data/os/'+name+'.json',root),'utf8'));
  const catalog=Object.fromEntries(files.map(name=>[name,read(name)]));
  const legacy=JSON.parse(readFileSync(new URL('data/localization/legacy-approved.v1.json',root),'utf8'));
  const importerCtx={window:{}};
  vm.runInNewContext(readFileSync(new URL('pandora-os-catalog-import.js',root),'utf8'),importerCtx);
  const normalize=importerCtx.window.PandoraCatalogImport.normalize;
  assert.equal(normalize(catalog,legacy).datasets.length,19);
  const proposed=plain(catalog);
  proposed.items['1'].name+=' · reviewed';
  proposed['strings.en'].items['1'].n+=' · rejected';
  const decision=new Set([review.id('items','1')]);
  const selected=review.compose(catalog,proposed,decision,files);
  const ready=normalize(selected,legacy);
  assert.equal(ready.counts.items,Object.keys(catalog.items).length);
  assert.match(selected.items['1'].name,/reviewed/);
  assert.equal(selected['strings.en'].items['1'].n,catalog['strings.en'].items['1'].n);
  assert.equal(selected.meta.sha,undefined);
  assert.equal(selected.meta.curated,true);
});

test('changing upstream level cap or metadata is reviewable without silent application',()=>{
 const previous=snapshot(),source=snapshot();
 previous.meta.levelCap=45;source.meta.levelCap=50;
 source.meta.sha={'item/item.csv':'future-patch'};
 const differences=review.changes('meta',previous.meta,source.meta);
 assert.equal(differences.length,1);
 assert.equal(differences[0].key,'@dataset');
 const rejected=review.compose(previous,source,new Set(),files);
 assert.equal(rejected.meta.levelCap,45);
 assert.equal(rejected.meta.sha,undefined,'server checksums must not be retained on a mixed snapshot');
 assert.equal(rejected.meta.curated,true);
 const chosen=review.compose(previous,source,new Set([review.id('meta','@dataset')]),files);
 assert.equal(chosen.meta.levelCap,50);
 assert.deepEqual(plain(chosen.meta.sha),plain(source.meta.sha));
 assert.equal(chosen.meta.curated,undefined);
});

test('accepting item changes does not silently accept a separate server metadata update',()=>{
 const previous=snapshot(),source=snapshot();
 previous.meta.levelCap=45;source.meta.levelCap=50;
 source.items['1'].name='Updated sword';
 const allowed=new Set([review.id('items','1')]);
 const merged=review.compose(previous,source,allowed,files);
 assert.equal(merged.meta.levelCap,45);
 assert.equal(merged.items['1'].name,'Updated sword');
 assert.equal(merged.meta.sha,undefined);
});

test('published D1 Legacy data is reconstructed and retains exact source records',()=>{
 const rows=Object.fromEntries(Array.from({length:1001},(_,i)=>[
  String(i).padStart(6,'0'),
  {namespace:'game',locale:i?'en':'ru',key:'key'+i,text:'Legacy '+i,
   source:i?'Archive':'Owner edited'}
 ]));
 const restored=review.retainLegacyRows(rows);
 assert.equal(restored.records.length,1001);
 assert.equal(restored.records[0].value.source,'Owner edited');
 assert.equal(restored.locales.game.ru.key0,'Legacy 0');
 assert.equal(restored.locales.game.en.key1000,'Legacy 1000');
 rows['000001'].key='__proto__';
 const safe=review.retainLegacyRows(rows);
 assert.equal(Object.hasOwn(safe.locales.game.en,'__proto__'),true);
 assert.equal(safe.locales.game.en.__proto__,'Legacy 1');
 rows['000001'].key='key1';
 assert.throws(()=>review.retainLegacyRows({}),/Incomplete/);
 rows['000001'].key='key0';rows['000001'].locale='ru';
 assert.throws(()=>review.retainLegacyRows(rows),/duplicate/);
});

test('description-only <br> formatting from game export is NOT a gameplay update',()=>{
 const oldItem={id:1,name:'Спата',desc:'Меч, похожий на кинжал.ПРВ +1.'};
 const newItem={id:1,name:'Спата',desc:'Меч, похожий на кинжал.<br><br>ПРВ +1.'};
 assert.equal(review.changes('items',{'1':oldItem},{'1':newItem}).length,0);
 assert.equal(review.changes('souls',{'1':{desc:'ОЗ +30'}},
  {'1':{desc:'ОЗ +30<br>'}}).length,0);
 assert.equal(review.changes('strings.en',
  {locale:'en',items:{'1':{n:'Gladius',d:'A sword.AGI +1'}}},
  {locale:'en',items:{'1':{n:'Gladius',d:'A sword.<br><br>AGI +1'}}}).length,0);
 assert.equal(oldItem.desc,'Меч, похожий на кинжал.ПРВ +1.',
  'Never rewrite the original saved description');
 assert.equal(newItem.desc,'Меч, похожий на кинжал.<br><br>ПРВ +1.',
  'Never discard source formatting');
});
test('genuine changes remain visible alongside formatting-only source differences',()=>{
 const old={id:1,name:'Спата',desc:'Сила +1.',W:48};
 const next={id:1,name:'Спата',desc:'Сила +2.<br>',W:48};
 assert.equal(review.changes('items',{'1':old},{'1':next}).length,1);
 next.desc='Сила +1.<br>';next.W=57;
 assert.equal(review.changes('items',{'1':old},{'1':next}).length,1);
 next.desc='Сила +1.';next.W=48;next.name='Другая спата';
 assert.equal(review.changes('items',{'1':old},{'1':next}).length,1,
  'Name changes must not be normalized away');
});
test('a server hash is never claimed for a partially cosmetic D1 snapshot',()=>{
 const before=snapshot(),after=snapshot();
 after.items['1'].desc='Описание.<br>Сила +1';
 before.items['1'].desc='Описание.Сила +1';
 assert.equal(review.changes('items',before.items,after.items).length,0);
 const merged=review.compose(before,after,new Set(),files);
 assert.equal(merged.meta.sha,undefined,
  'A metadata checksum must require strict byte-level source equality');
 assert.equal(merged.meta.curated,true);
});

test('explicit typography-only publication restores source breaks without altering stats or owner decisions',()=>{
 const before=snapshot(),after=snapshot();
 before.items['1'].desc='Меч.ПРВ +1';
 after.items['1'].desc='Меч.<br><br>ПРВ +1';
 after.items['2'].W=300; // Important but not selected: must remain old.
 assert.equal(review.formattingChanges('items',before.items,after.items).length,1);
 const ready=review.compose(before,after,new Set(),files,{syncFormatting:true});
 assert.equal(ready.items['1'].desc,after.items['1'].desc);
 assert.equal(ready.items['2'].W,undefined,'never approve a numerical change as typography');
 assert.equal(before.items['1'].desc,'Меч.ПРВ +1','do not mutate D1 in preview');
 assert.equal(ready.meta.sha,undefined,'do not reuse original upstream CSV checksum');
 assert.equal(ready.meta.curated,true);
});


test('BR variants and consecutive source paragraphs are preserved literally with explicit approval',()=>{
 const before=snapshot(),after=snapshot();
 before.items['1'].desc='Описание.ОЗ +15';
 after.items['1'].desc='Описание.<BR /><br/>ОЗ +15';
 before['strings.en'].items['1'].d='Sword.ATK +1';
 after['strings.en'].items['1'].d='Sword.<br><br>ATK +1';
 assert.equal(review.changes('items',before.items,after.items).length,0);
 assert.equal(review.changes('strings.en',before['strings.en'],after['strings.en']).length,0);
 assert.equal(review.formattingChanges('items',before.items,after.items).length,1);
 assert.equal(review.formattingChanges('strings.en',before['strings.en'],after['strings.en']).length,1);
 const unapproved=review.compose(before,after,new Set(),files);
 assert.equal(unapproved.items['1'].desc,'Описание.ОЗ +15');
 const approved=review.compose(before,after,new Set(),files,{syncFormatting:true});
 assert.equal(approved.items['1'].desc,after.items['1'].desc);
 assert.equal(approved['strings.en'].items['1'].d,after['strings.en'].items['1'].d);
 assert.equal(before.items['1'].desc,'Описание.ОЗ +15');
 assert.deepEqual(plain(approved.meta.sha),plain(after.meta.sha),
  'an exact published game snapshot retains verified source fingerprints');
 assert.equal(approved.meta.curated,undefined);
});
