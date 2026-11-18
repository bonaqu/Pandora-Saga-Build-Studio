import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={navigator:{userAgent:'Mozilla/5.0 Chrome/154.0 YaBrowser/26.11.0.0'}};
const attach=window=>{
 Function('window',read('pandora-studio-noncredential-guard.js'))(window);
 Function('window',read('pandora-studio-numeric-field.js'))(window);
};
attach(host);

class Input {
 constructor(type='number'){
  this.type=type;this.value='21';this.attributes={};this.listeners={};
  this.registrations={};this.readOnly=false;this.disabled=false;
  this.ownerDocument={activeElement:this};
 }
 setAttribute(key,value){this.attributes[key]=String(value)}
 getAttribute(key){return this.attributes[key]??null}
 addEventListener(key,fn){this.listeners[key]=fn;this.registrations[key]=(this.registrations[key]||0)+1}
 fire(event,props={}){
  const arg={type:event,isTrusted:true,inputType:'',stopped:false,
   stopImmediatePropagation(){this.stopped=true},...props};
  this.listeners[event]?.(arg);
  return arg;
 }
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
 // Idle autofill must never flow to Origin/Book handlers or persist as stats.
 input.value='777';const injected=input.fire('input',{isTrusted:false});
 assert.equal(input.value,'21','Idle numeric credential replacement is rolled back');
 assert.equal(injected.stopped,true,'Game listeners never see the unexpected value');
 input.value='888';const changed=input.fire('change',{isTrusted:false});
 assert.equal(input.value,'21');
 assert.equal(changed.stopped,true);
 input.fire('focus');
 assert.equal(input.readOnly,true,'browser focus alone does not unlock Yandex autofill');
 input.fire('blur');
 assert.equal(input.readOnly,true,'inactive field is autofill-resistant');
 input.fire('keydown',{isTrusted:false});
 assert.equal(input.readOnly,true,'Synthetic key events cannot unlock an idle stat');
 input.fire('pointerdown',{isTrusted:false});
 assert.equal(input.readOnly,true,'Synthetic pointer events are not a user action');
 input.fire('keydown');
 assert.equal(input.readOnly,false,'keyboard access remains usable');
 input.value='32';input.fire('input');
 assert.equal(input.value,'32');
 input.fire('blur');
 assert.equal(input.readOnly,true);
 input.value='51';input.fire('focus');
 assert.equal(input.value,'32','Browser value injection after blur cannot survive focus');
 input.fire('pointerdown');
 assert.equal(input.readOnly,false,'pointer and press-hold controls stay usable');
 input.fire('blur');
 input.fire('touchstart');
 assert.equal(input.readOnly,false,'touchscreen steppers stay usable');
 input.fire('blur');
 input.fire('beforeinput',{isTrusted:true,inputType:'insertCompositionText'});
 assert.equal(input.readOnly,false,'IME input is a legitimate editing gesture');
 input.fire('blur');
 const registrations={...input.registrations};
 host.PandoraNumericField.prepare(input);
 assert.deepEqual(input.registrations,registrations,
  'Repeated UI renders must not accumulate numeric field listeners');
 assert.equal(input.readOnly,true,'Re-preparing must not unlock an idle control');
 input.value='909';
 assert.equal(input.fire('input',{isTrusted:false}).stopped,true);
 assert.equal(input.value,'32','Read-only value stays at the latest manual number');
});
test('standard Chromium number fields stay editable for direct manual typing and browser tests',()=>{
 const chromium={navigator:{userAgent:'Mozilla/5.0 Chrome/154.0.0.0'}};
 attach(chromium);
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
 assert.ok(html.indexOf('pandora-studio-noncredential-guard.js')<
  html.indexOf('pandora-studio-numeric-field.js'));
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

test('Honor location search is a gameplay search, not a credential entry',()=>{
 const honor=read('pandora-studio-honor-view.js');
 assert.match(honor,/Найти локацию…','Find a location…'\),\s*autocomplete:'none'/);
 assert.match(honor,/'data-lpignore':'true','data-1p-ignore':'true'/);
 assert.match(honor,/'data-bwignore':'true','data-form-type':'other'/);
});
