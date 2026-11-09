import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const extract=(from,to)=>{
 const start=source.indexOf(from),end=source.indexOf(to,start+from.length);
 assert.ok(start>=0&&end>start,'Expected actual app source '+from);
 return source.slice(start,end);
};
const rowsCode=extract('function safeStoredBuildRows(value){','\ntry{\n const saved=');
const preparationCode=extract('function prepareSavedBuildSnapshot(raw){','\nfunction switchActiveDraft(snapshot,id){');
const transitionCode=extract('function switchActiveDraft(snapshot,id){','\nfunction openSavedBuild(b){');
const openerCode=extract('function openSavedBuild(b){','\nfunction unsavedBuild(){');
const id='a'.repeat(32),other='b'.repeat(32);
const baseState=()=>({
 level:1,points:{slash:0},mastery:{slash:0},stats:{vit:0},
 equipment:{},souls:{},soulOwners:{},socketCapacities:{},refinements:{},gems:{},
 vitalsBuffs:{guildHp:0,guildMp:0,lifeSign:false},
 attributeBuffs:{guildAll:0},profile:{guild:''}
});
function setup(library,{canPersist=true}={}){
 const selected=[],events=[],messages=[];
 const initial=baseState();
 const context=Function('records','initial','selected','events','messages','canPersist',
  'let builds=records,state=structuredClone(initial),activeBuildId='+JSON.stringify(other)+';'+
  'const lang="ru",races=[];'+
  'const window={PandoraUIPlanner:{normalizeGender:(_r,_race,gender)=>gender}}; const requireBuildAccount=()=>true;'+
  'const selectActiveBuild=id=>{activeBuildId=id;selected.push(id)};'+
  'const showStudioToast=(message,status)=>messages.push({message,status});'+
  'const fresh=()=>structuredClone(initial);'+
  'const restoreLoadedBuildUI=()=>events.push("restore");'+
  'const persist=()=>{events.push("persist");return canPersist};'+
  'const render=()=>events.push("render");'+
  'const changeTab=tab=>events.push(tab);\n'+
  preparationCode+'\n'+transitionCode+'\n'+openerCode+
  '\nreturn {open:openSavedBuild,state:()=>state,active:()=>activeBuildId};')(library,initial,selected,events,messages,canPersist);
 return {...context,selected,events,messages,initial};
}

test('one invalid localStorage list entry does not hide valid stored builds',()=>{
 const safe=Function(rowsCode+'\nreturn safeStoredBuildRows')();
 const good={id,data:{level:55}},bad={id:other,data:null};
 const rows=[null,'old invalid text',false,good,bad,[],{id:other,data:[]},undefined];
 const untouched=rows.slice();
 const result=safe(rows);
 assert.deepEqual(result,[good],
  'Damaged entries are excluded from the view without rewriting storage');
 assert.deepEqual(rows,untouched);
 assert.deepEqual(safe({oops:true}),[]);
 assert.deepEqual(safe(null),[]);
});

test('opening a malformed saved snapshot does not select it or lose current hero',()=>{
 const saved={id,data:null},ctx=setup([saved]);
 const original=structuredClone(ctx.state());
 assert.equal(ctx.open(saved),false);
 assert.equal(ctx.active(),other);
 assert.deepEqual(ctx.state(),original);
 assert.deepEqual(ctx.selected,[]);
 assert.deepEqual(ctx.events,[]);
 assert.match(ctx.messages[0].message,/повреждены/);
});

test('a clone failure cannot partially activate a saved hero',()=>{
 const saved={id,data:{level:48,someUnserializable:()=>{}}};
 const ctx=setup([saved]);
 const original=structuredClone(ctx.state());
 assert.equal(ctx.open(saved),false);
 assert.equal(ctx.active(),other);
 assert.deepEqual(ctx.state(),original);
 assert.deepEqual(ctx.selected,[]);
 assert.deepEqual(ctx.events,[]);
 assert.equal(ctx.messages[0].status,'warning');
});

test('older incomplete build gets safe nested defaults without changing saved data',()=>{
 const saved={id,data:{level:55,name:'Старый герой',points:{slash:15},
  stats:{vit:8},vitalsBuffs:{guildHp:5},attributeBuffs:{guildAll:2}}};
 const previous=structuredClone(saved.data);
 const ctx=setup([saved]);
 assert.equal(ctx.open(saved),true);
 assert.equal(ctx.active(),id);
 assert.equal(ctx.state().level,55);
 assert.equal(ctx.state().points.slash,15);
 assert.equal(ctx.state().stats.vit,8);
 assert.equal(ctx.state().vitalsBuffs.guildHp,5);
 assert.equal(ctx.state().vitalsBuffs.guildMp,0);
 assert.equal(ctx.state().vitalsBuffs.lifeSign,false);
 assert.deepEqual(ctx.state().mastery,{slash:0});
 assert.deepEqual(ctx.state().profile,{guild:''});
 assert.deepEqual(ctx.events,['persist','restore','render','character']);
 assert.deepEqual(saved.data,previous,'Opening must not rewrite saved records');
});

test('saving multiple historical nested versions does not let malformed fields corrupt defaults',()=>{
 const saved={id,data:{equipment:'invalid',souls:null,profile:[],points:7,
  attributeBuffs:{guildAll:3}}};
 const ctx=setup([saved]);
 assert.equal(ctx.open(saved),true);
 assert.deepEqual(ctx.state().equipment,{});
 assert.deepEqual(ctx.state().souls,{});
 assert.deepEqual(ctx.state().profile,{guild:''});
 assert.deepEqual(ctx.state().points,{slash:0});
 assert.equal(ctx.state().attributeBuffs.guildAll,3);
});

test('initial local draft parse and saved list parse are independent',()=>{
 const i=source.indexOf('function safeStoredBuildRows(value){');
 const p=source.indexOf("localStorage.getItem('ps-build-studio.v1')",i);
 const q=source.indexOf("localStorage.getItem('ps-build-library.v1')",p);
 assert.ok(i<p&&p<q);
 const split=source.slice(p,q);
 assert.match(split,/catch\(error\)\{console\.warn\('Character draft could not be restored'/);
 assert.match(source,/builds=safeStoredBuildRows\(rows\)/);
});

test('saved copy retains its own Soul capacity; damaged nested records stay isolated',()=>{
 const saved={id,data:{level:45,equipment:{5:{id:13041}},
  socketCapacities:{'5:13041':2},souls:{5:[{id:103001},{id:103002}]},
  soulOwners:{5:'13041'}}};
 const original=structuredClone(saved.data),ctx=setup([saved]);
 assert.equal(ctx.open(saved),true);
 assert.equal(ctx.state().socketCapacities['5:13041'],2);
 assert.equal(ctx.state().souls[5].length,2);
 assert.deepEqual(saved.data,original,'Opening cannot rewrite the original');
 const broken={id,data:{level:45,socketCapacities:'broken',mastery:[4],
  vitalsBuffs:[],gems:'bad',soulOwners:[]}};
 const recovered=setup([broken]);
 assert.equal(recovered.open(broken),true);
 assert.deepEqual(recovered.state().socketCapacities,{});
 assert.deepEqual(recovered.state().mastery,{slash:0});
 assert.deepEqual(recovered.state().vitalsBuffs,{guildHp:0,guildMp:0,lifeSign:false});
 assert.deepEqual(recovered.state().gems,{});
 assert.deepEqual(recovered.state().soulOwners,{});
});

test('quota failure opening a saved build retains current draft and active selection',()=>{
 const saved={id,data:{level:55,name:'Recovered local build',stats:{vit:7}}};
 const ctx=setup([saved],{canPersist:false});
 const prior=structuredClone(ctx.state());
 assert.equal(ctx.open(saved),false);
 assert.deepEqual(ctx.state(),prior,'In-memory hero must remain unchanged');
 assert.equal(ctx.active(),other,'Failed activation must not alter the active ID');
 assert.deepEqual(ctx.selected,[],'No active ID write can occur before persisting');
 assert.deepEqual(ctx.events,['persist'],'No redraw should discard the current editor');
 assert.equal(ctx.messages[0].status,'error');
 assert.match(ctx.messages[0].message,/черновик/);
});
