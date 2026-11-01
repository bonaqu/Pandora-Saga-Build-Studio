(function(root){
'use strict';
// A comparison reports saved choices, not a simulated game outcome.
const VITALS=[
 ['guildHp','Гильдия: ОЗ','Guild: HP',0],
 ['guildMp','Гильдия: ОМ','Guild: MP',0],
 ['lifeSign','Знак жизни','Sign of Life',false]
];
const BUFFS=[
 ['guildAll','Гильдия: характеристики','Guild: attributes',0],
 ['guildLifeRecovery','Гильдия: восстановление ОЗ','Guild: HP recovery',0],
 ['guildManaRecovery','Гильдия: восстановление ОМ','Guild: MP recovery',0],
 ['guildHealing','Гильдия: лечение','Guild: healing',0],
 ['guildArouse','Гильдия: пробуждение','Guild: arousal',0],
 ['proelium','Проэлиум','Proelium',false],
 ['proeliumPotency','Мощность Проэлиума','Proelium potency',0],
 ['potionEffectsEnabled','Учитывать эффекты зелий','Include potion effects',false],
 ['combatWarCry','Боевой клич','War Cry',false],
 ['combatRage','Ярость','Rage',false],
 ['combatDefender','Защитная стойка','Defensive stance',false],
 ['combatLunge','Рывок','Lunge',false],
 ['combatWindAssist','Помощь ветра','Wind Assist',false],
 ['combatWindBlessing','Благословение ветра','Wind Blessing',false],
 ['combatConcentration','Сосредоточенность','Concentration',false]
];
const EN_SLOTS=['Weapon','Shield','Helmet','Armor','Gloves','Pants','Boots','Cloak',
 'Ring I','Ring II','Amulet','Belt','Earring I','Earring II'];
function asValue(v,defaultValue){
 return typeof defaultValue==='boolean'?v===true:
  Number.isFinite(v)&&Number.isInteger(v)&&v>=0?v:defaultValue;
}
function gemAt(snap,index,enchant){
 const id=snap?.equipment?.[index]?.id;
 if(id===null||id===undefined)return null;
 return enchant?.normalize?.(snap.gems?.[index+':'+id])||null;
}
function gemName(value,language,enchant){
 if(!value)return '—';
 const t=enchant?.types?.find(x=>x.id===value.type);
 const e=enchant?.elements?.find(x=>x.id===value.element);
 if(!t||!e)return '—';
 const type=language==='en'?(t.id==='physical'?'Physical':'Magical'):t.ru;
 return type+' · '+(language==='en'?e.en:e.ru);
}
function describe(a,b,{lang='ru',slotLabels=[],enchant=null,honorTitles=[]}={}){
 const english=lang==='en',rows=[];
 const lbl=(ru,en)=>english?en:ru;
 const arrow=(name,x,y)=>rows.push(name+': '+x+' → '+y);
 const fmt=v=>typeof v==='boolean'?lbl(v?'вкл':'выкл',v?'on':'off'):String(v);
 if(a?.gender!==b?.gender)arrow(lbl('Пол персонажа','Character gender'),
  a?.gender===1?lbl('мужской','male'):lbl('женский','female'),
  b?.gender===1?lbl('мужской','male'):lbl('женский','female'));
 for(let i=0;i<14;i++){
  const before=gemAt(a,i,enchant),after=gemAt(b,i,enchant);
  if(JSON.stringify(before)===JSON.stringify(after))continue;
  const slot=english?EN_SLOTS[i]:(slotLabels[i]||'Слот '+(i+1));
  arrow(lbl('Самоцвет: ','Gem: ')+slot,
   gemName(before,lang,enchant),gemName(after,lang,enchant));
 }
 for(const [field,ru,en,fallback]of VITALS){
  const before=asValue(a?.vitalsBuffs?.[field],fallback),
   after=asValue(b?.vitalsBuffs?.[field],fallback);
  if(before!==after)arrow(lbl(ru,en),fmt(before),fmt(after));
 }
 for(const [field,ru,en,fallback]of BUFFS){
  const before=asValue(a?.attributeBuffs?.[field],fallback),
   after=asValue(b?.attributeBuffs?.[field],fallback);
  if(before!==after)arrow(lbl(ru,en),fmt(before),fmt(after));
 }
 const titleId=x=>Number.isInteger(x?.attributeBuffs?.honorTitle)?
  x.attributeBuffs.honorTitle:(x?.attributeBuffs?.honorCuriosity===true?1:0);
 const at=titleId(a),bt=titleId(b);
 if(at!==bt){
  const name=id=>honorTitles[id]?.[english?'en':'ru']||String(id);
  arrow(lbl('Титул чести','Honor title'),name(at),name(bt));
 }
 return rows;
}
root.PandoraBuildComparison=Object.freeze({describe});
})(typeof window==='undefined'?globalThis:window);
