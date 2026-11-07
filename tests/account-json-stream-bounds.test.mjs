import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAccountJson} from '../worker/pandora-studio-account-api.js';

const endpoint='https://worker.example/api/account/register';
function req(body,{length}={}){
 const raw=typeof body==='string'||body instanceof Uint8Array?body:
  JSON.stringify(body);
 const headers={'Content-Type':'application/json'};
 if(length!==undefined)headers['Content-Length']=String(length);
 return new Request(endpoint,{method:'POST',headers,body:raw});
}

test('normal login and multilingual account bodies remain supported',async()=>{
 const ru={username:'user_123',password:'Длинный пароль с пробелами и 🔒'};
 const r=await parseAccountJson(req(ru));
 assert.deepEqual(r,{data:ru});
 assert.deepEqual(await parseAccountJson(req({username:'alice',password:'A8password!'})),
  {data:{username:'alice',password:'A8password!'}});
});
test('missing or deliberately understated Content-Length cannot bypass 16 KiB',async()=>{
 const huge={padding:'🛡'.repeat(6000)};
 assert.deepEqual(await parseAccountJson(req(huge)),{error:'too_large'});
 assert.deepEqual(await parseAccountJson(req(huge,{length:1})),{error:'too_large'});
 assert.deepEqual(await parseAccountJson(req('{}',{length:999999})),{error:'too_large'});
});
test('the old 4096-character limit stays enforced separately from UTF-8 size',async()=>{
 const chars=JSON.stringify({text:'x'.repeat(4070)});
 assert.ok(chars.length<4096);
 assert.deepEqual(await parseAccountJson(req(chars)),{data:{text:'x'.repeat(4070)}});
 assert.deepEqual(await parseAccountJson(req({text:'x'.repeat(4096)})),
  {error:'too_large'});
 const unicode={text:'Ж'.repeat(3990)};
 assert.ok(Buffer.byteLength(JSON.stringify(unicode),'utf8')>4096);
 assert.deepEqual(await parseAccountJson(req(unicode)),{data:unicode});
});
test('malformed JSON, invalid UTF-8 and invalid size headers are rejected',async()=>{
 assert.deepEqual(await parseAccountJson(req('{"oops":')),{error:'invalid'});
 assert.deepEqual(await parseAccountJson(req(new Uint8Array([0xff,0xfe]))),
  {error:'invalid'});
 assert.deepEqual(await parseAccountJson(req('{}',{length:'oops'})),{error:'invalid'});
});
