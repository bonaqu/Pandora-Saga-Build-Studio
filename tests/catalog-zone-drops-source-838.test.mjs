import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8'),host={};
for(const x of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(x),{window:host});
const safety=host.PandoraCatalogSafety,load=n=>JSON.parse(read('data/os/'+n+'.json'));
const base={tables:load('tables'),classes:load('classes'),skills:load('skills'),
 items:load('items'),maps:load('maps'),monsters:load('monsters')};
const change=fn=>{const after={...base,tables:structuredClone(base.tables)};
 fn(after.tables.zoneDrops);return {after,report:safety.compatibility(base,after)};};
test('whole source contains 11 zones / 285 rules / 1091 item links with no broken refs',()=>{
 const zones=base.tables.zoneDrops;
 assert.equal(zones.length,11);
 assert.equal(zones.reduce((sum,z)=>sum+z.rows.length,0),285);
 assert.equal(zones.reduce((sum,z)=>sum+z.rows.reduce((n,row)=>n+row.items.length,0),0),1091);
 const check=safety.sourceGraphIntegrity(base,base);
 assert.equal(check.ok,true);
 assert.equal(check.newBroken,0);
 assert.equal(check.historical,4);
});
test('two zone-wide hooks have no monster ID and remain valid source data',()=>{
 const rows=base.tables.zoneDrops.flatMap(z=>z.rows);
 const zoneWide=rows.filter(r=>r.kind==='hook'&&!Object.hasOwn(r,'mob'));
 assert.equal(zoneWide.length,2);
 const {after,report}=change(zones=>{
  for(const zone of zones)for(const row of zone.rows)
   if(row.kind==='hook'&&!Object.hasOwn(row,'mob'))row.base+=0.01;
 });
 assert.equal(report.entries[0].kind,'sourceOnly');
 assert.equal(report.entries[0].contract,'table.zone-drop-parameters');
 assert.equal(safety.sourceGraphIntegrity(base,after).ok,true);
});
test('all 285 source-only rule weight updates preserve original identities',()=>{
 const prev=JSON.stringify(base);
 const {after,report}=change(zones=>{
  for(const z of zones)for(const r of z.rows)r.base+=0.01;
 });
 assert.equal(report.entries.length,1);
 assert.equal(report.entries[0].kind,'sourceOnly');
 assert.equal(report.entries[0].contract,'table.zone-drop-parameters');
 assert.equal(report.totals.needsReview,0);
 assert.equal(safety.sourceGraphIntegrity(base,after).ok,true);
 assert.equal(JSON.stringify(base),prev);
});
test('party weight and safe item amount ranges remain source-only',()=>{
 const {after,report}=change(zones=>{
  zones[0].rows[0].perMember=0.5;
  zones[0].rows[0].items[0].hi=2;
 });
 assert.equal(report.entries[0].kind,'sourceOnly');
 assert.equal(report.entries[0].contract,'table.zone-drop-parameters');
 assert.equal(safety.sourceGraphIntegrity(base,after).ok,true);
});
test('new/missing zone references fail the independent D1 graph',()=>{
 const badMap=change(zones=>{zones[0].map=99999999;});
 let graph=safety.sourceGraphIntegrity(base,badMap.after);
 assert.equal(graph.ok,false);
 assert.ok(graph.samples.some(x=>x.kind==='zoneDrop'&&x.field==='map'));
 const badMob=change(zones=>{
  const hook=zones.flatMap(z=>z.rows).find(row=>row.kind==='hook');
  hook.mob=99999999;
 });
 graph=safety.sourceGraphIntegrity(base,badMob.after);
 assert.equal(graph.ok,false);
 assert.ok(graph.samples.some(x=>x.kind==='zoneDrop'&&x.field==='monster'));
 const badItem=change(zones=>{zones[0].rows[0].items[0].i=99999999;});
 graph=safety.sourceGraphIntegrity(base,badItem.after);
 assert.equal(graph.ok,false);
 assert.ok(graph.samples.some(x=>x.kind==='zoneDrop'&&x.field==='item'));
 for(const {report} of [badMap,badMob,badItem])
  assert.equal(report.entries[0].kind,'needsReview');
});
test('new kinds, slot mechanics, wrong shape and bad weights stay needsReview',()=>{
 for(const fn of [
  zones=>{zones[0].rows[0].base=101;},
  zones=>{zones[0].rows[0].base='0.3';},
  zones=>{zones[0].rows[0].perMember=-1;},
  zones=>{zones[0].rows[0].kind='unknown';},
  zones=>{zones[0].rows.push(structuredClone(zones[0].rows[0]));},
  zones=>{zones[0].rows[0].items[0].lo=2;},
  zones=>{zones[0].rows[0].items[0].hi='2';},
  zones=>{zones[0].rows[0].items[0].future=1;},
  zones=>{zones[0].rows[0].items[0].i=42;}
 ]){
  const row=change(fn).report.entries[0];
  assert.equal(row.kind,'needsReview');
  assert.equal(row.contract,undefined);
 }
 const slotChange=change(zones=>{
  const row=zones.flatMap(z=>z.rows).flatMap(r=>r.items).find(i=>i.slotN);
  row.slotN++;
 });
 assert.equal(slotChange.report.entries[0].kind,'needsReview');
});
test('zone-drop source change can combine with physical forge and XP data-only updates',()=>{
 const a={...base,tables:structuredClone(base.tables)};
 a.tables.zoneDrops[0].rows[0].base+=0.01;
 a.tables.exp[45].expReq+=1;
 a.tables.weaponPlus['2'].flat+=1;
 const audit=safety.compatibility(base,a);
 assert.equal(audit.totals.verified,1);
 assert.equal(audit.totals.sourceOnly,2);
 assert.equal(audit.totals.needsReview,0);
 assert.ok(audit.entries.some(x=>x.contract==='table.zone-drop-parameters'));
 assert.equal(safety.sourceGraphIntegrity(base,a).ok,true);
});
