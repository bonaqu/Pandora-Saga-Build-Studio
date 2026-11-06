#!/usr/bin/env node
// Display-only artwork aliases approved by the owner. This is NOT a claim that
// the missing original OS texture exists or is byte-identical to its donor.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const RANKED_FAMILIES=new Set([
 'магистр магии','магистр битвы','магистр исцеления','магистр чести',
 'магическая устойчивость','физическая устойчивость',
 'опыт гильдии','честь гильдии','мощь гильдии',
 'восстановление духа','восстановление силы','дух гильдии','сила гильдии'
]);
export const normalizeSkillName=name=>String(name||'').normalize('NFKC')
 .trim().toLocaleLowerCase('ru').replace(/\s+/g,' ');
export function rankFamily(name){
 const full=normalizeSkillName(name);
 const ranked=full.match(/^(.*?)\s+(?:[ivxlcdm]+|[0-9]+)$/iu);
 return ranked&&RANKED_FAMILIES.has(ranked[1])?ranked[1]:full;
}
function selectDonor(rows){
 return [...(rows||[])].sort((a,b)=>{
  const preferred=x=>x.learnable===true&&
   Object.values(x.classes||{}).some(v=>v===1||v===true)?0:1;
  return preferred(a)-preferred(b)||Number(a.id)-Number(b.id);
 })[0]||null;
}
export function buildSkillDisplayAliases(skills,icons,missing){
 const source=Object.values(skills||{}), original=icons||{};
 const exact=new Map(),families=new Map();
 for(const row of source){
  if(!row?.iconId||!row?.name||!original['skill_'+row.iconId])continue;
  const key=normalizeSkillName(row.name),family=rankFamily(row.name);
  if(!exact.has(key))exact.set(key,[]);
  exact.get(key).push(row);
  if(!families.has(family))families.set(family,[]);
  families.get(family).push(row);
 }
 const byStem=new Map(source.filter(row=>row?.iconId)
  .map(row=>['skill_'+row.iconId,row]));
 const aliases={};
 for(const entry of (missing||[]).filter(row=>row.kind==='skills')
  .sort((a,b)=>a.stem.localeCompare(b.stem,'en'))){
  const skill=byStem.get(entry.stem);
  if(!skill?.name||original[entry.stem])continue;
  // Exact names take priority. Only the explicit owner-approved families
  // may share art across numbered/roman-numbered ranks.
  const donor=selectDonor(exact.get(normalizeSkillName(skill.name)))||
   selectDonor(families.get(rankFamily(skill.name)));
  const stem=donor?'skill_'+donor.iconId:null;
  if(stem&&stem!==entry.stem&&original[stem])aliases[entry.stem]=stem;
 }
 return aliases;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const path=new URL('../assets/os-icon-manifest.json',import.meta.url);
 const [skills,manifest]=await Promise.all([
  readFile(new URL('../data/os/skills.json',import.meta.url),'utf8').then(JSON.parse),
  readFile(path,'utf8').then(JSON.parse)
 ]);
 const expected=buildSkillDisplayAliases(skills,manifest.icons?.skills,manifest.missing);
 const actual=manifest.displayAliases?.skills||{};
 const groups={sameName:0,rankFamily:0};
 const byStem=new Map(Object.values(skills).map(row=>['skill_'+row.iconId,row]));
 for(const [target,donor] of Object.entries(expected)){
  if(normalizeSkillName(byStem.get(target)?.name)===
     normalizeSkillName(byStem.get(donor)?.name))groups.sameName++;
  else groups.rankFamily++;
 }
 if(process.argv.includes('--write')){
  manifest.displayAliases={skills:expected};
  await writeFile(path,JSON.stringify(manifest,null,2)+'\n');
 }else if(JSON.stringify(actual)!==JSON.stringify(expected)){
  console.error('Display artwork aliases are stale. Run: node scripts/skill-icon-display-aliases.mjs --write');
  process.exitCode=1;
 }
 console.log(JSON.stringify({displayAliases:Object.keys(expected).length,
  ...groups,unknown:(manifest.missing||[]).filter(x=>x.kind==='skills').length-
   Object.keys(expected).length,verifiedOriginals:Object.keys(manifest.icons?.skills||{}).length},
  null,2));
}
