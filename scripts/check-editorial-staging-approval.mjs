#!/usr/bin/env node
// #390: check that manual staging labels refer to a fully green exact PR HEAD
// and that operator-acknowledged ciphertext exists as an unexpired GitHub artifact.
// No staging SQL read/write or API token handling occurs in this module.
const REPO='bonaqu/Pandora-Saga-Build-Studio';
const SHA=/^[a-f0-9]{40}$/;
const HASH=/^[a-f0-9]{64}$/;
const REPORTS=['Studio quality checks','Chromium browser smoke'];
async function github(path,token){
 if(typeof token!=='string'||!token.trim())
  throw Error('GitHub Actions read-only token is required for staged approval');
 const response=await fetch('https://api.github.com/repos/'+REPO+path,{
  headers:{Accept:'application/vnd.github+json',
   Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'},
  signal:AbortSignal.timeout(25000)
 });
 if(!response.ok)throw Error('GitHub approval proof API returned HTTP '+response.status);
 return response.json();
}
export function assertGreenStagingSource(runs,sha){
 if(typeof sha!=='string'||!SHA.test(sha)||!Array.isArray(runs))
  throw Error('Missing valid exact staging source SHA and CI evidence');
 for(const name of REPORTS){
  if(!runs.some(run=>run?.name===name&&run.head_sha===sha&&
   run.event==='pull_request'&&run.status==='completed'&&
   run.conclusion==='success'))
   throw Error('Mandatory '+name+' is NOT green on the exact PR source SHA');
 }
 return true;
}
export function expectedStagingArtifactName(phase,sha,cipherHash){
 if(!['before','after'].includes(phase)||typeof sha!=='string'||!SHA.test(sha)||
  typeof cipherHash!=='string'||!HASH.test(cipherHash))
  throw Error('Missing exact operator-retained encrypted backup receipt');
 return 'ps390-'+phase+'-'+sha+'-'+cipherHash;
}
export function assertRetainedStagingArtifact(artifacts,phase,sha,cipherHash){
 const name=expectedStagingArtifactName(phase,sha,cipherHash);
 if(!Array.isArray(artifacts)||!artifacts.some(a=>a?.name===name&&
  a.expired===false&&
  a.workflow_run?.head_branch==='work/947-issue390-editorial-parity'&&
  Number.isSafeInteger(a.workflow_run?.id)&&
  Number.isSafeInteger(a.size_in_bytes)&&a.size_in_bytes>100))
  throw Error('Retained backup receipt lacks matching live encrypted artifact: '+name);
 return name;
}
export async function main(){
 const phase=process.argv[2]||'ci';
 if(!['ci','import','rollback'].includes(phase)||process.argv.length>3)
  throw Error('Usage: check-editorial-staging-approval.mjs ci|import|rollback');
 const sha=process.env.PS_EDITORIAL_EXPECTED_SHA;
 const token=process.env.GITHUB_TOKEN;
 if(!SHA.test(sha||''))
  throw Error('Exact pinned PR source SHA is required');
 const runs=(await github('/actions/runs?head_sha='+sha+'&per_page=100',token)).workflow_runs;
 assertGreenStagingSource(runs,sha);
 process.stdout.write('Both complete Node and Chromium checks are SUCCESS for exact SHA '+sha+'\n');
 if(phase==='ci')return;
 const sourcePhase=phase==='import'?'before':'after';
 const accepted=process.env.PS390_RETAINED_BACKUP_SHA256;
 const name=expectedStagingArtifactName(sourcePhase,sha,accepted);
 const data=await github('/actions/artifacts?name='+encodeURIComponent(name)+
  '&per_page=100',token);
 const verified=assertRetainedStagingArtifact(data.artifacts,sourcePhase,sha,accepted);
 process.stdout.write('Found unexpired matching encrypted GitHub artifact '+verified+
  '. Operator MUST have separately downloaded an independent copy before approval.\n');
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
 main().catch(e=>{process.stderr.write('STAGING APPROVAL STOPPED: '+e.message+'\n');process.exitCode=1});
