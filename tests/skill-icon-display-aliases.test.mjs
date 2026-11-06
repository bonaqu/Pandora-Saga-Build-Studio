import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isWebP} from '../scripts/icon-utils.mjs';
import {buildSkillDisplayAliases,rankFamily} from '../scripts/skill-icon-display-aliases.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const skills=JSON.parse(read('data/os/skills.json').toString('utf8'));
const manifest=JSON.parse(read('assets/os-icon-manifest.json').toString('utf8'));
const byStem=new Map(Object.values(skills).map(row=>['skill_'+row.iconId,row]));
const aliases=manifest.displayAliases?.skills||{};
const absent=manifest.missing.filter(row=>row.kind==='skills');

test('display-only aliases are deterministic and do not alter original icon inventories',()=>{
 assert.equal(manifest.count.present,1173);
 assert.equal(manifest.count.missing,264);
 assert.equal(absent.length,260);
 assert.deepEqual(aliases,buildSkillDisplayAliases(skills,manifest.icons.skills,manifest.missing));
 assert.equal(Object.keys(aliases).length,201);
 for(const [target,donor] of Object.entries(aliases)){
  assert.ok(absent.some(row=>row.stem===target),'Only absent originals can be reused');
  assert.ok(manifest.icons.skills[donor],'Only preserved local originals may donate art');
  assert.ok(!manifest.icons.skills[target],'No alias may forge a recovered original');
  assert.ok(byStem.has(target)&&byStem.has(donor));
  const a=byStem.get(target).name,b=byStem.get(donor).name;
  assert.ok(a===b||rankFamily(a)===rankFamily(b),
   'Unrelated skills must not share a display alias: '+a+' vs '+b);
 }
});
test('all explicitly requested user examples have display-only source icons',()=>{
 const expected={
  'skill_620002032':'skill_620002031', // Катапульта
  'skill_620002012':'skill_620002011', // Таран
  'skill_161202050':'skill_161202001', // Контратака
  'skill_260006002':'skill_260006001', // Помощь ветра
  'skill_240004050':'skill_240004001', // Пружинная ловушка
  'skill_500000020':'skill_500000047', // Огненный взрыв
  'skill_600000232':'skill_600000231', // Магистр магии II
  'skill_600000222':'skill_600000221', // Магистр битвы II
  'skill_600000212':'skill_600000211', // Магистр исцеления II
  'skill_600000202':'skill_600000201', // Магистр чести II
  'skill_600000082':'skill_600000081', // Магическая устойчивость II
  'skill_600000072':'skill_600000071', // Физическая устойчивость II
  'skill_600000062':'skill_600000061', // Опыт гильдии II
  'skill_600000052':'skill_600000051', // Честь гильдии II
  'skill_600000042':'skill_600000041', // Мощь гильдии II
  'skill_600000032':'skill_600000031', // Восстановление духа II
  'skill_600000022':'skill_600000021', // Восстановление силы II
  'skill_600000012':'skill_600000011', // Дух гильдии II
  'skill_600000002':'skill_600000001'  // Сила гильдии II
 };
 for(const [target,source] of Object.entries(expected))
  assert.equal(aliases[target],source,target);
});
test('remaining 59 skill entries display supplied unknown question-mark icon',()=>{
 assert.equal(absent.length-Object.keys(aliases).length,59);
 const unknown=read('assets/skills/icons/skill_unknown.webp');
 assert.equal(isWebP(unknown),true);
 assert.ok(unknown.length<5000,'Keep lightweight, original-resolution icon');
 assert.equal(aliases.skill_500000001,undefined,'Sleep is not an icon for some other skill');
 assert.equal(aliases.skill_620002051,undefined,'No invented Ballista art');
});
