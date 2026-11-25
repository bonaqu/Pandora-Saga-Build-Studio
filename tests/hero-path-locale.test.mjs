import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';

const source=readFileSync(new URL('../pandora-studio-hero-path.js',import.meta.url),'utf8');
function check(lang){
 const root={};Function('window',readFileSync(new URL('../pandora-studio-skill-progression.js',import.meta.url),'utf8'))(root);
 Function('window','document',source)(root,{});
 const api={lang,job:'MAGE',state:{level:1},skillCatalog:[],branchName:id=>id};
 return root.PandoraHeroPath.readiness({
  id:'skill-99',charLevel:20,classes:{CLERIC:true},
  reqs:[{branch:'magic',amount:10}],learnable:false
 },api);
}
test('Hero Path skill availability messages are translated by interface language',()=>{
 const en=check('en');
 assert.equal(en.learned,false);
 for(const label of ['Unavailable to this class','Requires level 20',
   'magic : allocated 0/10','Special learning method required'])
  assert.ok(en.problems.includes(label),label);
 const ru=check('ru');
 for(const label of ['Не подходит профессии','Требуется уровень 20',
   'magic: вложено 0/10','Особый способ изучения'])
  assert.ok(ru.problems.includes(label),label);
});
test('skill detail fields and workspace labels translate without rewriting game data',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 assert.ok(source.includes("field('skillCharacterLevel','Уровень персонажа','Character level',skill.charLevel)"));
 assert.ok(source.includes("authored(api,'skillRequirementsHeading','Требования по веткам','Branch requirements'"));
 assert.ok(source.includes("const dd=make('dd',{text:String(value)})"));
  assert.ok(source.includes('stats.append(label,dd)'));
  assert.ok(source.includes('if(valueCopy)bindPathCopy(api,dd,...valueCopy)'));
 assert.ok(source.includes("api.copyLabel?.(key,ru,en)||tr(api,ru,en)"));
 assert.ok(source.includes("const ru='Показать ещё',en='Show more',key='skillShowMore'"));
 assert.ok(source.includes("class:'path-more-count'"));
 // The title is now source-authored UI copy, not an app-side raw string.
 const locale=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');
 assert.match(locale,/workbenchTitleCharacter:\['Мастерская героя','Hero Workshop'\]/);
 assert.match(app,/heading\.dataset\.ownerCopyKey=titleKey/);
 assert.ok(app.includes('Full encyclopedia entry'));
});


test('Hero Path uses Origin-approved attribute translations, not bare powerStat codes',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 const pairs=[
  ["code:'vit'","nameEn:'Vitality'"],["code:'str'","nameEn:'Strength'"],
  ["code:'agi'","nameEn:'Agility'"],["code:'dex'","nameEn:'Dexterity'"],
  ["code:'spi'","nameEn:'Spirit'"],["code:'int'","nameEn:'Intelligence'"]
 ];
 for(const [code,name]of pairs)assert.ok(app.includes(code)&&app.includes(name),
  'Canonical attribute name missing: '+code);
 assert.match(app,/attributeLabel:raw=>\{/);
 assert.match(app,/ORIGIN_STAT_LABELS\.find\(row=>row\.code===String\(raw\)\.toLowerCase\(\)\)/);
 assert.match(source,/api\.attributeLabel\(skill\.powerStat\)/);
 assert.doesNotMatch(source,/field\(tr\(api,'Характеристика','Attribute'\),skill\.powerStat\)/);
});

test('issue 390: committed attribute copy updates an action even around live nested editor',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 const start=app.indexOf('function applyOwnerInterfaceEditedValue(');
 const end=app.indexOf('// Compact non-modal owner-only copy editor',start);
 assert.ok(start>0&&end>start,'The production attribute updater must be present');
 const attrs={'aria-label':'Slice, 8 pts'};
 const action={
  textContent:'LIVE UNSAVED DRAFT',
  dataset:{ownerInterfaceBindings:JSON.stringify({
   text:{section:'path',key:'pathUnlockPoints',prefix:'',suffix:''},
   'aria-label':{section:'path',key:'pathUnlockPoints',prefix:'Slice, 8 ',suffix:''}
  })},
  querySelector:selector=>selector.includes('wiki-inline-input')?{}:null,
  setAttribute:(key,value)=>{attrs[key]=value;},
  getAttribute:key=>attrs[key]
 };
 const document={querySelectorAll:()=>[action]};
 const update=Function('document',app.slice(start,end)+
  '\nreturn applyOwnerInterfaceEditedValue;')(document);
 update('path','pathUnlockPoints','milestone pts QA');
 assert.equal(action.textContent,'LIVE UNSAVED DRAFT',
  'An ancestor with an active editor must not lose typed text');
 assert.equal(attrs['aria-label'],'Slice, 8 milestone pts QA',
  'A non-textual attribute must still refresh after the same D1 commit');
 const restore=app.slice(app.indexOf('function refreshVisibleOwnerCopy('),
  app.indexOf('async function saveGuidePatch(',app.indexOf('function refreshVisibleOwnerCopy(')));
 assert.match(restore,/if\(!editingText\)ownerDockPatchText\(node,value\)/);
 assert.match(restore,/ownerDockPatchAttr\(node,attr,value\)/);
});

test('issue 390: an ancestor editor never blocks independent accessible attributes',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 const section=app.slice(app.indexOf('function applyOwnerInterfaceEditedValue('),
  app.indexOf('// Compact non-modal owner-only copy editor'));
 assert.match(section,/const editingText=Boolean\(node\.querySelector/);
 assert.match(section,/if\(!editingText\)node\.textContent=value/);
 assert.match(section,/node\.setAttribute\(attr,value\)/);
 assert.match(app,/if\(!editingText\)ownerDockPatchText\(node,value\)/);
 assert.match(app,/ownerDockPatchAttr\(node,attr,value\)/);
});

test('issue 390: milestone and successor labels are edited directly without renaming game skills',()=>{
 assert.match(source,/authored\(api,'pathUnlockPoints','оч\.','pts'/);
 assert.match(source,/'span','path-unlock-unit'/);
 assert.match(source,/'span','path-unlock-state'/);
 assert.match(source,/api\.guardAction\?\.\(button,unit\)/);
 assert.match(source,/'span','path-skill-lineage-caption'/);
 assert.match(source,/class:'path-skill-lineage-name',text:' '\+label/);
 assert.match(source,/api\.guardAction\?\.\(button,nextCaption\)/);
 assert.doesNotMatch(source,/bindPathCopy\(api,button,'skillNextLink'/);
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 assert.match(app,/applyOwnerInterfaceEditedValue\('path',key,visible\)/);
});

test('issue 390: Path group and requirement captions are direct-edit and keep numbers separate',()=>{
 assert.match(source,/authored\(api,key,ru,en,'span','path-requirement-caption'\)/);
 assert.match(source,/class:'path-requirement-value',text:String\(value\)/);
 assert.match(source,/authored\(api,copyKey,ru,en,'span','path-group-summary-copy'\)/);
 assert.match(source,/class:'path-group-summary-value'/);
 assert.match(source,/api\.guardAction\?\.\(groupButton,caption\)/);
 assert.doesNotMatch(source,/bindPathCopy\(api,caption,key,ru,en,'text',' ',' · '\)/);
});

test('issue 390: skill rail summary edits only author copy and not the live count',()=>{
 assert.match(source,/authored\(api,'skillsOnTrackCaption',fallbackRu,/);
 assert.match(source,/PandoraUILocale\?\.text\('skillsOnTrack','ru'\)/);
 assert.match(source,/PandoraUILocale\?\.text\('skillsOnTrack','en'\)/);
 assert.match(source,/class:'path-unlock-count'/);
 assert.match(source,/marks\.reduce\(\(total,mark\)=>total\+mark\.skills\.length,0\)/);
 assert.match(source,/api\.guardAction\?\.\(unlockSummary,unlockCaption\)/);
 assert.doesNotMatch(source,/text:\(root\.PandoraUILocale\?\.text\('skillsOnTrack'/);
});

test('issue 390: Path baseline/limit captions are editable separately from values',()=>{
 const src=readFileSync(new URL('../pandora-studio-hero-path.js',import.meta.url),'utf8');
 assert.match(src,/authored\(api,'innateBaselineLabel','Начально \(оч\.\):'/);
 assert.match(src,/authored\(api,'pathLimitPoints','Лимит \(оч\.\):'/);
 assert.match(src,/class:'path-innate-value',text:' '\+String\(base\)/);
 assert.match(src,/class:'path-limit-number',text:' '\+String\(cap\)/);
 assert.match(src,/bindPathCopy\(api,baseline,'innateBaselineAria'/);
 assert.match(src,/'aria-hidden':api\.canEdit\?null:'true'/);
});

test('#390: Path budget source captions are CAS-editable without remounting numeric data',async()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 const registry=app.match(/const pathBudgetCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(registry);
 const rows=Function('return '+registry[1])();
 assert.deepEqual(rows.map(row=>row[0]),[
  'budgetLoading','budgetAvailable','budgetSpent','budgetTotal','budgetExcess'
 ]);
 const {buildEditorialDefaultsManifest}=await import('../scripts/plan-editorial-d1-defaults.mjs');
 const manifest=buildEditorialDefaultsManifest();
 assert.equal(manifest.stats.cohorts['hero-path-budget'],10);
 for(const [key,ru,en] of rows){
  const recordKey='guideedit.book.path.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  const records=manifest.records.filter(row=>row.recordKey===recordKey);
  assert.deepEqual(records.map(row=>row.field).sort(),['en','ru']);
  assert.equal(records.find(row=>row.field==='ru').value,ru);
  assert.equal(records.find(row=>row.field==='en').value,en);
  assert.equal(ru,ru.trim());assert.equal(en,en.trim());
  assert.doesNotMatch(ru,/[0-9]/);
 }
 const source=app.split('function refreshBudgetLabel(){')[1]
  .split('// Reusing a stable source snapshot')[0];
 assert.match(source,/ownerCopyLabel\(caption,'path',key,ru,en\)/);
 assert.match(source,/caption\.querySelector\('\.wiki-inline-input'\)/);
 assert.match(source,/row\.querySelector\('strong'\)\.textContent=String\(value\)/);
 assert.match(source,/if\(!stats\)/);
 assert.doesNotMatch(source,/root\.replaceChildren\(/);
});

test('#390 Path budget CSS keeps loading state full-width and hides game-data rows',()=>{
 const css=readFileSync(new URL('../pandora-studio-theme.css',import.meta.url),'utf8');
 assert.match(css,/#budgetState \[hidden\]\{display:none!important\}/,
  'Author-level flex/grid display must not expose hidden budget values');
 assert.match(css,/\.path-budget-values>\.path-budget-loading\{grid-column:1\/-1;/,
  'The loading announcement should span the compact three-column budget');
});


test('issue 390: dynamic Path slider aria has D1 editable copy but never stores calculated values',()=>{
 const manifest=buildEditorialDefaultsManifest();
 const recordKey='guideedit.book.path.path-range-value-aria';
 const records=manifest.records.filter(row=>row.recordKey===recordKey);
 assert.equal(records.length,2,'Exactly one safe bilingual source caption');
 assert.deepEqual(Object.fromEntries(records.map(row=>[row.field,row.value])),{
  en:'Branch points / mastery / extra invested / limit:',
  ru:'Очки ветки / мастерство / вложено сверх старта / предел:'
 });
 assert.ok(source.includes("bindPathCopy(api,range,'pathRangeValueAria'"));
 assert.ok(source.includes("'aria-valuetext',' '+level+' / '+mastery+' / '+invested+' / '+cap"));
 assert.equal(source.includes("range.setAttribute('aria-valuetext',level+"),false);
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 assert.ok(app.includes("['pathRangeValueAria','Очки ветки"));
 assert.ok(app.includes("bindCopy:(node,key,ru,en,attribute='text',suffix='',prefix='')=>"));
 assert.equal(app.split("'aria-label','aria-valuetext'").length,3,
  'Save and Undo must both update the live slider accessible value');
});


test('issue 390: successful owner save updates slider aria-valuetext without changing four live numeric results',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 const start=app.indexOf('function applyOwnerInterfaceEditedValue(');
 const end=app.indexOf('// Compact non-modal owner-only copy editor',start);
 assert.ok(start>=0&&end>start);
 const attrs={'aria-valuetext':'Original values: 17 / 14 / 12 / 90'};
 const range={dataset:{ownerInterfaceBindings:JSON.stringify({
  'aria-valuetext':{section:'path',key:'pathRangeValueAria',
   ru:'Очки ветки / мастерство / вложено сверх старта / предел:',
   en:'Branch points / mastery / extra invested / limit:',
   prefix:'',suffix:' 17 / 14 / 12 / 90'}
 })},querySelector:()=>null,setAttribute:(key,value)=>{attrs[key]=value}};
 const update=Function('document',app.slice(start,end)+
  '\\nreturn applyOwnerInterfaceEditedValue;')({querySelectorAll:()=>[range]});
 update('path','pathRangeValueAria','Custom branch slider wording:');
 assert.equal(attrs['aria-valuetext'],'Custom branch slider wording: 17 / 14 / 12 / 90');
});
