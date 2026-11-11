import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-item-presentation.js'))(root);
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
 assert.equal(after(result,'Location tags'),'Danger');
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

test('chest roll preview translates draw numbering and currency while resolving real item names',()=>{
 const catalog={...base,items:{...base.items,60:{name:'Сундук наград',nameEn:'Reward chest'}},
  chests:{boxes:[{i:60}],npc:[]}};
 const rows=[[{i:50,n:2,p:30},{gold:1000,p:70}]];
 const english=inspect('chestedit.60',JSON.stringify(rows),{base:catalog,lang:'en'});
 const russian=inspect('chestedit.60',JSON.stringify(rows),{base:catalog,lang:'ru'});
 assert.equal(english.title,'Chest · Reward chest');
 assert.equal(after(english,'Chest contents'),'Draw 1: Key ×2 · 30%, Gold · 70%');
 assert.equal(after(russian,'Содержимое сундука'),'Розыгрыш 1: Ключ ×2 · 30%, Золото · 70%');
 assert.doesNotMatch(after(english,'Chest contents'),/Розыгрыш|Золото/);
});
test('compatible equipment and Soul slot previews follow the chosen language',()=>{
 const patch={slots:['weapon','shield','head','belt','ear']};
 assert.equal(after(diff('itemedit.50',patch,'en'),'Compatible slots'),
  'Weapon, Shield, Helmet, Belt, Earring');
 assert.equal(after(diff('itemedit.50',patch,'ru'),'Совместимые слоты'),
  'Оружие, Щит, Шлем, Пояс, Серьга');
});
test('profession names prefer the matching catalog locale and retain safe source fallback',()=>{
 const classes={warrior:{name:'Воин',nameEn:'Warrior'},
  scout:{name:{ru:'Следопыт',en:'Scout'}},
  cleric:{name:'Жрец'},broken:{}};
 const options={base,items:base.items,classes};
 const patch=JSON.stringify({classes:{warrior:true,scout:true,cleric:true,broken:true}});
 const english=inspect('itemedit.50',patch,{...options,lang:'en'});
 const russian=inspect('itemedit.50',patch,{...options,lang:'ru'});
 assert.equal(after(english,'Eligible classes'),'Warrior, Scout, Жрец, broken');
 assert.equal(after(russian,'Доступные классы'),'Воин, Следопыт, Жрец, broken');
});
test('owner history uses human-readable labels for deletion, spawn, sources and custom values',()=>{
 const del=inspect('tradeedit.98',JSON.stringify({deleted:true}),{base,lang:'en'});
 assert.equal(after(del,'Deleted'),'Yes');
 const sources=diff('acquireedit.50',[{type:'item',id:50,p:80}]);
 assert.equal(after(sources,'Item sources'),'Key · 80%');
 const other=inspect('site.accent','#9a8558',{base,lang:'en'});
 assert.equal(after(other,'Value'),'#9a8558');
});

test('item hint history keeps source-backed labels and original hints across mixed-case D1 keys',()=>{
 const cases=[
  ['kind','Item type'],['level','Level'],['w','Attack'],
  ['pen','Penetration'],['ac','Defense'],['atkspeed','Attack speed'],
  ['range','Range'],['soulslot','Soul sockets']
 ];
 for(const [key,label] of cases){
  const field=['w','pen','ac'].includes(key)?key.toUpperCase():key;
  const record=inspect('guideedit.book.wiki.item-field.'+key,
   JSON.stringify({hintRu:'Тестовая подсказка',hintEn:'Custom QA hint'}),
   {base,lang:'en'});
  assert.equal(record.title,'Interface · Item hint: '+label,key);
  assert.equal(record.changes.find(row=>row.field==='English hint')?.before,
   root.PandoraItemPresentation.fieldHint(field,'en',{}),key+' English source');
  assert.equal(record.changes.find(row=>row.field==='Russian hint')?.before,
   root.PandoraItemPresentation.fieldHint(field,'ru',{}),key+' Russian source');
 }
});
