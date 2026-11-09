import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const begin=app.indexOf('function buildLegacyImport(){');
const end=app.indexOf('function renderBuilds(root){',begin);
assert.ok(begin>=0&&end>begin,'Test the real account import panel');
const implementation=app.slice(begin,end);
function h(tag,props={},children=[]){
 const el={tag,props,hidden:Boolean(props.hidden),value:props.value??'',
  textContent:props.text??'',onclick:props.onclick??null,disabled:false,
  children:[],
  append(...items){this.children.push(...items)}
 };
 el.append(...(Array.isArray(children)?children:[children]).filter(Boolean));
 return el;
}
const flatten=node=>[node,...node.children.flatMap(flatten)];
const panel=lang=>{
 const factory=Function('h','lang',implementation+'\nreturn buildLegacyImport;');
 const root=factory(h,lang)();
 return {root,nodes:flatten(root)};
};
test('the English account import uses clear localized controls and hides recovery keys',async()=>{
 const {nodes}=panel('en');
 const visible=nodes.flatMap(el=>[el.textContent,el.props?.placeholder,
  el.props?.['aria-label']]).filter(Boolean).join(' ');
 for(const label of ['Import older builds','Check code','Find on this device',
  'Add builds to my account','Previously saved without an account'])
  assert.ok(visible.includes(label),label);
 assert.equal(/[А-Яа-яЁё]/.test(visible),false);
 const input=nodes.find(el=>el.props?.['aria-label']==='Previous library code');
 assert.ok(input);
 assert.equal(input.value,'','No old guest key is rendered or revealed by default');
 const verify=nodes.find(el=>el.textContent==='Check code');
 assert.ok(verify);
 await verify.onclick();
 const feedback=nodes.find(el=>el.props?.role==='status');
 assert.match(feedback.textContent,/64 characters/);
});
test('the Russian account import stays compact and uses the same form logic',async()=>{
 const {nodes}=panel('ru');
 const text=nodes.map(el=>el.textContent).join(' ');
 assert.match(text,/Перенести старые билды/);
 assert.match(text,/Добавить билды в мой аккаунт/);
 assert.match(text,/Найти на этом устройстве/);
 const code=nodes.find(el=>el.props?.['aria-label']==='Код старой библиотеки');
 assert.ok(code&&code.value==='');
 await nodes.find(el=>el.textContent==='Проверить код').onclick();
 const feedback=nodes.find(el=>el.props?.role==='status');
 assert.match(feedback.textContent,/64 символа/);
});
test('legacy import cannot silently transfer across account or owner changes',()=>{
 assert.match(implementation,/token!==window\.PandoraAccountUI\?\.token\(\)/);
 assert.match(implementation,/owner!==libraryScopeId\(\)/);
 assert.match(implementation,/window\.PandoraAccountUI\.token\(\)!==selectedToken/);
 assert.match(implementation,/libraryScopeId\(\)!==selectedOwner/);
 assert.match(implementation,/if\(!persistBuilds\(\)\)/);
 assert.match(implementation,/builds=previous/);
 assert.match(implementation,/await putCloudBuild\(row\)/);
});
