import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
test('English build cards use the localized race and keep user-provided names unchanged',()=>{
 assert.match(app,/races\[b\.data\?\.race\]\?\.\[lang==='en'\?1:0\]/);
 assert.match(app,/searchText:\[b\.name,races\[b\.data\?\.race\]\?\.\[0\],races\[b\.data\?\.race\]\?\.\[1\]/);
 assert.match(app,/text:b\.name/);
});
test('dynamic overwrite text has a direct translation and keeps the stored build name',()=>{
 assert.match(app,/Overwrite saved build “'\+b\.name\+'” with your current character/);
 assert.match(app,/Перезаписать сохранённый билд «'\+b\.name\+'» текущим персонажем/);
 const root={};vm.runInNewContext(read('pandora-studio-ui-locale.js'),{window:root});
 assert.equal(root.PandoraUILocale.ui('↻ Сохранить в этот билд','en'),'↻ Save to this build');
});
