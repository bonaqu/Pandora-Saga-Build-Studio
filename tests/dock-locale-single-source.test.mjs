import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html'),js=read('app.js'),css=read('style.css');
test('one canonical locale transition serves both site header and open modal',()=>{
 assert.match(html,/id="dockLocale"[^>]*role="group"/);
 assert.match(html,/data-dock-locale="ru"/);
 assert.match(html,/data-dock-locale="en"/);
 assert.match(js,/function syncLocaleControls\(\)/);
 assert.match(js,/document\.querySelectorAll\('#locale \[data-locale\], #dockLocale \[data-dock-locale\]'\)/);
 assert.match(js,/\$\('dockLocale'\)\.onclick=event=>\{/);
 assert.match(js,/\$\('locale'\)\.querySelector\('\[data-locale="'\+button\.dataset\.dockLocale\+'"\]'\)\?\.click\(\)/);
 assert.match(js,/syncLocaleControls\(\);\s*if\(!catalogSource\)return/);
 assert.match(js,/\$\('locale'\)\.onclick=event=>/);
});
test('language control remains keyboard accessible in front of modal without overlay hacks',()=>{
 assert.match(css,/\.detail\.is-open \.dock-locale button:focus-visible\{/);
 assert.match(css,/\.detail\.is-open \.dock-locale button\[aria-pressed=true\]/);
 assert.doesNotMatch(css,/\.detail\.is-open \.dock-locale[^}]*pointer-events:none/);
 assert.match(html,/data-i18n-aria-label="language"/);
});
