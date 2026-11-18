// Compact OS, historical formula, and source-contract regressions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyGameSource} from '../scripts/source-egress-status.mjs';

{
// Original: tests/approved-honor-ru.test.mjs
const src=readFileSync(new URL('../pandora-os-character-calculator.js',import.meta.url),'utf8');
const ctx={};Function('window',src)(ctx);
const titles=ctx.PandoraOSCalculator.honorTitles;
const approved=["Сила познания","Золотое сердце","Том огня","Том льда","Том грозы","Бешенство","Мастер наездника","Тайна стража","Том тьмы","Том света","Сила воли","Невероятная ловкость","Мастер боя"];
test('all 13 Honor titles match exact Remaked approved Russian names in ID order',()=>{
 assert.equal(titles.length,14);
 assert.deepEqual(titles.slice(1).map(x=>x.ru),approved);
 assert.equal(titles[0].ru,'Нет титула');
});
test('renaming Honor labels changes no saved ids or combat effects',()=>{
 assert.deepEqual(titles.map(x=>x.id),Array.from({length:14},(_,i)=>i));
 assert.equal(titles[1].effects.allAttributes,1);
 assert.equal(titles[3].effects.attackPercent,2);
 assert.equal(titles[11].effects.defense,5);
 assert.equal(titles[12].effects.accuracy,-10);
 assert.equal(titles[13].effects.dodge,-10);
 const calc=ctx.PandoraOSCalculator;
 assert.equal(calc.selectedHonor({honorTitle:11}).ru,'Сила воли');
 assert.equal(calc.selectedHonor({honorTitle:1}).ru,'Сила познания');
});
test('source provenance is recorded, names are not inferred from machine translations',()=>{
 const docs=readFileSync(new URL('../docs/REMAKED_CALCULATOR_PORT.md',import.meta.url),'utf8');
 assert.match(docs,/approved-translations\.v1\.json/);
 assert.match(docs,/game\.ru\['calculator\.honor\.0'\.\.'calculator\.honor\.12'\]/);
});

}

{
// Original: tests/os-effect-parity.test.mjs
const src=readFileSync(new URL('../pandora-os-character-calculator.js',import.meta.url),'utf8');
const api={};Function('window',src)(api);
test('OS banker rounding handles ties, fractions and negatives',()=>{
 const f=api.PandoraOSCalculator.halfToEven;
 assert.equal(f(2.5),2);assert.equal(f(3.5),4);
 assert.equal(f(2.49),2);assert.equal(f(2.51),3);
 assert.equal(f(-1.5),-2);assert.equal(f(-2.5),-2);
});
test('basic ability percent uses floor of unmodified base',()=>{
 const f=api.PandoraOSCalculator.effectiveAbility;
 assert.equal(f(21,3,10),26);
 assert.equal(f(1,-100,0),1);
});
test('flat item and Soul effects modify only supported fields',()=>{
 const e=api.PandoraOSCalculator.gatherEffects([
 ['item1',{effects:[{func:'EP_VITARITY_CONST',a:2},{func:'EP_MAXLIFE_CONST',a:15},{func:'UNKNOWN_EFFECT',a:100}]},0],
 ['soul1',{effects:[{func:'EP_MAXMANA_CONST',a:20,min:4,max:10}]},5]
 ]);
 assert.equal(e.flat.vit,2);assert.equal(e.health.hp,15);assert.equal(e.health.mp,20);
 assert.deepEqual(e.ignored,['UNKNOWN_EFFECT']);
});
test('OS reference coefficients match saved Gladiator example',()=>{
 const c=api.PandoraOSCalculator.base({
 classData:{hp:{base:150,lv:31.35,vit:11.82},mp:{base:30,lv:2.73,spi:2.53}},
 raceData:{vit:7,spi:4,str:1,agi:1,dex:1,int:1},
 jobData:{vit:0,spi:0,str:0,agi:0,dex:0,int:0},
 allocation:{},level:45
 });
 assert.equal(c.hp,1643);assert.equal(c.mp,162); // floor(30 + 45*2.73 + 4*2.53)assert.equal(c.verified,false);
});

}

{
// Original: tests/periodic-recovery-attributes.test.mjs

const read=name=>JSON.parse(readFileSync(new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
const source=readFileSync(new URL('../pandora-os-character-calculator.js',import.meta.url),'utf8');
const host={};Function('window',source)(host);
const calc=host.PandoraOSCalculator;
const classes=read('classes'),skills=read('skills');
const race={vit:50,str:30,agi:30,dex:30,spi:59,int:40};
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const build=records=>calc.base({
 classData:classes.CLERIC,raceData:race,jobData:zeros,allocation:{},
 level:45,records,combatContext:{jobKey:'CLERIC',
 benevolenceMastery:41,skillCatalog:skills}
});
test('equipped +SPI updates OS periodic source magnitudes without altering passive recovery',()=>{
 const plain=build([]);
 const equipped=build([['item:123',{id:123,slot:'head',name:'SPI test headgear',
  effects:[{func:'EP_SPIRITUAL_CONST',a:2}]},0]]);
 assert.ok(plain?.periodicRecovery&&equipped?.periodicRecovery);
 assert.equal(plain.stats.spi,59);
 assert.equal(equipped.stats.spi,61);
 const amount=preview=>Object.fromEntries(preview.periodicRecovery.rows.map(x=>[x.key,x.amount]));
 const p=amount(plain),e=amount(equipped);
 assert.equal(p.regenerate,10+4+4+5);
 assert.equal(p.restoration,5+2+2+11);
 assert.equal(e.regenerate,10+4+4+6);
 assert.equal(e.restoration,5+2+2+12);
 assert.equal(e.regenerate-p.regenerate,1);
 assert.equal(e.restoration-p.restoration,1);
 assert.equal(plain.regeneration.hp.total,equipped.regeneration.hp.total,
  'instant periodic spell value must not change passive HP regeneration');
});

}

{
// Original: tests/remaked-elemental-magic-honor.test.mjs
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const w={};Function('window',read('pandora-os-character-calculator.js'))(w);
const C=w.PandoraOSCalculator;
const classes=JSON.parse(read('data/os/classes.json'));
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
test('the six Remaked elemental magic branches reflect only chosen honor',()=>{
 const blank={fire:0,ice:0,lightning:0,poison:0,light:0,dark:0};
 assert.deepEqual(C.elementalMagicPreview({honorTitle:0}),blank);
 for(const [honor,element] of [[3,'fire'],[4,'ice'],[5,'lightning']]){
  const result=C.elementalMagicPreview({honorTitle:honor});
  assert.equal(result[element],5);
  assert.equal(Object.values(result).reduce((a,b)=>a+b,0),5);
 }
 assert.equal(C.elementalMagicPreview({honorTitle:14}),null);
});
test('a planned level-55 hero exposes magic honor without changing attack spells or elemental resistance',()=>{
 const input={classData:classes.MAGE,raceData:zeros,jobData:zeros,
  allocation:{vit:50,str:40,agi:20,dex:30,spi:35,int:90},level:55,
  combatContext:{jobKey:'MAGE',skillCatalog:{}}};
 const plain=C.base(input);
 const honor=C.base({...input,attributeBuffs:{honorTitle:3}});
 assert.equal(plain.elementalMagic.fire,0);
 assert.equal(honor.elementalMagic.fire,5);
 assert.equal(honor.elementalMagic.ice,0);
 assert.equal(honor.elementalMagic.lightning,0);
 assert.equal(honor.level,undefined);
});
test('book keeps physical weapon damage separate and renders elemental honor bonuses',()=>{
 const view=read('pandora-studio-hero-book.js');
 assert.match(view,/Стихийная магия/);
 assert.match(view,/calc\.elementalMagic/);
 assert.match(view,/elementTerms\[key\]/);
});

}

{
// Original: tests/remaked-source-inventory.test.mjs
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const snapshot=JSON.parse(read('data/remaked/legacy-calc-cases.v1.json'));
const inventory=read('docs/REMAKED_FORMULA_INVENTORY.md');
test('every one of 178 Remaked switches and 143 identities has a source line and durable audit entry',()=>{
 assert.equal(snapshot.caseOccurrences,178);
 assert.equal(snapshot.entries.length,snapshot.caseOccurrences);
 const keys=new Set(snapshot.entries.map(r=>r.key));
 assert.equal(snapshot.uniqueKeys,143);
 assert.equal(keys.size,snapshot.uniqueKeys);
 for(const row of snapshot.entries){
  assert.ok(Number.isInteger(row.line)&&row.line>0);
  assert.ok(keys.has(row.key));
  assert.match(inventory,new RegExp('\\| \\x60'+row.key+'\\x60 \\|'));
 }
});
test('audit has no duplicate or silently absent Legacy calculation identities',()=>{
 const keys=[...inventory.matchAll(/^\| `([^`]+)` \|/gm)].map(x=>x[1]);
 assert.equal(keys.length,snapshot.uniqueKeys);
 assert.equal(new Set(keys).size,snapshot.uniqueKeys);
 assert.deepEqual(new Set(keys),new Set(snapshot.entries.map(x=>x.key)));
});
test('formula index remains visible in roadmap and pinned to a Remaked source revision',()=>{
 assert.match(snapshot.sourceRepository,/Pandora-Saga-Simulator-remaked/);
 assert.match(snapshot.sourceTreeSha,/^[a-f0-9]{40}$/);
 assert.match(read('ROADMAP.md'),/REMAKED_FORMULA_INVENTORY\.md/);
});

}

{
// Original: tests/remaked-town-movement-parity.test.mjs
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};Function('window',read('pandora-os-character-calculator.js'))(ctx);
const C=ctx.PandoraOSCalculator;
const gear=JSON.parse(read('data/os/items.json'));
const cloak=gear['18073'];
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const base=records=>C.combatPreview({stats,level:55,jobKey:'ARCHER',records,skillCatalog:{}});
test('official OS beginner cloak grants town-only movement +15',()=>{
 assert.equal(cloak.name,'Плащ новичка');
 assert.equal(cloak.effects.find(e=>e.func==='EP_RESTMAP_MOVESPEED_SCALE').a,15);
 const alone=base([]),equipped=base([['item:18073',cloak,0]]);
 assert.equal(equipped.movementSpeed.known,alone.movementSpeed.known);
 assert.equal(equipped.movementSpeed.townEquipment,15);
 assert.equal(equipped.movementSpeed.town-alone.movementSpeed.known,15);
 assert.equal(equipped.secondary.townMovement,15);
});
test('Remaked city speed includes the current ordinary movement and separate town gear once',()=>{
 const rows=[['item:18073',cloak,0],['item:speed',{effects:[{func:'EP_MOVESPEED_SCALE',a:5}]},0]];
 const cm=base(rows);
 assert.equal(cm.movementSpeed.equipment,5);
 assert.equal(cm.movementSpeed.known,105);
 assert.equal(cm.movementSpeed.town,120);
});
test('book shows city speed without inflating base movement label',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/Скор\. в городе/);
 assert.match(book,/c\.movementSpeed\?\.town/);
 assert.doesNotMatch(book,/stage-combat-quick/);
});

}

{
// Original: tests/live-source-egress-readiness.test.mjs
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('a real Worker upstream response is required for source health',()=>{
 assert.deepEqual(classifyGameSource(200,{status:'ok',source:'game-site'}),
  {healthy:true,reason:'ok'});
 for(const [status,payload] of [
  [503,{status:'unavailable',code:'timeout'}],
  [200,{status:'ok',source:'stale-cache'}],
  [503,null],[200,{status:'unavailable'}]
 ])assert.equal(classifyGameSource(status,payload).healthy,false);
});
test('source diagnostic sanitizes upstream values before logging',()=>{
 assert.deepEqual(classifyGameSource(503,{code:'Bearer secret\n::error::'}),
  {healthy:false,reason:'unavailable'});
 assert.deepEqual(classifyGameSource(503,{code:'http-503'}),
  {healthy:false,reason:'http-503'});
});
test('readiness performs anonymous source GET and does not fail an otherwise healthy D1',()=>{
 const src=read('scripts/check-live-connections.mjs');
 assert.match(src,/read\(worker\+'\/api\/source-health',\{cors:true\}\)/);
 assert.match(src,/classifyGameSource\(response\.status,payload\)/);
 assert.match(src,/signal\.healthy\?'OK  ':'WARN'/);
 const start=src.indexOf(' // A published D1 catalog may work');
 const end=src.indexOf("try{\n const {response}=await read(worker+'/api/health'",start);
 assert.ok(start>0&&end>start);
 assert.doesNotMatch(src.slice(start,end),/failures\+\+|check\(false|Bearer |Authorization|POST/);
});

}

{
// Original: tests/next-release-contract.test.mjs
const read = file => readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('new characters always begin at level 1, and planning retains level 55',()=>{
  const app=read('pandora-studio-app.js'),rules=read('pandora-studio-attribute-progression.js');
  assert.match(app,/function fresh\(\)\{return\{[^\n]*level:1\b/);
  assert.match(rules,/55/,'studio level cap must not collapse to the current live server cap');
});

test('a published link is verified by the Worker before showing the URL and copy action',()=>{
  const app=read('pandora-studio-app.js');
  const start=app.indexOf('async function createShared(');
  const end=app.indexOf('function openSharedSnapshot(',start);
  assert.ok(start>=0&&end>start,'share function must remain inspectable');
  const share=app.slice(start,end);
  const probe=share.indexOf("apiRequest('/api/shared/'+response.id,null,viewerToken)");
  const verify=share.indexOf('isVerifiedSharedBuild(check?.share,expectedData)');
  const announce=share.indexOf('Ссылка на билд создана.');
  assert.ok(probe>=0&&verify>probe&&announce>verify,
   'cannot claim link exists before successful GET verification');
  assert.match(share,/const viewerToken=window\.PandoraAccountUI\?\.token\(\),viewerOwner=libraryScopeId\(\)/);
  assert.match(share,/const currentRequest=\(\)=>sameViewer\(\)&&pendingShareRequests\.get\(requestKey\)===operation/);
  assert.match(share,/if\(!currentRequest\(\)\)return;/);
  assert.match(share,/const expectedData=JSON\.parse\(JSON\.stringify\(build\.data\)\)/);
  assert.match(share,/aria-label':'Ссылка на билд'/);
  assert.match(share,/navigator\.clipboard\.writeText\(url\)/);
  assert.match(share,/field\.focus\(\);field\.select\(\)/);
});

}
