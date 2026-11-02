(function(root){
"use strict";
// Displays only actual requirement records supplied by Pandora Saga OS.
// Thresholds exceeding the current class cap are preserved as unreachable, not hidden.
function forBranch(records,branch,cap){
 const groups=new Map(),above=[],aboveSeen=new Set();
 const rawMax=Number(cap),max=Number.isSafeInteger(rawMax)&&rawMax>=0?rawMax:0;
 for(const record of records||[]){
  if(!record||record.id===undefined||record.id===null||!Array.isArray(record.reqs))continue;
  for(const req of record.reqs){
   const amount=req?.amount;
   if(req?.branch!==branch||typeof req.branch!=='string'||!req.branch.trim()||
    (typeof amount!=='number'&&typeof amount!=='string')||
    (typeof amount==='string'&&!/^\+?\d+(?:\.0+)?$/.test(amount.trim()))||
    !Number.isSafeInteger(Number(amount))||Number(amount)<=0)continue;
   const threshold=Number(amount);
   if(threshold>max){
    const key=String(record.id)+':'+threshold;
    if(!aboveSeen.has(key)){aboveSeen.add(key);above.push({id:record.id,threshold,name:record.name})}
    continue;
   }
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
