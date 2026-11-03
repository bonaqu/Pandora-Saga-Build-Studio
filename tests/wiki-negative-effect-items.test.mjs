import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-encyclopedia-data.js'))(root);
const classify=item=>Array.from(root.PandoraWikiData.utilityCategories(item));
const items=JSON.parse(read('data/os/items.json'));

test('poison root and poison potion are negative effect items, not heals or cures',()=>{
 for(const id of [50022,50056]){
  const item=items[id];
  assert.equal(item.kind,'POTION');
  assert.deepEqual(classify(item),['harmful']);
  assert.equal(item.effects[0].func,'EP_DESTINED_POISON');
  assert.equal(item.effects[0].dir,'TARGET');
 }
 assert.deepEqual(classify(items[50057]),['cure'],'Antidote removes poison');
 assert.deepEqual(classify(items[50014]),['buff'],'Skill activation still works');
 assert.deepEqual(classify(items[50013]),['cure'],'Cleansing item stays in cure group');
});

test('catalogue classification follows verified effect codes, not the item name or a hardcoded ID',()=>{
 const future={id:999997,kind:'POTION',slot:null,
  name:'Future harmful consumable',effects:[{func:'EP_DESTINED_POISON',dir:'TARGET',a:17}]};
 assert.deepEqual(classify(future),['harmful']);
 assert.deepEqual(classify({...future,name:'Ядовитый корень',effects:[]}),[]);
 assert.deepEqual(classify({...future,slot:'weapon'}),[]);
 assert.deepEqual(classify({...future,kind:'ETC'}),[]);
 assert.deepEqual(classify({...future,effects:[{func:'EP_DESTINED_POISON',dir:'CASTER',a:50}]}),[]);
 assert.deepEqual(classify({...future,effects:[{func:'EP_ONHIT_STUN',dir:'TARGET',a:50}]}),[]);
 assert.deepEqual(classify({...future,effects:[{func:'EP_DESTINED_POISON',dir:'TARGET',a:50},
  {func:'EP_RECOVERY_POISON',dir:'TARGET'}]}),['cure','harmful']);
 assert.deepEqual(classify(null),[]);
 assert.deepEqual(classify({effects:null}),[]);
});

test('encyclopedia exposes localized negative effects filter and a truthful on-use poison note',()=>{
 const app=read('pandora-studio-app.js'),book=read('pandora-studio-hero-book.js');
 assert.match(app,/\['harmful','Дают отрицательные эффекты','Apply negative effects'\]/);
 assert.match(app,/PandoraWikiData\.utilityCategories\(item\)/);
 assert.match(app,/wiki-harmful-consumable-note/);
 assert.match(app,/временный эффект отравления/);
 assert.match(app,/периодически наносит ему урон ядом/);
 assert.match(app,/Tick damage, interval, duration and chance are not established/);
 assert.match(app,/if\(effect\.func==='EP_DESTINED_POISON'&&key==='a'&&!\(adminEditing&&adminToken\)\)continue/);
 assert.doesNotMatch(book,/harmfulConsumables|stage-poison-consumables|Ядовитые расходники/);
 assert.match(book,/statusCures/);
 assert.match(book,/consumableSkills/);
});
