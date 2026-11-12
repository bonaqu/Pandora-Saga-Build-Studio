import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',get('pandora-studio-hero-book.js'))(host);
Function('window',get('pandora-studio-honor-guide.js'))(host);
Function('window',get('pandora-studio-ui-locale.js'))(host);
const book=host.PandoraStageAttributes,guide=host.PandoraHonorGuide;

test('book shows OS Cverg racial label and preserves exact original racial passive',()=>{
 const s=get('pandora-studio-hero-book.js');
 const skill=JSON.parse(get('data/os/skills.json'))['900030001'];
 assert.equal(skill.name,'Упрямое сердце');
 assert.ok(s.includes("'Расовая стойкость цверга'"));
 assert.doesNotMatch(s,/text:english\?'Dwarven racial survival':\s*'Расовая стойкость дворфа'/);
 assert.match(s,/stableSource=ru==='Расовая стойкость цверга'\?'Расовая стойкость дворфа':ru/);
 assert.equal(book.bookEditorialDefaults['Расовая стойкость цверга'],'Dwarven racial survival');
 // Keep historical D1 edit identity after correcting the default label.
 let hash=2166136261;
 for(const letter of 'Расовая стойкость дворфа')
  hash=Math.imul(hash^letter.codePointAt(0),16777619)>>>0;
 assert.equal(book.bookEditorialKey('Расовая стойкость цверга'),
  'book-dwarven-racial-survival-'+hash.toString(16).padStart(8,'0'));
});

test('Mounted has its hint on the clickable word, not a permanent technical paragraph',()=>{
 const entry=guide.field({},'attack.mountedToggle','Верхом','Mounted');
 assert.match(entry.hintRu,/сражается верхом/);
 assert.match(entry.hintEn,/while mounted/);
 assert.doesNotMatch(entry.hintRu,/Remaked|формул|сервер|UI/i);
 const source=get('pandora-studio-hero-book.js');
 assert.match(source,/guideLabel\(toggle\.querySelector\('\.stage-mounted-label'\),'attack\.mountedToggle'/);
 assert.doesNotMatch(source,/function mountedBookNotice\(/);
 assert.doesNotMatch(source,/mountedBookNotice\(body/);
 assert.match(source,/for:'stageBookMountedToggle'/);
 assert.doesNotMatch(source,/body\.append\(make\('p',\{class:'stage-attribute-note',text:english\?/);
});

test('secondary weapon W and riding stat share honest RU/EN explanation, no server-parity claim',()=>{
 for(const [key,ru,en] of [
  ['attack.weaponBase','Исходная атака','equipped weapon'],
  ['attack.mountedRelease','Доля характеристик','share of attributes']]){
  const row=guide.field({},key,'test','test');
  assert.match(row.hintRu,new RegExp(ru));
  assert.match(row.hintEn,new RegExp(en));
  assert.doesNotMatch(row.hintRu,/Remaked|сервер|формула|W\)/i);
 }
 const mounted=guide.field({},'attack.mountedRelease','Характеристики верхом','Mounted attributes');
 assert.match(mounted.hintRu,/верхов/);
 assert.match(mounted.hintEn,/Riding mastery/);
});

test('individual Curse, Weakness and Madness resistance labels mirror OS item descriptions',()=>{
 const items=JSON.parse(get('data/os/items.json'));
 for(const [id,func,needle,kind] of [
  ['11214','EP_IMMUNE_EVIL','проклятиям','evil'],
  ['13562','EP_IMMUNE_CURSE','слабости','curse'],
  ['13572','EP_IMMUNE_RAVING','безумию','madness']]){
  assert.ok(items[id].effects.some(x=>x.func===func),id);
  assert.ok(items[id].desc.includes(needle),id);
  const hint=guide.field({},'defense.resistStatus:'+kind,kind,kind);
  assert.ok(hint.hintRu.includes(needle.slice(0,4)),kind);
  assert.ok(hint.hintEn.length>30,kind);
 }
});

test('all six requested OS effect icons exist and bad sprites fail to one safe question-mark image',()=>{
 const manifest=JSON.parse(get('assets/os-icon-manifest.json'));
 const ids=[310001001,310004001,310021001,310023001,310022001,910110001];
 const skills=JSON.parse(get('data/os/skills.json'));
 for(const id of ids){
  assert.equal(skills[String(id)].iconId,id);
  assert.equal(manifest.icons.skills['skill_'+id],
   'assets/skills/icons/skill_'+id+'.webp');
 }
 const code=get('pandora-studio-hero-book.js');
 assert.match(code,/picture\.dataset\.fallback==='1'/);
 assert.match(code,/picture\.src='assets\/skills\/icons\/skill_unknown\.webp'/);
 assert.doesNotMatch(code,/picture\.src='https?:/);
});
