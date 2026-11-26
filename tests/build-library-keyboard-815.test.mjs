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
