import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js'),calc=read('pandora-os-character-calculator.js');
const host={};Function('window','document',book)(host,{documentElement:{lang:'ru'}});
const ui=host.PandoraStageAttributes;
test('auras, elemental magic, and gem effect names are in Attack only',()=>{
 const sample={auraDamage:{elements:{fire:{known:11},ice:{known:4}}},
  elementalMagic:{fire:5},gemstones:{magic:{fire:10},status:{ice:7}}};
 const groups=ui.attackChapterGroups(sample);
 const rows=groups.flatMap(g=>g.rows);
 assert.ok(rows.some(x=>x.key==='aura:fire'&&x.ru.includes('ауры')));
 assert.ok(rows.some(x=>x.key==='magicGem:fire'&&x.en.includes('magic')));
 assert.ok(rows.some(x=>x.key==='magicHonor:fire'));
 assert.ok(rows.some(x=>x.key==='statusChance:ice'));
 assert.ok(!ui.defenseChapterGroups(sample).some(g=>g.rows.some(x=>x.key.startsWith('aura:'))));
 assert.match(book,/const elementTerms=Object\.freeze/);
});
test('potion, skill and mana results use unique chapters and no source equations',()=>{
 const calcHost={};Function('window',calc)(calcHost);
 assert.equal(typeof calcHost.PandoraOSCalculator.potionRecovery,'function');
 for(const term of [
  "row('Леч. зельями','Potion healing',calc?.potion?.percent,'%')",
  "row('Леч. умениями','Skill healing',calc?.healingSkill?.percent,'%')",
  "row('Расход ОМ','MP cost',c.manaCost?.remaining,'%')",
  "en?'Healing skills':'Лечащие умения'"
 ])assert.ok(book.includes(term),term);
 assert.doesNotMatch(book,/stage-combat-quick|Remaining cost index: |База от ИНТ: /);
});
test('unknown official names and custom player text remain unchanged',()=>{
 for(const text of ['Душа несчастья','Великий клинок','Custom name 77',
  'Character ✦ 1','Проклятая броня'])
  assert.equal(ui.bookText(text),text);
 assert.equal(ui.bookText('Расход ОМ'),'Расход ОМ');
});
