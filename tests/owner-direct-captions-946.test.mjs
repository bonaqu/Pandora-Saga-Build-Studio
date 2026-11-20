import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const start=app.indexOf('function ownerCaptionActionGuard(button,caption){');
const end=app.indexOf('\nfunction bindStaticUICopyEditors(){',start);
assert.ok(start>=0&&end>start,'Use the production caption gesture helper');

function harness(owner=true){
 const timers=new Map();let nextId=0,actions=0,editing=owner;
 const button={dataset:{},hidden:false,disabled:false,isConnected:true,
  handlers:{},addEventListener(name,callback){this.handlers[name]=callback},
  contains:target=>target===button,
  click(){actions++;}
 };
 const scope={adminEditing:editing,adminToken:'a'.repeat(43),
  setTimeout(fn){const id=++nextId;timers.set(id,fn);return id},
  clearTimeout(id){timers.delete(id)}
 };
 const bind=runInNewContext(app.slice(start,end)+'\nownerCaptionActionGuard',scope);
 bind(button,button);
 bind(button,button); // Rebind after a UI refresh: no duplicate capture hooks.
 const fire=detail=>{
  let blocked=false;
  button.handlers.click({
   detail,target:button,
   preventDefault(){blocked=true},
   stopImmediatePropagation(){},
  });
  if(!blocked)button.click();
  return blocked;
 };
 return{button,timers,fire,run:()=>{for(const [id,fn]of [...timers]){timers.delete(id);fn()}},
  get actions(){return actions},
  get timerCount(){return timers.size},
  setEditing:value=>{scope.adminEditing=value}
 };
}

test('caption double-click cancels both action clicks before an inline editor opens',()=>{
 const ui=harness();
 assert.equal(ui.fire(1),true,'First mouse click is held for a possible double-click');
 assert.equal(ui.timerCount,1);
 assert.equal(ui.fire(2),true,'Second click cancels the deferred button action');
 ui.run();
 assert.equal(ui.actions,0,'No navigation, item mutation, or destructive admin action');
 assert.equal(ui.timerCount,0);
});

test('single owner click executes the original action exactly once after gesture decision',()=>{
 const ui=harness();
 assert.equal(ui.fire(1),true);
 ui.run();
 assert.equal(ui.actions,1);
 ui.run();
 assert.equal(ui.actions,1,'No duplicated click from repeated owner binding');
 assert.equal(ui.fire(0),false,'Keyboard/programmatic action is never delayed');
 assert.equal(ui.actions,2);
});

test('guest clicks remain immediate; stale/removed buttons cannot fire after editing',()=>{
 const guest=harness(false);
 assert.equal(guest.fire(1),false);
 assert.equal(guest.actions,1);
 const ui=harness();
 assert.equal(ui.fire(1),true);
 ui.button.isConnected=false;
 ui.run();
 assert.equal(ui.actions,0);
});

test('authorial labels use direct double-click; caption pencils are absent across modules',()=>{
 const path=read('pandora-studio-hero-path.js');
 const equipment=read('pandora-studio-equipment-ui.js');
 const book=read('pandora-studio-hero-book.js');
 const honor=read('pandora-studio-honor-view.js');
 for(const [name,source,css]of [
  ['Origin',app,'origin-copy-pencil'],
  ['general UI',app,'ui-content-pencil studio-owner-interface-pencil'],
  ['account',app,'account-copy-pencil'],
  ['profile',app,'ps-profile-copy-pencil'],
  ['Path',path,'path-owner-pencil'],
  ['Path groups',path,'path-group-pencil'],
  ['Path racial',path,'path-racial-pencil'],
  ['equipment captions',equipment,'stage-picker-slot-pencil'],
  ['equipment tabs',equipment,'stage-action-edit-wrap'],
  ['Hero Book labels',book,'stage-guide-edit-name'],
  ['Hero Book tabs',book,'stage-book-tab-pencil'],
  ['Honor labels',honor,'wiki-honor-copy-pencil'],
 ])assert.doesNotMatch(source,new RegExp('class:[^\\n]*'+css),
  name+' must not create a pencil for a visible caption');
 assert.match(app,/node\.addEventListener\('dblclick',edit\)/);
 assert.match(path,/api\.editLabel\(label,key,ru,en\)/);
 assert.match(book,/caption\.addEventListener\('dblclick',edit\)/);
 assert.match(honor,/caption\.addEventListener\('dblclick',edit\)/);
});

test('an independently authored hover hint retains its own pencil; non-hover inputs do not',()=>{
 const start=app.indexOf('function bindStaticUICopyEditors(){');
 const end=app.indexOf('// Edit only semantically keyed authored labels',start);
 const ui=app.slice(start,end);
 assert.match(ui,/\[data-i18n-title\]/);
 assert.doesNotMatch(ui,/for\(const node of document\.querySelectorAll\(\s*'\[data-i18n-placeholder\]/);
 assert.match(ui,/if\(!canEdit\|\|!node\.getAttribute\('title'\)\)/);
 assert.match(ui,/title:lang==='en'\?'Edit hint':'Изменить подсказку'/);
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/if\(meaningfulGuideHint\(hint\)\)/);
 assert.match(book,/onTextEdit\(node,key,english\?'hintEn':'hintRu',hint\)/);
 assert.match(app,/class:'wiki-hint-pencil'/);
});
