import test from 'node:test';
import assert from 'node:assert/strict';
import {DATASETS,compareCatalog} from '../scripts/audit-live-catalog-parity.mjs';

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
