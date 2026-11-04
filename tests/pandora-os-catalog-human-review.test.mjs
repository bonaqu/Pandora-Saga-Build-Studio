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
 assert.match(result.summary,/служебные сведения 1 файлов/);
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
