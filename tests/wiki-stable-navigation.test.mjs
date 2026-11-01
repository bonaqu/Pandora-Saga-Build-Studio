import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('wiki selects records without recreating list and triggering two hash rerenders',()=>{
 const app=read('app.js');
 assert.match(app,/wikiRenderSelected=\(\)=>\{/);
 assert.match(app,/draw\(present\)/);
 assert.match(app,/history\.pushState\(history\.state/);
 assert.match(app,/if\(sameCategory\)wikiRenderSelected\(\)/);
 assert.match(app,/const draw=\(detailOnly=false\)=>/);
 assert.match(app,/if\(!detailOnly\)browse\.replaceChildren\(\)/);
 assert.match(app,/browse\.querySelectorAll\('\[data-wiki-record\]'\)/);
 assert.match(app,/window\.addEventListener\('popstate'/);
});
test('chests resolve names and icons from OS item catalog, NPC from real NPC names',()=>{
 const app=read('app.js'),data=JSON.parse(read('data/os/items.json'));
 const chests=JSON.parse(read('data/os/chests.json'));
 const names=JSON.parse(read('data/os/trades.json')).npcs;
 assert.ok(chests.boxes.some(c=>data[c.i]?.icon&&data[c.i]?.name));
 assert.ok(Object.values(names).some(n=>n.name));
 assert.match(app,/type==='chest'\?wikiData\.items\?\.\[id\]/);
 assert.match(app,/type==='npc'\?wikiData\.trades\?\.npcs\?\.\[id\]/);
 assert.match(app,/wikiIcon\('chest',row\.id\)/);
});
test('drops and NPC exchange rewards include actual item icon and linked ingredient rows',()=>{
 const app=read('app.js');
 assert.match(app,/const itemLink=\(id,label,highlight=null\)=>/);
 assert.match(app,/itemLink\(trade\.i/);
 assert.match(app,/mats\.append\(itemLink\(material\.i/);
 assert.match(app,/entry\.append\(itemLink\(row\.i/);
});
