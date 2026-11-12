import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const base=new URL('../',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL('data/os/'+name+'.json',base),'utf8'));
const sandbox={window:{}};
vm.runInNewContext(readFileSync(new URL('pandora-os-catalog-human-review.js',base),'utf8'),sandbox);
const describe=sandbox.window.PandoraCatalogHumanReview.describe;
const game={maps:read('maps'),items:read('items'),monsters:read('monsters'),tables:read('tables')};
const clone=x=>structuredClone(x);
const zone=(rows,map=2005102)=>({zoneDrops:[{map,rows}]});
const compare=(before,after)=>describe({dataset:'tables',key:'@dataset',kind:'changed',
 before,after,title:'Игровые формулы'},{baseline:game,upstream:game});
const roll=(options={})=>({kind:'hook',mob:95047,base:6.25,perMember:6.25,
 items:[{i:80098,lo:0,hi:0}],...options});
const repeated=(n,options={})=>Array.from({length:n},()=>roll(options));

test('game-site OS probability model: medal changes from six to four independent rolls',()=>{
 const r=compare(zone(repeated(6)),zone(repeated(4)));
 assert.equal(r.impacts.length,1);
 const impact=r.impacts[0];
 assert.equal(impact.itemName,'Имперская медаль Мальдии');
 assert.equal(impact.mobName,'Призрачный рекрут');
 assert.equal(impact.direction,'снизился');
 assert.equal(impact.oldRolls,6);
 assert.equal(impact.newRolls,4);
 assert.equal(impact.oldText,'32,11% / 82,20% / 98,44%');
 assert.equal(impact.newText,'22,75% / 68,36% / 93,75%');
 assert.ok(r.rows.some(e=>e.label.includes('Расчётный шанс')&&
  e.linkedItemId==='80098'&&e.after===impact.newText&&e.note.includes('не подтверждена')));
 assert.equal(r.uncertain,true,'all formula tables require manual approval');
 assert.equal(r.unexplained,false);
 assert.match(r.caution,/заменит целиком раздел/);
});

test('the roll chooses ONE item from a pool, never gives 50% to both',()=>{
 const before=zone([roll({base:50,perMember:0,items:[{i:53002},{i:53006}]})]);
 const after=zone([roll({base:25,perMember:0,items:[{i:53002},{i:53006}]})]);
 const r=compare(before,after);
 assert.equal(r.impacts.length,2);
 for(const effect of r.impacts){
  assert.equal(effect.before[0],25);
  assert.equal(effect.after[0],12.5);
  assert.match(effect.preview,/25,00% → 12,50%/);
 }
});

test('independent rolls combine as 1 minus probability of no success',()=>{
 const before=zone(repeated(3,{base:10,perMember:0}));
 const after=zone(repeated(2,{base:10,perMember:0}));
 const r=compare(before,after);
 assert.equal(r.impacts[0].before[0],27.1);
 assert.equal(r.impacts[0].after[0],19);
 assert.equal(r.impacts[0].oldRolls,3);
 assert.equal(r.impacts[0].newRolls,2);
});

test('party modifiers affect solo, four and eight differently, and cap at 100%',()=>{
 const r=compare(zone([roll({base:10,perMember:20})]),
  zone([roll({base:5,perMember:10})]));
 assert.deepEqual(Array.from(r.impacts[0].before),[10,70,100]);
 assert.deepEqual(Array.from(r.impacts[0].after),[5,35,75]);
 assert.equal(r.impacts[0].direction,'снизился');
});

test('map-wide and monster-specific loot never get silently combined',()=>{
 const wide=roll({mob:undefined,base:50,perMember:0});
 delete wide.mob;
 const original=zone([wide,roll()]);
 const latest=zone([wide,roll({base:1})]);
 const impact=compare(original,latest).impacts;
 assert.equal(impact.length,1);
 assert.equal(impact[0].mobName,'Призрачный рекрут');
 assert.ok(impact[0].before[0]>impact[0].after[0]);
});

test('conditional event or quest roll does not produce invented game odds',()=>{
 const r=compare(zone([roll({base:60,t:'event'})]),
  zone([roll({base:20,t:'event'})]));
 assert.equal(r.impacts.length,0);
 assert.equal(r.unexplained,true);
 assert.ok(r.technical.some(x=>x.includes('дополнительное условие')));
 assert.ok(r.rows.some(x=>x.label.includes('Шанс не вычислен')));
});

test('unknown source fields prevent a misleading probability estimate',()=>{
 const r=compare(zone([roll({base:9})]),zone([roll({base:11,mysteryFlag:7})]));
 assert.equal(r.impacts.length,0);
 assert.equal(r.unexplained,true);
 assert.ok(r.rows.some(x=>x.label.includes('Шанс не вычислен')));
});

test('identical rows reordered cannot alter the modeled drop chance',()=>{
 const a=roll({base:10,perMember:0}),b=roll({base:20,perMember:0});
 const r=compare(zone([a,b,a]),zone([b,a,a]));
 assert.equal(r.impacts.length,0);
 assert.equal(r.uncertain,true,'order changes still require manual check');
});

test('CSV extra map drops are separate from hook rolls and other monster loot',()=>{
 const csv=roll({kind:'csv',mob:undefined,base:0.3,perMember:0});
 delete csv.mob;
 const hook=roll({mob:undefined,base:0.3,perMember:0});
 delete hook.mob;
 const r=compare(zone([csv,hook]),zone([hook]));
 assert.equal(r.impacts.length,1);
 assert.equal(r.impacts[0].kind,'csv');
 assert.equal(r.impacts[0].before[0],0.3);
 assert.equal(r.impacts[0].after[0],0);
 assert.match(r.impacts[0].mobName,/любой монстр/);
});

test('real Malydia source fixture generates meaningful named chances and never changes D1',()=>{
 const previous=clone(game.tables),current=clone(game.tables);
 const rows=current.zoneDrops.find(z=>z.map===2005102).rows;
 assert.equal(rows.length,257);
 current.zoneDrops.find(z=>z.map===2005102).rows=rows.slice(0,172);
 const r=compare(previous,current);
 assert.equal(r.impacts.length,182);
 assert.match(r.summary,/изменились шансы в 182/);
 assert.equal(r.unexplained,false);
 assert.equal(r.uncertain,true);
 assert.ok(r.impacts.some(e=>e.preview.includes('Призрачный рекрут')&&
  e.preview.includes('Имперская медаль Мальдии')&&
  e.preview.includes('32,11% → 22,75%')));
 assert.equal(game.tables.zoneDrops.find(z=>z.map===2005102).rows.length,257);
});

test('the editor previews selected impacts before the explicit, atomic D1 publication',()=>{
 const editor=readFileSync(new URL('pandora-os-catalog-workbench.js',base),'utf8');
 assert.match(editor,/Как изменится расчётный шанс выпадения/);
 assert.match(editor,/selectedChanges=changes\.filter\(checked\)/);
 assert.match(editor,/const atomicWarning=selectedChanges\.some\(e=>e\.dataset==='tables'\)/);
 assert.match(editor,/impactPreview\+otherPreview/);
 assert.match(editor,/const safe=change=>!describe\(change\)\.uncertain && !describe\(change\)\.service/);
 assert.match(editor,/Ничего не опубликовано до этого подтверждения/);
 assert.match(editor,/const current=await request\('\/api\/admin\/catalog\/status'/);
});
