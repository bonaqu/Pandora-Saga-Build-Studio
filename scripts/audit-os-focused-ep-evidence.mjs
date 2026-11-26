#!/usr/bin/env node
// #476: source-only evidence for mixed-shape skill effect families.
// This audit does not calculate hit chance, damage, target modifiers or parity.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditOsEffectFamilies} from './audit-os-effect-families.mjs';

export const FOCUSED_EP_FAMILIES=Object.freeze([
 'EP_ONHIT_DAMAGE_SCALE','EP_TOGGLE','EP_TOHIT_CONST'
]);
const slots=vector=>vector.flatMap((n,i)=>n!==0?[i]:[]).join(',')||'-';
const signature=effect=>[
 effect.dir??'UNSPECIFIED',
 'fv1='+slots(effect.fv1),
 'fv2='+slots(effect.fv2)
].join(';');
const signs=values=>values.map(n=>n<0?'-':n>0?'+':'0').join('');
const numeric=(a,b)=>a-b;

export function auditFocusedEpEvidence(skills,{families=FOCUSED_EP_FAMILIES}={}){
 if(!Array.isArray(families)||families.length===0||
  families.some(ep=>typeof ep!=='string'||!/^EP_[A-Z0-9_]+$/.test(ep))||
  new Set(families).size!==families.length)
  throw Error('Expected distinct EP family names');
 // Existing strict census validates every skill/effect, not only selected rows.
 const baseline=auditOsEffectFamilies(skills);
 const known=new Map(baseline.effectFamilies.map(item=>[item.ep,item]));
 for(const ep of families)if(!known.has(ep))
  throw Error('Unknown source family '+ep);
 const selected=new Set(families);
 const byFamily=new Map(families.map(ep=>[ep,[]]));
 for(const id of Object.keys(skills).sort((a,b)=>Number(a)-Number(b))){
  const skill=skills[id];
  skill.funcs.forEach((effect,index)=>{
   if(!selected.has(effect.ep))return;
   byFamily.get(effect.ep).push({
    skillId:skill.id,
    skillName:String(skill.name||''),
    skillType:skill.skillType??null,
    learnable:skill.learnable===true,
    // Source class keys do not prove that the character meets requirements.
    sourceClassKeys:Object.keys(skill.classes||{}).filter(key=>Boolean(skill.classes[key])).sort(),
    effectIndex:index,dir:effect.dir,
    signature:signature(effect),
    signPattern:'fv1='+signs(effect.fv1)+';fv2='+signs(effect.fv2),
    fv1:[...effect.fv1],fv2:[...effect.fv2],
    damageKernel:skill.damage?.kernel??null,
    siblingEffects:skill.funcs.filter((_,i)=>i!==index).map(e=>e.ep)
   });
  });
 }
 const report=families.map(ep=>{
  const original=known.get(ep),rows=byFamily.get(ep);
  const shapes=original.sourceShapes.map(shape=>{
   const matches=rows.filter(row=>row.signature===shape.signature);
   if(matches.length!==shape.effects)throw Error('Source shape count mismatch '+ep);
   const variants=new Map();
   for(const row of matches){
    if(!variants.has(row.signPattern))variants.set(row.signPattern,{
     signPattern:row.signPattern,effects:0,skillIds:[],sampleSkillId:row.skillId
    });
    const v=variants.get(row.signPattern);
    v.effects++;
    if(!v.skillIds.includes(row.skillId))v.skillIds.push(row.skillId);
   }
   return {
    signature:shape.signature,effects:shape.effects,skillIds:[...shape.skillIds],
    signVariants:[...variants.values()].sort((a,b)=>a.signPattern.localeCompare(b.signPattern,'en')),
    sample:{skillId:matches[0].skillId,skillName:matches[0].skillName,
     effectIndex:matches[0].effectIndex,dir:matches[0].dir,
     fv1:[...matches[0].fv1],fv2:[...matches[0].fv2],
     siblingEffects:[...matches[0].siblingEffects]}
   };
  });
  return {ep,certainty:'source-shape-only',
   effects:rows.length,distinctSkills:new Set(rows.map(row=>row.skillId)).size,
   directions:{...original.directions},
   sourceShapes:shapes,rows};
 });
 return {
  source:'checked-in data/os/skills.json; no network or production D1 operations',
  certainty:'source-shape-only: vector sign/position/skill context do not establish units, hit rolls, stacking, mitigation, or server execution',
  summary:{
   selectedFamilies:report.length,
   effects:report.reduce((n,f)=>n+f.effects,0),
   sourceShapes:report.reduce((n,f)=>n+f.sourceShapes.length,0),
   uniqueSkillIds:[...new Set(report.flatMap(f=>f.rows.map(row=>row.skillId)))].sort(numeric)
  },
  families:report
 };
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.some(arg=>arg!=='--all')||args.filter(arg=>arg==='--all').length>1)
  throw Error('Usage: node scripts/audit-os-focused-ep-evidence.mjs [--all]');
 const skills=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
 const report=auditFocusedEpEvidence(skills);
 if(!args.includes('--all'))
  report.families=report.families.map(({rows,...family})=>family);
 console.log(JSON.stringify(report,null,2));
}
