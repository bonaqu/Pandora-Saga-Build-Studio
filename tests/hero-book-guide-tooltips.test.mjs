import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};
Function('window',load('pandora-studio-honor-guide.js'))(host);
const guide=host.PandoraHonorGuide;

test('chapter titles, group headings and unexplained stats have no filler tooltip',()=>{
 for(const lang of ['ru','en']){
  const hint=lang==='ru'?'hintRu':'hintEn';
  assert.equal(guide.field({},'chapter.summary','Результаты расчёта','Calculated results')[hint],'');
  assert.equal(guide.field({},'summary.group.0','Жизнь и восстановление','Vitals and recovery')[hint],'');
  assert.equal(guide.field({},'attack.weaponPhysical','Урон оружия и дальность','Weapon damage and range')[hint],'');
  assert.equal(guide.summary({},999,'Новое поле','New field')[hint],'');
 }
});

test('meaningful RU/EN gameplay help and explicitly edited hints still work',()=>{
 const life=guide.summary({},0,'ОЗ','HP');
 assert.match(life.hintRu,/Очки здоровья/);
 assert.match(life.hintEn,/health/);
 const recovery=guide.field({},'defense.hpRecoverySpeed','Восстановление ОЗ','HP recovery');
 assert.match(recovery.hintRu,/Индекс скорости/);
 assert.match(recovery.hintEn,/index/);
 const edited={'guideedit.book.chapter.summary':JSON.stringify({
  hintRu:'Проверенное объяснение.',hintEn:'Verified explanation.'})};
 const changed=guide.field(edited,'chapter.summary','Результаты расчёта','Calculated results');
 assert.equal(changed.hintRu,'Проверенное объяснение.');
 assert.equal(changed.hintEn,'Verified explanation.');
});

test('the book attaches only meaningful descriptions and retains the owner editor',()=>{
 const code=load('pandora-studio-hero-book.js');
 assert.match(code,/function meaningfulGuideHint\(value\)/);
 assert.match(code,/if\(meaningfulGuideHint\(hint\)\)root\.PandoraGuideTooltip\?\.attach/);
 assert.doesNotMatch(code,/copyOptions,'Название раздела Книги героя\.'/);
 assert.doesNotMatch(code,/'Описание раздела «'\+ru\+'/);
 assert.match(code,/options\.editable&&typeof options\.onTextEdit==='function'/);
 assert.match(code,/guideLabel\(tile\.firstChild,'summary\.'/);
});
