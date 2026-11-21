import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {runInNewContext} from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const inspectWindow={};
runInNewContext(readFileSync(resolve(root,'pandora-studio-wiki-skill-insights.js'),'utf8'),
 {window:inspectWindow});
runInNewContext(readFileSync(resolve(root,'pandora-studio-honor-guide.js'),'utf8'),
 {window:inspectWindow});

test('verified game-patch skill notes have stable owner-editable RU/EN D1 keys',()=>{
 const sandstorm={
  id:420007101,name:'Песчаная буря',charLevel:50,prereq:420007001,cast:4,
  funcs:[{ep:'EP_SKILL_EXEC',fv1:[0,0,0,420007102]}]
 };
 const catalog={'420007102':{funcs:[{ep:'EP_ELEMENT_DAMAGE'}]}};
 const [note]=inspectWindow.PandoraWikiSkillInsights.officialPatchNotes(sandstorm,catalog);
 assert.equal(note.editorialKey,'osPatch420007101');
 assert.match(note.ru,/повышенный урон/);
 assert.match(note.en,/increased damage/);
 assert.doesNotMatch(note.ru,/коэффициент|не утверждается/i);
 assert.doesNotMatch(note.en,/coefficients|not asserted/i);

 const key='wiki-ui.os-patch420007101';
 const d1Key='guideedit.book.'+key;
 const changed={ru:'Подтверждённый текст владельца',en:'Owner-edited explanation'};
 const stored=inspectWindow.PandoraHonorGuide.field(
  {[d1Key]:JSON.stringify(changed)},key,note.ru,note.en);
 assert.equal(stored.ru,changed.ru);
 assert.equal(stored.en,changed.en);
 assert.equal(inspectWindow.PandoraHonorGuide.field({},key,note.ru,note.en).ru,note.ru);

 const invalid={...sandstorm,cast:7};
 assert.equal(inspectWindow.PandoraWikiSkillInsights.officialPatchNotes(invalid,catalog).length,0,
  'a missing gameplay proof must not emit the authored patch note');
});

test('skill-note editor is gated by verified owner mode, never enabled for generated notes',()=>{
 const source=readFileSync(resolve(root,'pandora-studio-app.js'),'utf8');
 assert.match(source,/osPatch\|osSource/);
 assert.match(source,/Poison\|Hymn\|Trap\|Composite\|Linked/);
 assert.match(source,/ownerCopy\('wiki-ui',ownerKey,ru,en\)/);
 assert.match(source,/ownerCopyLabel\(label,'wiki-ui',ownerKey,ru,en\)/);
 assert.match(source,/if\(ownerKey&&adminEditing&&adminToken\)/);
});

test('only static source-proven notes expose semantic Wiki editorial keys',()=>{
 const src=readFileSync(resolve(root,'pandora-studio-wiki-skill-insights.js'),'utf8');
 const app=readFileSync(resolve(root,'pandora-studio-app.js'),'utf8');
 for(const name of ['Poison','Hymn','Trap','Composite','Linked'])
  assert.ok(src.includes("editorialKey:'osSource"+name+"'+skill.id"),
   name+' must have a stable source-attested key');
 assert.match(app,/if\(ownerKey&&adminEditing&&adminToken\)/);
 assert.match(app,/ownerCopyLabel\(label,'wiki-ui',ownerKey,ru,en\)/);
 const dynamic=src.slice(src.indexOf('const jobs=Object.keys(classes)'),
  src.indexOf('const linked=sourceLinkedEvidence'));
 assert.ok(dynamic.includes("notes.push({ru:row.noteRu||'',en:row.noteEn||''})"));
 assert.doesNotMatch(dynamic,/editorialKey/);
});
