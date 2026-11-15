import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};vm.runInNewContext(read('pandora-studio-catalog-safety.js'),{window:root});
const safety=root.PandoraCatalogSafety;
const source=name=>JSON.parse(read('data/os/'+name+'.json'));
const before=Object.fromEntries(['skills','items','classes','tables',
 'monsters','drops','maps','chests','trades'].map(name=>[name,source(name)]));
const check=after=>safety.sourceGraphIntegrity(before,after);
const update=(name,change)=>{
 const after={...before,[name]:structuredClone(before[name])};
 change(after[name]);return after;
};
const fail=(after,kind,field)=>{
 const baseline=JSON.stringify(before),candidate=JSON.stringify(after);
 const audit=check(after);
 assert.equal(audit.ok,false,kind+' / '+field+' broken reference blocks pre-D1');
 assert.ok(audit.newBroken>0);
 assert.ok(audit.samples.some(row=>row.kind===kind&&row.field===field),
  'actionable offending source '+kind+'/'+field);
 assert.equal(JSON.stringify(before),baseline,'published snapshot unchanged');
 assert.equal(JSON.stringify(after),candidate,'selected snapshot unchanged');
 return audit;
};

test('source cross-catalog audit covers all currently connected reference families read-only',()=>{
 const report=check(before);
 assert.equal(report.ok,true);
 assert.equal(report.newBroken,0);
 assert.equal(report.historical,4,'unchanged legacy skill zero-source links preserved');
 assert.ok(report.inspected>8000,'skills, classes and thousands of related loot/trade links audited');
 assert.ok(Object.keys(before.monsters).length>100);
 assert.ok(Object.keys(before.drops).length>100);
 assert.ok(before.chests.boxes.length>20);
 assert.ok(before.trades.trades.length>200);
});

test('new crafting output item references cannot silently point to a deleted or unknown item',()=>{
 const key='220004001';
 assert.ok(before.skills[key].funcs.some(f=>f.ep==='EP_ADDITION_ITEM'));
 const after=update('skills',records=>{
  records[key].funcs.find(f=>f.ep==='EP_ADDITION_ITEM').fv1[3]=999997101;
 });
 fail(after,'skill','EP_ADDITION_ITEM');
});

test('monster loot table checks both the monster identity and every referenced item',()=>{
 const itemMissing=update('drops',drops=>{drops['11101'].d[0].i=999997102;});
 const result=fail(itemMissing,'drop','item');
 assert.ok(result.samples.some(x=>x.owner==='11101'));
 const brokenOwner={...before,drops:{...before.drops}};
 brokenOwner.drops['999997103']=structuredClone(before.drops['11101']);
 fail(brokenOwner,'drop','monster');
 const removed={...before,monsters:{...before.monsters}};
 delete removed.monsters['11101'];
 const losses=fail(removed,'drop','monster');
 assert.ok(losses.newBroken>=1);
});

test('map monster indexes must point to existing monster records',()=>{
 const id=Object.keys(before.maps)[0],from=before.maps[id].mobs[0];
 assert.ok(before.monsters[String(from)]);
 const changed=update('maps',maps=>{maps[id].mobs[0]=999997104;});
 const report=fail(changed,'map','monster');
 assert.ok(report.samples.some(x=>x.owner===id));
});

test('chest item identity and every nested reward group is checked',()=>{
 const first=before.chests.boxes[0];
 assert.ok(before.items[String(first.i)]);
 const missingRoot=update('chests',chests=>{chests.boxes[0].i=999997105;});
 fail(missingRoot,'chest','container-item');
 const missingReward=update('chests',chests=>{
  chests.boxes[0].rolls[0][0].i=999997106;
 });
 const report=fail(missingReward,'chest','reward-item');
 assert.ok(report.samples.some(x=>x.owner==='box:0'));
});

test('NPC reward chests are audited without confusing NPC IDs and item IDs',()=>{
 assert.ok(before.chests.npc.length>0);
 assert.ok(before.chests.npc[0].rolls[0].some(x=>x.i>0));
 const next=update('chests',chests=>{chests.npc[0].rolls[0][0].i=999997107;});
 const report=fail(next,'chest','reward-item');
 assert.ok(report.samples.some(x=>x.owner==='npc:0'));
});

test('NPC exchange reward and ingredients link to real item records',()=>{
 const old=before.trades.trades[0];
 assert.ok(before.items[String(old.i)]);
 assert.ok(old.mats.length);
 assert.ok(before.items[String(old.mats[0].i)]);
 const reward=update('trades',trades=>{trades.trades[0].i=999997108;});
 fail(reward,'trade','output-item');
 const material=update('trades',trades=>{trades.trades[0].mats[0].i=999997109;});
 fail(material,'trade','material-item');
});

test('dropping a referenced item invalidates every affected loot, recipe and vendor path',()=>{
 const after={...before,items:{...before.items}};
 delete after.items['80098'];
 const broken=check(after);
 assert.equal(broken.ok,false);
 assert.ok(broken.newBroken>1,'shared item id cascades through multiple sources');
 assert.ok(broken.samples.some(x=>x.kind==='trade'));
});

test('bulk selected changes with intact references remain source descriptions, never combat proofs',()=>{
 const after={...before,
  drops:structuredClone(before.drops),
  trades:structuredClone(before.trades),
  chests:structuredClone(before.chests),
  maps:structuredClone(before.maps)};
 const monsterId='11101';
 after.drops[monsterId].d[0].p+=0.5;
 after.trades.trades[0].mats[0].n+=1;
 after.chests.boxes[0].rolls[0][0].n+=1;
 const map=Object.keys(after.maps)[0];after.maps[map].name+=' II';
 const candidate=JSON.stringify(after),baseline=JSON.stringify(before);
 const report=check(after);
 assert.equal(report.ok,true,'numeric source data with preserved known links is structurally valid');
 assert.equal(report.newBroken,0);
 assert.equal(JSON.stringify(after),candidate);
 assert.equal(JSON.stringify(before),baseline);
 const semantics=safety.compatibility(before,after);
 assert.equal(semantics.requiresMechanicReview,false);
 assert.equal(semantics.totals.verified,0,
  'change in source loot probability is NOT verified combat damage');
});

test('legacy unknown source cannot bypass new cross-dataset broken-link checks',()=>{
 const after=update('drops',drops=>{
  drops['11101'].d[0].i=999997110;
  drops['11101'].d[0].p+=0.01;
 });
 fail(after,'drop','item');
});

test('preview and final publication both call cross-dataset sourceGraphIntegrity before D1',()=>{
 const workbench=read('pandora-os-catalog-workbench.js');
 assert.match(workbench,/safety\.sourceGraphIntegrity\(baseline,selected\)/);
 assert.match(workbench,/safety\.sourceGraphIntegrity\(baseline,combined\)/);
 assert.match(workbench,/if\(graph&&!graph\.ok\)throw Error/);
 assert.match(read('pandora-studio-catalog-safety.js'),/EP_ADDITION_ITEM/);
 assert.match(read('pandora-studio-catalog-safety.js'),/checkRolls/);
});
