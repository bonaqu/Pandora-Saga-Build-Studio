import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../assets/os-icon-manifest.json',import.meta.url),'utf8'));
const begin=src.indexOf('function localizedRaceSkillStem(');
const end=src.indexOf('function skillIcon(',begin);
assert.ok(begin>0&&end>begin,'Source contains exact RU/EN race icon mapping');
const choose=Function(src.slice(begin,end)+'return localizedRaceSkillStem;')();

test('two exact race icons reuse existing client-matched local art by language',()=>{
 const ids=['skill_900050003','skill_900060003'];
 for(const id of ids)assert.ok(manifest.icons.skills[id],id+' must already be mirrored locally');
 assert.equal(choose(ids[0],'ru'),ids[1]);
 assert.equal(choose(ids[1],'ru'),ids[0]);
 assert.equal(choose(ids[0],'en'),ids[0]);
 assert.equal(choose(ids[1],'en'),ids[1]);
 assert.equal(choose('skill_100000501','ru'),'skill_100000501');
 assert.equal(choose(ids[0],'jp'),ids[0]);
 assert.ok(src.indexOf('if(custom)return custom;')<
  src.indexOf('const localeStem=localizedRaceSkillStem(stem,lang);'),
  'explicit owner art overrides must take precedence over locale reuse');
});
