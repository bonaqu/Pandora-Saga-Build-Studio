import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-hero-book.js',import.meta.url),'utf8');
const load=lang=>{
 const root={};
 Function('window','document',source)(root,{documentElement:{lang}});
 return root.PandoraStageAttributes;
};
const sample=()=>({
 hp:1827,mp:341,potion:{percent:100},healingSkill:{percent:100},
 combat:{
  attack:{known:179},frontAttack:0,backAttack:15,backAttackEquipmentRate:3,
  magicAttack:{known:102},accuracy:{known:104},
  critical:{known:6},criticalDamage:100,dodge:{known:163},
  defense:{known:0},criticalIncoming:-4,criticalIncomingDamage:100,
  manaCost:{remaining:95},attackSpeed:{known:120},castingSpeed:{known:112},
  cooldown:99,movementSpeed:{known:140,town:155}
 },
 resistances:{
  elements:{fire:14,ice:9,lightning:9,poison:0,charm:0,light:-92,dark:0,magic:0},
  states:{physical:0,mental:0},
  mitigation:{physical:-10,physicalFlat:0,magic:-5}
 }
});
const byLabel=calc=>new Map(load('ru').summaryRows(calc)
 .flatMap(group=>group.rows.map(row=>[row.ru,row])));

test('full results chapter preserves every original player-facing stat category',()=>{
 const groups=load('ru').summaryRows(sample());
 assert.equal(groups.length,4);
 assert.deepEqual(Array.from(groups.map(x=>x.page)),['buffs','attack','defense','defense']);
 const labels=groups.flatMap(g=>g.rows.map(x=>x.ru));
 assert.equal(labels.length,43);
 assert.equal(new Set(labels).size,labels.length,'do not repeat result fields');
 for(const label of ['ОЗ','ОМ','Леч. зельями','Леч. умениями','Расход ОМ',
  'АТК','АТК спереди','АТК сзади','МАТК','Защита',
  'Сопр. АТК спереди','Сопр. АТК сзади','Сопр. физ (ед.)','Сопр. физ (%)',
  'Сопр. маг. урону','Точность','Точн. спереди','Шанс крита',
  'Крит. урон','Уклонение','Сопр. криту','Получ. крит. урон',
  'Укл. ближ. атак','Укл. дальн. атак','Укл. от магии',
  'Дальн. АТК ближ. боя','Дальн. АТК дальн. боя',
  'Скор. атаки','Скор. каста','Сокрщ. времени каста','Откат',
  'Скор. движения','Скор. в городе','Сопр. огню','Сопр. льду',
  'Сопр. молниям','Сопр. яду','Сопр. чарам','Сопр. свету',
  'Сопр. тьме','Сопр. аном. тел.','Сопр. аном. дух.','Сопр. магии'])
  assert.ok(labels.includes(label),label);
});
test('source-backed results use actual values, including zero and negative resistance',()=>{
 const rows=byLabel(sample());
 for(const [key,expected] of [
  ['ОЗ',1827],['ОМ',341],['Леч. зельями',100],['Леч. умениями',100],
  ['Расход ОМ',95],['АТК',179],['АТК спереди',0],['АТК сзади',18],
  ['МАТК',102],['Защита',0],['Точность',104],['Шанс крита',6],
  ['Крит. урон',100],['Уклонение',163],['Сопр. криту',4],
  ['Сопр. физ (%)',-10],['Сопр. маг. урону',-5],
  ['Скор. каста',112],['Скор. движения',140],['Скор. в городе',155],
  ['Сопр. огню',14],['Сопр. свету',-92],['Сопр. яду',0]])
  assert.equal(rows.get(key).value,expected,key);
 assert.equal(rows.get('Сопр. свету').unit,'%');
 assert.equal(rows.get('ОЗ').unit,'');
});
test('unknown formulas and partial ranged bonuses never appear as fabricated totals',()=>{
 const stats=sample();
 stats.attackRange={general:50,bow:150};
 stats.combat.attack=null;
 const rows=byLabel(stats);
 for(const label of ['АТК','Дальн. АТК ближ. боя','Дальн. АТК дальн. боя',
  'Точн. спереди','Укл. ближ. атак','Укл. дальн. атак','Укл. от магии',
  'Сопр. АТК спереди','Сокрщ. времени каста','Скор. атаки'])
  assert.equal(rows.get(label).value,null,label);
 const empty=byLabel({hp:0,mp:0});
 assert.equal(empty.get('ОЗ').value,0);
 assert.equal(empty.get('Сопр. огню').value,null);
});
test('RU and EN display labels never alter underlying numeric results',()=>{
 const calc=sample();
 const ru=load('ru').summaryRows(calc),en=load('en').summaryRows(calc);
 assert.ok(ru.every(g=>g.rows.every(r=>r.ru&&r.en)));
 assert.equal(ru[1].rows[0].ru,'АТК');
 assert.equal(en[1].rows[0].en,'ATK');
 assert.equal(ru[3].rows[5].value,en[3].rows[5].value);
});
