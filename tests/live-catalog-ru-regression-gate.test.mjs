import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {run,DATASETS} from '../scripts/audit-live-catalog-parity.mjs';

const source=name=>JSON.parse(readFileSync(new URL(
 '../data/os/'+(name==='stringsEn'?'strings.en':name)+'.json',import.meta.url),'utf8'));
const OLD='ps-448434407e394325a432b8345206b922';
const NEW='ru-instances-20261109-fa79406fb5c1';
const clone=x=>structuredClone(x);
function mock({missing=false,snapshot=NEW}={}){
 const requests=[];
 const fetcher=async(url,options)=>{
  const dataset=url.match(/\/([^/]+)\.json$/)?.[1];
  assert.ok(DATASETS.includes(dataset),'Unexpected catalog request '+url);
  assert.equal(options.cache,'no-store');
  requests.push(dataset);
  const body=clone(source(dataset));
  if(missing&&dataset==='instances')for(const row of body)delete row.blurbRu;
  return {ok:true,headers:{get:key=>
   key==='x-ps-catalog'?'d1':key==='x-ps-catalog-snapshot'?snapshot:null},
   json:async()=>body};
 };
 return {fetcher,requests};
}
async function audited(options={}){
 const beforeLog=console.log,beforeError=console.error,logs=[],errors=[];
 console.log=(...args)=>logs.push(args.join(' '));
 console.error=(...args)=>errors.push(args.join(' '));
 try{const ok=await run(options);return {ok,logs,errors}}
 finally{console.log=beforeLog;console.error=beforeError}
}
test('default D1 audit requires published six RU blurbs and exact source parity',async()=>{
 const source=mock();
 const result=await audited({fetcher:source.fetcher});
 assert.equal(result.ok,true);
 assert.deepEqual(source.requests,DATASETS);
 assert.ok(result.logs.some(x=>x.includes('16 of 16')&&
  x.includes('0 missing RU blurbs')&&x.includes('0 blocking failures')));
 assert.equal(result.errors.length,0);
});
test('rollback to old snapshot containing six missing RU blurbs blocks default CI',async()=>{
 const source=mock({missing:true,snapshot:OLD});
 const result=await audited({fetcher:source.fetcher});
 assert.equal(result.ok,false,'historical six missing translations must be a failure');
 assert.ok(result.errors.some(x=>/FAIL instances: 6 previously published RU descriptions absent/.test(x)));
 assert.ok(result.logs.some(x=>/6 missing RU blurbs; 1 blocking failures/.test(x)));
});
test('diagnostic mode may describe historical exceptions without changing catalog',async()=>{
 const source=mock({missing:true,snapshot:OLD});
 const result=await audited({fetcher:source.fetcher,strictRu:false});
 assert.equal(result.ok,true,'non-strict is an explicitly requested diagnostic, not the CLI default');
 assert.ok(result.logs.some(x=>/WARN instances: 6/.test(x)));
});
