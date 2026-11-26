import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {FILES,catalogOnly} from '../scripts/catalog-ci-mode.mjs';
const read=n=>JSON.parse(readFileSync(new URL('../data/os/'+n+'.json',import.meta.url),'utf8'));
const root={};runInNewContext(readFileSync(
 new URL('../pandora-studio-encyclopedia-catalog.js',import.meta.url),'utf8'),{window:root});
const validate=root.PandoraWikiCatalog;
const branch='catalog/snapshot-ps-b9fcc323cce04cc0ba83e7760f5bd151';
const eligible=paths=>catalogOnly({event:'pull_request',branch,parents:2,paths});
test('only exact data-only PR merges use fast lane; code and security changes remain full',()=>{
 assert.equal(FILES.length,17);
 assert.equal(eligible(FILES),true);
 assert.equal(eligible(FILES.slice(0,1)),true);
 for(const path of ['worker/index.js','scripts/catalog-fallback-auto-merge.mjs',
  '.github/workflows/quality.yml','data/admin/encyclopedia-overrides.json',
  'data/os/owner.json','tests/test.mjs'])assert.equal(eligible([...FILES,path]),false,path);
 assert.equal(eligible([]),false);
 assert.equal(eligible([FILES[0],FILES[0]]),false);
 assert.equal(catalogOnly({event:'push',branch,parents:2,paths:FILES}),false);
 assert.equal(catalogOnly({event:'pull_request',branch:'work/feature',parents:2,paths:FILES}),false);
 assert.equal(catalogOnly({event:'pull_request',branch,parents:1,paths:FILES}),false);
});
test('all current JSON sources are structurally valid and meta counts are consistent',()=>{
 const sources=Object.fromEntries(FILES.map(path=>{
  const name=path.slice('data/os/'.length,-'.json'.length);return [name,read(name)];
 }));
 for(const [name,expected] of Object.entries(sources.meta.counts)){
  if(!Object.hasOwn(sources,name))continue;
  const n=name==='trades'?sources.trades.trades.length:
   name==='instances'?sources.instances.length:Object.keys(sources[name]).length;
  assert.equal(n,expected,'meta counts must match published '+name);
 }
 assert.equal(sources['strings.en'].locale,'en');
 assert.ok(Array.isArray(sources.chests.boxes));
 for(const chest of sources.chests.boxes){
  assert.ok(Number.isSafeInteger(chest.i)&&chest.i>0);
  assert.ok(Array.isArray(chest.rolls));
  for(const group of chest.rolls)for(const reward of group){
   assert.ok(Number.isSafeInteger(reward.i)&&reward.i>0,'invalid reward ID');
   assert.ok(Number.isSafeInteger(reward.n)&&reward.n>0,'invalid reward quantity');
   assert.ok(typeof reward.p==='number'&&Number.isFinite(reward.p)&&reward.p>0&&reward.p<=100,'invalid chance');
  }
 }
 const game=Object.fromEntries(validate.keys.map(k=>[k,sources[k]]));
 assert.doesNotThrow(()=>validate.validate(game),
  'cross-linked current catalog must pass strict reader validation');
});
