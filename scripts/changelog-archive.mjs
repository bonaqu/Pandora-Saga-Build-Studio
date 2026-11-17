/* Deterministic rotation of the short root changelog into individual historical files.
   Existing archived releases stay immutable. No network or GitHub credentials. */
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const HEADER='# Pandora Saga Build Studio — CHANGELOG';
const MARKER='<!-- CHANGELOG_ARCHIVE -->';
const INDEX_MARKER='<!-- NEWEST ARCHIVES -->';
const entryHeading=/^## (0\.\d+\.0) — /gm;
export function rotateChangelog(root){
 const path=join(root,'CHANGELOG.md'),raw=readFileSync(path,'utf8');
 if(!raw.startsWith(HEADER)||!raw.includes(MARKER))
  throw Error('Unexpected archived CHANGELOG structure');
 const markerAt=raw.indexOf(MARKER);
 const footerAt=raw.lastIndexOf('\n\n---\n\n',markerAt);
 const matches=[...raw.slice(0,footerAt).matchAll(entryHeading)];
 if(!matches.length||footerAt<0)throw Error('Changelog has no releases');
 if(matches.length<=16&&raw.length<=22000)return;
 const entries=matches.map((m,i)=>({
  version:m[1],
  body:raw.slice(m.index,i+1<matches.length?matches[i+1].index:footerAt).trim()
 }));
 const retained=entries.slice(0,12),old=entries.slice(12);
 if(!old.length)return;
 const archiveDir=join(root,'docs','changelog');
 if(!existsSync(join(archiveDir,'README.md')))
  throw Error('Missing historical changelog index');
 let index=readFileSync(join(archiveDir,'README.md'),'utf8');
 if(!index.includes(INDEX_MARKER))throw Error('Missing archive index marker');
 const additions=[];
 // Every new rollover gets a small, independently readable file and link.
 for(const entry of old){
  if(!/^0\.\d+\.0$/.test(entry.version))throw Error('Invalid release '+entry.version);
  const name='release-'+entry.version+'.md';
  const target=join(archiveDir,name);
  if(existsSync(target))throw Error('Refusing to overwrite historical release '+name);
  const content='# Release '+entry.version+'\n\n'+entry.body.replace(
   /(\]\()(?!(?:https?:|mailto:|#|\/))([^)]+)(\))/g,(_m,a,link,b)=>
    a+'../../'+link+b)+'\n';
  if(content.length>22000)throw Error('Historical release exceeds read limit '+name);
  writeFileSync(target,content);
  additions.push('- ['+entry.version+'](./'+name+')');
 }
 index=index.replace(INDEX_MARKER,INDEX_MARKER+'\n'+additions.join('\n'));
 writeFileSync(join(archiveDir,'README.md'),index);
 const compact=HEADER+'\n\n'+retained.map(e=>e.body).join('\n\n')+raw.slice(footerAt);
 if(compact.length>22000)throw Error('Current CHANGELOG remains too large');
 writeFileSync(path,compact);
}
