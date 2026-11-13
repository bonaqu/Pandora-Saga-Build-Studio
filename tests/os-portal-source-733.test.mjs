import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const options=(level=45,skillCatalog=skills,jobKey='CONJURER')=>({
 skillCatalog,jobKey,level,
 branchCaps:classes[jobKey].branchCaps,
 branchMasteries:classes[jobKey].branchCaps
});
const portal=preview=>preview.other.find(x=>x.id===410000301);

test('current OS Memorize / Двойной портал has a source-only preview',()=>{
 const source=skills['410000301'];
 const english=JSON.parse(read('data/os/strings.en.json')).skills['410000301'];
 assert.equal(source.name,'Двойной портал');
 assert.equal(english.n,'Memorize');
 const result=C.situationalSkillPreview(options());
 const row=portal(result);
 assert.ok(row,'Conjurer must see source-only portal entry');
 assert.equal(row.name,source.name);
 assert.equal(row.mana,10);
 assert.equal(row.cooldown,5);
 assert.equal(row.requirementsMet,true);
 assert.equal(row.sourceOnly,true);
 assert.equal(row.finalAmount,null);
 assert.equal(row.appliedToHero,false);
 assert.equal(row.inventoryChecked,false);
 assert.match(row.noteRu,/портал/);
 assert.match(row.noteEn,/portal/);
 assert.deepEqual(source.funcs.map(f=>f.ep),
  ['EP_CANCEL_MEMORIZE_IN_MAP','EP_WARP_MEMORY']);
 assert.equal(result.rejected.includes(410000301),false);
 const tooLow=portal(C.situationalSkillPreview(options(44)));
 assert.equal(tooLow.requirementsMet,false);
 assert.match(tooLow.reasonRu,/45/);
 assert.equal(portal(C.situationalSkillPreview(options(45,skills,'WARRIOR'))),undefined);
});

test('any changed OS portal signature fails closed, independent of other actions',()=>{
 for(const mutate of [
  source=>{source.mana=11},
  source=>{source.funcs[0].fv1[0]=1},
  source=>{source.funcs[1].fv2[3]=1},
  source=>{source.funcs[1].dir='CASTER'},
  source=>{source.charLevel=46}
 ]){
  const corrupted=structuredClone(skills);
  mutate(corrupted['410000301']);
  const changed=C.situationalSkillPreview(options(45,corrupted));
  assert.equal(portal(changed),undefined);
  assert.ok(changed.rejected.includes(410000301));
  assert.ok(changed.other.every(row=>row.finalAmount===null));
 }
});

test('cross-module census includes portal action only as qualitative source',()=>{
 const census=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 const item=census.rows.find(x=>x.id===410000301);
 assert.equal(item.name,'Двойной портал');
 assert.equal(item.status,'qualitative-preview');
 assert.deepEqual(item.sourceModules,['situational-skill-source']);
 assert.equal(item.numericPreview,false);
 assert.equal(item.targetSideOnly,false);
 assert.ok(census.summary.statuses['numeric-preview']>=72);
 assert.ok(census.summary.statuses['qualitative-preview']>=53);
 assert.ok(census.summary.statuses['unmodeled-learnable']<=49);
});

test('Hero Book reuses the existing Special Actions group and original RU/EN labels',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/\['other','Особые действия','Other abilities'\]/);
 assert.match(book,/gameTerms\.englishSkills\?\.\[String\(row\.id\)\]/);
 assert.match(book,/gameSkillBadge\(row\.id,row\.name,official\?\.n\|\|row\.name/);
});
