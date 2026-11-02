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
  const accepted=new Set(review.changes('items',before.items,after.items).map(c=>c.id));
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
