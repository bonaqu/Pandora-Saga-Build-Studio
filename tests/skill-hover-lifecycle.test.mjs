import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const controller=app.slice(app.indexOf('// One controller for all rich skill previews'),
 app.indexOf('function refreshBudgetLabel(){'));
test('skill previews have one 650ms hover policy without instant mouseenter',()=>{
 assert.match(controller,/const SKILL_PREVIEW_HOVER_DELAY_MS=650/);
 assert.match(controller,/button\.addEventListener\('pointerenter',event=>/);
 assert.match(controller,/event\.pointerType==='touch'/);
 assert.match(controller,/button\.isConnected&&button\.matches\(':hover'\)/);
 assert.match(controller,/button\.matches\(':focus-visible'\)/);
 assert.doesNotMatch(controller,/addEventListener\('mouseenter',show\)/);
});
test('rich skill preview cleans up aria and avoids dead timers when navigating',()=>{
 assert.match(controller,/window\.PandoraGuideTooltip\.unlinkDescription\(activeSkillPreviewOwner,activeSkillPreview\?\.id\)/);
 assert.match(controller,/if\(pendingSkillPreview\?\.button===button\|\|activeSkillPreviewOwner===button\)/);
 assert.match(controller,/window\.PandoraGuideTooltip\.linkDescription\(button,tip\.id\)/);
 assert.match(controller,/button\.addEventListener\('pointerleave',clear\)/);
 assert.match(controller,/button\.addEventListener\('pointerdown',clear\)/);
 assert.match(controller,/button\.addEventListener\('click',clear\)/);
 assert.match(controller,/event\.key!=='Escape'/);
 assert.match(controller,/document\.addEventListener\('scroll'/);
 assert.match(controller,/if\(document\.hidden\)dismissSkillPreview\(\)/);
 assert.match(controller,/\['blur','popstate','hashchange'\]/);
 assert.match(app,/function renderOriginPassives\(\)\{[\s\S]*?dismissSkillPreview\(\)/);
});
