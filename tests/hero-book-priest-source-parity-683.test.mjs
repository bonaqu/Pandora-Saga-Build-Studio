import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const book=read('pandora-studio-hero-book.js');

test('legacy and current OS priest magnitudes disagree; only OS values reach the rendered preview',()=>{
 const legacy=C.legacyBuffPreview({spi:134,blessing:90,hymn:30});
 const current=C.priestCastPreviews({spi:134,blessing:90,hymn:30,skills});
 assert.equal(legacy.gratia.value,20);
 assert.equal(current.gratia,22);
 assert.deepEqual([current.gratia,current.lapisMedio,current.encouragement,
  current.groupBarrier,current.holyWeapon,current.minstrel,current.sage],
  [22,12,9,-28,10,24,16]);
 const section=book.slice(book.indexOf('if(modifiers?.priestCast&&buffs.priestEnabled===true)'),
  book.indexOf('// Use the same exact OS icon resolution'));
 assert.ok(section.includes('const value=priestValues[id]'));
 assert.ok(!section.includes('modifiers.legacyBuffs[id]'));
 assert.ok(section.includes("'data-priest-preview':id"));
 assert.ok(section.includes("!verified?'—'"));
 assert.ok(section.includes("'СИЛ +'"));
 assert.ok(section.includes("'Точность +'"));
 assert.ok(!section.includes("['toxify'"));
 assert.ok(!section.includes("['toxicAura'"));
});

test('invalid OS skill parameters cannot be presented as verified priest bonuses',()=>{
 const forged=structuredClone(skills);
 forged['320007001'].funcs.find(f=>f.ep==='EP_ATTACKINTERVAL_SCALE').fv1[0]=99;
 const values=C.priestCastPreviews({spi:134,blessing:90,hymn:30,skills:forged});
 assert.equal(values.gratia,null);
 assert.equal(values.lapisMedio,12);
});

test('the support potency labels stay bilingual for every OS-valued or unknown row',()=>{
 for(const [ru,en] of [
  ['Получаемый физ./маг. урон','Incoming physical/magic damage'],
  ['Святая аура оружия','Holy weapon aura'],
  ['Урон тьмой','Dark damage'],
  ['Магическая атака','Magic attack'],
  ['Аура оружия','Weapon aura'],
  ['Стихийный урон','Elemental damage']
 ])assert.ok(book.includes("'"+ru+"': '"+en+"'"),ru);
});
