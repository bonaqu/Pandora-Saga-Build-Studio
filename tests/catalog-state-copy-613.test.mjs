import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const workbench=read('pandora-os-catalog-workbench.js');
const app=read('pandora-studio-app.js');
const css=read('pandora-os-catalog-workbench.css');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);

test('only safe static catalog status text receives a separate inline D1 pencil',()=>{
 assert.match(workbench,/const editorialState=\(target,key,ru,en\)=>/);
 assert.match(workbench,/target\.replaceChildren\(label\)/);
 assert.match(workbench,/if\(!canEdit\|\|typeof editLabel!=='function'\)return/);
 assert.match(workbench,/class:'os-sync-state-pencil'/);
 assert.match(workbench,/label\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(workbench,/target\.append\(pencil\)/);
 assert.match(workbench,/editorialState\(status,'initialStatus'/);
 assert.match(workbench,/editorialState\(status,\.\.\.complete\)/);
 assert.match(workbench,/if\(from==='server'\)editorialState\(sourceBanner/);
 assert.match(workbench,/else editorialState\(sourceBanner,'sourceArchiveNotice'/);
 assert.match(workbench,/status\.textContent=issue\+tr\(/);
 assert.match(workbench,/status\.textContent=\(from==='server'\?/);
 assert.match(css,/\.os-sync-state-caption\.origin-copy-editable::after\{content:none\}/);
 assert.match(css,/\.os-sync-source-banner:has\(>\.os-sync-state-pencil\)/);
});
test('catalog notice and comparison status translations use valid guide edit fields',()=>{
 const labels=['initialStatus','sourceLiveNotice','sourceArchiveNotice','comparisonFound',
  'comparisonFormatting','comparisonFormattingAndRussian','comparisonRussian',
  'comparisonNoChanges','compareSessionExpired','compareNotCompleted'];
 for(const key of labels){
  const dashed=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  assert.equal(root.PandoraHonorGuide.validOverride('book.catalog-sync.'+dashed,
   JSON.stringify({ru:'Пояснение',en:'Explanation'})),true,key);
  assert.ok(workbench.includes("'"+key+"'"),key);
 }
 assert.match(app,/ownerCopy\('catalog-sync',key,ru,en\)/);
 assert.match(app,/refreshVisibleOwnerCopy\('guideedit\.'\+key\)/);
 assert.doesNotMatch(workbench,/request\('\/api\/admin\/catalog\/publish',\{[^}]*editorialState/);
});
