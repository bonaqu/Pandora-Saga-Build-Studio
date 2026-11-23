import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const view=read('pandora-os-catalog-workbench.js');
const app=read('pandora-studio-app.js');
const css=read('pandora-os-catalog-workbench.css');
const guideRoot={};guideRoot.window=guideRoot;
runInNewContext(read('pandora-studio-honor-guide.js'),guideRoot);

test('catalog workbench labels have stable RU/EN D1 identifiers',()=>{
 const labels=['title','introExplanation','archiveExplanation','reviewExplanation',
  'formattingExplanation','russianDescriptionExplanation','checksumExplanation',
  'advancedExplanation','liveButton','archiveButton','acceptAllButton',
  'declineAllButton','publishButton','testWriteButton','testCasButton',
  'githubButton','exportButton'];
 for(const key of labels){
  assert.ok(view.includes("'"+key+"'"),key);
  const d1='book.catalog-sync.'+key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(guideRoot.PandoraHonorGuide.validOverride(d1,
   JSON.stringify({ru:'Подпись',en:'Caption'})),true,d1);
 }
 assert.match(view,/copyLabel\?\.\(key,ru,en\)\|\|tr\(ru,en\)/);
 assert.match(view,/editLabel\(node,key,ru,en\)/);
 assert.match(app,/ownerCopy\('catalog-sync',key,ru,en\)/);
 assert.match(app,/node,'catalog-sync',key,ru,en,callbacks/);
});

test('catalog editor edits real captions directly and never activates publish on a double-click',()=>{
 assert.match(view,/const wrap=h\('span',\{class:'os-sync-action-editor'/);
 assert.match(view,/wrap\.addEventListener\('dblclick'/);
 assert.match(view,/wrap\.addEventListener\('keydown'/);
 assert.match(view,/button\.addEventListener\('click',event=>/);
 assert.match(view,/event\.preventDefault\(\);event\.stopImmediatePropagation\(\)/);
 assert.match(view,/button\.hidden=true;host\.hidden=false/);
 assert.match(view,/host\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(view,/onFinished:\(\)=>\{button\.hidden=false;host\.hidden=true\}/);
 assert.match(view,/const authored=\(tag,attrs,key,ru,en\)=>/);
 assert.match(view,/editLabel\(node,key,ru,en\)/);
 assert.match(view,/class:'os-sync-copy-field'/);
 assert.match(view,/caption\.addEventListener\('click'/);
 assert.match(view,/const box=caption\.closest\('\.os-sync-formatting-option'\)\?\.querySelector/);
 assert.match(view,/box\.click\(\)/);
 for(const legacy of ['os-sync-owner-pencil','os-sync-copy-pencil',
  'os-sync-choice-pencil','os-sync-state-pencil']){
  assert.equal(view.includes(legacy),false,'Removed visible caption pencil: '+legacy);
  assert.equal(css.includes(legacy),false,'Removed decorative caption CSS: '+legacy);
 }
 assert.match(css,/\.os-sync-action-editor>\.button-action:disabled\{pointer-events:none\}/);
 assert.match(css,/\.os-sync-actions>\.os-sync-action-editor\{width:100%\}/);
 assert.match(css,/\.os-sync-action-edit-host\.origin-copy-editable::after\{content:none\}/);
 assert.match(css,/\.os-sync-copy-field>\.origin-copy-editable::after\{content:none\}/);
});

test('catalog copy Undo refreshes only authored text and cannot rewrite D1 catalog',()=>{
 assert.match(app,/function refreshVisibleOwnerCopy\(recordKey\)/);
 assert.match(app,/\(origin\|equipment\|path\|catalog-sync\|honor-view\|owner-history\|owner-dialog\|wiki-ui\|skill-ui\|stats-ui\|compare-metric\)/);
 assert.match(app,/refreshVisibleOwnerCopy\(last\.key\);saveView\(\)/);
 assert.match(app,/key\.startsWith\('book\.catalog-sync\.'\)/);
 assert.match(app,/!key\.startsWith\('book\.catalog-sync\.'\)/);
 assert.match(view,/request\('\/api\/admin\/catalog\/publish'/);
 assert.match(view,/if\(!confirm\(tr\(\s*'Создать отдельный GitHub PR/);
 assert.match(view,/if\(!confirm\(tr\(\s*'Проверить конфликты правок/);
});


test('#390 linked-item hover help and opening caption have independent owner D1 editors',()=>{
 const source=view.match(/const catalogReviewDetailCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(source,'Reviewed RU/EN source registry is present');
 const rows=runInNewContext('('+source[1]+')',{});
 const found=rows.filter(([key])=>['linkedReferenceOpen','hintLinkedReference'].includes(key));
 assert.equal(found.length,2);
 for(const [key,ru,en] of found){
  const slug=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(guideRoot.PandoraHonorGuide.validOverride('book.catalog-sync.'+slug,
   JSON.stringify({ru,en})),true);
 }
 // Player click remains an ordinary encoded in-app anchor; owner caption is
 // a sibling, not inside an anchor that would open a new tab on first click.
 assert.match(view,/const itemHref='#wiki\/item\/'\+encodeURIComponent\(segment.id\)/);
 assert.match(view,/if\(canEdit&&typeof editLabel==='function'\)\{\s*const opener=h\('span',\{class:'os-sync-reference-open-editor'\}\)/);
 assert.match(view,/reviewCaption\('span',\{class:'os-sync-reference-open-copy'\},'linkedReferenceOpen'\)/);
 assert.match(view,/h\('a',\{href:itemHref,target:'_blank',rel:'noopener noreferrer',/);
 assert.match(view,/text:copy\(openRow\[0\],openRow\[1\],openRow\[2\]\)\+' ↗'/);
 assert.match(view,/preview\.append\(opener\)/);
 // The only owner pencil is for the genuine, separately authored tooltip.
 assert.match(view,/hint\(button,copy\(tooltipKey,tooltipRu,tooltipEn\)\)/);
 assert.match(view,/button\.dataset\.guideOwnerKey=tooltipKey/);
 assert.match(view,/editLabel\(host,tooltipKey,tooltipRu,tooltipEn,\{/);
 assert.match(view,/onCommitted:next=>\{button\.dataset\.guideHint=next\}/);
 assert.match(view,/reference\.append\(pencil,host\)/);
 assert.match(view,/reference\.append\(button\);/);
 assert.ok(view.indexOf('reference.append(button);')<
  view.indexOf('reference.append(pencil,host);'),
  'Tab order must reach source button before revealing its tooltip pencil');
 assert.match(css,/\.os-sync-reference:hover>\.os-sync-reference-hint-pencil/);
 assert.match(css,/@media\(hover:none\)/);
 assert.match(css,/\.os-sync-reference-hint-pencil\[hidden\]/);
 assert.doesNotMatch(view,/class:'os-sync-reference-caption-pencil'/);
});

test('#390 native catalog disclosures edit RU/EN caption without double-click toggling',()=>{
 const source=view.match(/const catalogDisclosureCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
 assert.ok(source);
 const rows=runInNewContext('('+source[1]+')',{});
 const expected=['archiveSummary','advancedSummary','russianPreviewSummary','diagnosticsSummary'];
 assert.deepEqual(Array.from(rows,row=>String(row[0])).sort(),expected.sort());
 for(const [key,ru,en] of rows){
  assert.equal(guideRoot.PandoraHonorGuide.validOverride(
   'book.catalog-sync.'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),
   JSON.stringify({ru,en})),true,key);
  assert.ok(view.includes("disclosureCaption('"+key+"')"),key);
 }
 assert.match(view,/const summary=h\('summary',\{\},\[caption\]\)/);
 assert.match(view,/editLabel\(caption,key,row\[1\],row\[2\]\)/);
 assert.match(view,/if\(!event\.detail\|\|!caption\.contains\(event\.target\)\)return/);
 assert.match(view,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
 assert.match(view,/if\(pending\)\{clearTimeout\(pending\);pending=null;return\}/);
 assert.match(view,/details\.open=!details\.open/);
 assert.match(view,/caption\.addEventListener\('dblclick'/);
 assert.match(view,/if\(event\.target===summary&&event\.key==='F2'\)/);
 assert.match(css,/\.os-sync-disclosure-caption\.origin-copy-editable::after\{content:none\}/);
 assert.match(view,/secondaryHint\(advanced,'hintAdvancedDisclosure'/);
 assert.match(view,/secondaryHint\(archiveChoice,'hintArchiveDisclosure'/);
});
