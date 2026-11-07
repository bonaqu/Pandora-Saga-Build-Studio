(function(root){
'use strict';
// Presentation-only classification. These are catalog evidence levels, NOT
// claims about which internal game effects currently run on the server.
const names={
 player:{ru:'Умения персонажа',en:'Character skills'},
 guild:{ru:'Гильдия и осада',en:'Guild and siege'},
 special:{ru:'Особые умения',en:'Special skills'},
 variants:{ru:'Варианты навыков',en:'Skill variants'},
 other:{ru:'Прочие записи',en:'Other records'},
 unknown:{ru:'С иконкой «?»',en:'With “?” icon'},
 all:{ru:'Все навыки',en:'All skills'}
};
const normalize=name=>String(name||'').normalize('NFKC').trim()
 .toLocaleLowerCase('ru').replace(/\s+/g,' ');
const assigned=skill=>Object.values(skill?.classes||{})
 .some(value=>value===1||value===true);
const player=skill=>skill?.learnable===true&&assigned(skill)&&
 skill.branch!=='special'&&skill.branch!=='race';
const guildOrSiege=skill=>skill?.branch==='special'&&
 /^(?:600|610|620)[0-9]{6}$/.test(String(skill.id||''));
function build(records={},index=null,manifest=null,overrides={}){
 const all=Object.entries(records),playableNames=new Set();
 const original=manifest?.icons?.skills||{},aliases=manifest?.displayAliases?.skills||{};
 const donorNames=new Set();
 for(const [,skill] of all){
  if(player(skill))playableNames.add(normalize(skill.name));
  const stem='skill_'+skill?.iconId;
  if(skill?.name&&original[stem])donorNames.add(normalize(skill.name));
 }
 const groups=new Map(),missing=new Set();
 for(const [id,skill] of all){
  const name=normalize(skill?.name),stem='skill_'+skill?.iconId;
  let group='other';
  if(guildOrSiege(skill))group='guild';
  else if(player(skill))group='player';
  // Every secondary version of a confirmed character skill belongs in
  // Variants, even if a legacy record has learnable=true but no classes.
  // Skill IDs are never discarded or merged in the source catalog.
  else if((index&&index.canonical('skill',id)!==String(id))||
   (name&&playableNames.has(name)))group='variants';
  // The legacy "race" branch also contains status effects and system
  // entries (Sleep, Stun, etc.). These are not learnable race passives.
  else if(assigned(skill))group='special';
  groups.set(String(id),group);
  const override=overrides['visual.skill.'+id];
  const source=aliases[stem];
  if(manifest?.icons&&!override&&!original[stem]&&
   !(source&&original[source])&&!donorNames.has(name))missing.add(String(id));
 }
 const counts=Object.fromEntries(Object.keys(names).map(key=>[key,
  key==='unknown'?missing.size:key==='all'?all.length:
   [...groups.values()].filter(v=>v===key).length]));
 return Object.freeze({
  group:id=>groups.get(String(id))||'other',
  missing:id=>missing.has(String(id)),
  matches:(id,filter)=>filter==='all'||(filter==='unknown'?
   missing.has(String(id)):groups.get(String(id))===filter),
  counts,
  total:all.length
 });
}
root.PandoraWikiSkillFilters=Object.freeze({build,names,normalize,assigned,player,guildOrSiege});
})(typeof window==='undefined'?globalThis:window);
