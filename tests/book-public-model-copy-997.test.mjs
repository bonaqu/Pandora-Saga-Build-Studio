import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const app=read('pandora-studio-app.js');

test('player Hero Book model explanations are neutral about upstream provenance',()=>{
 for(const old of [
  'Remaked planning model with current OS source parameters.',
  'Модель планирования Remaked с текущими параметрами OS.',
  'Current OS skill unavailable',
  ' (OS model)',' (модель OS)',
  'OS coefficient not calculated for this build.',
  'Коэффициент OS для этого билда не рассчитан.'
 ])assert.ok(!book.includes(old),'no player label: '+old);
 assert.ok(book.includes('Planning model. Final in-game accuracy and evasion are not independently verified.'));
 assert.ok(book.includes('Предварительная модель расчёта. Итоговые точность и уклонение в игре отдельно не подтверждены.'));
 assert.ok(book.includes('No cast speed calculated for this build.'));
 assert.ok(book.includes('(модель)'));
});

test('neutral model hints preserve D1-governed profile authorial copy',()=>{
 assert.ok(app.includes('Nation, honor and rank are not verified against the game server and do not affect calculations.'));
 assert.match(book,/result\.confidence==='legacy-model'/);
 assert.match(book,/data-source-confidence/);
});
