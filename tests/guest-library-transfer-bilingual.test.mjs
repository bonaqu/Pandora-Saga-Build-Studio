import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const extract=(first,last)=>{
 const a=app.indexOf(first),b=app.indexOf(last,a+first.length);
 assert.ok(a>=0&&b>a,'Production function not found: '+first);
 return app.slice(a,b);
};
const transfer=extract('function buildLibraryTransfer(){','\nfunction renderBuilds(');
const connect=extract('async function connectCloudLibrary(secret,feedback){',
 '\nfunction buildLibraryTransfer(){');
const legacySecret='a'.repeat(64),otherSecret='b'.repeat(64);

function node(tag,props={},children=[]){
 const items=Array.isArray(children)?children:[children];
 return{
  tag,props,textContent:props.text||'',value:props.value||'',disabled:false,
  onclick:props.onclick||null,children:items.filter(Boolean),
  append(...more){this.children.push(...more)},
  focus(){},select(){}
 };
}
const all=el=>[el,...el.children.flatMap(all)];
function panel(language){
 const calls=[],clipboard=[];
 const getPanel=Function('h','lang','tabGuestSecret','navigator','connectCloudLibrary',
  transfer+'\nreturn buildLibraryTransfer;')(
   node,language,legacySecret,{
    clipboard:{writeText:async text=>clipboard.push(text)}
   },async(secret,feedback)=>{
    calls.push({secret,feedback});return true;
   });
 return{root:getPanel(),calls,clipboard};
}

test('English guest cloud transfer uses English buttons, labels, warning and helper text',async()=>{
 const {root,clipboard}=panel('en'),elements=all(root);
 const visible=elements.map(el=>[
  el.textContent,el.props?.placeholder,el.props?.['aria-label']
 ].filter(Boolean).join(' ')).join(' ');
 assert.ok(visible.includes('Transfer or recover cloud builds'));
 assert.ok(visible.includes('Never share this code'));
 assert.ok(visible.includes('Connect and merge'));
 assert.equal(/[А-Яа-яЁё]/.test(visible),false,
  'English panel must not leak unlocalized Russian controls');
 const copy=elements.find(el=>el.tag==='button'&&
  el.textContent==='Reveal my code');
 const secret=elements.find(el=>el.props?.['aria-label']==='Personal library code');
 assert.ok(copy&&secret);
 assert.equal(secret.value,'','Guest code must never be shown before an explicit click');
 await copy.onclick();
 assert.equal(secret.value,legacySecret);
 assert.equal(copy.textContent,'Copy my code');
 await copy.onclick();
 assert.deepEqual(clipboard,[legacySecret]);
 assert.equal(copy.textContent,'✓ Code copied');
});

test('Russian transfer remains unchanged and never reveals the guest secret by default',()=>{
 const {root}=panel('ru'),elements=all(root);
 const values=elements.map(el=>[el.textContent,el.props?.placeholder].join(' ')).join(' ');
 assert.match(values,/Перенести или восстановить облачные билды/);
 assert.match(values,/Сохраните личный код библиотеки/);
 assert.match(values,/Подключить и объединить/);
 const secret=elements.find(el=>el.props?.['aria-label']==='Личный код библиотеки');
 assert.equal(secret?.value,'');
});

function connectHarness(language,{authenticated=false,pending=false,records=[]}={}){
 const actions=[],store=new Map(),window={
  PandoraAccountUI:{isLoggedIn:()=>authenticated},
  PandoraBuildScope:{owner:(_username,key)=>'guest:'+key}
 };
 const factory=Function('lang','window','queuedDeletes','libraryScopeId',
  'cloudLibraryRequest','localStorage','CLOUD_TOKEN_KEY',
  'activateLibraryScope','selectActiveBuild','loadCloudBuilds','originalSecret',
  'let tabGuestSecret=originalSecret,libraryChangeId=0;\n'+connect+
  '\nreturn {connect:connectCloudLibrary,secret:()=>tabGuestSecret,'+
  'changeId:()=>libraryChangeId};');
 return{...factory(language,window,()=>pending?['pending']:[],
  ()=>'guest:'+legacySecret,
  async()=>({records}),
  {setItem:(key,value)=>{store.set(key,value);actions.push('store')}},
  'ps-build-library-secret.v1',
  opts=>actions.push('scope'),
  id=>actions.push('selected:'+id),
  ()=>actions.push('refresh'),legacySecret),
  actions,store};
}

test('invalid English guest codes and logged-in switching get actionable translated feedback',async()=>{
 const guest=connectHarness('en');
 const feedback={textContent:''};
 assert.equal(await guest.connect('bad-code',feedback),false);
 assert.match(feedback.textContent,/64 characters/);
 assert.deepEqual(guest.actions,[]);
 const account=connectHarness('en',{authenticated:true});
 assert.equal(await account.connect(otherSecret,feedback),false);
 assert.match(feedback.textContent,/Sign out of your account/);
 const pending=connectHarness('en',{pending:true});
 assert.equal(await pending.connect(otherSecret,feedback),false);
 assert.match(feedback.textContent,/Sync pending deletions/);
 assert.equal(pending.store.size,0);
});

test('English cloud transfer keeps existing owner/secret safety checks and reports success',async()=>{
 const library=[{id:'f'.repeat(32),deleted:false,
  entry:{id:'f'.repeat(32),name:'Character',at:1,data:{level:55}}}];
 const ctx=connectHarness('en',{records:library}),feedback={textContent:''};
 assert.equal(await ctx.connect(otherSecret,feedback),true);
 assert.match(feedback.textContent,/Connected\. Merging saved builds/);
 assert.deepEqual(ctx.actions,['scope','store','selected:null','refresh'],
  'Guest transfer must commit its durable key only after owner activation');
 assert.equal(ctx.store.get('ps-build-library-secret.v1'),otherSecret);
 assert.equal(ctx.secret(),otherSecret);
 assert.equal(ctx.changeId(),1);
});
