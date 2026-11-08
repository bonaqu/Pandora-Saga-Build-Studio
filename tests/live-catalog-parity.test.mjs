import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
import {DATASETS,compareCatalog,describeCatalogDifference,describeDescriptionDrift,validateDescriptionReferences} from '../scripts/audit-live-catalog-parity.mjs';

test('read-only audit includes every player-facing D1 catalog dataset',()=>{
 assert.deepEqual(DATASETS,['items','skills','souls','monsters','drops','maps',
  'instances','trades','tables','chests','racialPassives','classes',
  'itemForth','unison','expertise','stringsEn']);
});
test('the same gameplay records compare without rewriting either input',()=>{
 const a={1:{id:1,name:'Меч',attrs:{atk:4,agi:1}}};
 const b={1:{attrs:{agi:1,atk:4},name:'Меч',id:1}};
 const before=JSON.stringify([a,b]);
 assert.deepEqual(compareCatalog(a,b,'items'),{
  equal:true,missingRu:0,staticCount:1,d1Count:1});
 assert.equal(JSON.stringify([a,b]),before);
});
test('only source-matched missing Russian instance blurbs are a known exception',()=>{
 const source=[{id:20030040,blurb:'Find the fugitive',blurbRu:'Найдите беглеца',
  level:30},{id:20030070,blurb:'Defeat the demon',blurbRu:'Победите демона',
  level:40}];
 const d1=[{id:20030070,blurb:'Defeat the demon',level:40},
  {id:20030040,blurb:'Find the fugitive',level:30}];
 assert.deepEqual(compareCatalog(source,d1,'instances'),{
  equal:true,missingRu:2,staticCount:2,d1Count:2});
 const tampered=structuredClone(d1);tampered[1].level=50;
 assert.equal(compareCatalog(source,tampered,'instances').equal,false);
 const changedEnglish=structuredClone(d1);changedEnglish[0].blurb='Different';
 assert.equal(compareCatalog(source,changedEnglish,'instances').equal,false);
});
test('missing non-translated data, extra instances and translated D1 divergence fail',()=>{
 const source=[{id:1,blurb:'Same',blurbRu:'Перевод'}];
 assert.equal(compareCatalog(source,[],'instances').equal,false);
 assert.equal(compareCatalog(source,[{id:1,blurb:'Same'},
  {id:2,blurb:'Other'}],'instances').equal,false);
 assert.equal(compareCatalog(source,[{id:1,blurb:'Same',
  blurbRu:'Непроверенный перевод'}],'instances').equal,false);
 assert.equal(compareCatalog(source,[{id:1,blurb:'Same',extra:true}],
  'instances').equal,false);
});

test('a NEW missing RU instance description fails rather than extending the exception',()=>{
 const source=[{id:999999,blurb:'Unverified new text',blurbRu:'Новый перевод'}];
 const remote=[{id:999999,blurb:'Unverified new text'}];
 assert.equal(compareCatalog(source,remote,'instances').equal,false);
});

test('live drift diagnostics report counts and safe schema field labels only',()=>{
 const local={123:{name:'Private local label',attrs:{atk:9}},456:{name:'Same'}};
 const remote={123:{name:'Hidden remote label',attrs:{atk:9}},999:{name:'New'}};
 const original=JSON.stringify([local,remote]);
 const message=describeCatalogDifference(local,remote,'items');
 assert.match(message,/local 2, D1 2/);
 assert.match(message,/missing in D1 1, extra in D1 1, changed records 1/);
 assert.match(message,/fields: name/);
 for(const forbidden of ['Private local label','Hidden remote label','123','456','999'])
  assert.equal(message.includes(forbidden),false,'Do not leak game values or record IDs');
 assert.equal(JSON.stringify([local,remote]),original);
});

test('live drift diagnostics handle scalar dictionary values and invalid structures',()=>{
 const local={'A':'red','B':'same'},remote={'A':'blue','B':'same'};
 assert.match(describeCatalogDifference(local,remote,'stringsEn'),/changed records 1/);
 assert.doesNotMatch(describeCatalogDifference(local,remote,'stringsEn'),/red|blue/);
 assert.equal(describeCatalogDifference(null,remote,'items'),'incompatible JSON structure');
});

test('description drift separates line breaks, rich text, links and content',()=>{
 const a={1:{desc:'Sword.ATK +1'},2:{desc:'Fancy.'},
  3:{desc:'Contains .'},4:{desc:'ATK +2'}};
 const b={1:{desc:'Sword.<br>ATK +1'},2:{desc:'<b>Fancy.</b>'},
  3:{desc:'Contains <item 300001>.'},4:{desc:'ATK +5'}};
 const old=JSON.stringify([a,b]);
 assert.deepEqual(describeDescriptionDrift(a,b,'items'),{
  lineBreaks:1,inlineMarkup:1,itemReferences:1,otherText:1
 });
 assert.equal(compareCatalog(a,b,'items').equal,false,
  'Formatting differences must not be hidden from strict parity');
 assert.equal(JSON.stringify([a,b]),old);
});

test('English nested locale descriptions are classified without leaking translations',()=>{
 const source={items:{1:{n:'Sword',d:'Cut.+2'}},souls:{3:{n:'Soul',d:'HP +1'}}};
 const live={items:{1:{n:'Sword',d:'Cut.<br>+2'}},souls:{3:{n:'Soul',d:'HP +9'}}};
 assert.deepEqual(describeDescriptionDrift(source,live,'stringsEn'),{
  lineBreaks:1,inlineMarkup:0,itemReferences:0,otherText:1
 });
 assert.equal(compareCatalog(source,live,'stringsEn').equal,false);
 const summary=JSON.stringify(describeDescriptionDrift(source,live,'stringsEn'));
 assert.doesNotMatch(summary,/Sword|Cut|Soul|HP/);
});

test('description item references resolve only to real catalog records',()=>{
 const input={items:{'80100':{desc:'Используется <item 300001>.'},
  '300001':{desc:'Билет'}},souls:{1:{desc:'Ссылка <item 80100>'}},
  stringsEn:{items:{1:{d:'No link'}},souls:{}}};
 assert.deepEqual(validateDescriptionReferences(input),{total:2,unresolved:0});
 const bad=structuredClone(input);
 bad.items['80100'].desc+=' <item 999999> <item invalid>';
 assert.deepEqual(validateDescriptionReferences(bad),{total:4,unresolved:2});
 assert.equal(input.items['80100'].desc,'Используется <item 300001>.');
});
test('current GitHub archive has no dangling description references',()=>{
 const data={
  items:JSON.parse(read('data/os/items.json')),
  souls:JSON.parse(read('data/os/souls.json')),
  stringsEn:JSON.parse(read('data/os/strings.en.json'))
 };
 const result=validateDescriptionReferences(data);
 assert.ok(result.total>=2,'Archive must keep the verified Halloween references');
 assert.equal(result.unresolved,0,'No source-backed item marker may point to an absent item');
});
