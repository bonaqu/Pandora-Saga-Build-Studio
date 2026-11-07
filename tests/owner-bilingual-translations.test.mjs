import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
for(const name of ['pandora-studio-owner-bilingual.js',
 'pandora-studio-honor-guide.js','pandora-studio-wiki-labels.js'])
 Function('window',read(name))(host);
const pairing=host.PandoraOwnerBilingual,guide=host.PandoraHonorGuide,
 labels=host.PandoraWikiLabels;
const ruOnly=Object.fromEntries(Object.entries(pairing.curated).map(([key,data])=>[
 key,JSON.stringify(Object.fromEntries(Object.entries(data.fields)
  .map(([field,pair])=>[field,pair.ru])))
]));

test('exact publicly observed RU edits have 24 curated EN counterparts',()=>{
 assert.equal(Object.keys(pairing.curated).length,19);
 assert.equal(Object.values(pairing.curated).reduce((n,row)=>
  n+Object.keys(row.fields).length,0),24);
 assert.equal(pairing.pending(ruOnly).length,19);
 assert.equal(pairing.pending(ruOnly).reduce((n,row)=>n+row.fields.length,0),24);
 const mapped=pairing.view(ruOnly);
 assert.equal(pairing.pending(mapped).length,0);
 assert.deepEqual(Object.keys(mapped).sort(),Object.keys(ruOnly).sort());
 for(const [key,row] of Object.entries(pairing.curated)){
  const raw=JSON.parse(ruOnly[key]),view=JSON.parse(mapped[key]);
  for(const [ruField,translation] of Object.entries(row.fields)){
   assert.equal(raw[ruField],translation.ru);
   assert.equal(view[ruField],translation.ru);
   assert.equal(view[translation.enField],translation.en);
   assert.equal(raw[translation.enField],undefined);
  }
  const guideKey=key.slice('guideedit.'.length);
  if(guideKey==='wiki.labels')assert.equal(labels.validPatch(view),true);
  else assert.equal(guide.validOverride(guideKey,mapped[key]),true,key);
 }
 assert.equal(JSON.parse(ruOnly['guideedit.wiki.labels']).skill_filter_unknown_en,undefined,
  'read-only fallback must not alter actual D1 data');
});

test('Russian manual caption override displays its own reviewed English translation',()=>{
 assert.equal(labels.value(ruOnly,'skillFilter','unknown','ru'),'Неуточнённые');
 assert.equal(labels.value(ruOnly,'skillFilter','unknown','en'),'Unresolved');
 assert.equal(labels.value(ruOnly,'honor','monthly','en'),'Monthly ranks');
 assert.equal(guide.field(ruOnly,'origin.heading','Origin','Origin').en,'Hero origin');
 assert.equal(guide.field(ruOnly,'equipment.wearable-by','Who','Who').en,'Who can equip');
 const honor=guide.article(ruOnly);
 assert.match(honor.overview.overviewEn,/Total Honor/);
 assert.match(honor.overview.monthlyNoteEn,/first day of each month/);
 assert.match(honor.ranks[7].benefitEn,/Luna/);
});

test('explicit EN edits and new RU wording always win over curated matches',()=>{
 const raw=JSON.parse(ruOnly['guideedit.wiki.labels']);
 const modified={...ruOnly,'guideedit.wiki.labels':JSON.stringify({
  ...raw,skill_filter_unknown_en:'Owner translation'})};
 assert.equal(labels.value(modified,'skillFilter','unknown','en'),'Owner translation');
 assert.equal(pairing.pending(modified).find(x=>x.key==='guideedit.wiki.labels')
  ?.fields.some(x=>x.ruField==='skill_filter_unknown_ru'),false);
 const updated={...ruOnly,'guideedit.wiki.labels':JSON.stringify({
  ...raw,skill_filter_unknown_ru:'Мой новый текст'})};
 assert.equal(labels.value(updated,'skillFilter','unknown','en'),'Unresolved',
  'new RU text has no matching curated EN suggestion, so uses default EN label');
 assert.equal(pairing.pending(updated).find(x=>x.key==='guideedit.wiki.labels')
  ?.fields.some(x=>x.ruField==='skill_filter_unknown_ru'),false);
 const preserved={...ruOnly,'guideedit.book.origin.heading':JSON.stringify({
  ru:'Происхождение героя',en:'My hero title'})};
 assert.equal(guide.field(preserved,'origin.heading','X','Y').en,'My hero title');
});

test('unchanged Russian legacy race override no longer replaces English Human',()=>{
 const app=read('pandora-studio-app.js');
 const begin=app.indexOf('function editableValue(');
 const end=app.indexOf('// Reuse the existing authenticated, bilingual',begin);
 assert.ok(begin>=0&&end>begin);
 const source=app.slice(begin,end);
 const races=[['Человек','Human'],['Эльф','Elf']];
 const resolve=(values,lang)=>
  Function('override','lang','races',source+'return editableValue;')
   (values,lang,races);
 const values={'race.0':'Человек'};
 assert.equal(resolve(values,'ru')('race.0','Человек'),'Человек');
 assert.equal(resolve(values,'en')('race.0','Human'),'Human');
 assert.equal(resolve({'race.0':'Неофициальное название'},'en')('race.0','Human'),
  'Неофициальное название',
  'No invented translation is applied to a changed custom RU race name');
});
