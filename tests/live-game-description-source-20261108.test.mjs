import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>JSON.parse(readFileSync(
 new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
const items=read('items'),souls=read('souls'),en=read('strings.en');

test('game source item descriptions retain authoritative lore/bonus breaks',()=>{
 assert.equal(Object.keys(items).length,1116);
 assert.match(items['1'].desc,/кинжал\.<br><br>ПРВ \+1/);
 assert.match(items['13083'].desc,/<b>При усовершенствовании/);
 assert.match(items['51060'].desc,/<item 80100>/);
 assert.match(items['80100'].desc,/<item 300001>/);
});
test('game source soul and English descriptions retain original authored breaks',()=>{
 assert.equal(Object.keys(souls).length,112);
 assert.match(souls['101004'].desc,/<br>/);
 assert.match(en.items['1'].d,/dagger\.<br><br>AGI \+1/);
 assert.match(en.souls['101004'].d,/<br>/);
});
test('description-only restore preserves items, names and English record counts',()=>{
 assert.equal(items['1'].name,'Спата');
 assert.equal(items['13083'].name,'Золотые поножи');
 assert.equal(souls['101004'].id,101004);
 assert.equal(Object.keys(en.items).length,1115);
 assert.equal(Object.keys(en.souls).length,112);
});
