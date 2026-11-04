import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const window={};
for(const path of ['pandora-studio-item-presentation.js','pandora-os-catalog-review.js',
 'pandora-os-catalog-human-review.js'])
 vm.runInNewContext(read(path),{window,Intl,console});
const presenter=window.PandoraItemPresentation;
const review=window.PandoraOSCatalogReview;
const human=window.PandoraCatalogHumanReview;
const items=JSON.parse(read('data/os/items.json'));
const lookup=id=>items[id]?.name||null;

test('literal game item tokens become safe readable verified links',()=>{
 assert.equal(items['300001']?.name,'Билет испытаний');
 const source='Пока корни не ожили, тыкву можно обезвредить.<br>Дозор Астира выдаёт <item 300001>.';
 const parts=presenter.descriptionSegments(source,lookup,'ru');
 const item=parts.find(part=>part.type==='item');
 assert.equal(item.id,'300001');
 assert.equal(item.text,'Билет испытаний');
 assert.equal(item.exists,true);
 const visible=parts.map(part=>part.text).join('');
 assert.match(visible,/обезвредить\.\nДозор/);
 assert.match(visible,/выдаёт Билет испытаний\./);
 assert.doesNotMatch(visible,/<br|<item|300001/);
 assert.equal(presenter.restoreReferences(visible,source,lookup,'ru').includes('<item 300001>'),true);
});

test('unresolved or malicious game markers never become links or evaluated markup',()=>{
 const parts=presenter.descriptionSegments('Item <item 999999999>. <img src=x onerror=alert(1)>',lookup,'en');
 assert.equal(parts.find(x=>x.type==='item').exists,false);
 assert.match(parts.map(x=>x.text).join(''),/Unknown item/);
 assert.doesNotMatch(parts.map(x=>x.text).join(''),/<img|<item|999999999/);
});

test('review presents a current game item name, not the raw source token',()=>{
 const old={name:'Тыква',desc:'Выдаёт за него .'};
 const current={name:'Тыква',desc:'Выдаёт за него <item 300001>.'};
 const detail=human.describe({
  dataset:'items',key:'80100',kind:'changed',
  before:old,after:current,title:'Тыква'
 },{baseline:{items},upstream:{items}});
 assert.equal(detail.rows.length,1);
 assert.match(detail.rows[0].afterFull,/Билет испытаний/);
 assert.doesNotMatch(detail.rows[0].afterFull,/<item|300001/);
 assert.match(detail.summary,/описание/i);
 assert.doesNotMatch(detail.summary,/<br|<item/);
});

test('linebreak-only sync is separate from gameplay changes and preserves exact source',()=>{
 const before={'1':{name:'Спата',desc:'Меч.ПРВ +1'}};
 const next={'1':{name:'Спата',desc:'Меч.<br><br>ПРВ +1'}};
 assert.equal(review.changes('items',before,next).length,0);
 const formatting=review.formattingChanges('items',before,next);
 assert.equal(formatting.length,1);
 assert.equal(formatting[0].after.desc,next['1'].desc);
 next['1'].W=88;
 assert.equal(review.formattingChanges('items',before,next).length,0);
 assert.equal(review.changes('items',before,next).length,1);
 assert.equal(before['1'].W,undefined);
});

test('server metadata checksum drift is not a game change, but level caps are',()=>{
 const old={schemaVersion:1,levelCap:45,sha:{a:'1'},counts:{items:1}};
 const newMeta={schemaVersion:1,levelCap:45,sha:{a:'2'},counts:{items:2}};
 assert.equal(review.metadataOnlyTechnical(old,newMeta),true);
 newMeta.levelCap=50;
 assert.equal(review.metadataOnlyTechnical(old,newMeta),false);
});

test('description UI avoids raw HTML injection and still retains in-place owner editing',()=>{
 const app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
 assert.match(app,/descriptionSegments\(text,lookup,lang\)/);
 assert.match(app,/description\.append\(wikiLink\(segment\.text,'item',segment\.id\)\)/);
 assert.match(app,/description\.append\(document\.createTextNode\(segment\.text\)\)/);
 assert.match(app,/visibleNodes=\[\.\.\.node\.childNodes\]/);
 assert.match(css,/\.wiki-description\{white-space:pre-wrap/);
});
