import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Use the exact production parsers without making D1 calls.
const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const start=worker.indexOf('async function boundedJsonBody(');
const stop=worker.indexOf('\nasync function auth(',start);
const catalogStart=worker.indexOf('async function catalogBody(');
const catalogStop=worker.indexOf('\nfunction isCostumeKind(',catalogStart);
assert.ok(start>=0&&stop>start&&catalogStart>stop&&catalogStop>catalogStart);
const parse=Function(worker.slice(start,stop)+'\n'+
 worker.slice(catalogStart,catalogStop)+
 '\nreturn {body,ownerEditBody,catalogBody}')( );
function request(raw,{declared=null}={}){
 return new Request('https://worker.example/test',{
  method:'POST',
  headers:{'Content-Type':'application/json',
   ...(declared!==null?{'Content-Length':String(declared)}:{})},
  body:raw
 });
}
test('all JSON routes still accept their valid sized payloads',async()=>{
 assert.deepEqual(await parse.body(request('{"username":"admin"}')),
  {username:'admin'});
 assert.deepEqual(await parse.catalogBody(request('{"snapshot":"qa-2026"}')),
  {snapshot:'qa-2026'});
 const big='x'.repeat(43000);
 assert.deepEqual(await parse.ownerEditBody(request(JSON.stringify({value:big}))),
  {value:big});
});
test('ordinary API request without Content-Length is limited to 8 KiB',async()=>{
 assert.equal(await parse.body(request(JSON.stringify({padding:'x'.repeat(9000)}))),
  null);
 assert.deepEqual(await parse.body(request(JSON.stringify({padding:'x'.repeat(8000)}))),
  {padding:'x'.repeat(8000)});
});
test('underreported and invalid Content-Length cannot bypass the byte limit',async()=>{
 const oversized=request(JSON.stringify({padding:'x'.repeat(9000)}),{declared:2});
 assert.equal(await parse.body(oversized),null);
 assert.equal(await parse.body(request('{}',{declared:'invalid'})),null);
 assert.equal(await parse.catalogBody(request('{}',{declared:9999999})),null);
});
test('catalog import checks actual bytes and retains its character contract',async()=>{
 const cyrillic=JSON.stringify({title:'Ж'.repeat(40000)});
 assert.ok(Buffer.byteLength(cyrillic,'utf8')>65000);
 assert.ok(cyrillic.length<65000);
 assert.equal((await parse.catalogBody(request(cyrillic))).title.length,40000);
 assert.equal(await parse.catalogBody(request(JSON.stringify({
  title:'🛡'.repeat(69000)
 }))),null,'A chunked multi-byte payload cannot exhaust the Worker');
 assert.equal(await parse.catalogBody(request(JSON.stringify({
  title:'x'.repeat(65000)
 }))),null,'The original decoded text limit stays enforced');
});
test('malformed JSON and invalid UTF-8 fail closed',async()=>{
 assert.equal(await parse.body(request('{"unclosed":')),null);
 assert.equal(await parse.catalogBody(request(new Uint8Array([0xff,0xfe]))),null);
});
test('bounded helpers are wired to the actual login, owner and catalog paths',()=>{
 assert.match(worker,/const data=await body\(request\)/);
 assert.match(worker,/const data=await ownerEditBody\(request\)/);
 assert.match(worker,/const data=await catalogBody\(request\)/);
 assert.doesNotMatch(worker,/await request\.(json|text)\(\)/,
  'No remaining unbounded JSON reads should bypass the shared parser');
});
