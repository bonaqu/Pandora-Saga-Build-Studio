import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-theme.css');
const equipment=read('pandora-studio-equipment-ui.js');

test('Path reset is a localized inline two-step choice, not native confirm',()=>{
 const begin=app.indexOf(" $('pathResetPoints').onclick=()=>{");
 const end=app.indexOf(" $('pathAutoMastery').onchange=",begin);
 assert.ok(begin>=0&&end>begin);
 const section=app.slice(begin,end);
 assert.doesNotMatch(section,/\bconfirm\(/);
 assert.match(section,/if\(!budgetSummary\(\)\.spent\|\|\$\('pathResetConfirm'\)\)return/);
 assert.match(section,/const note=h\('p',\{class:'path-reset-confirm-note'/);
 assert.match(section,/ownerCopy\('path','resetConfirmHelp',ru,en\)/);
 assert.match(section,/ownerCopyLabel\(note,'path','resetConfirmHelp',ru,en\)/);
 assert.match(section,/role:'group','aria-label':lang==='en'\?/);
 assert.match(section,/onclick:\(\)=>closePathResetConfirm\(true\)/);
 assert.match(section,/event\.key==='Escape'/);
 assert.match(section,/for\(const b of branches\)state\.points\[b\.id\]=0/);
 assert.match(section,/state\.mastery=\{\}/);
 assert.match(css,/\.path-reset-confirm\{display:grid/);
 assert.match(css,/\.path-reset-confirm-actions>button\{/);
 assert.match(app,/function renderBranches\(\)\{[\s\S]*?closePathResetConfirm\(\)/);
});
test('Origin portrait notices and item-loading fallback are bilingual without changing game data',()=>{
 // The race name comes from canonical races[], while the independent
 // guidance is bilingual owner copy. No game race can be renamed through D1.
 assert.match(app,/const originGenderNoteRows=Object\.freeze\(/);
 assert.match(app,/\['genderSelectionUnavailable','выбор пола недоступен','gender selection unavailable'\]/);
 assert.match(app,/\['genderFemale','женский','female'\]/);
 assert.match(app,/\['genderMale','мужской','male'\]/);
 assert.match(app,/\['genderGenderless','бесполый','genderless'\]/);
 assert.match(app,/text:races\[race\]\[lang==='en'\?1:0\]/);
 assert.doesNotMatch(app,/const genderNotes=lang==='en'\?/);
 assert.match(app,/No alternate portraits for this race/);
 assert.match(equipment,/Item information is not loaded yet/);
 assert.match(equipment,/Данные о предмете пока не загружены/);
});