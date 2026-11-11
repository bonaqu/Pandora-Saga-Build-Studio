import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const equipment=read('pandora-studio-equipment-ui.js');
const app=read('pandora-studio-app.js');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);

test('details count only active Souls and never mutate stored socket data',()=>{
 assert.match(equipment,/socketedCount:plan\.asSocketArray\(souls\)\.slice\(0,Math\.max\(0,cap\?\?0\)\)/);
 assert.match(equipment,/\.filter\(Boolean\)\.length,tables:gameTables/);
 assert.match(equipment,/context\.socketedCount\?\?context\.souls\?\.length\?\?0/);
 assert.doesNotMatch(equipment,/souls\.splice\(/);
});
test('live Soul search placeholder changes after D1 save and Undo without remounting',()=>{
 assert.match(equipment,/'data-equipment-copy-placeholder':'soulSearch'/);
 assert.match(equipment,/onCommitted:visible=>\{query\.placeholder=visible;\}/);
 assert.match(app,/const equipmentCopyLabel=\(node,key,ru,en,options\)=>/);
 assert.match(app,/if\(key==='equipment\.soul-search'\)/);
 assert.match(app,/input\.placeholder=placeholder/);
 const part=app.slice(app.indexOf("if(key==='equipment.soul-search')"),
  app.indexOf("if(key==='equipment.socket-overflow-hint')"));
 assert.doesNotMatch(part,/render\(\)|replaceChildren\(/);
 assert.equal(root.PandoraHonorGuide.validOverride('book.equipment.soul-search',
  JSON.stringify({ru:'Найди душу',en:'Find a Soul'})),true);
});
