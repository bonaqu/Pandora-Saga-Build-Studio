import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const css=read('pandora-studio-hero-book-additions.css');

test('consumable skill references do not nest inside item-opening buttons',()=>{
 const begin=book.indexOf('const consumableSkills=modifiers?.consumableSkills?.rows||[];');
 assert.ok(begin>=0);
 const end=book.indexOf('body.append(section);',begin);
 assert.ok(end>begin);
 const part=book.slice(begin,end);
 assert.ok(part.includes("const row=make('div',{class:'stage-potion-item'})"));
 assert.ok(part.includes("const itemLink=make(item?'button':'span'"));
 assert.ok(part.includes("itemLink.append(make('span',{class:'stage-potion-name',text:displayName}))"));
 assert.ok(part.includes("row.append(itemLink,skillNames)"));
 assert.ok(part.includes("PandoraSkillPreview?.attach(badge,skill.id)"));
 assert.ok(!part.includes("const row=make(item?'button':'div'"));
 assert.ok(css.includes('stage-consumable-skills button.stage-potion-source:focus-visible'));
});
