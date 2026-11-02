import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('historical rune survives shared snapshots but stays disabled in current OS calculations',()=>{
 const app=read('pandora-studio-app.js'),calc=read('pandora-os-character-calculator.js');
 assert.match(app,/safe\.attributeBuffs\.runeJoEun=rawAttributes\.runeJoEun===true/);
 assert.match(calc,/level,itemForth,\.\.\.potionContext,runeJoEun:false/);
});
