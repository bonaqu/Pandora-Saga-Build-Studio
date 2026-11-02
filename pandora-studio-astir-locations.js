(function(root){
'use strict';
// The four Astir districts and the three independent nations are different
// places. Original OS trade map IDs 1002001/1003001/1004001 name NATIONS
// and belong to NPCs IN those nations. Never repurpose those IDs as districts.
const countries=Object.freeze([
 Object.freeze({id:'1002001',ru:'Союз северных племен Ванриг',en:'Varik Confederation'}),
 Object.freeze({id:'1004001',ru:'Лотарская империя',en:'Latugan Empire'}),
 Object.freeze({id:'1003001',ru:'Королевство Сэнт-Фальстайн',en:'Kingdom of St. Pfelstein'})
]);
const districts=Object.freeze([
 Object.freeze({id:'1001004',ru:'Центральная площадь',en:'Central Plaza'}),
 Object.freeze({id:'astir-union',ru:'Территория Союза',en:'Union District',
  route:Object.freeze({roads:Object.freeze(['2001001','2002001']),countryId:'1002001'})}),
 Object.freeze({id:'astir-empire',ru:'Территория Империи',en:'Empire District',
  route:Object.freeze({roads:Object.freeze(['2001003','2004001']),countryId:'1004001'})}),
 Object.freeze({id:'astir-kingdom',ru:'Территория Королевства',en:'Kingdom District',
  route:Object.freeze({roads:Object.freeze(['2001002','2003001']),countryId:'1003001'})})
]);
const countryById=new Map(countries.map(country=>[country.id,country]));
const districtById=new Map(districts.map(district=>[district.id,district]));
const countryIds=Object.freeze(countries.map(country=>country.id));
const districtIds=Object.freeze(districts.map(district=>district.id));
const district=id=>districtById.get(String(id))||null;
const country=id=>countryById.get(String(id))||null;
const route=id=>district(id)?.route||null;
const localized=(id,language='ru')=>{
 const place=district(id);
 if(place)return (language==='en'?place.en:place.ru)+' · Astir'.replace('Astir',
  language==='en'?'Astir':'Астир');
 const nation=country(id);
 if(nation)return language==='en'?nation.en:nation.ru;
 return null;
};
const searchAliases=id=>{
 const place=district(id);
 if(place)return [place.ru,place.en,'Астир','Astir','город Астир'].join(' ');
 const nation=country(id);
 if(nation)return [nation.ru,nation.en].join(' ');
 return '';
};
// The catalog is a read-only projection. No invented server map IDs or NPC
// residency are written to D1, trade records or the monster spawn dataset.
const mapsFrom=(tradeMaps={},worldMaps={})=>{
 const result={...(tradeMaps||{}),...(worldMaps||{})};
 for(const item of countries)result[item.id]={...(result[item.id]||{}),
  name:item.ru,placeType:'nation'};
 for(const item of districts)result[item.id]={...(result[item.id]||{}),
  name:item.ru,placeType:'astir-district',virtual:item.id!=='1001004'};
 return result;
};
root.PandoraAstirLocations=Object.freeze({
 countries,districts,countryIds,districtIds,country,district,route,
 localized,searchAliases,mapsFrom
});
})(typeof window==='undefined'?globalThis:window);
