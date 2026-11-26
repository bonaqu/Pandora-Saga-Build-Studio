// Fail-closed catalog-only PR detector. Existing required CI jobs still run.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const FILES=Object.freeze(['meta','classes','skills','items','souls','monsters',
 'drops','maps','instances','racialPassives','itemForth','unison','trades',
 'tables','expertise','chests','strings.en'].map(n=>'data/os/'+n+'.json'));
const allowed=new Set(FILES);
export function catalogOnly({event,branch,parents,paths}={}){
 return event==='pull_request' &&
  /^catalog\/snapshot-ps-[a-z0-9-]{8,64}$/.test(String(branch||'')) &&
  parents===2 && Array.isArray(paths) && paths.length>=1 &&
  paths.length<=FILES.length && new Set(paths).size===paths.length &&
  paths.every(p=>allowed.has(p));
}
const git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:4000000});
export function fromVerifiedMerge(env=process.env){
 if(env.GITHUB_EVENT_NAME!=='pull_request')return false;
 // Actions checks out a synthetic two-parent merge [merge,base,PR].
 const parents=git(['rev-list','--parents','-n','1','HEAD']).trim().split(/\s+/);
 if(parents.length!==3)return false;
 const changed=git(['diff','--name-only','-z',parents[1],'HEAD']).split('\0').filter(Boolean);
 return catalogOnly({event:env.GITHUB_EVENT_NAME,branch:env.GITHUB_HEAD_REF,
  parents:2,paths:changed});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(fromVerifiedMerge()?'catalog':'full')}
 catch(error){console.error('Catalog impact not proven: '+error.message);console.log('full')}
}