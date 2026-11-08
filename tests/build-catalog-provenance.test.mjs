import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const cut=(start,end)=>{
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Unable to isolate source-backed catalog loader');
 return source.slice(a,b);
};

// Test the actual production functions against synthetic HTTP responses,
// not merely a regex in source. They reject *before* mutating game state.
const coreCode=cut('async function loadCatalog({archive=false}={})',
 'let ownerWikiRefreshId=0;');
function core(fetcher){
 return new Function('fetch','AbortSignal','API','catalogLoadVersion',
  coreCode+'\nreturn loadCatalog;')(fetcher,AbortSignal,'https://worker.invalid',0);
}
const englishCode=cut('async function ensureEnglishCatalog(){',
 'async function loadCatalog({archive=false}={})');
const locales=['items','skills','monsters','souls','classes'];
function english(fetcher,archive=false){
 const catalog={meta:{localeCounts:{en:Object.fromEntries(locales.map(x=>[x,0]))}}};
 return new Function('fetch','AbortSignal','API','catalogSource',
  'catalogArchived','officialEnglish','officialEnglishSnapshot',
  'activeCatalogSnapshot','englishCatalogPending','lang','applyGameLocale',
  englishCode+'\nreturn ensureEnglishCatalog;')(
   fetcher,AbortSignal,'https://worker.invalid',catalog,archive,null,null,
   archive?null:'ps-test-snapshot',null,'ru',()=>{});
}
const response=({kind='d1',snapshot='ps-test-snapshot',data={}}={})=>({
 ok:true,status:200,
 headers:{get:key=>key==='x-ps-catalog'?kind:
  key==='x-ps-catalog-snapshot'?snapshot:null},
 json:async()=>data
});

test('character build loader refuses one forged source among matching D1 snapshots',async()=>{
 const requests=[];
 const loader=core(async url=>{
  requests.push(url);
  return response({kind:url.endsWith('/items.json')?'archive':'d1'});
 });
 await assert.rejects(loader({archive:false}),
  /Игровой каталог items: источник D1 не подтверждён/);
 assert.equal(requests.length,9,
  'The calculator must check all nine canonical source datasets');
 assert.equal(requests.every(url=>url.startsWith('https://worker.invalid/api/catalog/')),true);
});

test('character build loader requires explicit D1 header even for plausible snapshot',async()=>{
 const loader=core(async()=>response({kind:null}));
 await assert.rejects(loader({archive:false}),/источник D1 не подтверждён/);
});

test('explicit saved offline game catalog can still omit D1 header',async()=>{
 const loader=core(async()=>response({kind:null,snapshot:null}));
 await assert.rejects(loader({archive:true}),
  error=>/Неполный каталог/.test(error.message)&&
   !/источник D1/.test(error.message));
});

test('English translation refuses forged D1 provenance before parsing a source',async()=>{
 let reads=0,parses=0;
 const loader=english(async url=>{
  reads++;
  assert.equal(url,'https://worker.invalid/api/catalog/stringsEn.json');
  const upstream=response({kind:'archive'});
  upstream.json=async()=>{parses++;return {}};
  return upstream;
 });
 await assert.rejects(loader(),/Английский каталог: источник D1 не подтверждён/);
 assert.equal(reads,1);
 assert.equal(parses,0,'Untrusted translation must never overwrite the UI dictionary');
});

test('explicit offline English archive bypasses D1 origin but validates locale counts',async()=>{
 const data={locale:'en',...Object.fromEntries(locales.map(x=>[x,{}]))};
 const loader=english(async url=>{
  assert.equal(url,'./data/os/strings.en.json');
  return response({kind:null,snapshot:null,data});
 },true);
 assert.deepEqual(await loader(),data);
});

test('confirmed English provenance still requires the active D1 snapshot',async()=>{
 const loader=english(async()=>response({kind:'d1',snapshot:'ps-other'}));
 await assert.rejects(loader(),/Версия английского перевода не совпадает/);
});
