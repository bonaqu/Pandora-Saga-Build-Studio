(function(root){
'use strict';
const ID=/^[a-f0-9]{32}$/;
function updatedSaved({activeId,builds,state,now=Date.now()}={}){
 if(!ID.test(activeId||'')||!Array.isArray(builds)||
  !state||typeof state!=='object'||Array.isArray(state))return null;
 const index=builds.findIndex(x=>x?.id===activeId);
 if(index<0)return null; // Never auto-create a saved build from an ordinary draft.
 const previous=builds[index];
 if(JSON.stringify(previous.data)===JSON.stringify(state))return null;
 const at=Math.max(Number(now)||0,(Number(previous.at)||0)+1);
 const entry={id:previous.id,name:String(state.name||previous.name||'Билд').slice(0,70),
  data:structuredClone(state),at};
 const next=builds.slice();next.splice(index,1);next.unshift(entry);
 return {builds:next,entry};
}
root.PandoraSavedBuildAutosave=Object.freeze({updatedSaved});
})(typeof window==='undefined'?globalThis:window);
