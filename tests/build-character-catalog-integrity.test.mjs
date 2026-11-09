import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-studio-encyclopedia-catalog.js'))(host);
const app=read('pandora-studio-app.js'),a=app.indexOf('async function loadCatalog({archive=false}={})'),
 b=app.indexOf('let ownerWikiRefreshId=0;',a);
assert.ok(a>=0&&b>a,'Character catalog loader must remain inspectable');
const code=app.slice(a,b);
function fixture(){
 return {
  meta:{counts:{classes:1,skills:1,items:1,souls:1,racialPassives:1,unison:1}},
  classes:{CLERIC:{id:1}},
  skills:{1:{id:1,name:'Racial Passive',skillType:'PASSIVE',branch:'race',
   mana:0,reqLevel:0,reqs:[],learnable:true}},
  items:{1:{id:1,name:'Practice sword',W:9,soulslot:1}},
  souls:{1:{id:1,name:'Practice Soul',slots:['weapon'],
   effects:[{func:'EP_TOHIT_CONST',dir:'SELF',a:8,b:0,min:0,max:10}]}},
  racialPassives:{HUMAN:{key:'HUMAN',raceId:1,skills:[1]}},
  unison:{basic:{}},
  tables:{abilityPoint:[],weaponPlus:{},forge:{}},
  itemForth:{}
 };
}
function loader(source,requests){
 const fetcher=async url=>{
  const name=url.split('/').at(-1).replace('.json','');requests.push(name);
  return {ok:true,status:200,headers:{get:key=>
   key==='x-ps-catalog'?'d1':
   key==='x-ps-catalog-snapshot'?'test-snapshot':null},
   json:async()=>structuredClone(source[name])};
 };
 return Function('window','fetch','AbortSignal','API','catalogLoadVersion',
  code+'\nreturn loadCatalog;')(host,fetcher,AbortSignal,'https://worker.invalid',0);
}
test('shared character source validator accepts independent complete fixtures',()=>{
 assert.equal(typeof host.PandoraWikiCatalog.validateCharacterCatalog,'function');
 assert.equal(host.PandoraWikiCatalog.validateCharacterCatalog(fixture()),true);
});
test('build loader rejects malformed D1 equipment, skills, Souls and race links',async()=>{
 const changes=[
  [source=>{source.items[1].W='999'},/Некорректные числовые характеристики предмета/],
  [source=>{source.items[1].soulslot=20},/Некорректная вместимость душ предмета/],
  [source=>{source.skills[1].mana=-5},/Некорректные числовые параметры умения/],
  [source=>{source.skills[1].prereq=999},/Неизвестное предыдущее умение/],
  [source=>{source.souls[1].slots=['weapon','weapon']},/Некорректные слоты души/],
  [source=>{source.souls[1].effects[0].a='8'},/Некорректное число эффекта души/],
  [source=>{source.racialPassives.HUMAN.skills=[999]},/связи расовых пассивок/],
  [source=>{source.items[1].id=2},/Не совпадает идентификатор записи/]
 ];
 for(const [corrupt,reason] of changes){
  const source=fixture();corrupt(source);
  const requests=[],load=loader(source,requests);
  await assert.rejects(load({archive:false}),reason);
  assert.equal(requests.length,9,'All source files must be loaded as one snapshot');
 }
});
test('an explicit offline archive gets the same source integrity checks',async()=>{
 const source=fixture();source.souls[1].price=-1;
 const requests=[];
 await assert.rejects(loader(source,requests)({archive:true}),/Некорректная цена души/);
 assert.ok(requests.includes('souls'));
});
