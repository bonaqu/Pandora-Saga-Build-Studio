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

test('regular equipment tooltip text also uses the live item name without HTML codes',()=>{
 presenter.setReferenceResolver(lookup,()=> 'ru');
 const text=presenter.description('Дозор выдаёт <item 300001>.<br>При улучшении +2.');
 assert.match(text,/Дозор выдаёт Билет испытаний\./);
 assert.match(text,/\n/);
 assert.doesNotMatch(text,/<item|<br|300001/);
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

test('reviewed Halloween archive descriptions retain real game item links',()=>{
 const cases=[['51060','80100','Тыква'],['80100','300001','Билет испытаний']];
 for(const [sourceId,targetId,label]of cases){
  const row=items[sourceId];
  assert.ok(row&&row.desc.includes('<item '+targetId+'>'));
  const segments=presenter.descriptionSegments(row.desc,lookup,'ru');
  const link=segments.find(piece=>piece.type==='item'&&piece.id===targetId);
  assert.equal(link?.exists,true);
  assert.equal(link?.text,label);
  assert.match(segments.map(piece=>piece.text).join(''),/\n/);
  assert.doesNotMatch(segments.map(piece=>piece.text).join(''),/<item|<br/);
 }
});


test('game item links and all trailing authored line breaks survive together',()=>{
 const source='Дозор выдаёт <item 300001>.<br><br><br>';
 const pieces=presenter.descriptionSegments(source,lookup,'ru');
 assert.equal(pieces.find(p=>p.type==='item')?.text,'Билет испытаний');
 assert.equal(pieces.map(piece=>piece.text).join(''),
  'Дозор выдаёт Билет испытаний.\n\n\n');
 assert.equal(presenter.descriptionText(source,lookup,'ru').endsWith('\n\n\n'),true);
});

test('unchanged author description with repeated item links remains editable and byte-for-byte intact',()=>{
 const source='Билет: <item 300001> и ещё <item 300001>.<br><br>Получено дважды.';
 const visible=presenter.descriptionText(source,lookup,'ru');
 assert.equal(visible,'Билет: Билет испытаний и ещё Билет испытаний.\n\nПолучено дважды.');
 assert.equal(presenter.restoreReferences(visible,source,lookup,'ru'),source,
  'Owner double-click save must not reject repeated source-linked items');
});

test('unchanged editor content never erases original markup or source line breaks',()=>{
 const source='История.<br><b>Особая награда</b>: <item 300001>.<br><br><br>';
 const visible=presenter.descriptionText(source,lookup,'ru');
 assert.equal(visible,'История.\nОсобая награда: Билет испытаний.\n\n\n');
 assert.equal(presenter.restoreReferences(visible,source,lookup,'ru'),source);
});

test('changed ambiguous item mentions still cannot be silently assigned to a wrong ID',()=>{
 const source='Выдают <item 300001>, затем ещё <item 300001>.';
 const visible=presenter.descriptionText(source,lookup,'ru');
 assert.throws(()=>presenter.restoreReferences(visible+' Теперь доступно.',source,lookup,'ru'),
  /встречается несколько раз/,
  'A real edit requires disambiguation rather than guessing source linkage');
});


test('editing text around an item never binds a substring of a longer word',()=>{
 const source='Награда: <item 300001>.';
 const edited='Награда: Билет испытаний. ПромоБилет испытаний недоступен.';
 const restored=presenter.restoreReferences(edited,source,lookup,'ru');
 assert.equal(restored,
  'Награда: <item 300001>. ПромоБилет испытаний недоступен.');
 const replacement='Награда: СуперБилет испытаний.';
 assert.equal(presenter.restoreReferences(replacement,source,lookup,'ru'),
  replacement,'An intentionally renamed item mention must remain plain text');
});

test('whole-name restoration is stable with multiple linked items and an unrelated compound',()=>{
 const localLookup=id=>({'1':'Спата','2':'Лук'}[id]||null);
 const source='Выбери <item 1>, затем <item 2>.';
 const edited='Сначала Лук, потом Спата и АнтиСпата.';
 const restored=presenter.restoreReferences(edited,source,localLookup,'ru');
 assert.equal(restored,'Сначала <item 2>, потом <item 1> и АнтиСпата.');
 assert.equal(presenter.descriptionText(restored,localLookup,'ru'),edited);
});

test('Unicode letters before an item name cannot be interpreted as a word boundary',()=>{
 const source='Take <item 1>.',localLookup=id=>id==='1'?'Ring':null;
 const edited='A𐐀Ring and Ring.';
 assert.equal(presenter.restoreReferences(edited,source,localLookup,'en'),
  'A𐐀Ring and <item 1>.');
});

test('overlapping linked names do not produce nested or reassigned item tokens',()=>{
 const localLookup=id=>({'1':'Билет','2':'Билет испытаний'}[id]||null);
 const source='Награды: <item 1> и <item 2>.';
 assert.throws(()=>presenter.restoreReferences(
  'Теперь награды: Билет и Билет испытаний.',source,localLookup,'ru'),
  /встречается несколько раз|пересекаются/,
  'A shorter item name appearing within another must not be assigned speculatively');
});
