import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const origin=code.slice(code.indexOf('const ORIGIN_STAT_LABELS=['),
 code.indexOf('let activeSkillPreview=null'));

test('Origin and advanced editor share canonical RU/EN stat labels',()=>{
 assert.match(origin,/name:'Проворность',nameEn:'Agility',code:'agi'/);
 assert.match(origin,/name:'Ловкость',nameEn:'Dexterity',code:'dex'/);
 assert.match(origin,/name:'Сила духа',nameEn:'Spirit',code:'spi'/);
 assert.match(code,/ORIGIN_STAT_LABELS\[i\]\.nameEn:ORIGIN_STAT_LABELS\[i\]\.name/);
 assert.match(origin,/statCaption\('remainingPrefix','Свободно:','Available:'\)/);
 assert.match(origin,/tr\('Итог','Total'\)/);
});

test('Origin and shared skill previews translate UI controls while preserving game records',()=>{
 assert.match(origin,/lang==='en'\?'✓ Selected':'✓ Выбрано'/);
 assert.match(origin,/lang==='en'\?' — selected':' — выбрано'/);
 assert.match(code,/lang==='en'\?'Level ':'Уровень '/);
 assert.match(code,/lang==='en'\?'Skill':'Умение'/);
 assert.match(origin,/Racial passives will appear when the game catalog loads/);
 assert.match(code,/const STATS=/);
});

test('class wizard screen-reader labels follow RU and EN language state',()=>{
 const start=code.indexOf('function renderJobs(){');
 const end=code.indexOf('let workbenchReturnFocus=',start);
 assert.ok(start>=0&&end>start);
 const ui=code.slice(start,end);
 for(const value of [
  "class:'class-wizard-progress','aria-label':tr('Этап выбора профессии','Class selection stages')",
  "class:'class-wizard-breadcrumbs','aria-label':tr('Вернуться на предыдущий уровень','Return to a previous class selection stage')",
  "tr(' — выбранная специализация ',' — selected specialization ')",
  "tr(' — перейти к специализациям',' — view specializations')",
  "'aria-label':node.name+choiceExplanation"
 ])assert.ok(ui.includes(value),'Missing localized accessibility text: '+value);
});
