import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const engine=read('pandora-os-character-calculator.js'),
 book=read('pandora-studio-hero-book.js'),app=read('pandora-studio-app.js');
const host={};Function('window',engine)(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const cast=(spi,blessing,hymn,catalog=skills)=>C.priestCastPreviews({
 spi,blessing,hymn,skills:catalog});

test('current OS and Remaked floors update priest per-cast values independently of activation',()=>{
 const r=cast(134,90,30);
 assert.equal(r.gratia,22);
 assert.equal(r.lapisMedio,12);
 assert.equal(r.encouragement,9);
 assert.equal(r.groupBarrier,-28);
 assert.equal(r.holyWeapon,10);
 assert.equal(r.minstrel,24);
 assert.equal(r.sage,16);
 const changed=cast(105,61,12);
 assert.equal(changed.encouragement,6);
 assert.equal(changed.gratia,18);
 assert.equal(changed.lapisMedio,10);
 assert.equal(changed.groupBarrier,-22);
 assert.equal(cast(-1,90,30).gratia,null);
});
test('source mismatch is fail-closed for each priest numeric line',()=>{
 const forged=structuredClone(skills);
 forged['320012001'].funcs.find(f=>f.ep==='EP_STRENGTH_CONST').fv1[2]=99;
 forged['320007001'].funcs.find(f=>f.ep==='EP_ATTACKINTERVAL_SCALE').fv1[3]=99;
 const r=cast(134,90,30,forged);
 assert.equal(r.encouragement,null);
 assert.equal(r.gratia,null);
 assert.equal(r.lapisMedio,12);
});
test('Book lists all supported ally numeric summaries and distinct priest stat bonuses',()=>{
 assert.match(book,/Одновременно действует только одно умение/);
 assert.match(book,/priestValues=modifiers\?\.priestCast\|\|\{\}/);
 assert.match(book,/СИЛ \+/);
 assert.match(book,/ПРВ \+/);
 assert.match(book,/ИНТ \+/);
 assert.match(book,/320002001:restKnown/);
 assert.match(book,/const inspirationKnown=osVector\(320006001,'EP_SKILL_DELAY_FIN',\[0,0,0,50\]\)/);
 assert.match(book,/const naturalKnown=osVector\(330005001,'EP_HEAL_MANA_REGENERATOR'/);
 assert.match(book,/50% от обычного/);
 assert.match(book,/\+5 ОМ каждые 2 секунды/);
 assert.match(book,/базовый коэффициент \+40%/);
 assert.match(book,/расчётная модель/);
 assert.match(book,/priestValues\.holyEnhanced/);
});
test('Path rich tooltip has one reusable source for Buffs, Effects and triggered items',()=>{
 assert.match(app,/window\.PandoraSkillPreview=Object\.freeze\(\{/);
 assert.match(app,/skillHover\(node,localized\)/);
 assert.match(app,/button.addEventListener\('pointermove',event=>\{/);
 assert.match(app,/entry\.reqs/);
 assert.match(app,/path-skill-hover-tooltip/);
 assert.match(book,/root\.PandoraSkillPreview\?\.attach\(label,id\)/);
 assert.match(book,/root\.PandoraSkillPreview\?\.attach\(badge,skill\.id\)/);
 assert.match(book,/root\.PandoraSkillPreview\?\.attach\(info,skill\.id\)/);
 assert.match(book,/root\.PandoraSkillPreview\?\.attach\(info,skill\.id\)/);
 assert.match(app,/id:combatSkillCatalog\.supportSkillIds\[kind\]/);
 assert.match(app,/if\(type==='skill'&&typeof window!=='undefined'\)/);
 assert.match(app,/window\.PandoraSkillPreview\?\.attach\(link,displayId\)/);
});
