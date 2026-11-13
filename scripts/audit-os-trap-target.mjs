#!/usr/bin/env node
// Read-only source fixture for eventual current-build trap damage. No UI.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const nonnegative=n=>Number.isSafeInteger(n)&&n>=0;
export function inspectTrapTarget({skills,monsters,classes,calculator,insights}={}){
 const root=skills?.['240005001'],blast=skills?.['240005003'];
 const job=classes?.DISTURBANCE,target=monsters?.['22104'];
 if(root?.id!==240005001||root.learnable!==true||
  root.classes?.DISTURBANCE!==1||
  root.reqs?.length!==1||root.reqs[0]?.branch!=='trap'||
  root.reqs[0]?.amount!==41||root.mana!==33||
  job?.id!=='DISTURBANCE'||!nonnegative(job.branchCaps?.trap)||
  job.branchCaps.trap<41||
  typeof insights?.inspect!=='function'||!calculator)return null;
 // Reuse the exact current Wiki source proof: root, projectile, blast and
 // item cost. A change to any link or effect invalidates this snapshot.
 const proof=insights.inspect({skillCatalog:skills,classes,
  id:240005001,calculator});
 if(proof?.pathKind!=='trap'||proof.finalAmount!==null||
  JSON.stringify(proof.paths)!=='[[240005001,240005002,240005003]]'||
  !proof.extra?.some(x=>x.type==='trap'&&x.count===2&&x.itemId===65007)||
  blast?.id!==240005003||blast.element!=='FIRE'||
  blast.damage?.kernel!=='element')return null;
 const fn=blast.funcs?.[0];
 if(blast.funcs?.length!==1||fn?.ep!=='EP_ELEMENT_DAMAGE'||
  fn.dir!=='TARGET'||JSON.stringify(fn.fv1)!=='[680,0,350,155]'||
  JSON.stringify(fn.fv2)!=='[0,0,0,0]')return null;
 if(target?.id!==22104||typeof target.name!=='string'||!target.name||
  !nonnegative(target.level)||target.level===0||
  !nonnegative(target.life)||target.life===0||
  !nonnegative(target.ac)||!nonnegative(target.magicProtection)||
  !nonnegative(target.warding)||!target.resists||
  !Number.isFinite(target.resists.fire)||
  !Number.isFinite(target.resists.magic))return null;
 // These source fields never give a target-damage formula or round order.
 return {
  skill:{id:root.id,name:root.name,job:job.id,jobName:job.name,
   requiredTrapMastery:41,classTrapCap:job.branchCaps.trap,baseMana:root.mana,
   consumedItemId:65007,consumedCount:2,
   stages:[240005001,240005002,240005003],
   sourcePowerStat:blast.powerStat,element:blast.element,
   effect:fn.ep,sourceVector:[...fn.fv1]},
  target:{id:target.id,name:target.name,level:target.level,hp:target.life,
   defense:target.ac,magicDefense:target.magicProtection,
   warding:target.warding,fireResistance:target.resists.fire,
   magicResistance:target.resists.magic},
  finalDamage:null,verifiedFinalDamage:false,
  missingStages:['elemental damage kernel','current hero attack, gear and buffs',
   'target damage reduction and resistance order','hit and integer rounding']
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const host={};
 Function('window',read('pandora-os-character-calculator.js'))(host);
 Function('window',read('pandora-studio-wiki-skill-insights.js'))(host);
 const proof=inspectTrapTarget({
  skills:JSON.parse(read('data/os/skills.json')),
  monsters:JSON.parse(read('data/os/monsters.json')),
  classes:JSON.parse(read('data/os/classes.json')),
  calculator:host.PandoraOSCalculator,insights:host.PandoraWikiSkillInsights
 });
 if(!proof)throw Error('The game source no longer matches the checked proof');
 process.stdout.write(JSON.stringify(proof,null,2)+'\n');
}
