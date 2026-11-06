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
 assert.match(app,/const meta=window\.PandoraEquipmentPlan\.supportsSoulSlot\(key\)\?/);
 assert.match(app,/levelText\+\(lang==='en'\?' · Slots: ':' · Слоты: '\)/);
 assert.match(app,/masteryAuto:true/);
 assert.match(app,/copyLabel:equipmentCopy,editLabel:equipmentCopyLabel/);
 assert.match(app,/saveGuidePatch\('book\.equipment\.'\+key/);
});

test('mastery group summary puts label before value in both locales',()=>{
 const path=source('pandora-studio-hero-path.js');
 assert.match(path,/tr\(api,'освоено ','trained '\)\+mastered/);
 assert.match(path,/tr\(api,' · изучено ',' · learned '\)\+learned/);
 assert.match(path,/tr\(api,' · вложено ',' · invested '\)\+spent/);
});

test('refinement controls and elements wrap, while Souls use accessible slot labels',()=>{
 const css=source('pandora-studio-theme.css');
 const ui=source('pandora-studio-equipment-ui.js');
 assert.match(css,/\.stage-rich-body \.stage-grade\{\s*display:flex;flex-wrap:wrap/);
 assert.match(css,/\.stage-rich-body \.stage-enchant-options\.is-element-options\{\s*display:flex;flex-wrap:wrap/);
 assert.match(ui,/copy\('soulSlotsHeading','Слоты душ','Soul slots'\)/);
 assert.match(ui,/tr\('Слот ','Slot '\)\+\(i\+1\)/);
 assert.doesNotMatch(ui,/Гнёзд/);
 for(const path of ['pandora-studio-app.js','pandora-studio-equipment-ui.js','pandora-studio-hero-book.js','pandora-studio-hero-path.js']){
  assert.doesNotThrow(()=>new Script(source(path),{filename:path}),path);
 }
});
