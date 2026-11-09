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

test('NPC and section form placeholders and aria labels use shared bilingual text',()=>{
 for(const snippet of [
  "placeholder:wt('Название NPC · RU','NPC name · RU')",
  "placeholder:wt('Название NPC · EN','NPC name · EN')",
  "'aria-label':wt('Название нового NPC RU','New NPC name RU')",
  "'aria-label':wt('Название нового NPC EN','New NPC name EN')",
  "'aria-label':wt('Назначение нового NPC','New NPC service')",
  "field(wt('Имя NPC · RU','NPC name · RU'))",
  "field(wt('Имя NPC · EN','NPC name · EN'))",
  "placeholder:wt('Название раздела · RU','Section title · RU')",
  "placeholder:wt('Название раздела · EN','Section title · EN')",
  "'aria-label':wt('Название раздела RU','Section title RU')",
  "'aria-label':wt('Название раздела EN','Section title EN')"
 ])assert.ok(app.includes(snippet),'Not localized: '+snippet);
});

test('wiki editor error copy does not expose internal IDs and translates source failures',()=>{
 assert.doesNotMatch(app,/Не удалось создать уникальный ID|No unique ID available|Конфликт ID, попробуй ещё раз|ID collision, please retry/);
 assert.ok(app.includes("wt('Не удалось создать монстра. Повтори попытку.','Could not create monster. Try again.')"));
 assert.ok(app.includes("wt('Не удалось создать NPC. Повтори попытку.','Could not create NPC. Try again.')"));
 assert.ok(app.includes("wt('NPC не найден в каталоге','NPC not found in catalog')"));
 assert.ok(app.includes("wt('Проверь названия и связи списка','Check list names and links')"));
});
