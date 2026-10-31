import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const serverPath=fileURLToPath(new URL('../scripts/dev-server.mjs',import.meta.url));
test('browser smoke server delivers the real HTML and JS inside its own root',async()=>{
 const port=4199;
 const child=spawn(process.execPath,[serverPath],{
  env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']
 });
 try{
  await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('Local server readiness timeout')),8000);
   child.stdout.on('data',data=>{
    if(String(data).includes(':'+port)){clearTimeout(timeout);resolve()}
   });
   child.on('error',error=>{clearTimeout(timeout);reject(error)});
   child.on('exit',code=>{clearTimeout(timeout);reject(Error('Server exited '+code))});
  });
  const index=await fetch('http://127.0.0.1:'+port+'/');
  assert.equal(index.status,200);
  assert.match(index.headers.get('content-type'),/text\/html/);
  assert.match(await index.text(),/id="hero"/);
  const code=await fetch('http://127.0.0.1:'+port+'/app.js');
  assert.equal(code.status,200);
  assert.match(code.headers.get('content-type'),/javascript/);
  assert.match(await code.text(),/function render\(\)/);
  const missing=await fetch('http://127.0.0.1:'+port+'/no-such-file');
  assert.equal(missing.status,404);
 }finally{
  child.kill();
 }
});
