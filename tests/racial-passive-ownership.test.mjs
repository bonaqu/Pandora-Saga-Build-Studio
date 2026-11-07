import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catalog=JSON.parse(read('data/os/racialPassives.json'));
const root={};
Function('window',read('pandora-studio-navigation.js'))(root);
const nav=root.PandoraGameNavigation;
const idx=key=>nav.raceKeys.indexOf(key);

test('Hero loader and Encyclopedia share the same race integrity validator',()=>{
 const wiki={};
 Function('window',read('pandora-studio-encyclopedia-catalog.js'))(wiki);
 const validate=wiki.PandoraWikiCatalog.validateRacialPassives;
 const skills=JSON.parse(read('data/os/skills.json'));
 const meta=JSON.parse(read('data/os/meta.json'));
 assert.equal(validate(catalog,skills,meta.counts),true);
 const missing=structuredClone(catalog);
 delete missing.MYLIN;
 assert.throws(()=>validate(missing,skills,meta.counts),/Неполный каталог/);
 const borrowed=structuredClone(catalog);
 borrowed.ELF.skills[0]=borrowed.HUMAN.skills[0];
 assert.throws(()=>validate(borrowed,skills,meta.counts),/связи расовых пассивок/);
 const app=read('pandora-studio-app.js');
 assert.match(app,/window\.PandoraWikiCatalog\.validateRacialPassives\(\s*data\.racialPassives,data\.skills,data\.meta\?\.counts\)/);
 const wikiSource=read('pandora-studio-encyclopedia-catalog.js');
 assert.match(wikiSource,/validateRacialPassives\(data\.racialPassives,data\.skills,data\.meta\.counts\)/);
});
test('each of the six source races owns only its three skill IDs',()=>{
 assert.equal(Object.keys(catalog).length,6);
 for(const [race,entry] of Object.entries(catalog)){
  const index=idx(race);
  assert.ok(index>=0,race);
  assert.equal(entry.skills.length,3);
  for(const skill of entry.skills){
   assert.equal(nav.selectionValid(catalog,index,skill),true);
   assert.equal(nav.canonicalRacialPassiveId(catalog,index,skill),skill);
   assert.equal(nav.canonicalRacialPassiveId(catalog,index,String(skill)),skill,
    'legacy numeric-string ID keeps canonical integer identity');
  }
 }
});

test('foreign-race and malicious saved IDs cannot affect this character',()=>{
 const dwarf=idx('DWARF'),enkidu=idx('ENKIDU'),rapin=idx('RAPIN');
 assert.equal(nav.canonicalRacialPassiveId(catalog,dwarf,900050003),null,
  'Enkidu critical +10 cannot apply to Dwarf');
 assert.equal(nav.canonicalRacialPassiveId(catalog,rapin,900030003),null,
  'Dwarf critical resistance cannot apply to Rapin');
 for(const input of [null,undefined,0,-1,Infinity,NaN,'','900060003.0','BAD',{},[]]){
  assert.equal(nav.canonicalRacialPassiveId(catalog,enkidu,input),null,String(input));
 }
 assert.equal(nav.canonicalRacialPassiveId(null,enkidu,900050003),null);
 assert.equal(nav.canonicalRacialPassiveId({},enkidu,900050003),null);
 assert.equal(nav.canonicalRacialPassiveId(catalog,-1,900050003),null);
 assert.equal(nav.canonicalRacialPassiveId(catalog,99,900050003),null);
});

test('actual calculator receives the canonical guarded value, not raw imported state',()=>{
 const source=read('pandora-studio-app.js');
 assert.match(source,/potionContext:\{racialPassiveId:window\.PandoraGameNavigation\.canonicalRacialPassiveId\(/);
 assert.match(source,/catalog\.racialPassives,state\.race,state\.racialPassiveId/);
 assert.doesNotMatch(source,/potionContext:\{racialPassiveId:state\.racialPassiveId/);
 assert.match(source,/!window\.PandoraGameNavigation\.selectionValid/);
});
