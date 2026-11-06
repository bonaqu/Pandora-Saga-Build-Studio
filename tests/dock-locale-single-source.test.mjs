import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html'),js=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
const hero=read('pandora-studio-hero-path.js');

test('only the site header owns language selection; modal duplicates are gone',()=>{
 assert.match(html,/id="locale" class="locale-switch"/);
 assert.match(html,/data-locale="ru"/);
 assert.match(html,/data-locale="en"/);
 for(const source of [html,js,css])assert.doesNotMatch(source,/dockLocale|dock-locale|data-dock-locale/);
 assert.match(js,/function syncLocaleControls\(\)/);
 assert.match(js,/document\.querySelectorAll\('#locale \[data-locale\]'\)/);
 assert.match(js,/button\.dataset\.locale===lang/);
 assert.match(js,/syncLocaleControls\(\);\s*if\(!catalogSource\)return/);
 assert.ok(js.includes("$('locale').onclick=async event=>"));
 assert.match(html,/data-i18n-aria-label="language"/);
});

test('one invested/max value remains in the branch header; exact inputs survive',()=>{
 assert.match(hero,/const branchCount=make\('b',\{class:'count',[\s\S]*?trained\+' \/ '\+\(cap\+points\)/);
 assert.match(hero,/branchCount\.textContent=cap>0\?[\s\S]*?branchMastery\(state,key,innate,caps\)\+' \/ '\+\(cap\+target\)/);
 assert.doesNotMatch(hero,/inline-branch-value|branchPoints|label\.textContent=target\+' \/ '/);
 assert.ok(hero.includes('editor.append(track,legend);'));
 assert.ok(hero.includes("key+':potential-number'"));
 assert.ok(hero.includes("key+':mastery-number'"));
 assert.doesNotMatch(css,/inline-branch-value/);
});
