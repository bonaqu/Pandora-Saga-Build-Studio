(function(root){
'use strict';
const names={'1H_SWORD':'Одноручный меч','2H_SWORD':'Двуручный меч','1H_AXE':'Одноручный топор','2H_AXE':'Двуручный топор',
'1H_BLUNT_WEAPON':'Одноручное дробящее оружие','2H_BLUNT_WEAPON':'Двуручное дробящее оружие','POLE_ARM':'Древковое оружие',
'LANCE':'Копьё','1H_TRUMP_WEAPON':'Одноручное оружие','2H_TRUMP_WEAPON':'Двуручное оружие','BOW':'Лук','CROSSBOW':'Арбалет',
'WAND':'Жезл','STAFF':'Посох','HELMET':'Шлем','TORSO':'Нагрудник','CUISSES':'Поножи','GLOVES':'Перчатки','BOOTS':'Обувь',
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
 ring:'Ring',neck:'Amulet',belt:'Belt',ear:'Earring'};
const slots={weapon:'Оружие',shield:'Щит',head:'Шлем',body:'Нагрудник',gloves:'Перчатки',legs:'Поножи',feet:'Обувь',cloak:'Плащ',ring:'Кольцо',neck:'Амулет',belt:'Пояс',ear:'Серьга'};
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
function description(s){
 if(typeof s!=='string')return '';
 return s.replace(/\r\n?/g,'\n').replace(/<br\s*\/?>/gi,'\n')
 .replace(/([.!?])\s*(?=[А-ЯЁ])/g,'$1\n')
 .replace(/([+-]\d+(?:[.,]\d+)?%?)(?=[А-ЯЁ])/g,'$1\n')
 .replace(/([^\n])(За кажд(?:ую|ые)(?: \d+)?|При улучшении|При заточке|При экипировке|При наличии)/gi,'$1\n$2')
 .replace(/(:)\s*(?=[А-ЯЁ])/g,'$1\n')
 .replace(/\n{3,}/g,'\n\n').replace(/[ \t]+\n/g,'\n').trim();
}
root.PandoraItemPresentation=Object.freeze({kind,description,displayName});
})(typeof window==='undefined'?globalThis:window);
