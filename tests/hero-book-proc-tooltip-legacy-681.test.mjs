import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const book=read('pandora-studio-hero-book.js');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const skills=JSON.parse(read('data/os/skills.json'));
const C=host.PandoraOSCalculator;

test('one elemental spell does not deselect the older independent Divine Blessing alias',()=>{
 const change=app.slice(app.indexOf("}else if(key.startsWith('resistSkill:'))"),
  app.indexOf("}else if(key==='honorTitle')"));
 assert.match(change,/oldDivine=Array\.isArray\(current\.resistanceSkillIds\)/);
 assert.match(change,/current\.resistanceSkillIds\.includes\(330004001\)/);
 assert.match(change,/\.\.\.\(oldDivine\?\[330004001\]:\[\]\)/);
 assert.match(change,/\.\.\.\(value===true\?\[id\]:\[\]\)/);
 assert.doesNotMatch(change,/selected\.add\(/);
 const snapshot=C.resistanceSkillPreview({skillCatalog:skills,
  selected:[330004001,410015001]});
 assert.deepEqual(snapshot.bonuses,{magic:25,fire:-25,ice:50,lightning:-25});
 assert.equal(snapshot.rows.length,2);
});

test('item and Soul on-hit skill names are interactive rich Path skill references',()=>{
 assert.match(book,/function appendItemEvents\(body,calc,english,kind,gameTerms=\{\}\)/);
 assert.match(book,/skillId:entry\.skillId/);
 assert.match(book,/gameTerms\.skills\?\.\[String\(row\.skillId\)\]/);
 assert.match(book,/root\.PandoraSkillPreview\?\.attach\(skillLink,row\.skillId\)/);
 assert.match(book,/stage-source-proc-skill/);
 assert.match(book,/class:'stage-consumable-skill-name'/);
 assert.match(book,/appendItemEvents\(body,calc,english,'attack',options\.gameTerms\)/);
 assert.match(book,/appendItemEvents\(body,calc,english,'defense',options\.gameTerms\)/);
 // Unknown skill IDs are plain text, not incorrect or invented previews.
 assert.match(book,/if\(!valid\)\{/);
 assert.match(book,/panel\.append\(make\('p',\{text:row\.source/);
});
