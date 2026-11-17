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
 const translated=JSON.parse(read('data/os/strings.en.json')).items[252];
 assert.ok(conditional.parse(record).phoenix,'catalog must contain a real Phoenix proc');
 const localized={...record,name:translated.n,desc:translated.d,sourceDesc:record.desc};
 assert.ok(conditional.parse(localized)?.phoenix,'English translation retains original proc rules');
 assert.ok(conditional.activeFor({record:localized,refinement:7,
  gem:{element:'fire'},issue:[]})?.phoenix,'English mode must keep fire proc active');
 assert.equal(conditional.elementOf(localized),'fire','verified source origin survives translation');
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

test('all item tabs and right-click menu actions reuse a single icon mapping',()=>{
 const css=read('pandora-studio-workbench-guidance.css');
 const uiWindow={};
 vm.runInNewContext(equipment,{window:uiWindow,document:{
   addEventListener(){},
   createElementNS(_ns,tag){return{tag,attributes:{},children:[],
    setAttribute(k,v){this.attributes[k]=v},append(node){this.children.push(node)}}}
  }});
 const icon=uiWindow.PandoraStageItemUI.actionIcon;
 for(const [key,name] of Object.entries({
   choose:'choose',replace:'choose',details:'details',properties:'details',
   souls:'souls',remove:'remove'
  })){
   const svg=icon(key);
   assert.equal(svg.tag,'svg',key);
   assert.equal(svg.attributes['data-gear-icon'],name,key);
   assert.equal(svg.attributes['aria-hidden'],'true');
   assert.ok(svg.children.length>=2,key);
  }
  assert.equal(icon('details',{forward:true}).attributes['data-gear-icon'],'arrow-right');
  assert.equal(icon('unknown'),null);
 assert.match(source,/PandoraStageItemUI\.actionIcon\(id\)/);
 assert.match(source,/PandoraStageItemUI\.actionIcon\('details',\{forward:true\}\)/);
 assert.match(equipment,/const glyph=actionIcon\(key,\{forward:returningToDetails\}\)/);
 assert.match(css,/\.stage-rich-tabs \.stage-tab-symbol/);
  assert.match(css,/\.stage-action-svg\{/);
  assert.doesNotMatch(css,/stage-picker-mode-link::before/);
 assert.doesNotMatch(css,/button\[data-stage-tab="(?:choose|details|souls)"\]::before/);
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
