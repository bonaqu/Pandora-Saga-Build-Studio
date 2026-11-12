import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js'),
 app=read('pandora-studio-app.js'),
 css=read('pandora-studio-hero-book-additions.css'),
 theme=read('pandora-studio-theme.css');
test('explicit per-chapter defaults: Attack unchanged, Defense recovery, Priest and Healing only',()=>{
 const src=book.slice(book.indexOf('function bookSectionStartsOpen('),
  book.indexOf('function resetDisclosureState()'));
 assert.match(src,/page==='attack'\)return true/);
 assert.match(src,/page==='defense'\)return node\?\.dataset\?\.chapterGroup==='recovery'/);
 assert.match(src,/page==='buffs'\)return node\?\.dataset\?\.bookSection==='priest'/);
 assert.match(src,/page==='effects'\)return node\?\.classList\?\.contains\('stage-healing-spells'\)/);
 assert.match(src,/return false/);
 assert.match(book,/disclosure\.open=expandedBookGroups\.has\(key\)/);
 assert.match(book,/detail\.open=expandedBookDetails\.has\(key\)/);
 assert.match(book,/resetDisclosureState,/);
});
test('priest strength lives under each supported skill, never in a second grid',()=>{
 const buffs=book.slice(book.indexOf('function buffsPage('),book.indexOf('function gameSkillBadge('));
 assert.match(buffs,/priest\.dataset\.bookSection='priest'/);
 assert.match(buffs,/summary:row\.counted/);
 assert.match(buffs,/priestValues\.holyWeapon/);
 assert.match(buffs,/priestValues\.gratia/);
 assert.match(buffs,/priestValues\.peaceful/);
 assert.doesNotMatch(buffs,/class:'stage-legacy-buff-previews'/);
 assert.doesNotMatch(buffs,/stage-legacy-buff-grid/);
 assert.match(css,/\.stage-combat-buff-copy>small/);
});
test('guild select, skill icon and heading share a single grid row even in manual mode',()=>{
 assert.match(css,/grid-template-columns:30px minmax\(0,1fr\) minmax\(98px,45%\)/);
 assert.match(css,/stage-guild-skill-field>select\{\s*grid-column:3;grid-row:1/);
 assert.match(css,/stage-guild-skill-field>span\{\s*grid-column:2;grid-row:1/);
 assert.match(book,/roman\[rank\]\+' · '/);
 assert.match(book,/\[0,3,6,10\]\.indexOf/);
});
test('opening any rail slot from Hero Book makes picker close return to portrait',()=>{
 const route=app.slice(app.indexOf('function openStageEquipmentSlot('),
  app.indexOf('function unequipStageEquipmentSlot('));
 assert.match(route,/if\(stageAttributesPage\)\{\s*stageAttributesPage=null/);
 assert.match(route,/resetDisclosureState/);
 assert.match(app,/function closeStagePicker\(focusSlot=true\)\{/);
 const end=app.slice(app.indexOf('  onClose:()=>{\n   stageAttributesPage=null;'),
  app.indexOf('  onPage:name=>{'));
 assert.match(end,/resetDisclosureState/);
});
test('right-hand equipment content retains width with independent scrollbar',()=>{
 assert.match(theme,/#stagePicker \.stage-rich-body>\.stage-rich-summary/);
 assert.match(theme,/#stagePicker \.stage-rich-body>\.stage-enchant-fieldset/);
 assert.match(theme,/scrollbar-width:thin/);
});
test('resistance copy states exactly the exclusive-selection rule',()=>{
 assert.match(book,/Одновременно действует только одно умение, выбор нового заменяет предыдущие\./);
 assert.doesNotMatch(book,/Умения можно применять к союзникам и врагам/);
});
