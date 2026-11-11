// Conservative PR impact filter: a change we cannot prove copy/style-only runs full Chromium.
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function normalizeForReleaseOnly(path,contents){
 if(path==='index.html')return contents
  .replace(/(<meta name="ps-studio-release" content=")[0-9.]+(?=")/g,'$1RELEASE')
  .replace(/\?v=\d{4}\.\d{1,2}\.\d{1,2}\.\d+/g,'?v=RELEASE');
 if(path==='package.json'){
  const value=JSON.parse(contents);
  delete value.version;
  delete value.pandoraRelease;
  return JSON.stringify(value);
 }
 if(path==='site-version.json'){
  const value=JSON.parse(contents);
  delete value.release;
  delete value.notes;
  return JSON.stringify(value);
 }
 return contents;
}

const harmless=/^(?:docs\/|artifacts\/)|(?:^|\/)[^/]+\.md$|\.css$|^pandora-studio-ui-locale\.js$|^tests\/[^/]+\.test\.mjs$/;

export function selectBrowserSuite(changedPaths,{releaseOnlyFiles=[]}={}){
 if(!Array.isArray(changedPaths)||!changedPaths.length)return 'full';
 const releaseOnly=new Set(releaseOnlyFiles);
 return changedPaths.every(p=>harmless.test(p)||releaseOnly.has(p))?'quick':'full';
}

function runGit(args){
 return execFileSync('git',args,{encoding:'utf8',maxBuffer:4*1024*1024});
}

export function selectFromPrMerge(){
 // Actions/checkout on pull_request checks out the synthetic merge commit.
 // A missing parent or unexpected checkout shape intentionally fails closed.
 const parents=runGit(['rev-list','--parents','-n','1','HEAD']).trim().split(/\s+/);
 if(parents.length!==3)throw Error('PR checkout is not a two-parent merge commit');
 const base=parents[1],changed=runGit(['diff','--name-only','-z',base,'HEAD']).split('\0').filter(Boolean);
 const releaseOnlyFiles=[];
 for(const p of ['index.html','package.json','site-version.json']){
  if(!changed.includes(p))continue;
  const before=normalizeForReleaseOnly(p,runGit(['show',base+':'+p]));
  const after=normalizeForReleaseOnly(p,runGit(['show','HEAD:'+p]));
  if(before===after)releaseOnlyFiles.push(p);
 }
 return selectBrowserSuite(changed,{releaseOnlyFiles});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  console.log(selectFromPrMerge());
 }catch(error){
  console.error('Browser impact classifier failed, use full suite:',error.message);
  process.exitCode=1;
 }
}
