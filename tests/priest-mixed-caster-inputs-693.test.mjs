import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const css=read('pandora-studio-hero-book-additions.css');
const browser=read('tests/browser-smoke.mjs');
const app=read('pandora-studio-app.js');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
test('priest skill rows reuse exactly three shared profile fields',()=>{
 const fields=book.slice(book.indexOf('const priestFields=make('),book.indexOf('priest.append(priestFields);'));
 for(const key of ['priestSpi','priestBlessing','priestHymn'])assert.ok(fields.includes("['"+key+"'"),key);
 for(const key of ['priestBenevolence','priestExorcism'])assert.ok(!fields.includes("['"+key+"'"),key);
 assert.doesNotMatch(book,/casterStatKeys|casterStatKey|stage-ally-skill-row/);
 assert.doesNotMatch(css,/stage-ally-caster-field|stage-ally-skill-row/);
 assert.match(browser,/stage-priest-fields input/);
});
test('old priest mastery persists for gates and never counts as a selected buff',()=>{
 for(const key of ['priestBenevolence','priestExorcism'])assert.ok(app.includes(key));
 assert.match(book,/row\.id!==330051001\|\|Number\(buffs\.priestExorcism\)>=26/);
 assert.match(book,/Number\(buffs\.priestBenevolence\)>=61/);
 assert.match(book,/if\(\['priestSpi','priestBlessing','priestHymn','priestBenevolence','priestExorcism','priestEnabled'/);
});
test('changing the shared input still changes all dependent skill magnitudes by floored OS coefficients',()=>{
 const p=(spi,blessing,hymn)=>C.priestCastPreviews({spi,blessing,hymn,exorcism:26,skills});
 assert.equal(p(134,90,30).gratia,22);
 assert.equal(p(134,100,30).gratia,23);
 assert.equal(p(134,90,30).enchantAuraRate,54);
 assert.equal(p(134,100,30).enchantAuraRate,56);
 assert.equal(p(134,90,30).minstrel,24);
 assert.equal(p(134,90,40).minstrel,26);
});
