import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDS,EXPECTED_ACTIVE,DATASETS,validateInstances,validateCounts,stageId} from
 '../scripts/publish-six-instance-ru-once.mjs';

const source=JSON.parse(readFileSync(new URL('../data/os/instances.json',import.meta.url),'utf8'));
const local=()=>structuredClone(source);
const untranslated=()=>local().map(({blurbRu:removed,...rest})=>rest);
test('six existing EN/RU instance descriptions are complete and unique',()=>{
 assert.equal(source.length,6);
 assert.deepEqual(source.map(x=>x.id).sort((a,b)=>a-b),[...IDS]);
 assert.equal(source.every(x=>x.blurbRu?.trim()&&x.blurb?.trim()),true);
 assert.match(EXPECTED_ACTIVE,/^ps-[a-f0-9]{32}$/);
 assert.equal(validateInstances(source,untranslated()),'missing');
 assert.equal(validateInstances(source,local()),'published');
});
test('one missing RU blurb or mismatched source must not be published',()=>{
 const wrong=untranslated();wrong[0].blurb='A modified English game quest';
 assert.throws(()=>validateInstances(source,wrong),/differs/);
 const partial=untranslated();partial[0].blurbRu=source[0].blurbRu;
 assert.throws(()=>validateInstances(source,partial),/Partially translated/);
 const extra=untranslated();extra[0].id=987654;
 assert.throws(()=>validateInstances(source,extra),/identifier/);
 const typo=untranslated();typo[1].quest='UNCONFIRMED';
 assert.throws(()=>validateInstances(source,typo),/differs/);
 const already=local();already[0].blurbRu='unapproved translation';
 assert.throws(()=>validateInstances(source,already),/differs/);
 const missing=local();delete missing[0].blurbRu;
 assert.throws(()=>validateInstances(source,missing),/Partially translated/);
});
test('staged publication identity is deterministic but distinct for new source',()=>{
 const previous=stageId(EXPECTED_ACTIVE,source);
 assert.match(previous,/^ru-instances-20261109-[a-f0-9]{12}$/);
 assert.equal(previous,stageId(EXPECTED_ACTIVE,local()));
 const altered=local();altered[0].blurbRu+='!';
 assert.notEqual(stageId(EXPECTED_ACTIVE,altered),previous);
 assert.throws(()=>stageId('bad/id',source),/Invalid/);
});
test('all 19 D1 datasets must be copied with their authoritative counts',()=>{
 const expected=Object.fromEntries(DATASETS.map((name,i)=>[name,i+1]));
 const rows=Object.entries(expected).map(([dataset,amount])=>({dataset,amount}));
 assert.equal(DATASETS.length,19);
 assert.equal(validateCounts(rows,expected),true);
 assert.equal(validateCounts(rows.slice(1),expected),false);
 assert.equal(validateCounts([...rows.slice(0,-1),rows[0]],expected),false);
 assert.equal(validateCounts(rows.map((x,i)=>i===1?{...x,amount:8}:x),expected),false);
});
test('remote job requires an explicit owner-authorization flag and stages before CAS',()=>{
 const sourceCode=readFileSync(new URL('../scripts/publish-six-instance-ru-once.mjs',import.meta.url),'utf8');
 assert.match(sourceCode,/--publish-owner-authorized-six-ru/);
 assert.match(sourceCode,/stageCreated=true/);
 assert.match(sourceCode,/json_set\(payload,'\$\.blurbRu',\?\)/);
 assert.match(sourceCode,/WHERE id=1 AND snapshot=\?/);
 assert.match(sourceCode,/validateInstances\(source,await fromD1\(target\)\)/);
 assert.doesNotMatch(sourceCode,/UPDATE catalog_entries SET payload=[^\n]+WHERE snapshot=\? AND dataset='instances'/);
});
