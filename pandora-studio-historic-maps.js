(function(root){
'use strict';
// Historical encyclopedia maps: NOT part of the present OS D1 game-map feed.
// Verified links use existing monster IDs; unmatched descriptions stay
// documented instead of creating fake monster records or a wrong-level alias.
const elBeht=[
 [41,'Кровавый ящер',21231],
 [42,'Нетопырь-демон',95093],
 [43,'Анаконда',11208],
 [44,'Чёрная вдова',13433],
 [45,'Кровавый налётчик',95095],
 [46,'Королевская кобра',11207],
 [47,'Кровавый ящер-солдат',null],
 [47,'Кровавый ящер-воин',null],
 [48,'Ящер-копейщик',21205],
 [48,'Ящер-шаман',21207],
 [49,'Ящер-мечник',21208],
 [50,'Крылатый демон',95094],
 [51,'Ящер-старейшина',21209],
 [52,'Кровавый пращник',21233],
 [53,'Ящер-рыцарь',21204],
 [56,'Ящер-жрец',72015],
 [57,'Ящер-пращник',21203],
 [58,'Ящер-оракул',72016],
 [59,'Ящер-охотник',21210],
 [60,'Ящер-рыцарь',null],
 [65,'Ящер-вожак',21282,'anywhere'],
 [55,'Ящер-стражник',93001,'boss-guard']
].map(([level,name,monsterId,spawn],i)=>Object.freeze({
 id:'spawn-'+i,level,name,monsterId,spawn:spawn||null
}));
const sources=Object.freeze({
 'el-beht':Object.freeze({
  name:'Эль Ведд',nameEn:'El Beht',virtual:true,historic:true,
  placeType:'historical-pvp',serverAvailable:false,
  desc:'Историческая PvP-локация, не представленная в актуальной карте OS. Здесь сражались игроки разных наций, а также обитали монстры с добычей и опытом.',
  descEn:'A historical PvP area not currently available on the OS map. Players of opposing nations fought here alongside experience- and loot-dropping monsters.',
  source:'player-curated + Japanese historical wiki',
  mobs:elBeht.filter(x=>x.monsterId!=null).map(x=>x.monsterId),
  reportedSpawns:elBeht
 }),
 'astir-underground':Object.freeze({
  name:'Подземные руины Астира',nameEn:'Underground of Astir',
  virtual:true,historic:true,placeType:'historical-pvp',
  serverAvailable:false,
  desc:'Историческая PvP-локация Pandora Saga. Сражения игроков из противоборствующих наций могли приносить очки чести. Набор монстров актуального сервера не подтверждён.',
  descEn:'Historical Pandora Saga PvP location. Battles against players from rival nations could award Honor. A current-server monster roster is not verified.',
  source:'player-curated + historical English PvP wiki',
  mobs:[]
 })
});
const clone=()=>Object.fromEntries(Object.entries(sources).map(([id,rec])=>
 [id,{...rec,mobs:[...rec.mobs],
  ...(rec.reportedSpawns?{reportedSpawns:rec.reportedSpawns.map(x=>({...x}))}:{})}]));
root.PandoraHistoricalMaps=Object.freeze({records:clone,elBeht:Object.freeze(elBeht)});
})(typeof window==='undefined'?globalThis:window);
