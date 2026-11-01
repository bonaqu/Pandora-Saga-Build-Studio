import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../stage-attributes.js',import.meta.url),'utf8');
const calc=readFileSync(new URL('../os-calculator.js',import.meta.url),'utf8');
const begin=src.indexOf("if(page==='defense'&&modifiers?.resistances){");
const end=src.indexOf("if(page==='recovery'&&modifiers?.regeneration){",begin);
const body=src.slice(begin,end);
const compact=s=>s.replace(/\s+/g,'');
test('defensive gem grid has every current element and a true bilingual legend',()=>{
 assert.ok(begin>=0&&end>begin);
 for(const [ru,en] of [
  ['Огонь','Fire'],['Лёд','Ice'],['Молния','Lightning'],
  ['Яд','Poison'],['Очарование','Charm'],
  ['Свет','Light'],['Тьма','Dark'],['Магия','Magic']
 ]){
  assert.ok(body.includes("'"+ru+"'"),ru);
  assert.ok(body.includes("'"+en+"'"),en);
 }
 assert.ok(compact(body).includes(compact("const labels=english?")));
 assert.ok(body.includes("english?'From gems: ':'От самоцветов: '"));
 assert.match(body,/\(labels\[key\]\|\|key\)/);
 assert.match(body,/value<0\?' negative':'/);
});
test('all source-backed status resistance labels are localized without replacing IDs',()=>{
 const names={
  burn:['Ожоги','Burn'],stun:['Оглушение','Stun'],
  numb:['Заморозка','Freeze'],tumble:['Падение','Knockdown'],
  knockback:['Отбрасывание','Knockback'],sleep:['Сон','Sleep'],
  silence:['Немота','Silence'],evil:['Зло','Evil'],
  curse:['Слабость/проклятие','Weakness / Curse'],
  disease:['Болезнь','Disease'],madness:['Помешательство','Madness'],
  blockBreak:['Пробитие блока','Block break']
 };
 for(const [key,labels] of Object.entries(names))
  for(const name of labels)assert.ok(
   body.includes(key+":'"+name+"'"),key+': '+name);
 assert.match(body,/Object.entries\(rs.status\|\|\{\}\)/);
 assert.match(body,/const statusNames=english\?/);
 assert.ok(body.includes("english?'Physical damage change: ':'Изменение физического урона: '"));
 assert.ok(body.includes("english?'From gems: ':'От самоцветов: '"));
});
test('no resistances or hero statistics are fabricated or changed by locale',()=>{
 for(const fragment of [
  'rs.wardingPassive','rs.states.physical','rs.states.mental',
  'rs.mitigation.physical','rs.mitigation.physicalFlat',
  'rs.mitigation.magic','rs.physicalReflection',
  'rs.incomingDebuffDurationReduction','rs.damageNegation',
  'Other skills and server immunities are not fully included.'
 ])assert.ok(body.includes(fragment),fragment);
 const root={};Function('window',calc)(root);
 const make=lang=>{
  const target={};Function('window','document',src)(target,{documentElement:{lang}});
  return target.PandoraStageAttributes.bookText;
 };
 for(const name of ['Имя героя 2','Душа несчастья','Слабость/проклятие особое']) {
  assert.equal(make('en')(name),name);
  assert.equal(make('ru')(name),name);
 }
 assert.ok(root.PandoraOSCalculator.resistancePreview);
});
