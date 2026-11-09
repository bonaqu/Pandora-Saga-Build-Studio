import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-encyclopedia-catalog.js'))(root);
const validate=root.PandoraWikiCatalog.validateCharacterExtras;
const files=['meta','classes','unison','itemForth','items'];
const original=Object.fromEntries(files.map(name=>[name,
 JSON.parse(read('data/os/'+name+'.json'))]));
const fixture=()=>structuredClone(original);
const corrupt=fn=>{const x=fixture();fn(x);return x};

test('all original professions, unison groups and item refinement rows validate',()=>{
 assert.equal(Object.keys(original.classes).length,28);
 assert.equal(Object.keys(original.unison).length,3);
 assert.equal(Object.keys(original.itemForth).length,162);
 assert.equal(validate(fixture()),true);
 const builder=read('pandora-studio-app.js');
 assert.match(builder,/PandoraWikiCatalog\.validateCharacterExtras\(data\)/);
});

test('broken class HP/MP coefficients and profession chains fail closed',()=>{
 const bad=[
  [x=>{x.classes.WARRIOR.hp.lv='17.1'},/ОЗ\/ОМ профессии/],
  [x=>{x.classes.WARRIOR.mp.spi=Infinity},/ОЗ\/ОМ профессии/],
  [x=>{x.classes.WARRIOR.parent='INVALID'},/цепочка профессий/],
  [x=>{x.classes.WARRIOR.statCaps.vit=120},/предел характеристики/],
  [x=>{x.classes.WARRIOR.branchCaps.slash=-1},/предел ветки/],
  [x=>{x.classes.WARRIOR.id='KNIGHT'},/Некорректная профессия/]
 ];
 for(const [make,reason] of bad)
  assert.throws(()=>validate(corrupt(make)),reason,String(make));
});

test('broken forge effect source cannot silently give a bonus',()=>{
 const entry=Object.keys(original.itemForth)[0],level=Object.keys(original.itemForth[entry])[0];
 const bad=[
  [x=>{x.itemForth[entry][level][0].a='30'},/числовой эффект заточки/],
  [x=>{x.itemForth[entry][level][0].func=''},/эффект заточки предмета/],
  [x=>{x.itemForth[entry][level]={}},/ступень заточки/],
  [x=>{x.itemForth[99999999]={2:[]}},/предмет таблицы заточки/],
  [x=>{x.itemForth[entry]['11']=[]},/ступень заточки/]
 ];
 for(const [make,reason] of bad)
  assert.throws(()=>validate(corrupt(make)),reason,String(make));
});

test('unison combinations require distinct existing pieces and bounded conditions',()=>{
 const first=Object.keys(original.unison)[0];
 const bad=[
  [x=>{x.unison[first].members.push(x.unison[first].members[0])},/предмет комплекта/],
  [x=>{x.unison[first].members[0]=99999999},/предмет комплекта/],
  [x=>{x.unison[first].rows[0].maxC=99},/условия комплекта/],
  [x=>{x.unison[first].rows[0].minL=11},/условия комплекта/],
  [x=>{x.unison[first].rows[0].a.f='0'},/коэффициенты комплекта/],
  [x=>{x.unison[first].rows[0].b.c=NaN},/коэффициенты комплекта/]
 ];
 for(const [make,reason] of bad)
  assert.throws(()=>validate(corrupt(make)),reason,String(make));
});
