import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const app=read('pandora-studio-app.js');
const calculator=read('pandora-os-character-calculator.js');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};Function('window',calculator)(host);
const os=host.PandoraOSCalculator;

test('defense and all three potion subsections reuse Results glyph and chevron',()=>{
 assert.match(book,/for\(const detail of \[\.\.\.body\.children\]/);
 assert.match(book,/detail\.classList\.add\('stage-book-disclosure'\)/);
 assert.match(book,/header\.className='stage-result-section-head'/);
 assert.match(book,/class:'stage-result-symbol'/);
 assert.match(book,/class:'stage-result-chevron'/);
 assert.match(book,/expandedBookDetails\.has\(key\)/);
 assert.match(book,/\['defense','experience'/);
 for(const label of ['Бонусы к опыту','Предметы восстановления ОЗ',
   'Снятие состояний','Предметы, активирующие умения']){
  assert.ok(book.includes(label));
 }
 assert.doesNotMatch(book,/['"]Бонусы к опыту['"]\)\+' · '\+exp\.length/);
 assert.doesNotMatch(book,/['"]Снятие состояний['"]\)\+' · '\+cures\.length/);
 const css=read('pandora-studio-hero-book-additions.css');
 assert.match(css,/stage-book-detail-title/);
 assert.match(css,/\.stage-offense-skill-row/);
});

test('offensive skills are selected from current class and reuse healing rows',()=>{
 assert.match(book,/heroJobKey=null,heroLevel=1,heroMasteries=\{\}/);
 assert.match(app,/heroJobKey:cls,heroLevel:state\.level,heroMasteries:branchMasteries/);
 assert.match(book,/const classOffense=Object\.values\(gameTerms\.skills\|\|\{\}\)/);
 assert.match(book,/stage-heal-row stage-offense-skill-row/);
 assert.ok(skills['100058001'].funcs.some(f=>f.ep==='EP_DAMAGERATE_SCALE'));
 assert.ok(skills['213605001'].funcs.some(f=>f.ep==='EP_TOHIT_CONST'));
 assert.ok(skills['910110001'].funcs.some(f=>f.ep==='EP_ONHIT_FIN_DAMAGE_CONST'));
});

test('external priest selected Minstrel/Sage songs use live OS rank coefficients',()=>{
 const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
 const base={classData:classes.WARRIOR,
  raceData:{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
  jobData:zero,allocation:zero,level:45};
 const preview=({selected=[],enabled=true,spi=134,blessing=90,hymn=30}={})=>
  os.base({...base,attributeBuffs:{remakedSkillIds:selected},
   combatContext:{jobKey:'WARRIOR',skillCatalog:skills,branchMasteries:{},
    legacyBuffMasteries:{blessing:0,hymn:0,alchemy:0},
    externalPriest:{enabled,spi,blessing,hymn}}});
 const without=preview();
 const minstrel=preview({selected:[340001001]});
 const coeff=skills['340001003'].funcs.find(f=>f.ep==='EP_TOHIT_CONST').fv1;
 const expected=coeff[3]+Math.floor(134*coeff[0]/100)+Math.floor(30*coeff[2]/100);
 assert.equal(expected,24);
 assert.equal(minstrel.combat.priestSong.minstrel,expected);
 assert.equal(minstrel.combat.accuracy.known-without.combat.accuracy.known,expected);
 assert.equal(minstrel.combat.dodge.known-without.combat.dodge.known,expected);
 assert.equal(preview({selected:[340001001],enabled:false}).combat.priestSong.minstrel,0);
 assert.equal(preview({selected:[340001001],hymn:7}).combat.priestSong.minstrel,0);
 const sage=preview({selected:[340004001]});
 const effect=skills['340004003'].funcs.find(f=>f.ep==='EP_ELEMENT_DAMAGE_SCALE').fv1;
 assert.equal(sage.combat.priestSong.sageElementDamage,
  effect[3]+Math.floor(134*effect[0]/100)+Math.floor(30*effect[2]/100));
 assert.equal(preview({selected:[340004001],blessing:70}).combat.priestSong.sageElementDamage,0);
 assert.equal(without.combat.priestSong.sageElementDamage,0);
});

test('only genuine OS resistance skill sprites are considered, no invented assets',()=>{
 assert.match(book,/const sprite=skillIconForId\(skill\.id\)/);
 assert.match(book,/stage-resistance-skill-icon/);
 assert.match(book,/picture\.onerror=\(\)=>picture\.remove\(\)/);
 for(const id of [410003001,410015001,410025001,430054001,440005501])
  assert.ok(skills[String(id)]?.funcs?.length,'expected current OS resistance skill '+id);
});
