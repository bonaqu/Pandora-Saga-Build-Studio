import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../pandora-os-catalog-workbench.js',import.meta.url),'utf8');
test('#815 ordinary game-catalog update needs only check → choose → apply',()=>{
 assert.match(source,/actions\.append\(action\(live,'liveButton'/);
 const normal=source.slice(source.indexOf("actions.append(action(live,'liveButton'"),
  source.indexOf('// Each action tooltip has independent RU/EN'));
 assert.match(normal,/reviewSteps/);
 assert.match(normal,/secondaryHint\(advanced/);
 assert.doesNotMatch(normal,/secondaryHint\(archiveChoice/);
 assert.match(source,/advanced\.insertBefore\(secondaryHint\(archiveChoice,'hintArchiveDisclosure'/);
 assert.match(source,/const archiveChoice=h\('details'/);
});
test('#815 source failure reveals Archive inside Advanced automatically',()=>{
 const trigger=source.indexOf("if(unavailable){");
 assert.ok(trigger>0);
 const nearby=source.slice(trigger,trigger+200);
 assert.match(nearby,/advanced\.open=true/);
 assert.match(nearby,/archiveChoice\.open=true/);
 assert.match(source,/Сравни текущие игровые данные с каталогом сайта/);
 assert.match(source,/Compare current game data with your site's catalog/);
});
