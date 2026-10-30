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
const slots={weapon:'Оружие',shield:'Щит',head:'Шлем',body:'Нагрудник',gloves:'Перчатки',legs:'Поножи',feet:'Обувь',cloak:'Плащ',ring:'Кольцо',neck:'Амулет',belt:'Пояс',ear:'Серьга'};
function kind(record){return record?(names[String(record.kind||'').toUpperCase()]||slots[record.slot]||'Предмет'):'Предмет'}
function description(s){
 if(typeof s!=='string')return '';
 return s.replace(/\r\n?/g,'\n').replace(/<br\s*\/?>/gi,'\n')
 .replace(/([.!?])\s*(?=[А-ЯЁ])/g,'$1\n')
 .replace(/([+-]\d+(?:[.,]\d+)?%?)(?=[А-ЯЁ])/g,'$1\n')
 .replace(/([^\n])(За кажд(?:ую|ые)(?: \d+)?|При улучшении|При заточке|При экипировке|При наличии)/gi,'$1\n$2')
 .replace(/(:)\s*(?=[А-ЯЁ])/g,'$1\n')
 .replace(/\n{3,}/g,'\n\n').replace(/[ \t]+\n/g,'\n').trim();
}
root.PandoraItemPresentation=Object.freeze({kind,description});
})(typeof window==='undefined'?globalThis:window);
