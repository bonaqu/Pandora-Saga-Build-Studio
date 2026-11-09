import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-encyclopedia-catalog.js'))(root);
const validate=root.PandoraWikiCatalog.validateCharacterTables;
const original=JSON.parse(read('data/os/tables.json'));
const fixture=()=>structuredClone(original);
const corrupt=change=>{const value=fixture();change(value);return value};

test('verified archive tables pass without rejecting signed forge rates',()=>{
 assert.equal(validate(fixture()),true);
 assert.equal(Object.keys(original.raceInit).length,6);
 assert.equal(Object.keys(original.jobInit).length,4);
 assert.equal(Object.keys(original.weaponPlus).length,10);
 assert.equal(Object.keys(original.magicPlus).length,10);
 assert.ok(original.forge.rates.some(row=>row.weapon<0),
  'Actual OS forge entries are signed and must not be treated as 0–100 chances');
 // OS contains non-integral XP requirements at levels 60–69. Do NOT round
 // these authoritative source values or reject the whole valid dataset.
 assert.ok(!Number.isInteger(original.exp['60'].expReq));
 assert.equal(fixture().exp['60'].expReq,original.exp['60'].expReq);
 assert.match(read('pandora-studio-app.js'),
  /PandoraWikiCatalog\.validateCharacterTables\(data\.tables\)/);
});

test('malformed class/race starting stats and progression cannot become game facts',()=>{
 const bad=[
  [x=>{x.raceInit.ELF.vit='2'},/начальные характеристики/],
  [x=>{x.jobInit.WARRIOR.branches.slash='5'},/стартовое мастерство/],
  [x=>{x.abilityPoint['2']='2'},/таблица очков мастерства/],
  [x=>{x.exp['2'].skill=-1},/прогрессия персонажа/],
  [x=>{x.exp['2'].expReq='50'},/прогрессия персонажа/],
  [x=>{x.exp['60'].expReq=NaN},/прогрессия персонажа/],
  [x=>{x.exp['60'].expReq=-0.5},/прогрессия персонажа/],
  [x=>{x.levelCap=0},/серверный лимит/]
 ];
 for(const [make,reason] of bad)
  assert.throws(()=>validate(corrupt(make)),reason);
});

test('invalid physical/magical enhancement figures are source failures',()=>{
 const bad=[
  [x=>{x.weaponPlus['1'].flat='2'},/таблица бонусов заточки/],
  [x=>{x.magicPlus['2'].ratio=Infinity},/таблица бонусов заточки/],
  [x=>{x.magicPlus['11']={ratio:100,flat:0}},/таблица бонусов заточки/],
  [x=>{x.forge.rates[0].weapon='80'},/ставки кузницы/],
  [x=>{x.forge.rates[1].plus=1},/ставки кузницы/],
  [x=>{x.forge.gemTiers[0].cost=-100},/уровни самоцветов/],
  [x=>{x.forge.rework.durabilityMax='100'},/ремонта и заточки/],
  [x=>{x.forge.hammers[0].effect=''},/молот кузницы/]
 ];
 for(const [make,reason] of bad)
  assert.throws(()=>validate(corrupt(make)),reason);
});

test('missing whole rows are rejected before calculator sees fabricated defaults',()=>{
 const missing=[
  [x=>{delete x.raceInit.ELF},/Неполная таблица начальных характеристик рас/],
  [x=>{delete x.jobInit.SCOUT},/Неполная таблица начальных характеристик профессий/],
  [x=>{delete x.abilityPoint['55']},/Неполная таблица очков мастерства/],
  [x=>{delete x.exp['55']},/Неполная таблица прогрессии персонажа/],
  [x=>{delete x.weaponPlus['7']},/Неполная таблица бонусов заточки/],
  [x=>{delete x.magicPlus['10']},/Неполная таблица бонусов заточки/],
  [x=>{x.forge.rates=x.forge.rates.filter(row=>row.plus!==7)},/Неполная таблица ставок кузницы/],
  [x=>{x.forge.gemTiers=x.forge.gemTiers.filter(row=>row.tier!==3)},/Неполная таблица уровней самоцветов/]
 ];
 for(const [damage,reason] of missing)
  assert.throws(()=>validate(corrupt(damage)),reason);
});

test('future progression and fractional historical experience remain untouched',()=>{
 const source=fixture(),fraction=source.exp['60'].expReq;
 assert.ok(!Number.isInteger(fraction));
 source.exp['100']={...source.exp['99']};
 source.abilityPoint['100']=source.abilityPoint['99'];
 assert.equal(validate(source),true);
 assert.equal(source.exp['60'].expReq,fraction);
 assert.equal(source.levelCap,45,'server limit is not the planner range');
});
