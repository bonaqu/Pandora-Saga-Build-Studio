(function(root){
'use strict';
// User-facing labels are content, not identifiers. Stable chapter and
// section keys continue to drive navigation, deep links, and D1 relations.
const chapter=Object.freeze({
 item:['Экипировка','Equipment'],
 utility:['Предметы эффектов','Effect items'],
 monster:['Монстры','Monsters'],
 map:['Локации','Locations'],
 honor:['Честь','Honor'],
 npc:['NPC-обмен','NPC trades'],
 chest:['Сундуки','Chests'],
 instance:['Подземелья','Dungeons'],
 skill:['Навыки','Skills'],
 soul:['Души','Souls']
});
const honor=Object.freeze({
 overview:['Система чести','Honor system'],
 gain:['Получение и потеря чести','Earning and losing Honor'],
 ranks:['Ранги и привилегии','Ranks and privileges'],
 monthly:['Ежемесячные звания','Monthly titles']
});
const key=(group,id,lang)=>(group==='chapter'?'chapter_':'honor_')+id+
 (lang==='en'?'_en':'_ru');
const validField=k=>/^(?:chapter_(?:item|utility|monster|map|honor|npc|chest|instance|skill|soul)|honor_(?:overview|gain|ranks|monthly))_(?:ru|en)$/.test(k);
const validPatch=patch=>patch&&typeof patch==='object'&&!Array.isArray(patch)&&
 Object.keys(patch).length>0&&Object.keys(patch).length<=28&&
 Object.entries(patch).every(([k,v])=>validField(k)&&typeof v==='string'&&
 v.trim().length>0&&v.length<=90&&
 Array.from(v).every(ch=>ch.charCodeAt(0)>=32));
const parse=(overrides)=>{
 try{
  const raw=overrides?.['guideedit.wiki.labels'];
  const patch=typeof raw==='string'?JSON.parse(raw):null;
  return validPatch(patch)?patch:{};
 }catch{return {}}
};
function value(overrides,group,id,lang='ru'){
 const defaults=group==='chapter'?chapter:honor;
 if(!Object.hasOwn(defaults,id))return '';
 const saved=parse(overrides)[key(group,id,lang)];
 return saved||defaults[id][lang==='en'?1:0];
}
root.PandoraWikiLabels=Object.freeze({
 chapter,honor,key,value,validField,validPatch
});
})(typeof window==='undefined'?globalThis:window);
