(function(root){
'use strict';
// Geographic model: three nation trade IDs are not the three Astir districts.
// The public OS /gamedata/trades.json contains trade NPCs, not the full list
// of town NPCs. City NPCs below are sourced from the historical game wiki
// (last edited 2012-02-05); they are NOT claimed to be live OS NPC spawns.
// https://wikiwiki.jp/pandoras/中立領アスティア
const countries=Object.freeze([
 {id:'1002001',ru:'Союз северных племен Ванриг',en:'Varik Confederation'},
 {id:'1004001',ru:'Лотарская империя',en:'Latugan Empire'},
 {id:'1003001',ru:'Королевство Сэнт-Фальстайн',en:'Kingdom of St. Pfelstein'}
].map(Object.freeze));
const districts=Object.freeze([
 {id:'1001004',ru:'Центральная площадь',en:'Central Plaza'},
 {id:'astir-union',ru:'Территория Союза',en:'Union District'},
 {id:'astir-empire',ru:'Территория Империи',en:'Empire District'},
 {id:'astir-kingdom',ru:'Территория Королевства',en:'Kingdom District'}
].map(Object.freeze));
const nationById=new Map(countries.map(row=>[row.id,row]));
const districtById=new Map(districts.map(row=>[row.id,row]));
const countryIds=Object.freeze(countries.map(row=>row.id));
const districtIds=Object.freeze(districts.map(row=>row.id));
const district=id=>districtById.get(String(id))||null;
const country=id=>nationById.get(String(id))||null;
const localized=(id,language='ru')=>{
 const place=district(id);
 if(place)return (language==='en'?place.en:place.ru)+
  (language==='en'?' · Astir':' · Астир');
 const nation=country(id);
 return nation?(language==='en'?nation.en:nation.ru):null;
};
const searchAliases=id=>{
 const place=district(id);
 if(place)return [place.ru,place.en,'Астир','Astir','город Астир'].join(' ');
 const nation=country(id);
 return nation?[nation.ru,nation.en].join(' '):'';
};
const mapsFrom=(tradeMaps={},worldMaps={})=>{
 const result={...(tradeMaps||{}),...(worldMaps||{})};
 for(const item of countries)result[item.id]={...(result[item.id]||{}),
  name:item.ru,placeType:'nation'};
 for(const item of districts)result[item.id]={...(result[item.id]||{}),
  name:item.ru,placeType:'astir-district',virtual:item.id!=='1001004'};
 return result;
};
// name, map grid, function. Historical game-data wiki, NOT current live OS.
// Non-server IDs distinguish these NPCs from trade NPCs / D1 edit keys.
const historic=Object.freeze({
 'astir-union':[
  ['olson','Олсон','I-4','Сюжетный персонаж'],
  ['ronia','Рония','I-5','Гадалка'],
  ['caruna','Каруна','F-7','Персонаж заданий'],
  ['fania','Фания','H-7','Персонаж заданий'],
  ['penelope','Пенелопа','I-4','Персонаж заданий'],
  ['gharb','Гарб','H-5','Оружейник'],
  ['scono','Сконо','H-5','Бронник'],
  ['roon','Лун','H-6','Торговец предметами'],
  ['slant','Слант','I-5','Обмен экипировки'],
  ['warehouse','Кладовщик','I-5','Склад'],
  ['inn','Тани','I-5','Трактир']
 ],
 'astir-empire':[
  ['barnes','Барнс','C-12','Сюжетный персонаж'],
  ['sarah','Сара','D-12','Представитель Империи'],
  ['dorothea','Доротея','E-12','Персонаж заданий'],
  ['alma','Алма','E-11','Оружейник'],
  ['schaeffer','Шеффер','E-11','Бронник'],
  ['flyos','Флайос','E-12','Торговец предметами'],
  ['kite','Кайт','E-11','Обмен зелий'],
  ['mariana','Мариана','D-12','Обмен'],
  ['warehouse','Кладовщик','D-12','Склад'],
  ['inn','Фалас','D-12','Трактир']
 ],
 'astir-kingdom':[
  ['randall','Рэндалл','N-10','Сюжетный персонаж'],
  ['grohn','Грон','L-10','Представитель Королевства'],
  ['cultier','Культье','K-11','Мастер сундуков'],
  ['koome','Кум','M-11','Торговец предметами'],
  ['roo','Ру','L-11','Оружейник'],
  ['palachov','Палачов','L-11','Бронник'],
  ['nazito','Назит','M-11','Обмен самоцветов'],
  ['faneh','Фане','L-10','Трактир'],
  ['hei','Хей','L-10','Трактир'],
  ['warehouse','Кладовщик','M-11','Склад']
 ]
});
const npcRecords=()=>{
 const result={};
 for(const [mapId,people] of Object.entries(historic)){
  for(const [slug,name,grid,service] of people){
   const id='astir-npc-'+mapId.slice(6)+'-'+slug;
   result[id]={id,name,grid,service,desc:service,
    maps:[mapId],virtual:true,source:'historic-astir-wiki'};
  }
 }
 return result;
};
root.PandoraAstirLocations=Object.freeze({
 countries,districts,countryIds,districtIds,country,district,
 localized,searchAliases,mapsFrom,npcRecords,
 historicSource:'https://wikiwiki.jp/pandoras/中立領アスティア'
});
})(typeof window==='undefined'?globalThis:window);
