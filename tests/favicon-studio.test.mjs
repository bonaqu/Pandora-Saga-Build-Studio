import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const from=p=>readFileSync(new URL('../'+p,import.meta.url));
test('browser tab uses PS artwork instead of hard-to-read header image',()=>{
 const html=from('index.html').toString('utf8'),v=JSON.parse(from('site-version.json').toString('utf8')).release;
 assert.match(html,/<link rel="icon" type="image\/png" sizes="96x96" href="assets\/favicon-ps-96\.png\?v=/);
 assert.match(html,/rel="apple-touch-icon" href="assets\/favicon-ps-96\.png\?v=/);
 assert.doesNotMatch(html,/<link rel="icon" href="assets\/pandora-logo\.png">/);
 assert.equal([...html.matchAll(/assets\/favicon-ps-96\.png\?v=([^"]+)"/g)].length,2);
 assert.ok([...html.matchAll(/assets\/favicon-ps-96\.png\?v=([^"]+)"/g)].every(m=>m[1]===v));
});
test('96px PS PNG has genuine palette transparency, not painted background',()=>{
 const bytes=from('assets/favicon-ps-96.png');
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(bytes.readUInt32BE(16),96);
 assert.equal(bytes.readUInt32BE(20),96);
 assert.ok(bytes.includes(Buffer.from('tRNS')));
 assert.ok(bytes.length>1200&&bytes.length<20000);
});
