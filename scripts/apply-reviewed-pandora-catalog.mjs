/**
 * Update the 17 stable data/os/*.json files from a reviewed admin export.
 * Dry-run by default. No network requests, GitHub credentials or D1 writes.
 * The original snapshot is preserved if any normal filesystem operation fails.
 */
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,unlinkSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const filename=args.find(arg=>!arg.startsWith('--'));
const write=args.includes('--write');
const validOptions=args.every(arg=>!arg.startsWith('--')||arg==='--write');

function fail(message){console.error(message);process.exitCode=1}
function ensureUnchangedCheckout(){
 let dirty='';
 try{
  dirty=execFileSync('git',
   ['status','--porcelain','--untracked-files=all','--','data/os'],
   {cwd:root,encoding:'utf8'});
 }catch{
  throw Error('Git worktree is required for safe writes. Dry-run does not need Git.');
 }
 if(dirty.trim())
  throw Error('Uncommitted game-data changes found. Commit or restore data/os before --write:\n'+dirty.trim());
}
function applyFiles(entries){
 const temporary=[],installed=[];
 try{
  // Prepare every replacement before changing any tracked source file.
  for(const entry of entries){
   const temp=entry.target+'.stage-'+randomUUID();
   temporary.push(temp);
   writeFileSync(temp,entry.updated+'\n',{encoding:'utf8',flag:'wx'});
   entry.temp=temp;
  }
  for(const entry of entries){
   renameSync(entry.temp,entry.target);
   installed.push(entry);
  }
 }catch(error){
  const rollbackErrors=[];
  for(const entry of installed.reverse()){
   try{writeFileSync(entry.target,entry.original,'utf8')}
   catch(e){rollbackErrors.push(entry.name+': '+e.message)}
  }
  if(rollbackErrors.length)throw Error('Write failed: '+error.message+
   '; rollback failed for: '+rollbackErrors.join(', ')+'. Restore data/os via Git.');
  throw Error('Write failed; previous tracked files restored: '+error.message);
 }finally{
  for(const name of temporary){try{unlinkSync(name)}catch{}}
 }
}
if(!filename||!validOptions){
 fail('Usage: npm run catalog:review -- <reviewed.json> [--write]');
}else{
 try{
  if(statSync(filename).size>40_000_000)throw Error('Reviewed export is unexpectedly large');
  const submitted=JSON.parse(readFileSync(filename,'utf8'));
  if(!['pandora-studio-reviewed.v1','pandora-os-reviewed.v1'].includes(submitted.format)||
    !submitted.datasets||typeof submitted.datasets!=='object'||
    Array.isArray(submitted.datasets))throw Error('Unknown reviewed export format');
  const context={window:{}};
  vm.runInNewContext(readFileSync(join(root,'pandora-os-catalog-import.js'),'utf8'),context);
  const importer=context.window.PandoraCatalogImport;
  const files=importer.files;
  const submittedFiles=Object.keys(submitted.datasets).sort();
  if(submittedFiles.join('\u0000')!==[...files].sort().join('\u0000'))
   throw Error('Incomplete or unexpected source file set');
  const legacy=JSON.parse(readFileSync(join(root,'data/localization/legacy-approved.v1.json'),'utf8'));
  const plan=importer.normalize(submitted.datasets,legacy);
  const output=files.map(name=>{
   const target=join(root,'data/os',name+'.json');
   const updated=JSON.stringify(submitted.datasets[name]);
   const original=readFileSync(target,'utf8');
   return {name,target,original,updated,
    changed:JSON.stringify(JSON.parse(original))!==updated};
  });
  const changed=output.filter(entry=>entry.changed);
  console.log('Reviewed game data: '+changed.length+'/'+files.length+
    ' files changed, '+Object.values(plan.counts).reduce((sum,n)=>sum+n,0)+' D1 rows validated.');
  for(const entry of changed)console.log('  '+entry.name+'.json');
  if(write){
   ensureUnchangedCheckout();
   applyFiles(changed);
   console.log('Files updated. Review Git diff and run npm test and npm run test:browser.');
  }else console.log('Dry run: no files written. Add --write after reviewing the changes.');
 }catch(error){fail('Cannot apply reviewed data: '+error.message)}
}
