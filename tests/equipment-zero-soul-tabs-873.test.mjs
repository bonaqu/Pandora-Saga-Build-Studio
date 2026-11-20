import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('all eight Soul-compatible equipment slots have grammatical RU/EN zero states',()=>{
 const window={};
 vm.runInNewContext(read('pandora-studio-equipment-ui.js'),{
  window,document:{addEventListener(){}}
 });
 const msg=window.PandoraStageItemUI.soulUnavailableCopy;
 const slots={
  weapon:['этого оружия','weapon'],shield:['этого щита','shield'],
  head:['этого шлема','helmet'],body:['этой брони','armor'],
  gloves:['этих перчаток','gloves'],legs:['этих штанов','pants'],
  feet:['этой обуви','boots'],belt:['этого пояса','belt']
 };
 for(const [slot,[ru,en]] of Object.entries(slots)){
  assert.equal(msg(slot,0,false),'Управление душами '+ru+
   ' недоступно: 0 слотов для душ.');
  assert.equal(msg(slot,0,true),'Soul management for this '+en+
   ' is unavailable: 0 Soul slots.');
  assert.match(msg(slot,null,false),/неизвестно/);
  assert.match(msg(slot,null,true),/unknown/);
  assert.doesNotMatch(msg(slot,null,true),/0 Soul slots/);
 }
});
test('Soul-compatible tab stays visible at zero capacity while insertion remains gated',()=>{
 const ui=read('pandora-studio-equipment-ui.js'),
  app=read('pandora-studio-app.js'),
  plan=read('pandora-studio-equipment-plan.js');
 assert.match(plan,/SOUL_SLOTS=Object\.freeze\(new Set\(\['weapon','shield','head','body','gloves','legs','feet','belt'\]\)\)/);
 assert.match(ui,/const hasSouls=plan\.supportsSoulSlot\(slot\)/);
 assert.match(ui,/if\(hasSouls\)sections\.push/);
 assert.match(ui,/if\(!plan\.canSocket\(slot,record,cap\)\)/);
 assert.match(ui,/data-soul-unavailable/);
 assert.match(ui,/row\.append\(editable\(notice,key,ru,en\)\)/);
 assert.match(ui,/if\(api\.canEdit\)\{/);
 assert.doesNotMatch(ui,/stage-soul-unavailable-pencil/,
  'The unavailable notice is directly editable without an extra caption button');
 assert.match(app,/!record\|\|!window\.PandoraEquipmentPlan\.supportsSoulSlot\(key\)/);
 assert.match(app,/mode==='souls'&&\(!record\|\|!plan\.supportsSoulSlot\(key\)\)/);
 assert.match(app,/if\(!plan\.canSocket\(key,record,count\)\|\|count===null/);
});

test('zero capacity keeps the Soul explanation instead of redirecting',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('updateSocketCapacity:n=>{'),end=app.indexOf('openSocket:i=>',start);
 assert.ok(start>0&&end>start);
 const code=app.slice(start,end);
 assert.match(code,/if\(positions\.slice\(n\)\.some\(Boolean\)\)return/);
 assert.doesNotMatch(code,/stageSlotView='details'/);
 assert.match(code,/persist\(\);renderSlotRails\(\);renderStagePicker\(\)/);
});
