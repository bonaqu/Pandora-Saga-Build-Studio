import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const ctx={window:{}};
vm.runInNewContext(read('pandora-os-catalog-review.js'),ctx);
const review=ctx.window.PandoraOSCatalogReview;
const workbench=read('pandora-os-catalog-workbench.js');
const css=read('pandora-os-catalog-workbench.css');

test('owner can select all game changes without automatically accepting settings',()=>{
 assert.match(workbench,/Выбрать все игровые изменения/);
 assert.match(workbench,/const game=changes\.filter\(item=>!describe\(item\)\.service\)/);
 assert.match(workbench,/uncertain\.length&&!confirm/);
 assert.match(workbench,/for\(const item of game\)chosen\.add\(item\.id\)/);
 assert.match(workbench,/mode==='server'&&formattingCount\)formattingToggle\.checked=true/);
 assert.match(workbench,/chosen\.clear\(\);formattingToggle\.checked=false;russianToggle\.checked=false/);
 assert.match(workbench,/for\(const item of changes\.filter\(safe\)\)chosen\.add/);
 assert.match(css,/\.os-sync-record-selected/);
});

test('staging audit rejects missed approvals and unauthorized record changes',()=>{
 const prev={meta:{counts:{}},items:{1:{name:'Old'},2:{name:'Keep'}},
  tables:{rates:{a:1}},'strings.en':{locale:'en',items:{'1':{n:'Old'}}}};
 const next=structuredClone(prev);
 next.items[1].name='New';
 next.items[2].name='Remove me';
 next.tables.rates.a=2;
 next['strings.en'].items['1'].n='New';
 const files=['meta','items','tables','strings.en'];
 const selected=new Set([review.id('items','1'),review.id('tables','@dataset')]);
 const staged=review.compose(prev,next,selected,files);
 const audit=review.auditSelection(prev,next,staged,selected,files);
 assert.equal(audit.approved,2);
 assert.equal(audit.retained,2);
 assert.equal(staged.items[1].name,'New');
 assert.equal(staged.items[2].name,'Keep');
 assert.equal(staged.tables.rates.a,2);
 const corrupted=structuredClone(staged);
 corrupted.items[1].name='Wrong';
 assert.throws(()=>review.auditSelection(prev,next,corrupted,selected,files),
  /Подготовленные данные отличаются от выбора/);
 const overlooked=structuredClone(staged);
 overlooked.items[2].name='Unexpected';
 assert.throws(()=>review.auditSelection(prev,next,overlooked,selected,files),
  /Подготовленные данные отличаются от выбора/);
});

test('full selection composes all source game changes while keeping metadata manual',()=>{
 const prev={meta:{counts:{items:2},sha:{x:'old'}},items:{1:{name:'A'},2:{name:'B'}},
  tables:{rates:{a:1}},'strings.en':{locale:'en',items:{'1':{n:'A'}}}};
 const next=structuredClone(prev);
 next.meta.sha.x='new';
 next.items[1].name='New';delete next.items[2];next.items[3]={name:'Added'};
 next.tables.rates.a=3;next['strings.en'].items['1'].n='New';
 const files=['meta','items','tables','strings.en'];
 const game=files.filter(x=>x!=='meta').flatMap(dataset=>
  review.changes(dataset,prev[dataset],next[dataset]));
 const chosen=new Set(game.map(change=>change.id));
 const merged=review.compose(prev,next,chosen,files);
 const audit=review.auditSelection(prev,next,merged,chosen,files);
 assert.equal(audit.approved,game.length);
 assert.equal(audit.retained,0);
 assert.deepEqual(JSON.parse(JSON.stringify(merged.items)),JSON.parse(JSON.stringify(next.items)));
 assert.equal(merged.meta.curated,true);
 assert.equal(merged.meta.sha,undefined);
});

test('publish keeps CAS and rereads active version on success or lost response',()=>{
 assert.match(workbench,/review\.auditSelection\(baseline,upstream,combined,chosen,importer\.files/);
 assert.match(workbench,/expectedActive:activeSnapshot/);
 assert.match(workbench,/confirmed=observed\.active===result\.active/);
 assert.match(workbench,/observed\.active===publishingSnapshot/);
 assert.match(workbench,/не применяй тот же набор вслепую/);
});
