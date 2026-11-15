(function(root){
'use strict';
// Owner-controlled planner progression, independent of synchronized game JSON.
// Stored only as one CAS-protected D1 override. Level 1 grants 0/0 points.
// Limits prevent accidental giant writes and do not claim game-server parity.
const KEY='planner.progression.v1',MIN_LEVEL=55,CEILING=120,MAX_GRANT=500;
const legacy=[0,0,6,6,6,6,6,6,6,6,8,8,8,8,8,8,8,8,8,8,
 10,10,10,10,10,10,10,10,10,10,12,12,12,12,12,12,12,12,12,12,
 14,14,14,14,14,14,14,14,14,14,16,8,8,8,8,8];
const copy=o=>({version:1,maxLevel:o.maxLevel,
 attributes:[...o.attributes],skills:[...o.skills]});
function defaults(){
 return {version:1,maxLevel:55,attributes:[...legacy],
  skills:Array.from({length:56},(_,i)=>i<2?0:i<=10?1:i<=20?2:3)};
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||
  Object.keys(value).sort().join(',')!=='attributes,maxLevel,skills,version'||
  value.version!==1||!Number.isInteger(value.maxLevel)||
  value.maxLevel<MIN_LEVEL||value.maxLevel>CEILING)
  return {ok:false,error:'Максимальный уровень должен быть от 55 до 120.'};
 for(const field of ['attributes','skills']){
  const a=value[field];
  if(!Array.isArray(a)||a.length!==value.maxLevel+1||
    a[0]!==0||a[1]!==0||
    !a.every(v=>Number.isSafeInteger(v)&&v>=0&&v<=MAX_GRANT))
   return {ok:false,error:'Проверь все прибавки очков от 1-го до '+value.maxLevel+'-го уровня (целые числа 0–500).'};
  if(a.reduce((sum,n)=>sum+n,0)>30000)
   return {ok:false,error:'Общая сумма очков слишком велика.'};
 }
 return {ok:true,value:copy(value)};
}
let current=defaults(),raw=null;
function configure(next){
 if(next===null||next===undefined||next===''){
  current=defaults();raw=null;return {ok:true,default:true};
 }
 let parsed=next;
 if(typeof parsed==='string'){try{parsed=JSON.parse(next)}catch{return {ok:false,error:'Таблица прокачки D1 повреждена.'}}}
 const result=validate(parsed);
 if(result.ok){current=result.value;raw=JSON.stringify(current)}
 return result;
}
function maxLevel(){return current.maxLevel}
function isDefault(){return JSON.stringify(current)===JSON.stringify(defaults())}
function grant(field,level){
 return Number.isInteger(level)&&level>=1&&level<=maxLevel()?
  current[field]?.[level]??null:null;
}
function total(field,level){
 if(!Number.isInteger(level)||level<1||level>maxLevel())return null;
 let result=0;for(let i=1;i<=level;i++)result+=current[field][i];
 return result;
}
function resize(source,nextMax){
 const validation=validate(source);
 if(!validation.ok||!Number.isInteger(nextMax)||nextMax<MIN_LEVEL||nextMax>CEILING)
  return null;
 const result=copy(validation.value);
 for(const field of ['attributes','skills']){
  // New levels start explicitly at zero: never invent game patch gains.
  result[field].length=nextMax+1;
  for(let i=0;i<=nextMax;i++)if(result[field][i]===undefined)result[field][i]=0;
 }
 result.maxLevel=nextMax;return result;
}
function rows(source=current){
 const validated=validate(source);
 if(!validated.ok)return [];
 let a=0,b=0;
 return Array.from({length:source.maxLevel},(_,i)=>{
  const level=i+1,attributes=source.attributes[level],skills=source.skills[level];
  a+=attributes;b+=skills;return {level,attributes,skills,totalAttributes:a,totalSkills:b};
 });
}
function get(){return copy(current)}
function storedRaw(){return raw}
root.PandoraLevelProgression=Object.freeze({
 KEY,MIN_LEVEL,CEILING,MAX_GRANT,defaults,validate,configure,get,
 storedRaw,maxLevel,isDefault,grant,total,resize,rows
});
})(typeof window==='undefined'?globalThis:window);
