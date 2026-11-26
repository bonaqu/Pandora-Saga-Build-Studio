#!/usr/bin/env node
// #390: post-merge public Pages/Worker editorial release acceptance.
// No credentials, mutation, or SQL; verifies only public immutable RU/EN copy.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {buildEditorialDefaultsManifest} from './plan-editorial-d1-defaults.mjs';
import {verifyProductionWorker} from './check-editorial-production-readonly.mjs';
const RELEASE_PIN='0.948.0-5637e5c111eb4528';
export function assertPublicEditorialReleaseSource({manifest,worker,app}){
 if(manifest?.snapshot!==RELEASE_PIN||manifest?.records?.length!==2734||
  manifest?.digest!=='5637e5c111eb452800609eb44f808f2f9d465277252595ad8e2c125f79cb6c8d')
  throw Error('Public editorial release must match reviewed Cloudflare D1 import');
 if(!worker.includes("if(snapshot!=='"+RELEASE_PIN+"')")||
  !worker.includes("env.EDITORIAL_DEFAULTS_PREVIEW==='disabled'")||
  !app.includes("const EDITORIAL_DEFAULTS_PIN='"+RELEASE_PIN+"'"))
  throw Error('Worker or Pages does not pin approved public editorial snapshot');
 return true;
}
export async function main(){
 if(process.argv.length!==2)throw Error('Public editorial acceptance takes no arguments');
 const manifest=buildEditorialDefaultsManifest();
 assertPublicEditorialReleaseSource({manifest,
  worker:readFileSync(new URL('../worker/index.js',import.meta.url),'utf8'),
  app:readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8')});
 let last='unverified';
 for(let attempt=0;attempt<10;attempt++){
  try{
   const result=await verifyProductionWorker();
   if(result==='enabled-and-pinned'){
    console.log('PRODUCTION PUBLIC EDITORIAL ACCEPTANCE SUCCESS: exact D1+Worker snapshot '+
     RELEASE_PIN+', '+manifest.records.length+' full canonical SHA-256 verified rows');
    return;
   }
   last='Worker route not yet enabled for published exact snapshot';
  }catch(error){last=error.message}
  if(attempt<9)await new Promise(done=>setTimeout(done,6000));
 }
 throw Error('Published Worker/editorial D1 not accepted: '+last);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(error=>{console.error('PUBLIC EDITORIAL RELEASE STOPPED: '+error.message);process.exitCode=1});
