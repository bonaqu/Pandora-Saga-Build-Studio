import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const client=read('scripts/check-live-connections.mjs');
const worker=read('worker/index.js');

test('readonly readiness probe uses current Worker owner editor capability marker',()=>{
 assert.match(worker,/codeRelease:'0\.343\.0'/);
 for(const capability of [
  'itemedit','tradeedit','acquireedit','wikiedit','dropedit',
  'chestedit','spawnedit','virtual-town-wiki','bilingual-wiki'
 ]){
  assert.ok(client.includes("'"+capability+"'"),capability);
  assert.ok(worker.includes("'"+capability+"'"),capability);
 }
 assert.ok(client.includes("Number(release?.[1]||0)>=322"));
 assert.ok(!client.includes("payload?.codeRelease==='0.311.0'"));
});
test('readiness version predicate accepts current and future compatible releases',()=>{
 const predicate=version=>{
  const release=/^0\.(\d+)\.0$/.exec(String(version||''));
  return Number(release?.[1]||0)>=322;
 };
 assert.equal(predicate('0.311.0'),false);
 assert.equal(predicate('0.322.0'),true);
 assert.equal(predicate('0.323.0'),true);
 assert.equal(predicate('garbled'),false);
});
