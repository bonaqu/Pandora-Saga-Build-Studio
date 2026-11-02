import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const drops=JSON.parse(get('data/os/drops.json')),souls=JSON.parse(get('data/os/souls.json')),
 trades=JSON.parse(get('data/os/trades.json')),chests=JSON.parse(get('data/os/chests.json')),
 tables=JSON.parse(get('data/os/tables.json'));
test('multiple real soul IDs have confirmed sources in current OS datasets',()=>{
 const ids=new Set([
 ...Object.values(drops).flatMap(g=>[...(g.d||[]),...(g.s||[])].map(r=>String(r.i))),
 ...trades.trades.map(r=>String(r.i)),
 ...chests.boxes.flatMap(c=>c.rolls.flat().map(r=>String(r.i))),
 ...tables.zoneDrops.flatMap(z=>(z.rows||[]).flatMap(r=>(r.items||[]).map(x=>String(x.i))))
 ]);
 assert.ok(Object.keys(souls).filter(id=>ids.has(id)).length>=70);
});
test('soul detail uses the existing indexed source map and trusted chest/NPC names',()=>{
 const app=get('app.js');
 assert.match(app,/Где получить душу/);
 assert.match(app,/const found=wikiIndex\.sources\(id\)/);
 assert.match(app,/type==='item'\?\(wikiData\.items\?\.\[id\]\|\|wikiData\.souls\?\.\[id\]\)/);
 assert.match(app,/const appendSourceFlow=/);
 assert.match(app,/wiki-source-locations/);
 assert.match(app,/wikiIcon\('chest',row\.id\)/);
});
test('settlement and battlefield maps show real NPC trader residents',()=>{
 const app=get('app.js');
 assert.ok(Object.values(trades.npcs).some(x=>x.maps?.length));
 assert.match(app,/const residents=wikiIndex\.residents\(id\)/);
 assert.match(app,/NPC в локации/);
});
