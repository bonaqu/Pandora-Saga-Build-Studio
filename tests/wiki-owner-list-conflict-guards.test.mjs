import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const extract=(start,end)=>{
 const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Required production function was not found: '+start);
 return app.slice(a,b);
};
const queue=extract('function enqueueWikiOwnerListWrite(','\nasync function saveWikiRelationRows(');
const variants={
 drop:extract('async function saveWikiRelationRows(','\nfunction wikiOwnerNumeric('),
 chest:extract('async function saveWikiRelationRows(','\nfunction wikiOwnerNumeric('),
 trade:extract('async function saveWikiTradeRecipe(','\nasync function saveWikiAcquisitions('),
 acquisition:extract('async function saveWikiAcquisitions(','\nfunction inlineWikiText(')
};
const host={};
for(const path of ['pandora-studio-wiki-owner-data.js',
 'pandora-studio-trade-owner-data.js'])
 Function('window',read(path))(host);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
 return {promise,resolve,reject};
};
function setup(kind,request){
 const wikiData={
  monsters:{600:{},601:{}},items:{1:{},2:{},3:{}},
  chests:{boxes:[],npc:[]},
  drops:{},ownerAcquisitions:{},
  trades:{npcs:{7:{}},trades:[],mapNames:{}}
 };
 const overrides={},edits=[],writes=[],writeQueue=new Map();
 const apiRequest=request||(async(path,payload)=>writes.push({path,payload}));
 const runner=Function('wikiData','window','activeOverride','apiRequest','override',
  'ownerEdits','refreshOwnerCatalog','refreshOwnerUI','wikiRecordWriteQueue',
  'const adminToken="test",adminEditing=true;let editIsSaving=false;'+
  'const wt=(ru,en)=>ru;\n'+queue+'\n'+variants[kind]+
  '\nreturn {save:'+(kind==='trade'?'saveWikiTradeRecipe':
   kind==='acquisition'?'saveWikiAcquisitions':'saveWikiRelationRows')+
  ',busy:()=>editIsSaving};');
 const handler=runner(wikiData,host,
  key=>Object.hasOwn(overrides,key)?overrides[key]:null,
  apiRequest,overrides,edits,async()=>{},()=>{},writeQueue);
 return {...handler,wikiData,overrides,edits,writes,writeQueue};
}
const trade=(material)=>({
 id:50,i:1,npc:[7],mats:[{i:material,n:1}],gold:0,honor:0,exp:0
});
const cases=[
 ['drop',x=>x.save('drop',600,{d:[{i:1,p:20}],s:[]}),
  x=>x.save('drop',600,{d:[{i:2,p:25}],s:[]}), 'dropedit.600'],
 ['chest',x=>x.save('chest',3,[[{i:1,n:1,p:100}]]),
  x=>x.save('chest',3,[[{i:2,n:1,p:100}]]), 'chestedit.3'],
 ['trade',x=>x.save(trade(2)),x=>x.save(trade(3)),'tradeedit.50'],
 ['acquisition',x=>x.save(1,[{type:'npc',id:'7'}]),
  x=>x.save(1,[{type:'monster',id:'600'}]),'acquireedit.1']
];
for(const [kind,firstEdit,secondEdit,key] of cases){
 test(kind+' refuses a stale whole-list save instead of silently replacing the first',async()=>{
  const barrier=deferred(),calls=[];
  const env=setup(kind,async(path,payload)=>{
   calls.push({path,payload});
   if(calls.length===1)await barrier.promise;
  });
  const original=JSON.stringify(env.wikiData);
  const first=firstEdit(env),second=secondEdit(env);
  await tick();
  assert.equal(calls.length,1,kind+' must serialize requests for '+key);
  assert.equal(env.writeQueue.size,1);
  assert.equal(env.busy(),true);
  barrier.resolve();
  await first;
  await assert.rejects(second,/Список уже изменён/);
  assert.equal(calls.length,1,'No stale second request is sent to Cloudflare D1');
  assert.equal(env.edits.length,1,'Undo history tracks only the accepted write');
  assert.equal(env.edits[0].key,key);
  assert.equal(env.overrides[key],calls[0].payload.value);
  assert.equal(env.writeQueue.size,0);
  assert.equal(env.busy(),false);
  assert.equal(JSON.stringify(env.wikiData),original,'The game source remains untouched');
 });
}
test('independent drop lists are not globally blocked by an unrelated monster edit',async()=>{
 const barrier=deferred(),calls=[];
 const env=setup('drop',async(path,payload)=>{
  calls.push({path,payload});await barrier.promise;
 });
 const a=env.save('drop',600,{d:[{i:1,p:20}],s:[]});
 const b=env.save('drop',601,{d:[{i:2,p:25}],s:[]});
 await tick();
 assert.equal(calls.length,2);
 assert.equal(env.writeQueue.size,2);
 barrier.resolve();await Promise.all([a,b]);
 assert.equal(env.edits.length,2);
 assert.equal(env.writeQueue.size,0);
});
test('a failed list write does not poison the next queued edit of that list',async()=>{
 let count=0;
 const env=setup('drop',async(path,payload)=>{
  if(++count===1)throw Error('Mocked D1 failure');
  env.writes.push({path,payload});
 });
 const first=env.save('drop',600,{d:[{i:1,p:20}],s:[]});
 const second=env.save('drop',600,{d:[{i:2,p:25}],s:[]});
 await assert.rejects(first,/Mocked D1 failure/);
 await second;
 assert.equal(count,2);
 assert.deepEqual(JSON.parse(env.overrides['dropedit.600']),{
  d:[{i:2,p:25}],s:[]
 });
 assert.equal(env.edits.length,1);
 assert.equal(env.writeQueue.size,0);
});
test('malformed row lists fail validation before writing or corrupting queue state',async()=>{
 const x=setup('drop');
 await assert.rejects(x.save('drop',600,{d:[{i:1,p:250}],s:[]}),/Проверь список/);
 assert.equal(x.writes.length,0);
 assert.equal(x.writeQueue.size,0);
 const y=setup('acquisition');
 await assert.rejects(y.save(1,[null]),/Некорректная ссылка/);
 assert.equal(y.writes.length,0);
 assert.equal(y.writeQueue.size,0);
});
