import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const base=new URL('../',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL('data/os/'+name+'.json',base),'utf8'));
const scope={window:{}};
vm.runInNewContext(readFileSync(new URL('pandora-os-catalog-human-review.js',base),'utf8'),scope);
const describe=scope.window.PandoraCatalogHumanReview.describe;
const data={tables:read('tables'),maps:read('maps'),items:read('items'),monsters:read('monsters')};
const clone=value=>structuredClone(value);
const compare=(old,next)=>describe({dataset:'tables',key:'@dataset',kind:'changed',
 before:old,after:next,title:'Игровые формулы'},{
 baseline:data,upstream:data
});

test('real current OS disappearance: 85 exact rows in Malydia, all counted and named',()=>{
 // Checked against public OS gamedata 2026-11-12: 257 stored vs 172 live.
 // Immutable checked-in D1 fixture; the first 172 rows matched the live file.
 const old=clone(data.tables),next=clone(data.tables);
 const saved=old.zoneDrops.find(zone=>zone.map===2005102);
 const live=next.zoneDrops.find(zone=>zone.map===2005102);
 assert.equal(saved.rows.length,257,'fixture documents the original D1 snapshot');
 live.rows=live.rows.slice(0,172);
 const output=compare(old,next);
 assert.match(output.summary,/Покинутые земли Мальдии \(Германия\)/);
 assert.match(output.summary,/257 → 172 правил/);
 assert.match(output.summary,/убрано 85, добавлено 0/);
 assert.match(output.summary,/Итого удалено 85, добавлено 0/);
 assert.equal(output.uncertain,true,'atomic tables must still require explicit approval');
 assert.equal(output.unexplained,false,'repeated rules with exact counts are not ambiguous');
 assert.equal(output.technical.length,0);
 assert.equal(output.rows.length,97,'1 total + 48 grouped differences with count and original parameters');
 const counts=output.rows.filter(row=>row.label.includes('Количество одинаковых записей'));
 assert.equal(counts.length,48,'show every distinct removed row content');
 assert.ok(counts.some(row=>row.label.includes('Призрачный рекрут')&&
  row.label.includes('Имперская медаль Мальдии')&&row.before==='6'&&row.after==='4'));
 assert.ok(counts.some(row=>row.label.includes('Тыквенный корнеход')&&
  row.label.includes('Тыква')&&row.before==='9'&&row.after==='0'));
 assert.ok(counts.some(row=>row.label.includes('Корнеход Жатвы')&&
  row.label.includes('Тыква')&&row.before==='9'&&row.after==='0'));
 assert.ok(output.rows.some(row=>row.label.includes('Рецепт: Бронзовый венец')));
 assert.ok(output.rows.some(row=>row.label.includes('Гранат')&&
  row.label.includes('Лунный камень')));
 assert.ok(!output.rows.some(row=>row.label.includes('Повторяющиеся правила')));
 assert.equal(data.tables.zoneDrops.find(zone=>zone.map===2005102).rows.length,257);
 assert.equal(old.zoneDrops.find(zone=>zone.map===2005102).rows.length,257,
  'never mutate the published source data during review');
});

test('duplicate rule multiplicity remains exact, even if one copy survives',()=>{
 const rule={kind:'hook',mob:95047,base:6.25,perMember:6.25,
  items:[{i:80098,lo:0,hi:0}]};
 const make=n=>({zoneDrops:[{map:2005102,rows:Array.from({length:n},()=>clone(rule))}]});
 const result=compare(make(3),make(1));
 const change=result.rows.find(row=>row.label.includes('Количество одинаковых записей'));
 assert.equal(change.before,'3');
 assert.equal(change.after,'1');
 assert.match(result.summary,/Итого удалено 2, добавлено 0/);
 assert.equal(result.unexplained,false);
 assert.equal(result.technical.length,0);
});

test('all duplicate copies retained in different order are not reported as removed',()=>{
 const first={kind:'hook',base:0.3,items:[{i:85100,lo:0,hi:0}]};
 const second={kind:'hook',base:0.1,items:[{i:85101,lo:0,hi:0}]};
 const make=rows=>({zoneDrops:[{map:2005102,rows}]});
 const result=compare(make([first,first,second]),make([second,first,first]));
 assert.match(result.summary,/Итого удалено 0, добавлено 0/);
 assert.equal(result.rows.length,1,'only source rule ordering is different');
 assert.match(result.rows[0].label,/Порядок правил/);
 assert.equal(result.unexplained,true,'order significance remains unverified');
});

test('no admin publication or D1 writes introduced in source review renderer',()=>{
 const human=readFileSync(new URL('pandora-os-catalog-human-review.js',base),'utf8');
 const editor=readFileSync(new URL('pandora-os-catalog-workbench.js',base),'utf8');
 assert.doesNotMatch(human,/\/api\/admin\/catalog\/(publish|batch)/);
 assert.match(editor,/const safe=change=>!describe\(change\)\.uncertain && !describe\(change\)\.service/);
 assert.match(editor,/live\.onclick=\(\)=>\{root\.PandoraGuideTooltip\?\.dismiss\(\);compare\('server'\)\}/);
});
