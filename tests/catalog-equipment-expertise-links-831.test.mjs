import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};vm.runInNewContext(read('pandora-studio-catalog-safety.js'),{window:host});
const safety=host.PandoraCatalogSafety;
const datasets=['skills','items','classes','tables','monsters','drops','maps',
 'chests','trades','instances','itemForth','unison','expertise'];
const before=Object.fromEntries(datasets.map(name=>
 [name,JSON.parse(read('data/os/'+name+'.json'))]));
const edit=(name,change)=>{
 const after={...before,[name]:structuredClone(before[name])};
 change(after[name]);return after;
};
function rejects(name,change,kind,field){
 const after=edit(name,change);
 const savedBefore=JSON.stringify(before),savedAfter=JSON.stringify(after);
 const audit=safety.sourceGraphIntegrity(before,after);
 assert.equal(audit.ok,false,name+'/'+field+' should block publishing');
 assert.ok(audit.newBroken>0);
 assert.ok(audit.samples.some(row=>row.kind===kind&&row.field===field),
  JSON.stringify(audit.samples));
 assert.equal(JSON.stringify(before),savedBefore);
 assert.equal(JSON.stringify(after),savedAfter);
 return audit;
}

test('real full source graph validates more than 20K linked records',()=>{
 const audit=safety.sourceGraphIntegrity(before,before);
 assert.equal(audit.ok,true);
 assert.equal(audit.historical,4);
 assert.equal(audit.newBroken,0);
 assert.ok(audit.inspected>20000,'11K item permissions, sets and refinement rows');
 assert.equal(Object.keys(before.itemForth).length,172);
 assert.equal(Object.keys(before.unison).length,3);
});

test('every item class permission is validated, not just modeled item effects',()=>{
 rejects('items',items=>{items['1'].classes.UNKNOWN_FUTURE_JOB=1;},
  'item','class');
 const job='WARRIOR';
 const after=edit('classes',classes=>{delete classes[job];});
 const result=safety.sourceGraphIntegrity(before,after);
 assert.equal(result.ok,false);
 assert.ok(result.samples.some(x=>x.kind==='item'&&x.field==='class'&&
  x.target===job),'unmodified items cannot silently reference a removed class');
});

test('all 172 refinement sources must point to existing items',()=>{
 rejects('itemForth',forth=>{
  forth['999998301']={'1':[{func:'EP_MAXLIFE_CONST',a:1}]};
 },'itemForth','item');
 const id='2';
 assert.ok(before.itemForth[id]);
 rejects('items',items=>{delete items[id];},'itemForth','item');
});

test('unison set identity and every member are real item links',()=>{
 rejects('unison',set=>{set['12081'].members[0]=999998302;},
  'unison','member-item');
 rejects('unison',set=>{
  set['999998303']={id:999998303,members:[11282],rows:[]};
 },'unison','item');
 const item=String(before.unison['12081'].members[0]);
 rejects('items',items=>{delete items[item];},'unison','member-item');
});

test('expertise limit entries cannot reference a nonexistent class',()=>{
 rejects('expertise',x=>{x.limit.UNKNOWN_FUTURE_JOB={slash:1};},
  'expertise','class');
 const job='SCOUT';
 rejects('classes',x=>{delete x[job];},'expertise','class');
});

test('source jobInit class roots must exist',()=>{
 rejects('tables',x=>{x.jobInit.UNKNOWN_FUTURE_JOB={vit:1};},
  'table','jobInit-class');
 rejects('classes',x=>{delete x.MAGE;},'table','jobInit-class');
});

test('valid staged gameplay values preserve link integrity but remain unproven mechanics',()=>{
 const after={...before,items:structuredClone(before.items),
  unison:structuredClone(before.unison),expertise:structuredClone(before.expertise)};
 after.items['1'].name+=' • renamed';
 after.unison['12081'].rows[0].a.c+=1;
 after.expertise.expCurve['0'].req+=1;
 const beforeSnapshot=JSON.stringify(before),selected=JSON.stringify(after);
 const audit=safety.sourceGraphIntegrity(before,after);
 assert.equal(audit.ok,true,JSON.stringify(audit.samples));
 assert.equal(audit.newBroken,0);
 const statuses=safety.compatibility(before,after);
 assert.ok(statuses.entries.some(x=>x.key==='unison:12081'&&x.kind==='needsReview'));
 assert.ok(statuses.entries.some(x=>x.key==='expertise:expCurve/0'&&x.kind==='needsReview'));
 assert.equal(statuses.totals.verified,0,'the new coefficients are not proven combat formulas');
 assert.equal(JSON.stringify(before),beforeSnapshot);
 assert.equal(JSON.stringify(after),selected);
});

test('independent set changes and mastery limit changes are all surfaced',()=>{
 const after={...before,unison:structuredClone(before.unison),
  expertise:structuredClone(before.expertise)};
 const ids=Object.keys(before.unison);
 for(const id of ids)after.unison[id].rows[0].a.c+=1;
 after.expertise.limit.WARRIOR.slash+=1;
 after.expertise.limit.SCOUT.slash+=1;
 const report=safety.compatibility(before,after);
 assert.equal(report.totals.needsReview,5);
 assert.equal(report.entries.length,5);
 assert.ok(ids.every(id=>report.entries.some(x=>x.key==='unison:'+id)));
 assert.ok(report.entries.some(x=>x.key==='expertise:limit/WARRIOR'));
 assert.ok(report.entries.some(x=>x.key==='expertise:limit/SCOUT'));
});

test('unknown source effect does not become verified just because item-class links pass',()=>{
 const after=edit('items',items=>{
  items['1'].effects.push({func:'EP_UNKNOWN_FUTURE_POWER',dir:'TARGET',a:999,b:0});
 });
 assert.equal(safety.sourceGraphIntegrity(before,after).ok,true);
 const status=safety.compatibility(before,after);
 assert.equal(status.totals.needsReview,1);
 assert.equal(status.totals.verified,0);
});

test('preview and final CAS preparation both use the same whole-graph preflight',()=>{
 const workbench=read('pandora-os-catalog-workbench.js');
 assert.ok(workbench.includes('safety.sourceGraphIntegrity(baseline,selected)'));
 assert.ok(workbench.includes('safety.sourceGraphIntegrity(baseline,combined)'));
 assert.ok(workbench.includes('if(graph&&!graph.ok)throw Error'));
});
