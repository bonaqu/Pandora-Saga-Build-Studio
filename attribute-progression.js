(function(root){
'use strict';
// Sourced from Remaked js/bonus.js BPt[level][0] and js/status_point.js SPt[nextAbsoluteStat][0].
// Never confuse attribute points with the game's skill-point pool.
const codes=["vit","str","agi","dex","spi","int"],perLevel=[0,0,6,6,6,6,6,6,6,6,8,8,8,8,8,8,8,8,8,8,10,10,10,10,10,10,10,10,10,10,12,12,12,12,12,12,12,12,12,12,14,14,14,14,14,14,14,14,14,14,16,8,8,8,8,8],prices=[0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2];
function budget(lv){if(!Number.isInteger(lv)||lv<1||lv>55)return null;let p=0;for(let k=2;k<=lv;k++)p+=perLevel[k];return p}
function base(tables,race,klass){
 const r=tables?.raceInit?.[race],j=tables?.jobInit?.[klass];
 if(!r||!j)return null;
 const v=codes.map(k=>Number(r[k])+Number(j[k]));
 return v.every(Number.isInteger)?v:null;
}
function cost(start,added){
 if(!Number.isInteger(start)||start<0||!Number.isInteger(added)||added<0)return null;
 let n=0;for(let k=start+1;k<=start+added;k++){if(!Number.isInteger(prices[k]))return null;n+=prices[k]}
 return n;
}
function snapshot({tables,race,klass,level,added,caps}={}){
 const b=base(tables,race,klass),total=budget(level);
 if(!b||total===null||!Array.isArray(added)||added.length!==6||
    !added.every(v=>Number.isInteger(v)&&v>=0))return null;
 const itemCosts=b.map((n,i)=>cost(n,added[i]));
 if(itemCosts.includes(null))return null;
 const max=codes.map(k=>Number.isInteger(caps?.[k])?Math.min(99,caps[k]):99);
 const spent=itemCosts.reduce((p,n)=>p+n,0);
 return {base:b,added,values:b.map((n,i)=>n+added[i]),max,itemCosts,total,spent,remaining:total-spent,overBudget:spent>total};
}
function nextCost(s,i){return s&&s.values[i]<s.max[i]?prices[s.values[i]+1]??null:null}
function allowed(s,i,added){
 if(!s||!Number.isInteger(i)||i<0||i>=6||!Number.isInteger(added)||added<0)return false;
 if(added<=s.added[i])return true;
 if(s.base[i]+added>s.max[i])return false;
 const next=cost(s.base[i],added);
 return next!==null&&s.spent-s.itemCosts[i]+next<=s.total;
}
root.PandoraAttributeProgression=Object.freeze({codes,perLevel,prices,budget,base,cost,snapshot,nextCost,allowed});
})(typeof window==='undefined'?globalThis:window);
