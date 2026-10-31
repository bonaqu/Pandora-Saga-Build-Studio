import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
test('OS stun, tumble, burn and other condition resistances read structured item effects',()=>{
 const item={effects:[{func:'EP_IMMUNE_STUN',a:15},
  {func:'EP_IMMUNE_TUMBLE',a:20},{func:'EP_IMMUNE_BURN',a:5}]};
 const effects=calc.gatherEffects([['item:1',item,0]]);
 const rs=calc.resistancePreview({stats:{vit:40,spi:40},bonuses:effects.bonuses});
 assert.equal(rs.status.stun,15);assert.equal(rs.status.tumble,20);
 assert.equal(rs.status.burn,5);
});
test('Soul status immunity min/max gates prevent unearned resistances',()=>{
 const soul={effects:[{func:'EP_IMMUNE_NUMB',a:25,min:5,max:10}]};
 const low=calc.gatherEffects([['soul:1',soul,3]]);
 const high=calc.gatherEffects([['soul:1',soul,7]]);
 assert.equal(low.bonuses.numb??0,0);
 assert.equal(high.bonuses.numb,25);
});
test('physical and mental state resistance combine attributes and equipment',()=>{
 const gear={effects:[{func:'EP_IMMUNE_VIT_TYPE',a:10},
  {func:'EP_IMMUNE_SPI_TYPE',a:7}]};
 const e=calc.gatherEffects([['item:1',gear,0]]);
 const rs=calc.resistancePreview({stats:{vit:56,spi:28},bonuses:e.bonuses});
 assert.equal(rs.states.physical,24);
 assert.equal(rs.states.mental,14);
});
test('incoming critical resistance uses negative modifier, not increased critical chance',()=>{
 const x=calc.gatherEffects([['soul:1',{effects:[{
  func:'EP_CRITICAL_REGIST',a:10}]},0]]);
 const stats={vit:40,str:40,agi:40,dex:40,spi:40,int:40};
 const result=calc.combatPreview({stats,bonuses:x.bonuses,level:40});
 assert.equal(result.criticalIncoming,-10);
});
test('book labels player-friendly status effects rather than exposing raw EP_* codes',()=>{
 const book=read('stage-attributes.js');
 assert.match(book,/Сопротивления состояниям/);
 assert.match(book,/rs\.status/);
 assert.match(book,/Заморозка/);
 assert.match(book,/Пробитие блока/);
});
