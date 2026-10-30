/* Local release guard. No GitHub Actions, Cloudflare credentials, or network required. */
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path=name=>resolve(root,name);
const read=name=>readFileSync(path(name),'utf8');
const write=(name,contents)=>writeFileSync(path(name),contents,'utf8');
const releasePattern=/^\d{4}\.\d{1,2}\.\d{1,2}\.\d+$/;
const metaPattern=/(<meta name="ps-studio-release" content=")([^"]+)(")/;
const assetPattern=/\?v=(\d{4}\.\d{1,2}\.\d{1,2}\.\d+)/g;
const numberParts=value=>value.split('.').map(Number);
const newer=(next,prev)=>{
 const a=numberParts(next),b=numberParts(prev);
 for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]>b[i];
 return false;
};
function check(){
 const pkg=JSON.parse(read('package.json'));
 const manifest=JSON.parse(read('site-version.json'));
 const html=read('index.html');
 const roadmap=read('ROADMAP.md');
 const log=read('CHANGELOG.md');
 const release=pkg.pandoraRelease;
 if(!releasePattern.test(release))throw Error('Invalid package release '+release);
 const expectedVersion='0.'+Number(release.split('.')[3])+'.0';
 const meta=html.match(metaPattern)?.[2];
 const assetVersions=[...html.matchAll(assetPattern)].map(m=>m[1]);
 if(!assetVersions.length)throw Error('No versioned CSS/JS assets found');
 const mismatches=[];
 if(pkg.version!==expectedVersion)mismatches.push('package.json version');
 if(manifest.release!==release)mismatches.push('site-version.json');
 if(meta!==release)mismatches.push('index.html meta');
 if(assetVersions.some(value=>value!==release))mismatches.push('index.html CSS/JS cache keys');
 if(!roadmap.includes('Latest source release:** '+expectedVersion+' ('+String.fromCharCode(96)+release+String.fromCharCode(96)+')'))
  mismatches.push('ROADMAP.md latest release');
 if(!log.includes('## '+expectedVersion+' — '+release))mismatches.push('CHANGELOG.md release entry');
 if(mismatches.length)throw Error('Release '+release+' inconsistent: '+mismatches.join(', '));
 console.log('Release '+release+' is consistent across package, HTML, asset keys, manifest, roadmap, changelog ('+assetVersions.length+' assets).');
}
function bump(next,note){
 if(!releasePattern.test(next))throw Error('Expected YYYY.MM.DD.N, got '+next);
 if(!note?.trim())throw Error('Supply a meaningful changelog note');
 const pkg=JSON.parse(read('package.json'));
 const old=pkg.pandoraRelease;
 if(!releasePattern.test(old)||!newer(next,old))throw Error('Release must be newer than '+old);
 const current=read('index.html');
 const currentMeta=current.match(metaPattern)?.[2];
 if(currentMeta!==old)throw Error('HTML version is not equal to '+old+'. Fix current mismatch before bump.');
 const oldManifest=JSON.parse(read('site-version.json'));
 if(oldManifest.release!==old)throw Error('Manifest version mismatch. Fix before bump.');
 const ver='0.'+Number(next.split('.')[3])+'.0';
 const html=current.replace(metaPattern,(_m,a,_b,c)=>a+next+c)
  .replace(assetPattern,(_m)=>'?v='+next);
 const assets=[...html.matchAll(assetPattern)].map(x=>x[1]);
 if(!assets.length||assets.some(v=>v!==next))throw Error('Asset cache key update failed');
 const roadmap=read('ROADMAP.md').replace(
  /(\*\*Latest source release:\*\* )\d+\.\d+\.\d+ \(\x60[0-9.]+\x60\)/,
  (_m,a)=>a+ver+' ('+String.fromCharCode(96)+next+String.fromCharCode(96)+')');
 const oldRoadmap=read('ROADMAP.md');
 if(roadmap===oldRoadmap)throw Error('ROADMAP.md header could not be updated');
 const log=read('CHANGELOG.md');
 const logHeader='# Pandora Saga Build Studio — CHANGELOG';
 if(!log.startsWith(logHeader))throw Error('Unexpected changelog header');
 const entry='\n\n## '+ver+' — '+next+' · '+note.trim()+
  '\n\n- '+note.trim()+
  '\n- Browser acceptance and deployed Pages state must be verified separately.\n';
 pkg.version=ver;pkg.pandoraRelease=next;
 write('package.json',JSON.stringify(pkg,null,2)+'\n');
 write('index.html',html);
 write('ROADMAP.md',roadmap);
 write('CHANGELOG.md',logHeader+entry+log.slice(logHeader.length));
 // Publish the version manifest last, only after all other local files are staged.
 write('site-version.json',JSON.stringify({release:next,notes:note.trim()},null,2)+'\n');
 check();
}
const args=process.argv.slice(2);
try{
 if(args.length===1&&args[0]==='--check')check();
 else if(args.length>=2)bump(args[0],args.slice(1).join(' '));
 else throw Error('Usage: node scripts/release-version.mjs --check OR YYYY.MM.DD.N "Release note"');
}catch(error){console.error(error.message);process.exitCode=1}
