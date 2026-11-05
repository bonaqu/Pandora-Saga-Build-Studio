#!/usr/bin/env node
// Deterministic original-art recovery queue. This inventories missing OS image
// identities; matching a name is only a REVIEW CANDIDATE, not an icon mapping.
import {readFile} from 'node:fs/promises';
const read=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const [manifest,items,skills]=await Promise.all([
 read('assets/os-icon-manifest.json'),read('data/os/items.json'),
 read('data/os/skills.json')
]);
const missing=(manifest.missing||[]).filter(row=>row?.error==='HTTP 404');
const skillRows=Object.values(skills),itemRows=Object.values(items);
const iconNames=new Map();
for(const row of skillRows){
 const key=String(row.name||'').trim().toLocaleLowerCase('ru');
 if(!key)continue;
 if(!iconNames.has(key))iconNames.set(key,[]);
 iconNames.get(key).push(row);
}
const queue=missing.map(row=>{
 const entries=row.kind==='skills'?
  skillRows.filter(skill=>'skill_'+skill.iconId===row.stem):
  row.kind==='items'?itemRows.filter(item=>item.icon===row.stem):[];
 const record=entries[0]||null;
 const iconCandidates=row.kind==='skills'&&record?
  (iconNames.get(String(record.name||'').trim().toLocaleLowerCase('ru'))||[])
   .filter(other=>String(other.iconId)!==String(record.iconId)&&
    Boolean(manifest.icons?.skills?.['skill_'+other.iconId]))
   .map(other=>({id:other.id,iconId:other.iconId,
    path:manifest.icons.skills['skill_'+other.iconId]})).slice(0,8):[];
 return {kind:row.kind,stem:row.stem,
  originalUrl:'https://pandorasaga-os.com/icons/'+
   (row.kind==='souls'?'items':row.kind)+'/'+row.stem+'.webp',
  recordIds:entries.map(item=>item.id),
  names:[...new Set(entries.map(item=>item.name).filter(Boolean))],
  status:'Original OS URL returned 404 when last mirrored',
  candidatesForManualVisualReview:iconCandidates};
});
const report={
 source:'assets/os-icon-manifest.json',
 provenance:'Pandora Saga OS; alternatives require exact-game-image proof',
 count:queue.length,
 byKind:Object.fromEntries(['skills','items','souls'].map(k=>[k,
  queue.filter(row=>row.kind===k).length])),
 withSameNameLocalCandidate:queue.filter(row=>row.candidatesForManualVisualReview.length>0).length,
 automaticSubstitutions:0,
 entries:queue
};
console.log(JSON.stringify(report,null,2));
