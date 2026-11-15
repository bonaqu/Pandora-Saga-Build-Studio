import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const host={};vm.runInNewContext(read('pandora-studio-catalog-safety.js'),{window:host});
const safety=host.PandoraCatalogSafety;
const names=['skills','items','classes','monsters','drops','maps',
 'chests','trades','instances'];
const source=name=>JSON.parse(read('data/os/'+name+'.json'));
const before=Object.fromEntries(names.map(name=>[name,source(name)]));
const candidate=(section,mutate)=>{
 const after={...before,[section]:structuredClone(before[section])};
 mutate(after[section]);return after;
};
const expectBroken=(section,mutate,kind,field)=>{
 const after=candidate(section,mutate);
 const original=JSON.stringify(before),selected=JSON.stringify(after);
 const graph=safety.sourceGraphIntegrity(before,after);
 assert.equal(graph.ok,false,kind+'/'+field+' must block pre-D1');
 assert.ok(graph.newBroken>0);
 assert.ok(graph.samples.some(x=>x.kind===kind&&x.field===field),
  JSON.stringify(graph.samples));
 assert.equal(JSON.stringify(before),original,'baseline is immutable');
 assert.equal(JSON.stringify(after),selected,'staged snapshot is immutable');
 return graph;
};

test('complete source graph includes NPC exchange, chest keys and instance mobs',()=>{
 const graph=safety.sourceGraphIntegrity(before,before);
 assert.equal(graph.ok,true);
 assert.equal(graph.historical,4,'preserve only old unmodified zero skill links');
 assert.ok(graph.inspected>9500,'all current secondary link families inspected');
 assert.ok(before.trades.trades.length>=200);
 assert.ok(before.chests.npc.length>=10);
 assert.ok(Object.keys(before.instances).length>=6);
});

test('NPC exchange IDs must exist in the current NPC catalog',()=>{
 const trade=before.trades.trades[0];
 assert.ok(before.trades.npcs[String(trade.npc[0])]);
 expectBroken('trades',d=>{d.trades[0].npc[0]=999997301;},'trade','npc');
 expectBroken('trades',d=>{delete d.npcs[String(trade.npc[0])];},'trade','npc');
});

test('NPC map links use BOTH ordinary maps and game-provided trade map names',()=>{
 assert.equal(before.maps['1001004'],undefined,
  'arena map is intentionally absent from general map listing');
 assert.ok(before.trades.mapNames['1001004']);
 assert.equal(safety.sourceGraphIntegrity(before,before).ok,true);
 expectBroken('trades',d=>{d.npcs['53'].maps[0]=999997302;},'npc','map');
 expectBroken('trades',d=>{delete d.mapNames['1001004'];},'npc','map');
 const ordinary=candidate('trades',d=>{delete d.mapNames['2001001'];});
 assert.equal(safety.sourceGraphIntegrity(before,ordinary).ok,true,
  'map still exists in the general game map catalog');
});

test('NPC chest container and key are item references independent of rewards',()=>{
 assert.ok(before.items[String(before.chests.npc[0].i)]);
 assert.ok(before.items[String(before.chests.npc[0].key)]);
 expectBroken('chests',d=>{d.npc[0].i=999997303;},'chest','npc-container-item');
 expectBroken('chests',d=>{d.npc[0].key=999997304;},'chest','key-item');
 expectBroken('chests',d=>{d.masterKey=999997305;},'chest','master-key-item');
});

test('deleting a referenced NPC chest key is blocked even when the chest itself was not touched',()=>{
 const key=String(before.chests.npc[0].key);
 expectBroken('items',d=>{delete d[key];},'chest','key-item');
});

test('instance monster list is checked, including indirect monster deletions',()=>{
 const old=before.instances['0'].mobs[0];
 assert.ok(before.monsters[String(old)]);
 expectBroken('instances',d=>{d['0'].mobs[0]=999997306;},'instance','monster');
 expectBroken('monsters',d=>{delete d[String(old)];},'instance','monster');
});

test('valid atomic cross-dataset additions pass without any D1 mutations',()=>{
 const after={...before,trades:structuredClone(before.trades),
  chests:structuredClone(before.chests),instances:structuredClone(before.instances)};
 after.trades.npcs['999997307']={name:'New source NPC',maps:[999997308]};
 after.trades.mapNames['999997308']='New source map';
 after.trades.trades[0].npc=[999997307];
 after.chests.npc[0].key=52104;
 after.instances['0'].mobs=[90103];
 const selected=JSON.stringify(after);
 const graph=safety.sourceGraphIntegrity(before,after);
 assert.equal(graph.ok,true,JSON.stringify(graph.samples));
 assert.equal(graph.newBroken,0);
 assert.equal(JSON.stringify(after),selected);
 const report=safety.compatibility(before,after);
 for(const key of ['trades:trades/0','trades:npcs/999997307',
  'trades:mapNames/999997308','chests:npc/0','instances:0'])
  assert.ok(report.entries.some(x=>x.key===key&&x.kind==='sourceOnly'),key);
 assert.equal(report.totals.verified,0,
  'new cross-catalog source facts are not verified combat calculations');
});

test('mass NPC and reward changes report every changed record, not only one dataset',()=>{
 const after={...before,trades:structuredClone(before.trades),
  chests:structuredClone(before.chests)};
 for(let i=0;i<12;i++){
  after.trades.trades[i].gold+=i+1;
  after.chests.boxes[i].rolls[0][0].n+=1;
 }
 const report=safety.compatibility(before,after);
 assert.equal(report.totals.sourceOnly,24);
 assert.equal(report.entries.length,24,'no changes disappear after six UI samples');
 assert.equal(report.samples.sourceOnly.length,6);
 assert.ok(report.entries.some(x=>x.key==='trades:trades/11'));
 assert.ok(report.entries.some(x=>x.key==='chests:boxes/11'));
 assert.equal(report.totals.verified,0,'quantities are not measured game probabilities');
});

test('unknown new schema fields in chests or trades require explicit mechanics review',()=>{
 const after={...before,chests:{...before.chests,unfamiliarEffect:{power:80}},
  trades:{...before.trades,unfamiliarCost:{power:70}}};
 const report=safety.compatibility(before,after);
 assert.equal(report.totals.needsReview,2);
 assert.equal(report.requiresMechanicReview,true);
 assert.ok(report.entries.some(x=>x.key==='chests:unfamiliarEffect'));
 assert.ok(report.entries.some(x=>x.key==='trades:unfamiliarCost'));
});

test('the same read-only source graph protects preview and final CAS preparation',()=>{
 const workbench=read('pandora-os-catalog-workbench.js');
 assert.match(workbench,/safety\\.sourceGraphIntegrity\\(baseline,selected\\)/);
 assert.match(workbench,/safety\\.sourceGraphIntegrity\\(baseline,combined\\)/);
 assert.match(workbench,/if\\(graph&&!graph\\.ok\\)throw Error/);
});
