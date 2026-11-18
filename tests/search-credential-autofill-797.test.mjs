import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const guard=read('pandora-studio-noncredential-guard.js');
const source=read('pandora-studio-search-field.js');
function createSandbox(agent){
 const document={activeElement:null,readyState:'complete',addEventListener(){}};
 const sandbox={window:{navigator:{userAgent:agent}},document};
 vm.runInNewContext(guard,sandbox,{filename:'pandora-studio-noncredential-guard.js'});
 vm.runInNewContext(source,sandbox,{filename:'pandora-studio-search-field.js'});
 return {api:sandbox.window.PandoraSearchField,document};
}
function mockInput(type='search',value='',id=''){
 const attrs=new Map(),handlers=new Map();
 const el={
  tagName:'INPUT',type,id,value,readOnly:false,disabled:false,ownerDocument:null,
  setAttribute(k,v){attrs.set(k,String(v))},
  getAttribute(k){return attrs.get(k)??null},
  addEventListener(name,handler){const all=handlers.get(name)||[];
   all.push(handler);handlers.set(name,all)},
  fire(name,props={}){
   const event={type:name,isTrusted:true,inputType:'',stopped:false,
    stopImmediatePropagation(){this.stopped=true},...props};
   for(const handler of handlers.get(name)||[])handler(event);
   return event;
  }
 };
 return el;
}

test('shared search policy guards Yandex idle inputs and preserves true user edits',()=>{
 const {api,document}=createSandbox('Mozilla/5.0 YaBrowser/26.11.0.0');
 const field=mockInput('search','гигантский огр','bookDamageTarget');
 field.ownerDocument=document;
 assert.equal(api.prepare(field),field);
 assert.equal(field.getAttribute('autocomplete'),'none');
 assert.equal(field.getAttribute('data-lpignore'),'true');
 assert.equal(field.getAttribute('data-1p-ignore'),'true');
 assert.equal(field.getAttribute('data-bwignore'),'true');
 assert.equal(field.getAttribute('data-ps-noncredential-search'),'true');
 assert.equal(field.getAttribute('aria-autocomplete'),'none');
 assert.equal(field.getAttribute('name'),'ps-filter-bookDamageTarget');
 assert.equal(field.readOnly,true);
 field.value='administrator';
 const attempted=field.fire('input');
 assert.equal(attempted.stopped,true,'Credential injection must not reach search handler');
 assert.equal(field.value,'гигантский огр');
 field.value='login injected without event';
 field.fire('focus');
 assert.equal(field.value,'гигантский огр');
 field.fire('pointerdown');
 assert.equal(field.readOnly,false);
 field.value='Рыжий динго';field.fire('input');
 field.fire('blur');
 assert.equal(field.readOnly,true);
 field.value='administrator';field.fire('keydown');
 assert.equal(field.readOnly,false);
 assert.equal(field.value,'Рыжий динго');
 field.fire('blur');
 assert.equal(field.readOnly,true);
 // Synthetic gestures and automated replacement cannot unlock an idle input.
 field.fire('keydown',{isTrusted:false});
 field.fire('pointerdown',{isTrusted:false});
 assert.equal(field.readOnly,true);
 document.activeElement=field;
 field.fire('beforeinput',{isTrusted:false,inputType:'insertFromPaste'});
 field.fire('beforeinput',{inputType:'insertReplacementText'});
 assert.equal(field.readOnly,true,'Synthetic paste and autofill replacement stay blocked');
 field.fire('beforeinput',{inputType:'insertFromPaste'});
 assert.equal(field.readOnly,false,'Focused user paste may unlock native search');
 field.value='Душа из буфера';field.fire('input');field.fire('blur');
 assert.equal(field.readOnly,true);
 field.fire('beforeinput',{inputType:'insertFromDictation'});
 assert.equal(field.readOnly,false,'Focused dictation remains accessible');
 field.fire('blur');
 // Reinitializing a recycled input must not double-register handlers.
 api.prepare(field);
 assert.equal(field.readOnly,true);
});

test('non-Yandex Chromium retains native editable search, but never credential hints',()=>{
 const {api,document}=createSandbox('Mozilla/5.0 Chrome/154.0.0.0');
 const field=mockInput('search','',null);
 api.prepare(field);
 assert.equal(field.readOnly,false);
 assert.equal(field.getAttribute('autocomplete'),'none');
 assert.match(field.getAttribute('name'),/^ps-filter-/);
 field.value='монстр';assert.equal(field.fire('input').stopped,false);
});

test('real username, password, email and owner text editors are not changed',()=>{
 const {api,document}=createSandbox('Mozilla/5.0 YaBrowser/26.11.0.0');
 const types=['password','text','email','number'];
 for(const type of types){
  const field=mockInput(type,'administrator');
  api.prepare(field);
  assert.equal(field.getAttribute('autocomplete'),null);
  assert.equal(field.getAttribute('name'),null);
  assert.equal(field.readOnly,false);
 }
 const custom={tagName:'SPAN',type:'search',setAttribute(){throw Error('contenteditable must not be touched')}};
 api.prepare(custom);
});

test('one common policy is loaded before all dynamic search constructors',()=>{
 const html=read('index.html');
 const app=read('pandora-studio-app.js');
 assert.ok(html.indexOf('pandora-studio-noncredential-guard.js')>0);
 assert.ok(html.indexOf('pandora-studio-noncredential-guard.js')<html.indexOf('pandora-studio-search-field.js'));
 assert.ok(html.indexOf('pandora-studio-noncredential-guard.js')<html.indexOf('pandora-studio-numeric-field.js'));
 assert.match(source,/PandoraNonCredentialGuard\.protect\(input\)/);
 const book=read('pandora-studio-hero-book.js');
 const equipment=read('pandora-studio-equipment-ui.js');
 assert.ok(html.indexOf('pandora-studio-search-field.js')>0);
 assert.ok(html.indexOf('pandora-studio-search-field.js')<
  html.indexOf('pandora-studio-hero-book.js'));
 assert.ok(html.indexOf('pandora-studio-search-field.js')<
  html.indexOf('pandora-studio-app.js'));
 assert.match(app,/PandoraSearchField\?\.prepare\(el\)/);
 assert.match(book,/PandoraSearchField\?\.prepare\(n\)/);
 assert.match(equipment,/PandoraSearchField\?\.prepare\(e\)/);
 assert.match(app,/return window\.PandoraSearchField\?\.prepare\(input\)\|\|input;/);
 assert.match(source,/MutationObserver\(changes=>/);
 assert.match(source,/document\.addEventListener\('DOMContentLoaded',observe/);
 assert.match(source,/attributeFilter:\['type'\]/);
 assert.match(guard,/event.stopImmediatePropagation\?\.\(\)/);
});

test('remaining search surfaces preserve native searchbox while retired Book target search is absent',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 const equipment=read('pandora-studio-equipment-ui.js');
 const honor=read('pandora-studio-honor-view.js');
 const catalog=read('pandora-os-catalog-workbench.js');
 assert.doesNotMatch(book,/class:'stage-book-target-search'/);
 assert.match(book,/function skillEffectsPage\(/);
 assert.match(app,/class:'build-library-search'/);
 assert.match(app,/id:'pathSkillSearch'|search=h\('input',\{type:'search',value:wikiSearch/);
 assert.match(equipment,/type:'search',placeholder:copy\('soulSearch'/);
 assert.match(honor,/const search=make\('input',\{type:'search'/);
 assert.match(catalog,/class:'os-sync-search'/);
 assert.match(read('index.html'),/id="pathSkillSearch" type="search"/);
});
