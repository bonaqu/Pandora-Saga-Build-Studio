(function(root){
'use strict';
const names={'1H_SWORD':'Одноручный меч','2H_SWORD':'Двуручный меч','1H_AXE':'Одноручный топор','2H_AXE':'Двуручный топор',
'1H_BLUNT_WEAPON':'Одноручное дробящее оружие','2H_BLUNT_WEAPON':'Двуручное дробящее оружие','POLE_ARM':'Древковое оружие',
'LANCE':'Копьё','1H_TRUMP_WEAPON':'Одноручное оружие','2H_TRUMP_WEAPON':'Двуручное оружие','BOW':'Лук','CROSSBOW':'Арбалет',
'WAND':'Жезл','STAFF':'Посох','HELMET':'Шлем','TORSO':'Броня','CUISSES':'Штаны','GLOVES':'Перчатки','BOOTS':'Обувь',
'FOOT_SHIELD':'Щит','HORSE_SHIELD':'Щит','MANTLE':'Плащ','RING':'Кольцо','AMULET':'Амулет','BELT':'Пояс','EARRING':'Серьга',
'BRIDLE':'Уздечка','SADDLE':'Седло','STALL':'Стойло','POTION':'Зелье','TOY':'Игровой предмет','ETC':'Материал',
'RUNEGEM':'Самоцвет','ARROW':'Стрела','BOLT':'Болт','EGGMAKE_KIT':'Набор','MASTER_TALKEGG':'Яйцо','TALKEGG':'Яйцо',
'RECIPE':'Рецепт','BALM':'Бальзам','SOUL':'Душа','DECO_HELMET':'Декоративный шлем','DECO_TORSO':'Декоративная одежда',
'DECO_CUISSES':'Декоративные поножи','DECO_GLOVES':'Декоративные перчатки','DECO_BOOTS':'Декоративная обувь','DECO_MANTLE':'Декоративный плащ'};
const namesEn={'1H_SWORD':'One-handed sword','2H_SWORD':'Two-handed sword',
'1H_AXE':'One-handed axe','2H_AXE':'Two-handed axe',
'1H_BLUNT_WEAPON':'One-handed blunt weapon','2H_BLUNT_WEAPON':'Two-handed blunt weapon',
'POLE_ARM':'Polearm','LANCE':'Lance','1H_TRUMP_WEAPON':'One-handed weapon',
'2H_TRUMP_WEAPON':'Two-handed weapon','BOW':'Bow','CROSSBOW':'Crossbow',
'WAND':'Wand','STAFF':'Staff','HELMET':'Helmet','TORSO':'Armor',
'CUISSES':'Leg armor','GLOVES':'Gloves','BOOTS':'Boots','FOOT_SHIELD':'Shield',
'HORSE_SHIELD':'Shield','MANTLE':'Cloak','RING':'Ring','AMULET':'Amulet',
'BELT':'Belt','EARRING':'Earring','BRIDLE':'Bridle','SADDLE':'Saddle',
'STALL':'Stable','POTION':'Potion','TOY':'Toy','ETC':'Material',
'RUNEGEM':'Gemstone','ARROW':'Arrow','BOLT':'Bolt','EGGMAKE_KIT':'Kit',
'MASTER_TALKEGG':'Egg','TALKEGG':'Egg','RECIPE':'Recipe','BALM':'Balm',
'SOUL':'Soul','DECO_HELMET':'Cosmetic helmet','DECO_TORSO':'Cosmetic armor',
'DECO_CUISSES':'Cosmetic leg armor','DECO_GLOVES':'Cosmetic gloves',
'DECO_BOOTS':'Cosmetic boots','DECO_MANTLE':'Cosmetic cloak'};
const slotsEn={weapon:'Weapon',shield:'Shield',head:'Helmet',body:'Armor',
 gloves:'Gloves',legs:'Leg armor',feet:'Boots',cloak:'Cloak',
 ring:'Ring',neck:'Amulet',belt:'Belt',ear:'Earring',
 arm:'Arms',boots:'Boots',necklace:'Necklace',accessory:'Accessory'};
const slots={weapon:'Оружие',shield:'Щит',head:'Шлем',body:'Броня',gloves:'Перчатки',legs:'Штаны',feet:'Обувь',cloak:'Плащ',ring:'Кольцо',neck:'Амулет',belt:'Пояс',ear:'Серьга',
 arm:'Руки',boots:'Обувь',necklace:'Ожерелье',accessory:'Аксессуар'};
function slotLabel(slot,lang='ru'){return (lang==='en'?slotsEn:slots)[slot]||String(slot||'')}
function kind(record,lang='ru'){
 const source=lang==='en'?namesEn:names;
 const slotSource=lang==='en'?slotsEn:slots;
 const fallback=lang==='en'?'Item':'Предмет';
 return record?(source[String(record.kind||'').toUpperCase()]||slotSource[record.slot]||fallback):fallback;
}
function displayName(record,fallback='Без названия',lang='ru'){
 const first=lang==='en'?'en':'ru',second=first==='en'?'ru':'en';
 const candidate=record?.name?.[first]||record?.names?.[first]||
  record?.name?.[second]||record?.names?.[second]||record?.name;
 const name=typeof candidate==='string'?candidate.trim():'';
 // Historical imported builds may have stored the database ID as the item's name.
 return name&&!/^\d{1,20}$/.test(name)?name:fallback;
}
let defaultItemLookup=null,defaultLanguage=()=> 'ru';
function setReferenceResolver(lookup,language){
 defaultItemLookup=typeof lookup==='function'?lookup:null;
 defaultLanguage=typeof language==='function'?language:()=> 'ru';
}
function formattedDescription(s){
 if(typeof s!=='string')return '';
 // Keep the original source wording, numbers and manually entered paragraphs.
 // OS exports sometimes concatenate lore, bonuses and upgrade conditions.
 const conditions='За кажд(?:ую|ые|ый|ое)|При улучшении|При усовершенствовании|При заточке|При экипировке|При наличии|Закалка самоцветом|Каждое следующее улучшение|Per every|At \\+\\d+ and above|When enhanced|With refinement';
 const stats='ОЗ|ОМ|СИЛ|ВЫН|ЛВК|ПРВ|СД|ИНТ|Атака|Защита|Точность|Уклонение|Сопротивляемость|Вероятность|Шанс|Скорость|Время|Урон|Магическая атака|Получаемый|Эффективность|Снижение|HP|MP|STR|AGI|DEX|STA|VIT|INT|SPI|Accuracy|Attack|Defense|Evasion|Critical|Resistance|Magic|Damage|Speed|Skill Cooldown|Cooldown|Healing|Reduction';
 const hasSourceBreaks=/<br\s*\/?>/i.test(s)||/[\r\n]/.test(s);
 const normalized=s.replace(/\r\n?/g,'\n').replace(/<br\s*\/?>/gi,'\n')
  .replace(/<\/?(?!item\b)[a-z][a-z0-9-]*(?:\s+[^<>]*)?>/gi,'')
  .replace(/[ \t]*\n[ \t]*/g,'\n');
 // A game-authored line break is authoritative: do not inject extra heuristic
 // paragraphs that would change the structure seen in the source description.
 // All authored <br> tags are part of the source, including trailing
 // breaks and three-or-more consecutive breaks. Strip only horizontal
 // padding at the outer edges; trim() would silently delete real newlines.
 if(hasSourceBreaks)return normalized.replace(/^[ \t]+|[ \t]+$/g,'');
 return normalized
  .replace(new RegExp('([.!?]["»]?)[ \\t]*(?=(?:'+stats+')(?:\\s|[+-]|\\d))','gi'),'$1\n\n')
  .replace(new RegExp('([.!?]["»]?)[ \\t]*(?=(?:'+conditions+'))','gi'),'$1\n\n')
  // Missing spaces between two normal sentences are not paragraph breaks.
  .replace(/([.!?])(?=[A-ZА-ЯЁ])/g,'$1 ')
  .replace(/([+-]\d+(?:[.,]\d+)?%?)(?=[A-ZА-ЯЁ]|\+\d+%)/g,'$1\n')
  .replace(/([+-]\d+(?:[.,]\d+)?%)(?=\d+%\s*(?:chance|шанс))/gi,'$1\n')
  .replace(new RegExp('\\n('+conditions+')','gi'),'\n\n$1')
  .replace(/(Пламя феникса)(?=Пламя феникса:)/gi,'$1\n\n')
  .replace(/(:)[ \t]*(?=[A-ZА-ЯЁ])/g,'$1\n')
  .replace(/\n{3,}/g,'\n\n').replace(/[ \t]+\n/g,'\n').trim();
}

// Description references are game data, never raw HTML. Resolve only records
// that actually exist in the chosen catalog; unresolved IDs stay non-clickable.
function descriptionSegments(source, lookupItem, lang='ru'){
 const formatted=formattedDescription(source),segments=[];
 const reference=/<item\b([^>]*)>/gi;
 let offset=0,match;
 while((match=reference.exec(formatted))){
  if(match.index>offset)segments.push({type:'text',text:formatted.slice(offset,match.index)});
  const id=/^\s*(\d{1,12})\s*\/?\s*$/.exec(match[1])?.[1]||null;
  const record=id&&typeof lookupItem==='function'?lookupItem(id):null;
  const found=typeof record==='string'?record:record?.name;
  const exists=typeof found==='string'&&Boolean(found.trim());
  segments.push({type:'item',id,text:exists?found.trim():
   (lang==='en'?'Unknown item':'Неизвестный предмет'),exists});
  offset=reference.lastIndex;
 }
 if(offset<formatted.length)segments.push({type:'text',text:formatted.slice(offset)});
 return segments.length?segments:[{type:'text',text:formatted}];
}
const descriptionText=(source,lookupItem,lang='ru')=>
 descriptionSegments(source,lookupItem,lang).map(piece=>piece.text).join('');
// Plain-text tooltips also resolve references; they must never show raw tags.
const description=source=>descriptionText(source,defaultItemLookup,defaultLanguage());

// Convert visible item names back to source tokens only when an administrator
// edits the description. Ambiguous names are never silently bound to an ID.
function restoreReferences(edited,source,lookupItem,lang='ru'){
 let result=String(edited);
 // No visual text changed: keep every original authored <br>, <b> and
 // <item N> reference verbatim. Searching visible item names otherwise
 // falsely rejects even an unchanged description with repeated links.
 if(result===descriptionText(source,lookupItem,lang))return String(source);
 const references=descriptionSegments(source,lookupItem,lang)
  .filter(part=>part.type==='item'&&part.exists);
 const word=char=>/[\p{L}\p{N}_]/u.test(char||'');
 const wholeMatches=(text,name)=>{
  const positions=[];
  let offset=0,at;
  while((at=text.indexOf(name,offset))!==-1){
   // Only replace a whole visible item name. A substring of a longer
   // edited word must not silently turn into a different game item link.
   const before=Array.from(text.slice(0,at)).at(-1);
   const after=Array.from(text.slice(at+name.length))[0];
   if(!word(before)&&!word(after))positions.push(at);
   offset=at+name.length;
  }
  return positions;
 };
 const replacements=[];
 for(const reference of references){
  const matches=wholeMatches(result,reference.text);
  if(matches.length>1)throw Error('Название «'+reference.text+
   '» встречается несколько раз. Уточни текст перед сохранением ссылки.');
  if(matches.length===1)
   replacements.push({start:matches[0],end:matches[0]+reference.text.length,
    reference});
 }
 // Calculate against the untouched edited string, not strings that already
 // contain <item N> tokens from an earlier replacement.
 replacements.sort((a,b)=>a.start-b.start);
 for(let i=1;i<replacements.length;i++)
  if(replacements[i].start<replacements[i-1].end)
   throw Error('Ссылки на предметы пересекаются. Уточни названия перед сохранением.');
 for(const match of replacements.reverse())
  result=result.slice(0,match.start)+'<item '+match.reference.id+'>'+
   result.slice(match.end);
 return result;
}
root.PandoraItemPresentation=Object.freeze({kind,slotLabel,description,descriptionSegments,descriptionText,restoreReferences,setReferenceResolver,displayName,
 kindOptions:(lang='ru')=>Object.entries(lang==='en'?namesEn:names).map(([value,label])=>({value,label}))});
})(typeof window==='undefined'?globalThis:window);
