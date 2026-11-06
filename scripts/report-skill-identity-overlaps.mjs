#!/usr/bin/env node
// Diagnostic report only: overlapping classes or names alone cannot establish
// which skill variant is enabled on the current Pandora Saga OS server.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const normalizedName=name=>String(name||'').normalize('NFKC')
 .trim().toLocaleLowerCase('ru').replace(/\s+/g,' ');
export const assignedClasses=row=>Object.entries(row?.classes||{})
 .filter(([,value])=>value===1||value===true).map(([name])=>name).sort();
export const candidatePlayer=row=>row?.learnable===true&&
 !['special','race'].includes(row.branch)&&assignedClasses(row).length>0;

export function skillIdentityAudit(data={}){
 const rows=Object.values(data),groups=new Map(),invokedBy=new Map();
 for(const row of rows){
  if(candidatePlayer(row)){
   const name=normalizedName(row.name);
   if(!groups.has(name))groups.set(name,[]);
   groups.get(name).push(row);
  }
  for(const f of row.funcs||[]){
   if(f?.ep!=='EP_SKILL_EXEC'||!Array.isArray(f.fv1))continue;
   const target=Number(f.fv1[3]);
   if(!Number.isSafeInteger(target))continue;
   if(!invokedBy.has(target))invokedBy.set(target,[]);
   invokedBy.get(target).push({id:row.id,name:row.name});
  }
 }
 const duplicates=[];
 for(const [name,records] of groups){
  if(records.length<2)continue;
  const overlap=[];
  for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){
   const first=assignedClasses(records[i]),second=new Set(assignedClasses(records[j]));
   const classes=first.filter(key=>second.has(key));
   if(classes.length)overlap.push({skillA:records[i].id,skillB:records[j].id,
    sharedClasses:classes});
  }
  duplicates.push({
   name,
   candidates:records.map(row=>({
    id:row.id,branch:row.branch,skillType:row.skillType,iconId:row.iconId,
    level:row.charLevel,mana:row.mana,classes:assignedClasses(row),
    calledBy:invokedBy.get(Number(row.id))||[]
   })),
   overlappingClasses:overlap,
   needsLiveVerification:true
  });
 }
 duplicates.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 const secondary=[...Object.values(data)].filter(row=>
  row?.learnable===true&&!assignedClasses(row).length).map(row=>({
   id:row.id,name:row.name,branch:row.branch,calledBy:invokedBy.get(Number(row.id))||[]
  }));
 return {
  source:'data/os/skills.json',
  certainty:'catalog metadata, not observed active skills in game',
  summary:{
   allSkillRecords:rows.length,
   eligiblePlayerRows:rows.filter(candidatePlayer).length,
   repeatedPlayerNames:duplicates.length,
   eligibleRowsInRepeatedNames:duplicates.reduce((n,row)=>n+row.candidates.length,0),
   groupsWithOverlappingClassAssignments:duplicates.filter(row=>row.overlappingClasses.length).length,
   learnableButClassless:secondary.length
  },
  ambiguousNames:duplicates,
  learnableButClassless:secondary
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const records=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
 console.log(JSON.stringify(skillIdentityAudit(records),null,2));
}
