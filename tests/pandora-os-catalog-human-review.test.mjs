import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL('data/os/'+name+'.json',root),'utf8'));
const ctx={window:{}};
vm.runInNewContext(readFileSync(new URL('pandora-os-catalog-human-review.js',root),'utf8'),ctx);
const describe=ctx.window.PandoraCatalogHumanReview.describe;
const after={monsters:read('monsters'),items:read('items')};
const context={baseline:{monsters:after.monsters,items:after.items},upstream:after};
const change=(dataset,key,before,current)=>({
 dataset,key,id:dataset+'\\0'+key,kind:'changed',title:String(key),before,after:current
});
test('a caravan resistance difference is readable in Russian and keeps every changed stat',()=>{
 const current=after.monsters['43601'],old=structuredClone(current);
 for(const code of ['fire','cold','lightning','poison','charm','magic','holy','dark'])
  old.resists[code]=code==='magic'?30:25;
 const result=describe(change('monsters','43601',old,current),context);
 assert.equal(result.title,'43601');
 assert.equal(result.rows.length,8);
 assert.ok(result.rows.some(r=>r.label==='Сопротивление огню'&&r.before==='25'&&r.after==='15'));
 assert.ok(result.rows.some(r=>r.label==='Сопротивление магии'&&r.before==='30'&&r.after==='15'));
 assert.match(result.summary,/Сопротивление огню/);
 assert.doesNotMatch(result.summary,/resists\.|\{|\[/);
 assert.equal(result.uncertain,false);
});
test('health point increases display source values, not raw life keys',()=>{
 const current=after.monsters['43641'],old={...current,life:30000};
 const result=describe(change('monsters','43641',old,current),context);
 assert.ok(result.rows.some(r=>r.label==='Очки здоровья (ОЗ)'&&r.before==='30 000'&&r.after==='60 000'));
 assert.doesNotMatch(result.summary,/life/);
});
test('drop entries use monster and item names and identify changed chances or slots',()=>{
 const id='43730',current=structuredClone(read('drops')[id]),old=structuredClone(current);
 old.d[0].p=100;delete old.d[0].slotAdd;
 const result=describe(change('drops',id,old,current),context);
 assert.match(result.title,/Добыча · Хранитель пепла/);
 assert.ok(result.rows.some(r=>r.label.includes('Шанс в таблице')&&r.before==='100'&&r.after==='20'));
 assert.ok(result.rows.some(r=>r.label.includes('Доп. слоты')));
 assert.doesNotMatch(result.summary,/\[\{|slotAdd|\bd\b/);
 assert.equal(result.uncertain,false);
});
test('source metadata appears as technical-only and is not bulk safe',()=>{
 const old={sha:{'monster/monster.csv':'old'},counts:{items:1116}};
 const current={sha:{'monster/monster.csv':'new'},counts:{items:1116}};
 const result=describe(change('meta','@dataset',old,current),context);
 assert.equal(result.service,true);assert.equal(result.uncertain,true);
 assert.match(result.summary,/контрольные сведения: 1 файл/);
 assert.doesNotMatch(result.summary,/monster\.csv|sha\./);
});
test('atomic instance changes identify the affected quest by its Russian name',()=>{
 const current=read('instances'),old=structuredClone(current);
 old[0].blurbRu='Устаревшее описание';
 const result=describe(change('instances','@dataset',old,current),context);
 assert.equal(result.rows.length,1);
 assert.match(result.rows[0].label,/Беглец · Описание/);
 assert.doesNotMatch(result.summary,/\[\{|@dataset/);
});
test('unknown complex fields are not given a made-up gameplay meaning',()=>{
 const result=describe(change('items','1',{name:'Old',obscure:{x:1}},
  {name:'New',obscure:{x:2}}),context);
 assert.equal(result.uncertain,true);
 assert.ok(result.technical.includes('obscure.x'));
 assert.ok(result.rows.some(x=>x.label==='Название'));
 assert.ok(result.rows.every(x=>!x.label.includes('obscure')));
});


test('numeric change is shown as a signed neutral delta, not an inferred game advantage',()=>{
 const previous={name:'Караван Союза',resists:{fire:25}};
 const next={name:'Караван Союза',resists:{fire:15}};
 const details=describe(change('monsters','43601',previous,next),context);
 const fire=details.rows.find(x=>x.label==='Сопротивление огню');
 assert.equal(fire.difference,'−10');
 assert.equal(fire.delta,-10);
 assert.equal(details.uncertain,false);
});
test('unrecognized resistance is not silently classified as a known game attribute',()=>{
 const result=describe(change('monsters','43601',
  {resists:{mystery:1}},{resists:{mystery:2}}),context);
 assert.equal(result.uncertain,true);
 assert.ok(result.technical.includes('resists.mystery'));
 assert.equal(result.rows.length,0);
});
test('NPC trades identify obtained item, required materials and stated costs',()=>{
 const source=read('trades'),previous=structuredClone(source),current=structuredClone(source);
 const first=current.trades[0];
 first.gold=12;first.mats[0].n+=20;
 const result=describe(change('trades','@dataset',previous,current),context);
 assert.match(result.summary,/1/);
 assert.ok(result.rows.some(x=>x.label.includes('Золото')&&x.after==='12'));
 assert.ok(result.rows.some(x=>x.label.includes('Нужные предметы')));
 assert.doesNotMatch(result.summary,/mats|@dataset/);
 assert.equal(result.uncertain,true,'atomic trades require manual approval even with readable lines');
});
test('chest reward groups show item names and group-scoped chances without false guarantee',()=>{
 const source=read('chests'),previous=structuredClone(source),current=structuredClone(source);
 current.boxes[0].rolls[0][0].p=90;
 const result=describe(change('chests','@dataset',previous,current),context);
 assert.match(result.title,/сундук/i);
 assert.ok(result.rows.some(x=>x.label.includes('Набор наград 1')&&
  x.label.includes('Шанс внутри набора')&&x.before==='100'&&x.after==='90'));
 assert.match(result.summary,/Значения шансов относятся к отдельным наборам наград/);
 assert.equal(result.uncertain,true);
 assert.doesNotMatch(result.summary,/rolls|@dataset/);
});
test('ambiguous repeated reward IDs cannot bypass the manual-review warning',()=>{
 const source=read('chests'),previous=structuredClone(source),current=structuredClone(source);
 current.boxes[0].rolls[0].push({...current.boxes[0].rolls[0][0],p:40});
 const result=describe(change('chests','@dataset',previous,current),context);
 assert.equal(result.uncertain,true);
 assert.ok(result.technical.some(x=>x.includes('одинаковым ID')));
});
test('modified combat tables and expertise categories show sections, never invented math',()=>{
 const tbl=describe(change('tables','@dataset',{weaponPlus:{1:{ratio:2}}},{weaponPlus:{1:{ratio:3}}}),context);
 assert.match(tbl.summary,/Усиление оружия/);
 assert.equal(tbl.uncertain,true);
 assert.ok(tbl.rows.some(x=>x.label==='Усиление оружия'));
 const master=describe(change('expertise','@dataset',{limit:{WARRIOR:{slash:2}}},
  {limit:{WARRIOR:{slash:3}}}),context);
 assert.match(master.summary,/Пределы мастерства/);
 assert.equal(master.uncertain,true);
});
test('changed English item name is anchored to the Russian game item instead of a raw number',()=>{
 const result=describe(change('strings.en','items/1',{n:'Old'},{n:'Gladius'}),context);
 assert.match(result.title,/Спата/);
 assert.ok(result.rows.some(x=>x.label==='Название'&&x.after==='Gladius'));
 assert.equal(result.uncertain,false);
});


test('additional dungeon description is shown without raw JSON',()=>{
 const old=read('instances'),next=structuredClone(old);
 next[0].blurb='Updated game-side English description';
 const result=describe(change('instances','@dataset',old,next),context);
 assert.ok(result.rows.some(row=>row.label.includes('Беглец · Английское описание')));
 assert.equal(result.uncertain,false);
});
test('repeated monster-drop IDs are marked for manual review instead of silently matched',()=>{
 const before={d:[{i:50001,p:30},{i:50001,p:20}]};
 const next={d:[{i:50001,p:35},{i:50001,p:20}]};
 const result=describe(change('drops','43601',before,next),context);
 assert.equal(result.uncertain,true);
 assert.ok(result.technical.some(x=>x.includes('Несколько одинаковых предметов')));
});
test('Russian count labels agree for singular and plural game records',()=>{
 const before={sha:{'a.csv':'old','b.csv':'old'},counts:{items:1}};
 const next={sha:{'a.csv':'new','b.csv':'new'},counts:{items:1}};
 assert.match(describe(change('meta','@dataset',before,next),context).summary,/2 файла/);
 const chests=read('chests'),updated=structuredClone(chests);
 updated.boxes[0].rolls[0][0].p=90;
 assert.match(describe(change('chests','@dataset',chests,updated),context).summary,/1 сундуке/);
});
