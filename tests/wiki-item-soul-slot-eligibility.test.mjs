import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),host={};
runInNewContext(read('pandora-studio-equipment-plan.js'),host);
const plan=host.PandoraEquipmentPlan;
const start=app.indexOf('    const itemFields=[');
const end=app.indexOf('    ];',start);
assert.ok(start>=0&&end>start,'Actual item detail fields must be present');
const expression=app.slice(start+'    const itemFields='.length,end+'    ];'.length);
const itemFields=Function('window','rec','lang','wt',
 'return '+expression)(
 {PandoraEquipmentPlan:plan,PandoraItemPresentation:{kind:()=> 'Item'}},
 {slot:'body',soulslot:0,level:1},'ru',(ru)=>ru
);
assert.ok(itemFields.some(row=>row[2]==='soulslot'));
function fields(slot,soulslot=0,lang='ru'){
 const render=Function('window','rec','lang','wt','return '+expression);
 const rec={slot,soulslot,kind:'RING',level:1};
 return render({PandoraEquipmentPlan:plan,
  PandoraItemPresentation:{kind:()=>lang==='en'?'Item':'Предмет'}},
  rec,lang,(ru,en)=>lang==='en'?en:ru);
}
test('encyclopedia omits imaginary socket fields on cloak, earrings, rings and amulets',()=>{
 for(const slot of ['cloak','ear','ring','neck']){
  for(const language of ['ru','en']){
   const x=fields(slot,0,language);
   assert.equal(x.some(row=>row[2]==='soulslot'),false,slot+' '+language);
   const addOptions=x.filter(([,value,key])=>value==null&&key!=='kind');
   assert.equal(addOptions.some(row=>row[2]==='soulslot'),false,
    'Owner must not offer inapplicable socket field for '+slot);
  }
 }
});
test('supported gear keeps genuine Soul slot counts including explicit zero',()=>{
 for(const slot of ['weapon','shield','head','body','gloves','legs','feet','belt']){
  assert.equal(fields(slot,0).find(row=>row[2]==='soulslot')?.[1],0,slot);
  assert.equal(fields(slot,2,'en').find(row=>row[2]==='soulslot')?.[1],2,slot);
 }
});
test('equipment picker and Encyclopedia share one category eligibility source',()=>{
 assert.match(app,/PandoraEquipmentPlan\.supportsSoulSlot\(rec\.slot\)/);
 const ui=read('pandora-studio-equipment-ui.js');
 assert.match(ui,/PandoraEquipmentPlan\?\.supportsSoulSlot\?\.\(context\?\.slot\|\|record\.slot\)/);
});
