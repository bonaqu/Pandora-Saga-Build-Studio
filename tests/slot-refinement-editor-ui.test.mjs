import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const planContext={};
runInNewContext(source('pandora-studio-equipment-plan.js'),planContext);
const plan=planContext.PandoraEquipmentPlan;

test('Soul slots exist only on supported equipment categories',()=>{
 for(const slot of ['weapon','shield','head','body','gloves','legs','feet','belt']){
  assert.equal(plan.supportsSoulSlot(slot),true,slot);
 }
 for(const slot of ['ring','neck','ear','cloak']){
  assert.equal(plan.supportsSoulSlot(slot),false,slot);
  assert.equal(plan.canSocket(slot,{soulslot:3}),false,slot);
 }
});

test('choice metadata gates Soul slot count by equipment slot type',()=>{
 const app=source('pandora-studio-app.js');
 assert.match(app,/const socketCount=window\.PandoraEquipmentPlan\.supportsSoulSlot\(key\)\?/);
 assert.match(app,/if\(window\.PandoraEquipmentPlan\.supportsSoulSlot\(key\)\)metadata\.push\(/);
 assert.match(app,/bindOwnerInterfaceText\(h\('span',\{\}\),'equipment','pickerItemSlots'/);
 assert.match(app,/h\('span',\{text:' '\+\(socketCount===null\?'—':String\(socketCount\)\)\}\)/);
 assert.match(app,/h\('small',\{\},metadata\)/);
 assert.match(app,/masteryAuto:true/);
 assert.match(app,/copyLabel:equipmentCopy,editLabel:equipmentCopyLabel/);
 assert.match(app,/saveGuidePatch\('book\.'\+ownerCopyKey\(section,key\)/);
});

test('mastery summary keeps source totals following three independent RU/EN labels',()=>{
 const path=source('pandora-studio-hero-path.js');
 for(const [id,ru,en] of [
  ['pathGroupTrained','освоено','trained'],
  ['pathGroupLearned','изучено','learned'],
  ['pathGroupInvested','вложено','invested']
 ])assert.ok(path.includes("['"+id+"','"+ru+"','"+en+"']"),id);
 assert.match(path,/groupValues\[0\]\.textContent=String/);
 assert.match(path,/groupCount\.append\(make\('span',\{text:groupValues\.length\?' · ':''\}\),/);
 assert.match(path,/authored\(api,copyKey,ru,en,'span','path-group-summary-copy'\)/);
 assert.match(path,/guardCaptionAction\(groupButton,caption\)/);
});
test('approved segmented forge bar and compact Soul slots remain accessible',()=>{
 const css=source('pandora-studio-forge-controls.css');
 const ui=source('pandora-studio-equipment-ui.js');
 assert.match(css,/\.stage-rich-body \.stage-grade\{\s*display:grid;grid-template-columns:repeat\(11,minmax\(0,1fr\)\)/);
 assert.match(css,/\.stage-rich-body \.stage-enchant-options\.is-element-options\{\s*display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(ui,/copy\('soulSlotsHeading','Слоты душ','Soul slots'\)/);
 assert.match(ui,/pickerSoulSlotCaption',\s*'Слот','Slot','text',' '\+\(i\+1\)/);
 assert.doesNotMatch(ui,/Гнёзд/);
 for(const path of ['pandora-studio-app.js','pandora-studio-equipment-ui.js','pandora-studio-hero-book.js','pandora-studio-hero-path.js']){
  assert.doesNotThrow(()=>new Script(source(path),{filename:path}),path);
 }
});
