import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-honor-guide.js'))(root);
Function('window',read('pandora-studio-item-presentation.js'))(root);
const guide=root.PandoraHonorGuide,items=root.PandoraItemPresentation;

test('D1 book guide schema supports independent encyclopedia hint RU and EN',()=>{
 const key='wiki.item-field.pen';
 assert.equal(items.fieldHintKey('PEN'),key);
 assert.equal(guide.validOverride('book.'+key,
  JSON.stringify({hintRu:'Новый русский текст',hintEn:'New English text'})),true);
 const overrides={['guideedit.book.'+key]:
  JSON.stringify({hintRu:'Новый русский текст',hintEn:'New English text'})};
 assert.equal(items.fieldHint('PEN','ru',overrides),'Новый русский текст');
 assert.equal(items.fieldHint('PEN','en',overrides),'New English text');
 assert.equal(items.fieldHint('W','ru',overrides),'Базовая физическая атака оружия.');
 assert.equal(items.fieldHint('invalid','en',overrides),null);
 assert.equal(guide.validOverride('book.'+key,JSON.stringify({hintRu:''})),false);
 assert.equal(guide.validOverride('book.'+key,
  JSON.stringify({hintEn:'x'.repeat(361)})),false);
});

test('real Worker D1 override path authenticates, CAS checks, and serves saved UI copy',async()=>{
 const values=new Map();
 const DB={prepare(sql){
  let args=[];
  return{
   bind(...params){args=params;return this},
   first:async()=>sql.includes('sessions')?{id:1}:null,
   all:async()=>({results:[...values].map(([key,value])=>({key,value}))}),
   run:async()=>{
    let changed=0;
    if(sql.startsWith('INSERT INTO overrides')&&
     !values.has(args[0])){values.set(args[0],args[1]);changed=1}
    if(sql.startsWith('UPDATE overrides')&&
     values.get(args[2])===args[3]){values.set(args[2],args[0]);changed=1}
    return {meta:{changes:changed}};
   }
  };
 }};
 const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override';
 const headers={'Origin':'https://bonaqu.github.io',
  'Authorization':'Bearer '+'a'.repeat(43)};
 const send=(key,value,expectedValue=null,auth=true)=>worker.fetch(new Request(endpoint,{
  method:'POST',headers:auth?headers:{'Origin':'https://bonaqu.github.io'},
  body:JSON.stringify({key,value,expectedValue})
 }),{DB});
 const key='guideedit.book.wiki.item-field.pen';
 const initial=JSON.stringify({hintRu:'Коротко',hintEn:'Concise'});
 const created=await send(key,initial);
 assert.equal(created.status,200,await created.clone().text());
 assert.equal(values.get(key),initial);
 const publicRead=await worker.fetch(new Request(
  'https://ps-build-studio-cloud.bonaqu.workers.dev/api/overrides',
  {headers:{'Origin':'https://bonaqu.github.io'}}),{DB});
 assert.equal(publicRead.status,200);
 assert.equal((await publicRead.json()).values[key],initial);
 assert.equal((await send(key,initial)).status,409,'stale insert must not overwrite');
 assert.equal((await send(key,JSON.stringify({hintRu:'Изменено'}),initial)).status,200);
 assert.equal((await send(key,'{}',JSON.stringify({hintRu:'Изменено'}))).status,400);
 assert.equal((await send('guideedit.book.unknown',initial,null,false)).status,401);
 assert.equal((await send('guideedit.other.bad',initial)).status,400);
});

test('UI editing uses tiny in-place controls, blur save and no extra modal route',()=>{
 const app=read('pandora-studio-app.js'),css=read('pandora-studio-wiki-polish.css');
 assert.match(app,/caption\.addEventListener\('dblclick',editLabel\)/);
 assert.match(app,/class:'wiki-label-pencil'/);
 assert.match(app,/class:'wiki-label-inline-edit'/);
 assert.match(app,/class:'wiki-hint-pencil'/);
 assert.match(app,/class:'wiki-hint-inline-edit'/);
 assert.match(app,/saveGuidePatch\('book\.'\+/);
 assert.match(app,/function bindStaticUICopyEditors\(/);
 assert.match(app,/locale\.fieldKey\(key\)/);
 assert.match(app,/class:'ui-content-pencil'/);
 assert.match(app,/window\.PandoraUILocale\.setOverrides\(override\)/);
 assert.match(css,/\.wiki-hint-inline-edit/);
 const edit=app.slice(app.indexOf('function editWikiValue('),
  app.indexOf('// Repeated blur saves'));
 assert.match(edit,/control\.onblur=\(\)=>/);
 assert.doesNotMatch(app.slice(app.indexOf('function bindStaticUICopyEditors'),
  app.indexOf('\/\* Authenticated on-page editing;')),/modal\(/);
});
