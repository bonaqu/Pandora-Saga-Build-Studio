/* Read-only review of a pinned published D1 snapshot. No network, no writes. */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateDescriptionReferences} from './audit-live-catalog-parity.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const PIN='ps-ca9a604163b54a2da5c83ea55077ef96';
const candidate=join(root,'data/catalog-review',PIN);
const archive=join(root,'data/os');
const names=['meta','items','skills','souls','monsters','drops','maps',
 'instances','trades','tables','chests','racialPassives','classes',
 'itemForth','unison','expertise','stringsEn'];
const filename=name=>name==='stringsEn'?'strings.en.json':name+'.json';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sameSet=(a,b)=>same([...a].sort(),[...b].sort());
const rows=(name,data)=>name==='instances'?data.length:
 name==='trades'?data.trades.length:Object.keys(data).length;
const ordered=x=>Array.isArray(x)?x.map(ordered):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort().map(k=>[k,ordered(x[k])])):x;
const sameRecords=(a,b)=>same(ordered(a),ordered(b));


/* Relations validated within the SAME pinned read-only snapshot.
 * A missing record must not become a misleading loot, trade or chest link.
 * Don't assert probability sums: independent rolls may legitimately overlap. */
export function auditGameRelationships({items={},monsters={},drops={},trades={},
 chests={},itemForth={}}={}){
 const errors=[],checked={drops:0,trades:0,tradeMaterials:0,
  chestRewards:0,itemForth:0};
 const has=(collection,id)=>collection&&
  Object.hasOwn(collection,String(id));
 const fail=(kind,id,reference)=>errors.push({kind,id,reference});
 for(const [monsterId,group] of Object.entries(drops||{})){
  if(!has(monsters,monsterId))fail('unknown-drop-monster',monsterId,monsterId);
  for(const kind of ['d','s']){
   const entries=group?.[kind];
   if(entries!==undefined&&!Array.isArray(entries)){
    fail('invalid-drop-rows',monsterId,kind);continue;
   }
   for(const [index,row] of (entries||[]).entries()){
    checked.drops++;
    if(!has(items,row?.i))
     fail('unknown-drop-item',monsterId+':'+kind+':'+index,row?.i);
    if(!Number.isFinite(row?.lo)||!Number.isFinite(row?.hi)||
     row.lo>row.hi)
     fail('invalid-drop-refinement',monsterId+':'+kind+':'+index,
      String(row?.lo)+'..'+String(row?.hi));
   }
  }
 }
 const offers=trades?.trades;
 if(!Array.isArray(offers))fail('invalid-trade-list','trades',null);
 else for(const [index,row] of offers.entries()){
  checked.trades++;
  const id=row?.id??index;
  if(!has(items,row?.i))fail('unknown-trade-result',id,row?.i);
  const seenMaterials=new Set(),seenNpcs=new Set();
  for(const mat of row?.mats||[]){
   checked.tradeMaterials++;
   const key=String(mat?.i);
   if(!has(items,mat?.i))fail('unknown-trade-material',id,mat?.i);
   if(seenMaterials.has(key))fail('duplicate-trade-material',id,mat?.i);
   seenMaterials.add(key);
  }
  for(const npc of row?.npc||[]){
   const key=String(npc);
   if(!has(trades?.npcs,npc))fail('unknown-trade-npc',id,npc);
   if(seenNpcs.has(key))fail('duplicate-trade-npc',id,npc);
   seenNpcs.add(key);
  }
 }
 for(const [group,boxes] of [['boxes',chests?.boxes],['npc',chests?.npc]]){
  if(!Array.isArray(boxes)){
   fail('invalid-chest-group',group,null);continue;
  }
  for(const [index,box] of boxes.entries()){
   if(group==='boxes'&&!has(items,box?.i))
    fail('unknown-chest-box',index,box?.i);
   for(const [rollIndex,roll] of (box?.rolls||[]).entries()){
    if(!Array.isArray(roll)){
     fail('invalid-chest-roll',group+':'+index,rollIndex);continue;
    }
    for(const reward of roll){
     if(reward?.i===undefined)continue; // Gold drops have a separate field.
     checked.chestRewards++;
     if(!has(items,reward.i))
      fail('unknown-chest-reward',group+':'+index+':'+rollIndex,reward.i);
    }
   }
  }
 }
 for(const itemId of Object.keys(itemForth||{})){
  checked.itemForth++;
  if(!has(items,itemId))fail('unknown-forth-item',itemId,itemId);
 }
 return {checked,errors,ok:errors.length===0};
}

export function auditReview({candidateDir=candidate,archiveDir=archive}={}){
 const m=JSON.parse(readFileSync(join(candidateDir,'REVIEW_MANIFEST.json'),'utf8'));
 if(m.kind!=='read-only-catalog-review'||m.promoted!==false||m.snapshot!==PIN)
  throw Error('Unpinned or promoted catalog review');
 const files=names.map(filename);
 if(!sameSet(m.candidateFiles,files)||!sameSet(Object.keys(m.files||{}),files))
  throw Error('Missing or unexpected D1 review files');
 const source={};
 for(const name of names){
  const file=filename(name),buffer=readFileSync(join(candidateDir,file));
  const sha=createHash('sha256').update(buffer).digest('hex');
  if(m.files[file]?.sha256!==sha||m.files[file]?.bytes!==buffer.byteLength)
   throw Error('Checksum or file-size mismatch: '+file);
  source[name]=JSON.parse(buffer.toString('utf8'));
 }
 const meta=source.meta;
 if(meta.schemaVersion!==1||meta.curated!==true||meta.baseLocale!=='ru')
  throw Error('Missing curated D1 meta');
 const counted=['items','skills','souls','monsters','drops','maps','instances',
  'trades','classes','racialPassives','itemForth','unison'];
 for(const name of counted){
  if(!Number.isSafeInteger(meta.counts?.[name])||
    rows(name,source[name])!==meta.counts[name])
   throw Error('Meta count mismatch: '+name);
 }
 for(const name of ['items','skills','monsters','souls','classes'])
  if(Object.keys(source.stringsEn?.[name]||{}).length!==meta.localeCounts?.en?.[name])
   throw Error('Incomplete English translations: '+name);
 if(source.tables.levelCap!==50||source.classes.CONJURER?.branchCaps?.warding!==10)
  throw Error('Changed current source level or class constraints');
 const old=name=>JSON.parse(readFileSync(join(archiveDir,filename(name)),'utf8'));
 const oldInstances=old('instances');
 for(const id of m.changeReview.intentionalRuInstanceIds){
  const before=oldInstances.find(x=>String(x.id)===id);
  const after=source.instances.find(x=>String(x.id)===id);
  if(!before?.blurbRu||!sameRecords(before,after))
   throw Error('Locally preserved RU dungeon description changed: '+id);
 }
 const skills=old('skills');
 const added=Object.keys(source.skills).filter(id=>!Object.hasOwn(skills,id));
 const changed=Object.keys(source.skills).filter(id=>
  Object.hasOwn(skills,id)&&!sameRecords(source.skills[id],skills[id]));
 if(!sameSet(added,m.changeReview.skillAdded)||!sameSet(changed,m.changeReview.skillChanged))
  throw Error('Source-derived skill models must be re-reviewed before promotion');
 const classes=old('classes');
 const changedClasses=Object.keys(source.classes).filter(id=>
  !sameRecords(source.classes[id],classes[id]));
 if(!sameSet(changedClasses,m.changeReview.classChanged))
  throw Error('Class source changes require review');
 const refs=validateDescriptionReferences({
  items:source.items,souls:source.souls,stringsEn:source.stringsEn
 });
 if(refs.unresolved)throw Error('Unresolved item references: '+refs.unresolved);
 const relations=auditGameRelationships(source);
 if(!relations.ok)throw Error('Broken candidate game relationships: '+
  JSON.stringify(relations.errors.slice(0,8)));
 return {snapshot:PIN,files:files.length,counts:meta.counts,
  changedSkills:changed.length,addedSkills:added.length,
  preservedRuBlurbs:m.changeReview.intentionalRuInstanceIds.length,
  brokenItemReferences:refs.unresolved,gameRelations:relations.checked,
  promoted:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log('REVIEW ONLY; not published to data/os: '+JSON.stringify(auditReview()))}
 catch(error){console.error(error.message);process.exitCode=1}
}