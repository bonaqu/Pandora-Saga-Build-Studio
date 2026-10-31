import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};Function('window',get('os-calculator.js'))(root);
const calc=root.PandoraOSCalculator;
test('separate calculated, informational and conditional effect classifications',()=>{
 const item={id:777,name:'Меч',effects:[
  {func:'EP_STRENGTH_CONST',a:4},
  {func:'EP_FIRE_RESISTANCE_CONST',a:5},
  {func:'EP_MOVESPEED_SCALE',a:10},
  {func:'EP_ONHIT_SKILL_EXEC',a:3},
  {func:'EP_MYSTERY_EFFECT',a:1}
 ]};
 const value=calc.effectCoverage({records:[['item:777',item,0]]});
 assert.deepEqual(value.counts,{calculated:2,preview:1,conditional:1,missing:1,inactive:0});
 assert.equal(value.total,5);assert.equal(value.pending.length,2);
});
test('unreached Soul min grade never becomes a false applied effect',()=>{
 const soul={id:11,name:'Душа',effects:[{func:'EP_IMMUNE_STUN',a:20,min:5,max:10}]};
 const c=calc.effectCoverage({records:[['soul:11',soul,3]]});
 assert.equal(c.counts.inactive,1);assert.equal(c.counts.calculated,0);
});
test('grade-specific Forth snapshot is counted once, not text fallback',()=>{
 const item={id:4,name:'Меч +',desc:'За каждые 2 единицы улучшения: ОМ +20',effects:[]};
 const data={'4':{'7':[{func:'EP_MAXMANA_CONST',a:60}]}};
 const c=calc.effectCoverage({records:[['item:4',item,7]],itemForth:data});
 assert.equal(c.counts.calculated,1);assert.equal(c.total,1);
});
test('conditional proc is shown as unresolved, not converted to imaginary crit rate',()=>{
 const item={name:'Лук',effects:[{func:'EP_ONDAMAGE_FIN_DAMAGE_SCALE',a:12}]};
 const c=calc.effectCoverage({records:[['item:bow',item,1]]});
 assert.equal(c.counts.conditional,1);
 assert.equal(c.counts.calculated,0);
});
test('the Summary chapter stays clean, detailed coverage lives only in Effects',()=>{
 const view=get('stage-attributes.js');
 assert.match(view,/modifiers\?\.coverage\?\.total/);
 assert.match(view,/Условные проки/);
 assert.match(view,/\['attack','defense','effects'\]\.includes\(chosen\)/);
 assert.match(view,/Что осталось вне итоговых чисел/);
});
