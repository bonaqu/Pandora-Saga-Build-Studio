import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
test('#815 build naming saves on Enter but not IME composition/repeated key',()=>{
 assert.match(app,/name\.addEventListener\('keydown',event=>\{/);
 assert.match(app,/event\.isComposing\|\|event\.repeat/);
 assert.match(app,/if\(!newBuildPromptOpen\)saveBuild\(name\.value\)/);
});
test('#815 Escape clears build-library search without navigating away',()=>{
 assert.match(app,/search\.addEventListener\('keydown',event=>\{/);
 assert.match(app,/search\.value='';buildSearchQuery='';apply\(\)/);
 assert.match(app,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
});

test('#815 library search clear is a visible, keyboard-accessible button with no save side effects',()=>{
 assert.match(app,/class:'build-library-search-wrap'/);
 assert.match(app,/class:'build-library-clear'/);
 assert.match(app,/clearSearch\.hidden=!query/);
 assert.match(app,/clearSearch\.addEventListener\('click',\(\)=>\{/);
 assert.match(app,/search\.value='';buildSearchQuery='';apply\(\);search\.focus\(\{preventScroll:true\}\)/);
 assert.match(app,/'aria-label':tr\('Очистить поиск','Clear search'\)/);
});
