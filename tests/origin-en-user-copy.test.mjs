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
 assert.match(origin,/tr\('Свободно: ','Available: '\)/);
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
