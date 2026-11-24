import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
for(const script of ['pandora-os-catalog-review.js',
 'pandora-studio-catalog-safety.js','pandora-os-catalog-workbench.js'])
 vm.runInNewContext(read(script),{window:host});
const safety=host.PandoraCatalogSafety;
const review=host.PandoraOSCatalogReview;
const status=host.PandoraOSCatalogWorkbench.statusForSelection;
const source=name=>JSON.parse(read('data/os/'+name+'.json'));
const before=Object.fromEntries(['trades','chests','instances','expertise',
 'tables','unison','items','skills','classes'].map(name=>[name,source(name)]));
const changed=(dataset,edit)=>{
 const after={...before,[dataset]:structuredClone(before[dataset])};
 edit(after[dataset]);
 const changes=review.changes(dataset,before[dataset],after[dataset]);
 const rows=safety.compatibility(before,after);
 return {after,changes,rows,statuses:Array.from(changes,x=>status(x,rows.entries))};
};

test('NPC names in atomic trade update get a visible source-only status',()=>{
 const {changes,rows,statuses}=changed('trades',data=>{
  data.npcs['53'].name+=' updated';
 });
 assert.equal(changes.length,1);
 assert.equal(changes[0].key,'@dataset');
 assert.ok(rows.entries.some(x=>x.key==='trades:npcs/53'));
 assert.deepEqual(statuses,['sourceOnly']);
});

test('trade recipe changes and unknown new schema fields aggregate strongest issue',()=>{
 const {changes,rows,statuses}=changed('trades',data=>{
  data.trades[0].gold+=1;
  data.unfamiliarMagic={power:999};
 });
 assert.equal(changes.length,1);
 assert.ok(rows.entries.some(x=>x.key==='trades:trades/0'&&x.kind==='sourceOnly'));
 assert.ok(rows.entries.some(x=>x.key==='trades:unfamiliarMagic'&&x.kind==='needsReview'));
 assert.deepEqual(statuses,['needsReview']);
});

test('atomic chests report reward status on the actual selectable row',()=>{
 const {changes,rows,statuses}=changed('chests',data=>{
  data.boxes[0].rolls[0][0].n+=1;
 });
 assert.equal(changes.length,1);
 assert.ok(rows.entries.some(x=>x.key==='chests:boxes/0'));
 assert.deepEqual(statuses,['sourceOnly']);
});

test('atomic instance and expertise changes map to the correct status',()=>{
 const instance=changed('instances',data=>{data['0'].name+=' •';});
 assert.equal(instance.changes[0].key,'@dataset');
 assert.deepEqual(instance.statuses,['sourceOnly']);
 const expertise=changed('expertise',data=>{data.limit.WARRIOR.slash+=1;});
 assert.equal(expertise.changes[0].key,'@dataset');
 assert.deepEqual(expertise.statuses,['needsReview']);
});

test('atomic table and ordinary item/set records keep their independent statuses',()=>{
 const tables=changed('tables',data=>{data.abilityPoint['2']+=1;});
 assert.equal(tables.changes[0].key,'@dataset');
 assert.deepEqual(tables.statuses,['sourceOnly']);
 const unison=changed('unison',data=>{data['12081'].rows[0].a.c+=1;});
 assert.equal(unison.changes[0].key,'12081');
 assert.deepEqual(unison.statuses,['needsReview']);
 const item=changed('items',data=>{data['1'].name+=' •';});
 assert.equal(item.changes[0].key,'1');
 assert.deepEqual(item.statuses,['sourceOnly']);
 // Source compatibility intentionally uses singular class:/skill: keys;
 // selected UI rows use plural classes/skills dataset names.
 const skill=changed('skills',data=>{data['213601001'].name+=' •';});
 assert.equal(skill.changes[0].key,'213601001');
 assert.deepEqual(skill.statuses,['sourceOnly']);
 const klass=changed('classes',data=>{data.WARRIOR.name+=' •';});
 assert.equal(klass.changes[0].key,'WARRIOR');
 assert.deepEqual(klass.statuses,['sourceOnly']);
});

test('all statuses are evaluated, not just the six preview samples',()=>{
 const entries=Array.from({length:31},(_,i)=>({
  key:'chests:boxes/'+i,kind:i===30?'needsReview':'sourceOnly'
 }));
 const selected={dataset:'chests',key:'@dataset'};
 assert.equal(status(selected,entries),'needsReview');
 assert.equal(status({dataset:'chests',key:'other'},entries),null);
 assert.equal(status({dataset:'trades',key:'@dataset'},entries),null);
 assert.equal(status({dataset:'items',key:'1'},entries),null);
});

test('missing or unrelated evidence produces no false compatibility badge',()=>{
 assert.equal(status({dataset:'trades',key:'@dataset'},[]),null);
 assert.equal(status(null,[]),null);
 assert.equal(status({dataset:'items',key:'1'},[
  {key:'items:2',kind:'verified'}
 ]),null);
 assert.equal(status({dataset:'skills',key:'213601001'},[
  {key:'skill:213601002',kind:'verified'}
 ]),null);
 assert.equal(status({dataset:'classes',key:'WARRIOR'},[
  {key:'class:SCOUT',kind:'verified'}
 ]),null);
});

test('workbench still gates status to selected records only',()=>{
 const script=read('pandora-os-catalog-workbench.js');
 assert.ok(script.includes('if(!chosen.has(change.id))return null'));
 assert.ok(script.includes('statusForSelection(change,selectedImpact()?.compatibility?.entries||[])'));
 assert.ok(script.includes('statusForSelection,createReviewActionQueue});'));
 assert.ok(script.includes('if(!chosen.has(change.id))return null'));
 assert.ok(script.includes('const actionQueue=createReviewActionQueue()'));
 assert.ok(script.includes('actionQueue.cancelOutside(event.target)'));
 assert.ok(script.includes('if(value)cancelPending()'));
 // A new client-side queue must never broaden the compatibility source.
 assert.match(script,/function selectedMechanicStatus\(change\)\{\s*if\(!chosen.has\(change.id\)\)return null;\s*return statusForSelection\(change,selectedImpact\(\)\?\.compatibility\?\.entries\|\|\[\]\);\s*\}/);
});
