// Shared identities for the original-artwork mirror and the cheap preflight.
// These are the SAME canonical source identifiers; no substitutes are made.
import {safeIconStem} from './icon-utils.mjs';
export function catalogIconRows({skills,items,souls}){
 const rows=[];
 for(const entry of Object.values(skills||{}))
  if(entry?.iconId)rows.push({kind:'skills',stem:'skill_'+safeIconStem(entry.iconId)});
 for(const entry of Object.values(items||{}))
  if(entry?.icon)rows.push({kind:'items',stem:safeIconStem(entry.icon)});
 for(const entry of Object.values(souls||{}))
  if(entry?.icon)rows.push({kind:'souls',stem:safeIconStem(entry.icon)});
 return [...new Map(rows.map(row=>[row.kind+'/'+row.stem,row])).values()];
}
