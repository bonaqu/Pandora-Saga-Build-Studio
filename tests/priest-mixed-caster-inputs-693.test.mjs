import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const css=read('pandora-studio-hero-book-additions.css');
const browser=read('tests/browser-smoke.mjs');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
test('caster stat and mastery fields use one shared state, not duplicate buff selectors',()=>{
 assert.match(book,/const statKeys=Array\.isArray\(skill\?\.casterStatKeys\)/);
 assert.match(book,/\[\.\.\.new Set\(skill\.casterStatKeys\)\]/);
 assert.match(book,/onchange:event=>onBuff\(key,event\.target\.value\)/);
 for(const source of ["['priestSpi','priestBlessing']",
  "['priestSpi','priestHymn']","['priestBlessing']"])
  assert.ok(book.includes(source),'Missing stat combination '+source);
 for(const key of ["caster-priestBlessing-320007001",
  "caster-priestBlessing-320011001","caster-priestHymn-340001001"])
  assert.ok(browser.includes(key),'Missing keyboard-driven browser test: '+key);
});
test('caster controls remain in ONE visual row with normal width and no separate accordion',()=>{
 assert.match(css,/#stageAttributes \.stage-ally-caster-fields\{/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/#stageAttributes \.stage-ally-skill-row\{/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(84px,152px\)/);
 assert.match(book,/parent\.append\(make\('div',\{class:'stage-ally-skill-row'\},\[node,fields\]\)\)/);
 assert.doesNotMatch(book,/stage-priest-power-grid/);
});
test('OS source magnitude actually changes independently with both caster inputs',()=>{
 const p=(spi,blessing,hymn)=>C.priestCastPreviews({
  spi,blessing,hymn,exorcism:26,skills});
 const a=p(134,90,30);
 assert.equal(a.gratia,22);
 assert.equal(a.enchantAuraRate,54);
 assert.equal(a.minstrel,24);
 const blessing=p(134,100,30);
 assert.equal(blessing.gratia,23);
 assert.equal(blessing.enchantAuraRate,56);
 assert.equal(blessing.minstrel,24);
 const hymn=p(134,90,40);
 assert.equal(hymn.gratia,22);
 assert.equal(hymn.minstrel,25);
});
