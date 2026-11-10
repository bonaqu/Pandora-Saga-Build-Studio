import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-item-presentation.js'))(root);
const hint=root.PandoraItemPresentation.fieldHint;

test('weapon physical attack tooltip explains what W actually measures (RU/EN)',()=>{
 const ru=hint('W','ru'),en=hint('W','en');
 assert.match(ru,/базовая физическая атака/i);
 assert.equal(ru,'Базовая физическая атака оружия.');
 assert.match(en,/base physical attack/i);
 assert.equal(en,'Base physical attack of the weapon.');
});

test('PEN hint is concise and states only the observed physical ATK spread',()=>{
 const ru=hint('PEN','ru'),en=hint('PEN','en');
 assert.match(ru,/разброс физической атаки/i);
 assert.match(ru,/чем меньше пробитие, тем выше минимум/i);
 assert.match(en,/physical attack spread/i);
 assert.match(en,/lower penetration gives a higher minimum/i);
 assert.doesNotMatch(ru,/защит|брон|не подтверждено|формул/i);
 assert.doesNotMatch(en,/enemy defense|unconfirmed|formula/i);
 assert.doesNotMatch(ru,/точно пробивает|игнорирует защиту/i);
});

test('PEN explanation agrees with observed Zephyr vs Piercing Pike ATK range',()=>{
 const window={};
 Function('window',read('pandora-os-character-calculator.js'))(window);
 const items=JSON.parse(read('data/os/items.json'));
 const calculate=window.PandoraOSCalculator.characterSheetPhysicalAttackRange;
 const zephyr=calculate({maximum:174,weapon:items[1482],
  branchMasteries:{thrust:56}});
 const pike=calculate({maximum:174,weapon:items[1451],
  branchMasteries:{thrust:56}});
 assert.deepEqual([zephyr.pen,zephyr.minimum,zephyr.maximum],[80,150,174]);
 assert.deepEqual([pike.pen,pike.minimum,pike.maximum],[120,136,174]);
 assert.ok(zephyr.minimum>pike.minimum);
});

test('range tooltip explains attack distance, not generic "range of effect" (RU/EN)',()=>{
 assert.equal(hint('range','ru'),'Базовая дальность атаки оружием.');
 assert.equal(hint('range','en'),'Base weapon attack range.');
 assert.doesNotMatch(hint('range','ru'),/^Дальность действия$/);
 assert.doesNotMatch(hint('range','en'),/^Range$/);
});

test('all encyclopedia item-stat hints have language-dependent meaningful fallbacks',()=>{
 for(const key of ['kind','level','W','PEN','AC','atkspeed','range','soulslot']){
  for(const lang of ['ru','en']){
   const value=hint(key,lang);
   assert.equal(typeof value,'string',key+' '+lang);
   assert.ok(value.trim().length>3,key+' '+lang);
   assert.equal(value.includes('<'),false,'tooltips are plain text');
  }
 }
 assert.equal(hint('unknown','ru'),null);
 assert.equal(hint('PEN','en').includes('Пробитие'),false);
 assert.equal(hint('range','en').includes('Дальность'),false);
});

test('item encyclopedia field hover reads centralized translated hints',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/presentation\.fieldHint\(key,lang,override\)/);
 assert.match(app,/presentation\.fieldLabel\(key,lang,override\)/);
 assert.match(app,/saveGuidePatch\('book\.'\+/);
 assert.match(app,/class:'wiki-hint-pencil'/);
 assert.match(app,/caption\.addEventListener\('dblclick',editLabel\)/);
 assert.match(app,/title:hint,class:'wiki-help-word'/);
 assert.doesNotMatch(app,/PEN:'Показатель пробития оружия'/);
 assert.doesNotMatch(app,/range:'Дальность действия'/);
 assert.doesNotMatch(app,/W:'Показатель атаки оружия'/);
});
