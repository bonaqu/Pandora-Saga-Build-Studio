import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-owner-change-review.js'))(root);
const inspect=root.PandoraOwnerChangeReview.inspect;
const base={items:{50:{name:'Ключ',nameEn:'Key'}},
 maps:{100:{name:'Лес',nameEn:'Forest'}},
 trades:{npcs:{12:{name:'Алхимик',nameEn:'Alchemist'}},mapNames:{}},
 monsters:{300:{name:'Страж',nameEn:'Guard'}},
 skills:{700:{name:'Тест',nameEn:'Test'}},
 meta:{branchLabels:{melee:'Ближний бой'}}};
const diff=(key,patch,lang='en')=>inspect(key,JSON.stringify(patch),
 {base,items:base.items,lang,englishBranches:{melee:'Melee'}});
const after=(row,label)=>row.changes.find(x=>x.field===label)?.after;
test('EN review resolves names and field captions without rewriting original Russian source',()=>{
 const result=diff('wikiedit.map.100',{npcs:[12],loot:[50],
  tags:[{ru:'Опасно',en:'Danger'}],sections:['npcs','loot'],
  extraSections:[{titleRu:'Секреты',titleEn:'Secrets',kind:'item'}]});
 assert.equal(result.title,'Location · Forest');
 assert.equal(after(result,'Location NPCs'),'Alchemist');
 assert.equal(after(result,'Loot'),'Key');
 assert.equal(after(result,'Location sections'),'NPCs, Loot');
 assert.equal(after(result,'Location tags'),'Опасно');
 assert.equal(after(result,'Additional sections'),'Secrets · Items');
 assert.doesNotMatch(JSON.stringify(result),/section-a|owner-npc/);
});
test('EN resistance and branch requirements use established English game labels',()=>{
 const r=diff('wikiedit.monster.300',{resists:{fire:15,cold:-20}});
 assert.equal(r.section,'Monster');
 assert.equal(after(r,'Resistances'),'Fire: +15, Ice: -20');
 const s=diff('wikiedit.skill.700',{reqs:[{branch:'melee',amount:12}]});
 assert.equal(after(s,'Branch requirements'),'Melee ≥12');
});
test('RU administrative descriptions remain unchanged',()=>{
 const r=diff('wikiedit.monster.300',{resists:{fire:15}},'ru');
 assert.equal(r.title,'Монстр · Страж');
 assert.equal(after(r,'Сопротивления'),'Огонь: +15');
});
test('owner manager passes selected locale and uses EN interface copy',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function showOverrideManager()');
 const end=app.indexOf('\nfunction allowedArtwork(',start);
 assert.ok(start>=0&&end>start);
 const code=app.slice(start,end);
 assert.match(code,/classes:catalog\?\.classes,lang,englishBranches:/);
 assert.match(code,/All manual edits/);
 assert.match(code,/Restore original/);
 assert.match(code,/Changed fields/);
});
