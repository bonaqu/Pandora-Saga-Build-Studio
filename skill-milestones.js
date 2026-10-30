(function(root){
"use strict";
// Displays only actual requirement records supplied by Pandora Saga OS.
// Thresholds exceeding the current class cap are preserved as unreachable, not hidden.
function forBranch(records,branch,cap){
 const groups=new Map(),above=[];
 const max=Number(cap);
 for(const record of records||[]){
  if(!Array.isArray(record.reqs))continue;
  for(const req of record.reqs){
   if(req?.branch!==branch||!Number.isInteger(Number(req.amount))||Number(req.amount)<0)continue;
   const threshold=Number(req.amount);
   if(threshold>max){above.push({id:record.id,threshold,name:record.name});continue}
   if(!groups.has(threshold))groups.set(threshold,[]);
   if(!groups.get(threshold).some(row=>String(row.id)===String(record.id)))groups.get(threshold).push(record);
  }
 }
 const milestones=[...groups].sort((a,b)=>a[0]-b[0]).map(([threshold,skills])=>({
  threshold,skills,percent:max>0?Math.round(threshold/max*1000)/10:0
 }));
 return {milestones,above};
}
root.PandoraSkillMilestones=Object.freeze({forBranch});
})(typeof window==='undefined'?globalThis:window);
