import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const manifest=buildEditorialDefaultsManifest();
const digest=rows=>createHash('sha256')
 .update(JSON.stringify({schema:1,release:manifest.release,records:rows}),'utf8')
 .digest('hex');
const records=()=>manifest.records.map(row=>({...row}));
function fixture(patches=[]){
 const rows=records();
 for(const [recordKey,field,value] of patches){
  const index=rows.findIndex(row=>row.recordKey===recordKey&&row.field===field);
  assert.ok(index>=0,'Missing source default: '+recordKey+'/'+field);
  rows[index].value=value;
 }
 const checksum=digest(rows);
 return {schema:1,release:manifest.release,records:rows,
  sha256:checksum,snapshot:manifest.release+'-'+checksum.slice(0,16)};
}
function context(){
 const root={};
 const scope={window:root,crypto:webcrypto,TextEncoder,Uint8Array,URL};
 for(const path of [
  'pandora-studio-editorial-defaults-client.js',
  'pandora-studio-hero-book.js',
  'pandora-studio-ui-locale.js',
  'pandora-studio-honor-guide.js',
  'pandora-studio-wiki-labels.js'
 ])runInNewContext(read(path),scope,{filename:path,timeout:5000});
 return root;
}
const expectPlain=obj=>JSON.parse(JSON.stringify(obj));

test('#390 staged D1 client is inert until explicit verified version activation',async()=>{
 const root=context();
 const stage=root.PandoraEditorialDefaults;
 const ui=root.PandoraUILocale;
 assert.deepEqual(expectPlain(stage.status()),{active:false,snapshot:null});
 assert.equal(stage.value('guideedit.wiki.labels','honor_victories_ru'),null);
 assert.equal(ui.text('wiki','ru'),ui.baseText('wiki','ru'));
 const payload=fixture();
 assert.equal(await stage.installVerified(payload,payload.snapshot,webcrypto.subtle),true);
 assert.deepEqual(expectPlain(stage.status()),{active:true,snapshot:payload.snapshot});
 assert.equal(stage.value('guideedit.wiki.labels','honor_victories_ru'),'Победы в PvP');
 stage.reset();
 assert.deepEqual(expectPlain(stage.status()),{active:false,snapshot:null});
});

test('#390 comparison author copy respects verified staging and prior owner CAS',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,locale=root.PandoraUILocale;
 const id='guideedit.book.'+locale.fieldKey('compareStatColumn');
 const payload=fixture([[id,'ru','Параметр · staging'],[id,'en','Metric · staging']]);
 assert.equal(await stage.installVerified(payload,payload.snapshot,webcrypto.subtle),true);
 assert.equal(locale.text('compareStatColumn','ru'),'Параметр · staging');
 assert.equal(locale.text('compareStatColumn','en'),'Metric · staging');
 locale.setOverrides({[id]:JSON.stringify({ru:'Показатель владельца'})});
 assert.equal(locale.text('compareStatColumn','ru'),'Показатель владельца');
 assert.equal(locale.text('compareStatColumn','en'),'Metric · staging');
 locale.setOverrides({});
 stage.reset();
 assert.equal(locale.text('compareStatColumn','ru'),'Характеристика');
 assert.equal(locale.text('compareStatColumn','en'),'Stat');
});

test('#390 profile field captions prefer CAS over verified staging text without touching hero data',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const name='guideedit.book.profile.field-name';
 const bio='guideedit.book.profile.bio-placeholder';
 const payload=fixture([
  [name,'ru','Позывной · staging'],
  [name,'en','Call sign · staging'],
  [bio,'en','Your character notes · staging']
 ]);
 assert.equal(await stage.installVerified(payload,payload.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'profile.field-name','Имя героя','Hero name').ru,
  'Позывной · staging');
 assert.equal(guide.field({},'profile.field-name','Имя героя','Hero name').en,
  'Call sign · staging');
 assert.equal(guide.field({},'profile.bio-placeholder',
  'Описание героя — сохраняется в билде',
  'Hero bio — saved with the build').en,'Your character notes · staging');
 const override={[name]:JSON.stringify({ru:'Имя · владелец'})};
 assert.equal(guide.field(override,'profile.field-name','Имя героя','Hero name').ru,
  'Имя · владелец');
 assert.equal(guide.field(override,'profile.field-name','Имя героя','Hero name').en,
  'Call sign · staging');
 stage.reset();
 assert.equal(guide.field({},'profile.field-name','Имя героя','Hero name').ru,'Имя героя');
});

test('#390 verified equipment summary defaults are below existing owner CAS',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const key='guideedit.book.equipment.field.soul-compatible';
 const hint='guideedit.book.equipment.hint.souls';
 const patched=fixture([
  [key,'ru','Совместимые слоты · staging'],
  [key,'en','Compatible slots · staging'],
  [hint,'en','Manage Soul sockets · staging']
 ]);
 assert.equal(await stage.installVerified(patched,patched.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'equipment.field.soul-compatible',
  'Подходящие слоты','Compatible slots').ru,'Совместимые слоты · staging');
 assert.equal(guide.field({},'equipment.hint.souls',
  'Вставить, заменить или снять душу.','Insert, replace or remove a Soul.').en,
  'Manage Soul sockets · staging');
 const override={[key]:JSON.stringify({ru:'Редактура владельца'})};
 assert.equal(guide.field(override,'equipment.field.soul-compatible',
  'Подходящие слоты','Compatible slots').ru,'Редактура владельца');
 assert.equal(guide.field(override,'equipment.field.soul-compatible',
  'Подходящие слоты','Compatible slots').en,'Compatible slots · staging');
 stage.reset();
 assert.equal(guide.field({},'equipment.field.soul-compatible',
  'Подходящие слоты','Compatible slots').ru,'Подходящие слоты');
});

test('#390 verified Soul-unavailable defaults stay below CAS without changing actual socket rules',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const id='guideedit.book.equipment.soul-unavailable-zero.weapon';
 const fallback='Управление душами этого оружия недоступно: 0 слотов для душ.';
 const en='Soul management for this weapon is unavailable: 0 Soul slots.';
 const patched=fixture([[id,'ru','Недоступно для этого оружия · staging']]);
 assert.equal(await stage.installVerified(patched,patched.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'equipment.soul-unavailable-zero.weapon',fallback,en).ru,
  'Недоступно для этого оружия · staging');
 const override={[id]:JSON.stringify({ru:'Редактура владельца'})};
 assert.equal(guide.field(override,'equipment.soul-unavailable-zero.weapon',fallback,en).ru,
  'Редактура владельца');
 stage.reset();
 assert.equal(guide.field({},'equipment.soul-unavailable-zero.weapon',fallback,en).ru,
  fallback);
});

test('#390 pinned context menu and Origin captions never outrank existing CAS edits',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const contextKey='guideedit.book.equipment.context.remove';
 const originKey='guideedit.book.origin.tab-race';
 const patched=fixture([
  [contextKey,'ru','Снять предмет · staging'],
  [originKey,'en','Hero race · staging']
 ]);
 assert.equal(await stage.installVerified(patched,patched.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'equipment.context.remove','Снять вещь','Unequip item').ru,
  'Снять предмет · staging');
 assert.equal(guide.field({},'origin.tab-race','Раса','Race').en,
  'Hero race · staging');
 const override={[originKey]:JSON.stringify({en:'Race · owner'})};
 assert.equal(guide.field(override,'origin.tab-race','Раса','Race').en,'Race · owner');
 stage.reset();
 assert.equal(guide.field({},'origin.tab-race','Раса','Race').en,'Race');
});

test('#390 D1 selection-list captions preserve author overrides and keep game counts out of copy',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const id='guideedit.book.equipment.picker-match-suffix';
 const payload=fixture([[id,'en','compatible · staging']]);
 assert.equal(await stage.installVerified(payload,payload.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'equipment.picker-match-suffix','подходящих','matching').en,
  'compatible · staging');
 const custom={[id]:JSON.stringify({en:'matches · owner'})};
 assert.equal(guide.field(custom,'equipment.picker-match-suffix','подходящих','matching').en,
  'matches · owner');
 stage.reset();
 assert.equal(guide.field({},'equipment.picker-match-suffix','подходящих','matching').en,
  'matching');
});

test('#390 verified Wiki map authored headings yield to established owner CAS and reset',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const id='guideedit.book.wiki.map.text.tags';
 const patched=fixture([[id,'en','Location topics · staging']]);
 assert.equal(await stage.installVerified(patched,patched.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'wiki.map.text.tags','Теги локации','Location tags').en,
  'Location topics · staging');
 const overrides={[id]:JSON.stringify({en:'Tags · owner'})};
 assert.equal(guide.field(overrides,'wiki.map.text.tags','Теги локации','Location tags').en,
  'Tags · owner');
 stage.reset();
 assert.equal(guide.field({},'wiki.map.text.tags','Теги локации','Location tags').en,
  'Location tags');
});

test('#390 source-verified monster and chest labels stay below existing owner CAS',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const monster='guideedit.book.wiki.monster.text.stat-level';
 const chest='guideedit.book.wiki.chest.text.open-heading';
 const staged=fixture([
  [monster,'en','Monster tier · staging'],
  [chest,'ru','Сундук: открытие · staging']
 ]);
 assert.equal(await stage.installVerified(staged,staged.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'wiki.monster.text.stat-level','Уровень','Level').en,
  'Monster tier · staging');
 assert.equal(guide.field({},'wiki.chest.text.open-heading',
  'Как открыть сундук','How to open this chest').ru,'Сундук: открытие · staging');
 const overrides={[chest]:JSON.stringify({ru:'Сундук: автор'})};
 assert.equal(guide.field(overrides,'wiki.chest.text.open-heading',
  'Как открыть сундук','How to open this chest').ru,'Сундук: автор');
 stage.reset();
 assert.equal(guide.field({},'wiki.chest.text.open-heading',
  'Как открыть сундук','How to open this chest').ru,'Как открыть сундук');
});

test('#390 verified Path/Honor RU/EN defaults remain subordinate to existing owner CAS',async()=>{
 const root=context(),staging=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const pathKey='guideedit.book.path.innate-baseline-label';
 const honorKey='guideedit.book.honor-view.sections-heading';
 const payload=fixture([
  [pathKey,'en','Initial points · staging:'],
  [honorKey,'ru','Разделы чести · staging']
 ]);
 assert.equal(await staging.installVerified(payload,payload.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'path.innate-baseline-label',
  'Начально (оч.):','Initially (pts):').en,'Initial points · staging:');
 assert.equal(guide.field({},'honor-view.sections-heading',
  'Разделы','Sections').ru,'Разделы чести · staging');
 const overrides={
  [pathKey]:JSON.stringify({en:'Initial points · owner:'}),
  [honorKey]:JSON.stringify({ru:'Разделы · владелец'})
 };
 assert.equal(guide.field(overrides,'path.innate-baseline-label',
  'Начально (оч.):','Initially (pts):').en,'Initial points · owner:');
 assert.equal(guide.field(overrides,'honor-view.sections-heading',
  'Разделы','Sections').ru,'Разделы · владелец');
 staging.reset();
 assert.equal(guide.field({},'path.innate-baseline-label',
  'Начально (оч.):','Initially (pts):').en,'Initially (pts):');
 assert.equal(guide.field({},'honor-view.sections-heading',
  'Разделы','Sections').ru,'Разделы');
});

test('#390 versioned Honor PvP and rank-phrase defaults keep owner CAS and live numbers separate',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const column='guideedit.book.honor-view.pvp-daily-column0';
 const requirement='guideedit.book.honor-view.rank-req-top-lead';
 const payload=fixture([
  [column,'en','Victories · staging'],
  [requirement,'ru','Для ранга попадите в топ · staging']
 ]);
 assert.equal(await stage.installVerified(payload,payload.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'honor-view.pvp-daily-column0',
  'Победы за день','Daily victories').en,'Victories · staging');
 assert.equal(guide.field({},'honor-view.rank-req-top-lead',
  'Для получения ранга необходимо находиться в топ',
  'To earn this rank, finish in your nation’s top').ru,
  'Для ранга попадите в топ · staging');
 const overrides={[requirement]:JSON.stringify({ru:'Для ранга — в топ · owner'})};
 assert.equal(guide.field(overrides,'honor-view.rank-req-top-lead',
  'Для получения ранга необходимо находиться в топ',
  'To earn this rank, finish in your nation’s top').ru,
  'Для ранга — в топ · owner');
 stage.reset();
 assert.equal(guide.field({},'honor-view.pvp-daily-column0',
  'Победы за день','Daily victories').en,'Daily victories');
});

test('#390 staged conditional Path copy preserves CAS and does not transport calculated points',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const group='guideedit.book.path.path-group-trained';
 const count='guideedit.book.path.skill-count-many';
 const payload=fixture([
  [group,'en','trained · staging'],
  [count,'ru','освоенных умений · staging']
 ]);
 assert.equal(await stage.installVerified(payload,payload.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'path.path-group-trained','освоено','trained').en,
  'trained · staging');
 assert.equal(guide.field({},'path.skill-count-many','умений','skills').ru,
  'освоенных умений · staging');
 const overrides={[group]:JSON.stringify({en:'mastered · owner'})};
 assert.equal(guide.field(overrides,'path.path-group-trained','освоено','trained').en,
  'mastered · owner');
 stage.reset();
 assert.equal(guide.field({},'path.skill-count-many','умений','skills').ru,
  'умений');
});

test('#390 Path accessibility and hover copy honors pinned staging, owner CAS and reset',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const label='guideedit.book.path.skill-previous-aria';
 const help='guideedit.book.path.branch-point-help';
 const staged=fixture([
  [label,'en','Previous ability · staging:'],
  [help,'ru','Как вкладывать очки · staging']
 ]);
 assert.equal(await stage.installVerified(staged,staged.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'path.skill-previous-aria',
  'Предыдущее умение:','Previous skill:').en,'Previous ability · staging:');
 assert.equal(guide.field({},'path.branch-point-help',
  'Очки умений, распределяемые при развитии персонажа.',
  'Skill points allocated as the character develops.').ru,
  'Как вкладывать очки · staging');
 const owner={[help]:JSON.stringify({ru:'Подсказка владельца'})};
 assert.equal(guide.field(owner,'path.branch-point-help',
  'Очки умений, распределяемые при развитии персонажа.',
  'Skill points allocated as the character develops.').ru,
  'Подсказка владельца');
 stage.reset();
 assert.equal(guide.field({},'path.skill-previous-aria',
  'Предыдущее умение:','Previous skill:').en,'Previous skill:');
});

test('#390 Path requirement captions and unlock states use verified bilingual fallback beneath CAS',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const req='guideedit.book.path.path-req-threshold';
 const unlock='guideedit.book.path.path-unlock-ready';
 const payload=fixture([
  [req,'ru','Условие: · staging'],
  [unlock,'en','available · staging']
 ]);
 assert.equal(await stage.installVerified(payload,payload.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'path.path-req-threshold','порог','threshold').ru,
  'Условие: · staging');
 assert.equal(guide.field({},'path.path-unlock-ready','доступно','available').en,
  'available · staging');
 const owner={[req]:JSON.stringify({ru:'Порог · owner'})};
 assert.equal(guide.field(owner,'path.path-req-threshold','порог','threshold').ru,
  'Порог · owner');
 stage.reset();
 assert.equal(guide.field({},'path.path-unlock-ready','доступно','available').en,
  'available');
});

test('#390 real Workbench hover text has verified default below owner CAS',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const id='guideedit.book.equipment.hint-portrait';
 const patched=fixture([[id,'ru','Книга героя · staging']]);
 assert.equal(await stage.installVerified(patched,patched.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'equipment.hint-portrait',
  'Открыть Книгу героя с рассчитанными характеристиками.',
  'Open the Hero Book with calculated stats.').ru,'Книга героя · staging');
 const owner={[id]:JSON.stringify({ru:'Книга героя · автор'})};
 assert.equal(guide.field(owner,'equipment.hint-portrait',
  'Открыть Книгу героя с рассчитанными характеристиками.',
  'Open the Hero Book with calculated stats.').ru,'Книга героя · автор');
 stage.reset();
 assert.equal(guide.field({},'equipment.hint-portrait',
  'Открыть Книгу героя с рассчитанными характеристиками.',
  'Open the Hero Book with calculated stats.').ru,
  'Открыть Книгу героя с рассчитанными характеристиками.');
});

test('#390 Wiki result-count labels and the Skills search placeholder stay below owner CAS',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const wiki='guideedit.book.wiki-ui.results-shown';
 const skill='guideedit.book.skill-ui.search-placeholder';
 const data=fixture([
  [wiki,'ru','Найдено · staging'],
  [skill,'en','Search abilities · staging']
 ]);
 assert.equal(await stage.installVerified(data,data.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'wiki-ui.results-shown','Показано','Showing').ru,
  'Найдено · staging');
 assert.equal(guide.field({},'skill-ui.search-placeholder','Найти умение','Find skill').en,
  'Search abilities · staging');
 const overrides={[wiki]:JSON.stringify({ru:'Найдено · владелец'})};
 assert.equal(guide.field(overrides,'wiki-ui.results-shown','Показано','Showing').ru,
  'Найдено · владелец');
 stage.reset();
 assert.equal(guide.field({},'wiki-ui.results-shown','Показано','Showing').ru,
  'Показано');
});

test('#390 staging text uses only exact semantic identities and CAS outranks defaults',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults;
 const ui=root.PandoraUILocale,guide=root.PandoraHonorGuide,wiki=root.PandoraWikiLabels;
 const key=ui.bookFieldKey('Выбранные усиления'),id=ui.fieldKey(key);
 const uiRecord='guideedit.book.'+id;
 const changed=fixture([
  [uiRecord,'ru','Выбранные усиления · staging'],
  [uiRecord,'en','Configured enhancements · staging'],
  ['guideedit.wiki.labels','honor_victories_ru','Победы PvP · staging'],
  ['guideedit.wiki.labels','honor_victories_en','PvP Victories · staging'],
  ['guideedit.honor.overview','overviewRu','Описание чести · staging'],
  ['guideedit.honor.rank.0','benefitEn','Rank reward · staging'],
  ['guideedit.book.attack.mountedToggle','hintRu','Настоящая подсказка · staging'],
  ['guideedit.book.wiki.item-field.pen','hintRu','Пробитие · staging'],
  ['guideedit.book.equipment.tab.choose','en','Choose gear · staging']
 ]);
 assert.equal(await stage.installVerified(changed,changed.snapshot,webcrypto.subtle),true);
 assert.equal(ui.text(key,'ru'),'Выбранные усиления · staging');
 assert.equal(ui.text(key,'en'),'Configured enhancements · staging');
 assert.equal(ui.baseText(key,'ru'),'Выбранные усиления',
  'Versioned source fallback remains stable for SQL generation');
 assert.equal(wiki.value({},'honor','victories','ru'),'Победы PvP · staging');
 assert.equal(wiki.value({},'honor','victories','en'),'PvP Victories · staging');
 assert.equal(guide.article({}).overview.overviewRu,'Описание чести · staging');
 assert.equal(guide.article({}).ranks[0].benefitEn,'Rank reward · staging');
 assert.equal(guide.field({},'attack.mountedToggle','Верхом','Mounted').hintRu,
  'Настоящая подсказка · staging');
 assert.equal(guide.field({},'wiki.item-field.pen','Пробитие','Penetration',
  'Original item description','Original item hint').hintRu,'Пробитие · staging');
 assert.equal(guide.field({},'equipment.tab.choose','Выбрать другую вещь',
  'Choose another item').en,'Choose gear · staging');

 ui.setOverrides({[uiRecord]:JSON.stringify({ru:'Редактура владельца'})});
 assert.equal(ui.text(key,'ru'),'Редактура владельца');
 assert.equal(ui.text(key,'en'),'Configured enhancements · staging',
  'An RU-only override must not erase the staged EN fallback');
 assert.equal(wiki.value({'guideedit.wiki.labels':JSON.stringify({
  honor_victories_ru:'Победы владельца'
 })},'honor','victories','ru'),'Победы владельца');
 assert.equal(guide.article({'guideedit.honor.overview':JSON.stringify({
  overviewRu:'Честь владельца'
 })}).overview.overviewRu,'Честь владельца');
 assert.equal(guide.field({'guideedit.book.attack.mountedToggle':
  JSON.stringify({hintRu:'Подсказка владельца'})},
 'attack.mountedToggle','Верхом','Mounted').hintRu,'Подсказка владельца');
 assert.equal(guide.article({'guideedit.honor.rank.0':JSON.stringify({
  benefitEn:'Owner rank benefit'
 })}).ranks[0].benefitEn,'Owner rank benefit');

 stage.reset();
 ui.setOverrides({});
 assert.equal(ui.text(key,'ru'),'Выбранные усиления');
 assert.equal(wiki.value({},'honor','victories','ru'),'Победы в PvP');
 assert.equal(guide.article({}).overview.overviewRu,guide.intro.overviewRu);
});

test('#390 staged frontend rejects corrupt, stale, unapproved or gameplay keys',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults;
 const first=fixture();
 const wrong=fixture([['guideedit.wiki.labels','honor_victories_en','Edited translation']]);
 assert.equal(await stage.installVerified(first,first.snapshot,webcrypto.subtle),true);
 for(const invalid of [
  {...wrong,snapshot:first.snapshot},
  {...wrong,sha256:first.sha256,snapshot:first.snapshot},
  {...first,records:first.records.slice(1)},
  {...first,records:[first.records[0],...first.records.slice(0,-1)]},
  {...first,records:first.records.map((r,i)=>i===1?
   {...r,recordKey:'guideedit.book.game.damage.17'}:r)},
  {...first,records:first.records.map((r,i)=>i===1?
   {...r,field:'amount'}:r)}
 ]){
  assert.equal(await stage.installVerified(invalid,first.snapshot,webcrypto.subtle),
   false,'Malformed staging data must never be activated');
  assert.equal(stage.status().snapshot,first.snapshot,
   'Invalid input does not replace the last verified data');
 }
 assert.equal(await stage.installVerified(first,'1.2.3-deadbeefdeadbeef',
  webcrypto.subtle),false);
 assert.equal(stage.status().snapshot,first.snapshot);
});

test('#390 stale async verification cannot re-activate defaults after reset',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults;
 const payload=fixture();
 let proceed;
 const subtle={digest:()=>new Promise(resolve=>{proceed=resolve})};
 const pending=stage.installVerified(payload,payload.snapshot,subtle);
 // Let the pending digest take its turn in the event loop.
 await Promise.resolve();
 assert.equal(typeof proceed,'function');
 stage.reset();
 const checksum=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(
  JSON.stringify({schema:1,release:payload.release,records:payload.records})));
 proceed(checksum);
 assert.equal(await pending,false);
 assert.equal(stage.status().active,false);
});

test('#390 explicit staging fetch pins exact digest and never sends credentials',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,payload=fixture();
 const requests=[];
 const fetcher=async(url,options)=>{
  requests.push({url,options});
  return {ok:true,json:async()=>payload};
 };
 assert.equal(await stage.loadPinned(payload.snapshot,{
  endpoint:'https://staging.example/api/editorial-defaults',
  fetcher,subtle:webcrypto.subtle}),true);
 assert.equal(stage.status().snapshot,payload.snapshot);
 assert.equal(requests.length,1);
 assert.equal(requests[0].url,
  'https://staging.example/api/editorial-defaults?snapshot='+payload.snapshot);
 assert.deepEqual(expectPlain(requests[0].options),{
  method:'GET',credentials:'omit',cache:'no-store',redirect:'error'
 });
 for(const endpoint of [
  'http://staging.example/api/editorial-defaults',
  'https://username:secret@staging.example/api/editorial-defaults',
  'https://staging.example/api/editorial-defaults?latest=1',
  'https://staging.example/api/overrides',
  'https://staging.example/api/editorial-defaults#token',
  '//staging.example/api/editorial-defaults'
 ]){
  assert.equal(await stage.loadPinned(payload.snapshot,{
   endpoint,fetcher,subtle:webcrypto.subtle}),false,endpoint);
 }
 assert.equal(requests.length,1,
  'No network requests to unpinned, insecure or credential-bearing URLs');
 assert.equal(await stage.loadPinned('latest',{endpoint:
  'https://staging.example/api/editorial-defaults',fetcher}),false);
 assert.equal(requests.length,1);
});

test('#390 delayed staging responses cannot overtake reset or a newer version',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,payload=fixture();
 let resolveOld;
 const fetcher=async()=>new Promise(resolve=>{resolveOld=resolve});
 const slow=stage.loadPinned(payload.snapshot,{
  endpoint:'https://staging.example/api/editorial-defaults',
  fetcher,subtle:webcrypto.subtle});
 const faster=stage.loadPinned(payload.snapshot,{
  endpoint:'https://staging.example/api/editorial-defaults',
  fetcher:async()=>({ok:true,json:async()=>payload}),
  subtle:webcrypto.subtle});
 assert.equal(await faster,true);
 resolveOld({ok:true,json:async()=>payload});
 assert.equal(await slow,false,'Older staged request cannot replace newer verified data');
 assert.equal(stage.status().snapshot,payload.snapshot);
 const unavailable=await stage.loadPinned(payload.snapshot,{
  endpoint:'https://staging.example/api/editorial-defaults',
  fetcher:async()=>({ok:false,status:503}),
  subtle:webcrypto.subtle});
 assert.equal(unavailable,false);
 assert.equal(stage.status().snapshot,payload.snapshot,
  'A failed fetch never discards the previously verified snapshot');
});

test('#390 no implicit network fetch, Worker mutation or editor pencil is added',()=>{
 const stage=read('pandora-studio-editorial-defaults-client.js');
 const html=read('index.html'),worker=read('worker/index.js');
 const locale=read('pandora-studio-ui-locale.js');
 const honor=read('pandora-studio-honor-guide.js');
 const wiki=read('pandora-studio-wiki-labels.js');
 assert.match(html,/pandora-studio-editorial-defaults-client\.js/);
 assert.match(locale,/PandoraEditorialDefaults\?\.value/);
 assert.match(honor,/function stagedFallback\(/);
 assert.match(wiki,/PandoraEditorialDefaults\?\.value/);
 assert.doesNotMatch(stage,/fetch\(|XMLHttpRequest|localStorage|document\.cookie/);
 assert.match(stage,/credentials:'omit',cache:'no-store',redirect:'error'/);
 assert.match(worker,/env\.EDITORIAL_DEFAULTS_PREVIEW!=='enabled'/);
 assert.match(worker,/if\(path==='\/api\/overrides'&&method==='GET'\)/);
 assert.match(worker,/if\(path==='\/api\/admin\/override'&&method==='POST'\)/);
});
