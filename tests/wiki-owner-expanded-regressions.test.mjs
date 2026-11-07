import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';

const root=new URL('../',import.meta.url);
const scope={window:{}};
vm.runInNewContext(readFileSync(new URL('../pandora-studio-wiki-owner-data.js',import.meta.url),'utf8'),scope);
const edits=scope.window.PandoraWikiOwnerData;
const clean=x=>JSON.parse(JSON.stringify(x));
const fixtures=()=>({
 items:{1:{name:'Спата'},2:{name:'Руда'},3:{name:'Шкатулка'}},
 monsters:{600:{id:600,name:'Квеллис',level:15,life:547,resists:{fire:25,cold:-25}}},
 drops:{600:{d:[{i:1,p:15,lo:0,hi:2,souls:[[101016,35]]}],s:[]}},
 maps:{100:{name:'Лес',mobs:[600]},200:{name:'Пустыня',mobs:[]}},
 instances:[{id:300,name:'Подземелье',mobs:[]}],
 trades:{npcs:{7:{name:'Торговец',maps:[100]}},trades:[],mapNames:{}},
 skills:{77:{id:77,name:'Удар',charLevel:1,mana:5}},
 souls:{50:{id:50,name:'Душа',slots:['weapon'],price:100}},
 chests:{boxes:[{i:3,rolls:[[{i:1,n:2,p:100}]]}]}
});
test('monster and world record overrides are non-destructive and preserve negatives',()=>{
 const base=fixtures();
 const result=edits.apply(base,{
  'wikiedit.monster.600':JSON.stringify({level:19,life:1200,resists:{fire:35,cold:-30}}),
  'wikiedit.map.100':JSON.stringify({name:'Новый лес'}),
  'wikiedit.npc.7':JSON.stringify({maps:[100,200]}),
  'wikiedit.skill.77':JSON.stringify({mana:8}),
  'wikiedit.soul.50':JSON.stringify({slots:['weapon','head'],price:140})
 });
 assert.equal(result.monsters[600].level,19);
 assert.equal(result.monsters[600].resists.cold,-30);
 assert.equal(result.maps[100].name,'Новый лес');
 assert.deepEqual(clean(result.trades.npcs[7].maps),[100,200]);
 assert.equal(result.skills[77].mana,8);
 assert.deepEqual(clean(result.souls[50].slots),['weapon','head']);
 assert.equal(base.monsters[600].level,15);
 assert.equal(base.maps[100].name,'Лес');
 assert.equal(base.skills[77].mana,5);
 assert.deepEqual(clean(base.souls[50].slots),['weapon']);
});
test('spawns rebuild both map and instance membership without changing upstream originals',()=>{
 const base=fixtures();
 const changed=edits.apply(base,{
  'spawnedit.600':JSON.stringify([{type:'map',id:'200'},{type:'instance',id:'300'}])
 });
 assert.deepEqual(clean(changed.maps[100].mobs),[]);
 assert.deepEqual(clean(changed.maps[200].mobs),[600]);
 assert.deepEqual(clean(changed.instances[0].mobs),[600]);
 assert.deepEqual(clean(base.maps[100].mobs),[600]);
 assert.deepEqual(clean(base.instances[0].mobs),[]);
});
test('loot and chest mutations preserve source-only metadata and reverse data',()=>{
 const base=fixtures();
 const drops={d:[{i:1,p:20,lo:0,hi:2,souls:[[101016,35]]},{i:2,n:1,p:null}],s:[]};
 const boxes=[[{i:1,n:1,p:75},{i:2,n:1,p:25}]];
 assert.ok(edits.validDrops(drops));
 assert.ok(edits.validChest(boxes));
 const changed=edits.apply(base,{
  'dropedit.600':JSON.stringify(drops),
  'chestedit.3':JSON.stringify(boxes)
 });
 assert.equal(changed.drops[600].d[0].hi,2);
 assert.deepEqual(clean(changed.drops[600].d[0].souls),[[101016,35]]);
 assert.equal(changed.chests.boxes[0].rolls[0].length,2);
 assert.equal(base.drops[600].d[0].p,15);
 assert.equal(base.chests.boxes[0].rolls[0].length,1);
});
test('invalid structures, unknown entities, duplicate spawns and unsafe properties do not enter wiki',()=>{
 const base=fixtures();
 const invalid={
  'wikiedit.monster.600':JSON.stringify({resists:{fire:500}}),
  'wikiedit.map.100':JSON.stringify({__protoPolluted:{x:true}}),
  'dropedit.600':JSON.stringify({d:[{i:9999,p:3}],s:[]}),
  'chestedit.3':JSON.stringify([[{i:9999,p:50}]]),
  'spawnedit.600':JSON.stringify([{type:'map',id:'100'},{type:'map',id:'100'}])
 };
 const changed=edits.apply(base,invalid);
 assert.equal(changed,base);
 assert.equal({}.x,undefined);
 assert.equal(Boolean(edits.validPatch('monster',{level:10,evil:true})),false);
 assert.equal(Boolean(edits.validSpawns([{type:'npc',id:'7'}])),false);
 assert.equal(Boolean(edits.validDrops({d:[{i:1,p:101}],s:[]})),false);
});
test('all new editor endpoints reject anonymous calls and enforce server-side limits',async()=>{
 const db={values:new Map(),prepare(sql){
  const args=[];return{
   bind(...x){args.push(...x);return this},
   first:async()=>({id:1}),
   run:async()=>{if(sql.includes('INSERT INTO overrides'))db.values.set(args[0],args[1]);return{meta:{changes:1}}}
  };
 }};
 const call=async(key,value,token='a'.repeat(43))=>worker.fetch(new Request(
  'https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override',{
   method:'POST',headers:{Origin:'https://bonaqu.github.io',Authorization:'Bearer '+token},
   body:JSON.stringify({key,value:JSON.stringify(value)})}),{DB:db});
 const good={
  'wikiedit.monster.600':{level:17,resists:{cold:-15}},
  'wikiedit.skill.77':{mana:12},
  'wikiedit.soul.50':{slots:['weapon','head']},
  'dropedit.600':{d:[{i:1,p:20,lo:0,hi:2,souls:[[101016,35]]}],s:[]},
  'chestedit.3':[[{i:1,p:75}]],
  'spawnedit.600':[{type:'map',id:'100'}]
 };
 for(const [key,value] of Object.entries(good)){
  const response=await call(key,value);
  assert.equal(response.status,200,key+': '+await response.text());
  assert.equal(db.values.has(key),true);
  const anonymous=await call(key,value,'not-a-real-session');
  assert.equal(anonymous.status,401,key);
 }
 for(const [key,value] of [
  ['wikiedit.monster.600',{resists:{fire:200}}],
  ['wikiedit.skill.77',{mana:-1}],
  ['dropedit.600',{d:[{i:1,p:101}],s:[]}],
  ['chestedit.3',[[{i:1,p:101}]]],
  ['spawnedit.600',[{type:'npc',id:'7'}]]
 ]){
  const response=await call(key,value);
  assert.equal(response.status,400,key);
 }
});
test('admin owner PR bridge exposes no account/login/session data and guards every mutation',()=>{
 const script=readFileSync(new URL('../worker/pandora-studio-github-catalog-pr.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.match(script,/const ownerKey=/);
 assert.match(script,/ownerPayload/);
 assert.match(script,/crypto\.subtle\.digest\('SHA-256'/);
 assert.match(script,/No account, login, password, session or Cloudflare secrets/);
 assert.doesNotMatch(script,/SELECT .*FROM user_accounts/i);
 assert.match(main,/path==='\/api\/admin\/catalog\/owner-review'/);
 assert.match(main,/path==='\/api\/admin\/catalog\/owner-pr'/);
 assert.match(main,/if\(!await auth\(request,env\)\)return no\('Unauthorized',401\)/);
 assert.match(main,/path==='\/api\/runtime-capabilities'/);
});

// Do not offer the existing ✎ replacement as two D1 writes for a canonical
// monster. Static source monsters use one spawnedit row; owner maps keep their
// explicit per-location patch lifecycle.
test('monster origin editor supports safe single-write replacement',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 assert.match(app,/saveWikiSpawns\(id,kind,added,true,removed\)/);
 assert.match(app,/replaceCandidate:placeId=>kind!=='map'/);
 assert.match(app,/if\(replacesId!=null\)/);
 assert.match(app,/wanted\.delete\(oldKey\)/);
 assert.match(app,/await refreshOwnerCatalog\(\)/);
});

test('real Chromium suite exercises the single-write spawn replacement picker',()=>{
 const main=readFileSync(new URL('../tests/browser-smoke.mjs',import.meta.url),'utf8');
 const smoke=readFileSync(new URL('../tests/browser-wiki-spawn-replace.mjs',import.meta.url),'utf8');
 assert.match(main,/runWikiSpawnReplacementSmoke/);
 assert.match(smoke,/spawnedit\.13101/);
 assert.match(smoke,/writes\.length,1/);
 assert.match(smoke,/2003301/);
});
