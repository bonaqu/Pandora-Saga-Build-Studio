import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={window:{}};
vm.runInNewContext(read('pandora-studio-honor-guide.js'),root);
const guide=root.window.PandoraHonorGuide;
const all=JSON.parse(read('data/os/chests.json'));
const items=JSON.parse(read('data/os/items.json'));
const sourceSnapshot=JSON.stringify([all,items]);
const app=read('pandora-studio-app.js');
const plain=v=>JSON.parse(JSON.stringify(v));

test('D1 can change exact RU/EN chest facet captions without changing type or odds',()=>{
 const overrides={
  'guideedit.book.wiki.chest.category.gems':
   JSON.stringify({ru:'Редакторские самоцветы',en:'Editorial gems'}),
  'guideedit.book.wiki.chest.slot.weapon':
   JSON.stringify({ru:'Редакторское оружие',en:'Editorial weapons'})
 };
 const unchanged=JSON.stringify(overrides);
 const category=guide.field(overrides,'wiki.chest.category.gems',
  'Самоцветы','Gems');
 const slot=guide.field(overrides,'wiki.chest.slot.weapon',
  'Оружие','Weapons');
 assert.equal(category.ru,'Редакторские самоцветы');
 assert.equal(category.en,'Editorial gems');
 assert.equal(slot.ru,'Редакторское оружие');
 assert.equal(slot.en,'Editorial weapons');
 assert.deepEqual(plain(guide.field({},'wiki.chest.category.gems',
  'Самоцветы','Gems')),{ru:'Самоцветы',en:'Gems',hintRu:'',hintEn:''});
 assert.equal(JSON.stringify(overrides),unchanged,'Reading author copy is pure');
 assert.equal(JSON.stringify([all,items]),sourceSnapshot,'Game source is unchanged');
});

test('malformed or out-of-limit copy falls back to authoritative bilingual defaults',()=>{
 const bad={
  'guideedit.book.wiki.chest.category.gems':'{"ru":""}',
  'guideedit.book.wiki.chest.slot.weapon':
   JSON.stringify({en:'x'.repeat(361)})
 };
 assert.equal(guide.field(bad,'wiki.chest.category.gems','Самоцветы','Gems').ru,
  'Самоцветы');
 assert.equal(guide.field(bad,'wiki.chest.slot.weapon','Оружие','Weapons').en,
  'Weapons');
 assert.equal(guide.validOverride('book.wiki.chest.category.gems',
  JSON.stringify({ru:'Кристаллы'})),true);
 assert.equal(guide.validOverride('book.wiki.chest.category.gems',
  JSON.stringify({ru:''})),false);
});

test('all category and slot labels are bound but runtime counts and identifiers never are',()=>{
 assert.match(app,/bindOwnerInterfaceText\(option,'wiki\.chest\.category',\s*key,ru,en,'text',' · '\+count\)/);
 assert.match(app,/bindOwnerInterfaceText\(chip,'wiki\.chest\.slot',key,ru,en,\s*'text',' · '\+amount\)/);
 assert.match(app,/const option=h\('option',\{value:key\}\)/);
 assert.match(app,/'data-chest-slot':key,'aria-pressed':'false'/);
 assert.match(app,/const categoryCopy=ownerInterfaceEditor\('wiki\.chest\.category',\s*categories/);
 assert.match(app,/const slotCopy=facets\.types\.equipment\?ownerInterfaceEditor\(/);
 assert.match(app,/if\(adminEditing&&adminToken\)\{\s*const categoryCopy=/);
 assert.match(app,/toolbar\.after\(\.\.\.\[categoryCopy,slotCopy\]\.filter\(Boolean\)\)/);
 assert.match(app,/const count=key==='all'\?facets\.total:facets\.types\[key\]/);
 assert.match(app,/const amount=key==='all'\?facets\.types\.equipment:facets\.slots\[key\]/);
 assert.match(app,/wikiChestRewardFilter\.type=typeFilter\.value/);
});

test('chest contents render 35 D1-authored RU/EN captions with numeric data separate',()=>{
 const block=app.slice(app.indexOf('const wikiChestDisplayRows='),app.indexOf('const equipmentCopy='));
 const found=[...block.matchAll(/^ \["([^"]+)","([^"]+)","([^"]+)"\],?$/gm)];
 assert.equal(found.length,35);
 assert.equal(new Set(found.map(row=>row[1])).size,35);
 for(const [key,ru,en] of [
  ['contentsHeading','Содержимое сундука','Chest contents'],
  ['groupShowing','Показано: ','Showing: '],
  ['removeReward','Удалить награду из сундука','Remove chest reward'],
  ['addItem','+ Предмет','+ Item']
 ]){
  const id='wiki.chest.text.'+key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  const values={['guideedit.book.'+id]:JSON.stringify({ru:'Редакторский текст',en:'Edited text'})};
  assert.equal(guide.field(values,id,ru,en).ru,'Редакторский текст');
  assert.equal(guide.field(values,id,ru,en).en,'Edited text');
  assert.equal(guide.field({},id,ru,en).ru,ru);
 }
 assert.match(app,/ownerInterfaceEditor\(\s*'wiki\.chest\.text',wikiChestDisplayRows/);
 assert.match(app,/chestBind\(groupCount,'groupShowing'/);
 assert.match(app,/chestBind\(count,'showing'/);
 assert.match(app,/chestBind\(\s*h\('small',\{class:'wiki-reward-enhance'\}\),'soulsPrefix'/);
 assert.match(app,/groupCount\.removeAttribute\('data-owner-interface-bindings'\)/,
  'Switching a guaranteed 100% group back to all must detach obsolete text binding');
 assert.match(app,/chestBind\(quantity,'quantityHint','aria-description'\)/);
 assert.equal(JSON.stringify([all,items]),sourceSnapshot);
});
