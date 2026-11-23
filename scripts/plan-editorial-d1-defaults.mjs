// Read-only, deterministic preparation for a FUTURE approved D1 defaults
// migration. Running this program NEVER connects to Cloudflare or writes D1.
// Existing guideedit overrides are not rewritten or deleted.
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const byCodepoint=(a,b)=>a<b?-1:a>b?1:0;
const sha256=text=>createHash('sha256').update(text,'utf8').digest('hex');
const sqlString=value=>"'"+String(value).replaceAll("'","''")+"'";

const DEFAULT_KEY=/^guideedit\.(?:book\.[a-z][a-zA-Z0-9._:-]{1,80}|honor\.(?:overview|rank\.(?:[0-9]|1[01]))|wiki\.labels)$/;
const DEFAULT_WIKI_FIELD=/^(?:chapter_(?:item|utility|monster|map|honor|npc|chest|instance|skill|soul)|honor_(?:overview|gain|victories|ranks|monthly)|skill_filter_(?:player|racial|guild|special|variants|other|unknown|all))_(?:ru|en)$/;
const DEFAULT_OVERVIEW_FIELD=/^(?:pvp(?:Intro|Daily|Weekly|Hunt)(?:Ru|En)|overview(?:Ru|En)|honor(?:Ru|En)|total(?:Ru|En)|gain(?:Ru|En)|loss(?:Ru|En)|current(?:Ru|En)|ranks(?:Ru|En)|joining(?:Ru|En)|cloaks(?:Ru|En)|monthlyNote(?:Ru|En))$/;
function allowedDefaultRow(row){
 if(!row||typeof row.recordKey!=='string'||!DEFAULT_KEY.test(row.recordKey)||
  typeof row.field!=='string'||typeof row.value!=='string'||
  !row.value.trim()||row.value.length>8000||
  /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(row.value))return false;
 if(row.recordKey==='guideedit.wiki.labels')
  return DEFAULT_WIKI_FIELD.test(row.field)&&row.value.length<=90;
 if(row.recordKey==='guideedit.honor.overview')
  return DEFAULT_OVERVIEW_FIELD.test(row.field)&&row.value.length<=2200;
 if(row.recordKey.startsWith('guideedit.honor.rank.'))
  return /^(?:nameRu|nameEn|benefitRu|benefitEn)$/.test(row.field)&&
   row.value.length<=500;
 return /^(?:ru|en|hintRu|hintEn)$/.test(row.field)&&row.value.length<=360;
}
// Guard exported SQL against a caller-supplied but self-consistent invalid
// manifest. The staging reader and frontend use this same closed namespace.
function assertVerifiedManifest(manifest){
 if(!manifest||!Array.isArray(manifest.records)||
  !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(manifest.release||''))
  throw Error('Invalid source-release or missing D1 default rows');
 const payload={schema:manifest.schema,release:manifest.release,
  records:manifest.records};
 const digest=sha256(JSON.stringify(payload));
 if(manifest.schema!==1||manifest.digest!==digest||
  manifest.snapshot!==manifest.release+'-'+digest.slice(0,16))
  throw Error('Manifest content or version does not match its SHA-256');
 if(!manifest.records.length||manifest.records.length>3000)
  throw Error('Invalid D1 default row count');
 let characters=0,previous=null;
 for(const row of manifest.records){
  if(!allowedDefaultRow(row))
   throw Error('Unallowlisted D1 default row: '+String(row?.recordKey)+'/'+String(row?.field));
  const identity=row.recordKey+'\u0000'+row.field;
  if(previous!==null&&identity<=previous)
   throw Error('Duplicate or unsorted D1 default identity: '+identity);
  previous=identity;
  characters+=row.value.length;
  if(characters>450000)throw Error('D1 default text exceeds reader limits');
 }
 return manifest.snapshot;
}


export function buildEditorialDefaultsManifest(){
 const scope={};
 const context={window:scope};
 for(const path of [
  'pandora-studio-hero-book.js',
  'pandora-studio-ui-locale.js',
  'pandora-studio-honor-guide.js',
  'pandora-studio-wiki-labels.js'
 ])runInNewContext(read(path),context,{filename:path,timeout:5000});
 const ui=scope.PandoraUILocale;
 const book=scope.PandoraStageAttributes;
 const guide=scope.PandoraHonorGuide;
 const wiki=scope.PandoraWikiLabels;
 if(!ui?.fieldKey||!book?.summaryRows||!guide?.validOverride||
  !wiki?.key||!wiki?.validField)
  throw Error('Required audited authorial catalogs did not initialize');

 const packageInfo=JSON.parse(read('package.json'));
 const release=packageInfo.version;
 if(!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(release))
  throw Error('Invalid pinned source release');
 const records=[],seen=new Set(),cohorts=Object.create(null);
 function append(recordKey,field,value,cohort){
  if(!/^guideedit\.(?:book\.[a-z][a-zA-Z0-9._:-]{1,80}|honor\.(?:overview|rank\.(?:[0-9]|1[01]))|wiki\.labels)$/.test(recordKey))
   throw Error('Unallowlisted authorial field: '+recordKey);
  if(recordKey==='guideedit.wiki.labels'?!wiki.validField(field):
   !/^(?:ru|en|hintRu|hintEn|[a-z][a-zA-Z]*Ru|[a-z][a-zA-Z]*En)$/.test(field))
   throw Error('Unallowlisted authorial subfield: '+field);
  if(typeof value!=='string'||!value.trim()||value.length>8000||
   /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))
   throw Error('Invalid source text for '+recordKey+'/'+field);
  const identity=recordKey+'\u0000'+field;
  if(seen.has(identity))throw Error('Duplicate D1 default identity: '+identity);
  seen.add(identity);
  records.push({recordKey,field,value});
  cohorts[cohort]=(cohorts[cohort]||0)+1;
 }

 // The exact same stable ids and fallback values that existing owner CAS
 // already uses for headings, status text, and the Hero Book text catalog.
 for(const key of ui.keys()){
  // Even the fixed release dictionary contains a literal class count.
  // Never seed it as D1 editable text: live UI uses jobKeys.length instead.
  if(key==='classCount')continue;
  const id=ui.fieldKey(key);
  if(!id)throw Error('Missing existing bilingual owner field key: '+key);
  for(const lang of ['ru','en'])
   append('guideedit.book.'+id,lang,ui.baseText(key,lang),'ui-locale');
 }

 // Pure Book buff status copy only. The actual availability boolean,
 // canonical skill/class data, mastery and level prerequisites are runtime.
 const buffStatuses=book.buffStatusCopyRows;
 const expectedBuffStatuses=[
  'unavailableClass','shieldRequired','weaponUnavailable','supportUnavailable'
 ];
 if(!Array.isArray(buffStatuses)||buffStatuses.length!==expectedBuffStatuses.length||
  buffStatuses.map(row=>row?.[0]).sort().join('|')!==expectedBuffStatuses.sort().join('|'))
  throw Error('Hero Book pure buff status inventory drift');
 for(const [key,ru,en] of buffStatuses){
  if(!/^[a-z][a-zA-Z]+$/.test(key)||typeof ru!=='string'||!ru.trim()||
   ru!==ru.trim()||typeof en!=='string'||!en.trim()||en!==en.trim())
   throw Error('Invalid Book authored buff status: '+key);
  append('guideedit.book.buffs.reason.'+key,'ru',ru,'hero-book-buff-status');
  append('guideedit.book.buffs.reason.'+key,'en',en,'hero-book-buff-status');
 }

 // The level and mastery blockers preserve the original RU/EN wording
 // order while splitting the game-owned number and branch into live DOM nodes.
 // The four bilingual authorial fragments below never store those game facts.
 const buffRequirements=book.buffRequirementCopyRows;
 const requiredParts=['levelLead','levelUnit','masteryLead','masteryTerm'];
 if(!Array.isArray(buffRequirements)||buffRequirements.length!==requiredParts.length||
  buffRequirements.map(row=>row?.[0]).sort().join('|')!==requiredParts.sort().join('|'))
  throw Error('Hero Book dynamic buff requirement inventory drift');
 for(const [key,ru,en] of buffRequirements){
  if(!/^[a-z][a-zA-Z]+$/.test(key)||typeof ru!=='string'||
   typeof en!=='string'||ru!==ru.trim()||en!==en.trim()||
   !ru.trim()||!en.trim()||/[0-9]/.test(ru+en))
   throw Error('Invalid Book requirement authorial fragment: '+key);
  append('guideedit.book.buffs.reason.'+key,'ru',ru,'hero-book-buff-requirements');
  append('guideedit.book.buffs.reason.'+key,'en',en,'hero-book-buff-requirements');
 }

 // The original Book's four navigation strings already exist in the
 // shared UI locale dictionary. Seed only three new authorial fragments
 // for the dynamic chapter region; never snapshot a numeric page position.
 const bookRegion=book.bookRegionCopyRows;
 const expectedBookRegion=['regionLead','regionPage','regionOf'];
 if(!Array.isArray(bookRegion)||bookRegion.length!==expectedBookRegion.length||
  bookRegion.map(row=>row?.[0]).sort().join('|')!==expectedBookRegion.sort().join('|'))
  throw Error('Book source-only region caption inventory drift');
 for(const [key,ru,en] of bookRegion){
  if(!/^[a-z][a-zA-Z]+$/.test(key)||
   typeof ru!=='string'||ru!==ru.trim()||!ru.trim()||
   typeof en!=='string'||en!==en.trim()||!en.trim())
   throw Error('Invalid Book region RU/EN authorial copy: '+key);
  const slug=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  append('guideedit.book.book-aria.'+slug,'ru',ru,'hero-book-accessibility');
  append('guideedit.book.book-aria.'+slug,'en',en,'hero-book-accessibility');
 }
 // The three reviewed navigation-action verbs are authorial, but the
 // item/skill names appended after them are source data, never D1 rows.
 const bookActionRows=book.bookSourceActionCopyRows;
 const expectedBookActions=[
  'skillEncyclopediaPrefix','itemEncyclopediaPrefix','itemOpenPrefix'
 ];
 if(!Array.isArray(bookActionRows)||bookActionRows.length!==expectedBookActions.length||
  bookActionRows.map(row=>row?.[0]).sort().join('|')!==expectedBookActions.sort().join('|'))
  throw Error('Book dynamic source-action copy inventory drift');
 for(const [key,ru,en] of bookActionRows){
  if(!/^[a-z][a-zA-Z]+$/.test(key)||!ru.trim()||ru!==ru.trim()||
   !en.trim()||en!==en.trim())
   throw Error('Invalid Book source-action RU/EN phrase: '+key);
  const slug=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  append('guideedit.book.book-aria.'+slug,'ru',ru,'hero-book-source-actions');
  append('guideedit.book.book-aria.'+slug,'en',en,'hero-book-source-actions');
 }
 const bookAliases=book.bookAccessibleAliasRows;
 if(!Array.isArray(bookAliases)||bookAliases.length!==4||
  bookAliases.map(row=>row?.[0]).sort().join('|')!=='close|next|previous|tabs')
  throw Error('Hero Book action alias source inventory drift');
 for(const [,ru,en] of bookAliases){
  const key=ui.bookFieldKey(ru);
  if(!key||ui.baseText(key,'ru')!==ru||ui.baseText(key,'en')!==en)
   throw Error('Accessible action must reuse a prior Book D1 identity: '+ru);
 }

 // The owner dock's fixed visible action captions, group headings and
 // instructions are also already editable via ownerCopy('owner-dock').
 // Extract only the audited literal dictionary, never execute the app's
 // startup logic, inspect player state, or guess text keys from a game UI.
 const app=read('pandora-studio-app.js');

 // Owner history prose is human-authored, while its live D1 records,
 // source-before/after values, search filters and result totals are not.
 // Extract seven existing exact semantic keys. Fail if the editor surface
 // gains another key until the source inventory is explicitly reviewed.
 const historyRegistry=app.match(
  /const ownerHistoryTextRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!historyRegistry)throw Error('Missing owner-history source caption registry');
 const historyRows=runInNewContext('('+historyRegistry[1]+')',{},{timeout:5000});
 const requiredHistory=['afterHeading','beforeHeading','shownLead','shownOf','shownSuffix'];
 if(!Array.isArray(historyRows)||historyRows.length!==requiredHistory.length||
  historyRows.map(row=>row?.[0]).sort().join('|')!==requiredHistory.sort().join('|'))
  throw Error('Unreviewed dynamic owner-history caption');
 const historyUnique=new Set();
 for(const entry of historyRows){
  if(!Array.isArray(entry)||entry.length!==3||entry.some(x=>
    typeof x!=='string'||!x.trim())||historyUnique.has(entry[0]))
   throw Error('Invalid bilingual owner-history caption');
  const [key,ru,en]=entry;historyUnique.add(key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.owner-history.'+slug,'ru',ru,'owner-history-authorial');
  append('guideedit.book.owner-history.'+slug,'en',en,'owner-history-authorial');
 }
 const historyExisting=[...app.matchAll(
  /authoredHistory\('([^']+)',\s*'([^']*)',\s*'([^']*)'\)/g
 )].map(m=>[m[1],m[2],m[3]]);
 if(historyExisting.length!==2||
  historyExisting.map(row=>row[0]).sort().join('|')!=='empty|intro')
  throw Error('Owner history original heading/empty labels drifted');
 for(const [key,ru,en] of historyExisting){
  if(!ru.trim()||!en.trim())throw Error('Empty owner-history translation');
  append('guideedit.book.owner-history.'+key,'ru',ru,'owner-history-authorial');
  append('guideedit.book.owner-history.'+key,'en',en,'owner-history-authorial');
 }

 // Only the seven reviewed source strings of history controls are
 // staged. Runtime queries, selected sections, counts and D1 records are not.
 const controlRegistry=app.match(
  /const ownerHistoryControlCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!controlRegistry)throw Error('Missing owner-history control registry');
 const controlRows=runInNewContext('('+controlRegistry[1]+')',{},{timeout:5000});
 const expectedControlKeys=['allSections','clear','clearAria','searchAria',
  'searchPlaceholder','sectionAria','session'];
 if(!Array.isArray(controlRows)||
  controlRows.map(row=>row?.[0]).sort().join('|')!==expectedControlKeys.sort().join('|'))
  throw Error('Unreviewed owner-history control caption inventory');
 for(const row of controlRows){
  if(!Array.isArray(row)||row.length!==3||row.some(x=>
   typeof x!=='string'||!x.trim()))
   throw Error('Invalid bilingual history control caption');
  const [key,ru,en]=row,slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.owner-history.'+slug,'ru',ru,'owner-history-controls');
  append('guideedit.book.owner-history.'+slug,'en',en,'owner-history-controls');
 }

 // The five exact history row captions contain only source RU/EN words.
 // Open record titles, numeric change counters, error payloads and live
 // before/after data must never become authored D1 defaults.
 const historyRowSource=app.match(
  /const ownerHistoryRowCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!historyRowSource)throw Error('Missing owner-history row source inventory');
 const historyRowTexts=runInNewContext('('+historyRowSource[1]+')',{},{timeout:5000});
 const expectedHistoryRow=['fieldsChanged','openEncyclopedia','pendingError',
  'pendingSaving','restoreOriginal'];
 if(!Array.isArray(historyRowTexts)||
  historyRowTexts.map(row=>row?.[0]).sort().join('|')!==expectedHistoryRow.join('|'))
  throw Error('Unreviewed owner-history row caption source');
 for(const row of historyRowTexts){
  if(!Array.isArray(row)||row.length!==3||row.some(text=>
   typeof text!=='string'||!text.trim()))
   throw Error('Invalid bilingual history row source');
  const [key,ru,en]=row,slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.owner-history.'+slug,'ru',ru,'owner-history-rows');
  append('guideedit.book.owner-history.'+slug,'en',en,'owner-history-rows');
 }

 // History dialog phrases and *independent* hover hints are audited as
 // source text; D1 record names, counters and raw server errors remain out.
 const auxSource=app.match(
  /const ownerHistoryAuxCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!auxSource)throw Error('Missing history auxiliary source');
 const auxRows=runInNewContext('('+auxSource[1]+')',{},{timeout:5000});
 const expectedAux=['catalogUnavailable','clearHelp','confirmRestore','dialogTitle',
  'openHelp','restoreFailure','restoreHelp'];
 if(!Array.isArray(auxRows)||
  auxRows.map(row=>row?.[0]).sort().join('|')!==expectedAux.join('|'))
  throw Error('Unreviewed owner-history dialog or hover source');
 for(const row of auxRows){
  if(!Array.isArray(row)||row.length!==3||row.some(x=>
   typeof x!=='string'||!x.trim()))
   throw Error('Invalid bilingual history auxiliary copy');
  const [key,ru,en]=row,slug=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  append('guideedit.book.owner-history.'+slug,'ru',ru,'owner-history-aux');
  append('guideedit.book.owner-history.'+slug,'en',en,'owner-history-aux');
 }

 // Two owner-only dialogs have fixed authorial source copy AND separate
 // runtime D1 records, counts, original translations, URLs, worker errors.
 // Extract precisely the reviewed 18 presentation messages and five existing
 // help/action captions. Abort on new identities until editorial review.
 const ownerDialogStatusSource=app.match(
  /const ownerDialogStatusCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!ownerDialogStatusSource)throw Error('Missing owner-dialog source registry');
 const ownerDialogRows=runInNewContext('('+ownerDialogStatusSource[1]+')',{},{timeout:5000});
 const expectedOwnerDialog=[
  'translationsNoPending','translationsReadyCount','translationsSuccessLead',
  'translationsSuccessSuffix','translationsPartialLead','translationsPartialOf',
  'translationsPartialSuffix','translationsTitle','translationsSaveHint',
  'githubMissingToken','githubCount','githubProposed','githubLink','githubFollowup',
  'githubUnchanged','githubNoLink','githubTitle','githubCreateHint'
 ];
 if(!Array.isArray(ownerDialogRows)||
  ownerDialogRows.map(row=>row?.[0]).sort().join('|')!==
   expectedOwnerDialog.sort().join('|'))throw Error('Unreviewed owner-dialog status source');
 const seenOwnerDialog=new Set();
 for(const row of ownerDialogRows){
  if(!Array.isArray(row)||row.length!==3||row.some(value=>
    typeof value!=='string'||!value.trim())||seenOwnerDialog.has(row[0]))
   throw Error('Invalid owner-dialog bilingual source caption');
  const [key,ru,en]=row;seenOwnerDialog.add(key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.owner-dialog.'+slug,'ru',ru,'owner-dialog-states');
  append('guideedit.book.owner-dialog.'+slug,'en',en,'owner-dialog-states');
 }
 const ownerDialogExisting=[...app.matchAll(
  /ownerDialog(?:Help|Action)\((?:save,|go,)?\s*'([a-zA-Z]+)',\s*'([^']+)',\s*'([^']+)'\)/g
 )].map(row=>[row[1],row[2],row[3]]);
 const expectedExisting=['githubCreateButton','githubExplanation','githubPrompt',
  'translationsIntro','translationsSaveButton'];
 if(ownerDialogExisting.length!==expectedExisting.length||
  ownerDialogExisting.map(row=>row[0]).sort().join('|')!==
   expectedExisting.join('|'))throw Error('Unreviewed existing owner-dialog copy');
 for(const [key,ru,en] of ownerDialogExisting){
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.owner-dialog.'+slug,'ru',ru,'owner-dialog-helpers');
  append('guideedit.book.owner-dialog.'+slug,'en',en,'owner-dialog-helpers');
 }

 // Profile labels have real owner CAS keys, but their values are strictly
 // authored captions. The editable hero profile itself is never D1 copy.
 const profileSource=app.match(
  /const profileAuthorialCopy=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!profileSource)throw Error('Missing profile authorial registry');
 const profile=runInNewContext('('+profileSource[1]+')',{},{
  filename:'profileAuthorialCopy',timeout:5000
 });
 const expectedProfile=[
  'field-name','field-guild','field-nation','field-rank',
  'bio-label','bio-placeholder','profile-notes',
  'overview-race','overview-class','overview-level',
  'racial-heading','overview-help',
  'tab-character','tab-profile','action-hero-path','action-attributes',
  'action-edit-profile',
  'portrait-race-prefix','portrait-race-missing','hero-unnamed',
  'class-missing','level-suffix','overview-missing','passive-loading',
  'passive-choose-race','passive-no-description','passive-selected',
  'passive-select','panel-accessibility'
 ];
 if(Object.keys(profile).sort().join('|')!==expectedProfile.sort().join('|'))
  throw Error('Profile source keys drifted; review migration');
 for(const key of expectedProfile){
  const pair=profile[key];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid profile bilingual copy: '+key);
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.profile.'+key,lang,pair[i],'profile-authorial');
 }

 const match=app.match(/const ownerDockText=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!match)throw Error('Missing audited owner dock authorial source registry');
 const dock=runInNewContext('('+match[1]+')',{},{
  filename:'ownerDockText',timeout:5000
 });
 if(!dock||typeof dock!=='object'||Array.isArray(dock))
  throw Error('Invalid owner dock text dictionary');
 for(const [key,pair] of Object.entries(dock)){
  if(!/^[a-z][a-zA-Z0-9]{1,50}$/.test(key)||
   !Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid owner-dock authorial field: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.owner-dock.'+slug,lang,pair[i],'owner-dock');
 }

 // Item encyclopedia field labels and their independent hover explanations
 // share canonical guideedit.book.wiki.item-field.* records. Extract ONLY
 // their audited static RU/EN dictionaries, never source item values.
 const itemPresentation=read('pandora-studio-item-presentation.js');
 const itemDict=name=>{
  const source=itemPresentation.match(new RegExp(
   'const '+name+'=Object\\.freeze\\((\\{[\\s\\S]*?\\})\\);'));
  if(!source)throw Error('Missing reviewed item presentation '+name);
  return runInNewContext('('+source[1]+')',{},{
   filename:name,timeout:5000
  });
 };
 const itemLabels=itemDict('itemFieldLabels');
 const itemHints=itemDict('itemFieldHints');
 const expectedItemFields=['kind','level','W','PEN','AC','atkspeed','range','soulslot'];
 if(Object.keys(itemLabels).sort().join('|')!==[...expectedItemFields].sort().join('|')||
  Object.keys(itemHints).sort().join('|')!==[...expectedItemFields].sort().join('|'))
  throw Error('Source item fields changed: review migration map first');
 for(const key of expectedItemFields){
  const recordKey='guideedit.book.wiki.item-field.'+key.toLowerCase();
  for(const [pair,ruField,enField] of [
   [itemLabels,'ru','en'],[itemHints,'hintRu','hintEn']
  ]){
   if(!Array.isArray(pair[key])||pair[key].length!==2)
    throw Error('Invalid item field authorial copy: '+key);
   append(recordKey,ruField,pair[key][0],'item-field');
   append(recordKey,enField,pair[key][1],'item-field');
  }
 }

 // Three actual equipment settings tabs have existing owner-copy keys.
 // The remaining context-menu actions use different dynamic UI surfaces,
 // so never invent D1 identities for them in this partial inventory.
 const equipmentSrc=read('pandora-studio-equipment-ui.js');
 const equipmentMatch=equipmentSrc.match(
  /const actionLabels=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!equipmentMatch)throw Error('Missing existing equipment action labels');
 const gear=runInNewContext('('+equipmentMatch[1]+')',{},{
  filename:'equipment actionLabels',timeout:5000
 });
 for(const [tab,action] of [
  ['choose','replace'],['details','properties'],['souls','souls']
 ]){
  const pair=gear[action];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Unknown equipment tab authorial label: '+action);
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.equipment.tab.'+tab,lang,pair[i],'equipment-tabs');
 }

 // Preserve exact equipment CAS identities from the on-screen source registry.
 // This inventory is never generated from mutable item records or numeric
 // character state. A changed source registry requires deliberate review.
 const summaryMatch=equipmentSrc.match(
  /const equipmentSummaryCopy=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!summaryMatch)throw Error('Missing equipment summary source dictionary');
 const summary=runInNewContext('('+summaryMatch[1]+')',{},{
  filename:'equipmentSummaryCopy',timeout:5000
 });
 const expectedSummary=[
  'field.soulCompatible','field.type','field.level','field.attack',
  'field.magicAttack','field.defense','field.slots','field.speed',
  'field.range','field.gemType','field.element','field.specialEffect',
  'unavailable','wearableBy','outfitNote','socketedSoulHeading'
 ];
 if(Object.keys(summary).sort().join('|')!==expectedSummary.sort().join('|'))
  throw Error('Equipment summary registry has new or missing keys');
 for(const key of expectedSummary){
  const pair=summary[key];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid equipment summary RU/EN: '+key);
  const ownerKey='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [i,lang] of ['ru','en'].entries())
   append(ownerKey,lang,pair[i],'equipment-summary');
 }
 // The three tab tooltips use distinct existing hint.{tab} CAS keys.
 const hintsMatch=equipmentSrc.match(
  /const equipmentTabHints=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!hintsMatch)throw Error('Missing equipment tooltip source registry');
 const tabHints=runInNewContext('('+hintsMatch[1]+')',{},{
  filename:'equipmentTabHints',timeout:5000
 });
 if(Object.keys(tabHints).sort().join('|')!=='choose|details|souls')
  throw Error('Equipment tooltip registry changed');
 for(const [tab,pair] of Object.entries(tabHints)){
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid equipment tooltip RU/EN: '+tab);
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.equipment.hint.'+tab,lang,pair[i],
    'equipment-hints');
 }

 // Source-authored equipment controls include fixed headings and ARIA
 // prefixes next to dynamic Soul counts. Only the pure literals are seeded.
 const controlsMatch=equipmentSrc.match(
  /const equipmentInterfaceCopy=Object\.freeze\((\{[\s\S]*?\})\);/);
 if(!controlsMatch)throw Error('Missing equipment interface copy registry');
 const controlCopy=runInNewContext('('+controlsMatch[1]+')',{},{
  filename:'equipmentInterfaceCopy',timeout:5000
 });
 const expectedControls=[
  'pickerSlotHeading','pickerItemClose','pickerItemSettings','pickerPropertiesGroup','chooseItemEmpty',
  'socketCapacityHeading','socketOverflowHint','refinementHeading',
  'gemTypeLabel','gemElementLabel','pickerSoulSlotAria','pickerEmptySoul',
  'pickerSoulSlotCaption','soulSlotsHeading','soulSearch','pickerSoulSearchAria',
  'soulShowMore','soulProgressLabel','soulSearchEmpty','soulRemove'
 ];
 if(Object.keys(controlCopy).sort().join('|')!==expectedControls.sort().join('|'))
  throw Error('Equipment interface copy registry has changed');
 for(const key of expectedControls){
  const pair=controlCopy[key];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Invalid equipment interface RU/EN: '+key);
  const id='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  for(const [i,lang] of ['ru','en'].entries())
   append(id,lang,pair[i],'equipment-interface');
 }

 // Eight supported equipment families use exact, stable editor keys for
 // their zero-capacity and unknown-capacity Soul notices. Evaluate only the
 // audited source grammar and noun table; never inspect equipped user items.
 const nounsMatch=equipmentSrc.match(
  /const SOUL_SLOT_NOUNS=Object\.freeze\((\{[\s\S]*?\})\);/);
 const unavailableMatch=equipmentSrc.match(
  /function soulUnavailableCopy\(slot,capacity,english=false\)\{([\s\S]*?)\n\}/);
 if(!nounsMatch||!unavailableMatch)
  throw Error('Missing original Soul unavailable copy generator');
 const soulSlots=['weapon','shield','head','body','gloves','legs','feet','belt'];
 const nouns=runInNewContext('('+nounsMatch[1]+')',{},{
  filename:'SOUL_SLOT_NOUNS',timeout:5000
 });
 if(Object.keys(nouns).sort().join('|')!==[...soulSlots].sort().join('|'))
  throw Error('Soul slot noun families changed: review mapping');
 const unavailable=runInNewContext(
  'const SOUL_SLOT_NOUNS=Object.freeze('+nounsMatch[1]+');'+
  'function soulUnavailableCopy(slot,capacity,english=false){'+
   unavailableMatch[1]+'\n}\nsoulUnavailableCopy',{},{
    filename:'soulUnavailableCopy',timeout:5000
   });
 for(const slot of soulSlots){
  for(const [suffix,capacity] of [['zero',0],['unknown',null]]){
   const key='guideedit.book.equipment.soul-unavailable-'+suffix+'.'+slot;
   for(const [lang,english] of [['ru',false],['en',true]])
    append(key,lang,unavailable(slot,capacity,english),
     'equipment-soul-unavailable');
  }
 }

 // The existing right-click gear menu uses its own five editable
 // context.{action} keys, independent of the item settings tab captions.
 for(const action of ['choose','replace','properties','souls','remove']){
  const pair=gear[action];
  if(!Array.isArray(pair)||pair.length!==2)
   throw Error('Missing context menu RU/EN default: '+action);
  for(const [i,lang] of ['ru','en'].entries())
   append('guideedit.book.equipment.context.'+action,lang,pair[i],
    'equipment-context-menu');
 }

 // The mounted picker/gear menu has a hand-curated, five-column panel
 // registry. Only key + RU/EN source text are copy; panel headings and
 // runtime level/slot values are NOT editor defaults.
 const metaMatch=app.match(
  /const equipmentPickerMetaCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!metaMatch)throw Error('Missing equipment picker meta source rows');
 const equipmentMeta=runInNewContext('('+metaMatch[1]+')',{},{
  filename:'equipmentPickerMetaCopyRows',timeout:5000
 });
 const expectedPickerMeta=[
  'gearMenuEquippedAria','gearMenuEmptyAria','gearMenuEmptyTitle',
  'gearMenuNoSoulSlots','gearMenuMissingItem','pickerNavGroup',
  'pickerPreviousSlot','pickerNextSlot','pickerEquipAction','pickerPlanAction',
  'pickerFutureLevel','pickerItemLevel','pickerItemSlots',
  'pickerFutureBadgePrefix','pickerFutureBadgeSuffix'
 ];
 if(!Array.isArray(equipmentMeta)||equipmentMeta.length!==expectedPickerMeta.length||
  equipmentMeta.map(r=>r[0]).sort().join('|')!==expectedPickerMeta.sort().join('|'))
  throw Error('Unexpected equipment picker source copy inventory');
 for(const entry of equipmentMeta){
  if(!Array.isArray(entry)||entry.length!==5)
   throw Error('Invalid equipment picker copy row');
  const [key,ru,en]=entry;
  const id='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(id,'ru',ru,'equipment-picker-meta');
  append(id,'en',en,'equipment-picker-meta');
 }

 // Origin headings are already editable on the live page by dblclick/F2
 // through origin.{semantic-key}. Exclude the "28 classes" counter even
 // though its current text happens to be a literal; it is gameplay data.
 const originMatch=app.match(/const originFixedLabels=(\[[\s\S]*?\]);/);
 if(!originMatch)throw Error('Missing audited origin owner copy registry');
 const originLabels=runInNewContext('('+originMatch[1]+')',{},{
  filename:'originFixedLabels',timeout:5000
 });
 const expectedOriginKeys=[
  'heading','tabRace','tabProfession','tabStats','raceHeading',
  'professionHeading','racePrompt','passiveHeading','classCount',
  'progressHeading','levelParameters','levelHeading','baseHeading',
  'distributeHeading'
 ];
 if(!Array.isArray(originLabels)||originLabels.length!==expectedOriginKeys.length||
  originLabels.map(r=>r[1]).sort().join('|')!==expectedOriginKeys.sort().join('|'))
  throw Error('Origin source copy set changed: review migration map');
 for(const entry of originLabels){
  if(!Array.isArray(entry)||entry.length!==4)
   throw Error('Invalid original Origin source label');
  const [selector,key,ru,en]=entry;
  if(typeof selector!=='string'||!selector.trim())throw Error('Missing Origin selector');
  if(key==='classCount')continue; // runtime/game catalog count
  const id='guideedit.book.origin.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(id,'ru',ru,'origin-headings');
  append(id,'en',en,'origin-headings');
 }



 // Class wizard labels already share origin.* CAS keys; the original
 // authorial fragment is distinct from IDs, status conditions, and job names.
 const classMatch=app.match(
  /const originClassWizardCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!classMatch)throw Error('Missing audited class-wizard RU/EN source registry');
 const wizardRows=runInNewContext('('+classMatch[1]+')',{},{
  filename:'originClassWizardCopyRows',timeout:5000
 });
 const expectedWizardKeys=['stepDirection','stepProfession','stepSpecialization',
  'classPrompt','classSelectedPrefix','classChosen','classSpecializations',
  'classChoose','classBack','classAllDirections','classCurrentChosen',
  'classCurrentChoose','classSelectionHint'];
 if(!Array.isArray(wizardRows)||wizardRows.length!==expectedWizardKeys.length||
  wizardRows.map(x=>x[0]).sort().join('|')!==expectedWizardKeys.sort().join('|'))
  throw Error('Class wizard authorial set changed: review D1 migration');
 for(const [key,ru,en] of wizardRows){
  if(typeof ru!=='string'||!ru.trim()||typeof en!=='string'||!en.trim())
   throw Error('Missing original bilingual wizard caption');
  const id='guideedit.book.origin.'+
   key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  append(id,'ru',ru,'origin-class-wizard');
  append(id,'en',en,'origin-class-wizard');
 }


 // The wizard's actual ARIA names use distinct authorial CAS fields from
 // the immutable profession names, selected source job and specialization.
 const ariaMatch=app.match(
  /const originClassWizardAriaRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!ariaMatch)throw Error('Missing class-wizard accessibility defaults');
 const ariaRows=runInNewContext('('+ariaMatch[1]+')',{},{
  filename:'originClassWizardAriaRows',timeout:5000
 });
 const ariaExpected=['classStageNavAria','classBreadcrumbNavAria',
  'classSelectedSpecializationAria','classChosenAria',
  'classViewSpecializationsAria','classSelectClassAria'];
 if(!Array.isArray(ariaRows)||ariaRows.length!==ariaExpected.length||
  ariaRows.map(row=>row[0]).sort().join('|')!==ariaExpected.sort().join('|'))
  throw Error('Class wizard ARIA source set changed: review migration');
 for(const [key,ru,en] of ariaRows){
  if(typeof ru!=='string'||!ru.trim()||typeof en!=='string'||!en.trim())
   throw Error('Missing RU/EN class wizard ARIA authorial text');
  const id='guideedit.book.origin.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(id,'ru',ru,'origin-class-wizard-aria');
  append(id,'en',en,'origin-class-wizard-aria');
 }

 // Race-gallery accessible action words are owner-authored; race names,
 // gender variants, artwork sources and preview indices are NOT D1 defaults.
 const raceMatch=app.match(
  /const originRacePortraitAriaRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!raceMatch)throw Error('Missing original race portrait ARIA source');
 const raceRows=runInNewContext('('+raceMatch[1]+')',{},{
  filename:'originRacePortraitAriaRows',timeout:5000
 });
 const expectedRace=['racePortraitPreviousAria','racePortraitNextAria',
  'racePortraitChooseAria'];
 if(!Array.isArray(raceRows)||raceRows.length!==expectedRace.length||
  raceRows.map(row=>row[0]).sort().join('|')!==expectedRace.sort().join('|'))
  throw Error('Origin race portrait source keys changed: review migration');
 for(const [key,ru,en] of raceRows){
  if(typeof ru!=='string'||!ru.trim()||typeof en!=='string'||!en.trim())
   throw Error('Missing bilingual race-gallery accessibility copy');
  const id='guideedit.book.origin.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(id,'ru',ru,'origin-race-portrait-aria');
  append(id,'en',en,'origin-race-portrait-aria');
 }

 // Racial passive authorial words are separate from source skill identities,
 // chosen game skill and live catalog readiness/selection state.
 const passiveMatch=app.match(
  /const originPassiveDynamicRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!passiveMatch)throw Error('Missing original racial passive copy source');
 const passiveRows=runInNewContext('('+passiveMatch[1]+')',{},{
  filename:'originPassiveDynamicRows',timeout:5000
 });
 const expectedPassive=['passiveChooseRaceHelp','passiveLoadingHelp',
  'passiveSelectCaption','passiveSelectedCaption',
  'passiveSelectAria','passiveSelectedAria'];
 if(!Array.isArray(passiveRows)||passiveRows.length!==expectedPassive.length||
  passiveRows.map(row=>row[0]).sort().join('|')!==expectedPassive.sort().join('|'))
  throw Error('Racial passive authorial keys changed: review migration');
 for(const [key,ru,en] of passiveRows){
  if(typeof ru!=='string'||!ru.trim()||typeof en!=='string'||!en.trim()||
   ru!==ru.trim()||en!==en.trim())
   throw Error('Racial passive phrases cannot depend on surrounding whitespace');
  const id='guideedit.book.origin.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(id,'ru',ru,'origin-racial-passive-dynamic');
  append(id,'en',en,'origin-racial-passive-dynamic');
 }

 // The two owner equipment picker surfaces reuse one frozen source catalog
 // for static labels. This selection-only half is separate from metadata,
 // source gear names, player-entered search queries and live item counts.
 const selectionMatch=app.match(
  /const equipmentPickerSelectionCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!selectionMatch)throw Error('Missing equipment picker selection copy registry');
 const selectionRows=runInNewContext('('+selectionMatch[1]+')',{},{
  filename:'equipmentPickerSelectionCopyRows',timeout:5000
 });
 const expectedSelection=[
  'pickerChoosePrefix','pickerDetails','pickerClose',
  'pickerSearchPlaceholder','pickerSearchAria','pickerUnequip',
  'pickerAvailableLabel','pickerAvailableAria','pickerMatchSuffix',
  'pickerShownSuffix','pickerMorePrefix','pickerOutfitNote','pickerLoading',
  'pickerOriginFirst','pickerNoMatches'
 ];
 if(!Array.isArray(selectionRows)||selectionRows.length!==expectedSelection.length||
  selectionRows.map(row=>row?.[0]).sort().join('|')!==expectedSelection.sort().join('|'))
  throw Error('Unexpected equipment selection copy registry');
 for(const entry of selectionRows){
  if(!Array.isArray(entry)||entry.length!==5)
   throw Error('Invalid equipment selection RU/EN source entry');
  const [key,ru,en]=entry;
  const recordKey='guideedit.book.equipment.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(recordKey,'ru',ru,'equipment-picker-selection');
  append(recordKey,'en',en,'equipment-picker-selection');
 }

 // Existing Wiki map/dungeon captions are already editable through
 // ownerCopy('wiki.map.text') and one frozen bilingual source registry.
 // Safely seed only authorial display/actions. Exclude validated limits,
 // security/destructive confirmations, dynamic source truth and errors.
 const mapSource=app.match(/const wikiMapRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!mapSource)throw Error('Missing reviewed Wiki map editorial registry');
 const mapRows=runInNewContext('('+mapSource[1]+')',{},{
  filename:'wikiMapRows',timeout:5000
 });
 const excludedMapKeys=new Set([
  'chanceUnknown','tagLimit','tagDuplicate','tagRequired',
  'sectionLimit','sectionRequired','npcRequired','npcCreateFailure',
  'createMapRequired','createMapFailure','deleteRecordButton',
  'deleteRecordLinked','deleteRecordConfirm','deleteRecordFailure'
 ]);
 if(!Array.isArray(mapRows)||mapRows.length!==58||
  new Set(mapRows.map(row=>row?.[0])).size!==58||
  mapRows.filter(row=>excludedMapKeys.has(row[0])).length!==excludedMapKeys.size)
  throw Error('Wiki map safe authorial inventory drift');
 for(const entry of mapRows){
  if(!Array.isArray(entry)||entry.length!==3)
   throw Error('Unexpected Wiki map editorial entry');
  const [key,ru,en]=entry;
  if(excludedMapKeys.has(key))continue;
  if(!/^[a-z][a-zA-Z0-9]{1,55}$/.test(key))
   throw Error('Unreviewed Wiki map copy key: '+key);
  const recordKey='guideedit.book.wiki.map.text.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(recordKey,'ru',ru,'wiki-map-authorial');
  append(recordKey,'en',en,'wiki-map-authorial');
 }

 // The existing Wiki owner panels for monsters, NPC trade, chests and items
 // share original bilingual authorial registries. Their measured numbers,
 // catalog rows, drop probabilities, item identities and dynamic reasons are
 // deliberately NOT copied into the versioned D1 defaults.
 const wikiFamilies=[
  ['wikiMonsterRows','wiki.monster.text','wiki-monster-authorial',56,
   ['chanceMissing','limitReached','createLinkFailure','createMonsterRequired',
    'createMonsterFailure','deleteRecordButton','deleteRecordLinked',
    'deleteRecordConfirm','deleteRecordFailure']],
  ['wikiNpcTradeRows','wiki.npc.trade','wiki-npc-trade-authorial',40,
   ['sellerMissing','deleteTrade','deleteAria','deleteConfirm',
    'deleteRecordButton','deleteRecordLinked','deleteRecordConfirm',
    'deleteRecordFailure']],
  ['wikiChestDisplayRows','wiki.chest.text','wiki-chest-authorial',36,
   ['certainHeading','oneGold','oneItem','keyUnlisted','contentsMissing',
    'contentsUnlisted','goldMissing','rewardMissing','deleteGroup',
    'removeReward']],
  ['wikiItemDisplayRows','wiki.item.text','wiki-item-display-authorial',29,
   ['levelRewardAbove','sourcesMissing']]
 ];
 for(const [sourceName,section,cohort,expectedRows,excludedKeys] of wikiFamilies){
  const re=new RegExp('const '+sourceName+
   '=Object\\.freeze\\((\\[[\\s\\S]*?\\])\\);');
  const source=app.match(re);
  if(!source)throw Error('Missing Wiki source editorial registry '+sourceName);
  const rows=runInNewContext('('+source[1]+')',{},{
   filename:sourceName,timeout:5000
  });
  const excluded=new Set(excludedKeys);
  if(!Array.isArray(rows)||rows.length!==expectedRows||
   new Set(rows.map(row=>row?.[0])).size!==expectedRows||
   rows.filter(row=>excluded.has(row[0])).length!==excluded.size)
   throw Error('Wiki authorial review inventory drift: '+sourceName);
  for(const entry of rows){
   if(!Array.isArray(entry)||entry.length!==3)
    throw Error('Invalid Wiki authored bilingual row in '+sourceName);
   const [key,ru,en]=entry;
   if(excluded.has(key))continue;
   if(!/^[a-z][a-zA-Z0-9]{1,55}$/.test(key))
    throw Error('Unreviewed Wiki authorial field: '+sourceName+'/'+key);
   const recordKey='guideedit.book.'+section+'.'+
    key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
   append(recordKey,'ru',ru,cohort);
   append(recordKey,'en',en,cohort);
  }
 }

 // Existing Path renderer already edits these exact static RU/EN captions
 // through ownerCopy('path',key,ru,en). Source game numbers, skill names,
 // dynamic requirements and any strings not paired with a stable key are
 // never inferred by this extractor.
 const pathSource=read('pandora-studio-hero-path.js');
 const pathRows=[...pathSource.matchAll(
  /\bauthored\(\s*api\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'/g
 )].map(match=>[match[1],match[2],match[3]]);
 const expectedPath=[
  'pathUnlockPoints','innateBaselineLabel','pathLimitPoints',
  'pathPointsPreserved','skillCatalogLoading','skillSearchEmpty',
  'skillDescriptionUnavailable','skillReady','skillUpgradeCastBefore',
  'skillUpgradeCastAfter','skillRequirementsHeading','skillPreviousLabel',
  'skillPrerequisiteMissing','skillNextLink'
 ];
 if(pathRows.length!==expectedPath.length||
  pathRows.map(row=>row[0]).sort().join('|')!==expectedPath.sort().join('|'))
  throw Error('Hero Path authored-call inventory changed: review rendered copy');
 for(const [key,ru,en] of pathRows){
  if(!ru.trim()||!en.trim())throw Error('Empty Hero Path translation: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.path.'+slug,'ru',ru,'hero-path-authorial');
  append('guideedit.book.path.'+slug,'en',en,'hero-path-authorial');
 }


 // Path budget: exact authorial words only; values and names stay game data.
 const budgetMatch=app.match(
  /const pathBudgetCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!budgetMatch)throw Error('Missing mounted Path budget source captions');
 const budgetRows=runInNewContext('('+budgetMatch[1]+')',{},{
  filename:'pathBudgetCopyRows',timeout:5000
 });
 const expectedBudget=[
  'budgetLoading','budgetAvailable','budgetSpent','budgetTotal','budgetExcess'
 ];
 if(!Array.isArray(budgetRows)||budgetRows.length!==expectedBudget.length||
  budgetRows.map(row=>row?.[0]).sort().join('|')!==expectedBudget.sort().join('|'))
  throw Error('Path budget source caption inventory drift');
 for(const [key,ru,en] of budgetRows){
  if(!/^[a-z][a-zA-Z]+$/.test(key)||
   typeof ru!=='string'||!ru.trim()||ru!==ru.trim()||
   typeof en!=='string'||!en.trim()||en!==en.trim())
   throw Error('Invalid Path budget authorial phrase: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.path.'+slug,'ru',ru,'hero-path-budget');
  append('guideedit.book.path.'+slug,'en',en,'hero-path-budget');
 }

 // The 16 authored reasons for blocked skill requirements are independent
 // of original skill names, class/branch identity and computed thresholds.
 // These rows are staging-only source fallbacks, not a production D1 write.
 const readinessMatch=pathSource.match(
  /const heroSkillReadinessCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!readinessMatch)throw Error('Missing source skill-readiness RU/EN registry');
 const readinessRows=runInNewContext('('+readinessMatch[1]+')',{},{
  filename:'heroSkillReadinessCopyRows',timeout:5000
 });
 const expectedReadinessKeys=[
  'skillGateCycle','skillGateWrongClass','skillGateUnknownLevel',
  'skillGateRequiredLevel','skillGateBadRequirements',
  'skillGateUnknownRequirement','skillGateClassMaximum',
  'skillGateTrained','skillGateClassUnavailable','skillGateAllocated',
  'skillGatePreviousMissing','skillGatePreviousRequired',
  'skillGateLearningMethod','skillGateUnknownMethod',
  'skillGateUnknownAdditional','skillGateAdditionalRequirement'
 ];
 if(!Array.isArray(readinessRows)||
  readinessRows.length!==expectedReadinessKeys.length||
  readinessRows.map(row=>row?.[0]).sort().join('|')!==expectedReadinessKeys.sort().join('|'))
  throw Error('Hero Path blocked-skill copy set changed: audit staging first');
 for(const [key,ru,en] of readinessRows){
  if(typeof ru!=='string'||!ru.trim()||ru!==ru.trim()||
   typeof en!=='string'||!en.trim()||en!==en.trim())
   throw Error('Readiness RU/EN source phrase must be nonempty and whitespace-free: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.path.'+slug,'ru',ru,'hero-path-readiness');
  append('guideedit.book.path.'+slug,'en',en,'hero-path-readiness');
 }

 // Honor uses the same ownerCopy('honor-view',key,ru,en) for its visible
 // static captions. One search-empty label renders in two branches with
 // exactly the same semantic key. Treat duplicate usage as one D1 identity.
 // The hard-coded Tuesday/Thursday reward schedule is a GAME RULE: it must
 // not become arbitrary editor copy in the new defaults snapshot.
 const honorViewSource=read('pandora-studio-honor-view.js');
 const honorRows=[...honorViewSource.matchAll(
  /\beditorial\(\s*'[^']+'\s*,\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/g
 )].map(match=>[match[1],match[2],match[3]]);
 const expectedHonor=[
  'warsHeading','warEyebrow','warNotFound','searchEmpty',
  'sectionsHeading','subtitle','pvpDoubleHeading','rewardsHeading'
 ];
 const uniqueHonor=new Map();
 for(const [key,ru,en] of honorRows){
  const current=uniqueHonor.get(key);
  if(current&&(current[0]!==ru||current[1]!==en))
   throw Error('Contradictory Honor editorial fallback: '+key);
  uniqueHonor.set(key,[ru,en]);
 }
 if(honorRows.length!==9||uniqueHonor.size!==expectedHonor.length||
  [...uniqueHonor.keys()].sort().join('|')!==expectedHonor.sort().join('|'))
  throw Error('Honor static editorial inventory changed: review before staging');
 for(const [key,[ru,en]] of uniqueHonor){
  if(!ru.trim()||!en.trim())throw Error('Empty Honor view translation: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.honor-view.'+slug,'ru',ru,'honor-view-authorial');
  append('guideedit.book.honor-view.'+slug,'en',en,'honor-view-authorial');
 }

 // Owner-only Honor form actions are source-authored UI, not gameplay data.
 // Require the exact rendered key inventory and preserve unique D1 defaults.
 const ownerActionCalls=[...honorViewSource.matchAll(
  /\bownerActionLabel\(\s*[a-z]+\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/g
 )].map(m=>[m[1],m[2],m[3]]);
 const expectedActions=['addWarAction','cancelAction','createLocationAction',
  'linkZoneAction','submitAction'];
 const uniqueActions=new Map();
 for(const [key,ru,en] of ownerActionCalls){
  if(uniqueActions.has(key)&&uniqueActions.get(key).join('|')!==[ru,en].join('|'))
   throw Error('Conflicting Honor owner action source: '+key);
  uniqueActions.set(key,[ru,en]);
 }
 if(ownerActionCalls.length!==6||uniqueActions.size!==expectedActions.length||
  [...uniqueActions.keys()].sort().join('|')!==expectedActions.sort().join('|'))
  throw Error('Honor owner actions changed: review before staging');
 for(const [key,[ru,en]] of uniqueActions){
  if(!ru.trim()||!en.trim())throw Error('Empty Honor owner action: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.honor-view.'+slug,'ru',ru,'honor-owner-actions');
  append('guideedit.book.honor-view.'+slug,'en',en,'honor-owner-actions');
 }

 // Only these reviewed native field attributes enter staging defaults;
 // passwords, user-entered values, IDs, selections and API errors do not.
 const nativeCopy=[...honorViewSource.matchAll(
  /\bownerNativeCopy\(\s*[a-z]+\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'(?:\s*,\s*true)?\s*\)/g
 )].map(m=>[m[1],m[2],m[3],m[4],m[5]]);
 const expectedNative=['locationPickerAria','locationSearchAria',
  'locationSearchPlaceholder','warNameEn','warNameRu','zoneReplaceAria'];
 if(nativeCopy.length!==expectedNative.length||
  nativeCopy.map(r=>r[0]).sort().join('|')!==expectedNative.sort().join('|'))
  throw Error('Honor native field inventory changed');
 for(const [key,ru,en,attribute,shortcut] of nativeCopy){
  if(!ru.trim()||!en.trim()||!['placeholder','aria-label'].includes(attribute)||
   !['F2','Shift+F2'].includes(shortcut))
   throw Error('Unreviewed Honor native UI field: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.honor-view.'+slug,'ru',ru,'honor-native-fields');
  append('guideedit.book.honor-view.'+slug,'en',en,'honor-native-fields');
 }

 // Seven finite, owner-visible Honor form labels are stored separately from
 // the map list, war names, selected IDs and numeric rank data. In particular
 // the option shown on an unlinked row is a *selection prompt*, not a
 // fictitious "Unlinked" save action.
 const honorFormMatch=honorViewSource.match(
  /const honorOwnerFormCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!honorFormMatch)throw Error('Missing audited Honor owner-form copy registry');
 const honorFormRows=runInNewContext('('+honorFormMatch[1]+')',{},{timeout:5000});
 const honorFormKeys=['zoneChooseOption','zoneNoMatches',
  'zoneSelectRequired','warNamesRequired','zoneRemovePrefix',
  'locationNameHint','rankFilterAria'];
 if(!Array.isArray(honorFormRows)||honorFormRows.length!==honorFormKeys.length||
  honorFormRows.map(row=>row?.[0]).sort().join('|')!==honorFormKeys.sort().join('|'))
  throw Error('Honor owner form source labels changed: deliberate review required');
 for(const [key,ru,en] of honorFormRows){
  if(!/^[a-z][a-zA-Z]+$/.test(key)||typeof ru!=='string'||!ru.trim()||
    typeof en!=='string'||!en.trim())
   throw Error('Invalid bilingual Honor owner form label: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.honor-view.'+slug,'ru',ru,'honor-owner-form-captions');
  append('guideedit.book.honor-view.'+slug,'en',en,'honor-owner-form-captions');
 }

 // Only source-authorial image and rank-accessibility copy is staged.
 // Actual game rank names, IDs and image paths remain separate.
 const accessibleMatch=honorViewSource.match(
  /const honorAccessibilityCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!accessibleMatch)throw Error('Missing Honor accessibility registry');
 const accessible=runInNewContext('('+accessibleMatch[1]+')',{},{timeout:5000});
 const expectedAccessible=['pvpEventImageAlt','rankEmblemLabel'];
 if(!Array.isArray(accessible)||accessible.length!==expectedAccessible.length||
  accessible.map(row=>row?.[0]).sort().join('|')!==expectedAccessible.sort().join('|'))
  throw Error('Unreviewed Honor accessible source keys');
 for(const [key,ru,en] of accessible){
  if(!ru?.trim?.()||!en?.trim?.())throw Error('Invalid Honor accessible label');
  const slug=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  append('guideedit.book.honor-view.'+slug,'ru',ru,'honor-accessibility');
  append('guideedit.book.honor-view.'+slug,'en',en,'honor-accessibility');
 }

 // The same Honor renderer already exposes D1/CAS captions for each
 // PvP table heading/column and generated rank requirement phrase.
 // Extract its literal source *arguments*, never the numeric row values.
 // A single source label reused by several branches has one D1 identity.
 const honorView=read('pandora-studio-honor-view.js');
 const tableCalls=[...honorView.matchAll(
  /\baddTable\('([^']+)','([^']+)','([^']+)',\s*(\[\[[\s\S]*?\]\])\s*,/g
 )].map(m=>[m[1],m[2],m[3],m[4]]);
 const expectedTables=[['pvpDaily',2],['pvpWeekly',3],['pvpHunt',3]];
 if(tableCalls.length!==expectedTables.length||
  tableCalls.some(([key,, ,headers],i)=>key!==expectedTables[i][0]||
   !Array.isArray(runInNewContext('('+headers+')',{},{
    filename:'Honor '+key+' headers',timeout:5000
   }))||runInNewContext('('+headers+')',{},{
    filename:'Honor '+key+' headers',timeout:5000
   }).length!==expectedTables[i][1]))
  throw Error('Honor PvP heading/column source inventory changed');
 for(const [key,ru,en,headerSource] of tableCalls){
  const headings=runInNewContext('('+headerSource+')',{},{
   filename:key+' PvP headers',timeout:5000
  });
  const fields=[[key+'Heading',ru,en],
   ...headings.map((pair,i)=>{
    if(!Array.isArray(pair)||pair.length!==2)
     throw Error('Invalid Honor PvP header: '+key+'/'+i);
    return [key+'Column'+i,pair[0],pair[1]];
   })];
  for(const [name,ruValue,enValue] of fields){
   if(!ruValue.trim()||!enValue.trim())
    throw Error('Empty Honor PvP copy: '+name);
   const slug=name.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
   append('guideedit.book.honor-view.'+slug,'ru',ruValue,'honor-pvp-tables');
   append('guideedit.book.honor-view.'+slug,'en',enValue,'honor-pvp-tables');
  }
 }
 const phraseCalls=[...honorView.matchAll(
  /\bphrase\('([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/g
 )].map(m=>[m[1],m[2],m[3]]);
 const expectedPhraseNames=[
  'rankReqTopLead','rankReqTopEnd','rankReqPointsLead',
  'rankReqPointsMiddle','rankReqGoldEnd','rankReqJoinNation','rankReqGoldLead'
 ];
 const uniquePhrases=new Map();
 for(const [key,ru,en] of phraseCalls){
  const old=uniquePhrases.get(key);
  if(old&&(old[0]!==ru||old[1]!==en))
   throw Error('Inconsistent reused Honor requirement phrase: '+key);
  uniquePhrases.set(key,[ru,en]);
 }
 if(phraseCalls.length!==8||uniquePhrases.size!==expectedPhraseNames.length||
  [...uniquePhrases.keys()].sort().join('|')!==expectedPhraseNames.sort().join('|'))
  throw Error('Honor generated requirement prose inventory changed');
 for(const [key,[ru,en]] of uniquePhrases){
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.honor-view.'+slug,'ru',ru,'honor-rank-phrases');
  append('guideedit.book.honor-view.'+slug,'en',en,'honor-rank-phrases');
 }
 const lists=[...honorView.matchAll(
  /\blistField\(article\.(zones|battles),'([^']+)','([^']+)','([^']+)'\)/g
 )].map(m=>[m[1],m[2],m[3],m[4]]);
 if(lists.length!==2||lists[0][0]!=='zones'||lists[1][0]!=='battles'||
  lists[0][1]!=='zones'||lists[1][1]!=='wars')
  throw Error('Honor list heading source inventory changed');
 // The same warsHeading is already sourced from literal editorial() calls.
 const originalWar=honorRows.find(row=>row[0]==='warsHeading');
 if(!originalWar||originalWar[1]!==lists[1][2]||
  originalWar[2]!==lists[1][3])
  throw Error('Contradictory Honor wars heading copy');
 append('guideedit.book.honor-view.zones-heading','ru',
  lists[0][2],'honor-list-headings');
 append('guideedit.book.honor-view.zones-heading','en',
  lists[0][3],'honor-list-headings');

 // Hero Path also renders authored fragments from conditional source
 // arrays and skill metadata labels. These never derive from the current
 // character's numbers: only the matched (key, RU, EN) literals are seeded.
 // Fail on additions/removals rather than accidentally migrating game data.
 const dynamicPathSource=read('pandora-studio-hero-path.js');
 const reviewedDynamicKeys=[
  'pathGroupTrained','pathGroupLearned','pathGroupInvested',
  'pathPointsLoading','pathBranchCapZero','pathPointsUnavailable',
  'skillCountOne','skillCountFew','skillCountMany',
  'skillUpgradeCurrentBefore','skillUpgradeFutureBefore',
  'skillUpgradeCurrentAfter','skillUpgradeFutureAfter'
 ];
 const reviewedSkillFields=[
  'skillCharacterLevel','skillMana','skillCast','skillCooldown',
  'skillRange','skillElement','skillAttribute'
 ];
 const literalSet=new Set(reviewedDynamicKeys);
 const stateRows=[...dynamicPathSource.matchAll(
  /\['([^']+)','([^']*)','([^']*)'\]/g
 )].filter(m=>literalSet.has(m[1])).map(m=>[m[1],m[2],m[3]]);
 const skillFieldRows=[...dynamicPathSource.matchAll(
  /\bfield\('([^']+)','([^']+)','([^']+)',/g
 )].map(m=>[m[1],m[2],m[3]]);
 if(stateRows.length!==reviewedDynamicKeys.length||
  stateRows.map(r=>r[0]).sort().join('|')!==reviewedDynamicKeys.sort().join('|')||
  skillFieldRows.length!==reviewedSkillFields.length||
  skillFieldRows.map(r=>r[0]).sort().join('|')!==reviewedSkillFields.sort().join('|'))
  throw Error('Hero Path conditional copy inventory changed: review live UI');
 for(const [key,ru,en] of [...stateRows,...skillFieldRows]){
  if(!ru.trim()||!en.trim())throw Error('Invalid Path authored state: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.path.'+slug,'ru',ru,'hero-path-states');
  append('guideedit.book.path.'+slug,'en',en,'hero-path-states');
 }

 // Owner-editable Hero Path aria/descriptions use bindPathCopy,
 // with any hero class, point count or skill name kept as a separate suffix.
 // The two help explanations and one weapon-range condition follow the same
 // original D1 path.* keys. Never copy the composite, calculated aria-label.
 const pathBoundRows=[...dynamicPathSource.matchAll(
  /bindPathCopy\(api,\s*\w+,'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'/g
 )].map(m=>[m[1],m[2],m[3]]);
 const expectedBound=[
  'pathHoldRepeatAria','racialUnavailableAria','branchTrackAria',
  'pathRangeAria','pathExactAria','pathMilestoneNoDesc',
  'pathMilestoneMana','pathUnlockPoints','pathMasteryAria',
  'pathDecreaseAria','pathIncreaseAria','innateBaselineAria',
  'skillBrowseAria','skillPreviousAria','skillLineageAria','skillNextAria'
 ];
 const pathHelpRows=[...dynamicPathSource.matchAll(
  /'(branchPointHelp|greenMasteryHelp)','([^']+)'\s*,\s*'([^']+)'/g
 )].map(m=>[m[1],m[2],m[3]]);
 const weaponRows=[...dynamicPathSource.matchAll(
  /\['(skillWeaponRange)','([^']+)','([^']+)'\]/g
 )].map(m=>[m[1],m[2],m[3]]);
 if(pathBoundRows.length!==expectedBound.length||
  pathBoundRows.map(r=>r[0]).sort().join('|')!==expectedBound.sort().join('|')||
  pathHelpRows.length!==2||new Set(pathHelpRows.map(r=>r[0])).size!==2||
  weaponRows.length!==1)
  throw Error('Hero Path accessibility/help source inventory changed');
 for(const [key,ru,en] of [...pathBoundRows,...pathHelpRows,...weaponRows]){
  if(key==='pathUnlockPoints'){
   // Already staged from the direct visible caption, exact shared identity.
   const existing=pathRows.find(row=>row[0]===key);
   if(!existing||existing[1]!==ru||existing[2]!==en)
    throw Error('Inconsistent Path unlock unit source fallback');
   continue;
  }
  if(!ru.trim()||!en.trim())throw Error('Missing Path accessible copy '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.path.'+slug,'ru',ru,'hero-path-accessible');
  append('guideedit.book.path.'+slug,'en',en,'hero-path-accessible');
 }

 // Branch prerequisite requirement words have separate D1 labels
 // beside live thresholds, allocated points and mastery. Two source paths
 // intentionally share the SAME exact key/text, never double-seed.
 const requirementRows=[...dynamicPathSource.matchAll(
  /\['(pathReq[a-zA-Z]+)','([^']+)','([^']+)',(?:req\.amount|cap|available|mastered|base|value|green)\]/g
 )].map(m=>[m[1],m[2],m[3]]);
 const requirementNames=[
  'pathReqThreshold','pathReqClassCap','pathReqAllocated',
  'pathReqTrained','pathReqInnate','pathReqPotential'
 ];
 const uniqueReqs=new Map();
 for(const [key,ru,en] of requirementRows){
  const existing=uniqueReqs.get(key);
  if(existing&&(existing[0]!==ru||existing[1]!==en))
   throw Error('Contradictory skill requirement copy: '+key);
  uniqueReqs.set(key,[ru,en]);
 }
 if(requirementRows.length!==8||uniqueReqs.size!==requirementNames.length||
  [...uniqueReqs.keys()].sort().join('|')!==requirementNames.sort().join('|'))
  throw Error('Path branch requirement source inventory changed');
 for(const [key,[ru,en]] of uniqueReqs){
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.path.'+slug,'ru',ru,'hero-path-requirement-captions');
  append('guideedit.book.path.'+slug,'en',en,'hero-path-requirement-captions');
 }
 // The unlock rail has two mutually exclusive authorial state captions.
 // Their eligibility and live skill thresholds come from readiness/mark;
 // never put those calculated flags, names or numbers into D1.
 const unlockState=dynamicPathSource.match(
  /word=authored\(api,mark\.locked\?'pathUnlockOverCap':'pathUnlockReady',\s*mark\.locked\?'([^']+)':'([^']+)',\s*mark\.locked\?'([^']+)':'([^']+)'/
 );
 if(!unlockState)throw Error('Path unlock state source grammar changed');
 for(const [key,ru,en] of [
  ['pathUnlockOverCap',unlockState[1],unlockState[3]],
  ['pathUnlockReady',unlockState[2],unlockState[4]]
 ]){
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.path.'+slug,'ru',ru,'hero-path-unlock-states');
  append('guideedit.book.path.'+slug,'en',en,'hero-path-unlock-states');
 }

 // Only hover hints actually mounted in the workbench should be owner
 // editable or seeded into the physical D1 defaults. The "origin" and
 // two ordinary Path tabs have self-explanatory captions; their old
 // unused CAS overrides are retained, but no fake tooltip editor appears.
 const workbenchMatch=app.match(/const WORKBENCH_HINTS=(\[[\s\S]*?\]);/);
 const suppressedMatch=app.match(
  /const SELF_EXPLANATORY_TABS=new Set\((\[[\s\S]*?\])\);/);
 if(!workbenchMatch||!suppressedMatch)
  throw Error('Missing source Workbench hover editor catalog');
 const workbenchHints=runInNewContext('('+workbenchMatch[1]+')',{},{
  filename:'WORKBENCH_HINTS',timeout:5000
 });
 const suppressedSelectors=runInNewContext('('+suppressedMatch[1]+')',{},{
  filename:'SELF_EXPLANATORY_TABS',timeout:5000
 });
 const expectedWorkbench=['hintPortrait','hintWeapon','hintNewBuild',
  'hintSaveBuild','hintReset'];
 if(!Array.isArray(workbenchHints)||workbenchHints.length!==5||
  !Array.isArray(suppressedSelectors)||suppressedSelectors.length!==5||
  new Set(workbenchHints.map(row=>row?.[1])).size!==5||
  new Set(workbenchHints.map(row=>row?.[2])).size!==5||
  workbenchHints.some(row=>suppressedSelectors.includes(row[2])))
  throw Error('Unreviewed Workbench hover copy source inventory');
 const mountedWorkbench=workbenchHints;
 if(mountedWorkbench.map(row=>row[1]).sort().join('|')!==
  expectedWorkbench.sort().join('|'))
  throw Error('Workbench mounted hover copy changed');
 for(const [section,key,selector,ru,en] of mountedWorkbench){
  if(!['equipment','path'].includes(section)||typeof selector!=='string'||
   !ru.trim()||!en.trim())throw Error('Invalid mounted workbench hint: '+key);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.'+section+'.'+slug,'ru',ru,'workbench-hover-hints');
  append('guideedit.book.'+section+'.'+slug,'en',en,'workbench-hover-hints');
 }

 // The mounted owner panels for Wiki, Skills and Stats already expose
 // these independent fixed captions using their *existing* D1 CAS key map.
 // Source exact RU/EN defaults for one version; do not seed player queries,
 // numeric stats, source record names or live search-result counts.
 const coreCopySets=[
  ['wikiCoreCopyRows','wiki-ui','wiki-core-authorial',[
   'searchPlaceholder','searchAria','backTop','backTopAria','viewAria',
   'viewList','viewGrid','backLabel','resultsShown','resultsOf',
   'resultsUnits','morePrefix','noMatches','selectPrompt',
   'placeCity','placeNation','placeOther']],
  ['skillUiCopyRows','skill-ui','skill-controls-authorial',
   ['searchPlaceholder','filterAria']],
  ['statsUiCopyRows','stats-ui','hero-stats-authorial',
   ['remainingPrefix','spentPrefix','chooseRaceClass','levelBudgetPrefix',
    'totalCaption','bonusSuffix','vitalsLoadingAria','holdStepAria',
    'decreaseAria','increaseAria','excludeBonusesAria','baseAria',
    'pointsAria','knownBonusesAria','costAria','maximumAria']]
 ];
 for(const [registry,section,cohort,keys] of coreCopySets){
  const re=new RegExp('const '+registry+
   '=Object\\.freeze\\((\\[[\\s\\S]*?\\])\\);');
  const source=app.match(re);
  if(!source)throw Error('Missing owner-copy registry '+registry);
  const rows=runInNewContext('('+source[1]+')',{},{
   filename:registry,timeout:5000
  });
  if(!Array.isArray(rows)||rows.length!==keys.length||
   rows.map(row=>row?.[0]).sort().join('|')!==keys.sort().join('|'))
   throw Error('Owner-panel RU/EN source inventory drift: '+registry);
  for(const row of rows){
   if(!Array.isArray(row)||row.length!==5)
    throw Error('Invalid source owner-panel caption: '+registry);
   const [key,ru,en]=row;
   if(!ru.trim()||!en.trim())throw Error('Empty owner-panel translation: '+key);
   const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
   append('guideedit.book.'+section+'.'+slug,'ru',ru,cohort);
   append('guideedit.book.'+section+'.'+slug,'en',en,cohort);
  }
 }

 // Reviewed catalog human-review copy is strictly authorial and dynamic
 // count values remain independent DOM nodes. Mechanic caveats, game records,
 // source errors, and publication confirmations are never imported.
 const reviewDetails=read('pandora-os-catalog-workbench.js').match(
  /const catalogReviewDetailCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!reviewDetails)throw Error('Missing original catalog review caption registry');
 const reviewRows=runInNewContext('('+reviewDetails[1]+')',{},{
  filename:'catalogReviewDetailCopyRows',timeout:5000
 });
 const expectedReview=['changedParametersLead','decisionHeading','formulaTitle',
  'heroMoreChangesLead','heroNoChange','heroSelectHelp','impactHeading',
  'moreImpactsLead','moreImpactsSuffix','linkedReferenceContext',
  'linkedReferenceOpen','hintLinkedReference',
  'unpublishedReference','emptyReviewFilter'];
 if(!Array.isArray(reviewRows)||reviewRows.length!==expectedReview.length||
  reviewRows.map(r=>r?.[0]).sort().join('|')!==expectedReview.sort().join('|'))
  throw Error('Unreviewed catalog detail editorial keys');
 for(const row of reviewRows){
  if(!Array.isArray(row)||row.length!==3||row.some(value=>
   typeof value!=='string'||!value.trim()||value!==value.trim()))
   throw Error('Invalid catalog review bilingual source caption');
  const [key,ru,en]=row,slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.catalog-sync.'+slug,'ru',ru,'catalog-review-details');
  append('guideedit.book.catalog-sync.'+slug,'en',en,'catalog-review-details');
 }

 // The four native <details> disclosures also have stable authorial
 // display captions. The clickable open state, source diagnostics and
 // independent hover hints must NEVER enter these D1 source-only fields.
 const disclosureSource=read('pandora-os-catalog-workbench.js').match(
  /const catalogDisclosureCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!disclosureSource)throw Error('Missing catalog disclosure caption inventory');
 const disclosureRows=runInNewContext('('+disclosureSource[1]+')',{},{timeout:5000});
 const expectedDisclosure=['archiveSummary','advancedSummary',
  'russianPreviewSummary','diagnosticsSummary'];
 if(!Array.isArray(disclosureRows)||
  disclosureRows.length!==expectedDisclosure.length||
  disclosureRows.map(r=>r?.[0]).sort().join('|')!==expectedDisclosure.sort().join('|'))
  throw Error('Unreviewed catalog disclosure source captions');
 for(const row of disclosureRows){
  if(!Array.isArray(row)||row.length!==3||row.some(text=>
   typeof text!=='string'||!text.trim()||text!==text.trim()))
   throw Error('Invalid RU/EN catalog disclosure caption');
  const [key,ru,en]=row,slug=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  append('guideedit.book.catalog-sync.'+slug,'ru',ru,'catalog-review-disclosures');
  append('guideedit.book.catalog-sync.'+slug,'en',en,'catalog-review-disclosures');
 }

 // Live comparison counters are NOT authorial content. Source-only
 // fragments are separately reviewed and staged under semantic D1 keys,
 // preserving in-progress owner inline edits when runtime data changes.
 const summarySource=read('pandora-os-catalog-workbench.js').match(
  /const catalogReviewStatusCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!summarySource)throw Error('Missing dynamic catalog summary copy inventory');
 const catalogStatusRows=runInNewContext('('+summarySource[1]+')',{},{timeout:5000});
 const expectedCatalogStatus=['affectedSections','selectionTotal','selectionRemaining',
  'selectionNeedsReview','selectionSettings','lineBreaksIncluded',
  'foundChanges','summaryTechnical','summarySelected','summaryUnselected',
  'summaryNeedsReview','noChanges'];
 if(!Array.isArray(catalogStatusRows)||catalogStatusRows.length!==expectedCatalogStatus.length||
  catalogStatusRows.map(row=>row?.[0]).sort().join('|')!==expectedCatalogStatus.sort().join('|'))
  throw Error('Unknown dynamic catalog summary source labels');
 for(const row of catalogStatusRows){
  if(!Array.isArray(row)||row.length!==3||row.some(v=>
   typeof v!=='string'||!v.trim()||v!==v.trim()))
   throw Error('Invalid bilingual catalog summary authorial text');
  const [key,ru,en]=row,slug=key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  append('guideedit.book.catalog-sync.'+slug,'ru',ru,'catalog-review-runtime-labels');
  append('guideedit.book.catalog-sync.'+slug,'en',en,'catalog-review-runtime-labels');
 }

 // Existing filter tooltips describe how to review data, independently of
 // each editable filter name and its calculated count. A tooltip is the only
 // reason the filter has a separate owner pencil. Closed 10-key RU/EN set.
 const hintSource=read('pandora-os-catalog-workbench.js').match(
  /const filterHintRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!hintSource)throw Error('Missing catalog filter hover-copy registry');
 const filterHints=runInNewContext('('+hintSource[1]+')',{},{
  filename:'filterHintRows',timeout:5000
 });
 const expectedHintIds=['all','added','changed','removed','accepted',
  'declined','needsReview','links','sameVisible','readable'];
 if(!Array.isArray(filterHints)||filterHints.length!==expectedHintIds.length||
  filterHints.map(row=>row?.[0]).sort().join('|')!==expectedHintIds.sort().join('|'))
  throw Error('Unexpected catalog filter hover-copy keys');
 for(const row of filterHints){
  if(!Array.isArray(row)||row.length!==3||row.some(v=>
   typeof v!=='string'||!v.trim()||v!==v.trim()))
   throw Error('Invalid bilingual filter hover explanation');
  const [id,ru,en]=row;
  const key='hintReviewFilter'+id[0].toUpperCase()+id.slice(1);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.catalog-sync.'+slug,'ru',ru,'catalog-review-filter-hover');
  append('guideedit.book.catalog-sync.'+slug,'en',en,'catalog-review-filter-hover');
 }

 // The 10 live catalog filter captions are source-authored. The associated
 // result counts, selection sets, game-source values and hover explanations
 // have separate identities and NEVER belong to these label rows.
 const filterMatch=read('pandora-os-catalog-workbench.js').match(
  /const filterChoices=(\[[\s\S]*?\]);/);
 if(!filterMatch)throw Error('Missing catalog filter caption source');
 const filterRows=runInNewContext('('+filterMatch[1]+')',{},{
  filename:'filterChoices',timeout:5000
 });
 const expectedFilters=['all','added','changed','removed','accepted','declined',
  'needsReview','links','sameVisible','readable'];
 if(!Array.isArray(filterRows)||filterRows.length!==expectedFilters.length||
  filterRows.map(row=>row?.[0]).sort().join('|')!==expectedFilters.sort().join('|'))
  throw Error('Unreviewed catalog filter caption inventory');
 for(const row of filterRows){
  if(!Array.isArray(row)||row.length!==3||row.some(value=>
   typeof value!=='string'||!value.trim()||value!==value.trim()))
   throw Error('Invalid source catalog filter caption');
  const [id,ru,en]=row;
  const key='reviewFilter'+id[0].toUpperCase()+id.slice(1);
  const slug=key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append('guideedit.book.catalog-sync.'+slug,'ru',ru,'catalog-review-filter-captions');
  append('guideedit.book.catalog-sync.'+slug,'en',en,'catalog-review-filter-captions');
 }

 // Footer source copy is four static RU/EN fragments around three
 // immutable, current-catalog counts. Never materialize numeric values.
 const footerMatch=app.match(
  /const catalogCountParts=Object\.freeze\((\[[\s\S]*?\])\);/);
 if(!footerMatch)throw Error('Missing source encyclopedia footer copy');
 const footerParts=runInNewContext('('+footerMatch[1]+')',{},{
  filename:'catalogCountParts',timeout:5000
 });
 if(!Array.isArray(footerParts)||footerParts.length!==4||
  footerParts.map(row=>row?.[0]).join('|')!=='lead|skills|items|souls')
  throw Error('Unreviewed encyclopedia footer copy keys');
 for(const [key,ru,en] of footerParts){
  if(typeof ru!=='string'||!ru.trim()||
   typeof en!=='string'||!en.trim())throw Error('Invalid footer copy '+key);
  const recordKey='guideedit.book.catalog-sync.catalog-count-'+key;
  append(recordKey,'ru',ru,'catalog-footer-authorial');
  append(recordKey,'en',en,'catalog-footer-authorial');
 }

 // All 36 fixed calculated stat names in A/B are authored RU/EN
 // captions. Do NOT stage numeric calculations, summaries, saved-build
 // identities or live selected character values.
 const metricRoot={};
 runInNewContext(read('pandora-studio-build-comparison.js'),{window:metricRoot},
  {filename:'pandora-studio-build-comparison.js',timeout:5000});
 const metrics=metricRoot.PandoraBuildComparison?.metricCopyRows;
 const expectedMetricIds=[
  'hp','mp','attack','magicAttack','defense','frontAttack','backAttack',
  'meleeRange','rangedRange','physicalFlat','physicalResist','magicDamageResist',
  'accuracy','frontAccuracy','dodge','rangedEvasion','crit','critResist',
  'critDamage','critDamageResist','attackSpeed','moveSpeed','townSpeed',
  'castSpeed','castTime','cooldown','fire','ice','lightning','poison','charm',
  'light','dark','physicalConditions','mentalConditions','magic'
 ];
 if(!Array.isArray(metrics)||metrics.length!==expectedMetricIds.length||
  metrics.map(row=>row?.[0]).sort().join('|')!==expectedMetricIds.sort().join('|'))
  throw Error('The A/B metric registry changed: review owner-copy identities');
 for(const row of metrics){
  if(!Array.isArray(row)||row.length!==3)
   throw Error('Invalid source A/B RU/EN metric caption');
  const [id,ru,en]=row;
  const key='guideedit.book.compare-metric.'+
   id.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  append(key,'ru',ru,'comparison-metric');
  append(key,'en',en,'comparison-metric');
 }

 // The Wiki chapters, all five Honor subchapters and skill filters are
 // one existing D1 JSON record. Preserve their exact field identities;
 // never reconstruct these labels from list position or save them as game IDs.
 for(const [group,registry] of [
  ['chapter',wiki.chapter],['honor',wiki.honor],['skillFilter',wiki.skillFilter]
 ]){
  for(const [id,names] of Object.entries(registry)){
   if(!Array.isArray(names)||names.length!==2)
    throw Error('Invalid bilingual Wiki label default: '+group+'/'+id);
   for(const [index,lang] of ['ru','en'].entries())
    append('guideedit.wiki.labels',wiki.key(group,id,lang),names[index],'wiki-labels');
  }
 }

 // Summary tooltip keys are position-defined in the existing public UI.
 // Only source-authored explanations are materialized, never live stats.
 const summaryRows=book.summaryRows({}).flatMap(group=>group.rows);
 const unmappedHints=[];
 for(const [caption,pair] of Object.entries(guide.hints)){
  const index=summaryRows.findIndex(row=>row.ru===caption);
  if(index<0){unmappedHints.push(caption);continue}
  for(const [offset,field] of ['hintRu','hintEn'].entries())
   if(pair[offset])append('guideedit.book.summary.'+index,field,pair[offset],
    'summary-hints');
 }

 // Semantic Book help fields may exist without a fixed heading literal.
 // These are independent hover explanations, not editable game parameters.
 for(const [key,pair] of Object.entries(guide.help))
  for(const [offset,field] of ['hintRu','hintEn'].entries())
   if(pair[offset])append('guideedit.book.'+key,field,pair[offset],
    'semantic-hints');

 // Honor overview has its own existing D1 data schema. Preserve each
 // authorial field and do not seed live rank thresholds or numeric rewards.
 for(const [field,value] of Object.entries(guide.intro))
  if(typeof value==='string'&&value.trim())
   append('guideedit.honor.overview',field,value,'honor-overview');
 for(const rank of guide.defaultRanks){
  if(!Number.isInteger(rank.id)||rank.id<0||rank.id>11)
   throw Error('Unexpected Honor rank identity');
  for(const field of ['nameRu','nameEn','benefitRu','benefitEn'])
   if(typeof rank[field]==='string'&&rank[field].trim())
    append('guideedit.honor.rank.'+rank.id,field,rank[field],
     'honor-rank-copy');
 }
 records.sort((a,b)=>byCodepoint(a.recordKey,b.recordKey)||
  byCodepoint(a.field,b.field));
 // The read-only Worker reader refuses oversized snapshots. A successful
 // planner must NEVER generate a version that the matching reader rejects.
 if(records.length>3000||
  records.reduce((sum,row)=>sum+row.value.length,0)>450000)
  throw Error('Authored defaults exceed versioned D1 reader limits');
 const payload={schema:1,release,records};
 const digest=sha256(JSON.stringify(payload));
 return Object.freeze({...payload,digest,
  snapshot:release+'-'+digest.slice(0,16),
  stats:Object.freeze({
   entries:records.length,recordKeys:new Set(records.map(r=>r.recordKey)).size,
   cohorts,unmappedHints:unmappedHints.sort(byCodepoint)
  })});
}

// Wrangler D1 --json wraps the SELECT result in a one-query envelope.
// Require exactly one successful statement and one JSON text column. Never
// accept an import summary, extra query results or ambiguous multiple rows.
export function parseWranglerEditorialReadback(raw){
 if(typeof raw!=='string'||raw.length>6_000_000)
  throw Error('Wrangler readback size or type is invalid');
 let output;
 try{output=JSON.parse(raw)}catch{throw Error('Wrangler readback is not JSON')}
 if(!Array.isArray(output)||output.length!==1)
  throw Error('Exactly one Wrangler SQL statement is required');
 const query=output[0];
 if(query?.success!==true||!Array.isArray(query.results)||query.results.length!==1)
  throw Error('Wrangler SQL query failed or result count is ambiguous');
 const row=query.results[0];
 if(!row||typeof row!=='object'||Array.isArray(row)||
  Object.keys(row).length!==1||
  typeof row.staging_readback_json!=='string')
  throw Error('Expected only the staging_readback_json text column');
 try{
  const data=JSON.parse(row.staging_readback_json);
  if(!data||typeof data!=='object'||Array.isArray(data)||
   !Object.hasOwn(data,'metadata')||!Object.hasOwn(data,'rows'))
   throw Error('Readback payload shape is invalid');
  return data;
 }catch{throw Error('Wrangler staging_readback_json is malformed')}
}

// Validate a complete readback from an isolated D1 import, not just the
// number of imported rows. No browser/Worker activity or persistence occurs.
export function verifyEditorialDefaultsReadback(manifest,metadata,readbackRows){
 const fail=reason=>({ok:false,reason});
 if(!metadata||!Array.isArray(readbackRows))return fail('missing-readback');
 if(metadata.snapshot!==manifest.snapshot||
  metadata.source_release!==manifest.release||
  metadata.sha256!==manifest.digest||
  metadata.expected_rows!==manifest.records.length)
  return fail('snapshot-metadata-mismatch');
 if(readbackRows.length!==manifest.records.length)
  return fail('row-count-mismatch');
 const seen=new Set(),rows=[];
 for(const input of readbackRows){
  if(!input||typeof input!=='object')return fail('invalid-record');
  const row={recordKey:input.record_key??input.recordKey,
   field:input.field,value:input.value};
  if(Object.values(row).some(value=>typeof value!=='string'))
   return fail('invalid-record');
  const key=row.recordKey+'\u0000'+row.field;
  if(seen.has(key))return fail('duplicate-record');
  seen.add(key);rows.push(row);
 }
 rows.sort((a,b)=>byCodepoint(a.recordKey,b.recordKey)||
  byCodepoint(a.field,b.field));
 const digest=sha256(JSON.stringify({
  schema:manifest.schema,release:manifest.release,records:rows
 }));
 if(digest!==manifest.digest)return fail('content-digest-mismatch');
 return {ok:true,checkedRows:rows.length,snapshot:manifest.snapshot,digest};
}

export function renderEditorialDefaultsSQL(manifest){
 // Refuse stale/corrupt caller-provided data before returning executable SQL.
 assertVerifiedManifest(manifest);
 const rows=manifest.records;
 const lines=[
  '-- DRY RUN SQL ONLY. Review and back up D1 before a separate authorized import.',
  '-- No deployment/import happens by running the planning script.',
  '-- Only a complete verified snapshot may be activated by a future reader.',
  'CREATE TABLE IF NOT EXISTS editorial_default_rows ('+
   'snapshot TEXT NOT NULL, record_key TEXT NOT NULL, field TEXT NOT NULL, '+
   'value TEXT NOT NULL, PRIMARY KEY(snapshot,record_key,field));',
  'CREATE TABLE IF NOT EXISTS editorial_default_snapshots ('+
   'snapshot TEXT PRIMARY KEY, source_release TEXT NOT NULL, sha256 TEXT NOT NULL, '+
   'expected_rows INTEGER NOT NULL, installed_at INTEGER NOT NULL);'
 ];
 for(const r of rows)lines.push(
  'INSERT INTO editorial_default_rows(snapshot,record_key,field,value) VALUES ('+
   [manifest.snapshot,r.recordKey,r.field,r.value].map(sqlString).join(',')+
   ') ON CONFLICT(snapshot,record_key,field) DO NOTHING;');
 // Insert the marker last. A partial upload has no completed snapshot entry.
 // A future reader MUST also verify exact count and digest before activation.
 lines.push('INSERT INTO editorial_default_snapshots('+
  'snapshot,source_release,sha256,expected_rows,installed_at) VALUES ('+
  [sqlString(manifest.snapshot),sqlString(manifest.release),
   sqlString(manifest.digest),String(rows.length),
   "unixepoch()"].join(',')+
  ') ON CONFLICT(snapshot) DO NOTHING;');
 lines.push('-- Readback check; mismatch means DO NOT activate:');
 lines.push('SELECT COUNT(*) AS actual_rows FROM editorial_default_rows WHERE snapshot='+
  sqlString(manifest.snapshot)+';');
 lines.push('SELECT snapshot,source_release,sha256,expected_rows '+
  'FROM editorial_default_snapshots WHERE snapshot='+
  sqlString(manifest.snapshot)+';');
 return lines.join('\n')+'\n';
}


// SELECT-only, one-row JSON export. Force JSON subtypes after SQLite\n// scalar-subquery boundaries to keep metadata/rows as objects/arrays.\n// Save the *column value* as a JSON file,
// then feed it to --verify-readback; never trust an import exit code alone.
export function renderEditorialDefaultsReadbackSQL(manifest){
 const snapshot=sqlString(assertVerifiedManifest(manifest));
 return [
  '-- STAGING READBACK ONLY. Returns one JSON document to verify offline.',
  "SELECT json_object("+
   "'metadata',json((SELECT json_object("+
    "'snapshot',snapshot,'source_release',source_release,"+
    "'sha256',sha256,'expected_rows',expected_rows)"+
    " FROM editorial_default_snapshots WHERE snapshot="+snapshot+")),"+
   "'rows',json((SELECT json_group_array(json_object("+
    "'record_key',record_key,'field',field,'value',value))"+
    " FROM (SELECT record_key,field,value FROM editorial_default_rows"+
    " WHERE snapshot="+snapshot+" ORDER BY record_key,field))))"+
   " AS staging_readback_json;"
 ].join('\n')+'\n';
}

// Explicit, snapshot-scoped STAGING rollback plan; it cannot touch CAS,
// accounts, game catalogs, builds, or any other release. The marker is
// deleted FIRST so even a partial rollback fails closed in the Worker.
export function renderEditorialDefaultsRollbackSQL(manifest){
 const snapshot=sqlString(assertVerifiedManifest(manifest));
 return [
  '-- STAGING ONLY. Requires a separate approved, backed-up D1 execution.',
  '-- NEVER run this SQL against production D1.',
  '-- Deactivate this exact version before removing its immutable rows.',
  'DELETE FROM editorial_default_snapshots WHERE snapshot='+snapshot+';',
  'DELETE FROM editorial_default_rows WHERE snapshot='+snapshot+';',
  'SELECT COUNT(*) AS remaining_markers FROM editorial_default_snapshots WHERE snapshot='+snapshot+';',
  'SELECT COUNT(*) AS remaining_rows FROM editorial_default_rows WHERE snapshot='+snapshot+';'
 ].join('\n')+'\n';
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const manifest=buildEditorialDefaultsManifest();
 const format=process.argv[2]||'--report';
 if(format==='--sql')process.stdout.write(renderEditorialDefaultsSQL(manifest));
 else if(format==='--readback-sql')process.stdout.write(renderEditorialDefaultsReadbackSQL(manifest));
 else if(format==='--staging-rollback-sql')process.stdout.write(renderEditorialDefaultsRollbackSQL(manifest));
 else if(format==='--json')process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
 else if(format==='--verify-readback'||format==='--verify-wrangler-readback'){
  const filename=process.argv[3];
  if(!filename){process.stderr.write('Missing staging readback JSON path\n');process.exitCode=2;}
  else {
   try{
    const input=readFileSync(resolve(filename),'utf8');
    const data=format==='--verify-wrangler-readback'?
     parseWranglerEditorialReadback(input):JSON.parse(input);
    const verdict=verifyEditorialDefaultsReadback(
     manifest,data?.metadata,data?.rows);
    process.stdout.write(JSON.stringify(verdict,null,2)+'\n');
    if(!verdict.ok)process.exitCode=1;
   }catch(error){
    process.stderr.write('Invalid staging readback file: '+error.message+'\n');
    process.exitCode=2;
   }
  }
 }
 else if(format==='--report')process.stdout.write(JSON.stringify({
  schema:manifest.schema,release:manifest.release,
  snapshot:manifest.snapshot,digest:manifest.digest,
  ...manifest.stats,note:'No D1 writes or network calls performed'
 },null,2)+'\n');
 else{
  process.stderr.write('Usage: node scripts/plan-editorial-d1-defaults.mjs '+
   '[--report|--json|--sql|--readback-sql|--staging-rollback-sql|--verify-readback <staging-readback.json>|--verify-wrangler-readback <wrangler-output.json>]\n');
  process.exitCode=2;
 }
}
