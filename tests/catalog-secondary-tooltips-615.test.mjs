import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const catalog=read('pandora-os-catalog-workbench.js');
const app=read('pandora-studio-app.js');
const css=read('pandora-os-catalog-workbench.css');
const global={};global.window=global;
runInNewContext(read('pandora-studio-honor-guide.js'),global);

test('secondary catalog help keeps three independent RU/EN D1 keys',()=>{
 for(const key of ['hintSearch','hintArchiveDisclosure','hintAdvancedDisclosure']){
  const slug=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  assert.equal(global.PandoraHonorGuide.validOverride('book.catalog-sync.'+slug,
   JSON.stringify({ru:'Подсказка',en:'Help'})),true,key);
  assert.ok(catalog.includes("'"+key+"'"),key);
 }
 assert.match(catalog,/secondaryHint\(archiveChoice,'hintArchiveDisclosure'/);
 assert.match(catalog,/secondaryHint\(advanced,'hintAdvancedDisclosure'/);
 assert.match(catalog,/secondaryHint\(search,'hintSearch'/);
 assert.match(catalog,/searchField\.classList\.add\('os-sync-search-field'\)/);
 assert.match(catalog,/for\(const element of \[filters,overview,searchField,results\]\)element\.hidden=!reviewing/);
});

test('independent secondary editor never replaces a native summary/input or executes an action',()=>{
 assert.match(catalog,/const target=control\.matches\('details'\)\?/);
 assert.match(catalog,/control\.querySelector\('summary'\):control/);
 assert.match(catalog,/wrap\.append\(control\)/);
 assert.match(catalog,/class:'os-sync-secondary-pencil'/);
 assert.match(catalog,/target\.dataset\.guideOwnerKey=key/);
 assert.match(catalog,/onCommitted:next=>\{target\.dataset\.guideHint=next\}/);
 assert.match(catalog,/host\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.doesNotMatch(catalog,/target\.dispatchEvent\(new MouseEvent\('click'/);
 assert.match(catalog,/if\(!target\.isConnected\)return/);
 assert.match(css,/\.os-sync-secondary-hint\{display:grid/);
 assert.match(css,/\.os-sync-secondary-host\{grid-column:1\/-1/);
 assert.match(app,/if\(target\.dataset\.guideOwnerKey===id\)target\.dataset\.guideHint=value/);
});
