import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const bookSource=read('pandora-studio-hero-book.js');
const appSource=read('pandora-studio-app.js');
const host={};
Function('window','document',bookSource)(host,{documentElement:{lang:'en'}});
const book=host.PandoraStageAttributes;
const terms={skills,englishSkills:english.skills};

test('all OS skill identities always display canonical RU and matching EN by ID',()=>{
 const ids=Object.keys(skills);
 assert.equal(ids.length,569,'review the checked-in catalog on updates');
 let withEn=0,withoutEn=0;
 for(const id of ids){
  const source=skills[id],translated=english.skills[id]?.n;
  assert.equal(book.gameSkillName(Number(id),'FAKE_RU','FAKE_EN',terms,false),
   source.name,'RU skill '+id);
  if(typeof translated==='string'&&translated.trim()){
   assert.equal(book.gameSkillName(Number(id),'FAKE_RU','FAKE_EN',terms,true),
    translated,'EN skill '+id);
   withEn++;
  }else{
   assert.equal(book.gameSkillName(Number(id),'FAKE_RU','FAKE_EN',terms,true),
    source.name,'missing EN must not trigger an invented translation '+id);
   withoutEn++;
  }
 }
 assert.equal(withEn,553);
 assert.equal(withoutEn,16);
});

test('static allied and self-buff labels use exactly current OS English skill names',()=>{
 for(const [id,expectedRu] of [
  [100052001,'Яростная атака'],
  [260006001,'Помощь ветра'],
  [320004001,'Благословение ветра'],
  [320005001,'Знак жизни'],
  [330051001,'Священное оружие'],
  [430051001,'Темная аура'],
  [310012001,'Пробуждение']
 ]){
  assert.equal(skills[id].name,expectedRu,'source RU ID '+id);
  assert.equal(book.bookText(expectedRu),english.skills[id].n,
   'UI translation must be the official OS English name for '+id);
 }
 assert.equal(book.bookText('Помощь ветра: '),'Speedy Gale: ');
 for(const key of ['combatRage','combatWindAssist','combatWindBlessing','lifeSign'])
  assert.ok(bookSource.includes(key),'player-facing buff control '+key);
});

test('ambiguous dictionary captions stay editorial text, not guessed skill identities',()=>{
 // Multiple skill IDs or page labels share ordinary Russian vocabulary.
 // A generic word must not be globally replaced with one skill's English name.
 assert.equal(book.bookText('Сосредоточенность'),'Concentration');
 assert.equal(english.skills['410000101'].n,'Magical Aid');
 assert.equal(book.gameSkillName(410000101,'',null,terms,true),'Magical Aid');
 assert.equal(book.bookText('Восстановление'),'Recovery');
 assert.equal(english.skills['310022001'].n,'Restoration');
 assert.equal(book.gameSkillName(310022001,'',null,terms,true),'Restoration');
 assert.equal(book.bookText('Яд'),'Poison');
 assert.equal(english.skills['220001001'].n,'Toxify');
 assert.equal(book.gameSkillName(220001001,'',null,terms,true),'Toxify');
 assert.equal(book.bookText('Падение'),'Knockdown');
 assert.equal(english.skills['500000015'].n,'Tripped');
 assert.equal(book.gameSkillName(500000015,'',null,terms,true),'Tripped');
 assert.match(appSource,/englishSkills:officialEnglish\?\.skills\|\|\{\}/);
});

test('missing EN for current OS skills never guesses English from caller-provided text',()=>{
 for(const id of ['121703511','500000047','620002071','700000021']){
  assert.ok(skills[id]?.name);
  assert.equal(english.skills[id]?.n,undefined);
  const guess='Translated by an unverified tool';
  assert.equal(book.gameSkillName(id,'manual RU',guess,terms,true),skills[id].name);
 }
});
