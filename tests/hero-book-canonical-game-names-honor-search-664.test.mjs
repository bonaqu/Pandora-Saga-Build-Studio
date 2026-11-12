import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const data=path=>JSON.parse(read(path));
const skills=data('data/os/skills.json'),classes=data('data/os/classes.json');
const meta=data('data/os/meta.json'),english=data('data/os/strings.en.json');
const approved=data('data/localization/remaked-skill-identity.v1.json');
const source=read('pandora-studio-hero-book.js'),app=read('pandora-studio-app.js');
const host={};Function('window','document',source)(host,{documentElement:{lang:'ru'}});
const book=host.PandoraStageAttributes;
const gameTerms={skills,classes,branchLabels:meta.branchLabels,
 englishSkills:english.skills,englishClasses:english.classes,
 englishBranches:english.branches};

test('all 327 Remaked-approved mapped skill names retain their OS Russian identity',()=>{
 const entries=Object.entries(approved.skillLabelsById);
 assert.equal(entries.length,327,'Pinned provenance requires 327 approved mappings');
 const abbreviated=new Set(['410003001','410015001','410025001',
  '430054001','440005501']);
 for(const [id,name] of entries){
  assert.ok(skills[id],'Missing pinned OS identity: '+id);
  // Five historical abbreviated resistance labels were deliberately
  // approved for Wiki/Path but are NOT the raw OS game spellings.
  assert.equal(skills[id].name===name,!abbreviated.has(id),
   'Unexpected OS / Remaked spelling divergence: '+id);
  assert.equal(book.gameSkillName(id,'Automatically translated','Auto translated',gameTerms),
   skills[id].name,'Book always respects actual OS game name');
  assert.equal(book.gameSkillName(id,'Wrong','English fallback',gameTerms,true),
   english.skills[id]?.n||'English fallback',
   'Never invent an English name for a skill absent from official EN snapshot: '+id);
 }
});

test('verified branch and profession labels, never inferred names',()=>{
 assert.equal(book.gameBranchName('hymn',gameTerms), 'Песнопения');
 assert.equal(book.gameBranchName('benevolence',gameTerms),'Исцеление');
 assert.equal(book.gameBranchName('blessing',gameTerms),'Благословение');
 assert.equal(book.gameBranchName('hymn',gameTerms,true),'Hymn');
 assert.equal(book.gameClassName('ACOLYTE','Аколит','Acolyte',gameTerms),'Адепт');
 assert.equal(book.gameClassName('CLERIC','Клирик','Cleric',gameTerms),'Клирик');
 assert.equal(book.gameClassName('ACOLYTE','Adепт','Acolyte',gameTerms,true),
  english.classes.ACOLYTE.n);
 assert.equal(book.gameSkillName(330005001,'Other','Other',gameTerms),
  'Природное восстановление');
 assert.equal(book.gameSkillName(330005001,'Other','Other',gameTerms,true),
  'Mana Restore');
 assert.equal(book.gameSkillName(null,'Особый эффект','Custom effect',gameTerms),
  'Особый эффект','Unknown skills must retain authored copy');
});

test('Book receives official skill and class source objects without changing game mechanics',()=>{
 assert.match(app,/gameTerms:\{skills:skillMap,englishSkills:officialEnglish\?\.skills\|\|\{\}/);
 assert.match(app,/branchLabels:catalog\.meta\?\.branchLabels\|\|\{\}/);
 assert.match(app,/classes:catalog\.classes\|\|\{\},englishClasses:officialEnglish\?\.classes\|\|\{\}/);
 assert.match(source,/renderSongSkills\(body,modifiers,gameTerms\)/);
 assert.match(source,/gameClassName\('ACOLYTE','Адепт'/);
 assert.match(source,/gameSkillName\(entry\.id,entry\.name,null,gameTerms,en\)/);
 assert.match(source,/gameSkillName\(row\.skillId\|\|/);
 assert.doesNotMatch(source,/hymn:'Гимны'|benevolence:'Healing',hymn:'Hymns'/,
  'Do not restore ad-hoc English-to-Russian branch translations');
 const defense=book.summaryRows({defense:{known:47}}).flatMap(group=>group.rows);
 assert.ok(defense.some(row=>row.ru==='Защита'),
  "Defense caption must retain its canonical Russian spelling");
 const more=book.defenseChapterGroups({resistances:{status:{stun:12}}});
 assert.equal(more.flatMap(group=>group.rows).find(row=>row.key==='resistStatus:stun')?.ru,
  'Оглушение');
});

test('Honor gets a dedicated input handler before the article-only early return',()=>{
 const appHonor=app.slice(app.indexOf("if(wikiSelection.type==='honor'){",app.indexOf('function renderWiki(')));
 assert.match(appHonor,/searchQuery:wikiSearch/);
 assert.match(appHonor,/search\.addEventListener\('input',\(\)=>/);
 assert.ok(appHonor.indexOf("search.addEventListener('input'")<
  appHonor.indexOf('  return;\n }'),'Input handler must not be behind return');
 const honor=read('pandora-studio-honor-view.js');
 const css=read('pandora-studio-honor.css');
 assert.match(honor,/String\(searchQuery\|\|''\)\.normalize\('NFKC'\)/);
 assert.match(honor,/wiki-honor-monthly-card/);
 assert.match(honor,/wiki-honor-rank/);
 assert.match(honor,/wiki-honor-list-row/);
 assert.match(honor,/honor-search-empty/);
 assert.match(css,/\.wiki-honor-section\[hidden\]/);
 assert.match(css,/\.wiki-honor-monthly-card\[hidden\]/);
});
