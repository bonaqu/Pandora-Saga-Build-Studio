(function(root){
'use strict';
// The original OS trade map IDs denote three sovereign nations. Their NPC
// assignments are never projected onto similarly named Astir city districts.
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
const countryById=new Map(countries.map(row=>[row.id,row]));
const districtById=new Map(districts.map(row=>[row.id,row]));
const countryIds=Object.freeze(countries.map(row=>row.id));
const districtIds=Object.freeze(districts.map(row=>row.id));
const country=id=>countryById.get(String(id))||null;
const district=id=>districtById.get(String(id))||null;
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
 for(const item of countries){
  const row=result[item.id]||{};
  result[item.id]={...row,name:row.ownerLabel?row.name:item.ru,placeType:'nation'};
 }
 for(const item of districts){
  const row=result[item.id]||{};
  result[item.id]={...row,name:row.ownerLabel?row.name:item.ru,
   placeType:'astir-district',virtual:item.id!=='1001004'};
 }
 return result;
};
// Only the game's screenshots supplied by the player confirm this town NPC.
// The public OS /gamedata/trades.json covers exchange NPCs, not every town NPC.
// Do not translate, guess or import names from the old JP fan wiki.
const confirmedTownNpcs=Object.freeze([
 Object.freeze({id:'astir-npc-kingdom-claris',name:'Кларис',en:'Claris',
  maps:Object.freeze(['astir-kingdom']),virtual:true,
  service:'Открытие сундуков',source:'game-screenshot'})
]);
const npcRecords=()=>Object.fromEntries(confirmedTownNpcs.map(npc=>[
 npc.id,{...npc,maps:[...npc.maps]}
]));
root.PandoraAstirLocations=Object.freeze({
 countries,districts,countryIds,districtIds,country,district,
 localized,searchAliases,mapsFrom,npcRecords
});
})(typeof window==='undefined'?globalThis:window);
