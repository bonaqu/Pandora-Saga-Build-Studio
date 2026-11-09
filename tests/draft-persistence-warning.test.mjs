import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const start=app.indexOf('function draftStorageStatus(failed){');
const end=app.indexOf('\nfunction persistBuilds(){',start);
assert.ok(start>=0&&end>start);
const snippet=app.slice(start,end);
function fixture(lang='ru'){
 const elements=new Map(),body={append(el){elements.set(el.id,el)}};
 const document={body,
  createElement(tag){
   const element={tagName:tag,children:[],dataset:{},textContent:'',className:'',
    attributes:{},append(...children){this.children.push(...children)},
    setAttribute(name,value){this.attributes[name]=value},
    querySelector(name){return this.children.find(x=>x.tagName===name)},
    remove(){elements.delete(this.id)}};
   return element;
  },
  getElementById:id=>elements.get(id)||null};
 let fail=true,writes=0;
 const scope={PandoraBuildScope:{setOwned(){writes++;if(fail)throw Error('quota');return true}}};
 const f=Function('document','window','localStorage','libraryScopeId','state','console','lang',
  snippet+'\nreturn {persist,draftStorageStatus}')(
  document,scope,{},()=> 'guest:'+'a'.repeat(64),{name:'Unsaved hero'},{warn(){}},lang);
 return {...f,elements,setFailure:value=>{fail=value},writes:()=>writes};
}

test('draft write failures show one visible status and clear it after recovery',()=>{
 const f=fixture();
 assert.equal(f.persist(),false);
 let warning=f.elements.get('draftStorageWarning');
 assert.ok(warning);
 assert.equal(warning.attributes.role,'alert');
 assert.match(warning.querySelector('strong').textContent,/не сохранены/);
 f.persist();
 assert.equal(f.elements.get('draftStorageWarning'),warning,
  'Repeated slider writes should not create additional notices');
 f.setFailure(false);
 assert.equal(f.persist(),true);
 assert.equal(f.elements.has('draftStorageWarning'),false);
});
test('English status is clear and no warning is shown for successful writes',()=>{
 const f=fixture('en');
 f.setFailure(false);
 assert.equal(f.persist(),true);
 assert.equal(f.elements.size,0);
 f.setFailure(true);
 assert.equal(f.persist(),false);
 assert.match(f.elements.get('draftStorageWarning').querySelector('strong').textContent,
  /not saved/);
});
