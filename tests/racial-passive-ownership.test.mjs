import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catalog=JSON.parse(read('data/os/racialPassives.json'));
const root={};
Function('window',read('pandora-studio-navigation.js'))(root);
const nav=root.PandoraGameNavigation;
const idx=key=>nav.raceKeys.indexOf(key);

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
