import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
runInNewContext(read('pandora-studio-search-field.js'),{
 window:host,document:{addEventListener(){}}
});
runInNewContext(read('pandora-studio-equipment-ui.js'),{
 window:host,document:{addEventListener(){}}
});
const match=host.PandoraStageItemUI.matchesSoulSearch;
const ru=JSON.parse(read('data/os/souls.json'));
const translated=JSON.parse(read('data/os/strings.en.json')).souls;

test('current OS source identity searches in Russian even while the Soul is displayed in English',()=>{
 const id='101000',source=ru[id],english=translated[id]?.n;
 assert.equal(source.name,'Душа стрелка');
 assert.equal(english,"Marksman's Soul");
 const record={...source,name:english,sourceNameRu:source.name,sourceNameEn:english};
 const initial=JSON.stringify(record);
 for(const query of ['Душа стрелка','  СТРЕЛКА   душа ','Marksman Soul',"MARKSMAN'S SOUL"])
  assert.equal(match(record,query),true,query);
 for(const query of ['Душа счастья','101000','ACC +8','Very Large Sword'])
  assert.equal(match(record,query),false,query);
 assert.equal(JSON.stringify(record),initial,'pure filtering never changes a catalog Soul');
});
test('normalizes ё/е, Unicode width and reordered words; empty search includes compatible records',()=>{
 const record={name:'Душа Ёжика',sourceNameEn:"Hedgehog's Soul"};
 for(const q of ['ЕЖИКА','ёжика душа','Душа   Ёжика','Ｈｅｄｇｅｈｏｇ Soul',''])
  assert.equal(match(record,q),true,q);
 assert.equal(match(record,'СИЛ +2'),false,'effects are not editorial name aliases');
 assert.equal(match(null,'anything'),false);
});
test('respects edited RU and verified EN names without making up translations',()=>{
 const record={name:'Storm Soul',sourceNameRu:'Душа грозы',sourceNameEn:'Storm Soul'};
 assert.equal(match(record,'грозы'),true);
 assert.equal(match(record,'storm'),true);
 assert.equal(match({name:'Неизвестная душа'},'Unknown Soul'),false);
});
test('runtime creates source aliases after owner D1 overrides and retains compatibility gate',()=>{
 const app=read('pandora-studio-app.js'),equipment=read('pandora-studio-equipment-ui.js');
 assert.match(app,/const localizedSouls=translate\(ownerGameData\.souls,en\?\.souls\)/);
 assert.match(app,/sourceNameRu:typeof raw\?\.name==='string'\?raw\.name:''/);
 assert.match(app,/sourceNameEn:raw\?\.nameEn\|\|officialEnglish\?\.souls\?\.\[id\]\?\.n\|\|''/);
 assert.match(app,/souls:localizedSouls,racialPassives/);
 assert.match(equipment,/plan\.validSoul\(rec,slot\)&&matchesSoulSearch\(rec,query\.value\|\|''\)/);
 assert.doesNotMatch(equipment,/String\(rec\.name\|\|''\)\.toLocaleLowerCase\('ru'\)\.includes\(needle\)/);
});

test('Soul search can reveal every compatible record without remounting or stale selection',()=>{
 const equipment=read('pandora-studio-equipment-ui.js');
 const app=read('pandora-studio-app.js');
 assert.match(equipment,/const pageSize=80/);
 assert.match(equipment,/if\(paging\.parentNode===list\)list\.insertBefore\(row,paging\)/,
  'Loading another page must not tear down previously mounted Soul editors');
 assert.match(equipment,/moreControl\.hidden=shown>=results\.length/,
  'The More action is hidden only after the final Soul page');
 assert.match(equipment,/if\(results\.length&&paging\.parentNode!==list\)list\.append\(paging\)/,
  'Completed lists keep their progress summary mounted');
 assert.match(read('pandora-studio-theme.css'),
  /\.stage-soul-more-row>\[hidden\]\{display:none!important\}/,
  'The owner action wrapper must really be hidden despite its display:flex styles');
 assert.match(equipment,/api\.onSoulShown\?\.\(shown\)/,
  'The caller can restore expanded pages after equipping or removing a Soul');
 assert.match(equipment,/draw\(\{resetPage:true\}\)/,
  'New searches must not carry an old page position');
 assert.match(equipment,/firstNew\?\.focus\(\{preventScroll:true\}\)/,
  'Keyboard focus is preserved when the More button disappears');
 assert.doesNotMatch(equipment,/results\.slice\(0,80\)/);
 assert.doesNotMatch(equipment,/soulSearchLimit/);
 assert.match(equipment,/copy\('soulProgressLabel',progressRu,progressEn\)/);
 assert.match(equipment,/progressCount\.textContent=english\?/);
 assert.doesNotMatch(equipment,/progress\.textContent=english\?/);
 for(const name of [
  'soulQuery:stageSoulQuery,soulShown:stageSoulShown',
  'onSoulShown:count=>{stageSoulShown=count;saveView()}',
  'stageSoulQuery=value;stageSoulShown=80;stageSoulScrollTop=0',
  "stageSoulQuery='';stageSoulShown=80;",
  'soulQuery:stageSoulQuery,soulShown:stageSoulShown,wikiLayout:'
 ])assert.ok(app.includes(name),name);
 assert.match(app,/bootView\.soulShown>=80&&\s*bootView\.soulShown<=10000\?bootView\.soulShown:80/);
});
