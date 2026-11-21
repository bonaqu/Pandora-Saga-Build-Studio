import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),itemUI=read('pandora-studio-equipment-ui.js');
const guideRoot={};
vm.runInNewContext(read('pandora-studio-honor-guide.js'),{window:guideRoot});
const guide=guideRoot.PandoraHonorGuide;
const copy=[
 ['equipment',[
  ['pickerChoosePrefix','Выбор:','Choose:'],['pickerDetails','Свойства →','Details →'],
  ['pickerClose','Закрыть выбор','Close item picker'],
  ['pickerSearchPlaceholder','Поиск по названию','Search by name'],
  ['pickerSearchAria','Поиск предмета для','Search equipment for'],
  ['pickerUnequip','Снять предмет','Unequip item'],
  ['pickerOutfitNote','Платье занимает броню и штаны. Выбор штанов снимет его.',
   'Armor and pants are occupied by one outfit. Choosing pants removes it.'],
  ['pickerLoading','Каталог ещё не загружен.','The catalog is still loading.'],
  ['pickerOriginFirst','Сначала выберите расу и профессию.','Choose a race and class first.'],
  ['pickerNoMatches','Нет совместимых предметов. Измени поиск или слот.',
   'No compatible items. Try another search or slot.'],
  ['pickerItemClose','Закрыть настройку','Close item settings'],
  ['pickerItemSettings','Настройка предмета','Item settings'],
  ['pickerSoulSearchAria','Поиск души','Find Soul'],
  ['pickerSoulSlotAria','Слот души','Soul slot'],
  ['pickerSoulSlotCaption','Слот','Slot'],
  ['pickerEmptySoul','пусто','empty']]],
 ['wiki-ui',[
  ['searchPlaceholder','Поиск по названию','Search by name'],
  ['searchAria','Поиск по энциклопедии','Search encyclopedia'],
  ['backTop','↑ В начало списка','↑ Back to top'],
  ['backTopAria','Прокрутить список энциклопедии к началу',
   'Scroll the encyclopedia list to the beginning'],
  ['viewAria','Вид Энциклопедии','Encyclopedia view'],
  ['viewList','☰ Список','☰ List'],['viewGrid','▦ Сетка','▦ Grid']]],
 ['skill-ui',[
  ['searchPlaceholder','Найти умение','Find skill'],
  ['filterAria','Фильтр навыков','Skill filter']]],
 ['stats-ui',[
  ['remainingPrefix','Свободно:','Available:'],
  ['spentPrefix','Потрачено:','Spent:']]]
];

test('27 static RU/EN D1 editor strings span equipment, wiki, skills and stats',()=>{
 assert.equal(copy.reduce((sum,[,rows])=>sum+rows.length,0),27);
 for(const [section,entries] of copy){
  for(const [key,ru,en] of entries){
   const slug=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
   const id=section+'.'+slug;
   const expected=JSON.stringify({ru:'Переименовано',en:'Renamed'});
   assert.equal(guide.validOverride('book.'+id,expected),true,id);
   const overridden={['guideedit.book.'+id]:expected};
   assert.equal(guide.field(overridden,id,ru,en).ru,'Переименовано');
   assert.equal(guide.field(overridden,id,ru,en).en,'Renamed');
   assert.equal(guide.field({},id,ru,en).ru,ru);
   assert.equal(guide.field({},id,ru,en).en,en);
   const code=section==='equipment'&&key.startsWith('pickerSoul')||key==='pickerEmptySoul'||
    key==='pickerItemClose'||key==='pickerItemSettings'?itemUI:app;
   assert.ok(code.includes("'"+key+"'"),'missing actual rendered key '+id);
  }
 }
});

test('shared owner editor reuses CAS, blur and Escape without wrapping buttons',()=>{
 assert.match(app,/function ownerInterfaceEditor\(section,rows,/);
 assert.match(app,/if\(!adminEditing\|\|!adminToken\)return null;/);
 assert.match(app,/ownerCopyLabel\(label,section,key,ru,en,\{/);
 assert.match(app,/onCommitted:visible=>applyOwnerInterfaceEditedValue\(section,key,visible\)/,
  'Saving editorial text must refresh all in-place attributes, not only the label');
 assert.doesNotMatch(app,/class:'ui-content-pencil studio-owner-interface-pencil'/);
 assert.match(app,/node\.dataset\.ownerInterfaceSuffix=suffix/);
 assert.match(app,/function bindOwnerInterfaceText\(node,section,key,ru,en,attribute='text'/);
 assert.match(app,/node\.dataset\.ownerInterfaceKey=key/);
 assert.match(app,/ownerCopyKey\(section,id\)!==key/);
 assert.match(app,/if\(attr==='text'\)\{\s*if\(!editingText\)node\.textContent=value/);
 assert.match(app,/if\(attr==='text'\)\{\s*if\(!editingText\)ownerDockPatchText\(node,value\)/);
 assert.match(app,/node\.setAttribute\(attr,value\)/);
 assert.match(app,/key\.startsWith\('book\.wiki-ui\.'\)/);
 assert.match(app,/key\.startsWith\('book\.skill-ui\.'\)/);
 assert.match(app,/key\.startsWith\('book\.stats-ui\.'\)/);
 assert.match(app,/owner-dialog\|wiki-ui\|skill-ui\|stats-ui/);
 assert.match(app,/onCommit:next=>saveGuidePatch\('book\.'\+ownerCopyKey\(section,key\),\{\[editLang\]:next\}\)/);
 assert.match(app,/\beditWikiValue\(node,ownerCopy\(section,key,ru,en\)/);
 assert.match(app,/function refreshVisibleOwnerCopy\(recordKey\)/);
 assert.match(app,/\$\('pathSkillStatus'\)/);
 assert.match(app,/\$\('pathSkillSearch'\)/);
 assert.match(app,/reconcilePanel\('ownerSkillSearchCopy','skill-ui'/);
 assert.match(app,/panel=ownerInterfaceEditor\(section,rows,headingRu,headingEn\)/);
 assert.doesNotMatch(app,/\$\('ownerSkillSearchCopy'\)\?\.remove\(\)/);
 assert.match(app,/ownerInterfaceEditor\('stats-ui'/);
});

test('#390 Wiki authorial Save, Undo and mounted refresh accept only five text-only families',()=>{
 const undo=app.slice(app.indexOf('async function undoOwnerEdit()'),
  app.indexOf('function showOverrideManager()',app.indexOf('async function undoOwnerEdit()')));
 const save=app.slice(app.indexOf('async function saveGuidePatchNow('),
  app.indexOf('async function saveGuideList(',app.indexOf('async function saveGuidePatchNow(')));
 const refresh=app.slice(app.indexOf('function refreshVisibleOwnerCopy(recordKey)'),
  app.indexOf('function refreshVisibleProfileCopy()',app.indexOf('function refreshVisibleOwnerCopy(recordKey)')));
 const marker='(?:map\\.text|monster\\.text|npc\\.trade|chest\\.text|item\\.text)';
 for(const section of [save,undo,refresh])
  assert.ok(section.includes(marker),'Exact Wiki family allowlist missing');
 assert.match(save,/\/\^book\\\.wiki\\\./);
 assert.match(undo,/\/\^guideedit\\\.book\\\.wiki\\\./);
 assert.match(refresh,/if\(!\/\^wiki\\\./);
 assert.doesNotMatch(save,/isWikiAuthorCopy\(/);
 assert.doesNotMatch(undo,/isWikiAuthorCopy\(/);
 assert.doesNotMatch(refresh,/isWikiAuthorCopy\(/);
 assert.match(refresh,/\[data-owner-interface-bindings\]/);
 assert.match(refresh,/ownerDockPatchText\(node,value\)/);
 assert.match(undo,/refreshVisibleOwnerCopy\(last\.key\);saveView\(\)/);
 assert.match(undo,/else await refreshOwnerCatalog\(\)/);
});


test('#390 Wiki static headings edit directly without wrapping game values or adding pencils',()=>{
 const binder=app.slice(app.indexOf('function bindOwnerInterfaceText('),
  app.indexOf('function applyOwnerInterfaceEditedValue(',app.indexOf('function bindOwnerInterfaceText(')));
 assert.match(binder,/node\.tagName==='H4'/);
 assert.match(binder,/!prefix&&!suffix/);
 assert.match(binder,/!node\.childElementCount/);
 for(const item of ['wiki\\.map\\.text','wiki\\.monster\\.text','wiki\\.npc\\.trade',
  'wiki\\.chest\\.text','wiki\\.item\\.text'])
  assert.ok(binder.includes(item),item);
 assert.match(binder,/!node\.dataset\.wikiDirectCaption/);
 assert.match(binder,/ownerCopyLabel\(node,section,key,ru,en,\{/);
 assert.match(binder,/onCommitted:visible=>applyOwnerInterfaceEditedValue\(section,key,visible\)/);
 assert.match(binder,/else if\(attribute!=='text'\)\{/);
 assert.doesNotMatch(binder,/pencil|icon/i,
  'Caption editor must not introduce a new pencil or action icon');
});

test('search terms, actual item stats, skill packets, and character state remain unedited',()=>{
 assert.match(app,/bindOwnerInterfaceText\(search,'wiki-ui','searchPlaceholder'/);
 assert.match(app,/bindOwnerInterfaceText\(search,'equipment','pickerSearchPlaceholder'/);
 assert.match(app,/const search=h\('input',\{type:'search',value:stageSlotQuery\}\)/);
 assert.match(app,/const search=h\('input',\{type:'search',value:wikiSearch,/);
 assert.match(app,/const value=\(prefix\|\|''\)\+ownerCopy\(section,id,ru,en\)\+\(suffix\|\|''\)/);
 assert.match(itemUI,/bind\(button,'pickerSoulSlotAria'/);
 assert.match(itemUI,/if\(!soul\)button\.dataset\.soulEmptySlot=String\(i\+1\)/);
 assert.match(app,/if\(key==='equipment\.picker-empty-soul'\)/);
 const slice=app.slice(app.indexOf('function ownerInterfaceEditor('),app.indexOf('const equipmentCopy='));
 assert.doesNotMatch(slice,/catalog\.equipment|b\.name|item\.id|state\.stats|state\.equipment/);
});
