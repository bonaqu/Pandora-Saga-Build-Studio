import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('pandora-studio-chest-presentation.js',root),'utf8');
const ctx={window:{}};
vm.runInNewContext(source,ctx);
const model=ctx.window.PandoraStudioChestPresentation;
const catalog=JSON.parse(readFileSync(new URL('data/os/chests.json',root),'utf8'));
const chestIds=new Set(catalog.boxes.map(box=>String(box.i)));
const box=id=>catalog.boxes.find(b=>String(b.i)===String(id));

test('five independent source rolls display as five compact 100% entries, not one fabricated roll',()=>{
 const rec=box('51003'),before=JSON.stringify(rec);
 const view=model.analyze(rec.rolls,chestIds);
 assert.equal(view.records.length,5);
 assert.equal(view.listed100.length,5);
 assert.equal(view.alternatives.length,0);
 assert.deepEqual(Array.from(view.records,r=>r.index),[0,1,2,3,4]);
 assert.deepEqual(Array.from(view.listed100,r=>r.entries.length),[1,1,1,1,1]);
 assert.equal(view.nestedCount,1,'the last reward links to the next chest');
 assert.equal(view.records[4].nested[0],'51004');
 assert.equal(JSON.stringify(rec),before,'view model must not change game data');
});

test('mixed reward groups preserve all source chances and original indices',()=>{
 const rec=box('51004');
 const view=model.analyze(rec.rolls,chestIds);
 assert.equal(view.records.length,5);
 assert.equal(view.listed100.length,4);
 assert.equal(view.alternatives.length,1);
 assert.equal(view.alternatives[0].index,2);
 assert.equal(view.alternatives[0].entries.length,7);
 assert.equal(view.alternatives[0].entries[0].p,14.29);
 assert.equal(view.nestedCount,1);
});

test('every chest displays high chances first, without changing any source order',()=>{
 const all=[...catalog.boxes,...catalog.npc];
 const preserved=JSON.stringify(all);
 for(const chest of all){
  const sortedGroups=model.orderedGroups(chest.rolls||[]);
  assert.deepEqual(Array.from(sortedGroups,g=>g.index).sort((a,b)=>a-b),
   [...(chest.rolls||[]).keys()]);
  let last=Infinity;
  for(const group of sortedGroups){
   const max=Math.max(-Infinity,...group.entries.map(r=>
    typeof r?.p==='number'&&Number.isFinite(r.p)?r.p:-Infinity));
   assert.ok(max<=last,'Wrong chest group chance order for '+chest.i);
   last=max;
   let previous=Infinity;
   const sorted=model.orderedRewards(group.entries);
   for(const {row} of sorted){
    const chance=Number.isFinite(row?.p)?row.p:-Infinity;
    assert.ok(chance<=previous,'Wrong reward order in '+chest.i);
    previous=chance;
   }
   assert.deepEqual(Array.from(sorted,x=>x.index).sort((a,b)=>a-b),
    [...group.entries.keys()]);
  }
 }
 assert.equal(JSON.stringify(all),preserved);
});
test('stable ties and unknown chances preserve editor indices',()=>{
 const rows=[{i:1,p:5},{i:2,p:null},{i:3,p:20},{i:4,p:5},
  {i:5,p:undefined},{i:6,p:20}];
 assert.deepEqual(Array.from(model.orderedRewards(rows),x=>x.index),
  [2,5,0,3,1,4]);
 assert.deepEqual(Array.from(model.orderedGroups([rows,[{i:7,p:99}],
  [{i:8,p:50}]]),x=>x.index),[1,2,0]);
});
test('unknown chance remains unknown, not 0%; a real 0% is shown as zero',()=>{
 assert.equal(model.chance(null,'ru'),'Шанс не указан');
 assert.equal(model.chance(undefined,'en'),'Chance not listed');
 assert.equal(model.chance(0,'ru'),'0%');
 assert.equal(model.chance(14.29,'en'),'14.29%');
 assert.equal(model.chance(100,'ru'),'100%');
 const plan=model.analyze([[{i:51003,p:null}],[{i:51004,p:0}]],chestIds);
 assert.equal(plan.listed100.length,0);
 assert.equal(plan.other.length,2);
});

test('edit UI keeps the native group index and does not rewrite source arrays',()=>{
 const app=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 assert.match(app,/data-roll-group':String\(i\+1\)/);
 assert.match(app,/PandoraStudioChestPresentation\.orderedGroups\(groups\)/);
 assert.match(app,/PandoraStudioChestPresentation\.orderedRewards\(group\)/);
 assert.match(app,/if\(!adminEditing&&!adminToken&&listedSingle\)certainItems.append\(options.firstElementChild\)/);
 assert.match(app,/changeChest\(groups.map\(\(g,gi\)=>gi!==i\?g:/);
 assert.match(app,/editWikiValue\(chance,row.p,\{type:'number',min:0,max:100/);
 assert.match(app,/if\(type==='number'&&value===null&&before===''\)\{finished=true;restore\(\);return\}/);
 assert.match(app,/wiki-chest-reward-nested/);
 assert.match(app,/const nextChest=chestIds.has\(String\(row.i\)\)/);
});

test('NPC chest gold-only rewards retain exact source currency ranges in RU and EN',()=>{
 const chest=catalog.npc.find(row=>row.i===52002);
 assert.ok(chest,'Actual current NPC chest source is available');
 const before=JSON.stringify(chest);
 const gold=chest.rolls.flat().filter(row=>Array.isArray(row.gold));
 assert.ok(gold.length>=2);
 const displayed=model.goldLabel(gold[0],'ru').replace(/\s/g,' ');
 assert.equal(displayed,'Золото: 60 000–100 000');
 assert.equal(model.goldLabel(gold[0],'en'),'Gold: 60,000–100,000');
 assert.equal(model.goldLabel({gold:[500,500]},'en'),'Gold: 500');
 assert.equal(model.goldAmount(gold[0],'en'),'60,000–100,000');
 assert.equal(model.goldAmount({gold:[500,500]},'ru'),'500');
 assert.equal(JSON.stringify(chest),before,'The presentation must not mutate source rolls');
});

test('missing or malformed gold range is not presented as a fabricated item or amount',()=>{
 for(const range of [undefined,[],[100],[200,100],[0,-5],['100',200],[NaN,100],[1.4,10]]){
  assert.equal(model.goldLabel({gold:range},'ru'),null,String(range));
  assert.equal(model.goldAmount({gold:range},'en'),null,String(range));
 }
 const app=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 const first=app.indexOf("const goldReward=Array.isArray(row.gold);");
 const second=app.indexOf("if(nextChest)rewardMain.append(",first);
 assert.ok(first>=0&&second>first);
 const body=app.slice(first,second);
 assert.match(body,/row\.i!=null\?itemLink/);
 assert.match(body,/goldAmount\(row,lang\)/);
 assert.match(body,/goldNode\|\|chestBind/);
 assert.match(body,/ownerCopyLabel\(goldPrefix,'wiki\.chest\.text'/);
 assert.match(body,/wiki-chest-gold-amount/);
 assert.match(body,/goldReward\?'goldMissing':'rewardMissing'/);
 assert.match(app,/\["rewardMissing","Награда не указана","Reward not listed"\]/);
 assert.match(app,/\["goldMissing","Золото · сумма не указана","Gold · amount not listed"\]/);
 assert.match(app,/if\(adminEditing&&adminToken&&row\.i!=null\)/,
  'A gold-only reward has no editable item quantity');
});
