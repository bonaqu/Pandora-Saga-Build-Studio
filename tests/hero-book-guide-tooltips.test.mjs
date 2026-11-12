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

test('gameplay hints use the shared delayed tooltip and not browser title attributes',()=>{
 const code=load('pandora-studio-hero-book.js');
 assert.match(code,/PandoraGuideTooltip\?\.attach\(node,hint,\{hoverDelay:650\}\)/);
 assert.match(code,/PandoraGuideTooltip\?\.attach\(info,description,\{hoverDelay:650\}\)/);
 assert.doesNotMatch(code,/\{title:skill\.desc\}/);
 assert.doesNotMatch(code,/row\.setAttribute\('title',kind\)/);
 assert.match(code,/class:'stage-combat-buff-copy'/);
 assert.doesNotMatch(code,/Просмотр отдельных умений по Remaked/);
 assert.doesNotMatch(code,/Skill previews based on Remaked/);
});

test('scrolls reschedule hover help only while the element is still hovered',()=>{
 const src=load('pandora-studio-guide-tooltips.js');
 assert.match(src,/function scheduleHover\(node,show,delay\)/);
 assert.match(src,/node\.isConnected&&node\.matches\(':hover'\)/);
 assert.match(src,/if\(pending\)\{\s*const \{node,show,delay\}=pending/);
});

test('short guide tooltip Escape is handled before the workbench, including pending hover',()=>{
 const src=load('pandora-studio-guide-tooltips.js');
 assert.match(src,/document\.addEventListener\('keydown',event=>\{/);
 assert.match(src,/event\.stopImmediatePropagation\(\)/);
 assert.match(src,/if\(event\.key!=='Escape'\|\|\(!current&&!pending\)\)return/);
 assert.match(src,/pending&&!pending\.node\.contains\(event\.target\)/);
});
