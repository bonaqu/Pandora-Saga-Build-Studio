import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {skillIdentityAudit,candidatePlayer} from '../scripts/report-skill-identity-overlaps.mjs';

const data=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
const report=skillIdentityAudit(data);

test('diagnose overlapping, catalog-eligible skill names without hiding them',()=>{
 assert.equal(report.summary.allSkillRecords,569);
 assert.equal(report.summary.eligiblePlayerRows,232);
 assert.equal(report.summary.repeatedPlayerNames,19);
 assert.equal(report.summary.eligibleRowsInRepeatedNames,41);
 assert.equal(report.summary.groupsWithOverlappingClassAssignments,19);
 assert.equal(report.ambiguousNames.some(row=>row.name==='контратака'),false,
  'Only one Counterattack entry has learnable and class assignment');
 const blocking=report.ambiguousNames.find(row=>row.name==='блокирование');
 assert.equal(blocking.candidates.length,3);
 assert.ok(blocking.overlappingClasses.length>0);
 assert.ok(blocking.candidates.every(row=>!('active' in row)),
  'Metadata must not label versions as currently active');
});
test('classless learnable records stay separate from character skills and preserve effect parent link',()=>{
 assert.equal(report.summary.learnableButClassless,2);
 const wind=report.learnableButClassless.find(row=>row.name==='Помощь ветра');
 const temple=report.learnableButClassless.find(row=>row.name==='Храм');
 assert.equal(wind.id,260006002);
 assert.equal(temple.id,310023002);
 assert.deepEqual(temple.calledBy,[{id:310023001,name:'Храм'}]);
 assert.equal(candidatePlayer(data[temple.id]),false);
});
