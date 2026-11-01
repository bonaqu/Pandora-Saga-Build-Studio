import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html'),js=read('app.js'),css=read('style.css');
const hero=read('hero-path.js');

test('only the site header owns language selection; modal duplicates are gone',()=>{
 assert.match(html,/id="locale" class="locale-switch"/);
 assert.match(html,/data-locale="ru"/);
 assert.match(html,/data-locale="en"/);
 for(const source of [html,js,css])assert.doesNotMatch(source,/dockLocale|dock-locale|data-dock-locale/);
 assert.match(js,/function syncLocaleControls\(\)/);
 assert.match(js,/document\.querySelectorAll\('#locale \[data-locale\]'\)/);
 assert.match(js,/button\.dataset\.locale===lang/);
 assert.match(js,/syncLocaleControls\(\);\s*if\(!catalogSource\)return/);
 assert.match(js,/\$\('locale'\)\.onclick=event=>/);
 assert.match(html,/data-i18n-aria-label="language"/);
});

test('one invested/max value remains in the branch header; exact inputs survive',()=>{
 assert.ok(hero.includes("const branchCount=make('b',{class:'count',text:cap>0||points>0?points+' / '+cap:'—'});"));
 assert.ok(hero.includes("branchCount.textContent=cap>0||target>0?target+' / '+cap:'—';"));
 assert.doesNotMatch(hero,/inline-branch-value|branchPoints|label\.textContent=target\+' \/ '/);
 assert.ok(hero.includes('editor.append(track,legend);'));
 assert.ok(hero.includes("key+':potential-number'"));
 assert.ok(hero.includes("key+':mastery-number'"));
 assert.doesNotMatch(css,/inline-branch-value/);
});
