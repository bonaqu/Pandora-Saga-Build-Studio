import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',load('pandora-studio-remaked-buffs.js'))(host);
Function('window',load('pandora-os-character-calculator.js'))(host);
const B=host.PandoraRemakedBuffs,C=host.PandoraOSCalculator;
const os=JSON.parse(load('data/os/skills.json'));
const english=JSON.parse(load('data/os/strings.en.json')).skills;
const common={skills:os,englishSkills:english,jobKey:'WARRIOR',
 level:45,branchMasteries:{},weapon:null};
const get=id=>B.choices(common).find(row=>row.id===id);

test('every non-rune Remaked Set.Buff slot has a unique primary current-OS skill',()=>{
 assert.equal(B.definitions.length,36);
 assert.equal(new Set(B.definitions.map(x=>x.flag)).size,36);
 assert.equal(new Set(B.definitions.map(x=>x.id)).size,36);
 assert.equal(B.definitions.filter(row=>!row.existing).length,21);
 assert.equal(B.definitions.filter(row=>row.existing).length,15);
 for(const row of B.definitions){
  assert.equal(os[String(row.id)]?.id,row.id,row.flag);
  assert.ok(os[String(row.id)].funcs.length>0,row.flag);
  assert.ok(english[String(row.id)]?.n,row.flag);
 }
 // The legacy source also has 30_0/30_1/30_2 rune settings, without
 // confirmed current OS equivalents; never manufacture their game effects.
 for(const code of ['30_0','30_1','30_2'])
  assert.ok(!B.definitions.some(row=>row.flag===code));
});

test('group skills can affect any recipient, including an unrelated level 1 warrior',()=>{
 for(const [id,ru] of [
  [100055001,'Массовая сосредоточенность'],[320004001,'Благословение ветра'],
  [260006001,'Помощь ветра'],[330004001,'Божественное благословление'],
  [320002001,'Благословенный покой'],[320005001,'Знак жизни'],
  [320003001,'Божественная защита'],[340001001,'Песнь поэта']]){
  const row=B.choices({...common,level:1}) .find(x=>x.id===id);
  assert.equal(row?.name,ru);
  assert.equal(row.scope,'party');
  assert.equal(row.available,true,'Receiving '+ru+' must not require the caster class');
 }
});

test('Cold Blood requires cleave mastery 21 AND an axe, never just a checkbox',()=>{
 let row=get(142051001);
 assert.equal(row.available,false);
 assert.match(row.reason,/21/);
 row=B.choices({...common,branchMasteries:{brush:21}}).find(x=>x.id===142051001);
 assert.equal(row.available,false);
 assert.equal(row.reason,'Нужен топор');
 row=B.choices({...common,branchMasteries:{brush:21},
  weapon:{kind:'1H_AXE'}}).find(x=>x.id===142051001);
 assert.equal(row.available,true);
 assert.equal(row.name,'Хладнокровие');
 const stale=B.applied({...common,selected:[142051001]});
 assert.deepEqual(stale,{});
 assert.deepEqual(B.applied({...common,selected:[142051001],
  branchMasteries:{brush:21},weapon:{kind:'2H_AXE'}}).coldBlood,{critical:10});
});

test('Iron Scale needs Defense mastery 21, other self buffs keep class and weapon checks',()=>{
 assert.equal(get(168052001).available,false);
 assert.match(get(168052001).reason,/21/);
 assert.equal(B.choices({...common,branchMasteries:{defense:21}})
  .find(x=>x.id===168052001).available,true);
 assert.equal(get(213605001).available,false);
 assert.equal(get(213605001).reason,'Недоступно для этой профессии');
 const level20=B.choices({...common,jobKey:'SNIPER',level:20,weapon:{kind:'BOW'}})
  .find(x=>x.id===213605001);
 assert.equal(level20.available,false);
 assert.match(level20.reason,/45/);
 const weapon=B.choices({...common,jobKey:'SNIPER',level:45,
  weapon:{kind:'1H_AXE'}}).find(x=>x.id===213605001);
 assert.equal(weapon.available,false);
 assert.equal(weapon.reason,'Нужен лук или арбалет');
});

test('only exact source IDs and verified game effects enter numeric results',()=>{
 const chosen=[100055001,330004001,142051001,260005001,260008001];
 const ctx={...common,jobKey:'WARRIOR',weapon:{kind:'1H_AXE'},
  branchMasteries:{brush:21,warding:41},selected:chosen};
 const result=B.applied(ctx);
 assert.deepEqual(result.thirdEye,{flat:20,percent:15});
 assert.deepEqual(result.providence,{magic:25});
 assert.deepEqual(result.coldBlood,{critical:10});
 assert.deepEqual(result.quickStep,{dodge:10});
 assert.deepEqual(result.avoidance,{dodge:100});
 const bad=structuredClone(os);
 bad['100055001'].funcs.find(x=>x.ep==='EP_TOHIT_SCALE').fv1[3]=150;
 assert.equal(B.applied({...ctx,skills:bad}).thirdEye,undefined);
 assert.equal(B.applied({...ctx,selected:[]}).thirdEye,undefined);
 assert.deepEqual(B.selectedIds([142051001,142051001,30,320005001,100055001]),
  [100055001,142051001]);
});

test('calculated effects change real stats while ordinary self buffs stay gated',()=>{
 const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
 const combatBuffs={remakedSkillIds:[100055001,142051001,260008001]};
 const ctx={stats,jobKey:'WARRIOR',level:45,weapon:{W:48,kind:'1H_AXE'},
  skillCatalog:os,branchMasteries:{brush:21,warding:41},combatBuffs};
 const base=C.combatPreview({...ctx,combatBuffs:{}});
 const active=C.combatPreview(ctx);
 const flat=Math.floor(20+(45+35)*.15);
 assert.equal(active.accuracy.known,base.accuracy.known+flat);
 assert.equal(active.critical.known,base.critical.known+10);
 assert.equal(active.dodge.known,base.dodge.known+100);
 const wrong=C.combatPreview({...ctx,jobKey:'SNIPER',branchMasteries:{}});
 assert.equal(wrong.critical.coldBlood,0);
 assert.equal(wrong.dodge.additionalSelf,0);
});

test('app keeps additional buffs in the character state and shared snapshots',()=>{
 const app=load('pandora-studio-app.js'),book=load('pandora-studio-hero-book.js'),
  html=load('index.html');
 assert.match(app,/remakedSkillIds:\[\]/);
 assert.match(app,/if\(key\.startsWith\('legacySkill:'\)\)/);
 assert.match(app,/safe\.attributeBuffs\.remakedSkillIds=window\.PandoraRemakedBuffs/);
 assert.match(app,/remakedBuffRows=window\.PandoraRemakedBuffs\?\.choices/);
 assert.match(book,/section\('Усиления от союзников','Ally buffs'/);
 assert.match(book,/section\('Личные умения','Self buffs'/);
 assert.match(book,/for\(const row of remakedBuffRows\)/);
 assert.ok(html.indexOf('pandora-studio-remaked-buffs.js')<
  html.indexOf('pandora-os-character-calculator.js'));
});
