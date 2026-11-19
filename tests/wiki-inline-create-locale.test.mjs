import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');

test('monster and location create forms localize all RU/EN text inputs',()=>{
 assert.match(app,/'aria-label':wt\('Название монстра RU','Monster name RU'\),\s*placeholder:wt\('Название · RU','Name · RU'\)/);
 assert.match(app,/'aria-label':wt\('Название монстра EN','Monster name EN'\),\s*placeholder:wt\('Название · EN','Name · EN'\)/);
 assert.match(app,/placeholder:wt\('Название · RU','Name · RU'\),\s*'aria-label':wt\('Название локации на русском','Location name in Russian'\)/);
 assert.match(app,/placeholder:wt\('Название · EN','Name · EN'\),\s*'aria-label':wt\('Название локации на английском','Location name in English'\)/);
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
 assert.doesNotMatch(app,/wiki-town-npc-create|astir-npc-'\+city\+'-custom-/);
 const block=app.slice(app.indexOf('const wikiMapRows='),app.indexOf('const wikiMapByKey='));
 for(const key of ['createNpc','npcNameRu','npcNameEn','npcService',
  'npcSave','npcCancel','npcRequired','npcCreateFailure'])
  assert.ok(block.includes('["'+key+'"'),'Missing owner D1 key '+key);
});

test('wiki editor error copy does not expose internal IDs and translates source failures',()=>{
 assert.doesNotMatch(app,/Не удалось создать уникальный ID|No unique ID available|Конфликт ID, попробуй ещё раз|ID collision, please retry/);
 assert.ok(app.includes("wt('Не удалось создать монстра. Повтори попытку.','Could not create monster. Try again.')"));
 assert.ok(app.includes("wt('Не удалось создать NPC. Повтори попытку.','Could not create NPC. Try again.')"));
 assert.ok(app.includes("wt('NPC не найден в каталоге','NPC not found in catalog')"));
 assert.ok(app.includes("wt('Проверь названия и связи списка','Check list names and links')"));
});
