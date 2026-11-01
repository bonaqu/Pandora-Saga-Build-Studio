import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const maps=JSON.parse(read('data/os/maps.json')),
 trades=JSON.parse(read('data/os/trades.json')),
 tables=JSON.parse(read('data/os/tables.json'));
const app=read('app.js');
test('wiki location list includes named NPC settlements even when mob map table omits them',()=>{
 const names=Object.keys(trades.mapNames||{});
 assert.ok(names.length>=10);
 const extra=names.filter(id=>!maps[id]);
 assert.ok(extra.length>=1);
 assert.match(app,/const knownMaps=wikiIndex\.records\('map'\)/);
 assert.match(app,/const catalog=wikiIndex\.records\(type\)/);
});
test('zone drops are presented as group probabilities, never fake per-item chance',()=>{
 assert.ok(tables.zoneDrops.length>0);
 assert.match(app,/const dropZones=wikiIndex\.zones\(id\)/);
 assert.match(app,/Шанс группы добычи/);
 assert.match(app,/Шанс отдельной вещи не указан/);
 assert.match(app,/itemLink\(reward\.i/);
});
test('monster encyclopedia exposes existing OS level HP AC and resistances',()=>{
 assert.match(app,/class:'wiki-monster-stats'/);
 assert.match(app,/rec\.magicProtection/);
 assert.match(app,/rec\.resists/);
 assert.match(app,/Сопротивления монстра/);
});
