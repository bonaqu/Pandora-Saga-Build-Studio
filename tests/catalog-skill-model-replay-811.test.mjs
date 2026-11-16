import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
for(const name of ['pandora-os-character-calculator.js','pandora-studio-attribute-progression.js',
 'pandora-studio-skill-progression.js','pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(name),{window:root});
const replay=root.PandoraCatalogSafety.replaySkills;
const readJSON=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:readJSON('skills'),classes:readJSON('classes'),tables:readJSON('tables')};
const amended=()=>{
 const after={...before,skills:{...before.skills}};
 return after;
};

test('a strictly textual patch needs no numeric-model replay',()=>{
 const next=amended();
 next.skills['320001001']={...before.skills['320001001'],desc:'Updated'};
 const result=replay(before,next);
 assert.equal(result.ok,true);
 assert.equal(result.changedSkills,0);
 assert.equal(result.scenarios,0);
 assert.equal(result.lost,0);
});
test('cast timing is a mechanical change and replays known previews without D1 writes',()=>{
 const next=amended();
 next.skills['320001001']={...before.skills['320001001'],
  cast:before.skills['320001001'].cast+1};
 const result=replay(before,next);
 assert.ok(result.changedSkills>=1,'changed skill and verified links are replayed');
 assert.ok(result.scenarios>0,'timing changes must trigger a full read-only model replay');
 assert.equal(result.lost,0,'an unchanged numerical source may keep the same preview');
 assert.equal(result.ok,true);
 const audit=root.PandoraCatalogSafety.compatibility(before,next);
 assert.equal(audit.totals.sourceOnly,1);
 assert.equal(audit.entries[0].contract,'skill.source-parameters');
});
test('known source-gated combat effect lost on an FV mutation blocks the selected snapshot',()=>{
 const next=amended();
 const record=structuredClone(before.skills['320001001']);
 const effect=record.funcs.find(row=>row.ep==='EP_DAMAGERATE_SCALE');
 assert.ok(effect,'Pinned OS combat skill needs a known damage-rate contract');
 effect.fv1[3]+=1;
 next.skills['320001001']=record;
 const beforeString=JSON.stringify(before),afterString=JSON.stringify(next);
 const result=replay(before,next);
 assert.ok(result.scenarios>0,'actual representative hero models must be exercised');
 assert.ok(result.previouslyModeled>0,'the old catalog contained a numeric skill model');
 assert.equal(result.ok,false);
 assert.ok(result.lost>0,'a numeric calculation must not silently disappear');
 assert.ok(result.samples.some(row=>row.id==='320001001'));
 assert.equal(JSON.stringify(before),beforeString,'never mutate published source');
 assert.equal(JSON.stringify(next),afterString,'never mutate selected update');
});
test('unknown new skill is not invented as a numeric combat model',()=>{
 const next=amended();
 next.skills['989898989']={id:989898989,name:'New source-only effect',
  classes:{WARRIOR:1},learnable:true,charLevel:45,
  funcs:[{ep:'EP_NEW_UNKNOWN',dir:'TARGET',fv1:[0,0,0,13],fv2:[0,0,0,0]}]};
 const report=replay(before,next);
 assert.equal(report.changedSkills,1);
 assert.equal(report.lost,0);
 assert.equal(report.unmodeled,1);
 assert.equal(report.ok,true,'a new source-only entry does not erase an old formula');
 assert.equal(root.PandoraCatalogSafety.compatibility(before,next).requiresMechanicReview,true,
  'the existing semantic gate still requires an explicit review');
});
test('fully unavailable numeric engines prevent falsely successful replay',()=>{
 const sandbox={};
 vm.runInNewContext(read('pandora-studio-catalog-safety.js'),{window:sandbox});
 const next=amended();
 const record=structuredClone(before.skills['320001001']);
 record.funcs[0].fv1[3]+=1;
 next.skills['320001001']=record;
 const result=sandbox.PandoraCatalogSafety.replaySkills(before,next);
 assert.equal(result.ok,false);
 assert.match(result.errors[0],/Не подключены/);
});
test('source restrictions that explicitly remove class access are not mistaken for a hidden formula regression',()=>{
 const next=amended();
 const record=structuredClone(before.skills['320001001']);
 record.classes={};
 next.skills['320001001']=record;
 const report=replay(before,next);
 assert.equal(report.ok,true);
 assert.equal(report.lost,0);
 assert.equal(root.PandoraCatalogSafety.compatibility(before,next).requiresMechanicReview,true,
  'class access is a gameplay change that still needs owner review');
});
test('both UI preview and final precommit gate use the same immutable model replay',()=>{
 const code=read('pandora-os-catalog-workbench.js');
 assert.match(code,/const replay=typeof safety\.replaySkills==='function'\?/);
 assert.match(code,/safety\.replaySkills\(baseline,selected\)/);
 assert.match(code,/safety\.replaySkills\(baseline,combined\)/);
 assert.match(code,/validation\.ok=false/);
 assert.match(code,/publish\.disabled=!ready\|\|!acknowledged\|\|preview\?\.validation\?\.ok!==true/);
 assert.match(code,/if\(replay&&!replay\.ok\)throw Error/);
 assert.match(code,/Known skill model samples retained/);
 const safety=read('pandora-studio-catalog-safety.js');
 assert.match(safety,/const equipment=\[/);
 assert.match(safety,/root\.PandoraCatalogSafety=Object\.freeze\(\{[^}]*replaySkills/);
});
