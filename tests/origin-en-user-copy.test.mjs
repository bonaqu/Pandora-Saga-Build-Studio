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

test('class wizard screen-reader labels follow the same RU/EN owner-copy contract',()=>{
 const start=code.indexOf('function renderJobs(){');
 const end=code.indexOf('let workbenchReturnFocus=',start);
 assert.ok(start>=0&&end>start);
 const ui=code.slice(start,end);
 const source=code.match(/const originClassWizardAriaRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(source,'Six auditable original aria phrase identities are required');
 const rows=Function('return '+source[1])();
 const expected=[
  ['classStageNavAria','Этап выбора профессии','Class selection stages'],
  ['classBreadcrumbNavAria','Вернуться на предыдущий уровень','Return to a previous class selection stage'],
  ['classSelectedSpecializationAria','выбранная специализация','selected specialization'],
  ['classChosenAria','выбрано','selected'],
  ['classViewSpecializationsAria','перейти к специализациям','view specializations'],
  ['classSelectClassAria','выбрать профессию','select class']
 ];
 assert.deepEqual(rows,expected);
 assert.match(ui,/bindOwnerInterfaceText\(h\('div',\{class:'class-wizard-progress'\}\)/);
 assert.match(ui,/'origin','classStageNavAria'/);
 assert.match(ui,/'origin','classBreadcrumbNavAria'/);
 assert.match(ui,/bindOwnerInterfaceText\(choice,'origin',ariaKey,ariaRu,ariaEn,'aria-label'/);
 assert.match(ui,/selectedOnPath\?' '\+selectedProfession\.name:'',node\.name\+' — '/);
 assert.doesNotMatch(ui,/'aria-label':node\.name\+choiceExplanation/);
});

