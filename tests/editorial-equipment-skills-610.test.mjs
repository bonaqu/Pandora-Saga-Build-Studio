import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const equipment=read('pandora-studio-equipment-ui.js');
const skills=read('pandora-studio-hero-path.js');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-owner-inline-ui.css');
const root={};
root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);

test('equipment empty states and Soul socket hint are safe RU/EN D1 content',()=>{
 for(const key of ['chooseItemEmpty','soulSearchEmpty','soulSearchLimit','socketOverflowHint']){
  assert.ok(equipment.includes("'"+key+"'"),key);
  const dashed=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(root.PandoraHonorGuide.validOverride('book.equipment.'+dashed,
   JSON.stringify({ru:'Тест редактора',en:'Editor test'})),true,dashed);
 }
 assert.doesNotMatch(equipment,/text:'Сначала выбери предмет\.'/);
 assert.doesNotMatch(equipment,/text:'Показано 80 душ\. Уточни поиск\.'/);
 assert.doesNotMatch(equipment,/text:'Совместимых душ не найдено'/);
 assert.match(equipment,/api\.editLabel\?\.\(node,key,ru,en\)/);
 assert.match(equipment,/copy\('socketOverflowHint'/);
 assert.match(equipment,/class:'stage-socket-capacity-hint'/);
 assert.match(equipment,/disabled:occupiedBeyond/);
 assert.match(equipment,/api\.updateSocketCapacity\(n\)/);
});

test('Path skill metadata labels are editable, numeric gameplay values are not',()=>{
 for(const key of ['skillCharacterLevel','skillMana','skillCast','skillCooldown',
  'skillRange','skillElement','skillAttribute','skillRequirementsHeading',
  'pathPointsLoading','pathBranchCapZero','pathPointsUnavailable',
  'pathPointsPreserved','skillCatalogLoading','skillSearchEmpty']){
  assert.ok(skills.includes("'"+key+"'"),key);
  const dashed=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(root.PandoraHonorGuide.validOverride('book.path.'+dashed,
   JSON.stringify({ru:'Подпись',en:'Caption'})),true,dashed);
 }
 assert.match(skills,/const field=\(key,ru,en,value\)=>/);
 assert.match(skills,/stats\.append\(label,make\('dd',\{text:String\(value\)\}\)\)/);
 assert.match(skills,/api\.editLabel\(label,key,ru,en,\{onCommitted:sync\}\)/);
 assert.match(skills,/const before=skillIndex\.get\(String\(skill\.prereq\)\)/);
 assert.match(skills,/M\.branchPotential\(state,key,innate,caps\)/);
 assert.match(skills,/target\.append\(grid\)/);
});

test('inline editing is keyboard-reachable and captures the initial language',()=>{
 assert.match(app,/const editLang=lang;/);
 assert.match(app,/\{\[editLang\]:next\}/);
 assert.match(app,/event\.key==='F2'\|\|event\.key==='Enter'/);
 assert.match(app,/node\.querySelector\?\.\('\.wiki-inline-input'\)/);
 assert.match(app,/!node\.closest\?\.\('button,\[role="button"\]'\)/);
 assert.match(css,/\.stage-copy-caption\.origin-copy-editable::after\{content:none\}/);
 assert.match(css,/\.stage-rich-body \.origin-copy-editable:focus-visible/);
});

test('equipment and Path Undo only refresh copy without remounting user UI',()=>{
 assert.match(app,/function refreshVisibleOwnerCopy\(recordKey\)/);
 assert.match(app,/node\.dataset\.ownerCopySection=section/);
 assert.match(app,/node\.dataset\.ownerCopyId=key/);
 assert.match(app,/refreshVisibleOwnerCopy\(last\.key\);saveView\(\)/);
 assert.match(app,/key\.startsWith\('book\.equipment\.'\)/);
 assert.match(app,/key\.startsWith\('book\.path\.'\)/);
 assert.match(app,/node\.querySelector\('\.wiki-inline-input'\)/);
 assert.match(app,/if\(button\.disabled\)button\.title=hint/);
});
