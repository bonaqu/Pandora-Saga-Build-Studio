import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');

test('monster and location forms bind both visible placeholders and accessible labels to unique RU/EN D1 keys',()=>{
 const production=app;
 const creator=production.slice(production.indexOf('const createOwnerMonster='),
  production.indexOf("if(wikiSelection.type==='item'"));
 for(const [prefix,type] of [['createMonster','monster'],['createMap','map']]){
  const ownerType=type==='monster'?'monsterBind':'mapBind';
  for(const locale of ['Ru','En']){
   const field=locale.toLowerCase();
   const aria=prefix+'Name'+locale+'Aria';
   const hint=prefix+'Name'+locale+'Placeholder';
   assert.ok(creator.includes(ownerType+'('+field+",'"+aria+"','aria-label')"));
   assert.ok(creator.includes(ownerType+'('+field+",'"+hint+"','placeholder')"));
  }
  assert.ok(creator.includes("'"+prefix+"Save'"));
  assert.ok(creator.includes("'"+prefix+"Cancel'"));
  assert.ok(creator.includes("'"+prefix+"Required'"));
  assert.ok(creator.includes("'"+prefix+"Failure'"));
  assert.ok(creator.includes("wiki"+(type==='monster'?'Monster':'Map')+"Rows.filter("));
 }
 assert.ok(creator.includes("monsterBind(lvl,")||
  creator.includes("'createMonsterLevelAria','aria-label'"));
});
test('NPC creation on Astir and custom maps uses a single D1-bound bilingual form',()=>{
 for(const snippet of [
  "[ru,'npcNameRu','npcNameRuAria']",
  "[en,'npcNameEn','npcNameEnAria']",
  "[role,'npcService','npcServiceAria']",
  "mapBind(field,placeholder,'placeholder')",
  "mapBind(field,aria,'aria-label')",
  "mapBind(h('button',{type:'button',class:'wiki-owner-remove'}),'npcCancel')",
  "mapCopy('npcRequired')",
  "mapCopy('npcCreateFailure')",
  "if(ownerMap&&rec.virtual)",
  "id,'extraSections',custom",
  "mapBind(ru,'sectionTitleRu','placeholder')",
  "mapBind(en,'sectionTitleEn','placeholder')",
  "mapBind(ru,'sectionTitleRu','aria-label')",
  "mapBind(en,'sectionTitleEn','aria-label')"
 ])assert.ok(app.includes(snippet),'Missing bilingual owner copy binding: '+snippet);
 assert.match(app,/mapBind\(field,aria,'aria-label'\);\s*mapBind\(field,placeholder,'placeholder'\)/,
  'Last field binding must retain its stable semantic placeholder key');
 assert.doesNotMatch(app,/wiki-town-npc-create|astir-npc-'\+city\+'-custom-/);
 const block=app.slice(app.indexOf('const wikiMapRows='),app.indexOf('const wikiMapByKey='));
 for(const key of ['createNpc','npcNameRu','npcNameEn','npcService',
  'npcSave','npcCancel','npcRequired','npcCreateFailure'])
  assert.ok(block.includes('["'+key+'"'),'Missing owner D1 key '+key);
});

test('wiki editor error copy does not expose internal IDs and translates source failures',()=>{
 assert.doesNotMatch(app,/Не удалось создать уникальный ID|No unique ID available|Конфликт ID, попробуй ещё раз|ID collision, please retry/);
 assert.ok(app.includes("monsterCopy('createMonsterFailure')"));
 assert.ok(app.includes("mapCopy('npcCreateFailure')"));
 assert.ok(app.includes("wt('NPC не найден в каталоге','NPC not found in catalog')"));
 assert.ok(app.includes("wt('Проверь названия и связи списка','Check list names and links')"));
});

test('all three creation forms use one reserved ID on retry and guard deleted parent map',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 for(const type of ['monster','map','npc'])
  assert.ok(app.includes("reservedId||(reservedId=reserveWikiOwnerId('"+type+"'))"));
 assert.match(app,/if\(!wikiIndex\.records\('map'\)\?\.\[String\(id\)\]\)/);
 assert.ok(app.includes("monsterCopy('createLinkFailure')"),
  'A partial success must be surfaced rather than creating a second monster');
});

test('creator caption defaults remain unique, bilingual and safe authorial copy',()=>{
 const production=app;
 const map=production.slice(production.indexOf('const wikiMapRows='),
  production.indexOf('const wikiMapByKey='));
 const monster=production.slice(production.indexOf('const wikiMonsterRows='),
  production.indexOf('const wikiMonsterByKey='));
 const capture=block=>[...block.matchAll(/^ \["([^"]+)","([^"]+)","([^"]+)"\],?$/gm)]
  .map(([,key,ru,en])=>({key,ru,en}));
 const a=capture(map).filter(x=>x.key.startsWith('createMap'));
 const b=capture(monster).filter(x=>x.key.startsWith('createMonster'));
 assert.equal(a.length,9);
 assert.equal(b.length,10);
 for(const list of [a,b]){
  assert.equal(new Set(list.map(x=>x.key)).size,list.length);
  for(const {ru,en} of list){assert.ok(ru.trim());assert.ok(en.trim())}
 }
 for(const block of [map,monster])
  assert.doesNotMatch(block,/api\/admin\/override|expectedValue|password|token/,
   'Editorial captions must not include server credentials or mechanics');
});
