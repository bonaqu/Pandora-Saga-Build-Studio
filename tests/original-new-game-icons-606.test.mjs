import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const manifest=JSON.parse(read('assets/os-icon-manifest.json').toString('utf8'));
const skills=JSON.parse(read('data/os/skills.json').toString('utf8'));
// Original icon stems from the 15 November source-catalog delta (#606).
const itemStems=[
 'I_013042_00','I_013033_00','I_013113_00','I_013103_00',
 'I_017129_00','I_018002_00','I_018006_00','I_018007_00',
 'I_018014_00','I_018016_00','I_018017_00','I_019010_00',
 'I_019011_00','I_020007_00','I_020005_00','I_021019_00',
 'I_021020_00','I_051036_00','I_094087_00'
];

function originalWebp(path){
 assert.match(path,/^assets\/(items|skills)\/icons\/(I_[0-9_]+|skill_[0-9]+)\.webp$/);
 const bytes=read(path);
 assert.ok(bytes.length>=20,'original file is not a valid WebP payload: '+path);
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
}
test('all 19 newly introduced original item stems have genuine locally mirrored WebP',()=>{
 assert.equal(itemStems.length,19);
 assert.equal(new Set(itemStems).size,19);
 for(const stem of itemStems){
  const path=manifest.icons?.items?.[stem];
  assert.equal(path,'assets/items/icons/'+stem+'.webp',stem);
  assert.equal(manifest.missing.some(x=>x.kind==='items'&&x.stem===stem),
   false,'must not call an available icon HTTP 404: '+stem);
  originalWebp(path);
 }
});
test('learnable Sandstorm explicitly reuses its own signed game icon ID',()=>{
 const spell=skills['420007101'];
 assert.equal(spell.name,'Песчаная буря');
 assert.equal(spell.iconId,420007001);
 const original=manifest.icons?.skills?.['skill_'+spell.iconId];
 assert.equal(original,'assets/skills/icons/skill_420007001.webp');
 originalWebp(original);
 // A new skill ID is not automatically a separate art resource.
 assert.equal(manifest.icons?.skills?.['skill_'+spell.id],undefined);
});
test('internal Sandstorm child remains represented honestly if its original is 404',()=>{
 const internal=skills['420007102'],stem='skill_420007102';
 assert.equal(internal.learnable,false);
 assert.equal(internal.iconId,420007102);
 const path=manifest.icons?.skills?.[stem];
 if(path)originalWebp(path); // Future verified original can be added safely.
 else {
  assert.equal(manifest.missing.find(x=>x.kind==='skills'&&x.stem===stem)?.error,
   'HTTP 404','missing source must be evidenced, never invented');
 }
});
