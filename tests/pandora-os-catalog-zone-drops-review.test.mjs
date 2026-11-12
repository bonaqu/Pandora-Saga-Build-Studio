import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL('data/os/'+name+'.json',root),'utf8'));
const runtime={window:{}};
vm.runInNewContext(readFileSync(new URL('pandora-os-catalog-human-review.js',root),'utf8'),runtime);
const describe=runtime.window.PandoraCatalogHumanReview.describe;
const catalog={tables:read('tables'),maps:read('maps'),items:read('items'),monsters:read('monsters')};
const context={baseline:catalog,upstream:catalog};
const render=(before,after,ctx=context)=>describe({
 dataset:'tables',key:'@dataset',kind:'changed',title:'Игровые формулы',
 before,after
},ctx);
const clone=value=>structuredClone(value);

test('a real OS zoneDrop value is compared by location and item name, not truncated JSON',()=>{
 const old=clone(catalog.tables),next=clone(catalog.tables);
 old.zoneDrops[0].rows[0].base=0.15;
 old.zoneDrops[0].rows[0].perMember=0.05;
 old.zoneDrops[0].rows[0].items[0].hi=3;
 const result=render(old,next);
 const location=catalog.maps['2001001'].name;
 const item=catalog.items['52002'].name;
 assert.match(result.summary,/Добыча по локациям/);
 assert.ok(result.rows.every(row=>row.label.includes(location)));
 assert.ok(result.rows.some(row=>row.label.includes(item)&&row.label.includes('base')&&
  row.before==='0,15'&&row.after==='0,3'));
 assert.ok(result.rows.some(row=>row.label.includes('perMember')&&row.before==='0,05'&&row.after==='0'));
 assert.ok(result.rows.some(row=>row.label.includes('hi')&&row.before==='3'&&row.after==='0'));
 assert.doesNotMatch(result.summary,/\[\{"map"|прежняя версия → изменены данные/);
 assert.equal(result.uncertain,true,'atomic tables still require manual review');
 assert.equal(result.unexplained,false,'manual review is not the same as unknown fields');
 assert.equal(old.zoneDrops[0].rows[0].base,0.15,'comparison must be read-only');
 assert.equal(next.zoneDrops[0].rows[0].base,0.3);
});

test('reordering complete rules never invents changed item chances',()=>{
 const old=clone(catalog.tables),next=clone(catalog.tables);
 next.zoneDrops[0].rows.reverse();
 const result=render(old,next);
 assert.equal(result.rows.length,1);
 assert.match(result.rows[0].label,/Порядок правил/);
 assert.ok(!result.rows.some(row=>/Базовое значение/.test(row.label)));
 assert.equal(result.unexplained,true,'order significance is not known');
});

test('a unique added item in a zone rule appears by the game item name',()=>{
 const old=clone(catalog.tables),next=clone(catalog.tables);
 next.zoneDrops[0].rows[0].items.push({i:52001,lo:2,hi:5});
 const result=render(old,next);
 assert.ok(result.rows.some(row=>row.label.includes(catalog.items['52001'].name)&&
  /Наличие в правиле/.test(row.label)&&row.before==='нет'&&row.after==='есть'));
 assert.ok(result.rows.some(row=>row.label.includes('Границы (lo / hi)')&&
  row.after==='2 / 5'));
});

test('new source rules show what was added without shifting an unrelated rule',()=>{
 const old=clone(catalog.tables),next=clone(catalog.tables);
 next.zoneDrops[0].rows.push({
  kind:'csv',base:0.8,perMember:0,items:[{i:52001,lo:1,hi:2}]
 });
 const result=render(old,next);
 assert.ok(result.rows.some(row=>row.label.includes('Добавлено правило')&&
  row.after.includes(catalog.items['52001'].name)&&row.after.includes('базовое значение: 0,8')));
 assert.ok(!result.rows.some(row=>row.label.includes('Базовое значение')&&row.before==='0,3'));
});

test('changed rule among identical copies is paired only after exact copies are matched',()=>{
 const old=clone(catalog.tables),next=clone(catalog.tables);
 old.zoneDrops[0].rows.push(clone(old.zoneDrops[0].rows[0]));
 next.zoneDrops[0].rows.push({...clone(next.zoneDrops[0].rows[0]),base:0.9});
 const result=render(old,next);
 assert.equal(result.unexplained,false);
 assert.ok(result.rows.some(row=>row.label.includes('base')&&row.before==='0,3'&&row.after==='0,9'));
 assert.ok(!result.rows.some(row=>row.label.includes('Повторяющиеся правила')));
});

test('unknown parameters stay explicit and prevent a misleading explained badge',()=>{
 const old=clone(catalog.tables),next=clone(catalog.tables);
 next.zoneDrops[0].rows[0].mystery=7;
 const result=render(old,next);
 assert.equal(result.uncertain,true);
 assert.equal(result.unexplained,true);
 assert.ok(result.rows.some(row=>row.label.includes('mystery')&&
  row.after==='7'));
 assert.ok(result.technical.some(line=>line.includes('неизвестный параметр mystery')));
});

test('nested weapon coefficients are shown with their specific refinement level',()=>{
 const old=clone(catalog.tables),next=clone(catalog.tables);
 old.weaponPlus['4'].flat=88;
 const result=render(old,next);
 assert.ok(result.rows.some(row=>row.label.includes('Усиление оружия')&&
  row.label.includes('Заточка +4')&&row.label.includes('flat')&&
  row.before==='88'&&row.after==='8'));
 assert.ok(!result.rows.some(row=>row.before==='прежняя версия'&&
  row.after==='изменены данные'));
 assert.equal(result.uncertain,true);
 assert.equal(result.unexplained,false);
});

test('an unidentified map or item is labelled openly, not assigned a fabricated name',()=>{
 const old={zoneDrops:[{map:9999000,rows:[{kind:'csv',base:0,items:[{i:9999999,lo:0,hi:0}]}]}]};
 const next=clone(old);next.zoneDrops[0].rows[0].base=4;
 const result=render(old,next);
 assert.equal(result.unexplained,true);
 assert.match(result.summary,/9999000/);
 assert.ok(result.rows.some(row=>row.label.includes('9999999')));
});


test('hook-based monster loot retains the original monster and item names',()=>{
 const old=clone(catalog.tables),next=clone(catalog.tables);
 const row=old.zoneDrops.flatMap(zone=>zone.rows).find(row=>row.kind==='hook'&&row.mob===95042);
 assert.ok(row,'OS fixture must have a real hook-based monster');
 row.base=41;
 const result=render(old,next);
 assert.ok(result.rows.some(entry=>entry.label.includes('Василиск')&&
  entry.label.includes('Правило обработчика добычи')&&entry.label.includes('base')&&
  entry.before==='41'&&entry.after==='40'));
});

test('nested level tables use stable diff identifiers instead of misleading array positions',()=>{
 const old={lvModify:[{diff:7,atk:20},{diff:8,atk:30}]};
 const next={lvModify:[{diff:8,atk:30},{diff:7,atk:25}]};
 const result=render(old,next);
 assert.ok(result.rows.some(entry=>entry.label.includes('Разница уровней 7')&&
  entry.label.includes('Атака')&&entry.before==='20'&&entry.after==='25'));
 assert.ok(result.rows.some(entry=>entry.label.includes('Порядок записей')));
 assert.ok(!result.rows.some(entry=>entry.label.includes('Разница уровней 8')&&entry.label.includes('Атака')));
 assert.equal(result.unexplained,true,'source row order must remain a manual-review signal');
});

test('UI does not confuse decoded atomic data with changes safe for bulk acceptance',()=>{
 const workbench=readFileSync(new URL('pandora-os-catalog-workbench.js',root),'utf8');
 assert.match(workbench,/const safe=change=>!describe\(change\)\.uncertain && !describe\(change\)\.service/);
 assert.match(workbench,/description\.unexplained\?tr\('Есть нерасшифрованные параметры'/);
 assert.match(workbench,/description\.uncertain\?tr\('Расшифровано · требуется ручная проверка'/);
});
