import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const sandbox={window:{}};
vm.runInNewContext(readFileSync(new URL('../rules.js',import.meta.url),'utf8'),sandbox);
const r=sandbox.window.PandoraStudioRules;
test('known class and branch requirements',()=>{const s={classes:{CLERIC:1},charLevel:20,reqs:[{branch:'brush',amount:8}]};
assert.equal(r.readiness(s,{job:'CLERIC',level:50,points:{brush:7}}).status,'locked');
assert.equal(r.readiness(s,{job:'CLERIC',level:50,points:{brush:8}}).status,'eligible');
assert.equal(r.readiness(s,{job:'WARRIOR',level:50,points:{brush:8}}).status,'locked');
assert.equal(r.readiness({...s,prereq:'unknown'},{job:'CLERIC',level:50,points:{brush:8}}).status,'unknown')});
test('class caps and equipment compatibility',()=>{
assert.equal(r.branchCap({CLERIC:{branchCaps:{brush:15}}},'CLERIC','brush'),15);
assert.equal(r.equipment({slot:'weapon',level:40,classes:{WARRIOR:1}},{slot:'weapon',job:'WARRIOR',level:50}).allowed,true);
assert.equal(r.equipment({slot:'weapon',level:40,classes:{WARRIOR:1}},{slot:'weapon',job:'CLERIC',level:50}).allowed,false)});
