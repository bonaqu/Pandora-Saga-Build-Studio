(function(root){
'use strict';
// Owner edits are deliberately separate from the upstream game catalog.
// Sync updates only the base snapshot, never these approved owner overrides.
const props=['level','W','PEN','AC','atkspeed','range','soulslot'];
const allowedKinds=new Set('1H_SWORD 2H_SWORD 1H_AXE 2H_AXE 1H_BLUNT_WEAPON 2H_BLUNT_WEAPON POLE_ARM LANCE 1H_TRUMP_WEAPON 2H_TRUMP_WEAPON BOW CROSSBOW WAND STAFF HELMET TORSO CUISSES GLOVES BOOTS FOOT_SHIELD HORSE_SHIELD MANTLE RING AMULET BELT EARRING BRIDLE SADDLE STALL POTION TOY ETC RUNEGEM ARROW BOLT EGGMAKE_KIT MASTER_TALKEGG TALKEGG RECIPE BALM SOUL DECO_HELMET DECO_TORSO DECO_CUISSES DECO_GLOVES DECO_BOOTS DECO_MANTLE'.split(' '));
const effects=[
 ['EP_MAXLIFE_CONST','ОЗ (единицы)'],['EP_MAXMANA_CONST','ОМ (единицы)'],
 ['EP_STRENGTH_CONST','Сила'],['EP_VITARITY_CONST','Выносливость'],
 ['EP_AGILITY_CONST','Проворство'],['EP_DEXTERITY_CONST','Ловкость'],
 ['EP_SPIRITUAL_CONST','Дух'],['EP_INTELIGENCE_CONST','Интеллект'],
 ['EP_ARMORCLASS_CONST','Защита (единицы)'],['EP_TOHIT_CONST','Меткость'],
 ['EP_CRITICALRATE_CONST','Шанс критического удара'],['EP_DAMAGERATE_CONST','Атака (единицы)'],
 ['EP_MAXLIFE_SCALE','ОЗ (%)'],['EP_MAXMANA_SCALE','ОМ (%)'],
 ['EP_FIRE_RESISTANCE_CONST','Сопротивление огню'],
 ['EP_COLD_RESISTANCE_CONST','Сопротивление холоду'],
 ['EP_MAGIC_RESISTANCE_CONST','Сопротивление магии'],
 ['EP_ATTACKINTERVAL_SCALE','Скорость атаки (%)']
];
const extraLabels={
 EP_ABILITY_RESET:'Сброс способностей',EP_ATTACK_BACKATK_RATE:'Атака со спины',
 EP_AURADAMAGE_CONST:'Урон ауры',EP_AVOIDANCE_CONST:'Уклонение',
 EP_BADEFFECT_TIME_SCALE:'Длительность отрицательных эффектов',
 EP_BLOCK_BREAK_RESIST:'Защита от пробития блока',EP_BOW_CARRY:'Переносимый вес для лука',
 EP_BOW_RANGE:'Дальность лука',EP_CASTINGCANCEL_RESISTANCE_CONST:'Устойчивость к прерыванию заклинаний',
 EP_CAST_HEAL_LIFE_SCALE:'Сила лечения',EP_CHARM_RESISTANCE_CONST:'Сопротивление чарам',
 EP_DAMAGERATE_SCALE:'Сила атаки (%)',EP_DARK_RESISTANCE_CONST:'Сопротивление тьме',
 EP_DESTINED_POISON:'Наложение отравления',EP_DESTINE_WARDING:'Защитный показатель',
 EP_ELEMENT_DAMAGE_SCALE:'Урон стихией (%)',EP_EXPERTISE_RESET:'Сброс мастерства',
 EP_HEAL_LIFE:'Восстановление ОЗ',EP_HEAL_LIFE_RATE:'Восстановление ОЗ (%)',
 EP_HEAL_LIFE_REGENERATOR:'Регенерация ОЗ',EP_HEAL_MANA:'Восстановление ОМ',
 EP_HEAL_MANA_RATE:'Восстановление ОМ (%)',
 EP_HOLY_RESISTANCE_CONST:'Сопротивление свету',
 EP_IMMUNE_BURN:'Сопротивляемость ожогам',
 EP_IMMUNE_CURSE:'Невосприимчивость к проклятию',
 EP_IMMUNE_DISEASE:'Невосприимчивость к болезни',
 EP_IMMUNE_EVIL:'Защита от злых чар',
 EP_IMMUNE_KNOCKBACK:'Невосприимчивость к отбрасыванию',
 EP_IMMUNE_NUMB:'Невосприимчивость к онемению',
 EP_IMMUNE_RAVING:'Невосприимчивость к помешательству',
 EP_IMMUNE_SILENCE:'Невосприимчивость к молчанию',
 EP_IMMUNE_SLEEP:'Невосприимчивость ко сну',
 EP_IMMUNE_SPI_TYPE:'Невосприимчивость (дух)',
 EP_IMMUNE_STUN:'Невосприимчивость к оглушению',
 EP_IMMUNE_TUMBLE:'Невосприимчивость к падению',
 EP_IMMUNE_VIT_TYPE:'Невосприимчивость (выносливость)',
 EP_MOVESPEED_SCALE:'Скорость передвижения (%)',
 EP_ONDAMAGE_ELEM_SKILL_EXEC:'Стихийное умение при получении урона',
 EP_ONDAMAGE_FIN_DAMAGE_SCALE:'Получаемый конечный урон (%)',
 EP_ONDAMAGE_SKILL_EXEC:'Умение при получении урона',
 EP_ONDAMAGE_SKILL_EXEC_ATTACKER:'Умение атакующему при получении урона',
 EP_ONHIT_SKILL_EXEC:'Умение при попадании',
 EP_ONHIT_SKILL_EXEC_ATTACKER:'Умение атакующему при попадании',
 EP_ONHIT_STUN:'Оглушение при попадании',
 EP_POISON_RESISTANCE_CONST:'Сопротивление яду',
 EP_RACE_CARRY:'Расовая грузоподъёмность',
 EP_RACE_MANA_COSTCUT:'Расовое снижение затрат ОМ',
 EP_RACE_RANGE:'Расовая дальность',
 EP_RANDOM_BOX:'Открытие случайного сундука',
 EP_RECOVERY_BURN:'Снятие ожога',EP_RECOVERY_CURSE:'Снятие проклятия',
 EP_RECOVERY_DISEASE:'Снятие болезни',EP_RECOVERY_NUMB:'Снятие онемения',
 EP_RECOVERY_POISON:'Снятие отравления',EP_RECOVERY_RAVING:'Снятие помешательства',
 EP_RECOVERY_SILENCE:'Снятие молчания',
 EP_RESTART:'Перезапуск',EP_RESTMAP_MOVESPEED_SCALE:'Скорость передвижения в безопасной зоне (%)',
 EP_SKILL_BENCH:'Время перезарядки умений',EP_SKILL_DELAY:'Время применения умений',
 EP_SKILL_EXEC:'Применение навыка',EP_SKILL_EXEC_BALM:'Применение лечебного средства',
 EP_SKILL_EXEC_MAPIN:'Применение навыка при входе на карту',
 EP_TOHIT_SCALE:'Меткость (%)',EP_VOLUME_EXP:'Получаемый опыт'
};
const wearable=new Set('weapon shield head body gloves legs feet cloak ring neck belt ear'.split(' '));
const nonEquipmentEffects=new Set([
 'EP_ABILITY_RESET','EP_EXPERTISE_RESET','EP_RESTART','EP_RANDOM_BOX',
 'EP_DESTINED_POISON',
 'EP_BOW_CARRY','EP_RACE_CARRY','EP_RACE_RANGE','EP_RACE_MANA_COSTCUT',
 'EP_SKILL_EXEC','EP_SKILL_EXEC_BALM',
 'EP_SKILL_EXEC_MAPIN','EP_RECOVERY_BURN','EP_RECOVERY_CURSE',
 'EP_RECOVERY_DISEASE','EP_RECOVERY_NUMB','EP_RECOVERY_POISON',
 'EP_RECOVERY_RAVING','EP_RECOVERY_SILENCE'
]);
const effectLabels=new Map([...effects,...Object.entries(extraLabels)]);
const englishEffectLabels=Object.freeze({
 EP_MAXLIFE_CONST:"Max HP",
 EP_MAXMANA_CONST:"Max MP",
 EP_STRENGTH_CONST:"Strength",
 EP_VITARITY_CONST:"Vitality",
 EP_AGILITY_CONST:"Agility",
 EP_DEXTERITY_CONST:"Dexterity",
 EP_SPIRITUAL_CONST:"Spirit",
 EP_INTELIGENCE_CONST:"Intelligence",
 EP_ARMORCLASS_CONST:"Defense",
 EP_TOHIT_CONST:"Accuracy",
 EP_CRITICALRATE_CONST:"Critical hit chance",
 EP_DAMAGERATE_CONST:"Attack",
 EP_MAXLIFE_SCALE:"Max HP (%)",
 EP_MAXMANA_SCALE:"Max MP (%)",
 EP_FIRE_RESISTANCE_CONST:"Fire resistance",
 EP_COLD_RESISTANCE_CONST:"Cold resistance",
 EP_MAGIC_RESISTANCE_CONST:"Magic resistance",
 EP_ATTACKINTERVAL_SCALE:"Attack speed (%)",
 EP_ABILITY_RESET:"Reset attributes",
 EP_ATTACK_BACKATK_RATE:"Back attack",
 EP_AURADAMAGE_CONST:"Aura damage",
 EP_AVOIDANCE_CONST:"Evasion",
 EP_BADEFFECT_TIME_SCALE:"Negative effect duration",
 EP_BLOCK_BREAK_RESIST:"Block break resistance",
 EP_BOW_CARRY:"Bow carrying capacity",
 EP_BOW_RANGE:"Bow range",
 EP_CASTINGCANCEL_RESISTANCE_CONST:"Casting interruption resistance",
 EP_CAST_HEAL_LIFE_SCALE:"Healing power",
 EP_CHARM_RESISTANCE_CONST:"Charm resistance",
 EP_DAMAGERATE_SCALE:"Attack power (%)",
 EP_DARK_RESISTANCE_CONST:"Dark resistance",
 EP_DESTINED_POISON:"Applies Poison",
 EP_DESTINE_WARDING:"Physical attack evasion chance (%)",
 EP_ELEMENT_DAMAGE_SCALE:"Elemental damage (%)",
 EP_ELEMENT_DAMAGE_SCALE_FIRE:"Fire magic attack (%)",
 EP_EXPERTISE_RESET:"Reset skill points",
 EP_HEAL_LIFE:"Restore HP",
 EP_HEAL_LIFE_RATE:"Restore HP (%)",
 EP_HEAL_LIFE_REGENERATOR:"Gradual HP change",
 EP_HEAL_MANA:"Restore MP",
 EP_HEAL_MANA_RATE:"Restore MP (%)",
 EP_HOLY_RESISTANCE_CONST:"Holy resistance",
 EP_IMMUNE_BURN:"Burn resistance",
 EP_IMMUNE_CURSE:"Weakness resistance",
 EP_IMMUNE_DISEASE:"Disease resistance",
 EP_IMMUNE_EVIL:"Curse resistance",
 EP_IMMUNE_KNOCKBACK:"Knockback resistance",
 EP_IMMUNE_NUMB:"Freeze resistance",
 EP_IMMUNE_RAVING:"Madness resistance",
 EP_IMMUNE_SILENCE:"Silence resistance",
 EP_IMMUNE_SLEEP:"Sleep resistance",
 EP_IMMUNE_SPI_TYPE:"Spirit-based resistance",
 EP_IMMUNE_STUN:"Stun resistance",
 EP_IMMUNE_TUMBLE:"Knockdown resistance",
 EP_IMMUNE_VIT_TYPE:"Vitality-based resistance",
 EP_MOVESPEED_SCALE:"Movement speed (%)",
 EP_ONDAMAGE_ELEM_SKILL_EXEC:"Elemental skill when hit",
 EP_ONDAMAGE_FIN_DAMAGE_SCALE:"Damage taken (%)",
 EP_ONDAMAGE_SKILL_EXEC:"Skill when hit",
 EP_ONDAMAGE_SKILL_EXEC_ATTACKER:"Skill against attacker when hit",
 EP_ONHIT_SKILL_EXEC:"Skill on hit",
 EP_ONHIT_SKILL_EXEC_ATTACKER:"Skill against attacker on hit",
 EP_ONHIT_STUN:"Stun on hit",
 EP_POISON_RESISTANCE_CONST:"Poison resistance",
 EP_RACE_CARRY:"Racial carrying capacity",
 EP_RACE_MANA_COSTCUT:"Racial MP cost reduction",
 EP_RACE_RANGE:"Racial attack range",
 EP_RANDOM_BOX:"Open random box",
 EP_RECOVERY_BURN:"Remove Burn",
 EP_RECOVERY_CURSE:"Remove Weakness",
 EP_RECOVERY_DISEASE:"Remove Disease",
 EP_RECOVERY_NUMB:"Remove Freeze",
 EP_RECOVERY_POISON:"Remove Poison",
 EP_RECOVERY_RAVING:"Remove Madness",
 EP_RECOVERY_SILENCE:"Remove Silence",
 EP_RESTART:"Return",
 EP_RESTMAP_MOVESPEED_SCALE:"Town movement speed (%)",
 EP_SKILL_BENCH:"Skill cooldown",
 EP_SKILL_DELAY:"Casting speed",
 EP_SKILL_EXEC:"Activates skill",
 EP_SKILL_EXEC_BALM:"Activates consumable skill",
 EP_SKILL_EXEC_MAPIN:"Skill on map entry",
 EP_TOHIT_SCALE:"Accuracy (%)",
 EP_VOLUME_EXP:"Experience gained",
 EP_ONDAMAGE_ELEM_SCALE:"Magic resistance (%)",
 EP_BUFF_TOHIT_SCALE:"Debuff rate",
 EP_BADEFFECT_TIME_CAST_SCALE:"G debuff",
 EP_AURADAMAGE_SCALE:"Aura damage (%)",
 EP_CRITICAL_REGIST:"Critical resistance",
 EP_SKILL_EQUIP_DAMAGERATE:"MaxATK",
 EP_HEAL_TIME_SCALE:"MP recovery speed",
 EP_LIGHTNING_RESISTANCE_CONST:"Lightning resistance",
 EP_SPECIAL_WARDING_TYPE2:"DP damage",
 EP_SKILL_DELAY_FIN:"Casting speed (final)",
 EP_ONDAMAGE_REFLECTION:"Damage reflection",
 EP_ARMORCLASS_SCALE:"Defense (%)",
 EP_MASTERY_POTION:"Potion effectiveness",
 EP_ONDAMAGE_FIN_DAMAGE_CONST:"Physical damage resistance"
});
const skillReferenceEffects=new Set([
 'EP_SKILL_EXEC','EP_SKILL_EXEC_BALM','EP_SKILL_EXEC_MAPIN',
 'EP_ONHIT_SKILL_EXEC','EP_ONHIT_SKILL_EXEC_ATTACKER',
 'EP_ONDAMAGE_SKILL_EXEC','EP_ONDAMAGE_SKILL_EXEC_ATTACKER',
 'EP_ONDAMAGE_ELEM_SKILL_EXEC'
]);
const opaqueEffectNumbers=new Set([
 'EP_DESTINED_POISON','EP_RANDOM_BOX','EP_RESTART',
 'EP_ABILITY_RESET','EP_EXPERTISE_RESET','EP_ONHIT_STUN'
]);
function effectUsesSkillId(func){return skillReferenceEffects.has(func)}
function effectHasDisplayAmount(func){
 return effectLabels.has(func)&&!skillReferenceEffects.has(func)&&
  !opaqueEffectNumbers.has(func)&&!func.startsWith('EP_RECOVERY_');
}

function effectOptions(items,wearableItem=null,lang='ru'){
 const chosen=new Set(effects.map(([code])=>code));
 for(const item of Object.values(items||{}))for(const entry of item?.effects||[])
  if(/^EP_[A-Z0-9_]{2,65}$/.test(entry?.func||''))chosen.add(entry.func);
 // Player equipment has a different effect vocabulary from potions, skill
 // commands, reset scrolls and loot box activations.
 if(wearableItem){
  if(!wearable.has(wearableItem.slot))return [];
  const observed=new Set();
  for(const item of Object.values(items||{}))
   if(wearable.has(item?.slot))
    for(const entry of item?.effects||[])observed.add(entry.func);
  for(const code of chosen){
   if(nonEquipmentEffects.has(code)||/^EP_RECOVERY_/.test(code)||
    /^EP_SKILL_EXEC(?:_|$)/.test(code)||
    code==='EP_BOW_RANGE'&&!['BOW','CROSSBOW'].includes(wearableItem.kind)||
    !effectLabels.has(code)&&!observed.has(code))chosen.delete(code);
  }
 }
 return [...chosen].map(func=>({
  value:func,label:lang==='en'?(englishEffectLabels[func]||'Effect ('+func+')'):
   effectLabels.get(func)||'Игровой эффект «'+func.replace(/^EP_/,'').toLowerCase().replaceAll('_',' ')+'»'
 })).sort((a,b)=>a.label.localeCompare(b.label,lang==='en'?'en':'ru'));
}
const validId=id=>/^[0-9]{1,15}$/.test(String(id));
const plain=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
function ownPatch(overrides,id){
 if(!validId(id))return {};
 try{
  const patch=JSON.parse(overrides?.['itemedit.'+id]||'{}');
  if(!plain(patch))return {};
  const selected={};
  for(const key of props)if(Object.hasOwn(patch,key)&&
    (patch[key]===null||(Number.isFinite(patch[key])&&patch[key]>=0)))
    selected[key]=patch[key];
  if(typeof patch.name==='string'&&patch.name.trim()&&patch.name.length<=240)
   selected.name=patch.name;
  if(typeof patch.nameEn==='string'&&patch.nameEn.trim()&&patch.nameEn.length<=240)
   selected.nameEn=patch.nameEn;
  if(typeof patch.desc==='string'&&patch.desc.length<=2000)
   selected.desc=patch.desc;
  if(typeof patch.descEn==='string'&&patch.descEn.length<=2000)
   selected.descEn=patch.descEn;
  if(typeof patch.kind==='string'&&allowedKinds.has(patch.kind))selected.kind=patch.kind;
  if(typeof patch.twoHanded==='boolean')selected.twoHanded=patch.twoHanded;
  if(plain(patch.classes))selected.classes=Object.fromEntries(
   Object.entries(patch.classes).filter(([key,value])=>/^[A-Z_]{2,25}$/.test(key)&&value===1));
  if(Array.isArray(patch.effects)&&patch.effects.length<=32)
   selected.effects=patch.effects.filter(effect=>plain(effect)&&
     /^EP_[A-Z0-9_]{2,65}$/.test(effect.func)&&(effect.a===null||Number.isFinite(effect.a))&&
     ['TARGET','CASTER'].includes(effect.dir)).map(effect=>({...effect}));
  if(typeof patch.sourceNote==='string'&&patch.sourceNote.length<=500)
   selected.sourceNote=patch.sourceNote;
  return selected;
 }catch{return {}}
}
function applyItems(items,overrides){
 if(!plain(items))return items;
 let next=items;
 for(const [key,value] of Object.entries(overrides||{})){
  const match=/^(itemedit|item|itemdesc|itemslots)\.([0-9]{1,15})$/.exec(key);
  if(!match||!items[match[2]])continue;
  if(next===items)next={...items};
  const id=match[2],current=next[id]===items[id]?{...items[id]}:next[id];
  next[id]=current;
  if(match[1]==='itemedit')continue;
  if(match[1]==='item'&&typeof value==='string'&&value.trim())current.name=value;
  else if(match[1]==='itemdesc'&&typeof value==='string'&&value.trim())current.desc=value;
  else if(match[1]==='itemslots'&&/^(?:[0-9]|[12][0-9]|3[0-2])$/.test(String(value)))
   current.soulslot=Number(value);
 }
 // Structured editing takes priority over previous inline text overrides,
 // regardless of the order in which Cloudflare returns override keys.
 for(const key of Object.keys(overrides||{})){
  const match=/^itemedit\.([0-9]{1,15})$/.exec(key);
  if(!match||!items[match[1]])continue;
  if(next===items)next={...items};
  const row=next[match[1]]===items[match[1]]?{...items[match[1]]}:next[match[1]];
  Object.assign(row,ownPatch(overrides,match[1]));
  next[match[1]]=row;
 }
 return next;
}
// UI short forms follow the Russian Pandora Saga game client. Keep the
// underlying EP_* identifiers untouched for game math and owner persistence.
const statAbbreviations=Object.freeze({
 EP_STRENGTH_CONST:'СИЛ',EP_VITARITY_CONST:'ВЫН',
 EP_AGILITY_CONST:'ПРВ',EP_DEXTERITY_CONST:'ЛВК',
 EP_SPIRITUAL_CONST:'СД',EP_INTELIGENCE_CONST:'ИНТ',
 EP_MAXLIFE_CONST:'ОЗ',EP_MAXMANA_CONST:'ОМ',
 EP_MAXLIFE_SCALE:'ОЗ (%)',EP_MAXMANA_SCALE:'ОМ (%)'
});
function effectDisplayLabel(func,lang='ru'){
 if(lang==='en')return englishEffectLabels[func]||'Item effect';
 return statAbbreviations[func]||effectLabels.get(func)||'Игровой эффект';
}
root.PandoraStudioItemOwnerEditor=Object.freeze({
 applyItems,ownPatch,effectOptions,effectDisplayLabel,
 effectUsesSkillId,effectHasDisplayAmount
});
})(typeof window==='undefined'?globalThis:window);
