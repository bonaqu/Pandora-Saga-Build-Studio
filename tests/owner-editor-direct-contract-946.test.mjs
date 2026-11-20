import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const load=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=load('pandora-studio-app.js');
const path=load('pandora-studio-hero-path.js');
const equipment=load('pandora-studio-equipment-ui.js');
const honor=load('pandora-studio-honor-view.js');
const book=load('pandora-studio-hero-book.js');

test('owner captions in every main UI family have no sibling rename pencils',()=>{
 for(const [name,source,legacy] of [
  ['Origin',app,/'data-origin-edit-for':key|class:'origin-copy-pencil'/],
  ['Path',app,/class:'path-inline-copy-pencil'|class:'path-tab-pencil'/],
  ['Profile',app,/class:'ps-profile-copy-pencil'/],
  ['Account and builds',app,/class:'ui-content-pencil account-copy-pencil'/],
  ['Owner dock',app,/class:'owner-dock-action-pencil'|class:'owner-dock-group-pencil'|class:'owner-workflow-copy-pencil'/],
  ['Wiki field headings',app,/dt.append\(h\('button',\{type:'button',class:'wiki-label-pencil'/],
  ['Path sidebar',path,/class:'path-owner-pencil'|class:'path-group-pencil'|class:'path-racial-pencil'|class:'path-more-pencil'/],
  ['Gear and Souls',equipment,/class:'stage-control-pencil'/],
  ['Honor',honor,/class:'wiki-honor-copy-pencil'|class:'wiki-honor-war-rename'/],
  ['Hero Book',book,/class:'stage-guide-edit-name'|class:'stage-book-tab-pencil'/]
 ])assert.doesNotMatch(source,legacy,name+' should edit its visible caption directly');
 assert.match(app,/node.addEventListener\('dblclick',edit\)/);
 assert.match(app,/ownerCaptionActionGuard\(button,caption\)/);
 assert.match(path,/protectOwnerCaption\(showMore,caption\)/);
 assert.match(equipment,/protectCaption\(button,caption\)/);
 assert.match(honor,/protectCaption\(button,caption\)/);
 assert.match(book,/protectTabCaption\(button,caption\)/);
});

test('pencils remain only with independently editable hover explanations',()=>{
 assert.match(app,/class:'wiki-hint-pencil'/);
 assert.match(app,/for\(const node of document.querySelectorAll\('\[data-i18n-title\]'\)\)/);
 assert.match(app,/!node.getAttribute\('title'\)/);
 assert.doesNotMatch(app,/for\(const node of document.querySelectorAll\([\s\S]{0,100}\[data-i18n-placeholder\],\[data-i18n-title\]/);
 assert.match(book,/if\(meaningfulGuideHint\(hint\)\)/);
 assert.match(book,/class:'stage-guide-edit-hint'/);
 assert.doesNotMatch(book,/namePencil/);
});

test('mouse double-click on a caption never executes the underlying button action',()=>{
 const first=app.indexOf('function ownerCaptionActionGuard(button,caption){');
 const last=app.indexOf('\nfunction bindStaticUICopyEditors(){',first);
 assert.ok(first>0&&last>first,'Owner action arbiter must be present');
 let next=0;const jobs=new Map();
 const start=(fn)=>{const id=++next;jobs.set(id,fn);return id};
 const stop=id=>jobs.delete(id);
 const guard=runInNewContext(app.slice(first,last)+'\nownerCaptionActionGuard',{
  adminEditing:true,adminToken:'test-token',setTimeout:start,clearTimeout:stop
 });
 const events={},target={};
 let clicks=0;
 const button={
  dataset:{},isConnected:true,disabled:false,hidden:false,
  addEventListener(name,fn,capture){assert.equal(name,'click');assert.equal(capture,true);events[name]=fn},
  click(){clicks++}
 };
 const caption={hidden:false,contains:node=>node===target,querySelector:()=>null};
 guard(button,caption);
 const event=()=>({
  detail:1,target,cancelled:false,stopped:false,
  preventDefault(){this.cancelled=true},
  stopImmediatePropagation(){this.stopped=true}
 });
 const one=event();events.click(one);
 assert.equal(one.cancelled,true);
 assert.equal(one.stopped,true);
 assert.equal(clicks,0);
 const two=event();events.click(two);
 assert.equal(two.cancelled,true);
 assert.equal(jobs.size,0,'Second mouse click cancels the pending action');
 assert.equal(clicks,0,'Double-click must never activate the game button');
 const three=event();events.click(three);
 assert.equal(jobs.size,1);
 for(const fn of [...jobs.values()])fn();
 assert.equal(clicks,1,'A single click retains the original game action');
 const keyboard={detail:0,target,...event()};
 keyboard.detail=0;events.click(keyboard);
 assert.equal(keyboard.cancelled,false);
 assert.equal(clicks,1,'Keyboard click is not intercepted by editor detection');
});
