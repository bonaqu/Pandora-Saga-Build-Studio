import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
test('equipment rail, selection and details share one 14-slot RU/EN lookup',()=>{
 assert.match(code,/const englishGearSlots=\['Weapon','Shield'/);
 assert.match(code,/const gearSlotName=index=>lang==='en'\?englishGearSlots\[index\]:slots\[index\]\[0\]/);
 assert.match(code,/const tooltip=gearSlotName\(i\)/);
 assert.match(code,/text:item\?itemName\(item\):gearSlotName\(i\)/);
 assert.match(code,/slotLabel:\(lang==='en'\?'Slot: ':'Слот: '\)\+gearSlotName\(selectedSlot\)/);
});
test('equipment search, status and warnings are bilingual',()=>{
 for(const term of ['Close item picker','Search by name','Unequip item','Show more (',
  'matching · ','Item inactive: ','Requires level $1']){
  assert.ok(code.includes(term),term);
 }
 assert.match(code,/issue\.map\(gearIssueLabel\)\.join/);
});
