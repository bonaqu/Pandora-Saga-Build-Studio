#!/usr/bin/env node
// Opt-in acceptance: no existing user's D1 library key is read or reused.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';

const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
const ORIGIN='https://bonaqu.github.io';

async function request(method,path,key,payload){
 const response=await fetch(API+path,{
  method,
  headers:{Origin:ORIGIN,'Content-Type':'application/json',
   ...(key?{Authorization:'Bearer '+key}:{})},
  ...(payload?{body:JSON.stringify(payload)}:{})
 });
 let data;
 try{data=await response.json();}
 catch{throw Error(method+' '+path+': non-JSON response (HTTP '+response.status+')');}
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN,
  method+' '+path+': Pages CORS mismatch');
 return {status:response.status,data};
}
function expect(result,status,label){
 assert.equal(result.status,status,label+': HTTP '+result.status+' '+String(result.data?.error||''));
 return result.data;
}
async function run(){
 const key=randomBytes(32).toString('hex'),foreignKey=randomBytes(32).toString('hex');
 const id=randomBytes(16).toString('hex');
 const entry={id,name:'Ephemeral D1 lifecycle QA',at:Date.now(),
  data:{race:3,gender:0,job:0,level:55,points:{},equipment:{},souls:{}}};
 let created=false,deleted=false;
 console.log('Testing disposable D1 owner, share, deletion and revocation.');
 try{
  const saved=expect(await request('POST','/api/library',key,{action:'put',entry}),200,'Save');
  assert.equal(saved.ok,true);created=true;
  const owner=expect(await request('GET','/api/library',key),200,'Owner read');
  assert.deepEqual(owner.records.find(x=>x.id===id)?.entry,entry);
  const stranger=expect(await request('GET','/api/library',foreignKey),200,'Foreign read');
  assert.equal(stranger.records.some(x=>x.id===id),false);
  const share=expect(await request('POST','/api/shared',key,
   {schema:1,type:'build',buildId:id}),201,'Create link');
  assert.match(share.id,/^[A-Za-z0-9_-]{11}$/);
  const sharePath='/api/shared/'+share.id;
  const publicShare=expect(await request('GET',sharePath,null),200,'Open link');
  assert.deepEqual(publicShare.share.data,entry.data);
  const removed=expect(await request('POST','/api/library',key,
   {action:'delete',id}),200,'Delete');
  deleted=true;
  assert.equal(removed.sharesRevoked,true);
  const tombstones=expect(await request('GET','/api/library',key),200,'Tombstone');
  assert.equal(tombstones.records.find(x=>x.id===id)?.deleted,true);
  const revoked=expect(await request('GET',sharePath,null),410,'Revoked link');
  assert.equal(revoked.reason,'deleted');
  const stale=expect(await request('POST','/api/library',key,
   {action:'put',entry:{...entry,at:entry.at+1000}}),409,'No resurrection');
  assert.equal(stale.reason,'deleted');
  console.log('PASS: level-55 save, owner privacy, verified share, tombstone, 410 revocation, 409 stale write.');
 }finally{
  if(created&&!deleted){
   let failure;
   for(let n=0;n<3;n++){
    try{
     expect(await request('POST','/api/library',key,{action:'delete',id}),
      200,'Emergency cleanup');
     deleted=true;break;
    }catch(error){failure=error;}
   }
   if(!deleted)console.error('WARNING: isolated build cleanup failed:',failure?.message);
  }
 }
}
if(process.argv.length!==3||process.argv[2]!=='--ephemeral'){
 console.error('No writes performed. Explicit one-off acceptance requires --ephemeral.');
 process.exitCode=2;
}else{
 try{await run();}
 catch(error){console.error('Ephemeral D1 lifecycle failed:',error.message);process.exitCode=1;}
}
