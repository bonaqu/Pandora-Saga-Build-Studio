import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const file=name=>readFileSync(new URL(name,root),'utf8');
const sandbox={window:{}};
for(const name of [
  'pandora-studio-item-presentation.js',
  'pandora-os-catalog-review.js',
  'pandora-os-catalog-human-review.js'
])vm.runInNewContext(file(name),sandbox);
const item=sandbox.window.PandoraItemPresentation;
const review=sandbox.window.PandoraOSCatalogReview;
const describe=sandbox.window.PandoraCatalogHumanReview.describe;
const change=(dataset,key,before,after)=>({dataset,key,
 id:dataset+'\0'+key,kind:'changed',before,after,title:key});
const ctx={baseline:{items:{'300001':{name:'Билет испытаний'},
 '123':{name:'Тыква'}},monsters:{'5':{name:'Фонарщик'}}},
 upstream:{items:{'300001':{name:'Билет испытаний'},'123':{name:'Тыква'}},
 monsters:{'5':{name:'Фонарщик'}}}};

test('OS br tags are faithfully shown as real paragraphs while preserving item refs',()=>{
 const source='Награда: <item 300001>.<br><br>ОЗ +5<br>ИНТ +1';
 const parts=item.descriptionSegments(source,id=>ctx.upstream.items[id]?.name);
 assert.deepEqual(Array.from(parts,p=>p.type),['text','item','text']);
 assert.equal(parts[1].text,'Билет испытаний');
 assert.equal(parts[1].id,'300001');
 assert.equal(parts[1].exists,true);
 assert.equal(item.descriptionText(source,id=>ctx.upstream.items[id]?.name),
  'Награда: Билет испытаний.\n\nОЗ +5\nИНТ +1');
 assert.equal(item.description(item.descriptionText(source,id=>ctx.upstream.items[id]?.name)),
  'Награда: Билет испытаний.\n\nОЗ +5\nИНТ +1');
});

test('rendered description equality does not hide a newly linked game item',()=>{
 const old={desc:'Содержит от 35 до 105 Тыква.'};
 const next={desc:'Содержит от 35 до 105 <item 123>.'};
 const result=describe(change('items','101',old,next),ctx);
 const row=result.rows.find(r=>r.label==='Описание');
 assert.ok(row);
 assert.equal(row.beforeFull,row.afterFull);
 assert.equal(row.linkChanged,true);
 assert.equal(result.uncertain,true,'Link-only changes must require explicit approval');
 assert.match(result.caution,/выбери изменение вручную/);
 assert.match(row.note,/ссылка на предмет/);
 assert.equal(row.sourceAfter,next.desc);
});

test('slot additions are explicitly labeled but missing source fields are not assumed zero',()=>{
 const before={d:[{i:123,t:'',p:35}],s:[]};
 const after={d:[{i:123,t:'',p:35,slotAdd:1}],s:[]};
 const result=describe(change('drops','5',before,after),ctx);
 const row=result.rows.find(r=>r.label.endsWith('Доп. слоты'));
 assert.ok(row);
 assert.equal(row.before,'не указаны');
 assert.match(row.after,/1 дополнительный слот/);
 assert.equal(row.difference,'');
 assert.equal(row.linkedItemId,'123');
 assert.equal(row.linkedItemName,'Тыква');
});

test('source formatting-only descriptions do not become automatic gameplay updates',()=>{
 const old={desc:'Первая строка.<br><br>Вторая строка.'};
 const next={desc:'Первая строка.\n\nВторая строка.'};
 assert.equal(review.equal(old,next),true);
 assert.equal(review.changes('items',{'100':old},{'100':next}).length,0);
});

test('unchanged rendered English text is explained in the review model',()=>{
 const before={d:'A description.<b>Exact item</b>'};
 const after={d:'A description.Exact item'};
 const result=describe(change('strings.en','items/123',before,after),ctx);
 const row=result.rows.find(r=>r.label==='Описание на английском');
 assert.ok(row);
 assert.equal(row.sameVisible,true);
 assert.equal(result.uncertain,true,'Invisible source changes must never be bulk-safe');
 assert.match(result.caution,/выбирай вручную/);
 assert.match(row.note,/Видимый текст совпадает/);
});

test('interactive links are safe UI controls with explicit non-published handling',()=>{
 const workbench=file('pandora-os-catalog-workbench.js');
 const app=file('pandora-studio-app.js');
 const css=file('pandora-os-catalog-workbench.css');
 assert.match(workbench,/descriptionSegments/);
 assert.match(workbench,/os-sync-item-ref/);
 assert.match(workbench,/baseline\?\.items\?\.\[segment\.id\]/);
 assert.match(workbench,/target:'_blank'/);
 assert.match(workbench,/noopener noreferrer/);
 assert.match(workbench,/Предмет пока не опубликован/);
 assert.match(css,/text-decoration:underline dotted/);
 assert.match(app,/document\.body\.append\(root\)/);
 assert.match(app,/panel\.inert=ownerDockCollapsed/);
});


test('admin filters expose link and invisible changes and preserve expanded context',()=>{
 const workbench=file('pandora-os-catalog-workbench.js');
 assert.match(workbench,/\['links','Игровые ссылки'\]/);
 assert.match(workbench,/\['sameVisible','Текст совпадает'\]/);
 assert.match(workbench,/expandedDetails\.has\(change\.id\)/);
 assert.match(workbench,/expandedReferences\.has\(refKey\)/);
 assert.match(workbench,/searchableText\(row\)\.includes\(query\)/);
 assert.match(workbench,/scrollHost=view\.closest\('\.modal'\)\|\|results/);
 assert.match(workbench,/changedView\?0:scrollBefore/);
 assert.match(workbench,/hasLinks\|\|visuallySame/);
 assert.match(workbench,/Изменилась привязка ссылок на предметы/);
});
