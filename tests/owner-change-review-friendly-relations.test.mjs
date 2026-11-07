import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const code=readFileSync(new URL('../pandora-studio-owner-change-review.js',import.meta.url),'utf8');
const w={};runInNewContext(code,{window:w});
const inspect=w.PandoraOwnerChangeReview.inspect;
const base={
 meta:{branchLabels:{melee:'Ближний бой'}},
 items:{50:{name:'Ключ стража'},51:{name:'Сапоги странника'}},
 monsters:{300:{name:'Лесной страж',resists:{fire:10,cold:15}}},
 maps:{100:{name:'Лесная тропа'}},
 townMaps:{'astir-kingdom':{name:'Территория королевства'}},
 townNpcs:{'owner-npc-1234567890abcdef':{name:'Мастер сундуков'}},
 trades:{npcs:{12:{name:'Алхимик'}},mapNames:{}},
 skills:{700:{name:'Пробный навык'}}
};
const change=(key,stored)=>inspect(key,JSON.stringify(stored),{base,items:base.items});
const after=(result,field)=>result.changes.find(row=>row.field===field)?.after;
test('location preview uses game names for NPC, drops, sections and tags, not internal IDs',()=>{
 const result=change('wikiedit.map.100',{
  npcs:[12,'owner-npc-1234567890abcdef'],loot:[50,51],
  tags:[{ru:'Опасная зона',en:'Dangerous zone'}],
  sections:['monsters','npcs','loot','notes'],
  extraSections:[{id:'section-a',titleRu:'Секреты пути',titleEn:'Path secrets',
   kind:'item',entries:[50]}],
  roster:[{id:'spawn-a',name:'Ночной патруль',level:40,monsterId:300}]
 });
 assert.equal(after(result,'NPC локации'),'Алхимик, Мастер сундуков');
 assert.equal(after(result,'Добыча'),'Ключ стража, Сапоги странника');
 assert.equal(after(result,'Теги локации'),'Опасная зона');
 assert.equal(after(result,'Разделы локации'),'Монстры, NPC, Добыча, Заметки');
 assert.equal(after(result,'Дополнительные разделы'),'Секреты пути · Предметы');
 assert.equal(after(result,'Расположение монстров'),'Ночной патруль · ур. 40');
 assert.doesNotMatch(result.changes.map(row=>row.after).join(' '),
  /owner-npc-|section-a|spawn-a|\b50\b|\b51\b/);
});
test('monster resistance and skill requirements use translated labels',()=>{
 const monster=change('wikiedit.monster.300',{resists:{fire:15,cold:20}});
 assert.equal(after(monster,'Сопротивления'),'Огонь: +15, Лёд: +20');
 const skill=change('wikiedit.skill.700',{reqs:[{branch:'melee',amount:12}]});
 assert.equal(after(skill,'Требования веток'),'Ближний бой ≥12');
});
test('map and NPC names resolve from non-monster town catalogs',()=>{
 const m=change('wikiedit.npc.owner-npc-1234567890abcdef',
  {maps:['astir-kingdom',100]});
 assert.match(m.title,/Мастер сундуков/);
 assert.equal(after(m,'Локации'),'Территория королевства, Лесная тропа');
});
