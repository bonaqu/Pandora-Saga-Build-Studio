import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const items=JSON.parse(read('data/os/items.json'));
const maps=JSON.parse(read('data/os/trades.json')).mapNames;
const ctx={window:{}};
vm.runInNewContext(read('pandora-studio-conditional-item-bonuses.js'),ctx);
const cond=ctx.window.PandoraConditionalItemBonuses;

test('Astir has separate districts, while NPC locations retain original sovereign country IDs',()=>{
 const app=read('pandora-studio-app.js'),model=read('pandora-studio-astir-locations.js');
 assert.match(app,/dataName\('npc',masterNpcId\)/);
 assert.match(app,/astir-npc-kingdom-claris/);
 assert.doesNotMatch(app,/Культье/);
 assert.doesNotMatch(app,/Вастир/);
 for(const id of ['1001004','1002001','1003001','1004001'])
  assert.ok(maps[id]);
 for(const id of ['astir-union','astir-empire','astir-kingdom'])
  assert.ok(model.includes(id));
 assert.equal(maps['1002001'].name,'Союз северных племен Ванриг');
 assert.equal(maps['1004001'].name,'Лотарская империя');
 assert.equal(maps['1003001'].name,'Королевство Сэнт-Фальстайн');
 assert.match(app,/Районы города Астир/);
 assert.match(app,/wiki-map-npcs/);
 assert.match(app,/wikiLink\(dataName\('npc',masterNpcId\),'npc',masterNpcId\)/);
 assert.doesNotMatch(model,/Культье/);
 assert.match(model,/Кларис/);
});

test('Soul price and slot remain content-sized without duplicate styles',()=>{
 const css=read('pandora-studio-item-owner-editor.css');
 const count=(css.match(/\.wiki-page \.wiki-soul-properties\{/g)||[]).length;
 assert.equal(count,2); // Desktop rule plus intended narrow-screen override.
 assert.match(css,/display:inline-grid;grid-template-columns:max-content max-content/);
 assert.match(css,/width:fit-content;max-width:100%/);
 assert.match(css,/border:1px solid #a57d4c/);
 assert.match(read('pandora-studio-app.js'),/wt\('Стоимость','Price'\)/);
});

test('Phoenix uses inline help and no browser-native title tooltip',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf("const term=h('span',{class:'wiki-conditional-term'");
 assert.ok(start>=0);
 const snippet=app.slice(start,start+250);
 assert.doesNotMatch(snippet,/title:explanation/);
 assert.match(snippet,/aria-label/);
 assert.match(app,/wiki-phoenix-explanation/);
});

test('elemental tab classifies only actual weapon names, not unrelated items',()=>{
 const weapons=Object.values(items).filter(x=>x.slot==='weapon');
 const fire=weapons.filter(x=>cond.elementOf(x)==='fire');
 assert.ok(fire.some(x=>x.id===452));
 assert.ok(fire.some(x=>x.id===1862));
 assert.equal(cond.elementOf(items['51038']),null);
 assert.equal(cond.elementOf(items['50024']),null);
 for(const id of ['24','1841','2612','2651'])assert.equal(cond.elementOf(items[id]),null,
  'Ordinary or dropped elemental-named weapon is not in the collection: '+id);
 const app=read('pandora-studio-app.js');
 assert.match(app,/Стихийное оружие/);
 assert.match(app,/wiki-elemental-type/);
 assert.match(app,/wikiElementFilter/);
 assert.match(app,/Предметы эффектов/);
 const taxonomy=read('pandora-studio-encyclopedia-data.js');
 assert.match(taxonomy,/EP_RECOVERY_/);
 assert.match(taxonomy,/EP_SKILL_EXEC/);
 assert.match(taxonomy,/EP_DESTINED_POISON/);
 assert.match(app,/wikiEffectFilter/);
 assert.match(app,/wiki-effect-type/);
 assert.match(app,/utilityCategories/);
 assert.doesNotMatch(app,/\['utility',wt\('Предметы эффектов','Effect items'\)\]/);
});

test('Phoenix is shown active only for valid equipped fire-gem +7 weapon',()=>{
 const entry={record:items['452'],refinement:7,gem:{type:'physical',element:'fire'},issue:[]};
 const active=cond.activeFor(entry);
 assert.equal(active.phoenix.stat,'СИЛ');
 assert.equal(active.phoenix.chance,5);
 assert.equal(cond.activeFor({...entry,refinement:6}),null);
 assert.equal(cond.activeFor({...entry,gem:{element:'ice'}}),null);
 assert.equal(cond.activeFor({...entry,issue:['level limit']}),null);
 assert.equal(cond.activeFor({...entry,record:items['51038']}),null);
 const grade7=cond.phoenixDamage(active.phoenix,7,{str:100,int:10});
 const grade8=cond.phoenixDamage(active.phoenix,8,{str:100,int:10});
 const grade10=cond.phoenixDamage(active.phoenix,10,{str:100,int:10});
 assert.deepEqual([grade7.damage,grade8.damage,grade10.damage],[50,100,200]);
 assert.deepEqual([grade7.cooldown,grade8.cooldown,grade10.cooldown],[5,4,2]);
 assert.deepEqual([grade7.chance,grade8.chance,grade10.chance],[5,10,20]);
 assert.equal(cond.phoenixDamage(cond.parse(items['1862']).phoenix,8,{str:100,int:40}).damage,70);
 assert.equal(cond.phoenixDamage(active.phoenix,6,{str:100}),null);
 assert.equal(cond.phoenixDamage(active.phoenix,7,{}),null);
 const app=read('pandora-studio-app.js');
 assert.match(app,/stage-elemental-proc/);
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/PandoraConditionalItemBonuses\?\.activeFor/);
 assert.match(book,/function appendWeaponConditions\(body,calc,items,english\)/);
 assert.match(book,/Пламя феникса/);
 assert.match(book,/phoenixDamage\(/);
 assert.match(book,/calc\?\.stats/);
 assert.match(book,/outcome\.damage/);
});

test('Hero Book owns cure and skill-activating consumables only on Potion chapter',()=>{
 const book=read('pandora-studio-hero-book.js');
 const recover=book.indexOf("if(chosen==='recovery'){");
 assert.ok(recover>0);
 assert.ok(book.includes('const cures=modifiers?.statusCures?.rows||[]'));
 assert.ok(book.includes('const consumableSkills=modifiers?.consumableSkills?.rows||[]'));
 assert.match(book,/if\(chosen==='recovery'\)\{\s*const english=document\.documentElement\?\.lang==='en'/);
 assert.doesNotMatch(book,/if\(chosen==='effects'\)\{\s*const english=document\.documentElement\?\.lang==='en';\s*const cures=/);
 assert.match(book,/function skillEffectsPage\(body/);
 assert.match(book,/const spells=\(modifiers\?\.healingSpells\?\.rows\|\|\[\]\)\.filter\(row=>row\?\.available===true\)/);
});
