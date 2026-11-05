import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('production write check is explicit owner-only and never runs on portal startup',()=>{
 const app=read('pandora-studio-app.js');
 const boot=app.slice(app.indexOf('function startStudio('),app.indexOf('function startStudio(')+1000);
 assert.match(app,/class:'owner-dock-d1-check'/);
 assert.match(app,/await apiRequest\('\/api\/admin\/catalog\/test-write',\{\}\)/);
 assert.match(app,/result\.overrideReadback/);
 assert.match(app,/result\.overrideCleaned/);
 assert.match(app,/result\.activeCatalogUnchanged/);
 assert.doesNotMatch(boot,/test-write/);
});

test('authenticated disposable admin check persists and fully cleans only test namespace',async()=>{
 const catalog=new Map(),overrides=new Map();
 const calls=[];
 const DB={
  prepare(sql){
   let args=[];
   return{
    bind(...values){args=values;return this},
    async first(){
     if(sql.includes('SELECT id FROM sessions'))return {id:1};
     if(sql.startsWith('SELECT snapshot,published_at,expected_counts FROM catalog_current'))
      return {snapshot:'live-stable',published_at:1,expected_counts:'{}'};
     if(sql.startsWith('SELECT payload FROM catalog_entries'))
      return {payload:catalog.get(args.slice(0,3).join('|'))};
     if(sql.startsWith('SELECT value FROM overrides'))
      return {value:overrides.get(args[0])};
     throw Error('Unexpected SELECT: '+sql);
    },
    async run(){
     calls.push({sql,args});
     if(sql.startsWith('INSERT INTO catalog_entries')){
      catalog.set([args[0],args[1],args[2]].join('|'),args[7]);
      return{meta:{changes:1}};
     }
     if(sql.startsWith('INSERT INTO overrides')){
      overrides.set(args[0],args[1]);return{meta:{changes:1}};
     }
     if(sql.startsWith('DELETE FROM catalog_entries')){
      const exists=catalog.delete(args.slice(0,3).join('|'));
      return{meta:{changes:Number(exists)}};
     }
     if(sql.startsWith('DELETE FROM overrides')){
      const exists=overrides.delete(args[0]);
      return{meta:{changes:Number(exists)}};
     }
     throw Error('Unexpected write: '+sql);
    }
   };
  }
 };
 const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/catalog/test-write';
 const execute=token=>worker.fetch(new Request(endpoint,{
  method:'POST',
  headers:{Origin:'https://bonaqu.github.io',...(token?{Authorization:'Bearer '+token}:{})},
  body:'{}'
 }),{DB});
 const denied=await execute(null);
 assert.equal(denied.status,401);
 assert.equal(calls.length,0,'Unauthenticated calls must not write');
 const response=await execute('a'.repeat(43));
 assert.equal(response.status,200,await response.clone().text());
 const result=await response.json();
 assert.deepEqual(Object.fromEntries(
  ['ok','readback','cleaned','overrideReadback','overrideCleaned','activeCatalogUnchanged']
   .map(key=>[key,result[key]])),{
    ok:true,readback:true,cleaned:true,overrideReadback:true,
    overrideCleaned:true,activeCatalogUnchanged:true
   });
 assert.equal(catalog.size,0,'Temporary catalog entry must be removed');
 assert.equal(overrides.size,0,'Temporary owner override must be removed');
 const inserts=calls.filter(x=>x.sql.startsWith('INSERT'));
 assert.equal(inserts.length,2);
 assert.match(inserts[0].args[0],/^qa-[a-f0-9]{32}$/);
 assert.match(inserts[1].args[0],/^__qa\.[a-f0-9]{32}$/);
 assert.equal(calls.some(x=>/DELETE FROM catalog_current|UPDATE catalog_current/.test(x.sql)),false);
});
