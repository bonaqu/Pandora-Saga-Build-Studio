import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={navigator:{userAgent:'Mozilla/5.0 Chrome/154.0 YaBrowser/26.11.0.0'}};
Function('window',read('pandora-studio-numeric-field.js'))(host);

class Input {
 constructor(type='number'){this.type=type;this.attributes={};this.listeners={};this.readOnly=false;this.disabled=false}
 setAttribute(key,value){this.attributes[key]=String(value)}
 getAttribute(key){return this.attributes[key]??null}
 addEventListener(key,fn){this.listeners[key]=fn}
 fire(event){this.listeners[event]?.({type:event})}
}
test('number fields request Yandex no-autofill, gate idle edits, and restore manual focus/typing',()=>{
 const input=new Input('number');
 assert.equal(host.PandoraNumericField.prepare(input),input);
 assert.equal(input.readOnly,true);
 for(const [key,value]of [
  ['autocomplete','none'],['aria-autocomplete','none'],['data-lpignore','true'],
  ['data-1p-ignore','true'],['data-bwignore','true'],['data-form-type','other'],
  ['data-game-numeric','true']])
  assert.equal(input.getAttribute(key),value,key);
 input.fire('focus');
 assert.equal(input.readOnly,true,'browser focus alone does not unlock Yandex autofill');
 input.fire('blur');
 assert.equal(input.readOnly,true,'inactive field is autofill-resistant');
 input.fire('keydown');
 assert.equal(input.readOnly,false,'keyboard access remains usable');
 input.fire('blur');
 input.fire('pointerdown');
 assert.equal(input.readOnly,false,'pointer and press-hold controls stay usable');
});
test('standard Chromium number fields stay editable for direct manual typing and browser tests',()=>{
 const chromium={navigator:{userAgent:'Mozilla/5.0 Chrome/154.0.0.0'}};
 Function('window',read('pandora-studio-numeric-field.js'))(chromium);
 const field=new Input('number');
 chromium.PandoraNumericField.prepare(field);
 assert.equal(field.getAttribute('autocomplete'),'none');
 assert.equal(field.readOnly,false);
});
test('numeric guard never touches credentials or normal text/search controls',()=>{
 for(const type of ['password','text','search','checkbox','range']){
  const input=new Input(type);
  host.PandoraNumericField.prepare(input);
  assert.equal(input.readOnly,false,type);
  assert.equal(input.getAttribute('autocomplete'),null,type);
 }
});
test('numeric guard is shared by all Hero Path, Origin and Hero Book factories',()=>{
 const html=read('index.html'),app=read('pandora-studio-app.js'),
  path=read('pandora-studio-hero-path.js'),book=read('pandora-studio-hero-book.js');
 assert.ok(html.includes('src="pandora-studio-numeric-field.js?v='+JSON.parse(read('site-version.json')).release+'"></script>'),
  'new helper must have its own closed script tag before loading Hero Book');
 assert.ok(html.indexOf('pandora-studio-numeric-field.js')<html.indexOf('pandora-studio-hero-book.js'));
 assert.match(app,/PandoraNumericField\?\.prepare\(el\)/);
 assert.match(path,/PandoraNumericField\?\.prepare\(e\)/);
 assert.match(book,/PandoraNumericField\?\.prepare\(n\)/);
 assert.match(app,/class:'origin-stat-input'/);
 assert.match(path,/data-branch-control/);
 assert.match(book,/data-book-setting/);
 assert.match(app,/const isLogin=String\(attrs\.type\|\|''\)/);
 assert.match(app,/autocomplete:'current-password'/);
});
test('milestone tooltip and two skill numeric descriptions are short, distinct and bilingual',()=>{
 const path=read('pandora-studio-hero-path.js'),css=read('pandora-studio-theme.css');
 assert.match(path,/data-milestone-invested/);
 assert.match(path,/const neededInvestment=Math\.max\(0,threshold-base\)/);
 assert.match(path,/path-milestone-investment/);
 assert.match(css,/\.path-milestone-investment\{/);
 assert.match(path,/Очки умений, распределяемые при развитии персонажа/);
 assert.match(path,/Растёт при использовании умений этой ветки, а также соответствующих типов атак или оружия/);
 assert.match(path,/Skill points allocated as the character develops/);
 assert.match(path,/corresponding attack or weapon types/);
});

test('ordinary dynamic searches request Yandex no-login autofill, never readonly',()=>{
 const app=read('pandora-studio-app.js'),equipment=read('pandora-studio-equipment-ui.js');
 const html=read('index.html'),account=read('pandora-studio-account-ui.js');
 assert.match(app,/attrs=\{\.\.\.attrs,autocomplete:'none','data-lpignore':'true'/);
 assert.match(equipment,/attrs=\{\.\.\.attrs,autocomplete:'none','aria-autocomplete':'none'/);
 assert.match(html,/id="pathSkillSearch"[^>]+autocomplete="none"/);
 assert.match(equipment,/const query=el\('input',\{type:'search'/);
 assert.doesNotMatch(app.slice(app.indexOf('function h(tag,attrs={}'),
  app.indexOf('function imageUrl(')),/readOnly=true/);
 assert.match(account,/field\('Логин \(3–20, a-z, 0-9, _\)','text','username',20\)/);
 assert.match(account,/mode==='login'\?'current-password':'new-password'/);
});
