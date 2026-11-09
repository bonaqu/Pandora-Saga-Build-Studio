import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const start=source.indexOf('const searchWords=');
const end=source.indexOf('const startupOverlay=',start);
assert.ok(start>=0&&end>start,'Shared search helper must be available before rendering');
const matches=Function(source.slice(start,end)+'; return searchWords;')();

test('search matches reordered words, flexible whitespace, case and NFKC',()=>{
 assert.equal(matches('Рычащий меч','меч Рычащий'),true);
 assert.equal(matches('Туманные холмы','холмы   ТУМАННЫЕ'),true);
 assert.equal(matches('Туманные холмы','Туманные'),true);
 assert.equal(matches('Ёлочный доспех','елочный ДОСПЕХ'),true);
 assert.equal(matches('Two-Handed Sword','sword two-handed'),true);
 assert.equal(matches('Эльф 45-го уровня','Эльф 46'),false);
 assert.equal(matches('Рычащий меч','посох'),false);
 assert.equal(matches('Рычащий меч',''),true);
 assert.equal(matches('Рычащий меч','    '),true);
 assert.equal(matches('Potion №２','№2 potion'),true);
});
test('all player and owner pickers reuse the exact same search semantics',()=>{
 const stage=source.slice(source.indexOf('const draw=()=>{',source.indexOf('function renderStagePicker')),
  source.indexOf('count.textContent=lang===',source.indexOf('function renderStagePicker')));
 assert.ok(stage.includes('searchWords(itemName(rec),stageSlotQuery)'),
  'The equipped-item chooser must not require contiguous search phrases');
 for(const candidate of [
  "searchWords(dataName('item',id),q)",
  'searchWords(dataName(kind,key),q)',
  "searchWords(dataName(isMonster?'monster':'npc',key),q)",
  "searchWords(dataName('npc',npcId),q)",
  "searchWords(dataName('skill',skillId),q)",
  "searchWords(dataName('npc',key),q)",
  "searchWords(row.label+' '+row.value,q)"
 ])assert.ok(source.includes(candidate),'Editor picker diverged: '+candidate);
 assert.match(source,/const matchesWords=searchWords;/,
  'Regular wiki and its editor must use one search rule');
 assert.doesNotMatch(source,/wikiIndex\.normalize\(dataName\([^\n]+\.includes\(q\)/,
  'An editor relation picker still uses contiguous-only matching');
});
