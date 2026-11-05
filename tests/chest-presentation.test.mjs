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
 assert.match(app,/if\(!adminEditing&&!adminToken&&listedSingle\)certainItems.append\(options.firstElementChild\)/);
 assert.match(app,/changeChest\(groups.map\(\(g,gi\)=>gi!==i\?g:/);
 assert.match(app,/editWikiValue\(chance,row.p,\{type:'number',min:0,max:100/);
 assert.match(app,/if\(type==='number'&&value===null&&before===''\)\{finished=true;restore\(\);return\}/);
 assert.match(app,/wiki-chest-reward-nested/);
 assert.match(app,/const nextChest=chestIds.has\(String\(row.i\)\)/);
});
