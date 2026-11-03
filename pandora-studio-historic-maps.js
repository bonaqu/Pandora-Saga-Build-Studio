(function(root){
'use strict';
// Confirmed Pandora Saga locations planned for a forthcoming OS content update.
// Listed monster names/levels come from the owner's game knowledge; a missing
// current catalog ID is a missing cross-reference, not a nonexistent monster.
// Keep future content distinct from the current OS simulation dataset.
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
  name:'Эль Ведд',nameEn:'El Beht',virtual:true,
  placeType:'pvp-zone',releaseStage:'future',
  desc:'',descEn:'',
  source:'player-confirmed future Pandora Saga content',
  mobs:elBeht.filter(x=>x.monsterId!=null).map(x=>x.monsterId),
  reportedSpawns:elBeht
 }),
 'astir-underground':Object.freeze({
  name:'Подземные руины Астира',nameEn:'Underground of Astir',
  virtual:true,placeType:'pvp-zone',releaseStage:'future',
  desc:'',descEn:'',
  source:'player-confirmed future Pandora Saga content',
  mobs:[]
 })
});
const clone=()=>Object.fromEntries(Object.entries(sources).map(([id,rec])=>
 [id,{...rec,mobs:[...rec.mobs],
  ...(rec.reportedSpawns?{reportedSpawns:rec.reportedSpawns.map(x=>({...x}))}:{})}]));
root.PandoraHistoricalMaps=Object.freeze({records:clone,elBeht:Object.freeze(elBeht)});
})(typeof window==='undefined'?globalThis:window);
