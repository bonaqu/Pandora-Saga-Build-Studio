import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const level=read('pandora-studio-progression-owner-editor.js');
const styles=read('pandora-studio-progression-owner-editor.css');
const dock=read('pandora-studio-owner-dock.css');
const catalog=read('pandora-os-catalog-workbench.js');
const browser=read('tests/browser-admin-entry.mjs');

test('autofill action explains source, target, draft-only behavior and manual-entry safety',()=>{
 assert.match(level,/Заполнить пустые новые уровни/);
 assert.doesNotMatch(level,/Повторить прибавку последнего уровня/);
 assert.match(level,/const quickHint=h\('small',\{class:'ps-level-editor-fill-hint'\}\)/);
 assert.match(level,/toFill=Array\.from\(\{length:added\}/);
 assert.match(level,/\.filter\(level=>draft\.attributes\[level\]===0&&draft\.skills\[level\]===0\)/);
 assert.match(level,/if\(draft\.attributes\[i\]!==0\|\|draft\.skills\[i\]!==0\)continue/);
 assert.match(level,/quick\.disabled=saving\|\|!valid\|\|!toFill\.length/);
 assert.match(level,/Сначала увеличь максимальный уровень/);
 assert.match(level,/Это черновик/);
 assert.match(level,/scroller\.scrollTop=scroller\.scrollHeight/);
 assert.match(browser,/const fillNew=levelDialog\.getByRole/);
 assert.match(browser,/586 характеристик · 150 умений/);
});

test('progression UI distinguishes cumulative totals, discard, reset and D1 publish',()=>{
 assert.match(level,/Свободные очки характеристик, начисленные на этом уровне/);
 assert.match(level,/Всего очков умений, начисленных к этому уровню/);
 assert.match(level,/Сбрасывает только черновик этого окна/);
 assert.match(level,/удаляет личную таблицу из D1/);
 assert.match(level,/Публикует таблицу целиком после подтверждения/);
 assert.match(level,/root\.PandoraGuideTooltip\.attach\(node,message,\{hoverDelay:350\}\)/);
 assert.match(styles,/\.ps-level-editor-fill-tools/);
 assert.match(styles,/\.ps-level-editor-fill-hint/);
 assert.match(styles,/\.ps-level-editor-restore/);
 assert.match(styles,/@media\(max-width:550px\)/);
});

test('all owner commands have localized action-specific hover/focus explanations',()=>{
 for(const key of ['openWiki','undo','history','catalog','levels',
  'translations','testD1','githubExport','finish'])
  assert.match(app,new RegExp(' '+key+':\\['),'Missing help '+key);
 assert.match(app,/const ownerDockHints=Object\.freeze/);
 assert.match(app,/button\.dataset\.guideHint=ownerDockHints\[key\]/);
 assert.match(app,/pencil\.dataset\.guideHint=lang==='en'/);
 assert.match(app,/ownerDockHints\[key\]\[lang==='en'\?1:0\],\{hoverDelay:350\}/);
 assert.match(app,/Недоступно|Если правок нет/);
 assert.match(app,/Не сохраняет текущую правку и не меняет игровой каталог/);
});

test('compact admin panel and other dialogs keep semantics and safety intact',()=>{
 assert.match(app,/catalogSlot\.classList\.remove\('owner-dock-action-wide'\)/);
 assert.match(app,/englishSlot\.classList\.toggle\('owner-dock-action-wide',!translations\.hidden\)/);
 assert.match(dock,/#ownerDock \.owner-dock-actions \.owner-dock-levels/);
 assert.match(dock,/#ownerDock \.owner-dock-levels:before/);
 assert.match(app,/const restoreAction=actions\.querySelector|const reset=actions\.querySelector\('\.owner-review-reset'\)/);
 assert.match(app,/translationsSaveButton:\[/);
 assert.match(app,/githubCreateButton:\[/);
 assert.match(app,/Копия правок в GitHub \(необязательно\)/);
 assert.match(catalog,/PandoraGuideTooltip\?\.attach\(node,description,\{hoverDelay:420\}\)/);
 assert.match(app,/ownerSaveInFlight\(\)/);
 assert.match(app,/ownerCanStartAdminOperation\(\)/);
});
