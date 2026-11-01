import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('hero-path.js');
const from=source.indexOf('function indexSkillsByBranch('),to=source.indexOf('function readiness(',from);
assert.ok(from>=0&&to>from);
const index=new Function(source.slice(from,to)+'\nreturn indexSkillsByBranch;')();
const skills=Object.values(JSON.parse(read('data/os/skills.json')));
const classes=JSON.parse(read('data/os/classes.json'));
const nav={};Function('window',read('game-navigation.js'))(nav);
const branchIds=[...new Set(nav.PandoraGameNavigation.groups.flatMap(group=>group.branches).filter(k=>k!=='race'))];

test('one-pass indexed branch skills exactly match old filter across every official class',()=>{
 assert.equal(skills.length,569);
 assert.equal(Object.keys(classes).length,28);
 for(const job of Object.keys(classes)){
  const byBranch=index(skills,job);
  for(const branch of branchIds){
   const expected=skills.filter(s=>s.classes?.[job]&&Array.isArray(s.reqs)&&
    s.reqs.some(req=>req.branch===branch));
   assert.deepEqual((byBranch.get(branch)||[]).map(s=>s.id),
    expected.map(s=>s.id),job+' '+branch);
  }
 }
});

test('duplicate requirements never duplicate skill cards and malformed records are ignored',()=>{
 const a={id:1,classes:{CLERIC:1},reqs:[{branch:'slash',amount:1},
  {branch:'slash',amount:8},{branch:'brush',amount:3},null]};
 const b={id:2,classes:{CLERIC:1},reqs:[{branch:'slash',amount:2}]};
 const other={id:3,classes:{WARRIOR:1},reqs:[{branch:'slash',amount:1}]};
 const data=index([null,a,b,other,{id:4,classes:{CLERIC:1},reqs:'broken'}],'CLERIC');
 assert.deepEqual(data.get('slash'),[a,b]);
 assert.deepEqual(data.get('brush'),[a]);
 assert.equal(data.get('trap'),undefined);
 assert.equal(index([a],'WARRIOR').size,0);
});

test('real Hero Path renders saved over-cap points instead of a misleading dash',()=>{
 const M={potential:(s,k)=>Number(s.points?.[k])||0,
  trained:(s,k)=>Number(s.points?.[k])||0};
 const root={PandoraSkillProgression:M};
 const document={createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})};
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.style={};this.attrs={};this.value='';
   this.className='';this.classList={toggle:()=>{}};this.textContent='';}
  append(...xs){this.children.push(...xs)}
  replaceChildren(...xs){this.children=[...xs]}
  setAttribute(key,value){this.attrs[key]=String(value);if(key==='value')this.value=String(value)}
  addEventListener(){}
 }
 Function('window','document',source)(root,document);
 const group=[{id:'melee',ru:'Ближний бой',en:'Melee',branches:['slash','thrust']}];
 const render=amount=>{
  const target=new Element('div'),state={level:55,points:{slash:amount},masteryAuto:true};
  const api={state,groups:group,selectedGroup:'melee',expandedBranch:'slash',job:'CLERIC',
   skillCatalog:[],budget:{total:110},allocationReady:true,lang:'ru',
   cap:()=>0,branchName:key=>key,onGroup:()=>{},onExpand:()=>{},milestones:()=>[],
   onAllocate:()=>0,onMastery:()=>false};
  root.PandoraHeroPath.viewGrowth(target,api);
  const walk=node=>[node,...(node.children||[]).filter(x=>x?.tag).flatMap(walk)];
  const row=walk(target).find(x=>x.tag==='button'&&x.attrs['data-path-branch']==='slash');
  return {label:row.children.find(x=>x.tag==='b')?.textContent,
   state,editorCount:walk(target).filter(x=>x.className==='inline-branch-editor').length};
 };
 assert.equal(render(0).label,'—');
 const old=render(12);
 assert.equal(old.label,'12 / 0');
 assert.equal(old.state.points.slash,12);
 assert.equal(old.editorCount,1);
});

test('growth reads pre-indexed branch data rather than rescanning 569 skills per branch',()=>{
 assert.match(source,/const skillIndex=indexSkills\(skillCatalog\),skillsByBranch=indexSkillsByBranch\(skillCatalog,job\)/);
 assert.match(source,/const skills=skillsByBranch\.get\(key\)\|\|\[\]/);
 assert.doesNotMatch(source,/const skills=skillCatalog\.filter\(/);
});

test('all Hero Path class surfaces agree on strict OS class permissions',()=>{
 const good={id:9,name:'Good',classes:{CLERIC:1},
  reqs:[{branch:'benevolence',amount:8}],charLevel:1,learnable:true};
 const fixture=[good,
  ...[0,false,'false','1',2,null,undefined].map((flag,i)=>({
   id:10+i,name:'Malformed '+i,
   classes:flag===undefined?undefined:{CLERIC:flag},
   reqs:[{branch:'benevolence',amount:8}],charLevel:1,learnable:true
  }))];
 const data=index(fixture,'CLERIC');
 assert.deepEqual(data.get('benevolence'),[good]);
 assert.match(source,/function allowedForJob\(skill,job\)/);
 assert.match(source,/if\(!allowedForJob\(skill,job\)\|\|!Array\.isArray\(skill\.reqs\)\)continue/);
 assert.match(source,/if\(!allowedForJob\(skill,job\)\)/);
 assert.match(source,/api\.skillCatalog\.filter\(skill=>allowedForJob\(skill,api\.job\)&&/);
});
