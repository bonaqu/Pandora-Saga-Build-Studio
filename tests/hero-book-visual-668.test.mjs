import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const visual=read('pandora-studio-hero-book-additions.css');
const owner=read('pandora-studio-owner-inline-ui.css');
const host={};
Function('window',read('pandora-studio-honor-guide.js'))(host);

test('effect icons have intrinsic-safe width/height, not full-size OS sprites',()=>{
 const badge=book.slice(book.indexOf('function gameSkillBadge('),book.indexOf('function renderSongSkills('));
 assert.match(badge,/width:26,height:26/);
 assert.match(badge,/max-width:26px/);
 assert.match(badge,/max-height:26px/);
 assert.match(visual,/#stageAttributes \.stage-effect-skill-label>img/);
 assert.match(visual,/max-width:26px!important/);
 assert.match(visual,/max-height:26px!important/);
 assert.match(visual,/border:1px solid #cf9d53!important/);
 assert.match(read('tests/browser-book-game-terms-664.mjs'),/getBoundingClientRect\(\)\.width/);
});

test('Mounted field has plain RU/EN hover help on its exact visible label',()=>{
 const info=host.PandoraHonorGuide.field({},'attack.mountedToggle','Верхом','Mounted');
 assert.match(info.hintRu,/сражается верхом/);
 assert.match(info.hintEn,/fighting while mounted/);
 assert.doesNotMatch(info.hintRu,/Remaked|Legacy|формул/);
 assert.match(book,/guideLabel\(toggle\.querySelector\('\.stage-mounted-label'\),'attack\.mountedToggle'/);
 assert.match(book,/for:'stageBookMountedToggle'/);
 assert.doesNotMatch(book,/function mountedBookNotice\(/);
});

test('the Buffs tab opens on controls, with no boilerplate and no permanent Mounted paragraph',()=>{
 const start=book.indexOf('function buffsPage('),end=book.indexOf('function gameSkillBadge(');
 const buff=book.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.doesNotMatch(buff,/body\.append\(make\('p',\{class:'stage-attribute-note',text:english/);
 assert.match(buff,/const status=make\('div',\{class:'stage-buff-overview'/);
 const attack=book.slice(book.indexOf('function attackPage('),book.indexOf('function defensePage('));
 assert.doesNotMatch(attack,/stage-mounted-note/);
});

test('admin controls have separate fixed cells and defend against header button padding',()=>{
 assert.match(owner,/#stageAttributes \.stage-guide-actions>.stage-guide-edit-name/);
 assert.match(owner,/grid-template-columns:repeat\(2,22px\)!important/);
 assert.match(owner,/padding:0!important/);
 assert.match(owner,/position:static!important/);
 assert.match(read('tests/browser-ui-content-inline.mjs'),/Hero Book owner buttons must not overlap/);
});
