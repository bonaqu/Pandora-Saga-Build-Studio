/** Project-specific runtime dependency and stale-source audit. */
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const html=readFileSync(join(root,'index.html'),'utf8'),errors=[];
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(x=>x[1].split('?')[0]);
const styles=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)]
 .map(x=>x[1].split('?')[0]);
const all=[...scripts,...styles];
if(new Set(all).size!==all.length)errors.push('Duplicate runtime URL');
for(const name of all){
 if(!/^[A-Za-z0-9_-]+\.(?:js|css)$/.test(name))errors.push('Invalid resource path: '+name);
 else if(!existsSync(join(root,name)))errors.push('Missing HTML resource: '+name);
}
const required=[
 ['pandora-studio-origin-model.js','pandora-studio-app.js'],
 ['pandora-studio-attribute-progression.js','pandora-studio-app.js'],
 ['pandora-os-character-calculator.js','pandora-studio-app.js'],
 ['pandora-studio-enchantment.js','pandora-studio-equipment-ui.js'],
 ['pandora-studio-equipment-ui.js','pandora-studio-app.js'],
 ['pandora-studio-hero-book.js','pandora-studio-app.js'],
 ['pandora-os-catalog-import.js','pandora-os-catalog-workbench.js'],
 ['pandora-os-catalog-diff.js','pandora-os-catalog-workbench.js'],
 ['pandora-os-catalog-review.js','pandora-os-catalog-workbench.js'],
 ['pandora-os-catalog-workbench.js','pandora-studio-app.js'],
 ['pandora-studio-item-owner-editor.js','pandora-studio-app.js'],
 ['pandora-studio-app.js','pandora-studio-update-manager.js']
];
for(const [a,b] of required)if(scripts.indexOf(a)<0||scripts.indexOf(b)<0||
 scripts.indexOf(a)>=scripts.indexOf(b))errors.push('Bad module load order: '+a+' -> '+b);
for(const path of ['pandora-studio-theme.css','pandora-studio-equipment-tooltip.css',
 'pandora-os-catalog-workbench.css','pandora-studio-item-owner-editor.css'])if(!styles.includes(path))errors.push('Missing CSS: '+path);
const meta=html.match(/<meta name="ps-studio-release" content="([^"]+)"/)?.[1];
for(const match of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)\?v=([^"]+))"/g))
 if(match[2]!==meta)errors.push('Asset cache version differs: '+match[1]);
const old=["app.js","style.css","account-ui.js","attribute-progression.js","build-comparison.js","build-library-merge.js","build-scope.js","enchant-model.js","equipment-plan.js","game-navigation.js","hero-path.js","item-presentation.js","origin-model.js","os-calculator.js","rules.js","skill-milestones.js","skill-progression.js","skill-results.js","stage-attributes.js","stage-item-tooltip.css","stage-item-ui.js","ui-locale.js","ui-planner.js","updates.js","wiki-catalog.js","wiki-data.js"];
function walk(dir=''){
 for(const file of readdirSync(join(root,dir),{withFileTypes:true})){
  const path=join(dir,file.name).replaceAll('\\','/');
  if(file.isDirectory()){
   if(['.git','.github','assets','node_modules','data','artifacts'].includes(file.name))continue;
   walk(path);continue;
  }
  if(!/\.(?:js|mjs|css|html|md)$/.test(path)||
   ['scripts/refactor-studio-runtime.mjs','scripts/audit-studio-dependencies.mjs'].includes(path))continue;
  const contents=readFileSync(join(root,path),'utf8');
  for(const name of old){
   const test=new RegExp('(?<![A-Za-z0-9-])'+name.replaceAll('.','\\.'));
   if(test.test(contents))errors.push('Old source reference '+name+' in '+path);
  }
 }
}
walk();
for(const file of ['data/os/meta.json','data/os/tables.json'])if(!existsSync(join(root,file)))
 errors.push('Missing protected source file: '+file);
if(errors.length){
 for(const e of errors)console.error('FAIL '+e);
 process.exitCode=1;
}else console.log('Studio graph check passed: '+scripts.length+' scripts, '+styles.length+
 ' stylesheets, '+required.length+' ordered links and no stale filenames');
