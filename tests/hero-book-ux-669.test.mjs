import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const css=read('pandora-studio-hero-book-additions.css');
const skills=JSON.parse(read('data/os/skills.json'));

test('effects use identical size-limited OS icons with visible golden frames',()=>{
 const source=book.slice(book.indexOf('function gameSkillBadge('),book.indexOf('function renderSongSkills('));
 assert.match(source,/width:26,height:26/);
 assert.match(source,/max-height:26px/);
 assert.match(css,/#stageAttributes \.stage-effect-skill-label>img/);
 assert.match(css,/border:1px solid #cf9d53!important/);
 assert.match(css,/border-radius:3px;background:#1e160e/);
});

test('Incredible Strength tells the player what it does and honestly labels unavailable figures',()=>{
 const passive=skills['910110001'];
 assert.equal(passive.name,'Невероятная сила');
 assert.equal(passive.funcs[0].ep,'EP_ONHIT_FIN_DAMAGE_CONST');
 const start=book.indexOf('const hitPassive=combat.incredibleStrength;');
 const end=book.indexOf('renderSongSkills(body,modifiers',start);
 assert.ok(start>=0&&end>start);
 const section=book.slice(start,end);
 assert.match(section,/Увеличивает урон при попадании оружием ближнего боя/);
 assert.match(section,/Точная прибавка ещё не подтверждена/);
 assert.match(section,/Exact damage is not yet confirmed/);
 assert.doesNotMatch(section.match(/addOffense\\(hitPassive[\\s\\S]*?\\);/)?.[0]||'',/серверн|формул|Remaked|current OS|server formula/i);
 assert.doesNotMatch(section,/\+10%|\+5%/);
});

test('riding setting and riding-stat percentage are co-located, never duplicated',()=>{
 const attack=book.slice(book.indexOf('function attackPage('),book.indexOf('function defensePage('));
 const group=book.slice(book.indexOf('function attackChapterGroups('),
  book.indexOf('function defenseChapterGroups('));
 assert.match(attack,/stageBookMountedToggle/);
 assert.match(attack,/class:'stage-mounted-stat','data-chapter-stat':'mountedRelease'/);
 assert.match(attack,/guideLabel\(mountedName,'attack\.mountedRelease'/);
 assert.match(attack,/Number\.isFinite\(riding\)/);
 assert.doesNotMatch(group,/put\(0,'mountedRelease'/);
 assert.match(css,/#stageAttributes \.stage-mounted-stat/);
 assert.match(css,/@media\(max-width:520px\)/);
});

test('preview-only Remaked buffs explain missing numbers without claiming they affect results',()=>{
 const start=book.indexOf('for(const row of remakedBuffRows)');
 assert.ok(start>=0);
 const tail=book.slice(start,start+2400);
 assert.match(tail,/row\.description/);
 assert.match(tail,/row\.description/);
 assert.doesNotMatch(tail,/Предпросмотр эффекта/);
});
