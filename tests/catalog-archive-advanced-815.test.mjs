import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('pandora-os-catalog-workbench.js');
const css=read('pandora-studio-build-comparison.css');
test('#815 archive comparison is an optional advanced action while live comparison stays primary',()=>{
 assert.match(source,/const archiveChoice=h\('details'/);
 assert.match(source,/advanced\.append\(\s*secondaryHint\(archiveChoice,'hintArchiveDisclosure'/);
 assert.match(source,/actions\.append\(action\(live,'liveButton'[\s\S]*?reviewSteps,[\s\S]*?secondaryHint\(advanced,'hintAdvancedDisclosure'/);
 const topLevel=source.slice(source.indexOf('actions.append(action(live'),source.indexOf('    // Each action tooltip'));
 assert.doesNotMatch(topLevel,/secondaryHint\(archiveChoice/);
 assert.match(source,/const archive\s*=\s*h\('button'/);
 assert.match(source,/action\(archive,'archiveButton'/);
 assert.match(css,/\.build-library-search-wrap>\.build-library-clear\[hidden\]\{display:none\}/);
});
