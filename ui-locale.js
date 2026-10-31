(function(root){
'use strict';
const strings={
 character:['✦ Персонаж','✦ Character'],equipment:['◈ Каталог предметов','◈ Items'],
 builds:['▣ Мои билды','▣ My Builds'],wiki:['📜 Вики','📜 Wiki'],
 origin:['Происхождение','Origin'],race:['Раса','Race'],
 profession:['Профессия','Class'],stats:['Характеристики','Stats'],
 appearance:['Образ героя','Hero Appearance'],path:['Путь героя','Hero Path'],
 branchPoints:['Очки ветки','Branch points'],
 exactPoints:['Точно вложено','Allocated'],greenMastery:['Зелёное мастерство','Trained mastery'],
 skillsOnTrack:['Умения на шкале','Skills on track']
};
function text(key,lang='ru'){return strings[key]?.[lang==='en'?1:0]||key}
function apply(lang='ru',doc=typeof document==='undefined'?null:document){
 if(!doc)return;
 doc.documentElement.lang=lang==='en'?'en':'ru';
 for(const node of doc.querySelectorAll('[data-i18n]'))
  node.textContent=text(node.dataset.i18n,lang);
}
root.PandoraUILocale=Object.freeze({text,apply});
})(typeof window==='undefined'?globalThis:window);
