import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('portrait carousel presents eight independent race-appearance options',()=>{
 const app=get('app.js');
 assert.match(app,/const portraitOptions=\[/);
 const matches=app.match(/\{race:[0-5],gender:[01]\}/g)||[];
 assert.equal(matches.length,8);
 assert.match(app,/state\.race=i;state\.gender=gender/);
 assert.match(app,/selectedPortraitIndex\(state\.race,state\.gender\)/);
 assert.match(app,/chosen=state\.race===i&&/);
});
test('class tree reads real OS parent relations',()=>{
 const app=get('app.js'),classes=JSON.parse(get('data/os/classes.json'));
 assert.match(app,/catalog\.classes\?\.\[key\]\?\.parent/);
 assert.match(app,/class-tree-node/);
 assert.deepEqual(Object.values(classes).filter(c=>c.parent==null).map(c=>c.id).sort(),['ACOLYTE','MAGE','SCOUT','WARRIOR']);
 assert.equal(Object.keys(classes).length,28);
});
test('portrait art fits entire picture and technical labels are hidden',()=>{
 const css=get('style.css'),html=get('index.html');
 assert.match(css,/object-fit:contain!important/);
 assert.match(css,/#siteNotice,\.gender-controls,#swapGender,\.portrait-bottom,\.mini-note/);
 assert.doesNotMatch(html,/Портреты из пользовательского архива Races\.zip/);
 assert.match(html,/class="portrait-bottom" hidden/);
});
