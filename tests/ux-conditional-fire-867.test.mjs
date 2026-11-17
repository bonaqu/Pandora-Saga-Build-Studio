import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('pandora-studio-app.js');
const equipment=read('pandora-studio-equipment-ui.js');
const items=JSON.parse(read('data/os/items.json'));
const window={};
vm.runInNewContext(read('pandora-studio-conditional-item-bonuses.js'),{window});
const conditional=window.PandoraConditionalItemBonuses;

test('Phoenix Flame is gated by actual fire weapon, gem, grade and eligibility',()=>{
 const record=items[252];
 assert.ok(conditional.parse(record).phoenix,'catalog must contain a real Phoenix proc');
 for(const grade of [0,1,6]){
  assert.equal(conditional.activeFor({record,refinement:grade,gem:{element:'fire'}}),null);
 }
 assert.equal(conditional.activeFor({record,refinement:7,gem:{element:'ice'}}),null);
 assert.equal(conditional.activeFor({record,refinement:7,gem:null}),null);
 assert.equal(conditional.activeFor({record,refinement:7,gem:{element:'fire'},issue:['inactive']}),null);
 assert.ok(conditional.activeFor({record,refinement:7,gem:{element:'fire'},issue:[]}).phoenix);
 assert.ok(conditional.activeFor({record,refinement:10,gem:{element:'fire'}}).phoenix);
 assert.equal(conditional.activeFor({record:items[1652],refinement:7,gem:{element:'fire'}}).phoenix,null,
  'weapon with fire bonuses but no Phoenix proc must never gain one');
});

test('equipment tab and context icons follow one understandable visual language',()=>{
 const css=read('pandora-studio-workbench-guidance.css');
 assert.match(css,/button\[data-stage-tab="choose"\]::before\{content:"⇄"/);
 assert.match(css,/button\[data-stage-tab="souls"\]::before\{content:"○"/);
 assert.match(source,/\['souls','○','Управление душами'/);
 assert.match(source,/\['replace','⇄','Выбрать другую вещь'/);
});

test('equipment rail never adds a mystery Phoenix glyph; Properties keeps condition',()=>{
 assert.doesNotMatch(source,/class:'stage-elemental-proc'/);
 assert.match(source,/stage-enhance',text:'\+'\+level/);
 assert.match(source,/equipped:true,issue/);
 assert.match(source,/issue:record\?equipmentIssue\(record,selectedSlot\):\[\]/);
 assert.match(equipment,/const phoenix=kind==='item'&&context\?\.equipped/);
 assert.match(equipment,/PandoraConditionalItemBonuses\?\.activeFor/);
 assert.match(equipment,/if\(phoenix\)rows\.push/);
 assert.match(equipment,/Особый эффект','Special effect/);
 assert.match(equipment,/Пламя феникса','Phoenix Flame/);
 assert.match(equipment,/if\(phoenix\)fieldNames\.push\(\['specialEffect'/);
 assert.match(equipment,/issue:api\.issue\|\|\[\]/);
});
