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
// Classification is derived only from explicit game item names/descriptions.
 // Adding future elemental collections does not require editing tab labels.
 const elementalRoots=Object.freeze([
 ['fire',/огненн|огне(вой|вая|вое|вые)|flame|fiery|\bfire\b/i],
 ['ice',/ледян|ледов|льдян|морозн|ice|frost/i],
 ['dark',/\bтьм[ыае]\b|темн[а-я]*|dark|shadow/i],
 ['light',/светл[а-я]*|сияющ[а-я]*|holy|light/i],
 ['lightning',/молни[а-я]*|грозов[а-я]*|lightning|thunder/i],
 ['poison',/ядовит[а-я]*|ядов[а-я]*|poison/i]
 ]);
 const elementOf=item=>{
  if(!item||item.slot!=='weapon')return null;
  const name=String(item.name||'');
  for(const [element,re] of elementalRoots)
   if(re.test(name))return element;
  return null;
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
  parse,phoenixExplanation,elementOf,activeFor
 });
})(typeof window==='undefined'?globalThis:window);
