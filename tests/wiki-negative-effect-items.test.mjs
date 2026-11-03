import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-encyclopedia-data.js'))(root);
const items=JSON.parse(read('data/os/items.json'));
const skills=JSON.parse(read('data/os/skills.json'));
const classify=item=>Array.from(root.PandoraWikiData.utilityCategories(item,skills));

test('poison root and poison potion are negative effect items, not heals or cures',()=>{
 for(const id of [50022,50056]){
  const item=items[id];
  assert.equal(item.kind,'POTION');
  assert.deepEqual(classify(item),['harmful']);
  assert.equal(item.effects[0].func,'EP_DESTINED_POISON');
  assert.equal(item.effects[0].dir,'TARGET');
 }
 assert.deepEqual(classify(items[50057]),['cure'],'Antidote removes poison');
 assert.deepEqual(classify(items[50014]),['buff'],'Skill activation still works');
 assert.deepEqual(classify(items[50013]),['cure'],'Cleansing item stays in cure group');
});

test('catalogue classification follows verified effect codes, not the item name or a hardcoded ID',()=>{
 const future={id:999997,kind:'POTION',slot:null,
  name:'Future harmful consumable',effects:[{func:'EP_DESTINED_POISON',dir:'TARGET',a:17}]};
 assert.deepEqual(classify(future),['harmful']);
 assert.deepEqual(classify({...future,name:'Ядовитый корень',effects:[]}),[]);
 assert.deepEqual(classify({...future,slot:'weapon'}),[]);
 assert.deepEqual(classify({...future,kind:'ETC'}),['harmful']);
 assert.deepEqual(classify({...future,effects:[{func:'EP_DESTINED_POISON',dir:'CASTER',a:50}]}),[]);
 assert.deepEqual(classify({...future,effects:[{func:'EP_ONHIT_STUN',dir:'TARGET',a:50}]}),[]);
 assert.deepEqual(classify({...future,effects:[{func:'EP_DESTINED_POISON',dir:'TARGET',a:50},
  {func:'EP_RECOVERY_POISON',dir:'TARGET'}]}),['cure','harmful']);
 assert.deepEqual(classify(null),[]);
 assert.deepEqual(classify({effects:null}),[]);
});

test('encyclopedia exposes localized negative effects filter and a truthful on-use poison note',()=>{
 const app=read('pandora-studio-app.js'),book=read('pandora-studio-hero-book.js');
 assert.match(app,/\['harmful','Дают отрицательные эффекты','Apply negative effects'\]/);
 assert.match(app,/PandoraWikiData\.utilityCategories\(item,wikiData\?\.skills\)/);
 assert.match(app,/wiki-harmful-consumable-note/);
 assert.match(app,/состояние «Яд»/);
 assert.match(app,/При употреблении вызывает отравление/);
 assert.doesNotMatch(app,/В обоих умениях есть EP_CAUSE_POISON/);
 assert.doesNotMatch(app,/неизучаемая техническая запись/);
 assert.match(app,/if\(effect\.func==='EP_DESTINED_POISON'&&key==='a'&&!\(adminEditing&&adminToken\)\)continue/);
 assert.doesNotMatch(book,/harmfulConsumables|stage-poison-consumables|Ядовитые расходники/);
 assert.match(book,/statusCures/);
 assert.match(book,/consumableSkills/);
});


test('all source-backed reusable effect items are categorized without duplicate UI records',()=>{
 const result={buff:[],cure:[],harmful:[],recovery:[],other:[],review:[]};
 for(const [id,item]of Object.entries(items))
  for(const category of classify(item))result[category].push(Number(id));
 assert.equal(result.harmful.length,2);
 assert.deepEqual(result.harmful,[50022,50056]);
 assert.equal(result.cure.length,10,'Nine direct cures and Purification potion');
 assert.ok(result.cure.includes(50016));
 assert.deepEqual(classify(items[50016]),['cure']);
 assert.equal(result.recovery.length,20);
 assert.equal(result.buff.length,56,'36 skill buffs and 20 healing items');
 assert.equal(result.other.length,5,'Cosmetic cake, two teleports and two reset scrolls');
 assert.deepEqual(result.review,[],'Current OS source effects are all resolved');
 assert.deepEqual(classify(items[50066]),['other']);
 assert.deepEqual(classify(items[90021]),['other']);
 assert.deepEqual(classify(items[50023]),['cure','buff','recovery']);
 assert.deepEqual(classify(items[50065]),['cure','buff','recovery']);
 assert.equal(new Set(Object.values(result).flat()).size,71);
 const allEffectItems=Object.entries(items).filter(([,item])=>classify(item).length);
 assert.equal(allEffectItems.length,71);
});
test('new consumables are classified by their effects and resolved cleansing skill',()=>{
 const cureSkill={id:99990001,funcs:[{ep:'EP_REMOVE_BAD_EFFECT',dir:'TARGET'}]};
 const unknownSkill={id:99990002,funcs:[{ep:'EP_HEAL_LIFE_REGENERATOR',dir:'TARGET'}]};
 assert.deepEqual(root.PandoraWikiData.utilityCategories(
  {kind:'POTION',effects:[{dir:'TARGET',func:'EP_SKILL_EXEC',a:99990001}]},
  {'99990001':cureSkill}),['cure']);
 assert.deepEqual(root.PandoraWikiData.utilityCategories(
  {kind:'POTION',effects:[{dir:'TARGET',func:'EP_SKILL_EXEC',a:99990002}]},
  {'99990002':unknownSkill}),['buff']);
 assert.deepEqual(classify({slot:'weapon',effects:[
  {dir:'TARGET',func:'EP_HEAL_LIFE',a:100}]}),[]);
 assert.deepEqual(classify({kind:'ETC',effects:[
  {dir:'CASTER',func:'EP_RESTART'}]}),['other']);
 assert.deepEqual(classify({kind:'TOY',effects:[
  {dir:'TARGET',func:'EP_RANDOM_BOX'}]}),[]);
 assert.deepEqual(classify({kind:'POTION',effects:[
  {dir:'TARGET',func:'EP_HEAL_LIFE',a:5},
  {dir:'TARGET',func:'EP_RECOVERY_POISON'}]}),['cure','buff','recovery']);
});
test('poison root crafting and venom application are derived from actual skill consume/add records',()=>{
 const relations=id=>root.PandoraWikiData.itemSkillRelations(id,skills);
 const rootCraft=relations(50022).find(x=>x.id==='220002001');
 assert.ok(rootCraft);
 assert.deepEqual(rootCraft.consumes,[50022,65011]);
 assert.deepEqual(rootCraft.produces,[50056]);
 const venom=relations(50056);
 assert.ok(venom.some(x=>x.id==='220002001'&&x.produces.includes(50056)));
 assert.ok(venom.some(x=>x.id==='220001001'&&x.consumes.includes(50056)));
 assert.ok(venom.some(x=>x.id==='220001003'&&x.consumes.includes(50056)));
 const hit=skills[430052001];
 assert.ok(hit.funcs.some(x=>x.ep==='EP_CAUSE_POISON'));
 assert.ok(items[50022].effects.some(x=>x.func==='EP_DESTINED_POISON'));
 assert.ok(items[50056].effects.some(x=>x.func==='EP_DESTINED_POISON'));
 assert.deepEqual(relations('garbage'),[]);
 assert.deepEqual(relations(999999),[]);
});
test('effects and related wiki links remain bilingual and distinct from loot boxes',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/\['recovery','Восстанавливают ОЗ\/ОМ','Restore HP\/MP'\]/);
 assert.match(app,/\['other','Прочие активируемые предметы','Other usable items'\]/);
 assert.match(app,/PandoraWikiData\.itemSkillRelations\(id,wikiData\.skills\)/);
 assert.match(app,/wiki-effect-cure-note/);
 assert.match(app,/wiki-effect-usage-row/);
 assert.match(app,/EP_CAUSE_POISON/);
 assert.match(app,/EP_RECOVERY_POISON/);
 assert.match(app,/EP_REMOVE_BAD_EFFECT/);
});

test('unverified future skills are not silently treated as positive buffs',()=>{
 const make=a=>({kind:'POTION',slot:null,effects:[{
  dir:'TARGET',func:'EP_SKILL_EXEC',a}]});
 assert.deepEqual(root.PandoraWikiData.utilityCategories(make(99990003),skills),['review']);
 const future={
  '99990003':{id:99990003,name:'Future poison ability',
   funcs:[{dir:'TARGET',ep:'EP_CAUSE_POISON',fv1:[0,0,0,100]}]},
  '99990004':{id:99990004,name:'Future mystery',
   funcs:[{dir:'TARGET',ep:'EP_UNKNOWN_GAME_EFFECT',fv1:[0,0,0,100]}]},
  '99990005':{id:99990005,name:'Future positive',
   funcs:[{dir:'TARGET',ep:'EP_MAXLIFE_CONST',fv1:[0,0,0,250]}]},
  '99990006':{id:99990006,name:'Negative value',
   funcs:[{dir:'TARGET',ep:'EP_MAXLIFE_CONST',fv1:[0,0,0,-250]}]}
 };
 assert.deepEqual(root.PandoraWikiData.utilityCategories(make(99990003),future),['harmful']);
 assert.deepEqual(root.PandoraWikiData.utilityCategories(make(99990004),future),['review']);
 assert.deepEqual(root.PandoraWikiData.utilityCategories(make(99990005),future),['buff']);
 assert.deepEqual(root.PandoraWikiData.utilityCategories(make(99990006),future),['review']);
 assert.deepEqual(root.PandoraWikiData.utilityCategories({
  kind:'ETC',effects:[{dir:'TARGET',func:'EP_WHATEVER',a:4}]},future),['review']);
 assert.deepEqual(root.PandoraWikiData.utilityCategories({
  kind:'TOY',effects:[{dir:'TARGET',func:'EP_RANDOM_BOX'}]},future),[]);
});
test('all current on-use source effects are accounted for or belong to loot containers',()=>{
 const effects=Object.entries(items).filter(([,item])=>item.slot==null&&
  Array.isArray(item.effects)&&item.effects.length);
 const classified=effects.filter(([,item])=>classify(item).length);
 const containers=effects.filter(([,item])=>!classify(item).length);
 assert.equal(effects.length,107);
 assert.equal(classified.length,71);
 assert.equal(containers.length,36);
 for(const [id,item]of containers)
  assert.deepEqual(item.effects.map(e=>e.func),['EP_RANDOM_BOX'],
   id+' must really be a loot container, not an overlooked potion');
});
test('game has a separate non-learnable Poison skill besides weapon coating and Infect',()=>{
 const poison=skills['500000004'],strike=skills['430052001'];
 assert.equal(poison.name,'Яд');
 assert.equal(poison.learnable,false);
 assert.ok(poison.funcs.some(f=>f.ep==='EP_CAUSE_POISON'));
 assert.ok(strike.funcs.some(f=>f.ep==='EP_CAUSE_POISON'));
 assert.ok(items[50022].effects.some(f=>f.func==='EP_DESTINED_POISON'));
 assert.ok(items[50056].effects.some(f=>f.func==='EP_DESTINED_POISON'));
 assert.notEqual(poison.id,skills['220001001'].id,'the weapon-coating Яд is a different skill');
});
test('source-based recipes preserve quantities and every venom consuming skill',()=>{
 const links=root.PandoraWikiData.itemSkillRelations(50022,skills);
 const craft=links.find(link=>link.id==='220002001');
 assert.deepEqual(craft.consumedQuantities,{'50022':1,'65011':1});
 assert.deepEqual(craft.producedQuantities,{'50056':1});
 const venom=root.PandoraWikiData.itemSkillRelations(50056,skills);
 assert.deepEqual(venom.filter(link=>link.consumes.includes(50056)).map(x=>x.id),
  ['220001001','220001003','220006001']);
 for(const link of venom.filter(link=>link.consumes.includes(50056)))
  assert.equal(link.consumedQuantities['50056'],1);
});

test('indexed recipe links survive repeated queries, new snapshots and caller mutation',()=>{
 const sample={'1':{name:'Create',funcs:[
  {ep:'EP_CONSUME_ITEM',fv1:[0,0,0,42],fv2:[0,0,0,2]},
  {ep:'EP_ADDITION_ITEM',fv1:[0,0,0,43],fv2:[0,0,0,1]}
 ]}};
 const lookup=id=>root.PandoraWikiData.itemSkillRelations(id,sample);
 assert.equal(lookup(42).length,1);
 assert.equal(lookup(43).length,1);
 assert.deepEqual(lookup(42)[0].consumedQuantities,{'42':2});
 assert.deepEqual(lookup(43)[0].producedQuantities,{'43':1});
 lookup(42).pop();
 assert.equal(lookup(42).length,1,'caller must not remove cached rows');
 const replacement={'2':{name:'Replace',funcs:[
  {ep:'EP_CONSUME_ITEM',fv1:[0,0,0,42],fv2:[0,0,0,3]}
 ]}};
 assert.equal(root.PandoraWikiData.itemSkillRelations(42,replacement)[0].consumedQuantities['42'],3);
 assert.deepEqual(root.PandoraWikiData.itemSkillRelations(43,replacement),[]);
});
