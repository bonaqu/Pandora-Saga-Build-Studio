import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('item chooser points forward toward item properties in both interfaces',()=>{
 const css=read('pandora-studio-workbench-guidance.css');
 const app=read('pandora-studio-app.js');
 const item=read('pandora-studio-equipment-ui.js');
 assert.match(css,/stage-picker-mode-link::before\{content:"→"/);
 assert.match(css,/return-to-properties::before\{content:"→"/);
 assert.match(item,/setAttribute\('aria-label',tr\('Перейти к свойствам','Go to properties'\)\)/);
 assert.match(app,/'aria-label':lang==='en'\?'Go to properties':'Перейти к свойствам'/);
 assert.doesNotMatch(app,/PandoraGuideTooltip\?\.attach\(detailsLink/);
});

test('fixed library controls and sort are D1-authorable without serializing live player names',()=>{
 const root={};vm.runInNewContext(read('pandora-studio-ui-locale.js'),{window:root});
 const L=root.PandoraUILocale;
 for(const key of [
  'libraryCurrentBadge','librarySortCaption','librarySortAria',
  'librarySortSaved','librarySortName','librarySortLevel','librarySortClass',
  'libraryBuildNameAria','libraryDraftNameAria'
 ]){
  assert.ok(L.fieldKey(key)?.startsWith('ui.label.library-'),key);
  assert.ok(L.text(key,'ru')&&L.text(key,'en'),key);
 }
 assert.equal(L.text('libraryCurrentBadge','en'),'● Current build');
 L.setOverrides({'guideedit.book.ui.label.library-current-badge':
  JSON.stringify({ru:'● Открыт',en:'● Active'})});
 assert.equal(L.text('libraryCurrentBadge','ru'),'● Открыт');
 assert.equal(L.text('libraryCurrentBadge','en'),'● Active');
 const app=read('pandora-studio-app.js');
 assert.match(app,/libraryText\('libraryCurrentBadge'\)/);
 assert.match(app,/libraryText\('librarySortSaved'\)/);
 assert.match(app,/const check=h\('input',\{type:'checkbox','aria-label':libraryText\('libraryCompare'\)\+' '\+b\.name/);
 assert.match(app,/name:b\.name|text:b\.name/);
});

test('owner label saves update active library controls without remounting the cards',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/function refreshVisibleUICopy\(recordKey\)/);
 assert.match(app,/\[data-library-action-copy\]/);
 assert.match(app,/const sort=document\.querySelector\('#detailContent \.build-library-sort-select'\)/);
 assert.match(app,/if\(id===locale\.fieldKey\('libraryCompare'\)\)/);
 assert.match(app,/checkbox\.setAttribute\('aria-label',label\+' '\+name\)/);
 assert.match(app,/\['librarySortSaved','saved'\]/);
 assert.match(app,/\['librarySortClass','class'\]/);
 assert.match(app,/\[data-owner-copy-key\]/);
 assert.doesNotMatch(app,/if\(isLibrary\)renderDetails\(\)/);
});

test('the current saved build and compare selection remain distinct',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-build-comparison.css');
 assert.match(app,/const isCurrent=b\.id===activeBuildId/);
 assert.match(app,/if\(isCurrent\)box\.setAttribute\('aria-current','true'\)/);
 assert.match(css,/\.build-grid>\.build-card\.is-current/);
 assert.match(app,/check\.checked=compareIds\.includes\(b\.id\)/);
});
