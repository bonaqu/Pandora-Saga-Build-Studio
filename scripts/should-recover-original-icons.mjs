#!/usr/bin/env node
// Zero-network, read-only gate for the original artwork recovery workflow.
// Live D1 parity MUST complete first; do not scan already-known 404s on
// ordinary UI releases. An unprobed identity or missing local original is
// grounds to run the existing authenticated mirror + asset audit.
import {readFileSync,existsSync,appendFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalogIconRows} from './icon-catalog-identities.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const key=row=>row.kind+'/'+row.stem;
const expectedPath=row=>'assets/'+row.kind+'/icons/'+row.stem+'.webp';
export function originalIconRecoveryPlan(catalog,manifest,{exists=()=>true}={}){
 if(!manifest||typeof manifest!=='object'||!manifest.icons||
  !Array.isArray(manifest.missing)||typeof exists!=='function')
  throw Error('Missing or invalid original icon manifest');
 const rows=catalogIconRows(catalog);
 const old404=new Set(manifest.missing.filter(row=>
  row&&row.error==='HTTP 404'&&
  ['skills','items','souls'].includes(row.kind)&&
  /^[A-Za-z0-9_-]{1,120}$/.test(row.stem)).map(key));
 const pending=[],known404=[];
 for(const row of rows){
  const file=expectedPath(row);
  const recorded=manifest.icons[row.kind]?.[row.stem];
  if(recorded===file&&exists(file))continue;
  if(recorded===undefined&&old404.has(key(row))){
   known404.push(key(row));continue;
  }
  // A missing on-disk original or an unknown identity needs reconciliation.
  // Never trust a stale icon manifest to claim artwork that is not on disk.
  pending.push(key(row));
 }
 return Object.freeze({needed:pending.length>0,expected:rows.length,
  pending:Object.freeze(pending),known404:known404.length});
}
function main(){
 const data=Object.fromEntries(['skills','items','souls'].map(name=>
  [name,JSON.parse(readFileSync(join(root,'data','os',name+'.json'),'utf8'))]));
 const manifest=JSON.parse(readFileSync(join(root,'assets','os-icon-manifest.json'),'utf8'));
 const plan=originalIconRecoveryPlan(data,manifest,{exists:path=>existsSync(join(root,path))});
 console.log(JSON.stringify({needed:plan.needed,expected:plan.expected,
  pending:plan.pending.length,known404:plan.known404,
  firstPending:plan.pending.slice(0,8)}));
 if(process.argv.includes('--github-output')){
  const output=process.env.GITHUB_OUTPUT;
  if(!output)throw Error('Missing GitHub Actions step output');
  appendFileSync(output,'needed='+String(plan.needed)+'\n');
 }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])
 try{main()}catch(e){console.error('Icon recovery preflight:',e.message);process.exitCode=1}
