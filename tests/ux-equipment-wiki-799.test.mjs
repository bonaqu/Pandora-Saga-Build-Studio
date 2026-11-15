import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('equipment picker changes adjacent slots without equipping and retains level-only filter',()=>{
 const code=read('pandora-studio-app.js');
 assert.match(code,/function appendStageSlotNavigation\(root\)/);
 assert.match(code,/openStageEquipmentSlot\(next,'choose'\)/);
 assert.match(code,/\(selectedSlot\+direction\+slots\.length\)%slots\.length/);
 assert.match(code,/appendStageSlotNavigation\(root\);/);
 assert.match(code,/stagePickerOnlyAvailable=false/);
 assert.match(code,/records\.filter\(rec=>!stagePickerOnlyAvailable\|\|/);
 assert.match(code,/stagePickerOnlyAvailable=event\.target\.checked;stageSlotShown=48;draw\(\)/);
 assert.match(code,/onlyAvailable\.hidden=!records\.some/);
 assert.match(read('pandora-studio-equipment-tooltip.css'),/\.stage-picker-slot-navigation/);
});

test('opening a wiki chapter list captures the departing article scroll and filters',()=>{
 const code=read('pandora-studio-app.js');
 const body=code.slice(code.indexOf('function openWikiChapterList()'),
  code.indexOf('function wikiBackButton()'));
 assert.match(body,/history\.replaceState\(\{\.\.\.previous,psWikiPosition:wikiPosition\(\)\}/);
 assert.match(body,/history\.pushState\(\{\.\.\.previous,psWikiPosition:null,psWikiEntry:false/);
 assert.match(code,/restoreWikiFilters\(event\.state,match\[1\],match\[2\]\)/);
 assert.match(code,/restoreWikiPosition\(event\.state\)/);
});
