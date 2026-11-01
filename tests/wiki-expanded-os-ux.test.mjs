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
 assert.match(app,/catalog\.classes\?\.\[id\]\?\.name/);
 assert.match(app,/rec\.cast/);
 assert.match(app,/rec\.cooldown/);
 assert.match(app,/rec\.range/);
 assert.match(app,/wikiSourceShown\+=80;draw\(true\)/);
 assert.match(app,/wikiIndex\.records\('map'\)/);
 assert.match(app,/wikiIndex\.records\(type\)/);
 assert.match(app,/wikiIndex\.normalize\(recipeSearch\.value\)/);
 assert.match(app,/moreSources\(found\)/);
 assert.match(app,/moreSources\(usedIn\)/);
 assert.match(app,/\(trade\.mats\|\|\[\]\)\.flatMap/);
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
