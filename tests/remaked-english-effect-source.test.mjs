import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const data=JSON.parse(read('data/localization/remaked-effect-source.v1.json'));
const source=read('pandora-studio-item-owner-editor.js');
const english=source.match(/const englishEffectLabels=Object\.freeze\((\{[\s\S]*?\})\);/);
assert.ok(english,'English effect registry must be inspectable');
const labels=JSON.parse(english[1].replace(/([A-Z_0-9]+):/g,'"$1":'));
function collectCodes(value,set){
 if(!value||typeof value!=='object')return;
 if(Array.isArray(value)){for(const row of value)collectCodes(row,set);return}
 if(typeof value.func==='string'&&value.func.startsWith('EP_'))set.add(value.func);
 for(const [key,row] of Object.entries(value))if(key!=='func')collectCodes(row,set);
}

test('audit inventory explicitly covers every native item, Soul and upgrade effect code',()=>{
 const observed=new Set();
 for(const path of ['data/os/items.json','data/os/souls.json','data/os/itemForth.json'])
  collectCodes(JSON.parse(read(path)),observed);
 const audited=new Set(data.rows.map(row=>row.code));
 assert.equal(data.total,data.rows.length);
 assert.equal(audited.size,data.rows.length,'no duplicate EP effect source records');
 assert.deepEqual([...audited].sort(),[...observed].sort());
 assert.equal(data.upstreamCommit.length,40,'pin source revision, not moving branch');
});

test('all named effects remain in sync with English runtime labels',()=>{
 const labeled=data.rows.filter(row=>row.studioLabel);
 assert.deepEqual(Object.keys(labels).sort(),labeled.map(row=>row.code).sort());
 for(const row of labeled)assert.equal(labels[row.code],row.studioLabel,row.code);
 assert.equal(labeled.length,98,'all 98 source-or-presently-labeled effects remain discoverable');
});

test('verified Remaked indices are distinct from unverified editorial translations',()=>{
 const verified=data.rows.filter(row=>row.remakedEnglish!=null);
 assert.equal(verified.length,64);
 for(const row of verified){
  assert.ok(Number.isInteger(row.remakedOptionIndex));
  assert.ok(row.source?.endsWith('.js')||row.source?.endsWith('.mjs'));
  assert.ok(row.remakedEnglish.trim());
 }
 const unresolved=data.rows.filter(row=>!row.remakedEnglish);
 assert.equal(unresolved.length,37);
 assert.equal(unresolved.filter(row=>!row.studioLabel).length,3);
 for(const row of unresolved)assert.equal(row.remakedOptionIndex,null);
});

test('two distinct resistances are not merged into a fictional English immunity',()=>{
 const byId=new Map(data.rows.map(row=>[row.code,row]));
 assert.deepEqual([
  byId.get('EP_IMMUNE_CURSE').remakedEnglish,
  byId.get('EP_IMMUNE_EVIL').remakedEnglish,
 ],['Weak RES','Curse RES']);
 assert.equal(labels.EP_IMMUNE_CURSE,'Weakness resistance');
 assert.equal(labels.EP_IMMUNE_EVIL,'Curse resistance');
 assert.equal(labels.EP_IMMUNE_RAVING,'Madness resistance');
 assert.equal(labels.EP_IMMUNE_NUMB,'Freeze resistance');
 assert.equal(labels.EP_SKILL_DELAY,'Casting speed');
 for(const row of data.rows.filter(row=>row.remakedEnglish?.endsWith(' RES')))
  assert.ok(!/immunity/i.test(row.studioLabel||''),row.code+' must not imply complete immunity');
});


test('non-Remaked effect labels corrected by game item descriptions have traceable source evidence',()=>{
 const nativeItems=JSON.parse(read('data/os/items.json'));
 const itemForth=JSON.parse(read('data/os/itemForth.json'));
 const strings=JSON.parse(read('data/os/strings.en.json'));
 const evidenceCodes=['EP_RECOVERY_CURSE','EP_RECOVERY_NUMB','EP_RECOVERY_RAVING',
  'EP_DESTINE_WARDING','EP_ELEMENT_DAMAGE_SCALE_FIRE','EP_EXPERTISE_RESET',
  'EP_RESTMAP_MOVESPEED_SCALE','EP_HEAL_LIFE_REGENERATOR'];
 for(const code of evidenceCodes){
  const row=data.rows.find(x=>x.code===code);
  const proof=row?.gameEvidence;
  assert.equal(proof?.source,'data/os/strings.en.json',code);
  assert.equal(proof.confidence,'item-description-only',code);
  assert.ok(strings.items[proof.itemId]?.d.includes(proof.exactText),code);
  assert.equal(row.studioLabel,labels[code],code);
  const records=code==='EP_ELEMENT_DAMAGE_SCALE_FIRE'?itemForth[proof.itemId]:nativeItems[proof.itemId]?.effects;
  assert.match(JSON.stringify(records),new RegExp('"func":"'+code+'"'),code);
 }
 assert.equal(labels.EP_RECOVERY_CURSE,'Remove Weakness');
 assert.equal(labels.EP_RECOVERY_NUMB,'Remove Freeze');
 assert.equal(labels.EP_RECOVERY_RAVING,'Remove Madness');
});


test('ten additional previously unmapped effects carry exact game-description provenance',()=>{
 const sourceItems=JSON.parse(read('data/os/items.json'));
 const english=JSON.parse(read('data/os/strings.en.json'));
 const codes=["EP_ABILITY_RESET","EP_HEAL_LIFE","EP_HEAL_LIFE_RATE","EP_HEAL_MANA","EP_HEAL_MANA_RATE","EP_ONHIT_SKILL_EXEC","EP_ONDAMAGE_SKILL_EXEC_ATTACKER","EP_RESTART","EP_VOLUME_EXP","EP_TOHIT_SCALE"];
 for(const code of codes){
  const row=data.rows.find(x=>x.code===code);
  const proof=row?.gameEvidence;
  assert.equal(row.remakedEnglish,null,code+' is not a Remaked option label');
  assert.equal(proof?.confidence,'item-description-only',code);
  assert.ok(english.items[proof.itemId].d.includes(proof.exactText),code);
  assert.ok(sourceItems[proof.itemId].effects.some(e=>e.func===code),code);
 }
 assert.equal(data.rows.filter(row=>row.gameEvidence).length,18);
});
