import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const items=JSON.parse(read('data/os/items.json'));
const chests=JSON.parse(read('data/os/chests.json'));
const souls=JSON.parse(read('data/os/souls.json'));

test('every available OS chest has a canonical item image identity',()=>{
 assert.equal(chests.boxes.length,32);
 for(const chest of chests.boxes)
  assert.ok(items[chest.i]?.icon,'Missing real OS item icon for chest '+chest.i);
});

test('every live OS soul shares a source-backed item sprite identity',()=>{
 assert.equal(Object.keys(souls).length,112);
 for(const [id,soul] of Object.entries(souls))
  assert.ok(items[id]?.icon||soul.icon,'Missing icon identity for soul '+id);
});

test('wiki resolves chests by item ID and soul portraits through item icon catalog',()=>{
 const app=read('app.js');
 assert.match(app,/type==='chest'\?wikiData\.items\?\.\[id\]/);
 assert.match(app,/itemIcon\(wikiData\.items\?\.\[id\]\|\|row,'items'\)/);
 assert.match(app,/type==='item'\|\|type==='chest'\|\|type==='soul'/);
 assert.match(app,/const wikiImage=/);
});

test('soul icon resolution uses canonical item URLs in sockets and wiki',()=>{
 const app=read('app.js');
 const start=app.indexOf('function itemIcon('),end=app.indexOf('\nfunction branchCap',start);
 assert.ok(start>=0&&end>start);
 const factory=Function('override','iconManifest','unavailableIconIds','OS',app.slice(start,end)+'\nreturn itemIcon');
 const normal=factory({},null,new Set(),'https://pandorasaga-os.com');
 assert.match(normal({id:101000,kind:'SOUL',icon:'I_101000_00'},'souls'),
  /\/icons\/items\/I_101000_00\.webp/);
 const overridden=factory({'visual.soul.101000':'real-custom-image.webp'},null,new Set(),'https://pandorasaga-os.com');
 assert.equal(overridden({id:101000,kind:'SOUL',icon:'I_101000_00'},'souls'),
  'real-custom-image.webp');
});

test('NPC recipes, monster details and locations are searchable game data',()=>{
 const app=read('app.js'),styles=read('style.css');
 assert.match(app,/const filterRecipes=/);
 assert.match(app,/wiki-trade-cost/);
 assert.match(app,/wiki-map-monsters/);
 assert.match(app,/const monsterStats=/);
 assert.match(styles,/\.wiki-trade-card/);
});

test('wiki item and skill details expose source fields, class names, and progressive source lists',()=>{
 const app=read('app.js');
 assert.match(app,/rec\.PEN/);
 assert.match(app,/rec\.atkspeed/);
 assert.match(app,/rec\.twoHanded===true/);
 assert.match(app,/const classLabel=id=>/);
 assert.match(app,/rec\.cast/);
 assert.match(app,/rec\.cooldown/);
 assert.match(app,/rec\.range/);
 assert.match(app,/wikiSourceShown\+=80;/);
 assert.match(app,/wikiUsageShown\+=80;/);
 assert.match(app,/wikiIndex\.records\('map'\)/);
 assert.match(app,/const records=wikiIndex\.records\(type\)/);
 assert.match(app,/matchesWords\(card\.searchText,recipeSearch\.value\)/);
 assert.match(app,/moreSources\(found\)/);
 assert.match(app,/moreSources\(usedIn,'usage'\)/);
 assert.match(app,/\(trade\.mats\|\|\[\]\)\.map/);
});
test('wiki imagery uses canonical item/skill icons and neutral glyphs for image-less locations',()=>{
 const app=read('app.js'),css=read('style.css'),book=read('stage-attributes.js');
 assert.match(app,/const wikiGlyphs=/);
 assert.match(app,/class:'wiki-list-glyph'/);
 assert.match(app,/class:cls.includes\('wiki-list-icon'\)/);
 assert.match(app,/PandoraItemPresentation.slotLabel\(slot,lang\)/);
 assert.match(app,/class:'wiki-category-symbol'/);
 assert.match(css,/\.wiki-list-glyph/);
 assert.match(book,/PandoraItemPresentation\?\.description\(rec\.desc\)/);
 assert.match(book,/PandoraItemPresentation\?\.description\(soul\.desc\)/);
 assert.match(app,/\['item','chest','soul'\]\.includes\(type\)\?window\.PandoraItemPresentation\.description/);
});
test('wiki shows localized game class names and consistent source labels',()=>{
 const app=read('app.js');
 assert.match(app,/PandoraItemPresentation\.kind\(rec,lang\)/);
 assert.match(app,/keys\.map\(classLabel\)\.filter\(Boolean\)/);
 assert.match(app,/const monsterStats=/);
 assert.match(app,/Monster resistances/);
 assert.match(app,/const currencies=\[\[wt\('Золото','Gold'\)/);
 assert.doesNotMatch(app,/id\.replaceAll\('_',' '\)/);
 assert.match(app,/if\(fromD1&&\(snapshots\.size!==1\|\|unknown\.length\)\)/);
});
test('encyclopedia CSS has one canonical image size, descriptions and monster grid',()=>{
 const css=read('style.css');
 for(const selector of [/^\.wiki-list-icon\s*\{/gm,/^\.wiki-monster-stats\s*\{/gm,
  /^\.wiki-description\s*\{/gm]){
  assert.equal([...css.matchAll(selector)].length,1,'Duplicate encyclopedia CSS selector');
 }
 assert.match(css,/\.wiki-list-icon\{width:34px/);
 assert.match(css,/\.wiki-description\{white-space:pre-wrap;overflow-wrap:anywhere/);
});
test('EN encyclopedia uses authoritative NPC/chest/settlement names, and chest descriptions from item source',()=>{
 const app=read('app.js'),wiki=read('wiki-data.js'),en=JSON.parse(read('data/os/strings.en.json'));
 assert.ok(en.tradeNpcs?.['53']?.n);
 assert.ok(en.tradeMaps?.['1001004']?.n);
 assert.ok(en.items?.['51003']?.d);
 assert.match(app,/officialEnglish\?\.tradeMaps\?\.\[id\]/);
 assert.match(app,/type==='chest'\?wikiData\.items\?\.\[id\]/);
 assert.match(app,/type==='item'\|\|type==='chest'\?'items'/);
 assert.match(app,/const described=type==='chest'\?wikiData\.items\?\.\[id\]:rec/);
 assert.match(wiki,/const entries=\{\},terms=\{\},aliases=\{\},variants=\{\}/);
});
test('encyclopedia equipment owns catalog filters and coherent grid/list views',()=>{
 const html=read('index.html'),app=read('app.js'),css=read('style.css');
 assert.doesNotMatch(html,/<nav id="nav">[^<]*<button data-tab="equipment"/);
 assert.doesNotMatch(html,/<nav id="dockTabs"[^>]*>\s*<button[^>]*data-tab="character"/);
 assert.match(html,/data-tab="wiki" data-i18n="wiki">📜 Энциклопедия/);
 assert.match(app,/wikiItemType==='equipment'\?\s*slotKeys\.includes\(rec\.slot\)/);
 assert.match(app,/class:'wiki-equipment-type'/);
 assert.match(app,/wiki-gear-grid/);
 assert.match(css,/\.wiki-list\.wiki-gear-grid/);
 assert.doesNotMatch(app,/function renderEquipment\(/);
});
test('every encyclopedia chapter supports the same list/grid switch and clean chest source links',()=>{
 const app=read('app.js'),css=read('style.css');
 const fragment=app.slice(app.indexOf('function renderWiki(root)'),app.indexOf('function renderProfile(root)'));
 const view=fragment.indexOf("const view=h('div',{class:'wiki-equipment-view'");
 const itemOnly=fragment.indexOf("if(wikiSelection.type==='item')");
 assert.ok(view>itemOnly);
 assert.match(fragment,/controls\.append\(view\)/);
 assert.match(fragment,/browse\.classList\.toggle\('wiki-gear-grid',wikiItemLayout==='grid'\)/);
 assert.match(fragment,/link\(dataName\('chest',row\.id\),'chest'/);
 assert.doesNotMatch(fragment,/wt\(' · группа '/);
 assert.match(css,/\.wiki-list\.wiki-gear-grid/);
});
test('removed equipment catalog has no duplicate CSS components or unused tabs',()=>{
 const css=read('style.css'),html=read('index.html');
 for(const old of ['.equipment-catalog-head{','.gear-list.inventory-grid{',
  '.item-inspector-pin{','.gear-list.soul-catalog{']){
  assert.ok(!css.includes(old),'obsolete stylesheet rule: '+old);
 }
 assert.ok(!html.includes('data-tab="equipment"'));
 assert.match(css,/\.wiki-equipment-toolbar\{/);
 assert.match(css,/\.wiki-gear-grid\{/);
});
test('game encyclopedia explains race/sex restrictions without exposing technical IDs',()=>{
 const app=read('app.js'),css=read('style.css'),hover=read('stage-item-ui.js');
 assert.match(app,/PandoraUIPlanner\.outfitWearers\(rec,lang\)/);
 assert.match(app,/class:'wiki-item-wearers'/);
 assert.match(css,/\.wiki-item-wearers\{/);
 assert.match(hover,/PandoraUIPlanner\?\.outfitWearers\?\.\(record,locale\)/);
});
test('equipment chapter filters current class, race, sex and level without redundant future filter',()=>{
 const app=read('app.js');
 assert.match(app,/wikiItemEligibility='all'/);
 assert.match(app,/class:'wiki-eligibility-filter'/);
 assert.doesNotMatch(app,/Подходит до 55 уровня|Compatible by level 55/);
 assert.match(app,/Можно надеть сейчас/);
 assert.match(app,/const heroCompatible=\(rec,level\)=>/);
 assert.match(app,/PandoraUIPlanner\.raceCompatible\(rec,state\.race,state\.gender\)/);
 assert.match(app,/nameCache\.set\(key,value\)/);
});
test('item and soul sources use one translated renderer and independent pagination counters',()=>{
 const app=read('app.js');
 assert.match(app,/const sourceEntry=\(row,itemId\)=>/);
 assert.equal((app.match(/appendSourceFlow\(found,id\)/g)||[]).length,2);
 assert.match(app,/class:'wiki-source-flow'/);
 assert.match(app,/class:'wiki-source-token'/);
 assert.match(app,/const shown=group==='usage'\?wikiUsageShown:wikiSourceShown/);
 assert.match(app,/if\(group==='usage'\)wikiUsageShown\+=80/);
 assert.match(app,/for\(const trade of usedIn\.slice\(0,wikiUsageShown\)\)/);
 assert.match(app,/dataName\('map',loc\.id\)/);
 assert.match(app,/No confirmed sources in the current catalog/);
});
test('English encyclopedia indexes official names only and never reveals raw class codes',()=>{
 const app=read('app.js'),english=JSON.parse(read('data/os/strings.en.json'));
 assert.ok(english.classes?.WARRIOR?.n);
 assert.equal(typeof english.branches?.slash,'string');
 assert.match(app,/const searchTerms=\(type,id\)=>/);
 assert.match(app,/translated\?\.n/);
 assert.doesNotMatch(app,/Search by name or description|Поиск по названию или описанию/);
 assert.match(app,/id=>searchTerms\(type,id\)/);
 assert.match(app,/const classLabel=id=>/);
 assert.match(app,/const branchLabel=id=>/);
 assert.doesNotMatch(app,/names\.join\(', '\)/);
});
test('nested trade and map searches use the same order-independent token matching',()=>{
 const app=read('app.js');
 assert.match(app,/const matchesWords=\(text,query\)=>/);
 assert.match(app,/matchesWords\(card\.searchText,recipeSearch\.value\)/);
 assert.match(app,/matchesWords\(row\.name,search\.value\)/);
 assert.doesNotMatch(app,/card\.searchText\.includes\(query\)/);
});
test('all-class gear stays compact while restricted classes are readable on demand',()=>{
 const app=read('app.js'),css=read('style.css');
 assert.match(app,/const renderClassEligibility=keys=>/);
 assert.match(app,/jobKeys\.every\(id=>keys\.includes\(id\)\)/);
 assert.match(app,/class:'wiki-class-all'/);
 assert.match(app,/class:'wiki-allowed-classes'/);
 assert.doesNotMatch(app,/h\('details',\{class:'wiki-allowed-classes'\}/);
 assert.match(app,/detail\.append\(h\('div',\{class:'wiki-allowed-classes'\}/);
 assert.equal((app.match(/renderClassEligibility\(Object\.keys\(rec\.classes\)/g)||[]).length,2);
 assert.match(css,/\.wiki-class-all\{/);
 assert.match(css,/\.wiki-class-tags/);
 assert.match(app,/class:'wiki-class-tag'/);
});
test('skill requirements and chest reward groups use interactive game-style UI',()=>{
 const app=read('app.js'),css=read('style.css');
 assert.match(app,/class:'wiki-requirement-chip'/);
 assert.match(app,/class:'wiki-requirement-track'/);
 assert.match(app,/class:'wiki-prerequisite'/);
 assert.match(app,/class:'wiki-chest-group'/);
 assert.match(app,/class:'wiki-chest-options'/);
 assert.match(app,/class:'wiki-level-reward'/);
 assert.match(app,/wikiIndex\.rewardChest\(id\)/);
 assert.match(css,/\.wiki-requirement-chip/);
 assert.match(css,/\.wiki-chest-group-summary/);
 assert.match(css,/\.wiki-source-flow/);
 assert.doesNotMatch(app,/p==null\?'':' · '\+row\.p\+'% внутри группы'/);
});
test('monster loot and item-to-NPC relationships use compact accessible cards',()=>{
 const app=read('app.js'),css=read('style.css');
 assert.match(app,/class:'wiki-loot-flow'/);
 assert.match(app,/class:'wiki-loot-chip'/);
 assert.match(app,/class:'wiki-recipe-uses'/);
 assert.match(app,/class:'wiki-recipe-use'/);
 assert.match(app,/const hasChest=Boolean\(wikiIndex\?\.records\('chest'\)\?\.\[id\]\)/);
 assert.match(app,/const dest=hasChest\?'chest':hasSoul\?'soul':'item'/);
 assert.match(css,/\.wiki-loot-flow/);
 assert.match(css,/\.wiki-recipe-uses/);
});
test('absent OS rune has no player-facing setting or live calculation contribution',()=>{
 const calc=read('os-calculator.js'),app=read('app.js');
 const stage=read('stage-attributes.js'),html=read('index.html');
 assert.doesNotMatch(html,/originRuneJoEun|Руна «Чо Ын»/);
 assert.doesNotMatch(stage,/runeJoEun|Чо Ын/);
 assert.doesNotMatch(app,/originRuneJoEun/);
 assert.match(app,/rawAttributes\.runeJoEun===true/); // historical save compatibility
 assert.match(calc,/level,itemForth,\.\.\.potionContext,runeJoEun:false/);
});

test('skills expose hover preview, and book uses branded checkboxes and source-backed potions',()=>{
 const path=read('hero-path.js'),book=read('stage-attributes.js'),css=read('style.css');
 assert.match(path,/path-milestone-tooltip/);
 assert.match(path,/path-milestone-preview/);
 assert.match(path,/tabindex:'0'/);
 assert.match(book,/PandoraOSCalculator\?\.potionPreview/);
 assert.match(book,/stage-combat-quick/);
 assert.match(css,/\.stage-book-check input\[type=checkbox\]/);
});
