import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
for(const name of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(name),{window:root});
const C=root.PandoraOSCalculator,S=root.PandoraCatalogSafety;
const get=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:get('skills'),classes:get('classes'),tables:get('tables')};
function change(id,edit){
 const after={...before,skills:{...before.skills}};
 after.skills[id]=structuredClone(before.skills[id]);
 edit(after.skills[id]);
 return after;
}
const combat={attack:{walkingBase:180},accuracy:{base:135},dodge:{base:110}};
const caster={spi:105,blessing:90,hymn:70,exorcism:40};

test('all six known allied-recipient buffs are exercised independently of hero class',()=>{
 const expected=new Map([
  [320001001,'warCry'],[100055001,'massConcentration'],
  [260006001,'windAssist'],[320004001,'windBlessing'],
  [330004001,'divineBlessing'],[320002001,'blessedRepose']
 ]);
 const old=C.alliedRecipientPreviews({skillCatalog:before.skills,combat});
 for(const [id,key] of expected){
  assert.ok(Number.isFinite(old[key]?.bonus),key+' exists on current source');
  const next=change(id,row=>{row.funcs[0].fv1[3]+=1});
  assert.equal(C.alliedRecipientPreviews({
   skillCatalog:next.skills,combat})[key],null,key+' now outside old signed vector');
  assert.equal(S.compatibility(before,next).totals.needsReview,1);
  const result=S.replaySkills(before,next);
  assert.equal(result.ok,false,key+' must block before D1');
  assert.ok(result.lost>0,key+' loses a numeric recipient model');
  assert.ok(result.samples.some(x=>x.id===String(id)&&
   x.module==='ally-recipient'&&x.detail.startsWith(key+':')),
   key+' regression includes the independent recipient model');
 }
});
test('supported updated Enchantment FV1 replays without hiding the change from precommit review',()=>{
 const original=C.priestCastPreviews({...caster,skills:before.skills});
 for(const key of ['enchantAuraRate','enchantAuraFlat','enchantElementRate'])
  assert.ok(Number.isFinite(original[key]),key+' old source coefficient');
 const next=change(320011001,row=>{row.funcs[0].fv1[3]+=1});
 const preview=C.priestCastPreviews({...caster,skills:next.skills});
 assert.equal(preview.enchantAuraRate,original.enchantAuraRate+1);
 assert.equal(preview.enchantAuraFlat,original.enchantAuraFlat);
 assert.equal(preview.enchantElementRate,original.enchantElementRate);
 const classified=S.compatibility(before,next);
 assert.ok(classified.totals.needsReview>0,
  'a numerical game-data source update must still demand catalog review');
 const replay=S.replaySkills(before,next);
 assert.equal(replay.ok,true,
  'the modeled coefficient survives a supported OS change without silent loss');
 assert.equal(replay.lost,0);
 const unsupported=change(320011001,row=>{row.funcs[0].fv1[1]=1});
 assert.equal(C.priestCastPreviews({...caster,skills:unsupported.skills}).enchantAuraRate,null);
 const negative=S.replaySkills(before,unsupported);
 assert.equal(negative.ok,false);
 assert.ok(negative.samples.some(x=>x.id==='320011001'&&
  x.module==='priest-cast'&&x.detail.startsWith('enchantAuraRate:')));
});
test('source-only song stage without class access still protects priest song projections',()=>{
 const id=340004003;
 const original=C.priestCastPreviews({...caster,skills:before.skills});
 assert.ok(Number.isFinite(original.sage),'source has modeled elemental song bonus');
 assert.ok(Number.isFinite(original.sageCooldownDelta),'source has modeled cooldown coefficient');
 assert.equal(Object.keys(before.skills[id].classes).length,0);
 const next=change(id,row=>{
  row.funcs.find(x=>x.ep==='EP_SKILL_BENCH_FIN').fv1[3]-=1;
 });
 const updated=C.priestCastPreviews({...caster,skills:next.skills});
 assert.equal(updated.sageCooldownDelta,null);
 assert.equal(updated.sage,null,
  'the exact signed song chain becomes unproven when either effect changes');
 const result=S.replaySkills(before,next);
 assert.equal(result.ok,false,'missing recipient cooldown model blocks precommit');
 assert.ok(result.samples.some(x=>x.id===String(id)&&
  x.module==='priest-cast'&&x.detail.startsWith('sageCooldownDelta:')));
});
test('changing a root song source checks its dependent recipient preview',()=>{
 const id=340004001;
 const old=C.priestCastPreviews({...caster,skills:before.skills});
 assert.ok(Number.isFinite(old.sage));
 const next=change(id,row=>{row.funcs[0].ep='EP_NOT_SUPPORTED'});
 assert.equal(C.priestCastPreviews({...caster,skills:next.skills}).sage,null);
 const result=S.replaySkills(before,next);
 assert.equal(result.ok,false);
 assert.ok(result.samples.some(x=>x.id===String(id)&&
  x.module==='priest-cast'&&x.detail.startsWith('sage:')));
});
test('unchanged recipient models and presentation-only skill edits retain their fast path',()=>{
 const next=change(320011001,row=>{
  row.desc='Обновлённый перевод';row.nameEn='Enhancement';
 });
 assert.equal(S.compatibility(before,next).totals.sourceOnly,1);
 const result=S.replaySkills(before,next);
 assert.equal(result.ok,true);
 assert.equal(result.changedSkills,0);
 assert.equal(result.scenarios,0);
});
test('recipient replay is read-only for baseline and candidate catalogs',()=>{
 const next=change(320012001,row=>{row.funcs[0].fv1[3]+=5});
 const baseline=JSON.stringify(before),candidate=JSON.stringify(next);
 S.compatibility(before,next);S.replaySkills(before,next);
 assert.equal(JSON.stringify(before),baseline);
 assert.equal(JSON.stringify(next),candidate);
});
