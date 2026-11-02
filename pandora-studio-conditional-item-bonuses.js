(function(root){
'use strict';
// A presentation-only projection of the CURRENT game catalog item descriptions.
// Do not add these conditional effects to base EP effects or game calculations:
// the OS source represents them as enchant-level rules, not unconditional stats.
const parse=(item)=>{
 if(!item||item.slot!=='weapon'||!item.desc)return null;
 const desc=String(item.desc);
 if(!/Закалка самоцветом огня[\s\S]{0,70}\+7/i.test(desc))return null;
 const enchant=desc.match(/Закалка самоцветом огня[^:]*\+7[^:]*:/i);
 if(!enchant)return null;
 const tail=desc.slice(enchant.index+enchant[0].length);
 const strip=tail.split(/Пламя феникса\s*:/i)[0];
 const phoenixChance=strip.match(/\+(\d+(?:[.,]\d+)?)%\s*шанс призвать\s*Пламя феникса/i);
 const burnChance=strip.match(/\+(\d+(?:[.,]\d+)?)%\s*шанс наложить\s*Ожог/i);
 const fireMagic=strip.match(/Магическая атака огнем\s*\+(\d+(?:[.,]\d+)?)%/i);
 const addStats=[...strip.matchAll(/(СД|СИЛ|ВЫН|ПРВ|ЛВК|ИНТ|ОЗ|ОМ)\s*\+(\d+(?:[.,]\d+)?)/gi)].map(m=>({
  name:m[1].toUpperCase(),value:Number(m[2].replace(',','.')),unit:'ед.'
 }));
 const fireResist=strip.match(/Сопротивляемость магии огня\s*\+(\d+(?:[.,]\d+)?)/i);
 const phoenixDetail=desc.match(/Пламя феникса\s*:\s*(\d+)\s*урона\s*\+\s*(\d+)%\s*от\s*(СИЛ|ИНТ)[^\d]{0,40}1\s*раза\s*в\s*(\d+)\s*секунд\./i);
 const phoenixGrowth=desc.match(/Каждое следующее улучшение\s*\+(\d+)\s*и\s*(\d+)%\s*от\s*(СИЛ|ИНТ)\s*и сокращает откат на\s*(\d+)\s*секунд/i);
 const phoenix=phoenixChance&&phoenixDetail?{
  chance:Number(phoenixChance[1].replace(',','.')),
  damage:Number(phoenixDetail[1]),scale:Number(phoenixDetail[2]),
  stat:phoenixDetail[3],cooldown:Number(phoenixDetail[4]),
  growth:phoenixGrowth?{damage:Number(phoenixGrowth[1]),
   scale:Number(phoenixGrowth[2]),stat:phoenixGrowth[3],
   cooldown:Number(phoenixGrowth[4])}:null
 }:null;
 const rows=[];
 if(burnChance)rows.push({name:'Шанс наложить ожог',value:Number(burnChance[1].replace(',','.')),unit:'%'});
 if(fireMagic)rows.push({name:'Магическая атака огнём',value:Number(fireMagic[1].replace(',','.')),unit:'%'});
 if(fireResist)rows.push({name:'Сопротивляемость магии огня',value:Number(fireResist[1].replace(',','.')),unit:'ед.'});
 for(const stat of addStats)rows.push(stat);
 // The original description may contain effects beyond this conservative list;
 // they remain intact and visible below. Never hallucinate unsupported procs.
 return{condition:'Закалка самоцветом огня от +7, за каждый уровень улучшения',
  rows,phoenix};
};
const phoenixExplanation=(p)=>{
 if(!p)return'';
 const start=`Пламя феникса: ${p.damage} урона + ${p.scale}% от ${p.stat}; не чаще одного раза в ${p.cooldown} секунд.`;
 return start+(p.growth?
  ` Каждое следующее улучшение добавляет ${p.growth.damage} урона и ${p.growth.scale}% от ${p.growth.stat}, сокращая откат на ${p.growth.cooldown} секунду.`:'');
};
// A weapon's elemental name or ordinary gemstone compatibility DOES NOT
 // prove it belongs to the NPC/event/shop elemental collection. In particular,
 // the regular Ice Sword and Frost Wand are monster drops, not collection gear.
 // The current OS snapshot identifies this fire series by a shared original
 // forging description AND its level-7 fire-enhancement bonus. Other series
 // require verified origin metadata; names alone never qualify.
 const elementalKinds=Object.freeze(['fire','ice','lightning','poison','light','dark']);
 const elementOf=item=>{
  if(!item||item.slot!=='weapon')return null;
  if(elementalKinds.includes(item.elementalWeapon)&&
   item.elementalOriginVerified===true)return item.elementalWeapon;
  const desc=String(item.desc||'');
  if(/рожд[её]нн?[а-я]* в очистительном пламени/i.test(desc)&&
   /Закалка самоцветом огня[\s\S]{0,70}\+7/i.test(desc))return 'fire';
  return null;
 };
 // Catalog Phoenix numbers are BASE values at +7. Subsequent upgrades add
 // explicitly described flat damage/stat scaling and shorten the cooldown.
 // No target resistance or undocumented damage rounding is assumed.
 const phoenixDamage=(p,refinement,stats={})=>{
  if(!p||!Number.isInteger(Number(refinement))||refinement<7)return null;
  const key=p.stat==='СИЛ'?'str':p.stat==='ИНТ'?'int':null;
  const attribute=key==null?NaN:Number(stats?.[key]);
  if(!Number.isFinite(attribute)||attribute<0)return null;
  const upgrades=Math.max(0,Number(refinement)-7),growth=p.growth||null;
  const flat=p.damage+upgrades*(growth?.damage||0);
  const scale=p.scale+upgrades*(growth?.scale||0);
  const cooldown=Math.max(0,p.cooldown-upgrades*(growth?.cooldown||0));
  const chance=p.chance*(upgrades+1);
  return {flat,scale,attribute,stat:p.stat,damage:flat+attribute*scale/100,
   chance,cooldown,refinement:Number(refinement)};
 };
 // The enchantment is active only if the actual slotted weapon is usable,
 // refined to +7 or above and explicitly fire-enchanted.
 const activeFor=({record,refinement=0,gem=null,issue=[]}={})=>{
  if(!record||record.slot!=='weapon'||Array.isArray(issue)&&issue.length||
   !Number.isInteger(Number(refinement))||Number(refinement)<7||
   gem?.element!=='fire')return null;
  return parse(record);
 };
 root.PandoraConditionalItemBonuses=Object.freeze({
  parse,phoenixExplanation,elementOf,activeFor,phoenixDamage
 });
})(typeof window==='undefined'?globalThis:window);
