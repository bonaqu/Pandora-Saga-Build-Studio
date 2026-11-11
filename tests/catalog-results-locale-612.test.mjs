import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('pandora-os-catalog-workbench.js');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);

test('author-editable catalog explanations cannot lose their pencil on refresh',()=>{
 for(const name of ['russianInfo','formattingInfo','metaStatus'])
  assert.equal(source.includes(name+'.textContent='),false,
   name+' must keep its editable DOM subtree');
 assert.match(source,/const metaStatusDetail=h\('p',\{class:'muted os-sync-meta-detail',hidden:true\}\)/);
 assert.match(source,/metaStatus,metaStatusDetail,/);
 assert.match(source,/metaStatusDetail\.hidden=false/);
 assert.match(source,/metaStatusDetail\.textContent=fingerprintCount/);
 assert.match(source,/russianCountLabel\.textContent=' · '\+verifiedRussian\.length/);
 assert.match(source,/formattingCountLabel\.textContent=formattingCount/);
 assert.doesNotMatch(source,/russianLabel\.textContent=copy\('russianDescriptionsLabel'/);
 assert.doesNotMatch(source,/formattingLabel\.textContent=copy\('formattingLabel'/);
});

test('comparison statuses use semantic RU/EN author keys, not raw item values',()=>{
 for(const key of [
  'sourceLiveNotice','sourceArchiveNotice','comparisonFound',
  'comparisonFormattingAndRussian','comparisonFormatting',
  'comparisonRussian','comparisonNoChanges','compareSessionExpired',
  'compareNotCompleted'
 ]){
  assert.ok(source.includes("'"+key+"'"),key);
  const dashed=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  assert.equal(root.PandoraHonorGuide.validOverride('book.catalog-sync.'+dashed,
   JSON.stringify({ru:'Проверка',en:'Verified'})),true,key);
 }
 assert.match(source,/metaStatusDetail\.textContent\+=tr\(/);
 assert.match(source,/if\(from==='server'\)editorialState\(sourceBanner/);
 assert.match(source,/status\.textContent=issue\+tr\(/);
});

test('catalog filters and linked item review keep English defaults while game values stay untouched',()=>{
 for(const name of ['All','New','Changed','Removed','Selected','Needs review',
  'Game links','Same visible text','Explained'])
  assert.ok(source.includes("'"+name+"'"),name);
 assert.match(source,/for\(const \[id,ru,en\]of filterChoices\)/);
 assert.match(source,/button\.textContent=tr\(ru,en\)\+' · '\+byKind\[id\]/);
 assert.match(source,/tr\('Найдено изменений: ','Changes found: '\)/);
 assert.match(source,/tr\('Связь с предметом изменилась · проверить вручную'/);
 assert.match(source,/tr\('Предмет пока не опубликован в энциклопедии\.'/);
 assert.match(source,/const record=upstream\?\.items\?\.\[segment\.id\]\|\|baseline\?\.items\?\.\[segment\.id\]/);
 assert.match(source,/input\.addEventListener\('change',\(\)=>setChoice\(change,input\.checked\)\)/);
});
