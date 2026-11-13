import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const race={vit:40,str:50,agi:30,dex:20,spi:70,int:15};
const none={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const priest={enabled:true,spi:134,blessing:90,hymn:30,benevolence:61,exorcism:26};
const hero=(selected=[],priestProfile=priest,catalog=skills)=>C.base({
 classData:classes.WARRIOR,raceData:race,jobData:none,allocation:none,level:45,
 attributeBuffs:{priestEnabled:true,remakedSkillIds:selected},
 combatContext:{jobKey:'WARRIOR',skillCatalog:catalog,branchMasteries:{},
  externalPriest:priestProfile}
});

test('Sage Song gives two distinct recipient-side models regardless of the receiving hero profession',()=>{
 const root=skills['340004001'],recipient=skills['340004003'];
 assert.equal(root.name,'Песнь чар');
 assert.equal(root.funcs[0].fv1[3],340004002);
 assert.deepEqual(recipient.funcs.find(x=>x.ep==='EP_SKILL_BENCH_FIN').fv1,[-28,0,-17,-5]);
 const preview=C.priestCastPreviews({...priest,skills});
 assert.equal(preview.sage,16);
 assert.equal(preview.sageCooldownDelta,-47);
 assert.equal(C.priestCastPreviews({...priest,spi:136,skills}).sageCooldownDelta,-48);
 assert.equal(C.priestCastPreviews({...priest,hymn:36,skills}).sageCooldownDelta,-48);
 const inactive=hero(),selected=hero([340004001]);
 assert.equal(inactive.combat.priestSong.sageElementDamage,0);
 assert.equal(inactive.combat.priestSong.sageCooldownDelta,0);
 assert.equal(selected.combat.priestSong.sageElementDamage,16);
 assert.equal(selected.combat.priestSong.sageCooldownDelta,-47);
 assert.equal(selected.combat.cooldown,inactive.combat.cooldown,
  'without confirmed server stacking, do not invent a final cooldown');
 assert.deepEqual(selected.stats,inactive.stats);
});

test('changed source vector, disabled allied caster and unmet caster mastery fail closed',()=>{
 const corrupted=structuredClone(skills);
 corrupted['340004003'].funcs.find(x=>x.ep==='EP_SKILL_BENCH_FIN').fv2[0]=1;
 assert.equal(C.priestCastPreviews({...priest,skills:corrupted}).sageCooldownDelta,null);
 assert.equal(hero([340004001],priest,corrupted).combat.priestSong.sageCooldownDelta,0);
 assert.equal(hero([340004001],{...priest,enabled:false}).combat.priestSong.sageCooldownDelta,0);
 assert.equal(hero([340004001],{...priest,blessing:70}).combat.priestSong.sageCooldownDelta,0);
});

test('Book keeps recipient-side allied buffs, five caster inputs and no duplicate Holy aura total',()=>{
 const book=read('pandora-studio-hero-book.js'),app=read('pandora-studio-app.js');
 for(const literal of ['Усиления от союзников','Усиления жреца','combatWarCry',
  'combatWindAssist','combatWindBlessing','priestBenevolence','priestExorcism',
  'sageCooldownDelta'])assert.ok(book.includes(literal),literal);
 assert.match(app,/supportSkillAvailability\(/);
 const start=book.indexOf('if(row.id===320011001&&Number.isFinite(');
 const end=book.indexOf('if(row.id===320011001)return',start);
 assert.ok(start>=0&&end>start);
 assert.doesNotMatch(book.slice(start,end),
  /Святая аура с обоими усилениями|Holy aura with both buffs/);
 assert.match(book,/priestValues\.holyEnhanced/);
 assert.match(book,/Показатель отката/);
 assert.match(book,/Песнь чар · снижение показателя отката/);
});
