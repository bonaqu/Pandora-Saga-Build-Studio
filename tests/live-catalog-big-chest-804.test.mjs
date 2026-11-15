import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const host={};
Function('window',readFileSync(new URL('../pandora-studio-wiki-owner-data.js',import.meta.url),'utf8'))(host);
const valid=host.PandoraWikiOwnerData.validChest;
const candidate=read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/chests.json');
const historical=read('data/os/chests.json');

test('all 45 current source chests, including 127 entries in one group, pass the owner schema',()=>{
 assert.equal(historical.boxes.length,32);
 assert.equal(candidate.boxes.length,33);
 assert.equal(candidate.npc.length,12);
 for(const box of [...candidate.boxes,...candidate.npc])
  assert.equal(valid(box.rolls),true,'Current game chest '+box.i);
 const source=candidate.boxes.find(x=>x.i===51036);
 assert.ok(source);
 assert.equal(source.rolls.length,1);
 assert.equal(source.rolls[0].length,127);
 assert.equal(valid(source.rolls),true);
});

test('up to 200 entries are bounded; malformed chest rewards remain rejected',()=>{
 const source=candidate.boxes.find(x=>x.i===51036);
 const clone=()=>structuredClone(source.rolls);
 const over=clone();while(over[0].length<=200)over[0].push({...over[0][0]});
 assert.equal(valid(over),false);
 const badChance=clone();badChance[0][0].p=101;assert.equal(valid(badChance),false);
 const unknown=clone();unknown[0][0].invented=true;assert.equal(valid(unknown),false);
 const badItem=clone();badItem[0][0].i=-1;assert.equal(valid(badItem),false);
 const badQuantity=clone();badQuantity[0][0].n=0;assert.equal(valid(badQuantity),false);
});
test('inspecting game rewards never rewrites or truncates source arrays',()=>{
 const before=JSON.stringify(candidate);
 assert.equal(valid(candidate.boxes.find(x=>x.i===51036).rolls),true);
 assert.equal(candidate.boxes.find(x=>x.i===51036).rolls[0].length,127);
 assert.equal(JSON.stringify(candidate),before);
});
