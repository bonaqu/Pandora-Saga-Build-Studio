/**
 * Apply an administrator-reviewed, explicitly downloaded OS snapshot
 * to a local GitHub checkout. Dry-run by default. Never touches Cloudflare D1.
 *
 * npm run catalog:review -- /path/to/pandora-os-reviewed-catalog.json
 * npm run catalog:review -- /path/to/pandora-os-reviewed-catalog.json --write
 */
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const filename=args.find(arg=>!arg.startsWith('--'));
const write=args.includes('--write');
const validOptions=args.every(arg=>!arg.startsWith('--')||arg==='--write');

function fail(reason){console.error(reason);process.exitCode=1}
if(!filename||!validOptions){
 fail('Usage: npm run catalog:review -- <reviewed.json> [--write]');
}else{
 try{
  if(statSync(filename).size>40_000_000)throw Error('Reviewed export is unexpectedly large');
  const submitted=JSON.parse(readFileSync(filename,'utf8'));
  if(submitted.format!=='pandora-os-reviewed.v1'||
    !submitted.datasets||typeof submitted.datasets!=='object'||
    Array.isArray(submitted.datasets))throw Error('Unknown reviewed export format');
  const context={window:{}};
  vm.runInNewContext(readFileSync(join(root,'pandora-os-catalog-import.js'),'utf8'),context);
  const importer=context.window.PandoraCatalogImport;
  const files=importer.files;
  const submittedFiles=Object.keys(submitted.datasets).sort();
  if(submittedFiles.join('\u0000')!==[...files].sort().join('\u0000'))
   throw Error('Incomplete or unexpected OS file set');
  const legacy=JSON.parse(readFileSync(join(root,'data/localization/legacy-approved.v1.json'),'utf8'));
  const plan=importer.normalize(submitted.datasets,legacy);
  const output=files.map(name=>{
   const target=join(root,'data/os',name+'.json');
   const updated=JSON.stringify(submitted.datasets[name]);
   const old=readFileSync(target,'utf8');
   return {name,target,updated,changed:JSON.stringify(JSON.parse(old))!==updated};
  });
  const changed=output.filter(entry=>entry.changed);
  console.log('Reviewed OS snapshot: '+changed.length+'/'+files.length+
    ' files changed, '+Object.values(plan.counts).reduce((sum,n)=>sum+n,0)+' D1 rows validated.');
  for(const entry of changed)console.log('  '+entry.name+'.json');
  if(write){
   for(const entry of changed)writeFileSync(entry.target,entry.updated+'\n');
   console.log('Files written. Run npm test, browser smoke and review the Git diff before committing.');
  }else{
   console.log('Dry run: nothing written. Add --write to update the tracked OS files.');
  }
 }catch(error){fail('Cannot apply reviewed snapshot: '+error.message)}
}
