import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {IDS,EXPECTED_COUNT,DATASETS,validateItems,validateCounts,
 stageId,validateDifferenceRows} from '../scripts/publish-seven-item-levels-once.mjs';

const source=JSON.parse(readFileSync(
 new URL('../data/os/items.json',import.meta.url),'utf8'));
const clone=x=>structuredClone(x);
const oldCatalog=()=>{
 const result=clone(source);
 for(const id of IDS)result[id].level=55;
 return result;
};
test('source contains exactly seven verified level-50 item IDs out of 1140',()=>{
 assert.equal(Object.keys(source).length,EXPECTED_COUNT);
 assert.deepEqual(IDS,['19010','19011','20027','20028','21019','21020','22022']);
 for(const id of IDS){
  assert.ok(source[id],id);
  assert.equal(source[id].level,50,id);
 }
 assert.equal(validateItems(source,oldCatalog()),'pending');
 assert.equal(validateItems(source,clone(source)),'published');
});
test('accept only complete 55->50 change, never partial or surprising levels',()=>{
 const partial=oldCatalog();partial[IDS[0]].level=50;
 assert.throws(()=>validateItems(source,partial),/Partially/);
 const wrong=oldCatalog();wrong[IDS[1]].level=51;
 assert.throws(()=>validateItems(source,wrong),/Unexpected active level/);
 const invalidSource=clone(source);invalidSource[IDS[0]].level=51;
 assert.throws(()=>validateItems(invalidSource,oldCatalog()),/not level 50/);
});
test('block new, missing, malformed or unrelated records and non-level changes',()=>{
 const drift=oldCatalog();drift[IDS[0]].name='Other name';
 assert.throws(()=>validateItems(source,drift),/Non-level fields/);
 const other=oldCatalog();
 const unrelated=Object.keys(other).find(id=>!IDS.includes(id));
 other[unrelated].level=(other[unrelated].level||0)+1;
 assert.throws(()=>validateItems(source,other),/Unreviewed item drift/);
 const absent=oldCatalog();delete absent[unrelated];
 assert.throws(()=>validateItems(source,absent),/count or shape/);
 const extra=oldCatalog();extra['999999999']={level:50};
 assert.throws(()=>validateItems(source,extra),/count or shape/);
 const malformed=oldCatalog();malformed[IDS[2]]=null;
 assert.throws(()=>validateItems(source,malformed),/Invalid item record/);
});
test('validate all 19 D1 dataset counts, including item count',()=>{
 assert.equal(DATASETS.length,19);
 const expected=Object.fromEntries(DATASETS.map((name,i)=>[name,i===3?1140:i+1]));
 const rows=Object.entries(expected).map(([dataset,amount])=>({dataset,amount}));
 assert.equal(validateCounts(rows,expected),true);
 assert.equal(validateCounts(rows.slice(1),expected),false);
 assert.equal(validateCounts([...rows.slice(0,-1),rows[0]],expected),false);
 const bad=clone(rows);bad[3].amount=1139;
 assert.equal(validateCounts(bad,expected),false);
});
test('staged data may differ by exactly seven item payloads, no more',()=>{
 const correct=IDS.map(record_key=>({dataset:'items',record_key}));
 assert.equal(validateDifferenceRows(correct),true);
 assert.equal(validateDifferenceRows(correct.slice(1)),false);
 assert.equal(validateDifferenceRows([...correct.slice(0,6),correct[0]]),false);
 assert.equal(validateDifferenceRows(correct.map((x,i)=>i===0?{...x,dataset:'skills'}:x)),false);
 assert.equal(validateDifferenceRows(correct.map((x,i)=>i===0?{...x,record_key:'999999'}:x)),false);
});
test('staging snapshot identity is deterministic, but never equals active snapshot',()=>{
 const s=stageId('ps-11111111111111111111111111111111');
 assert.match(s,/^item-level-50-20261117-[a-f0-9]{12}$/);
 assert.equal(stageId('ps-11111111111111111111111111111111'),s);
 assert.notEqual(stageId('ps-22222222222222222222222222222222'),s);
 assert.throws(()=>stageId('../bad'),/Invalid active snapshot/);
});
test('production script requires explicit authorization and performs staged CAS only',()=>{
 const script=readFileSync(
  new URL('../scripts/publish-seven-item-levels-once.mjs',import.meta.url),'utf8');
 assert.match(script,/--publish-owner-authorized-seven-levels-20261117/);
 assert.match(script,/json_set\(payload,'\$\.level',50\)/);
 assert.match(script,/json_extract\(payload,'\$\.level'\)=55/);
 assert.match(script,/WHERE id=1 AND snapshot=\?/);
 assert.match(script,/validateDifferenceRows\(difference\)/);
 assert.match(script,/validateCounts\(await datasetCounts\(target\),expectedCounts\)/);
 assert.match(script,/validateItems\(source,await d1Items\(target\)\)/);
 assert.doesNotMatch(script,/DELETE FROM accounts|DELETE FROM sessions|DROP TABLE/i);
 // Past production D1 patches have been verified and closed. Retain the
 // publisher's CAS contract as a historical regression, not an executable
 // GitHub Actions entry that could be dispatched again by mistake.
 for(const name of [
  'publish-seven-item-levels-once.yml',
  'publish-six-instance-ru-once.yml',
  'verify-seven-item-levels-public-once.yml'
 ])assert.equal(existsSync(new URL('../.github/workflows/'+name,import.meta.url)),
  false,'One-off D1 workflow must remain retired: '+name);
});
