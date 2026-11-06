import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
for(const p of ['pandora-studio-ui-planner.js','pandora-studio-skill-progression.js',
 'pandora-os-character-calculator.js'])Function('window',read(p))(host);
const ui=host.PandoraUIPlanner,skill=host.PandoraSkillProgression,
 game=host.PandoraOSCalculator,classes=JSON.parse(read('data/os/classes.json')),
 tables=JSON.parse(read('data/os/tables.json'));

test('one-piece body outfit occupies two visual rails without creating a second equipped record',()=>{
 const dress={id:12611,slot:'body',name:'Астирское платье'};
 assert.equal(ui.occupiesBodyAndLegs(dress),true);
 assert.equal(ui.occupiesBodyAndLegs({id:12601,slot:'body'}),false,
  'ordinary Astir armor is not a two-slot dress');
 assert.equal(ui.occupiesBodyAndLegs({id:12611,slot:'legs'}),false,
  'a spoofed pants item is not a body dress');
 const equipped={3:{id:12611,name:dress.name}};
 const catalog={'12611':dress};
 assert.deepEqual(ui.visualEquipment(equipped,3,catalog),
  {item:equipped[3],sourceSlot:3,shared:false});
 assert.deepEqual(ui.visualEquipment(equipped,5,catalog),
  {item:equipped[3],sourceSlot:3,shared:true});
 assert.equal(Object.keys(equipped).length,1,'a mirrored slot must not double-calculate stats');
 equipped[5]={id:13612,name:'Старые штаны'};
 assert.equal(ui.visualEquipment(equipped,5,catalog).item.id,12611,
  'older conflicting saves show the dress until it is removed');
 assert.equal(equipped[5].id,13612,'legacy clothes remain recoverable, not erased on view');
 assert.equal(ui.visualEquipment({5:equipped[5]},5,catalog).shared,false);
 assert.equal(ui.occupiesBodyAndLegs({id:900000,slot:'body',
  occupiedSlots:['body','legs']}),true,'future explicitly sourced dual-slot records');
});

test('all 28 class previews keep innate D distinct from current P and spent points',()=>{
 assert.equal(Object.keys(classes).length,28);
 const stats={vit:10,str:9,agi:3,dex:5,spi:5,int:2};
 for(const [job,klass] of Object.entries(classes)){
  const innate=tables.jobInit[klass.baseClass||job]?.branches||{};
  const caps=klass.branchCaps||{};
  const fresh={level:1,points:{},mastery:{},masteryAuto:true};
  const noAuto={...fresh,masteryAuto:false};
  for(const key of Object.keys(caps)){
   assert.equal(skill.branchMastery(fresh,key,innate,caps),
    skill.branchBase(innate,key),job+' '+key+' auto-on baseline');
   assert.equal(skill.branchMastery(noAuto,key,innate,caps),
    0,job+' '+key+' auto-off zero mastery');
   assert.equal(skill.potential(fresh,key),0,job+' '+key+' no free investments');
  }
  assert.equal(skill.spending(tables.abilityPoint,1,fresh.points).spent,0,job);
  const group=skill.combatMasteries(fresh,innate,caps);
  const expectedMelee=['slash','thrust','brush','blow','defense']
   .reduce((sum,key)=>sum+skill.branchBase(innate,key),0);
  assert.equal(group.melee,expectedMelee,job+' auto mode previews learned melee');
  assert.equal(skill.combatMasteries(noAuto,innate,caps).melee,0,
   job+' manual untouched mastery must not award melee passives');
  const spirit=skill.legacyPrayerSpirit(job,fresh,innate,caps);
  const inspired=['PRIEST','CLERIC','ENCHANTER'].includes(job);
  assert.equal(spirit,inspired?1+Math.floor(skill.prayerAdeptness(fresh,innate,caps)/10):0,
   job+' Inspiration must not bleed into another profession');
  const preview=game.combatPreview({
   stats,level:45,jobKey:job,meleeMastery:group.melee,
   magicMastery:group.magic,techniqueInnate:group.techniqueInnate,
   techniqueTrained:group.techniqueTrained});
  assert.ok(preview?.accuracy?.known!==undefined,
   job+' must produce a valid source-backed combat preview');
  assert.ok(Number.isFinite(preview.accuracy.known),
   job+' accuracy must not become NaN under innate mastery');
 }
});

test('Hero Path uses one green mastery band from zero and one absolute 90-point scale',()=>{
 const js=read('pandora-studio-hero-path.js'),css=read('pandora-studio-theme.css');
 assert.match(js,/const visualMax=90/);
 assert.match(js,/green\.style\.width=widthOnRail\(greenFraction\)/);
 assert.match(js,/gold\.style\.width=widthOnRail\(goldFraction\)/);
 assert.doesNotMatch(js,/innateFill|addedGreenFraction/);
 assert.doesNotMatch(css,/\.path-innate-fill\{/);
 const start=5,extra=3,green=0,max=90;
 assert.equal((start+extra)/max*900,80,'blue allocated level 8');
 assert.equal(green/max*900,0,'manual green zero');
});

test('every equipment choice uses the shared rich hover and Soul list restores its own scroll',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('function renderStagePicker('),end=app.indexOf('function attributeSnapshot()',start);
 const code=app.slice(start,end);
 assert.ok(code.length>3000);
 assert.match(code,/PandoraStageItemUI\.attachPreview\(btn,rec/);
 assert.match(code,/stageSoulScrollTop=previousSoulList\.scrollTop/);
 assert.match(code,/stageSoulScrollTop=soulList\.scrollTop/);
 assert.match(code,/soulList\.scrollTop=stageSoulScrollTop/);
 assert.doesNotMatch(code,/key==='legs'&&window\.PandoraUIPlanner\.isAstirDress/);
 assert.match(code,/selectedSlot===5&&oldDress/);
 assert.match(code,/delete state\.equipment\[3\];state\.displacedLegwear=null/);
 const uiSource=read('pandora-studio-equipment-ui.js');
 assert.match(uiSource,/function attachPreview\(target,record,icon/);
 assert.match(uiSource,/ITEM_PREVIEW_HOVER_DELAY_MS=650/);
});
