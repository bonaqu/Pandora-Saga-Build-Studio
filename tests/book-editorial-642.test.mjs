import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const root={};
Function('window',file('pandora-studio-hero-book.js'))(root);
Function('window',file('pandora-studio-ui-locale.js'))(root);
const book=root.PandoraStageAttributes,locale=root.PandoraUILocale;

test('full Book copy catalog includes additional static player-facing explanations',()=>{
 const pairs=book.bookEditorialDefaults;
 assert.ok(Object.keys(pairs).length>=190,'156 existing Book + 36 supplementary authored captions');
 for(const [ru,en] of [
  ['Выбранные усиления','Configured enhancements'],
  ['Сохраняются с этим героем','Saved with this character'],
  ['Бонусы ОЗ и ОМ зависят от уровня гильдии.','HP and MP passives depend on guild level.'],
  ['Эффекты песен действуют после применения в игре. Бонусы не прибавляются к билду автоматически.','Song effects apply only when activated in the game. No bonus is added to this build automatically.'],
  ['Для текущих зелий ещё нет доступных значений.','No potion values are available yet.'],
  ['Эффект при использовании. Бонус эффективности зелий к ОМ не применён.','Effect on use. Potion effectiveness is not applied to MP.'],
  ['Показывать восстановление от зелий','Show potion recovery']
 ]){
  assert.equal(pairs[ru],en);
  const key=book.bookEditorialKey(ru);
  assert.equal(locale.bookFieldKey(ru),key);
  assert.equal(locale.bookFieldKey(en),key);
  assert.equal(locale.baseText(key,'ru'),ru);
  assert.equal(locale.baseText(key,'en'),en);
 }
});

test('issue #390: Book proc headline separates the authorial D1 key from source-event counts',()=>{
 const src=file('pandora-studio-hero-book.js');
 const app=file('pandora-studio-app.js');
 const key=locale.bookFieldKey('Срабатывания предметов и душ');
 assert.ok(key,'The historical bilingual Book key must remain valid');
 assert.match(locale.fieldKey(key)||'',/^ui\.label\.book-/);
 assert.match(src,/class:'stage-source-events-caption',text:english\?/);
 assert.match(src,/class:'stage-book-live-count',text:' · '\+rows\.length/);
 assert.doesNotMatch(src,/panel\.append\(make\('summary',\{text:\(english\?'Item and Soul triggers'/);
 assert.match(src,/function guardBookSummaryCaption\(node\)/);
 assert.match(src,/guardBookSummaryCaption\(node\)/);
 assert.match(src,/collapseBookSections\(body,chosen\);\s*if\(skillMoreOpen\)for\(/);
 assert.match(src,/if\(canEdit\)for\(const caption of body\.querySelectorAll\?\.\('summary \[data-guide-key\]'\)/);
 assert.match(app,/node\.closest\('button,summary,\[role="button"\]'\)/);
 assert.match(app,/ownerCaptionActionGuard\(action,node\)/);
 for(const label of ['42','Sword +9','Source ID 123','ОЗ: 4900'])
  assert.equal(locale.bookFieldKey(label),null,'Game value cannot become copy: '+label);
});

test('issue #390: Book and shared action guards support multiple captions per disclosure',()=>{
 const src=file('pandora-studio-hero-book.js');
 const app=file('pandora-studio-app.js');
 assert.match(src,/const bookSummaryCaptionTargets=new WeakMap\(\)/);
 assert.match(src,/bookSummaryCaptionTargets\.get\(summary\)/);
 assert.match(src,/captions\.add\(node\)/);
 assert.match(src,/const caption=\[\.\.\.captions\]\.find\(item=>item\.contains\(event\.target\)\)/);
 assert.match(src,/const caption=make\('span',\{class:'stage-book-buff-heading-copy'/);
 assert.match(src,/const heading=make\('strong',\{\},\[caption\]\)/);
 assert.match(src,/guideLabel\(caption,stableId==='guild'\?'buffs\.guild'/);
 assert.doesNotMatch(src,/guideLabel\(node\.firstChild,stableId==='guild'/);
 assert.match(src,/guideLabel\(honorTerm,'buffs\.honor'/);
 assert.match(app,/const ownerCaptionActionTargets=new WeakMap\(\)/);
 assert.match(app,/ownerCaptionActionTargets\.get\(button\)/);
 assert.match(app,/captions\.add\(caption\)/);
 assert.match(app,/const activeCaption=\[\.\.\.captions\]\.find\(item=>item\.contains\(event\.target\)\)/);
 assert.match(app,/if\(button\.isConnected&&!button\.disabled&&adminEditing&&adminToken&&/);
 assert.match(app,/!activeCaption\.hidden\)button\.click\(\)/);
});

test('issue #390: skill range copy is edited separately from OS numbers and skill names',()=>{
 const src=file('pandora-studio-hero-book.js');
 assert.match(src,/const authoredRange=\(key,ru,en\)=>/);
 assert.match(src,/guideLabel\(node,'attack\.skillRange\.'\+key,ru,en,options\)/);
 for(const key of ['bonus','fromSkill','from','mastery','timingToggle',
   'timingUse','requirementsMet'])
  assert.ok(src.includes("'"+key+"'"),'Missing exact bilingual range copy: '+key);
 assert.match(src,/if\(skill\?\.id!==row\.id\)continue/);
 assert.match(src,/class:'stage-skill-range-bonus-value',text:size/);
 assert.match(src,/class:'stage-skill-range-source-value',text:'\+'\+row\.sourceConstant/);
 assert.match(src,/class:'stage-skill-range-mastery-value',text:'\+'\+row\.sourceMasteryPart/);
 assert.match(src,/class:'stage-skill-range-source-branch',text:branchName/);
 assert.match(src,/class:'stage-skill-range-source-reason'/);
 assert.match(src,/text:\(english\?row\.reasonEn:row\.reasonRu\)\?\?'—'/);
 // All authorial fragments are exact Book D1 keys, not skill IDs or
 // source-derived numbers translated by fuzzy string replacement.
 assert.doesNotMatch(src,/guideLabel\(label,'attack\.skillRange\./);
});

test('Book user text, numeric values and runtime item labels never become editable D1 keys',()=>{
 for(const value of ['Hero PvP 255','Sword +9','1927','172–209','ОЗ: 1900','Сияние героя','Сохранённый билд']){
  assert.equal(locale.bookFieldKey(value),null);
  assert.equal(book.bookEditorialKey(value),null);
 }
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/\.stage-potion-item,\.stage-item-row,\.stage-skill-card/);
 assert.match(source,/node\.querySelector\('button,input,select,\[role="button"\]'\)/);
});

test('Book overrides stay scoped to one exact bilingual literal with archive fallback',()=>{
 const ru='Выбранные усиления',key=book.bookEditorialKey(ru);
 const d1='guideedit.book.'+locale.fieldKey(key);
 const previous=globalThis.document;
 globalThis.document={documentElement:{lang:'ru'}};
 try{
  locale.setOverrides({[d1]:JSON.stringify({ru:'Выбранные бафы QA',en:'Selected enhancements QA'})});
  assert.equal(book.bookText(ru),'Выбранные бафы QA');
  globalThis.document.documentElement.lang='en';
  assert.equal(book.bookText(ru),'Selected enhancements QA');
  assert.equal(book.bookText('Внешний персонаж'),'Внешний персонаж');
  assert.equal(book.bookText('2000'),'2000');
  locale.setOverrides({});
  assert.equal(book.bookText(ru),'Configured enhancements');
 }finally{
  locale.setOverrides({});
  if(previous===undefined)delete globalThis.document;
  else globalThis.document=previous;
 }
});

test('issue #390: source-backed values stay separate from editable Hero Book RU/EN copy',()=>{
 const authored=[
  ['Сейчас нет активных бонусов к опыту.','No experience bonuses are currently active.'],
  ['Уровень союзника','Ally level'],['СД союзника','Ally SPR'],
  ['Песнопения союзника','Ally Hymn'],
  ['Союзник: Клирик · Исцеление','Ally: Cleric · Healing'],
  ['необходимо (учитывается автоматически)','required (automatic)'],
  ['Упрямое сердце','Stronghearted'],['шанс по данным навыка','skill-source chance'],
  ['Подробнее','More details']
 ];
 for(const [ru,en] of authored){
  const key=book.bookEditorialKey(ru),d1=key&&'guideedit.book.'+locale.fieldKey(key);
  assert.ok(key&&d1,'No stable key for '+ru);
  assert.equal(locale.bookFieldKey(ru),key);
  assert.equal(locale.bookFieldKey(en),key);
  locale.setOverrides({[d1]:JSON.stringify({ru:'Правка '+ru,en:'Edit '+en})});
  assert.equal(locale.text(key,'ru'),'Правка '+ru);
  assert.equal(locale.text(key,'en'),'Edit '+en);
  locale.setOverrides({[d1]:'{broken'});
  assert.equal(locale.text(key,'ru'),ru);
  assert.equal(locale.text(key,'en'),en);
  locale.setOverrides({});
 }
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/class:'stage-book-live-count',text:' · '\+conditional\.length/);
 assert.match(source,/make\('strong',\{text:String\(minHealing\)\}\)/);
 assert.match(source,/make\('strong',\{text:String\(survival\.chance\)\}\)/);
 for(const runtime of ['45','Player character name','250','320007001'])
  assert.equal(locale.bookFieldKey(runtime),null);
});

test('issue #390: Hero Book heading text is independent of live chapter number',()=>{
 const ru='КНИГА ГЕРОЯ',en='HERO BOOK',key=book.bookEditorialKey(ru);
 assert.ok(key);
 assert.equal(locale.bookFieldKey(ru),key);
 assert.equal(locale.bookFieldKey(en),key);
 const d1='guideedit.book.'+locale.fieldKey(key);
 locale.setOverrides({[d1]:JSON.stringify({ru:'Летопись героя',en:'Hero chronicle'})});
 assert.equal(locale.text(key,'ru'),'Летопись героя');
 assert.equal(locale.text(key,'en'),'Hero chronicle');
 locale.setOverrides({});
 const src=file('pandora-studio-hero-book.js');
 assert.match(src,/bookTitleText\.dataset\.ownerCopyKey=bookTitleText\.dataset\.bookEditorialKey/);
 assert.match(src,/stage-book-title-count',text:' · '\+\(index\+1\)\+' \/ 6'/);
 assert.equal(locale.bookFieldKey('1 / 6'),null);
});

test('issue #390: rare static Book notes and the source-breakdown header are independently RU/EN editable',()=>{
 const expected=[["«Вольный ветер» и «Благословение ветра»: прибавки показаны отдельно.","Free Wind and Wind Blessing: bonuses are shown separately."],["У текущего билда нет рассчитанных эффектов умений. Описания и требования смотри в Энциклопедии → Навыки.","No calculated skill effects for this build. Skill descriptions and requirements are in Encyclopedia → Skills."],["На экипированном оружии нет активных подтверждённых стихийных эффектов.","No supported elemental weapon effect is active on the equipped weapon."],["Здесь только прямые бонусы вещей и душ. Титулы, пассивные умения, комплекты и другие эффекты тоже могут влиять на итоговые значения выше.","Direct item and Soul bonuses only. Titles, passives, sets and other effects may also change the totals above."]];
 for(const [ru,en] of expected){
  assert.equal(book.bookEditorialDefaults[ru],en);
  const key=book.bookEditorialKey(ru);
  assert.ok(key,'Missing semantic key for '+ru);
  assert.equal(locale.bookFieldKey(en),key);
  const d1='guideedit.book.'+locale.fieldKey(key);
  locale.setOverrides({[d1]:JSON.stringify({ru:'Правка RU',en:'Edited EN'})});
  assert.equal(locale.text(key,'ru'),'Правка RU');
  assert.equal(locale.text(key,'en'),'Edited EN');
  locale.setOverrides({});
  assert.equal(locale.text(key,'ru'),ru);
 }
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/\['defense','sources','\.stage-status-source-breakdown > summary'/);
 assert.match(source,/guideLabel\(label,section\+'\.caption\.'\+key,ru,en,options\)/);
 assert.match(source,/node\.setAttribute\('data-owner-copy-key',node\.dataset\.bookEditorialKey\)/);
});

test('touch owner mode reuses the Book inline editor and avoids redundant DOM moves',()=>{
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/root\.PandoraOwnerTouchEdit\?\.\(node,editName,\{interactive:true\}\)/);
 assert.match(source,/root\.PandoraOwnerTouchEdit\?\.\(caption,edit,\{interactive:true\}\)/);
 assert.doesNotMatch(source,/grid\.append\(tile\);\s*grid\.append\(tile\)/);
});

test('owner touch caption guard excludes actions, viewport scroll and delayed OS menus',()=>{
 const source=file('pandora-studio-app.js');
 assert.match(source,/ownerTouchCaptionEditors=new WeakMap\(\)/);
 assert.match(source,/event\.target\?\.closest\?\.\('input,textarea,select,\[contenteditable\]'\)/);
 assert.match(source,/ownerTouchCaptionEditors\.set\(node,\{edit,interactive\}\)/);
 assert.match(source,/if\(\(action&&!bound\.interactive\)\|\|action!==targetAction\)return/);
 assert.match(source,/bindOwnerTouchCaption\(node,edit,\{interactive:true\}\)/);
 assert.match(source,/\['pointerup','pointercancel'\]/);
 assert.doesNotMatch(source,/document\.addEventListener\('scroll',cancelOwnerTouchGesture,true\)/);
 assert.match(source,/event\.pointerId!==g\.pointerId/);
 assert.match(source,/marked\.action\.contains\(event\.target\)/);
 assert.match(source,/const marked=\{node:gesture\.node,action:gesture\.action\|\|gesture\.node,/);
 assert.match(source,/if\(ownerTouchSwallow===marked\)ownerTouchSwallow=null/);
});

test('editable HTML labels preserve their associated checkbox and hybrid pointer identity',()=>{
 const source=file('pandora-studio-app.js');
 assert.match(source,/node\.matches\('label'\)&&node\.querySelector\('input,textarea,select,button'\)/);
 assert.match(source,/const action=node\.closest\('button,a,summary,label,\[role="button"\]'\)/);
 assert.match(source,/event\.pointerType==='touch'&&event\.pointerId===held\.pointerId/);
 const bookSource=file('pandora-studio-hero-book.js');
 assert.match(bookSource,/guideLabel\(toggle\.querySelector\('\.stage-mounted-label'\),'attack\.mountedToggle'/);
 assert.match(bookSource,/id:'stageBookMountedToggle',type:'checkbox'/);
});

test('touch long press preserves delayed-action suppression after unrelated clicks',()=>{
 const source=file('pandora-studio-app.js');
 const browser=file('tests/browser-ui-content-inline.mjs');
 assert.match(source,/if\(Date\.now\(\)>marked\.until\)\{ownerTouchSwallow=null;return\}/);
 assert.match(source,/if\(!marked\.action\.contains\(event\.target\)\)return/);
 assert.match(source,/ownerTouchSwallow=null;\s*event\.preventDefault\(\);event\.stopImmediatePropagation\(\)/);
 assert.match(browser,/Unrelated clicks are not blocked by touch editor/);
 assert.match(browser,/Unrelated click must not consume delayed synthetic tab suppression/);
});

test('#390: Hero Book accessible chapter names reuse original D1 actions and isolate numeric position',async()=>{
 const app=file('pandora-studio-app.js'),bookSource=file('pandora-studio-hero-book.js');
 const {buildEditorialDefaultsManifest}=await import('../scripts/plan-editorial-d1-defaults.mjs');
 const manifest=buildEditorialDefaultsManifest();
 const words=book.bookRegionCopyRows,aliases=book.bookAccessibleAliasRows;
 assert.equal(words.length,3);
 assert.deepEqual(words.map(row=>row[0]),['regionLead','regionPage','regionOf']);
 assert.equal(manifest.stats.cohorts['hero-book-accessibility'],6);
 for(const [key,ru,en] of words){
  const id='guideedit.book.book-aria.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  const records=manifest.records.filter(row=>row.recordKey===id);
  assert.deepEqual(records.map(row=>row.field).sort(),['en','ru']);
  assert.equal(records.find(row=>row.field==='ru').value,ru);
  assert.equal(records.find(row=>row.field==='en').value,en);
  assert.doesNotMatch(ru,/[0-9]/,'Live page position is not a D1 caption');
 }
 assert.equal(aliases.length,4);
 for(const [,ru,en] of aliases){
  const key=locale.bookFieldKey(ru),id='guideedit.book.'+locale.fieldKey(key);
  assert.ok(key,ru+' must be an existing Book bilingual field');
  assert.equal(locale.baseText(key,'en'),en);
  assert.equal(manifest.records.filter(row=>row.recordKey===id).length,2);
  assert.equal(manifest.records.some(row=>
   row.recordKey.startsWith('guideedit.book.book-aria.')&&row.value===ru),
   false,'Do not add a duplicate alias default for '+ru);
 }
 assert.match(bookSource,/bookChapterTitle\(chapter,chapterRu,copy\)/);
 assert.match(bookSource,/authored\('regionPage'\)\+' '\+\(index\+1\)/);
 assert.match(bookSource,/child!==stablePanel&&child!==pinnedOwnerPanel/);
 assert.match(bookSource,/ownerPanel\.querySelector\('\.wiki-inline-input,\[data-owner-text-field\]'\)/);
 assert.match(bookSource,/data-book-aria-action/);
 assert.match(bookSource,/caption\.tabIndex=0;.*F2/);
 assert.match(app,/if\(isBook\)window\.PandoraStageAttributes\?\.refreshAccessibility/);
 assert.match(app,/key\.startsWith\('book\.book-aria\.'\)/);
 assert.match(app,/last\.key\.startsWith\('guideedit\.book\.book-aria\.'\)/);
 assert.match(app,/record\.key\.startsWith\('guideedit\.book\.book-aria\.'\)/);
});

test('#390: Book dynamic accessible action prefixes never store skill/item names in D1',async()=>{
 const {buildEditorialDefaultsManifest}=await import('../scripts/plan-editorial-d1-defaults.mjs');
 const manifest=buildEditorialDefaultsManifest();
 const rows=book.bookSourceActionCopyRows;
 assert.deepEqual(rows.map(row=>row[0]),[
  'skillEncyclopediaPrefix','itemEncyclopediaPrefix','itemOpenPrefix'
 ]);
 assert.equal(manifest.stats.cohorts['hero-book-source-actions'],6);
 for(const [key,ru,en] of rows){
  const id='guideedit.book.book-aria.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  assert.equal(manifest.records.find(row=>row.recordKey===id&&row.field==='ru')?.value,ru);
  assert.equal(manifest.records.find(row=>row.recordKey===id&&row.field==='en')?.value,en);
  assert.equal(ru.trim(),ru);assert.equal(en.trim(),en);
 }
 assert.equal(manifest.records.some(row=>/SOURCE SKILL|SOURCE ITEM 13041/.test(row.value)),false);
 const source=file('pandora-studio-hero-book.js');
 assert.equal([...source.matchAll(/'data-book-source-aria':/g)].length,6,
  'One skill badge, four source item encyclopedia actions and one direct item link');
 assert.match(source,/'data-book-source-name':skillName/);
 assert.match(source,/'data-book-source-name':displayName/);
 assert.match(source,/key==='data-book-source-name'&&value!==null&&value!==undefined/);
 assert.match(source,/action\.dataset\.bookSourceAria,name=action\.dataset\.bookSourceName/);
 assert.match(source,/action\.setAttribute\('aria-label',authored\(id\)\+' '\+name\)/);
 // The same actual Book refresh recomposes accessible words from immutable
 // game-source names, even after a CAS override. No fake game stat values.
 if(!root.PandoraHonorGuide)
  Function('window',file('pandora-studio-honor-guide.js'))(root);
 const previous=globalThis.document,buttons=[
  {dataset:{bookSourceAria:'skillEncyclopediaPrefix',bookSourceName:'SOURCE SKILL'},
   attrs:{},setAttribute(key,v){this.attrs[key]=v}},
  {dataset:{bookSourceAria:'itemOpenPrefix',bookSourceName:'SOURCE ITEM 13041'},
   attrs:{},setAttribute(key,v){this.attrs[key]=v}}
 ];
 const target={
  attrs:{},setAttribute(key,v){this.attrs[key]=v},
  querySelector(){return null},
  querySelectorAll(selector){return selector==='[data-book-source-aria]'?buttons:[]}
 };
 try{
  globalThis.document={documentElement:{lang:'en'}};
  const patch={'guideedit.book.book-aria.item-open-prefix':JSON.stringify({
   en:'Open source item QA:'
  })};
  book.refreshAccessibility(target,patch,'recovery');
  assert.equal(buttons[0].attrs['aria-label'],'Encyclopedia: SOURCE SKILL');
  assert.equal(buttons[1].attrs['aria-label'],'Open source item QA: SOURCE ITEM 13041');
  assert.equal(buttons[1].dataset.bookSourceName,'SOURCE ITEM 13041');
  assert.match(target.attrs['aria-label'],/^Hero Book\. .*\. Chapter 6 of 6$/);
  globalThis.document.documentElement.lang='ru';
  book.refreshAccessibility(target,patch,'recovery');
  assert.equal(buttons[0].attrs['aria-label'],'Энциклопедия: SOURCE SKILL');
  assert.equal(buttons[1].attrs['aria-label'],'Открыть предмет: SOURCE ITEM 13041');
 }finally{
  if(previous===undefined)delete globalThis.document;
  else globalThis.document=previous;
 }
});

test('#390: Book buff statuses have five direct RU/EN captions, not editable game eligibility',async()=>{
 const {buildEditorialDefaultsManifest}=await import('../scripts/plan-editorial-d1-defaults.mjs');
 const manifest=buildEditorialDefaultsManifest(),rows=book.buffStatusCopyRows;
 const names=['unavailableClass','shieldRequired','weaponUnavailable','supportUnavailable'];
 assert.deepEqual(rows.map(row=>row[0]),names);
 assert.equal(manifest.stats.cohorts['hero-book-buff-status'],8);
 for(const [key,ru,en] of rows){
  const record='guideedit.book.buffs.reason.'+key;
  const entries=manifest.records.filter(row=>row.recordKey===record);
  assert.deepEqual(entries.map(row=>row.field).sort(),['en','ru']);
  assert.equal(entries.find(row=>row.field==='ru').value,ru);
  assert.equal(entries.find(row=>row.field==='en').value,en);
  assert.ok(ru.length>4&&en.length>4);
  assert.doesNotMatch(ru,/[0-9]/);
  assert.doesNotMatch(en,/[0-9]/);
 }
 const source=file('pandora-studio-hero-book.js'),app=file('pandora-studio-app.js');
 assert.match(source,/buffStatusCopyRows\.find\(row=>row\[0\]===skill\.reasonCopyKey\)/);
 assert.match(source,/guideLabel\(reason,'buffs\.reason\.'\+key,ru,en,options\)/);
 assert.equal(rows.some(row=>row[1]==='Недоступно для героя'),false,
  'Historical Hero Book fallback retains its original ui.label.* D1 key');
 assert.ok(locale.bookFieldKey('Недоступно для героя'));

 assert.match(source,/reason\.tabIndex=options\.editable\?0:-1/);
 assert.match(source,/make\(allowed\?'label':'div'/,
  'Native label for enabled buffs; editable DIV for disabled skill rows');
 assert.match(source,/if\(!allowed\)checkbox\.setAttribute\('aria-label',displayName\)/);
 assert.match(source,/event\.preventDefault\(\);event\.stopImmediatePropagation\(\)/);
 assert.doesNotMatch(source,/function guardBookCheckCaption/,
  'Dead delayed-checkbox handler must not remain');
 assert.doesNotMatch(source,/buffStatusCopyRows.*?reason.*?Number\(/);
 assert.match(app,/buffReasonCopyKey=reason=>window\.PandoraStageAttributes\?\.buffStatusCopyRows/);
 assert.equal((app.match(/reasonCopyKey:buffReasonCopyKey\(reason\)/g)||[]).length,2);
 assert.match(app,/last\.key\.startsWith\('guideedit\.book\.buffs\.reason\.'\)/);
 assert.match(app,/record\.key\.startsWith\('guideedit\.book\.buffs\.reason\.'\)/);
});

test('#390 Book dynamic level/mastery blockers edit only words, not source thresholds',async()=>{
 const {buildEditorialDefaultsManifest}=await import('../scripts/plan-editorial-d1-defaults.mjs');
 const manifest=buildEditorialDefaultsManifest(),rows=book.buffRequirementCopyRows;
 assert.deepEqual(rows.map(row=>row[0]),[
  'levelLead','levelUnit','masteryLead','masteryTerm'
 ]);
 assert.deepEqual(rows.map(row=>[row[1],row[2]]),[
  ['Откроется на','Available'],
  ['уровне','at level'],
  ['Требуется','Requires'],
  ['мастерство','mastery']
 ]);
 assert.equal(manifest.stats.cohorts['hero-book-buff-requirements'],8);
 for(const [key,ru,en] of rows){
  const recordKey='guideedit.book.buffs.reason.'+key;
  const actual=manifest.records.filter(row=>row.recordKey===recordKey);
  assert.deepEqual(actual.map(row=>row.field).sort(),['en','ru']);
  assert.equal(actual.find(row=>row.field==='ru')?.value,ru);
  assert.equal(actual.find(row=>row.field==='en')?.value,en);
  assert.doesNotMatch(ru+en,/[0-9]/);
 }
 const app=file('pandora-studio-app.js'),source=file('pandora-studio-hero-book.js');
 assert.match(app,/return \{kind:'mastery',amount:req\.amount,branchName\}/);
 assert.match(app,/reason===levelReason\(ability\.charLevel\)/);
 assert.match(app,/reason===missingCombatMastery\(ability\)/);
 assert.match(app,/reasonParts:buffRequirementParts\(ability,reason\)/);
 assert.equal((app.match(/reasonParts:buffRequirementParts/g)||[]).length,1,
  'Party support buffs must not be subjected to recipient class restrictions');
 assert.match(source,/if\(english\)status\.append\(term\('levelLead'\),' ',term\('levelUnit'\),' ',value\)/);
 assert.match(source,/else status\.append\(term\('levelLead'\),' ',value,' ',term\('levelUnit'\)\)/);
 assert.match(source,/if\(english\)status\.append\(term\('masteryLead'\),' ',value,' ',branch,' '/);
 assert.match(source,/else status\.append\(term\('masteryLead'\),' ',term\('masteryTerm'\),' «'/);
 assert.match(source,/branch\.textContent=parts\.branchName/);
 assert.match(source,/value\.textContent=String\(parts\.amount\)/);
 assert.match(source,/guideLabel\(node,'buffs\.reason\.'\+id,ru,en,options\)/);
 assert.match(source,/!Number\.isFinite\(Number\(parts\.amount\)\)/);
 assert.match(source,/!renderBuffRequirement\(info,skill\.reasonParts,options\)/);
 assert.equal(manifest.records.some(row=>/QA source branch|QA source level/.test(row.value)),false);
});

test('#390 Healing explanations split 37 bilingual authorial fragments from all live numbers',()=>{
 const expected={
  inspirationLead:['С «Воодушевлением» от союзника:','With Inspiration from an ally:'],
  inspirationTail:['сек. применения (вдвое быстрее)','s of casting (half the usual time)'],
  manaCostLead:['Расход ОМ:','MP cost:'],
  manaCostTail:['от базового','of base'],
  cooldownLead:['Перезарядка:','Cooldown:'],
  cooldownTail:['от базовой','of base'],
  nextManaLead:['Для ещё одного применения нужно','One more cast needs'],
  nextManaTail:['ОМ к запасу','MP capacity'],
  budgetLead:['Полный запас','Full'],
  budgetUpTo:['ОМ: до','MP: up to'],
  budgetCasts:['применений по базовой стоимости','casts at the base cost'],
  budgetLeft:['остаток','left at the regular cost'],
  nextMasteryLead:['Следующий прирост от Исцеления:','Next Healing mastery increase at'],
  nextRemaining:['ещё','+'],
  nextLevelLead:['Следующий прирост','Next'],
  nextLevelPulse:['за срабатывание','per pulse'],
  nextLevelCast:['за применение','per cast'],
  nextLevelAt:['на уровне','at level'],
  nextLevelUnit:['ур.','levels'],
  totalLead:['До','Up to'],
  totalPerTarget:['ОЗ на одну цель за','HP per target for'],
  totalCasts:['применений','casts'],
  attributeLead:['Следующий прирост от','Next'],
  attributeAt:['при','at'],
  attributeOutcome:['получится','increase:'],
  mpCalcLead:['Как рассчитано восстановление ОМ: уровень героя',
   'How MP recovery was calculated: hero level'],
  mpCalcRounding:['округление вниз =','rounded down ='],
  periodEvery:['каждые','every'],
  periodSeconds:['секунды.','seconds.'],
  healingCalcLead:['Как рассчитано лечение:','How the healing was calculated:'],
  healingCalcBase:['Основа','Base'],
  healingCalcStat:['от','from'],
  healingCalcLevel:['от уровня','from level'],
  healingCalcMastery:['от Исцеления','from Healing mastery'],
  healingCalcPulse:['Каждая прибавка округляется вниз отдельно. Результат:',
   'Each part is rounded down separately. Result:'],
  healingCalcPercentLead:['К сумме применяется','Apply'],
  healingCalcPercentTail:['эффективности лечения, затем результат один раз округляется вниз.',
   'healing effectiveness to the sum, then round down once.']
 };
 assert.deepEqual(book.bookHealingActionCopyRows.map(row=>row[0]).sort(),Object.keys(expected).sort());
 for(const [key,ru,en] of book.bookHealingActionCopyRows)
  assert.deepEqual([ru,en],expected[key]);
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/guideLabel\(node,'effects\.healing\.'\+key,row\[1\],row\[2\],editorial\)/);
 assert.match(source,/if\(editable&&typeof onTextEdit==='function'\)node\.tabIndex=0/);
 assert.match(source,/heroHasShield,onItem,onSkill,\.\.\.copyOptions\}\)/);
 for(const key of Object.keys(expected)){
  if(key==='nextLevelPulse'||key==='nextLevelCast')
   assert.match(source,/healingCaption\(pulse\?'nextLevelPulse':'nextLevelCast'\)/);
  else assert.ok(source.includes("healingCaption('"+key+"')"),
   'Missing independent owner caption usage: '+key);
 }
 for(const key of ['mana-needed','cast-seconds','mana-percent','cooldown-percent',
  'mana-pool','mana-casts','mana-remaining','mastery-rank','mastery-remaining',
  'mastery-gain','level-gain','level-value','level-remaining',
  'attribute-gain','attribute-value','attribute-remaining',
  'healing-total','healing-casts','healing-amount','healing-expression-casts',
  'mp-level','mp-coefficient','mp-result','mp-period-seconds',
  'breakdown-base','breakdown-stat','breakdown-level','breakdown-mastery',
  'breakdown-result','breakdown-period-seconds','breakdown-percent'])
  assert.ok(source.includes(",'"+key+"')"));
 assert.match(source,/class:'stage-heal-computed'/);
 assert.doesNotMatch(source,/text:en\?\s*'MP cost: '\+/);
 assert.doesNotMatch(source,/text:en\?\s*'Cooldown: '\+/);
 assert.doesNotMatch(source,/text:en\?\s*'With Inspiration from an ally: '\+/);
});

test('#390 skill scaling authorial phrases are separate from source coefficients and skill names',()=>{
 const rows=book.bookScalingActionCopyRows;
 const expected={
  effectsLead:['Эффекты:','Effects:'],
  calculationLead:['Расчёт (с округлением вниз):','Calculation (rounded down):'],
  calculationMastery:['мастерство','mastery'],
  nextIntLead:['Следующий прирост силы заклинания:','Next spell strength'],
  nextIntAt:['при','at'],nextIntRemaining:['ещё','+'],
  nextMasteryLead:['Следующий прирост','Next'],
  nextMasteryStrike:['силы удара:','strike strength'],
  nextMasterySpell:['силы заклинания:','spell strength'],
  nextMasteryAt:['при мастерстве','at'],nextMasteryRemaining:['ещё','+'],
  inspiredLead:['С «Воодушевлением» от союзника:','With allied Inspiration:'],
  inspiredBefore:['сек. применения (вместо','s casting (instead of'],
  inspiredAfter:['сек.)','s)']
 };
 assert.deepEqual(rows.map(row=>row[0]).sort(),Object.keys(expected).sort());
 for(const [key,ru,en] of rows)assert.deepEqual([ru,en],expected[key]);
 const src=file('pandora-studio-hero-book.js');
 assert.match(src,/guideLabel\(node,'effects\.scaling\.'\+key,row\[1\],row\[2\],editorial\)/);
 assert.match(src,/const scalingActionCopy=new Map\(bookScalingActionCopyRows\.map/);
 assert.match(src,/class:'stage-scaling-source-effects',text:parts/);
 assert.match(src,/class:'stage-scaling-source-branch',text:branch/);
 assert.match(src,/class:'stage-scaling-source-stat',text:stat/);
 assert.match(src,/const phrase=next\.effect==='strike'\?'nextMasteryStrike':'nextMasterySpell'/);
 for(const key of Object.keys(expected)){
  if(['nextMasteryStrike','nextMasterySpell'].includes(key)){
   assert.match(src,/scalingCaption\(phrase\)/);continue;
  }
  assert.ok(src.includes("scalingCaption('"+key+"')"),
   'Missing direct owner label binding: '+key);
 }
 for(const key of ['scaling-base','scaling-int','scaling-mastery',
  'scaling-total','scaling-next-int-gain','scaling-next-int-value',
  'scaling-next-int-remaining','scaling-mastery-gain',
  'scaling-mastery-target','scaling-mastery-remaining',
  'scaling-inspired-seconds','scaling-base-seconds'])
  assert.ok(src.includes(",'"+key+"')"));
 assert.doesNotMatch(src,/class:'stage-skill-coefficient-next',text:en\?/);
});

test('#390 nested skill details reuse a single owner caption and preserve expansion on rerenders',()=>{
 assert.deepEqual(book.bookSkillDetailCopyRows,[['more','Подробнее','More details']]);
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/const ownerKey=locale\?\.fieldKey\?\.\(locale\?\.bookFieldKey\?\.\('Подробнее'\)\)/);
 assert.match(source,/guideLabel\(caption,ownerKey,'Подробнее','More details',editorial\)/);
 const canonical=locale.bookFieldKey('Подробнее');
 assert.equal(locale.baseText(canonical,'ru'),'Подробнее');
 assert.equal(locale.baseText(canonical,'en'),'More details');
 assert.equal(locale.fieldKey(canonical).startsWith('ui.label.book-'),true);
 assert.match(source,/const more=skillMore\('healing',sourceId\)/);
 assert.match(source,/const more=skillMore\('mp',entry\.id\)/);
 assert.match(source,/const more=skillMore\('scaling-'\+groupName,skill\.id\)/);
 assert.match(source,/new Map\(\[\.\.\.stablePanel\.querySelectorAll\('details\[data-book-skill-more\]'\)\]/);
 assert.match(source,/skillMoreOpen\.has\(detail\.dataset\.bookSkillMore\)/);
 assert.match(source,/detail\.open=skillMoreOpen\.get\(detail\.dataset\.bookSkillMore\)/);
 assert.doesNotMatch(source,/make\('summary',\{text:en\?'More details':'Подробнее'\}\)/);
});

test('#390 owner-only accessible Book panel title directly edits without rewriting spoken page ARIA',()=>{
 assert.deepEqual(book.bookA11yPanelCopyRows,[
  ['heading','Доступные названия книги','Accessible Book labels']
 ]);
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/guideLabel\(ownerHeading,'book-aria\.owner-panel-heading',\s*headingRu,headingEn,copyOptions\)/);
 assert.match(source,/ownerHeading\.tabIndex=0/);
 assert.match(source,/owner\.querySelector\('\[data-guide-key="book-aria\.owner-panel-heading"\]'\)/);
 assert.match(source,/heading\.textContent=document\.documentElement\?\.lang==='en'\?/);
 assert.match(source,/heading&&!heading\.querySelector\('\.wiki-inline-input,\[data-owner-text-field\]'\)/);
 assert.doesNotMatch(source,/ownerPanel\.append\(make\('summary',\{text:language==='en'\?/);
 assert.match(source,/target\.setAttribute\('aria-label',authored\('regionLead'\)/);
});

test('#390 Book owner disclosure F2 and cross-summary clicks cancel delayed stale navigation',()=>{
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/let bookSummaryPending=null/);
 assert.match(source,/function cancelBookSummaryPending\(\)/);
 assert.match(source,/clearTimeout\(old\.timer\);bookSummaryPending=null/);
 assert.match(source,/const prior=cancelBookSummaryPending\(\)/);
 assert.match(source,/summary\.addEventListener\('keydown',event=>\{/);
 assert.match(source,/if\(event\.key!=='F2'\|\|event\.target!==summary\)return/);
 assert.match(source,/caption\.dispatchEvent\(new KeyboardEvent\('keydown',\{/);
 assert.match(source,/key:'F2',bubbles:false,cancelable:true/);
 assert.match(source,/if\(prior\?\.summary===summary&&prior\.caption===caption\)return/);
 assert.match(source,/if\(bookSummaryPending!==queued\)return/);
 assert.match(source,/!summary\.querySelector\('\[data-owner-text-field\],\[contenteditable\]'\)/);
 assert.match(source,/const editName=event=>\{\s*cancelBookSummaryPending\(\);/);
 // Keep native keyboard and noncaption disclosure actions immediately usable.
 assert.match(source,/if\(!event\.detail\|\|/);
 assert.match(source,/if\(!caption\)\{\s*cancelBookSummaryPending\(\);\s*return/);
});

test('#390 Phoenix Flame label wording is owner-editable, chance and cooldown source-only',()=>{
 const source=file('pandora-studio-hero-book.js');
 assert.deepEqual(book.bookPhoenixProcCopyRows,[
  ['triggerChance','Шанс срабатывания','Trigger chance'],
  ['cooldown','Откат','Cooldown']
 ]);
 assert.equal(locale.bookFieldKey('Шанс срабатывания'),null,
  'No existing D1 Book caption is duplicated for this phrase');
 assert.equal(locale.bookFieldKey('Откат'),null);
 assert.match(source,/function appendWeaponConditions\(body,calc,items,english,options=\{\}\)/);
 assert.match(source,/guideLabel\(node,'attack\.phoenix\.'\+key,pair\[1\],pair\[2\],options\)/);
 assert.match(source,/appendWeaponConditions\(body,calc,items,english,options\)/);
 assert.match(source,/data-weapon-proc-number':'chance'/);
 assert.match(source,/data-weapon-proc-number':'cooldown'/);
 assert.match(source,/phoenixDamage\(\s*bonus\.phoenix,row\.refinement,calc\?\.stats\)/);
 assert.doesNotMatch(source,/text:english\?\s*'Trigger chance '\+format\(outcome\.chance\)/);
});

test('#390 native Book captions reuse existing semantic keys, not duplicate generic D1',()=>{
 assert.equal(book.bookChapterCaptionCopyRows.length,14);
 for(const [key,ru,en] of [
  ['effects.caption.periodic','Восстановление ОМ умениями','Skill MP recovery'],
  ['defense.caption.sources','Вклад предметов и душ','Bonuses from equipment and Souls'],
  ['attack.caption.elemental','Эффекты стихийных оружий','Elemental weapon effects']
 ]){
  assert.deepEqual(book.bookChapterCaptionCopyRows.find(x=>x[0]===key),[key,ru,en]);
  assert.equal(locale.bookFieldKey(ru),null,'Avoid duplicate default for '+ru);
  assert.equal(locale.bookFieldKey(en),null,'Avoid duplicate default for '+en);
 }
});
