import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
const worker=read('worker/index.js'),html=read('index.html');
const host={};Function('window',read('pandora-studio-honor-guide.js'))(host);
const guide=host.PandoraHonorGuide;

test('Origin copy uses existing bilingual D1 override contract with no new migration',()=>{
 const key='book.origin.raceChoose';
 assert.equal(guide.validOverride(key,JSON.stringify({ru:'Выбрать расу'})),true);
 assert.equal(guide.validOverride(key,JSON.stringify({ru:'Выбрать расу',en:'Choose a race'})),true);
 assert.equal(guide.validOverride(key,JSON.stringify({ru:' ',en:' '})),false);
 assert.equal(guide.validOverride(key,JSON.stringify({ru:'a'.repeat(361)})),false);
 const variants={['guideedit.'+key]:JSON.stringify({ru:'Выбрать расу',en:'Choose a race'})};
 assert.equal(guide.field(variants,'origin.raceChoose','Выбрать эту расу','Choose this race').ru,'Выбрать расу');
 assert.equal(guide.field(variants,'origin.raceChoose','Выбрать эту расу','Choose this race').en,'Choose a race');
 const single={['guideedit.'+key]:JSON.stringify({ru:'Выбрать расу'})};
 assert.equal(guide.field(single,'origin.raceChoose','Выбрать эту расу','Choose this race').en,'Choose this race',
  'RU does not overwrite English defaults');
 assert.ok(worker.includes('guideedit\\\\.(?:book\\\\.'),'Worker accepts existing book.* override keys');
 assert.match(app,/saveGuidePatch\('book\.origin\.'\+key,\{\[lang\]:next\}\)/);
 assert.match(app,/onFinished:/);
});

test('Origin tabs and section titles have stable copy edit targets',()=>{
 for(const id of ['heading','tabRace','tabProfession','tabStats','raceHeading','professionHeading',
  'racePrompt','passiveHeading','classCount','progressHeading','levelParameters',
  'levelHeading','baseHeading','distributeHeading'])
  assert.match(app,new RegExp("'"+id+"'"));
 for(const id of ['race','profession'])
  assert.ok(html.includes('data-origin-copy-static="'+id+'"'));
 assert.match(app,/function renderOriginCopyLabels\(\)/);
 assert.match(app,/function originCopyLabel\(/);
 assert.match(app,/function editOriginCopyLabel\(/);
 assert.match(app,/originCopyLabel\(select,chosen\?'raceChosen':'raceChoose'/);
 assert.match(app,/data-origin-edit-for/);
 assert.match(css,/\.origin-copy-pencil\{/);
 assert.match(css,/\.origin-copy-input-slot\{/);
});

test('stat hold intent is shared with Hero Book, green + and red minus',()=>{
 const stat=app.slice(app.indexOf('function renderOriginStats(){'),app.indexOf('function renderOriginPassives(){'));
 const book=app.slice(app.indexOf('function renderStats('),app.indexOf('function compareSnapshots('));
 assert.match(stat,/class:'stat-step-decrement'/);
 assert.match(stat,/class:'stat-step-increment'/);
 assert.match(book,/class:'stat-step-decrement'/);
 assert.match(book,/class:'stat-step-increment'/);
 assert.match(css,/\.origin-stat-row button\.is-repeating,\.stat-visual-controls button\.is-repeating/);
 assert.match(css,/button\.stat-step-decrement\.is-repeating/);
 assert.match(css,/background:#552a29/);
 assert.match(css,/background:#35502b/);
 assert.match(app,/setInterval\(run,85\)/);
 assert.match(app,/,340\)/);
});
