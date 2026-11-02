/**
 * One-time, deterministic runtime refactor. data/os/ and D1 dataset IDs stay unchanged.
 * Explicit command: node scripts/refactor-studio-runtime.mjs --apply
 */
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {extname} from 'node:path';
const root=new URL('../',import.meta.url);
const expectedBranch='refactor/studio-names-and-architecture-20261102';
const mapping={
  "app.js": "pandora-studio-app.js",
  "style.css": "pandora-studio-theme.css",
  "account-ui.js": "pandora-studio-account-ui.js",
  "attribute-progression.js": "pandora-studio-attribute-progression.js",
  "build-comparison.js": "pandora-studio-build-comparison.js",
  "build-library-merge.js": "pandora-studio-build-library-merge.js",
  "build-scope.js": "pandora-studio-build-scope.js",
  "enchant-model.js": "pandora-studio-enchantment.js",
  "equipment-plan.js": "pandora-studio-equipment-plan.js",
  "game-navigation.js": "pandora-studio-navigation.js",
  "hero-path.js": "pandora-studio-hero-path.js",
  "item-presentation.js": "pandora-studio-item-presentation.js",
  "origin-model.js": "pandora-studio-origin-model.js",
  "os-calculator.js": "pandora-os-character-calculator.js",
  "rules.js": "pandora-studio-equipment-rules.js",
  "skill-milestones.js": "pandora-studio-skill-milestones.js",
  "skill-progression.js": "pandora-studio-skill-progression.js",
  "skill-results.js": "pandora-studio-skill-results.js",
  "stage-attributes.js": "pandora-studio-hero-book.js",
  "stage-item-tooltip.css": "pandora-studio-equipment-tooltip.css",
  "stage-item-ui.js": "pandora-studio-equipment-ui.js",
  "ui-locale.js": "pandora-studio-ui-locale.js",
  "ui-planner.js": "pandora-studio-ui-planner.js",
  "updates.js": "pandora-studio-update-manager.js",
  "wiki-catalog.js": "pandora-studio-encyclopedia-catalog.js",
  "wiki-data.js": "pandora-studio-encyclopedia-data.js",
  "worker/account.js": "worker/pandora-studio-account-api.js"
};
const run=(command,args)=>execFileSync(command,args,{cwd:root,encoding:'utf8'});
const tracked=()=>run('git',['ls-files','-z']).split('\0').filter(Boolean);
const refPatterns=Object.entries(mapping).sort((a,b)=>b[0].length-a[0].length)
 .map(([from,to])=>({from,to,regex:new RegExp('(?<![A-Za-z0-9-])'+from.replaceAll('.','\\.'),'g')}));
const skip=new Set(['scripts/refactor-studio-runtime.mjs','scripts/audit-studio-dependencies.mjs']);
const extensions=new Set(['.js','.mjs','.css','.html','.json','.md','.yml','.yaml','.toml','.txt','.sql']);
function refactor(){
 if(process.argv.length!==3||process.argv[2]!=='--apply')throw Error('Explicit --apply required');
 const branch=run('git',['branch','--show-current']).trim();
 if(branch!==expectedBranch)throw Error('Operation restricted to refactor branch: '+branch);
 let renamed=0,updated=0,replacements=0;
 for(const [from,to] of Object.entries(mapping)){
  const hasOriginal=existsSync(new URL(from,root));
  if(hasOriginal&&existsSync(new URL(to,root)))throw Error('Duplicate source: '+from+' and '+to);
  if(hasOriginal){run('git',['mv','--',from,to]);renamed++;}
  else if(!existsSync(new URL(to,root)))throw Error('Missing both runtime paths: '+from);
 }
 for(const path of tracked()){
  if(skip.has(path)||path.startsWith('assets/')||path.startsWith('data/')||
    !extensions.has(extname(path)))continue;
  const url=new URL(path,root),original=readFileSync(url,'utf8');
  let content=original;
  for(const {regex,from,to} of refPatterns){
   content=content.replace(regex,()=>{replacements++;return to;});
   // Many old regression tests check filenames using JavaScript regexp literals:
   // /stage-item-ui\\.js\\?v=/; their escaped dots are references too.
   const escapedFrom=from.replaceAll('.', String.fromCharCode(92)+'.');
   const escapedTo=to.replaceAll('.', String.fromCharCode(92)+'.');
   const escapedPattern=new RegExp('(?<![A-Za-z0-9-])'+escapedFrom.replaceAll(String.fromCharCode(92),String.fromCharCode(92,92)),'g');
   content=content.replace(escapedPattern,()=>{replacements++;return escapedTo;});
  }
  if(path==='worker/index.js'){
   content=content.replace("import {accountApi,principal as accountPrincipal} from './account.js';",
     "import {accountApi,principal as accountPrincipal} from './pandora-studio-account-api.js';");
  }
  if(content!==original){writeFileSync(url,content);updated++;}
 }
 for(const from of Object.keys(mapping))
  if(existsSync(new URL(from,root)))throw Error('Old runtime source survived: '+from);
 console.log(JSON.stringify({renamed,updatedReferencesInFiles:updated,
  rewrittenReferences:replacements,gameDataPreserved:'data/os/*.json'}));
}
try{refactor()}catch(error){console.error(error.stack||error.message);process.exitCode=1}
