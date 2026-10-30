import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('Origin has no technical disclaimers under base stat controls',()=>{
 const html=get('index.html'),css=get('style.css');
 assert.doesNotMatch(html,/Общий бюджет очков параметров ещё не подтверждён/);
 assert.doesNotMatch(html,/origin-stats-note/);
 assert.doesNotMatch(css,/\.origin-stats-note\{/);
 assert.match(html,/id="originStats"/);
});
test('detailed stat labels match compact editor while keeping save keys',()=>{
 const src=get('app.js');
 assert.match(src,/h\('h3',\{text:info\.name\}\)/);
 assert.match(src,/['\"]ОЗ ≈['\"]?\+hpmp\.hp/);
 assert.doesNotMatch(src,/Предел пока неизвестен\. Используется редактор плана/);
 assert.doesNotMatch(src,/Предварительные ОЗ ≈/);
 assert.match(src,/const STATS=\['Выносливость','Сила','Ловкость','Сноровка','Дух','Интеллект'\]/);
});
