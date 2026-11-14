import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {runIndependentSmokes} from './browser-runner.mjs';
import {runShareLinkSmoke} from './browser-share-link.mjs';
import {runBuildAuthGateSmoke} from './browser-build-auth-gate.mjs';
import {runGuestGateEditorialSmoke} from './browser-guest-gate-editorial-640.mjs';
import {runModalKeyboardSmoke} from './browser-modal-keyboard.mjs';
import {runSharedLibraryImportSmoke} from './browser-shared-library-import.mjs';
import {runSharedReceiverEditorial655Smoke} from './browser-shared-receiver-editorial-655.mjs';
import {runDraftPersistenceWarningSmoke} from './browser-draft-persistence-warning.mjs';
import {runGuestDraftContinuitySmoke} from './browser-guest-draft-continuity.mjs';
import {runLegacyImportSmoke} from './browser-legacy-import.mjs';
import {runLayoutAudit} from './browser-layout.mjs';
import {runVisualCoverageSmoke} from './browser-visual-coverage.mjs';
import {runCloudConflictSmoke} from './browser-cloud-conflict.mjs';
import {runCloudSaveFailureSmoke} from './browser-cloud-save-failure.mjs';
import {runDeletedBuildRecoverySmoke} from './browser-deleted-recovery.mjs';
import {runEquipmentEligibilitySmoke} from './browser-equipment-eligibility.mjs';
import {runEquipmentLocaleSmoke} from './browser-equipment-locale.mjs';
import {runEquippedSoulCapacitySmoke,runSavedSocketRecoverySmoke} from './browser-equipped-soul-capacity.mjs';
import {runEquipmentQuickMenuSmoke} from './browser-equipment-quick-menu.mjs';
import {runRefinementTooltipSmoke} from './browser-refinement-tooltip.mjs';
import {runItemHoverDelaySmoke} from './browser-item-hover-delay.mjs';
import {runLegacySkillCapSmoke} from './browser-legacy-skill-cap.mjs';
import {runTwoHandedSmoke} from './browser-two-handed.mjs';
import {runOutfitSoulScrollSmoke} from './browser-outfit-soul-scroll-389.mjs';
import {runFutureGearSmoke} from './browser-future-gear.mjs';
import {runSavedAutosaveSmoke} from './browser-saved-autosave.mjs';
import {runAccountSmoke} from './browser-account.mjs';
import {runAccountLocalRecoveryFailureSmoke} from './browser-account-local-recovery.mjs';
import {runAccountLateBootstrapSmoke} from './browser-account-late-bootstrap.mjs';
import {runEmptyAccountCloudReconnectSmoke} from './browser-empty-account-reconnect.mjs';
import {runAccountFeedbackRaceSmoke} from './browser-account-feedback-race.mjs';
import {runAccountLibraryIsolationSmoke} from './browser-account-isolation.mjs';
import {runCrossTabAccountIsolationSmoke} from './browser-cross-tab-account.mjs';
import {runCrossTabGuestIsolationSmoke} from './browser-cross-tab-guest.mjs';
import {runHonorGuideSmoke} from './browser-honor-guide.mjs';
import {runAdminEntrySmoke,runInlineMilestonesSmoke} from './browser-admin-entry.mjs';
import {runInnateSkillMasterySmoke} from './browser-innate-skill-mastery.mjs';
import {runHeroBookLiveRecalcSmoke} from './browser-hero-book-live-recalc.mjs';
import {runHeroBookGameNames664Smoke} from './browser-book-game-terms-664.mjs';
import {runHeroBookMonsterPicker785Smoke} from './browser-book-monsters-785.mjs';
import {runPathSkillNavigation761Smoke} from './browser-path-skill-navigation-761.mjs';
import {runRemakedBuffParity669Smoke} from './browser-remaked-buff-parity-669.mjs';
import {runOriginSharedSnapshotSmoke} from './browser-origin-shared-snapshot.mjs';
import {runBuildComparisonSmoke,runSavedBuildEnglishSmoke} from './browser-build-comparison.mjs';
import {runSavedBuildGridSmoke} from './browser-build-grid-640.mjs';
import {runOwnerBuildHints660Smoke} from './browser-build-hint-editorial-660.mjs';
import {runOwnerBuildSearch662Smoke} from './browser-build-search-editor-662.mjs';
import {runCrossSurfaceEditorial663Smoke} from './browser-cross-surface-editorial-663.mjs';
import {runEffectItemsSmoke} from './browser-effect-items.mjs';
import {runWikiSkillFiltersSmoke,runWikiIconManifestFallbackSmoke} from './browser-wiki-skill-filters.mjs';
import {runWikiMaterialLinks752Smoke} from './browser-wiki-material-links-752.mjs';
import {runWikiSkillLabelEditorSmoke} from './browser-wiki-skill-label-editor.mjs';
import {runUIContentInlineSmoke} from './browser-ui-content-inline.mjs';
import {runOwnerEquipmentInlineSmoke} from './browser-owner-equipment-inline-632.mjs';
import {runOwnerRacialPath648Smoke} from './browser-owner-racial-path-648.mjs';
import {runOwnerHistory652Smoke} from './browser-owner-history-652.mjs';
import {runOwnerDualSessionCasSmoke} from './browser-owner-dual-session-cas.mjs';
import {runWikiOwnerEnglishSyncSmoke} from './browser-wiki-owner-english-sync.mjs';
import {runWikiSpawnReplacementSmoke} from './browser-wiki-spawn-replace.mjs';
import {runChestRewardLayoutSmoke} from './browser-chest-reward.mjs';
import {runEncyclopediaPerformanceSmoke} from './browser-encyclopedia-performance.mjs';

const base='http://127.0.0.1:4173';
const argv=new Set(process.argv.slice(2));
for(const arg of argv)if(!['--quick','--serial'].includes(arg)&&
 !/^--only=[a-z0-9-]+$/.test(arg))
 throw Error('Unsupported browser test option '+arg);
const onlyOptions=[...argv].filter(arg=>arg.startsWith('--only='));
if(onlyOptions.length>1)throw Error('Only one browser scenario may be selected');
const only=onlyOptions[0]?.slice('--only='.length)||null;
const quick=argv.has('--quick'),concurrency=argv.has('--serial')?1:3;
if(only&&quick)throw Error('Single-scenario smoke cannot be combined with quick mode');
const errors=[];
const scenarios=[
  ['build-account-gate',runBuildAuthGateSmoke],
  ['guest-gate-editorial',runGuestGateEditorialSmoke],
  ['modal-keyboard',runModalKeyboardSmoke],
  ['shared-library-import',runSharedLibraryImportSmoke],
  ['shared-receiver-editorial-655',runSharedReceiverEditorial655Smoke],
  ['draft-persistence-warning',runDraftPersistenceWarningSmoke],
  ['guest-draft-continuity',runGuestDraftContinuitySmoke],
  ['legacy-build-import',runLegacyImportSmoke],
  ['share-link',runShareLinkSmoke],
  ['cloud-conflict',runCloudConflictSmoke],
  ['cloud-save-failure',runCloudSaveFailureSmoke],
  ['deleted-build-recovery',runDeletedBuildRecoverySmoke],
  ['equipment-eligibility',runEquipmentEligibilitySmoke],
  ['equipment-locale',runEquipmentLocaleSmoke],
  ['per-item-soul-capacity',runEquippedSoulCapacitySmoke],
  ['equipment-quick-menu',runEquipmentQuickMenuSmoke],
  ['saved-copy-socket-recovery',runSavedSocketRecoverySmoke],
  ['equipment-forge-bonuses',runRefinementTooltipSmoke],
  ['item-preview-delay',runItemHoverDelaySmoke],
  ['legacy-class-cap',runLegacySkillCapSmoke],
  ['innate-l1-mastery',runInnateSkillMasterySmoke],
  ['hero-book-live-recalc',runHeroBookLiveRecalcSmoke],
  ['hero-book-game-terms-664',runHeroBookGameNames664Smoke],
  ['hero-book-monsters-785',runHeroBookMonsterPicker785Smoke],
  ['path-skill-navigation-761',runPathSkillNavigation761Smoke],
  ['wiki-material-recipe-links-752',runWikiMaterialLinks752Smoke],
  ['remaked-buff-parity-669',runRemakedBuffParity669Smoke],
  ['origin-shared-snapshot',runOriginSharedSnapshotSmoke],
  ['two-handed-gear',runTwoHandedSmoke],
  ['one-piece-outfit-and-soul-scroll',runOutfitSoulScrollSmoke],
  ['future-level-gear',runFutureGearSmoke],
  ['manual-saved-overwrite',runSavedAutosaveSmoke],
  ['account-login',runAccountSmoke],
  ['account-local-recovery',runAccountLocalRecoveryFailureSmoke],
  ['account-late-bootstrap',runAccountLateBootstrapSmoke],
  ['empty-account-reconnect',runEmptyAccountCloudReconnectSmoke],
  ['account-feedback-race',runAccountFeedbackRaceSmoke],
  ['account-isolation',runAccountLibraryIsolationSmoke],
  ['cross-tab-account',runCrossTabAccountIsolationSmoke],
  ['cross-tab-guest',runCrossTabGuestIsolationSmoke],
  ['honor-guide',runHonorGuideSmoke],
  ['saved-build-card-grid',runSavedBuildGridSmoke],
  ['owner-build-hint-edit-660',runOwnerBuildHints660Smoke],
  ['owner-build-search-662',runOwnerBuildSearch662Smoke],
  ['cross-surface-editorial-663',runCrossSurfaceEditorial663Smoke],
  ['build-comparison',runBuildComparisonSmoke],
  ['saved-builds-english',runSavedBuildEnglishSmoke],
  ['effect-items',runEffectItemsSmoke],
  ['wiki-skill-filters',runWikiSkillFiltersSmoke],
  ['wiki-skill-label-editor',runWikiSkillLabelEditorSmoke],
  ['ui-content-inline',runUIContentInlineSmoke],
  ['owner-equipment-copy-width',runOwnerEquipmentInlineSmoke],
  ['owner-racial-path-648',runOwnerRacialPath648Smoke],
  ['owner-history-652',runOwnerHistory652Smoke],
  ['owner-two-session-cas',runOwnerDualSessionCasSmoke],
  ['site-visual-coverage',runVisualCoverageSmoke],
  ['wiki-owner-english-sync',runWikiOwnerEnglishSyncSmoke],
  ['wiki-spawn-replace',runWikiSpawnReplacementSmoke],
  ['wiki-icons-offline',runWikiIconManifestFallbackSmoke],
  ['chest-reward-layout',runChestRewardLayoutSmoke],
  ['hidden-admin-entry',runAdminEntrySmoke],
  ['inline-skill-milestones',runInlineMilestonesSmoke]
 ];
let browser;
async function main(){
 browser=await chromium.launch({headless:true});
 if(only){
  const found=scenarios.filter(([name])=>name===only);
  if(found.length!==1)throw Error('Unknown browser scenario '+only);
  await runIndependentSmokes(found,browser,base,{concurrency:1});
  console.log('Targeted Chromium scenario passed: '+only+
   ' (manual diagnosis only; does not replace full PR acceptance)');
  return;
 }
 const context=await browser.newContext({viewport:{width:1365,height:850}});
 // Test the bundled OS snapshot, not remote Cloudflare or third-party services.
 await context.route('**/*',route=>{
  if(route.request().url().startsWith(base+'/'))return route.continue();
  return route.abort();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});
 const failedRequests=[];
 page.on('requestfailed',request=>{
  if(request.url().startsWith(base+'/'))failedRequests.push(request.url());
 });
 try{
  await page.waitForFunction(()=>
   document.querySelector('#raceGrid')?.children.length>0 &&
   document.querySelector('#hero')?.getAttribute('src'),
   null,{timeout:20000});
 }catch(error){
  const state=await page.evaluate(()=>({
   ready:document.readyState,
   raceCount:document.querySelector('#raceGrid')?.children.length,
   branchCount:document.querySelector('#skillBranches')?.children.length,
   catalog:document.querySelector('#catalogStatus')?.textContent,
   notice:document.querySelector('#siteNotice')?.textContent,
   headline:document.body?.innerText?.slice(0,300)
  }));
  throw Error('Editor bootstrap failed: '+JSON.stringify({state,errors,failedRequests})+'; '+error.message);
 }
 assert.equal(await page.locator('#levelOut').textContent(),'1');
 assert.equal(await page.locator('#level').getAttribute('max'),'55');
 assert.equal(await page.locator('#stageAttributes').isHidden(),true);
 assert.match(await page.locator('#raceGrid .race-slide-select').innerText(),/Выбрать эту расу/);
 assert.equal(await page.locator('#classGrid .class-wizard-selected').count(),0);
 assert.match(await page.locator('#activeJob').innerText(),/Выберите профессию/);
 assert.match(await page.locator('#originStatSummary').innerText(),/Бюджет уровня: 0/);
 // Select the same Elf/Cleric fixture explicitly; the fresh hero no longer
 // silently commits either choice on initial load.
 for(let i=0;i<3;i++)await page.locator('#raceGrid .race-slide-arrow.next').click();
 await page.locator('#raceGrid .race-slide-select').click();
 await page.locator('[data-origin-tab="class"]').click();
 await page.locator('#classGrid .class-wizard-choice').nth(2).click(); // Acolyte
 await page.locator('#classGrid .class-wizard-choice').first().click(); // Priest
 await page.locator('#classGrid .class-wizard-choice').first().click(); // Cleric
 assert.equal(await page.locator('#classGrid .class-current-select.selected').count(),1);
 assert.equal(await page.locator('#classGrid .class-wizard-step.selected').count(),1);
 assert.match(await page.locator('#classGrid .class-current-select').innerText(),/✓/);

 // A public player sees just the disclosure, not the admin editor button.
 const firstPathHead=page.locator('.right .game-tree-head-row').first();
 await firstPathHead.waitFor({state:'visible'});
 assert.equal(await firstPathHead.locator(':scope > button.game-tree-head').count(),1);
 assert.equal(await firstPathHead.locator(':scope > button.path-group-pencil').count(),0);
 // The portrait itself opens the book; chapter navigation supports the keyboard.
 await page.locator('#hero').click();
 await page.locator('#stageAttributes').waitFor({state:'visible'});
 // Elf's first passive reduces mana spending by 15%; test the full live
 // interaction (race control -> canonical passive -> calculator -> Hero Book).
 const manaRow=page.locator('#stageBookPanel .stage-result-tile').filter({hasText:'Расход ОМ'});
 const manaBefore=Number((await manaRow.locator('strong').innerText()).replace('%','').trim());
 assert.ok(Number.isFinite(manaBefore),'MP cost must be calculated for a selected origin');
 await page.locator('#stageAttributes .stage-book-close').click();
 await page.locator('[data-origin-tab="race"]').click();
 // Rich skill previews follow the shared delayed hover policy.
 const firstPassive=page.locator('#originPassives .origin-passive').first();
 const secondPassive=page.locator('#originPassives .origin-passive').nth(1);
 const skillPreview=page.locator('#path-skill-hover-tooltip');
 await page.mouse.move(1,1);
 await firstPassive.hover();
 await page.waitForTimeout(140);
 assert.equal(await skillPreview.count(),0,'Rich skill preview opened immediately on pointer hover');
 await skillPreview.waitFor({state:'visible',timeout:2500});
 assert.equal(await firstPassive.getAttribute('aria-describedby'),'path-skill-hover-tooltip');
 await secondPassive.hover();
 assert.equal(await firstPassive.getAttribute('aria-describedby'),null,
  'Switching skills must clear the previous owner\'s tooltip relationship');
 assert.equal(await skillPreview.count(),0,'Previous skill must close before next delayed preview');
 await skillPreview.waitFor({state:'visible',timeout:2500});
 assert.equal(await secondPassive.getAttribute('aria-describedby'),'path-skill-hover-tooltip');
 await page.mouse.move(1,1);
 assert.equal(await skillPreview.count(),0);
 await firstPassive.hover();
 await page.waitForTimeout(90);
 await page.mouse.move(1,1);
 await page.waitForTimeout(740);
 assert.equal(await skillPreview.count(),0,'Cancelled skill hover must not reopen after leaving');
 await firstPassive.click();
 assert.equal(await page.locator('#originPassives .origin-passive.selected').count(),1);
 await page.locator('#hero').click();
 await page.locator('#stageAttributes').waitFor({state:'visible'});
 const manaAfter=Number((await manaRow.locator('strong').innerText()).replace('%','').trim());
 assert.equal(manaAfter,manaBefore-15,'Selected Elf passive must change the Hero Book MP cost');
 assert.equal(await page.locator('#stageAttributes [data-book-page]').count(),6);
 // Headings are not controls and must not offer generic editor tooltips.
 assert.equal(await page.locator('#stageAttributes .stage-book-heading .stage-guide-label').count(),0);
 assert.equal(await page.locator('#stageBookPanel .stage-result-section-head .stage-guide-label').count(),0);
 assert.equal(await page.locator('#stageBookPanel .stage-result-intro .stage-guide-label').count(),0);
 const groupHeading=page.locator('#stageBookPanel .stage-result-section-head strong').first();
 assert.equal(await groupHeading.evaluate(el=>getComputedStyle(el).textDecorationLine),'none');
 await groupHeading.hover();
 assert.equal(await page.locator('#stage-guide-tooltip').isVisible(),false,
  'Group heading must not display placeholder help');
 const guideLabels=page.locator('#stageBookPanel [data-guide-key^="summary."]');
 assert.equal(await guideLabels.count(),47,'43 result hints and four group headers (duplicate caption removed)');
 const firstGuide=page.locator('#stageBookPanel [data-guide-key="summary.0"]');
 await firstGuide.hover();
 // Scroll can move the element out from under a real pointer. Re-hover after
 // the scroll to assert the tooltip is still available, not that an old
 // hover session survives an unrelated mouseleave.
 await page.locator('#stageBookPanel').evaluate(node=>{node.scrollTop+=1});
 await firstGuide.hover();
 await page.locator('#stage-guide-tooltip').waitFor({state:'visible',timeout:4000});
 assert.match(await page.locator('#stage-guide-tooltip').innerText(),/Очки здоровья/);
 await page.locator('#stageBookPanel [data-guide-key="summary.23"]').hover();
 await page.locator('#stage-guide-tooltip').waitFor({state:'visible',timeout:3000});
 assert.match(await page.locator('#stage-guide-tooltip').innerText(),/атак в спину/);
 await page.locator('#stageBookPanel [data-guide-key="summary.23"]').focus();
 assert.equal(await page.locator('#stage-guide-tooltip').isVisible(),true);
 await page.locator('#stageBookPanel [data-guide-key="summary.23"]').press('Escape');
 assert.equal(await page.locator('#stage-guide-tooltip').isHidden(),true);
 await page.locator('#stageAttributes [data-book-page="attack"]').click();
 assert.equal(await page.locator('#stageBookPanel').getAttribute('data-book-visible'),'attack');
 assert.equal(await page.locator('#stageBookPanel .stage-result-tile').count(),0,
  'Attack chapter must not repeat any of the 43 calculated results');
 assert.equal(await page.locator('#stageBookPanel [data-chapter-stat="weaponPhysical"]').count(),0,
  'Old passive +1 must not be presented as physical attack of the equipped weapon');
 assert.equal(await page.locator('#stageBookPanel [data-chapter-stat="weaponBase"]').count(),0,
  'An unarmed hero has no equipped weapon W to display');
 assert.equal(await page.locator('#stageBookPanel [data-chapter-group] > strong.stage-guide-label').count(),0);
 const mount=page.locator('#stageBookPanel [data-book-setting="mounted"]');
 assert.equal(await mount.count(),1,'The riding switch must be available on Attack');
 const mountedText=page.locator('#stageBookPanel [data-guide-key="attack.mountedToggle"]');
 assert.equal((await mountedText.innerText()).trim(),'Верхом');
 const visibleMountedHint=await mountedText.getAttribute('data-guide-hint');
 assert.match(visibleMountedHint||'',/сражается верхом/);
 const mountedRate=page.locator('#stageBookPanel .stage-mounted-toggle .stage-mounted-percent');
 assert.match((await mountedRate.innerText()).trim(),/^\d+(?:[,.]\d+)?%$/,
  'Mounted attributes percentage must share the switch row');
 assert.equal(await page.locator('#stageBookPanel .stage-chapter-entry[data-chapter-stat="mountedRelease"]').count(),0,
  'Mounted percentage should not be repeated in a distant Attack card');
 // The prior chapter's test scrolled its 43 results; begin the new page at
 // its top, then let the chapter entrance animation settle before hover.
 await page.locator('#stageBookPanel').evaluate(el=>{el.scrollTop=0});
 await page.waitForTimeout(350);
 await mountedText.hover();
 await page.waitForTimeout(850);
 const mountedHoverProbe=await mountedText.evaluate(el=>({hover:el.matches(':hover'),
  connected:el.isConnected,tag:el.tagName,rect:el.getBoundingClientRect().toJSON()}));
 assert.equal(await page.locator('#stage-guide-tooltip').isVisible(),true,
  'Mounted tooltip should open on pointer hover: '+JSON.stringify(mountedHoverProbe));
 assert.match(await page.locator('#stage-guide-tooltip').innerText(),/сражается верхом/);
 await page.locator('#stage-guide-tooltip').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
 assert.equal(await page.locator('#stageBookPanel .stage-mounted-note').count(),0,
  'The hover explanation must not occupy a permanent paragraph');
 assert.equal(await mount.isChecked(),false);
 await mount.check();
 assert.equal(await mount.isChecked(),true,'Mounted mode must survive live rerender');
 await page.locator('#stageAttributes [data-book-page="summary"]').click();
 assert.equal(await page.locator('#stageBookPanel .stage-mounted-note').count(),0);
 await page.locator('#stageAttributes [data-book-page="defense"]').click();
 assert.equal(await page.locator('#stageBookPanel .stage-mounted-note').count(),0);
 await page.locator('#stageAttributes [data-book-page="attack"]').click();
 assert.equal(await mount.isChecked(),true);
 await mount.uncheck();
 assert.equal(await mount.isChecked(),false,'On-foot mode must be restorable');
 assert.equal(await page.locator('#stageBookPanel .stage-combat-quick').count(),0);
 const elemental=page.locator('#stageBookPanel .stage-active-elemental');
 assert.equal(await elemental.count(),1,'The elemental-weapon chapter stays discoverable');
 assert.equal((await elemental.locator('summary').innerText()).replace(/\s+/g,' ').trim(),
  '✦ Эффекты стихийных оружий ⌄');
 assert.equal(await elemental.locator('summary .stage-result-chevron').count(),1);
 await page.locator('#stageAttributes [data-book-page="attack"]').press('ArrowRight');
 assert.equal(await page.locator('#stageBookPanel').getAttribute('data-book-visible'),'defense');
  assert.equal(await page.locator('#stageBookPanel .stage-result-tile').count(),0,
  'Defense chapter must not repeat calculated DEF or evasion');
 assert.equal(await page.locator('#stageBookPanel [data-chapter-stat="hpRecoveryAmount"]').count(),1);
 const exp=page.locator('#stageBookPanel .stage-experience-effects');
 assert.equal(await exp.count(),1,
  'Experience-bonus chapter MUST be present even without any active bonus');
 const xpHeader=exp.locator('summary');
 assert.equal((await xpHeader.innerText()).replace(/\s+/g,' ').trim(),'✦ Бонусы к опыту ⌄');
 assert.equal(await xpHeader.locator('.stage-result-chevron').count(),1);
 await xpHeader.click();
 assert.ok((await exp.innerText()).includes('бонусов к опыту'));
 const recoveryHelp=page.locator('#stageBookPanel [data-guide-key="defense.hpRecoverySpeed"]');
 assert.equal(await recoveryHelp.count(),1);
 await recoveryHelp.hover();
 await page.locator('#stage-guide-tooltip').waitFor({state:'visible',timeout:4000});
 assert.match(await page.locator('#stage-guide-tooltip').innerText(),/индекс скорости восстановления/);
 await page.locator('#stageAttributes [data-book-page="effects"]').click();
 const encyclopediaOnly=page.locator('#stageBookPanel '+
  '.stage-skill-chain-effects, #stageBookPanel .stage-skill-onhit-effects, '+
  '#stageBookPanel .stage-skill-crafting-effects, #stageBookPanel .stage-skill-trap-costs, '+
  '#stageBookPanel .stage-skill-combat-technique, #stageBookPanel .stage-skill-specialized-magic, '+
  '#stageBookPanel .stage-skill-support-effects, #stageBookPanel .stage-skill-situational-other');
 assert.equal(await encyclopediaOnly.count(),0,
  'The Hero Book must show build calculations, not encyclopedic source lists');
 assert.equal(await page.locator('#stageBookPanel input[type="checkbox"]').count(),0,
  'Read-only skill calculations must not silently activate buffs');
 const actualEffects=page.locator('#stageBookPanel .stage-attacking-skills .stage-heal-row,'+
  '#stageBookPanel .stage-defensive-skills .stage-heal-row,'+
  '#stageBookPanel .stage-healing-spells:not(.stage-movement-skills) .stage-heal-row');
 const count=await actualEffects.count();
 if(count){
  assert.ok(await actualEffects.first().locator('.stage-effect-skill-label').count()>0,
   'A computed skill row must retain its canonical game identity and tooltip');
 }else{
  assert.match(await page.locator('#stageBookPanel').innerText(),
   /У текущего билда нет рассчитанных эффектов умений/);
 }
  await page.locator('#stageAttributes [data-book-page="recovery"]').click();
 await page.locator('#stageAttributes .stage-mana-consumables').waitFor({state:'visible',timeout:20000});
 assert.equal(await page.locator('#stageAttributes .stage-mana-consumables').getAttribute('open'),null,
  'All Potion Effects start collapsed');
 await page.locator('#stageAttributes .stage-mana-consumables summary').click();
 assert.match(await page.locator('#stageAttributes .stage-mana-consumables').innerText(),/Легкое восстанавливающее зелье/);
 assert.match(await page.locator('#stageAttributes .stage-mana-consumables').innerText(),/ОМ/);
 const hpOnly=page.locator('#stageAttributes .stage-health-consumables');
 await hpOnly.waitFor({state:'visible',timeout:20000});
 const healthHeading=hpOnly.locator('summary');
 assert.equal((await healthHeading.innerText()).replace(/\s+/g,' ').trim(),'✦ Предметы восстановления ОЗ ⌄');
 assert.equal(await healthHeading.locator('.stage-result-chevron').count(),1);
 await healthHeading.click();
 assert.equal(await hpOnly.locator('.stage-potion-item').count(),12);
 assert.match(await hpOnly.innerText(),/Легкое исцеляющее зелье/);
 const statusCures=page.locator('#stageAttributes .stage-status-cures');
 await statusCures.waitFor({state:'visible',timeout:20000});
 const cureHeader=statusCures.locator('summary');
 assert.equal((await cureHeader.innerText()).replace(/\s+/g,' ').trim(),'✦ Снятие состояний ⌄');
 await cureHeader.click();
 assert.equal(await statusCures.locator('.stage-potion-item').count(),10);
  assert.match(await statusCures.innerText(),/Чудесное зелье/);
 assert.match(await statusCures.innerText(),/Панацея/);
 assert.match(await statusCures.innerText(),/Противоядие/);
 const skillItems=page.locator('#stageAttributes .stage-consumable-skills');
 assert.equal(await skillItems.count(),1);
 assert.equal((await skillItems.locator('summary').innerText()).replace(/\s+/g,' ').trim(),
  '✦ Предметы, активирующие умения ⌄');
 assert.equal(await skillItems.locator('summary .stage-result-chevron').count(),1);
 await skillItems.locator('summary').click();
 const skillHint=skillItems.locator('[data-triggered-skill-id]').first();
 assert.ok(await skillHint.count()>0,'Each triggered skill has a dedicated hover target');
 const itemOpener=skillItems.locator('button.stage-potion-source').first();
 assert.ok(await itemOpener.count()>0,'Item navigation must remain a separate button');
 assert.equal(await skillHint.evaluate(node=>node.closest('button')===null),true,
  'Skill tooltip target must not be nested inside the item navigation button');
 await skillHint.click();
 assert.equal(await skillItems.count(),1,
  'Clicking a skill reference must not navigate to the consumable item');
 await skillHint.hover();
 const richPotionSkill=page.locator('#path-skill-hover-tooltip');
 await richPotionSkill.waitFor({state:'visible',timeout:5000});
 assert.equal(await richPotionSkill.locator('.path-skill-preview-item').count(),1,
  'Potion-triggered skills reuse the same Path skill preview');
 assert.ok(await richPotionSkill.locator('strong').first().innerText(),
  'The rich skill tooltip must contain the original game skill name');
 assert.equal(await richPotionSkill.locator('img').count(),1,
  'A skill tooltip includes its original game icon');
 await page.locator('#stageAttributes .stage-consumable-skills summary').hover();
 assert.equal(await page.locator('#stageAttributes .stage-result-tile').count(),0,
  'Potion effects do not repeat potion-effectiveness total');
 await page.locator('#stageAttributes [data-book-page="effects"]').click();
 assert.equal(await page.locator('#stageBookPanel .stage-status-cures').count(),0);
 assert.equal(await page.locator('#stageBookPanel .stage-consumable-skills').count(),0);
 await page.locator('#stageAttributes .stage-book-close').click();
 assert.equal(await page.locator('#stageAttributes').isHidden(),true);

 // Switching site language must translate Hero Book navigation, accessibility
 // and summary without touching player-defined names or OS item IDs.
 await page.locator('#locale [data-locale="en"]').click();
 await page.locator('#locale [data-locale="en"][aria-pressed="true"]').waitFor({state:'visible'});
 assert.match(await page.locator('#catalogStatus').innerText(),
  /^Encyclopedia: \d+ skills · \d+ items · \d+ souls$/);
 // The class wizard's accessible names follow the selected language too.
 await page.locator('[data-origin-tab="class"]').click();
 assert.equal(await page.locator('#classGrid .class-wizard-progress').getAttribute('aria-label'),
  'Class selection stages');
 const classCrumbs=page.locator('#classGrid .class-wizard-breadcrumbs');
 await classCrumbs.waitFor({state:'visible'});
 assert.equal(await classCrumbs.getAttribute('aria-label'),
  'Return to a previous class selection stage');
 await classCrumbs.locator('button').first().click();
 const enChoices=await page.locator('#classGrid .class-wizard-choice').evaluateAll(
  nodes=>nodes.map(node=>node.getAttribute('aria-label')));
 assert.ok(enChoices.length>=4,'The class wizard must offer game class routes');
 assert.ok(enChoices.some(label=>label.includes('selected specialization')));
 assert.ok(enChoices.some(label=>label.includes('view specializations')));
 assert.equal(enChoices.some(label=>/выбран|специализац|профессию/.test(label)),false,
  'English class accessible names must not mix languages');
 // The Origin area and selected racial passive stay readable in English.
 await page.locator('[data-origin-tab="stats"]').click();
 assert.match(await page.locator('#originStatSummary').innerText(),/Available: 0 \/ 0 · Spent: 0/);
 const enAgility=page.locator('#originStats .origin-stat-row').nth(2);
 assert.match(await enAgility.locator('.origin-stat-title').innerText(),/AGI[\s\S]*Agility/);
 assert.match(await enAgility.locator('.origin-stat-result small').innerText(),/Total|bonus/);
 assert.match(await enAgility.locator('.origin-stat-input').getAttribute('aria-label'),/Agility.*excluding equipment/);
 assert.match(await enAgility.locator('.stat-step-increment').getAttribute('aria-label'),/Increase Agility/);
 await page.locator('[data-origin-tab="race"]').click();
 assert.match(await page.locator('#originPassives .origin-passive.selected small').innerText(),/Selected/);
 assert.match(await page.locator('#originPassives .origin-passive.selected').getAttribute('aria-label'),/selected/);
 await page.locator('#hero').click();
 await page.locator('#stageAttributes [data-book-page="summary"]').waitFor({state:'visible'});
 assert.equal((await page.locator('#stageBookPanel').innerText()).includes('Vitals and recovery'),true);
 assert.equal(await page.locator('#stageBookPanel .stage-result-intro').count(),0);
 assert.equal(await page.locator('#stageBookPanel .stage-result-tile').count(),43);
 assert.equal(await page.locator('#stageBookPanel .stage-result-section-head button').count(),0);
 assert.equal((await page.locator('#stageAttributes [data-book-page="recovery"]').innerText()).trim(),'Potion effects');
 assert.match(await page.locator('#stageAttributes').getAttribute('aria-label'),/Hero Book.*Chapter 1 of 6/);
 assert.equal(await page.locator('#stageAttributes .stage-book-arrow').first().getAttribute('aria-label'),'Previous page');
 assert.equal(await page.locator('#stageAttributes .stage-book-close').getAttribute('aria-label'),'Return to portrait');
 await page.locator('#stageAttributes [data-book-page="buffs"]').click();
 assert.equal((await page.locator('#stageBookPanel').innerText()).includes('Settings apply to this build'),false,
  'Buffs no longer show the redundant introductory sentence');
 assert.ok((await page.locator('#stageBookPanel').innerText()).includes('Guild'));
 assert.equal(await page.locator('#stageBookPanel .stage-honor-term').innerText(),'passive skill');
 assert.equal(await page.locator('#stageBookPanel .stage-book-honor-link').count(),0);
 assert.equal((await page.locator('#stageBookPanel').innerText()).includes('129,000'),false);
 const guildDisclosure=page.locator('#stageBookPanel [data-book-section="guild"]');
 assert.equal(await guildDisclosure.getAttribute('open'),null,
  'Guild starts closed when opening the Buffs chapter');
 await guildDisclosure.locator('summary').click();
 const oldScroll=await page.locator('#stageBookPanel').evaluate(panel=>{
  window.__psBookStablePanel=panel;panel.scrollTop=90;return panel.scrollTop;
 });
 const guildManual=page.locator('#stageBookPanel .stage-guild-passives [data-book-setting]');
 assert.equal(await guildManual.count(),7,
  'Manual guild selection must expose all seven independent passives');
 const icons=page.locator('#stageBookPanel .stage-guild-skill-field > img.stage-guild-skill-icon');
 assert.ok(await icons.count()>=7,'Manual guild skills and leaders show original skill artwork');
 const iconBounds=await icons.first().evaluate(node=>{
  const box=node.getBoundingClientRect();return {width:box.width,height:box.height}
 });
 assert.ok(iconBounds.width>=29&&iconBounds.width<=31&&
  iconBounds.height>=29&&iconBounds.height<=31,
  'Guild skill image must never stretch beyond 30x30px: '+JSON.stringify(iconBounds));
 const preManualCount=Number(await page.locator('#stageBookPanel .stage-buff-overview>strong').innerText());
 await page.locator('#stageBookPanel [data-book-setting="guildPhysicalReduction"]').selectOption('2');
 await page.locator('#stageBookPanel [data-book-setting="guildMagicReduction"]').selectOption('2');
 await page.locator('#stageBookPanel [data-book-setting="guildExperience"]').selectOption('5');
 assert.equal(Number(await page.locator('#stageBookPanel .stage-buff-overview>strong').innerText()),
  preManualCount+3,'All three manually enabled guild passives must count separately');
  await page.locator('#stageBookPanel [data-book-setting="guildAll"]').selectOption('1');
 assert.equal(await page.locator('#stageBookPanel').evaluate(panel=>
  panel===window.__psBookStablePanel),true,
  'Changing guild settings must not remount the entire scrolling Hero Book');
 assert.equal(await page.locator('#stageBookPanel').evaluate(panel=>panel.scrollTop),oldScroll);
 await page.locator('#stageBookPanel [data-book-setting="guildLevel"]').selectOption('10');
 const guildPassives=page.locator('#stageBookPanel .stage-guild-passive-row');
 assert.equal(await guildPassives.count(),7,'Guild Lv.10 grants seven individual passive effects');
 assert.match(await guildPassives.first().innerText(),/12%/);
 assert.match(await guildPassives.first().innerText(),/Сила гильдии V|Reveille Lv5/,
  'Automatic guild passive title must include its canonical Roman rank');
 assert.match(await guildPassives.last().innerText(),/V|Lv5/,
  'Experience passive also displays its original source rank');
 assert.equal(await page.locator('#stageBookPanel .stage-guild-actives [data-book-setting="guildAll"]').count(),1);
 assert.equal(await page.locator('#stageBookPanel .stage-guild-actives [data-book-setting="guildArouse"]').count(),1);
 await page.locator('#stageBookPanel [data-book-setting="priestEnabled"]').check();
 const priestRows=page.locator('#stageBookPanel .stage-legacy-buff-row');
 if(await priestRows.count()){
  assert.equal(await priestRows.first().getAttribute('title'),null,
   'Priest effects explain themselves without browser-native titles');
  assert.equal(await priestRows.first().locator('.stage-legacy-buff-copy small').count(),1);
 }
 for(const [key,value] of [['priestSpi','134'],['priestBlessing','90'],['priestHymn','30']]){
  const control=page.locator('#stageBookPanel [data-book-setting="'+key+'"]');
  await control.fill(value);
  await control.press('Tab');
 }
 await page.locator('#stageBookPanel [data-book-setting="priestGratia"]').check();
 await page.locator('#stageBookPanel [data-book-setting="priestLapisMedio"]').check();
 assert.equal(await page.locator('#stageBookPanel [data-book-setting="priestSpi"]').inputValue(),'134');
 assert.equal(await page.locator('#stageBookPanel [data-book-setting="priestBlessing"]').inputValue(),'90');
 assert.equal(await page.locator('#stageBookPanel [data-book-setting="priestHymn"]').inputValue(),'30');
 // The priest magnitude now belongs under each actual skill name;
 // the historical duplicate potency accordion must not come back.
 assert.equal(await page.locator('#stageBookPanel .stage-legacy-buff-previews').count(),0);
 const priestSkillLine=async key=>page.locator(
  '#stageBookPanel [data-book-setting="'+key+'"]')
  .locator('xpath=ancestor::*[contains(@class,"stage-combat-buff")][1]')
  .innerText();
 assert.match(await priestSkillLine('priestGratia'),/Attack speed \+22|Скорость атаки \+22/);
 assert.match(await priestSkillLine('priestLapisMedio'),/Defense \+12|Защита \+12/);
 // The allied ENCHANTER only needs inputs that change the effect amount.
 assert.equal(await page.locator('#stageBookPanel [data-book-section="priest"] .stage-priest-fields input').count(),3);
 assert.equal(await page.locator('#stageBookPanel [data-book-setting="priestExorcism"]').count(),0);
 assert.equal(await page.locator('#stageBookPanel [data-book-setting="priestBenevolence"]').count(),0);
 assert.equal(await page.locator('#stageBookPanel [data-book-setting="priestClass"]').count(),0);
 assert.equal(await page.locator('#stageBookPanel [data-book-setting="legacySkill:340003001"]').count(),1);
 assert.equal(await page.locator('#stageBookPanel .stage-ally-peace-fields').count(),0);
 assert.equal(await page.locator('#stageBookPanel [data-book-setting^="caster-priest"]').count(),0);
 assert.equal(await page.locator('#stageBookPanel .stage-ally-skill-row').count(),0);
 await page.locator('#stageBookPanel [data-book-setting="priestBlessing"]').fill('79');
 await page.locator('#stageBookPanel [data-book-setting="priestBlessing"]').press('Tab');
 assert.match(await priestSkillLine('priestGratia'),/Attack speed \+21|Скорость атаки \+21/);
 await page.locator('#stageBookPanel [data-book-setting="priestBlessing"]').fill('90');
 await page.locator('#stageBookPanel [data-book-setting="priestBlessing"]').press('Tab');
 await page.locator('#stageBookPanel [data-book-setting="priestSpi"]').fill('140');
 await page.locator('#stageBookPanel [data-book-setting="priestSpi"]').press('Tab');
 assert.match(await priestSkillLine('priestGratia'),/Attack speed \+23|Скорость атаки \+23/);
 await page.locator('#stageBookPanel [data-book-setting="priestSpi"]').fill('134');
 await page.locator('#stageBookPanel [data-book-setting="priestSpi"]').press('Tab');
 // Peace Song is an independent Cleric buff, even with priest disabled.
 const priestSection=page.locator('#stageBookPanel [data-book-section="priest"]');
 await priestSection.locator('[data-book-setting="legacySkill:330051001"]').check();
 assert.equal(await page.locator('#stageBookPanel [data-book-setting="priestExorcism"]').count(),0);
 await page.locator('#stageBookPanel [data-book-setting="priestEnabled"]').uncheck();
 const allySection=page.locator('#stageBookPanel [data-guide-key="buffs.section.party"]').locator('xpath=ancestor::*[contains(@class,"stage-book-buff-group")][1]');
 if(await allySection.getAttribute('open')===null)
  await allySection.locator('summary').click();
 const peaceSwitch=allySection.locator('[data-book-setting="legacySkill:340003001"]');
 assert.equal(await peaceSwitch.count(),1);
 await peaceSwitch.check();
 assert.equal(await allySection.locator('.stage-ally-peace-fields input').count(),2);
 assert.equal(await allySection.locator('[data-book-setting="allyPeaceHymn"]').getAttribute('min'),'30');
 assert.equal(await allySection.locator('[data-book-setting="allyPeaceHymn"]').getAttribute('max'),'45');
 assert.match(await allySection.innerText(),/Порог защищённого удара: 99|Protected-hit threshold: 99/);
 await allySection.locator('[data-book-setting="allyPeaceSpi"]').fill('135');
 await allySection.locator('[data-book-setting="allyPeaceSpi"]').press('Tab');
 assert.match(await allySection.innerText(),/Порог защищённого удара: 100|Protected-hit threshold: 100/);
 await allySection.locator('[data-book-setting="allyPeaceHymn"]').fill('99');
 await allySection.locator('[data-book-setting="allyPeaceHymn"]').press('Tab');
 assert.equal(await allySection.locator('[data-book-setting="allyPeaceHymn"]').inputValue(),'45');
 await allySection.locator('[data-book-setting="legacySkill:340003001"]').uncheck();
 assert.equal(await allySection.locator('.stage-ally-peace-fields').count(),0);
 // Other allied casting statistics are hypothetical inputs, not extra buffs.
 const beforeNatural=Number(await page.locator(
  '#stageBookPanel .stage-buff-overview>strong').innerText());
 const naturalSwitch=allySection.locator(
  '[data-book-setting="legacySkill:330005001"]');
 assert.equal(await allySection.locator('[data-book-setting="allyNaturalLevel"]').count(),0);
 await naturalSwitch.check();
 const naturalInput=allySection.locator('[data-book-setting="allyNaturalLevel"]');
 assert.equal(await naturalInput.count(),1);
 assert.equal(await naturalInput.getAttribute('min'),'20');
 assert.equal(await naturalInput.getAttribute('max'),'55');
 assert.equal(Number(await page.locator(
  '#stageBookPanel .stage-buff-overview>strong').innerText()),beforeNatural+1,
  'Input defaults must never count as two extra selected buffs');
 await naturalInput.fill('30');
 await naturalInput.press('Tab');
 assert.equal(await naturalInput.inputValue(),'30');
 const naturalLabel=naturalSwitch.locator(
  'xpath=ancestor::*[contains(@class,"stage-combat-buff")][1]');
 assert.match(await naturalLabel.innerText(),/ОМ \+3|MP \+3/);
 await naturalInput.fill('99');
 await naturalInput.press('Tab');
 assert.equal(await naturalInput.inputValue(),'55');
 assert.match(await naturalLabel.innerText(),/ОМ \+5|MP \+5/);
 await naturalSwitch.uncheck();
 assert.equal(await allySection.locator('[data-book-setting="allyNaturalLevel"]').count(),0);
 const inspirationSwitch=allySection.locator(
  '[data-book-setting="legacySkill:320006001"]');
 await inspirationSwitch.check();
 const inspirationLabel=inspirationSwitch.locator(
  'xpath=ancestor::*[contains(@class,"stage-combat-buff")][1]');
 assert.match(await inspirationLabel.innerText(),/50%/);
 await inspirationSwitch.uncheck();
 // Source-gated Wild Wind: 200 movement index from a separate SNIPER.
 const wildWind=allySection.locator('[data-book-setting="combatFreeWind"]');
 assert.equal(await wildWind.count(),1);
 assert.equal(await wildWind.isDisabled(),false);
 await wildWind.check();
 assert.match(await allySection.innerText(),/Скорость передвижения \+200|Movement-speed index \+200/);
 const windBlessing=allySection.locator('[data-book-setting="combatWindBlessing"]');
 await windBlessing.check();
 assert.match(await allySection.innerText(),/прибавки показаны отдельно|bonuses are shown separately/);
 await windBlessing.uncheck();
 await wildWind.uncheck();
 // Healing belongs to the current hero's Skill Effects, not ally toggles.
 assert.equal(await allySection.locator('[data-book-setting="allyRegeneration"]').count(),0);
 assert.equal(await allySection.locator('[data-book-setting="allyRestoration"]').count(),0);
 assert.equal(await allySection.locator('.stage-ally-hp-fields').count(),0);
 const elementalGroup=page.locator('#stageBookPanel .stage-book-buff-group').filter({
  has:page.locator('[data-guide-key="buffs.section.elemental"]')});
 assert.equal(await elementalGroup.count(),1,
  'Elemental resistance must be a sibling of Ally Buffs, not nested inside');
 assert.equal(await elementalGroup.locator('summary.stage-result-section-head').count(),1,
  'Use the same disclosure geometry as the other Buffs sections');
 assert.equal(await elementalGroup.locator('input[data-book-setting^="resistSkill:"]').count(),5);
 assert.equal(await elementalGroup.getAttribute('open'),null,
  'Elemental resistance starts collapsed');
 await elementalGroup.locator('summary').click();
 const fire=elementalGroup.locator('[data-book-setting="resistSkill:410003001"]');
 const ice=elementalGroup.locator('[data-book-setting="resistSkill:410015001"]');
 await fire.check();
 assert.equal(await fire.isChecked(),true);
 await ice.check();
 assert.equal(await ice.isChecked(),true);
 assert.equal(await fire.isChecked(),false,
  'Selecting Ice must automatically clear Fire');
 assert.equal(await elementalGroup.locator('input[data-book-setting^="resistSkill:"]:checked').count(),1);
 assert.doesNotMatch(await elementalGroup.innerText(),/Incoming skill|Вражеский навык/);
 await ice.uncheck();
 assert.equal(await elementalGroup.locator('input[data-book-setting^="resistSkill:"]:checked').count(),0);
 await page.locator('#stageAttributes .stage-book-close').click();
 await page.locator('#locale [data-locale="ru"]').click();
 await page.locator('#locale [data-locale="ru"][aria-pressed="true"]').waitFor({state:'visible'});
 assert.match(await page.locator('#catalogStatus').innerText(),
  /^В энциклопедии: \d+ навыков · \d+ предметов · \d+ душ$/);

 // The planner is future-ready for all 55 levels, independent of live server 45.
 await page.locator('[data-origin-tab="stats"]').click();
 await page.locator('#level').evaluate(el=>{
  el.value='55';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal(await page.locator('#levelOut').textContent(),'55');
 assert.match(await page.locator('#budgetState').innerText(),/134/);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#levelOut')?.textContent==='55',
  null,{timeout:30000});
 assert.equal(await page.locator('#level').inputValue(),'55');

 // Guest can plan and recover the local draft, but saving into My Builds
 // requires an account. Clicking the quick save shortcut cannot change the hero.
 await page.locator('#newBuildQuick').click();
 const signInGate=page.locator('.build-signin-gate');
 await signInGate.waitFor({state:'visible',timeout:15000});
 assert.equal(await page.locator('.build-name-input').count(),0,
  'Guest must not see a saved-build creation form');
 assert.match(await signInGate.innerText(),/Мои билды — в аккаунте/);
 await page.locator('#dockClose').click();
 assert.equal(await page.locator('#levelOut').textContent(),'55',
  'Opening the sign-in gate must not discard the local character draft');
 await page.locator('#locale [data-locale="en"]').click();
 await page.waitForFunction(()=>document.documentElement.lang==='en',null,{timeout:20000});
 await page.locator('#nav [data-tab="builds"]').click();
 assert.match(await page.locator('.build-signin-gate').innerText(),
  /Your builds belong to your account/);
 await page.locator('#dockClose').click();
 assert.equal(await page.locator('#level').inputValue(),'55');
 assert.deepEqual(errors,[],'Unexpected browser JavaScript exceptions');
 console.log('Chromium desktop smoke passed: hero book, keyboard, level 1–55 and unsaved build');
 await context.close();

 // Separate mobile/touch interaction: no mouse cursor required to open the book.
 const mobile=await browser.newContext({viewport:{width:390,height:844},
  isMobile:true,hasTouch:true,deviceScaleFactor:2});
 await mobile.route('**/*',route=>
  route.request().url().startsWith(base+'/')?route.continue():route.abort());
 const touchPage=await mobile.newPage();
 touchPage.on('pageerror',e=>errors.push(e.message));
 await touchPage.goto(base+'/',{waitUntil:'domcontentloaded'});
 await touchPage.waitForFunction(()=>
  document.querySelector('#raceGrid')?.children.length>0,
  null,{timeout:20000});
 await touchPage.locator('#hero').tap();
 await touchPage.locator('#stageAttributes').waitFor({state:'visible'});
 await touchPage.locator('#stageAttributes .stage-book-close').tap();
 assert.equal(await touchPage.locator('#stageAttributes').isHidden(),true);
 const overflow=await touchPage.evaluate(()=>
  Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-
  document.documentElement.clientWidth);
 assert.ok(overflow<=12,'Mobile horizontal overflow: '+overflow+'px');
 assert.deepEqual(errors,[],'Unexpected browser JavaScript exceptions');
 console.log('Chromium mobile smoke passed: touch book, responsive width');
 await mobile.close();
 // Every smoke creates its own isolated browser context and network stubs.
 // Execute at most three at once: this reduces wall time without risking
 // cross-test localStorage/account contamination or high 4K screenshot memory.

 const quickCases=new Set(['build-account-gate','modal-keyboard','shared-library-import','draft-persistence-warning','guest-draft-continuity','share-link','cloud-conflict','cloud-save-failure','cross-tab-account','account-feedback-race','equipment-locale','per-item-soul-capacity','equipment-quick-menu','equipment-forge-bonuses','legacy-class-cap','innate-l1-mastery','hero-book-live-recalc','hero-book-monsters-785','origin-shared-snapshot',
  'manual-saved-overwrite','account-late-bootstrap','empty-account-reconnect','account-isolation','inline-skill-milestones',
  'build-comparison','chest-reward-layout','wiki-skill-filters','wiki-skill-label-editor','ui-content-inline','owner-equipment-copy-width','wiki-owner-english-sync','wiki-spawn-replace','wiki-icons-offline']);
 const selected=quick?scenarios.filter(([name])=>quickCases.has(name)):scenarios;
 // Isolate the long admin flow: its heavy editor/catalog re-renders were
 // contending with unrelated Chromium contexts and detaching input nodes.
 // All other scenarios retain parallelism and final full CI coverage.
 const admin=selected.filter(([name])=>name==='hidden-admin-entry');
 const regular=selected.filter(([name])=>name!=='hidden-admin-entry');
 const report=[...await runIndependentSmokes(regular,browser,base,{concurrency}),
  ...await runIndependentSmokes(admin,browser,base,{concurrency:1})];
 console.log('Chromium '+(quick?'quick':'full')+' suite: '+
  report.length+' isolated flows, concurrency '+concurrency+
  ', aggregate scenario time '+report.reduce((sum,row)=>sum+row.ms,0)+'ms');
 // Run large-list timings serially, outside the parallel smoke tasks, to
 // avoid measuring CPU contention from other Chromium contexts.
 if(!quick)await runEncyclopediaPerformanceSmoke(browser,base);
 // 4K full-page screenshots are memory-heavy: run layout after regular flows.
 if(!quick)await runLayoutAudit(browser,base);
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{await browser?.close()});
