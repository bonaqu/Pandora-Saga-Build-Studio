import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const names=['meta','classes','skills','items','souls','monsters','drops','maps','instances',
 'racialPassives','itemForth','unison','trades','tables','expertise','chests','strings.en'];

function setup(changes={},safety=()=>({ok:true,issues:[]})){
 const expected=Object.fromEntries(names.map(name=>[name,{name,data:[name]}]));
 const snapshot='ps-audit-806';
 const root={
  PandoraCatalogImport:{files:names},
  PandoraOSCatalogReview:{strictEqual:(a,b)=>JSON.stringify(a)===JSON.stringify(b)},
  PandoraCatalogSafety:{check:safety}
 };
 runInNewContext(readFileSync(new URL('../pandora-os-catalog-workbench.js',import.meta.url),'utf8'),
  {window:root,AbortSignal});
 const calls=[];
 const fetcher=async url=>{
  const alias=url.split('/').pop().replace('.json','');
  const name=alias==='stringsEn'?'strings.en':alias;
  calls.push(name);
  const override=changes[name]||{};
  return {ok:override.ok??true,headers:{get:key=>
    key==='x-ps-catalog'?(override.source??'d1'):
    key==='x-ps-catalog-snapshot'?(override.snapshot??snapshot):null},
   json:async()=>override.data??expected[name]};
 };
 return {audit:root.PandoraOSCatalogWorkbench.verifyPublishedSnapshot,
  snapshot,expected,calls,fetcher};
}
test('public verification covers every source dataset and rechecks meta',async()=>{
 const a=setup();
 const result=await a.audit('https://invalid.example',a.snapshot,a.expected,a.fetcher);
 assert.equal(result.verifiedDatasets,17);
 assert.equal(a.calls.length,18);
 assert.deepEqual(new Set(a.calls),new Set(names));
 assert.equal(a.calls.filter(x=>x==='meta').length,2);
});
test('a changed skill dataset fails even with unchanged classes/tables',async()=>{
 const a=setup({skills:{data:{changed:true}}});
 await assert.rejects(a.audit('https://invalid.example',a.snapshot,a.expected,a.fetcher),/skills/);
});
test('a missing dataset fails closed',async()=>{
 const a=setup({drops:{ok:false}});
 await assert.rejects(a.audit('https://invalid.example',a.snapshot,a.expected,a.fetcher),/drops/);
});
test('different catalog version and fallback source are rejected',async()=>{
 const a=setup({items:{snapshot:'ps-other-version'}});
 await assert.rejects(a.audit('https://invalid.example',a.snapshot,a.expected,a.fetcher),/items/);
 const b=setup({classes:{source:'archive'}});
 await assert.rejects(b.audit('https://invalid.example',b.snapshot,b.expected,b.fetcher),/classes/);
});
test('failing base-calculation verification is not hidden by data parity',async()=>{
 const a=setup({},()=>({ok:false,issues:['hero calculation failed']}));
 await assert.rejects(a.audit('https://invalid.example',a.snapshot,a.expected,a.fetcher),/hero calculation failed/);
});
