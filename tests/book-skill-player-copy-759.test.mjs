import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(root);
const book=read('pandora-studio-hero-book.js');
const wikiUi=read('pandora-studio-app.js');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const calculator=root.PandoraOSCalculator;
test('Skill Effects has no repetitive proof disclaimer, but still keeps the calculated result',()=>{
 const section=book.slice(book.indexOf('function skillEffectsPage('),
  book.indexOf('// Remaked uses three DISTINCT source matrices'));
 assert.doesNotMatch(section,/Расчётная модель по игровым данным|не подтверждённый итоговый результат/);
 assert.doesNotMatch(section,/final speed, duration|итоговая скорость, длительность/);
 assert.match(section,/const detail=en\?/);
 assert.match(section,/Number\.isSafeInteger\(part\?\.amount\)/);
 assert.match(section,/skill\.available===true/);
});
test('OS-checked physical strike retains its actual coefficient and a short player-facing explanation',()=>{
 const model=calculator.scalingSkillPreview({skillCatalog:skills,
  jobKey:'JUGGERNAUT',level:45,
  branchMasteries:{brush:40,slash:41},
  branchCaps:classes.JUGGERNAUT.branchCaps,
  weaponKind:'1H_AXE',
  stats:{str:70,agi:45,dex:35,spi:18,int:12},
  combat:{attack:{walkingBase:190},defense:{directRaw:100},
   accuracy:{base:120},dodge:{base:90}}});
 const row=model.offense.find(x=>x.id===142002001);
 assert.equal(row?.coefficientModels?.[0]?.amount,20);
 assert.equal(row?.coefficientModels?.[0]?.labelRu,'Сила удара');
 assert.equal(row?.coefficientModels?.[0]?.labelEn,'Strike strength');
 assert.equal(row?.detailRu,'Зависит от освоенного мастерства и оружия');
 assert.equal(row?.amount,null,'Do not fabricate target damage');
});
test('Encyclopedia speaks about skill effects instead of confidence disclaimers',()=>{
 const inspect=id=>root.PandoraWikiSkillInsights.inspect({
  skillCatalog:skills,classes,id,calculator});
 const poison=inspect(220001001),song=inspect(340004001);
 assert.match(poison.notes[0].ru,/смене оружия/);
 assert.doesNotMatch(poison.notes[0].ru,/не рассчитан/);
 assert.match(song.notes[0].ru,/стихийный урон/);
 assert.match(song.notes[0].ru,/сокращающую перезарядку/);
 assert.doesNotMatch(song.notes[0].ru,/не подтвержд/);
});

test('Encyclopedia actions show no internal data-source caveat',()=>{
 assert.match(wikiUi,/Действие умения/);
 assert.doesNotMatch(wikiUi,/Это сведения из игровых файлов, а не рассчитанный урон/);
 assert.doesNotMatch(wikiUi,/правило расхода не подтверждено/);
});
