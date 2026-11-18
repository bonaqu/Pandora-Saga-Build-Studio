// One worker for small equipment, Book and calculator contract tests.
// Source provenance is recorded per block. Every assertion is retained.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

// Original: tests/rune-compatibility.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('historical rune survives shared snapshots but stays disabled in current OS calculations',()=>{
 const app=read('pandora-studio-app.js'),calc=read('pandora-os-character-calculator.js');
 assert.match(app,/safe\.attributeBuffs\.runeJoEun=rawAttributes\.runeJoEun===true/);
 assert.match(calc,/level,itemForth,\.\.\.potionContext,runeJoEun:false/);
});
}

// Original: tests/equipment-rail-english.test.mjs
{
const code=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
test('equipment rail, selection and details share one 14-slot RU/EN lookup',()=>{
 assert.match(code,/const englishGearSlots=\['Weapon','Shield'/);
 assert.match(code,/const gearSlotName=index=>lang==='en'\?englishGearSlots\[index\]:slots\[index\]\[0\]/);
 assert.match(code,/const tooltip=gearSlotName\(i\)/);
 assert.match(code,/text:item\?itemName\(item\):gearSlotName\(i\)/);
 assert.match(code,/slotLabel:\(lang==='en'\?'Slot: ':'Слот: '\)\+gearSlotName\(selectedSlot\)/);
});
test('equipment search, status and warnings are bilingual',()=>{
 for(const term of ['Close item picker','Search by name','Unequip item','Show more',
  'matching','shown','Item inactive: ','Requires level $1']){
  assert.ok(code.includes(term),term);
 }
 assert.match(code,/issue\.map\(gearIssueLabel\)\.join/);
});
}

// Original: tests/partial-gear-bonuses.test.mjs
{
const root=new URL('../',import.meta.url),s=p=>readFileSync(new URL(p,root),'utf8');
const scope={};Function('window',s('pandora-os-character-calculator.js'))(scope);
test('resistance and accuracy stats map to source effect codes',()=>{
 const summary=scope.PandoraOSCalculator.gatherEffects([
  ['weapon',{effects:[{func:'EP_FIRE_RESISTANCE_CONST',a:10},{func:'EP_TOHIT_CONST',a:7},
    {func:'EP_IMMUNE_BURN',a:1}]},0],
  ['soul',{effects:[{func:'EP_FIRE_RESISTANCE_CONST',a:5}]},0]
 ]);
 assert.equal(summary.bonuses.fire,15);
 assert.equal(summary.bonuses.accuracy,7);
 assert.equal(summary.bonuses.burn,1);
 assert.deepEqual(summary.ignored,[]);
 assert.equal(summary.trace.length,4);
});
test('stage renderer labels source bonuses rather than pretending to know final stats',()=>{
 const view=s('pandora-studio-hero-book.js');
 assert.match(view,/Известные бонусы снаряжения и душ/);
 assert.doesNotMatch(view,/частичный расчёт/);
});
}

// Original: tests/public-book-cleanliness.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('debugger-only formula disclaimers are not placed in ordinary player book',()=>{
 const book=read('pandora-studio-hero-book.js'),app=read('pandora-studio-app.js');
 assert.doesNotMatch(book,/stage-methodology|stage-combat-formulas|stage-vital-formulas/);
 assert.match(book,/function summaryPage\(body,calc,options=\{\}\)/);
 assert.match(book,/function attackPage\(body,calc/);
 assert.doesNotMatch(app,/Расчёт по известным формулам, без некоторых эффектов/);
 assert.doesNotMatch(book,/'Частично'\]/);
});
test('Warding passive requires actual class branch capacity of 26 or more',()=>{
 const calculator=read('pandora-os-character-calculator.js');
 assert.match(calculator,/wardingCap:classData\.branchCaps\?\.warding/);
 assert.match(calculator,/!Number\.isSafeInteger\(wardingCap\)\|\|wardingCap<26/);
 assert.match(calculator,/wardingMastery>wardingCap/);
});
}

// Original: tests/os-calculator.test.mjs
{
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('OS class base uses exact integer-cents floor, not the old half-to-even total',()=>{
 const src=get('pandora-os-character-calculator.js');
 assert.match(src,/function halfToEven\(/);
 assert.match(src,/function classBase\(/);
 const host={};Function('window',src)(host);
 const C=host.PandoraOSCalculator;
 assert.equal(C.classBase({base:7.5,lv:0,vit:0},1,0,'vit'),7,
  '7.5 is rounded down, not half to even or nearest integer');
 assert.equal(C.classBaseComponents({base:7.5,lv:0,vit:0},1,0,'vit').rawCents,750);
 assert.equal(C.classBase({base:7.01,lv:0.12,vit:0.03},3,5,'vit'),7);
 assert.match(src,/hp:hpBase\+hpBonus.total/);
});
test('OS known ability and life effects are applied once with trace',()=>{
 const s=get('pandora-os-character-calculator.js');
 assert.match(s,/EP_VITARITY_CONST/);
 assert.match(s,/EP_MAXMANA_CONST/);
 assert.match(s,/trace.push/);
 assert.match(s,/verified:false/);
});
}

// Original: tests/book-calculation-notes.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('no calculation methodology is duplicated in player-facing chapters',()=>{
 const stage=read('pandora-studio-hero-book.js'),css=read('pandora-studio-theme.css');
 assert.match(stage,/function summaryPage\(body,calc,options=\{\}\)/);
 assert.match(stage,/function attackChapterGroups\(calc\)/);
 assert.match(stage,/function defenseChapterGroups\(calc\)/);
 assert.doesNotMatch(stage,/stage-methodology|Как рассчитываются ОЗ и ОМ/);
 assert.match(css,/stage-result-section-head/);
});
test('technical effect coverage remains calculated but not mixed with result matrix',()=>{
 const stage=read('pandora-studio-hero-book.js'),calc=read('pandora-os-character-calculator.js');
 assert.match(calc,/function effectCoverage\(/);
 assert.match(calc,/const coverage=effectCoverage/);
 assert.doesNotMatch(stage,/Что осталось вне итоговых чисел|stage-coverage/);
 assert.match(stage,/function summaryRows\(calc\)/);
});
}

// Original: tests/hero-book-consumable-independent-targets-682.test.mjs
{
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const css=read('pandora-studio-hero-book-additions.css');

test('consumable skill references do not nest inside item-opening buttons',()=>{
 const begin=book.indexOf('const consumableSkills=modifiers?.consumableSkills?.rows||[];');
 assert.ok(begin>=0);
 const end=book.indexOf('body.append(section);',begin);
 assert.ok(end>begin);
 const part=book.slice(begin,end);
 assert.ok(part.includes("const row=make('div',{class:'stage-potion-item'})"));
 assert.ok(part.includes("const itemLink=make(item?'button':'span'"));
 assert.ok(part.includes("itemLink.append(make('span',{class:'stage-potion-name',text:displayName}))"));
 assert.ok(part.includes("row.append(itemLink,skillNames)"));
 assert.ok(part.includes("PandoraSkillPreview?.attach(badge,skill.id)"));
 assert.ok(!part.includes("const row=make(item?'button':'div'"));
 assert.ok(css.includes('stage-consumable-skills button.stage-potion-source:focus-visible'));
});
}

// Original: tests/wiki-pagination.test.mjs
{
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('encyclopedia provides true counts and can progressively load all matches',()=>{
 const code=get('pandora-studio-app.js');
 assert.match(code,/results=wikiIndex\.search\(type,wikiSearch,searchResolver,/);
 assert.match(code,/\{includeVariants:type==='skill'\}/);
 assert.match(code,/wikiResultsCache\?\.index===wikiIndex/);
 assert.match(code,/const visible=selectedIndex>=wikiShown/);
 assert.match(code,/results\.slice\(0,wikiShown\)/);
 assert.match(code,/Показано '\+visible.length\+' из '\+results.length/);
 assert.match(code,/wikiShown\+=100;draw\(\)/);
 assert.match(code,/browse\.scrollTop=selectedIndex>=wikiShown\?0:previousScroll/);
});
test('search and category changes reset pagination without dropping entries',()=>{
 const code=get('pandora-studio-app.js');
 assert.match(code,/wikiSearch=search.value;wikiShown=100/);
 assert.match(code,/wikiSearch='';wikiShown=100;\s*if\(location\.hash\.startsWith\('#wiki\/'\)\)openWikiChapterList\(\)/);
});
}

// Original: tests/portrait-book-keyboard.test.mjs
{
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=get('pandora-studio-app.js'),view=get('pandora-studio-hero-book.js');
test('ArrowLeft/ArrowRight navigation and Escape remain within the portrait',()=>{
 assert.match(app,/\$\('stageAttributes'\)\?\.addEventListener\('keydown'/);
 assert.match(app,/event\.key==='ArrowRight'/);
 assert.match(app,/event\.key!=='ArrowLeft'/);
 assert.match(app,/event\.target\.closest\?\.\('input,select,textarea'\)/);
 assert.match(app,/if\(stageAttributesPage\)\{/);
});
test('focus survives live setting changes and moves onto selected tab on page switch',()=>{
 assert.match(app,/activeControl=root\.contains\(document\.activeElement\)/);
 assert.match(app,/\[data-book-setting=/);
 assert.match(app,/\[role="tab"\]\[aria-selected="true"\]/);
 assert.match(app,/scroll\.scrollTop=priorScroll/);
});
test('every selected tab labels the book panel accessibly',()=>{
 assert.match(view,/role:'tabpanel'/);
 assert.match(view,/'aria-labelledby':'stageBookTab_'\+chosen/);
 assert.match(view,/'aria-controls':'stageBookPanel'/);
});
}

// Original: tests/branch-icon-fallback.test.mjs
{
const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const match=source.match(/const BRANCH_ICON_PATHS=(\{[^\n]+\});/);
assert.ok(match,'Expected explicit branch-icon table');
const paths=JSON.parse(match[1]);
const start=source.indexOf('function branchIcon(');
const end=source.indexOf('\nfunction skillIcon(',start);
assert.ok(start>0&&end>start,'Branch fallback must be independently testable');
const branchIcon=Function('BRANCH_ICON_PATHS',source.slice(start,end)+'\nreturn branchIcon')(paths);
test('every mapped branch sprite is a real checked-in original legacy image',()=>{
 for(const [key,path] of Object.entries(paths)){
  assert.match(key,/^[a-z][a-z0-9]*$/);
  assert.match(path,/^assets\/skills\/legacy\/[0-9]{2}-[0-9]{2}\.png$/);
  assert.equal(existsSync(new URL('../'+path,import.meta.url)),true,path);
  assert.equal(branchIcon(key),path);
 }
});
test('unknown, race and prototype branch keys never resolve to missing placeholders',()=>{
 for(const key of ['race','other',null,undefined,'__proto__','constructor','toString']){
  assert.equal(branchIcon(key),null,String(key));
 }
 assert.equal(source.includes('assets/ui/icons/skill-unknown.svg'),false);
});
}

// Original: tests/equipment-history-inline-647.test.mjs
{
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('manual history reset of author copy never reloads the game catalog',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function showOverrideManager(){');
 const end=app.indexOf(' function wikiDataOrCatalogHasRecord(',start);
 const manager=app.slice(start,end);
 assert.ok(manager.length>1000);
 assert.match(manager,/record\.key\.startsWith\('guideedit\.book\.profile\.'\)/);
 assert.match(manager,/record\.key\.startsWith\('guideedit\.book\.ui\.label\.'\)/);
 assert.ok(manager.includes('(equipment|path|catalog-sync|honor-view)'));
 assert.match(manager,/refreshVisibleOwnerCopy\(record\.key\);saveView\(\)/);
 assert.match(manager,/refreshVisibleProfileCopy\(\);saveView\(\)/);
 assert.match(manager,/refreshVisibleUICopy\(record\.key\)/);
 assert.match(manager,/else void refreshOwnerCatalog\(\)/,
  'Game-data records still need catalog refresh on reset');
 const browser=read('tests/browser-owner-equipment-inline-632.mjs');
 assert.match(browser,/History reset must use current CAS value/);
 assert.match(browser,/window\.__ownerQAFieldNode===document\.querySelector/);
 assert.doesNotMatch(browser,/stage-gear-souls-head/);
});
}

// Original: tests/retired-skill-picker-css.test.mjs
{
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const css=read('pandora-studio-theme.css'),html=read('index.html');
const abandoned=['path-milestone-picker','path-milestone-choice','path-milestone-dismiss',
 'path-milestone-choice-body','inline-branch-controls'];
test('old grouped skill-picker CSS is unreachable and removed, without deleting current tree UI',()=>{
 const scriptSources=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map(m=>m[1].split('?')[0]).filter(path=>existsSync(new URL('../'+path,import.meta.url)));
 for(const path of scriptSources){
  const source=read(path);
  for(const old of abandoned)assert.ok(!source.includes(old),path+' still creates '+old);
 }
 for(const old of abandoned)assert.ok(!css.includes(old),'Retired CSS selector '+old);
 for(const active of ['path-integrated-track','path-integrated-milestones','path-current-notch',
  'path-unlock-notch','path-unlock-details','path-skill-preview-item','path-point-controls']){
  assert.ok(css.includes(active),'Current UI style '+active+' must remain');
 }
 const release=JSON.parse(read('package.json')).pandoraRelease;
 assert.ok(html.includes('pandora-studio-hero-path.js?v='+release),'Hero Path must use current release cache key');
});
}
