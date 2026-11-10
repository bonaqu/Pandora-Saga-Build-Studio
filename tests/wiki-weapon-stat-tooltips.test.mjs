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
 assert.match(ru,/сил|заточк/i);
 assert.match(en,/base physical attack/i);
 assert.match(en,/STR|refinement/i);
});

test('PEN tooltip explains physical ATK spread, direction, and unverified armor interaction',()=>{
 const ru=hint('PEN','ru'),en=hint('PEN','en');
 assert.match(ru,/разброса физической АТК/i);
 assert.match(ru,/больше число — ниже минимум/i);
 assert.match(ru,/меньше — выше/i);
 assert.match(ru,/защиту цели не подтверждено/i);
 assert.match(en,/physical ATK spread/i);
 assert.match(en,/higher value means a lower minimum/i);
 assert.match(en,/lower value means a higher minimum/i);
 assert.match(en,/enemy defense are unconfirmed/i);
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
 assert.match(hint('range','ru'),/дальность атаки этим оружием/i);
 assert.match(hint('range','en'),/attack range of this weapon/i);
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
 assert.match(app,/PandoraItemPresentation\.fieldHint\(key,lang\)/);
 assert.match(app,/title:hint,class:'wiki-help-word'/);
 assert.doesNotMatch(app,/PEN:'Показатель пробития оружия'/);
 assert.doesNotMatch(app,/range:'Дальность действия'/);
 assert.doesNotMatch(app,/W:'Показатель атаки оружия'/);
});
