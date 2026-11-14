// Pandora Saga OS elemental-skill damage, current-build-only projection.
// Independently expressed from the public Pandora Saga OS BuildCalculator
// (assets/BuildCalculator-DBaXruFa.js, 2026-11-14), no historical
// Remaked MATK shortcut. The current Game OS data are source-gated.
(function(root){
'use strict';
const target=Object.freeze({
 id:22104,name:'Гигантский огр',nameEn:'Ogre Bouncer',level:53,
 life:6126,vit:32,spi:18,ac:15,magicProtection:0,
 resists:{physical:0,fire:0,cold:0,lightning:0,
  poison:-25,charm:0,holy:0,dark:-25,magic:17}
});
const n=v=>Number.isSafeInteger(v)&&v>=0;
const trunc=Math.trunc;
const floor=Math.floor;
const even=x=>{
 if(!Number.isFinite(x))return NaN;
 const lo=floor(x),fraction=x-lo;
 return fraction<0.5?lo:fraction>0.5?lo+1:lo%2===0?lo:lo+1;
};
// Source OS supports an elemental bonus for each damage school. Keep
// separate keys so ice/lightning/holy/dark never leak into other hits.
const schoolSuffixes=Object.freeze({
 EP_ELEMENT_DAMAGE_SCALE_FIRE:'fire',
 EP_ELEMENT_DAMAGE_SCALE_COLD:'cold',
 EP_ELEMENT_DAMAGE_SCALE_POISON:'poison',
 EP_ELEMENT_DAMAGE_SCALE_LIGHTNING:'lightning',
 EP_ELEMENT_DAMAGE_SCALE_HOLY:'holy',
 EP_ELEMENT_DAMAGE_SCALE_DARK:'dark'
});
const elementalKeys=new Set(['EP_ELEMENT_DAMAGE_SCALE',
 'EP_ELEMENT_BONUS',...Object.keys(schoolSuffixes)]);
const sourceEffect=(sum,e,weapon)=>{
 if(!e||!elementalKeys.has(e.func))return true;
 const grade=weapon?.refinement??0;
 // Mirror the character sheet: source ranges apply to both equipment
 // and socketed Souls, even when the catalog is owner-edited.
 if((e.min!=null&&!Number.isSafeInteger(e.min))||
    (e.max!=null&&!Number.isSafeInteger(e.max)))return false;
 if((e.min!=null&&grade<e.min)||(e.max!=null&&grade>e.max))return true;
 if(!Number.isFinite(e.a))return false;
 const school=schoolSuffixes[e.func];
 if(school){
  // OS item 1862 has a conditional bonus for *fire-refined* weapon only.
  if(school==='fire'&&weapon?.record?.id===1862&&
     weapon?.gem?.element!=='fire')return true;
  sum[school]=(sum[school]||0)+e.a;
 }else if(e.func==='EP_ELEMENT_BONUS')sum.penetration+=e.a;
 else sum.general+=e.a;
 return true;
};
function equippedElementalEffects({equipment=[],itemForth={},unison={}}={}){
 if(!Array.isArray(equipment)||!itemForth||!unison)return null;
 const out={general:0,fire:0,penetration:0},items=new Map();
 for(const slot of equipment){
  if(slot?.issue?.length)continue;
  const rec=slot?.record,grade=slot?.refinement??0;
  if(!n(rec?.id)||!n(grade)||grade>10)return null;
  if(typeof rec.slot!=='string')return null;
  items.set(String(rec.id),slot);
  // OS Forth rows are cumulative snapshots, sometimes only at +2,+4,+6.
  // Reuse the nearest reached tier, exactly as sourceEffects does in the
  // main character calculator; don't require an explicit +3/+5/+7 row.
  const levels=itemForth[String(rec.id)];
  if(levels!=null&&(typeof levels!=='object'||Array.isArray(levels)))return null;
  let nearest=-1;
  for(const [key,rows] of Object.entries(levels||{})){
   const step=Number(key);
   if(Number.isSafeInteger(step)&&step>=1&&step<=grade&&
      Array.isArray(rows)&&step>nearest)nearest=step;
  }
  const rules=nearest<0?[]:levels[String(nearest)];
  if(!Array.isArray(rec.effects)&&rec.effects!=null)return null;
  for(const e of [...(rec.effects||[]),...rules]){
   if(!sourceEffect(out,e,slot))return null;
  }
  for(const soul of slot.souls||[]){
   if(!n(soul?.id)||!Array.isArray(soul.effects))return null;
   for(const e of soul.effects)if(!sourceEffect(out,e,slot))return null;
  }
 }
 for(const [id,slot] of items){
  const set=unison[id];
  if(!set)continue;
  if(!Array.isArray(set.members)||!Array.isArray(set.rows))return null;
  // The root is not its own companion; de-duplicate repeated member IDs.
  const members=[...new Set(set.members.map(String).filter(key=>key!==id))];
  const count=members.filter(key=>items.has(key)).length;
  const grade=slot.refinement??0;
  for(const row of set.rows){
   if(count<row.minC||count>row.maxC||
    grade<row.minL||grade>row.maxL)continue;
   if(!elementalKeys.has(row.func))continue;
   if(!row.a||!Number.isFinite(row.a.f)||!Number.isFinite(row.a.p)||
    !Number.isFinite(row.a.c)||row.a.f!==0||
    !row.b||Object.values(row.b).some(v=>v!==0))return null;
   const a=row.a.c+row.a.p*grade;
   if(!sourceEffect(out,{func:row.func,a},slot))return null;
  }
 }
 return out;
}
function monsterLevelModifier(level,monster,lvModify){
 if(!Array.isArray(lvModify)||lvModify.length<2||
  !n(level)||level<1||!n(monster.level))return null;
 const delta=monster.level-level;
 const zero={magicAc:0,magicProtection:0,magicDamageReduction:0};
 if(delta<lvModify[0].diff)return zero;
 const rows=lvModify,tail=rows.at(-1),before=rows.at(-2);
 let row=rows.slice(0,-1).find(x=>x.diff===delta);
 if(!row){
  if(tail.diff!==-1)return null;
  const d=delta-before.diff;
  row={
   magicDef:before.magicDef+tail.magicDef*d,
   magicProtection:before.magicProtection+tail.magicProtection*d,
   resistRate:before.resistRate+tail.resistRate*d
  };
 }
 const scaling=n(monster.lvMod)?monster.lvMod:100;
 if(![row.magicDef,row.magicProtection,row.resistRate].every(Number.isFinite))
  return null;
 return {magicAc:trunc(row.magicDef*scaling/100),
  magicProtection:trunc(row.magicProtection*scaling/100),
  magicDamageReduction:trunc(row.resistRate*scaling/100)};
}
function sourceSkill(skillCatalog,classes,jobKey,level,mastery,caps){
 const rootSkill=skillCatalog?.['240005001'],bolt=skillCatalog?.['240005002'],
  blast=skillCatalog?.['240005003'];
 const job=classes?.[jobKey],cap=caps?.trap;
 if(jobKey!=='DISTURBANCE'||job?.id!=='DISTURBANCE'||
  !n(level)||level<1||level>55||
  !n(cap)||cap>100||cap!==job.branchCaps?.trap||
  !n(mastery)||mastery>cap||mastery<41||
  rootSkill?.id!==240005001||rootSkill.learnable!==true||
  rootSkill.classes?.[jobKey]!==1||rootSkill.branch!=='trap'||
  rootSkill.reqs?.length!==1||
  rootSkill.reqs[0].branch!=='trap'||rootSkill.reqs[0].amount!==41||
  level<rootSkill.charLevel||rootSkill.skillType!=='POINT'||
  rootSkill.mana!==33||
  bolt?.id!==240005002||bolt.learnable!==false||
  blast?.id!==240005003||blast.learnable!==false||
  blast.branch!=='trap'||blast.powerStat!=='DEX'||
  blast.element!=='FIRE'||blast.damage?.kernel!=='element'||
  blast.damage.slotIndex!==0)return null;
 const rootFx=rootSkill.funcs,boltFx=bolt.funcs,fx=blast.funcs;
 const exact=(row,code,dir,a,b)=>
  row?.ep===code&&row?.dir===dir&&
  JSON.stringify(row.fv1)===JSON.stringify(a)&&
  JSON.stringify(row.fv2)===JSON.stringify(b);
 if(rootSkill.powerStat!=='DEX'||rootSkill.element!=='NONE'||
  bolt.skillType!=='BOLT'||bolt.element!=='NONE'||
  bolt.powerStat!=='DEX'||bolt.damage!==null||
  blast.skillType!=='SPHERE'||
  rootFx?.length!==2||boltFx?.length!==1||fx?.length!==1||
  !exact(rootFx[0],'EP_CONSUME_ITEM','CASTER',
   [0,0,0,65007],[0,0,0,2])||
  !exact(rootFx[1],'EP_SKILL_EXEC','TARGET',
   [0,0,0,240005002],[0,0,0,0])||
  !exact(boltFx[0],'EP_SKILL_EXEC','TARGET',
   [0,0,0,240005003],[0,0,0,0])||
  !exact(fx[0],'EP_ELEMENT_DAMAGE','TARGET',
   [680,0,350,155],[0,0,0,0]))return null;
 return rootSkill;
}
// Explicit source snapshots. Extra non-damage effects are checked but NEVER
// counted as additional damage, poison ticks, healing or repeated casts.
const directSpells=Object.freeze([
 {id:410001001,branch:'element',kind:'BOLT',element:'FIRE',
  stat:'INT',req:0,charLevel:1,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[122,0,60,23],[0,0,0,0]]]},
 {id:330001001,branch:'exorcism',kind:'BOLT',element:'HOLY',
  stat:'INT',req:8,charLevel:0,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[120,50,30,15],[0,0,0,0]]]},
 {id:410011001,branch:'element',kind:'BOLT',element:'COLD',
  stat:'INT',req:8,charLevel:0,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[60,30,30,14],[0,0,0,0]],
   ['EP_CAUSE_NUMB','TARGET',[0,0,0,4],[0,0,0,100]]]},
 {id:410012001,branch:'element',kind:'BOLT',element:'COLD',
  stat:'INT',req:21,charLevel:0,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[250,30,30,55],[0,0,0,0]],
   ['EP_CAUSE_NUMB','TARGET',[0,0,0,7],[0,0,0,200]]]},
 {id:410021001,branch:'element',kind:'ENEMY',element:'LIGHTNING',
  stat:'INT',req:0,charLevel:12,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[40,30,70,22],[0,0,0,0]],
   ['EP_CAUSE_TUMBLE','TARGET',[0,0,0,2],[0,0,0,100]]]},
 {id:410023001,branch:'element',kind:'ENEMY',element:'LIGHTNING',
  stat:'INT',req:0,charLevel:20,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[250,10,250,20],[0,0,0,0]]]},
 {id:420003001,branch:'charm',kind:'ENEMY',element:'CHARM',
  stat:'SPI',req:12,charLevel:0,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[40,30,70,27],[0,0,0,0]],
   ['EP_CAUSE_SLEEP','TARGET',[0,0,0,20],[40,0,40,40]]]},
 {id:430001001,branch:'darkness',kind:'ENEMY',element:'DARK',
  stat:'INT',req:21,charLevel:0,slot:1,effects:[
   ['EP_LIFE_ABSORB','CASTER',[0,0,0,50],[0,0,0,0]],
   ['EP_ELEMENT_DAMAGE','TARGET',[180,0,80,40],[0,0,0,0]]]},
 {id:430052001,branch:'darkness',kind:'ENEMY',element:'DARK',
  stat:'SPI',req:8,charLevel:0,slot:0,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[5,0,5,15],[0,0,0,0]],
   ['EP_CAUSE_POISON','TARGET',[180,0,180,40],[0,0,30,70]]]},
 // Direct elemental hit is calculable; subsequent burn/recovery changes are
 // source-linked but never mislabelled as damage of the entire cast.
 {id:410002001,branch:'element',kind:'RADIATION',element:'FIRE',
  stat:'INT',req:26,charLevel:0,slot:0,directPart:true,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[100,0,100,50],[0,0,0,0]],
   ['EP_SKILL_EXEC','TARGET',[0,0,0,500000005],[0,0,9,9]]],
  linked:{id:500000005,kind:'ENEMY',branch:'race',element:null,
   stat:'SPI',effects:[
    ['EP_CAUSE_BURN','TARGET',[0,0,0,10],[0,0,0,100]]]}},
 {id:430053001,branch:'darkness',kind:'ENEMY',element:'DARK',
  stat:'SPI',req:26,charLevel:0,slot:0,directPart:true,effects:[
   ['EP_ELEMENT_DAMAGE','TARGET',[40,0,40,26],[0,0,0,0]],
   ['EP_SKILL_EXEC','TARGET',[0,0,0,430053002],[0,0,0,0]]],
  linked:{id:430053002,kind:'ENEMY',branch:'darkness',element:'DARK',
   stat:'SPI',effects:[
    ['EP_HEAL_LIFE_REGENERATOR','TARGET',[-4,0,-10,-4],[0,0,0,2]],
    ['EP_STOP_NATURAL_HEAL','TARGET',[0,0,0,1],[0,0,0,1]]]}}
]);
const linkedSpells=Object.freeze([
 {
  "id": 240002001,
  "path": [
   {
    "id": 240002001,
    "learnable": true,
    "kind": "POINT",
    "element": null,
    "stat": "DEX",
    "branch": "trap",
    "charLevel": 0,
    "prereq": null,
    "reqs": [
     {
      "branch": "trap",
      "amount": 26
     }
    ],
    "damage": null,
    "effects": [
     [
      "EP_CONSUME_ITEM",
      "CASTER",
      [
       0,
       0,
       0,
       65007
      ],
      [
       0,
       0,
       0,
       1
      ]
     ],
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       240002050
      ],
      [
       0,
       0,
       0,
       0
      ]
     ],
     [
      "EP_CANCEL_TRAP",
      "CASTER",
      [
       0,
       0,
       0,
       240002050
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 240002050,
    "learnable": false,
    "kind": "CIRCLE",
    "element": null,
    "stat": "DEX",
    "branch": "trap",
    "charLevel": 0,
    "prereq": null,
    "reqs": [],
    "damage": {
     "kernel": "element",
     "slotIndex": 0
    },
    "effects": [
     [
      "EP_ELEMENT_DAMAGE",
      "TARGET",
      [
       350,
       100,
       70,
       50
      ],
      [
       0,
       0,
       0,
       0
      ]
     ],
     [
      "EP_CAUSE_KNOCKBACK",
      "TARGET",
      [
       0,
       0,
       0,
       200
      ],
      [
       0,
       0,
       0,
       1
      ]
     ]
    ]
   }
  ],
  "damageIndex": 1
 },
 {
  "id": 410014001,
  "path": [
   {
    "id": 410014001,
    "learnable": true,
    "kind": "POINT",
    "element": "COLD",
    "stat": "INT",
    "branch": "element",
    "charLevel": 0,
    "prereq": null,
    "reqs": [
     {
      "branch": "element",
      "amount": 54
     }
    ],
    "damage": null,
    "effects": [
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       410014002
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 410014002,
    "learnable": false,
    "kind": "SPHERE",
    "element": "COLD",
    "stat": "INT",
    "branch": "element",
    "charLevel": 0,
    "prereq": null,
    "reqs": [],
    "damage": {
     "kernel": "element",
     "slotIndex": 0
    },
    "effects": [
     [
      "EP_ELEMENT_DAMAGE",
      "TARGET",
      [
       150,
       0,
       48,
       13
      ],
      [
       0,
       0,
       0,
       0
      ]
     ],
     [
      "EP_DESTINED_KNOCKBACK",
      "TARGET",
      [
       0,
       0,
       0,
       200
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   }
  ],
  "damageIndex": 1
 },
 {
  "id": 410014003,
  "path": [
   {
    "id": 410014003,
    "learnable": true,
    "kind": "POINT",
    "element": "COLD",
    "stat": "INT",
    "branch": "element",
    "charLevel": 0,
    "prereq": 410014001,
    "reqs": [
     {
      "branch": "element",
      "amount": 71
     }
    ],
    "damage": null,
    "effects": [
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       410014004
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 410014004,
    "learnable": false,
    "kind": "SPHERE",
    "element": "COLD",
    "stat": "INT",
    "branch": "element",
    "charLevel": 0,
    "prereq": null,
    "reqs": [],
    "damage": {
     "kernel": "element",
     "slotIndex": 0
    },
    "effects": [
     [
      "EP_ELEMENT_DAMAGE",
      "TARGET",
      [
       200,
       0,
       110,
       13
      ],
      [
       0,
       0,
       0,
       0
      ]
     ],
     [
      "EP_DESTINED_KNOCKBACK",
      "TARGET",
      [
       0,
       0,
       0,
       200
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   }
  ],
  "damageIndex": 1
 },
 {
  "id": 410022001,
  "path": [
   {
    "id": 410022001,
    "learnable": true,
    "kind": "BOLT",
    "element": "LIGHTNING",
    "stat": "INT",
    "branch": "element",
    "charLevel": 0,
    "prereq": null,
    "reqs": [
     {
      "branch": "element",
      "amount": 12
     }
    ],
    "damage": null,
    "effects": [
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       410022050
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 410022050,
    "learnable": false,
    "kind": "SPHERE",
    "element": "LIGHTNING",
    "stat": "INT",
    "branch": "element",
    "charLevel": 0,
    "prereq": null,
    "reqs": [],
    "damage": {
     "kernel": "element",
     "slotIndex": 0
    },
    "effects": [
     [
      "EP_ELEMENT_DAMAGE",
      "TARGET",
      [
       100,
       0,
       150,
       25
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   }
  ],
  "damageIndex": 1
 },
 {
  "id": 420007001,
  "path": [
   {
    "id": 420007001,
    "learnable": true,
    "kind": "POINT",
    "element": "NONE",
    "stat": "SPI",
    "branch": "embody",
    "charLevel": 0,
    "prereq": null,
    "reqs": [
     {
      "branch": "embody",
      "amount": 61
     }
    ],
    "damage": null,
    "effects": [
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       420007002
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 420007002,
    "learnable": false,
    "kind": "SPHBOLT",
    "element": "CHARM",
    "stat": "SPI",
    "branch": "embody",
    "charLevel": 0,
    "prereq": null,
    "reqs": [],
    "damage": {
     "kernel": "element",
     "slotIndex": 0
    },
    "effects": [
     [
      "EP_ELEMENT_DAMAGE",
      "TARGET",
      [
       60,
       0,
       80,
       27
      ],
      [
       0,
       0,
       0,
       0
      ]
     ],
     [
      "EP_CAUSE_SLEEP",
      "TARGET",
      [
       0,
       0,
       0,
       20
      ],
      [
       40,
       0,
       40,
       0
      ]
     ],
     [
      "EP_DESTINED_KNOCKBACK",
      "TARGET",
      [
       0,
       0,
       0,
       300
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   }
  ],
  "damageIndex": 1
 },
 {
  "id": 430001003,
  "path": [
   {
    "id": 430001003,
    "learnable": true,
    "kind": "ENEMY",
    "element": "DARK",
    "stat": "INT",
    "branch": "darkness",
    "charLevel": 45,
    "prereq": 430001001,
    "reqs": [
     {
      "branch": "darkness",
      "amount": 21
     }
    ],
    "damage": null,
    "effects": [
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       430001004
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 430001004,
    "learnable": false,
    "kind": "SPHERE",
    "element": "DARK",
    "stat": "INT",
    "branch": "darkness",
    "charLevel": 0,
    "prereq": null,
    "reqs": [],
    "damage": {
     "kernel": "element",
     "slotIndex": 1
    },
    "effects": [
     [
      "EP_LIFE_ABSORB",
      "CASTER",
      [
       0,
       0,
       0,
       50
      ],
      [
       0,
       0,
       0,
       0
      ]
     ],
     [
      "EP_ELEMENT_DAMAGE",
      "TARGET",
      [
       180,
       0,
       80,
       40
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   }
  ],
  "damageIndex": 1
 },
 {
  "id": 430052002,
  "path": [
   {
    "id": 430052002,
    "learnable": true,
    "kind": "ENEMY",
    "element": "DARK",
    "stat": "SPI",
    "branch": "darkness",
    "charLevel": 45,
    "prereq": 430052001,
    "reqs": [
     {
      "branch": "darkness",
      "amount": 8
     }
    ],
    "damage": null,
    "effects": [
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       430052003
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 430052003,
    "learnable": false,
    "kind": "SPHERE",
    "element": "DARK",
    "stat": "SPI",
    "branch": "darkness",
    "charLevel": 0,
    "prereq": null,
    "reqs": [],
    "damage": {
     "kernel": "element",
     "slotIndex": 0
    },
    "effects": [
     [
      "EP_ELEMENT_DAMAGE",
      "TARGET",
      [
       5,
       0,
       5,
       15
      ],
      [
       0,
       0,
       0,
       0
      ]
     ],
     [
      "EP_CAUSE_POISON",
      "TARGET",
      [
       180,
       0,
       180,
       40
      ],
      [
       0,
       0,
       30,
       70
      ]
     ]
    ]
   }
  ],
  "damageIndex": 1
 },
 {
  "id": 430053003,
  "path": [
   {
    "id": 430053003,
    "learnable": true,
    "kind": "ENEMY",
    "element": "DARK",
    "stat": "SPI",
    "branch": "darkness",
    "charLevel": 45,
    "prereq": 430053001,
    "reqs": [
     {
      "branch": "darkness",
      "amount": 26
     }
    ],
    "damage": null,
    "effects": [
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       430053004
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 430053004,
    "learnable": false,
    "kind": "SPHERE",
    "element": "DARK",
    "stat": "SPI",
    "branch": "darkness",
    "charLevel": 0,
    "prereq": null,
    "reqs": [],
    "damage": {
     "kernel": "element",
     "slotIndex": 0
    },
    "effects": [
     [
      "EP_ELEMENT_DAMAGE",
      "TARGET",
      [
       40,
       0,
       40,
       26
      ],
      [
       0,
       0,
       0,
       0
      ]
     ],
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       430053005
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 430053005,
    "learnable": false,
    "kind": "ENEMY",
    "element": "DARK",
    "stat": "SPI",
    "branch": "darkness",
    "charLevel": 0,
    "prereq": null,
    "reqs": [],
    "damage": null,
    "effects": [
     [
      "EP_HEAL_LIFE_REGENERATOR",
      "TARGET",
      [
       -4,
       0,
       -10,
       -4
      ],
      [
       0,
       0,
       0,
       2
      ]
     ],
     [
      "EP_STOP_NATURAL_HEAL",
      "TARGET",
      [
       0,
       0,
       0,
       1
      ],
      [
       0,
       0,
       0,
       1
      ]
     ]
    ]
   }
  ],
  "damageIndex": 1
 },
 {
  "id": 430056001,
  "path": [
   {
    "id": 430056001,
    "learnable": true,
    "kind": "POINT",
    "element": "POISON",
    "stat": "INT",
    "branch": "darkness",
    "charLevel": 0,
    "prereq": null,
    "reqs": [
     {
      "branch": "darkness",
      "amount": 54
     }
    ],
    "damage": null,
    "effects": [
     [
      "EP_SKILL_EXEC",
      "TARGET",
      [
       0,
       0,
       0,
       430056002
      ],
      [
       0,
       0,
       0,
       0
      ]
     ]
    ]
   },
   {
    "id": 430056002,
    "learnable": false,
    "kind": "SPHERE",
    "element": "POISON",
    "stat": "INT",
    "branch": "darkness",
    "charLevel": 0,
    "prereq": null,
    "reqs": [
     {
      "branch": "darkness",
      "amount": 35
     }
    ],
    "damage": {
     "kernel": "element",
     "slotIndex": 0
    },
    "effects": [
     [
      "EP_ELEMENT_DAMAGE",
      "TARGET",
      [
       120,
       0,
       120,
       15
      ],
      [
       0,
       0,
       0,
       0
      ]
     ],
     [
      "EP_CAUSE_CURSE",
      "TARGET",
      [
       0,
       0,
       0,
       15
      ],
      [
       0,
       0,
       0,
       20
      ]
     ]
    ]
   }
  ],
  "damageIndex": 1
 },
 {
   "id": 410026001,
   "path": [
     {
       "id": 410026001,
       "learnable": true,
       "kind": "POINT",
       "element": "LIGHTNING",
       "stat": "INT",
       "branch": "element",
       "charLevel": 0,
       "prereq": null,
       "reqs": [
         {
           "branch": "element",
           "amount": 61
         },
         {
           "branch": "exorcism",
           "amount": 40
         }
       ],
       "damage": null,
       "effects": [
         [
           "EP_SKILL_EXEC",
           "TARGET",
           [
             0,
             0,
             0,
             410026002
           ],
           [
             0,
             0,
             0,
             0
           ]
         ]
       ]
     },
     {
       "id": 410026002,
       "learnable": false,
       "kind": "SPHERE",
       "element": "LIGHTNING",
       "stat": "INT",
       "branch": "element",
       "charLevel": 0,
       "prereq": null,
       "reqs": [],
       "damage": {
         "kernel": "element",
         "slotIndex": 0
       },
       "effects": [
         [
           "EP_ELEMENT_DAMAGE",
           "TARGET",
           [
             200,
             0,
             50,
             5
           ],
           [
             0,
             0,
             0,
             0
           ]
         ],
         [
           "EP_SKILL_EXEC_GETON",
           "TARGET",
           [
             0,
             0,
             0,
             410026003
           ],
           [
             0,
             0,
             0,
             0
           ]
         ],
         [
           "EP_SKILL_EXEC",
           "TARGET",
           [
             0,
             0,
             0,
             410026004
           ],
           [
             0,
             0,
             0,
             0
           ]
         ]
       ]
     },
     {
       "id": 410026004,
       "learnable": false,
       "kind": "ENEMY",
       "element": "LIGHTNING",
       "stat": "INT",
       "branch": "element",
       "charLevel": 0,
       "prereq": null,
       "reqs": [],
       "damage": null,
       "effects": [
         [
           "EP_MOVESPEED_SCALE",
           "TARGET",
           [
             0,
             0,
             0,
             -20
           ],
           [
             0,
             0,
             0,
             0
           ]
         ]
       ]
     }
   ],
   "damageIndex": 1,
   "sidecars": [
     {
       "parent": 410026002,
       "via": "EP_SKILL_EXEC_GETON",
       "node": {
         "id": 410026003,
         "learnable": false,
         "kind": "ENEMY",
         "element": "LIGHTNING",
         "stat": "INT",
         "branch": "element",
         "charLevel": 0,
         "prereq": null,
         "reqs": [],
         "damage": null,
         "effects": [
           [
             "EP_UNABLE_MOVE",
             "TARGET",
             [
               0,
               0,
               0,
               0
             ],
             [
               0,
               0,
               0,
               0
             ]
           ]
         ]
       }
     }
   ]
 },
 {
   "id": 213608001,
   "path": [
     {
       "id": 213608001,
       "learnable": true,
       "kind": "POINT",
       "element": "FIRE",
       "stat": "STR",
       "branch": "archery",
       "charLevel": 50,
       "prereq": null,
       "reqs": [],
       "damage": null,
       "effects": [
         [
           "EP_SKILL_EXEC",
           "TARGET",
           [
             0,
             0,
             0,
             213608002
           ],
           [
             0,
             0,
             0,
             0
           ]
         ],
         [
           "EP_CONSUME_AMMO",
           "CASTER",
           [
             0,
             0,
             0,
             0
           ],
           [
             0,
             0,
             0,
             1
           ]
         ]
       ]
     },
     {
       "id": 213608002,
       "learnable": false,
       "kind": "SPHERE",
       "element": "FIRE",
       "stat": "STR",
       "branch": "archery",
       "charLevel": 0,
       "prereq": null,
       "reqs": [],
       "damage": {
         "kernel": "element",
         "slotIndex": 1
       },
       "effects": [
         [
           "EP_CAUSE_BURN",
           "TARGET",
           [
             0,
             0,
             0,
             5
           ],
           [
             0,
             0,
             0,
             100
           ]
         ],
         [
           "EP_ELEMENT_DAMAGE",
           "TARGET",
           [
             0,
             0,
             80,
             60
           ],
           [
             0,
             0,
             0,
             0
           ]
         ]
       ]
     }
   ],
   "damageIndex": 1,
   "requiredWeapon": "BOW"
 }
]);
// Only one OS EP_ELEMENT_DAMAGE packet is calculated for each linked
// action. Root -> attack -> optional status chain is strictly pinned.
function sourceLinkedSpell({skillCatalog,classes,jobKey,level,masteries={},
 branchCaps={},equipment=[]},spec){
 const job=classes?.[jobKey],first=spec.path[0];
 const root=skillCatalog?.[String(first.id)];
 if(!job||job.id!==jobKey||!root||!n(level)||level<1||level>55||
  level<first.charLevel||root.classes?.[jobKey]!==1)return null;
 // No-mastery-gate level skills must STILL use a legal trained mastery.
 const primaryCap=branchCaps[first.branch];
 const primaryMastery=masteries[first.branch]??0;
 if(!n(primaryCap)||primaryCap>100||
  primaryCap!==job.branchCaps?.[first.branch]||
  !n(primaryMastery)||primaryMastery>primaryCap)return null;
 // The Sniper's source explicitly requires an equipped BOW. A crossbow,
 // bare hands or unusable/stale weapon may not produce a playable hit.
 if(spec.requiredWeapon){
  if(spec.requiredWeapon!=='BOW'||!spec.path.every(node=>
   JSON.stringify(skillCatalog?.[String(node.id)]?.weaponUse)==='["BOW"]')||
   !equipment.some(slot=>slot?.record?.slot==='weapon'&&
    slot.record.kind==='BOW'&&Array.isArray(slot.issue)&&
    slot.issue.length===0))return null;
 }
 for(const req of first.reqs){
  const cap=branchCaps[req.branch],mastery=masteries[req.branch]??0;
  if(!n(req.amount)||!n(cap)||cap>100||
   cap!==job.branchCaps?.[req.branch]||
   cap<req.amount||!n(mastery)||mastery>cap||
   mastery<req.amount)return null;
 }
 // Source skill effects and source chaining have to remain identical.
 const exact=(record,node)=>{
  if(record?.id!==node.id||record.learnable!==node.learnable||
   record.skillType!==node.kind||record.element!==node.element||
   record.powerStat!==node.stat||record.branch!==node.branch||
   record.charLevel!==node.charLevel||record.prereq!==node.prereq||
   JSON.stringify(record.reqs)!==JSON.stringify(node.reqs)||
   JSON.stringify(record.damage)!==JSON.stringify(node.damage)||
   record.funcs?.length!==node.effects.length)return false;
  return node.effects.every(([ep,dir,fv1,fv2],i)=>{
   const actual=record.funcs[i];
   return actual?.ep===ep&&actual.dir===dir&&
    JSON.stringify(actual.fv1)===JSON.stringify(fv1)&&
    JSON.stringify(actual.fv2)===JSON.stringify(fv2);
  });
 };
 for(let i=0;i<spec.path.length;i++){
  const node=spec.path[i],skill=skillCatalog?.[String(node.id)];
  if(!exact(skill,node))return null;
  if(i===0)continue;
  const parent=skillCatalog?.[String(spec.path[i-1].id)];
  if(!parent?.funcs?.some(effect=>effect.ep==='EP_SKILL_EXEC'&&
   effect.dir==='TARGET'&&effect.fv1?.[3]===node.id))return null;
 }
 // Storm's get-on movement effect is an independent side chain. Verify
 // it explicitly, but never add its action to the direct hit amount.
 for(const side of spec.sidecars||[]){
  const related=skillCatalog?.[String(side.node.id)];
  const parent=skillCatalog?.[String(side.parent)];
  if(!exact(related,side.node)||
   !parent?.funcs?.some(fx=>fx.ep===side.via&&fx.dir==='TARGET'&&
    fx.fv1?.[3]===side.node.id))return null;
 }
 if(first.prereq!=null&&
  (skillCatalog?.[String(first.prereq)]?.id!==first.prereq||
   skillCatalog[String(first.prereq)].learnable!==true))return null;
 return root;
}
function sourceDirectSpell({skillCatalog,classes,jobKey,level,masteries={},
 branchCaps={}},spec){
 const skill=skillCatalog?.[String(spec.id)],job=classes?.[jobKey];
 const cap=branchCaps[spec.branch],trained=masteries[spec.branch]??0;
 if(!skill||!job||job.id!==jobKey||!n(level)||level<1||level>55||
  !n(cap)||cap<spec.req||cap>100||job.branchCaps?.[spec.branch]!==cap||
  !n(trained)||trained>cap||trained<spec.req||
  skill.id!==spec.id||skill.learnable!==true||
  skill.classes?.[jobKey]!==1||skill.branch!==spec.branch||
  skill.skillType!==spec.kind||skill.element!==spec.element||
  skill.powerStat!==spec.stat||skill.charLevel!==spec.charLevel||
  level<skill.charLevel||skill.damage?.kernel!=='element'||
  skill.damage.slotIndex!==spec.slot||
  !Array.isArray(skill.reqs)||skill.reqs.length!==(spec.req?1:0)||
  (spec.req&&(skill.reqs[0]?.branch!==spec.branch||
   skill.reqs[0]?.amount!==spec.req))||
  !Array.isArray(skill.funcs)||skill.funcs.length!==spec.effects.length)
  return null;
 for(let i=0;i<spec.effects.length;i++){
  const fx=skill.funcs[i],expected=spec.effects[i];
  if(fx?.ep!==expected[0]||fx.dir!==expected[1]||
   JSON.stringify(fx.fv1)!==JSON.stringify(expected[2])||
   JSON.stringify(fx.fv2)!==JSON.stringify(expected[3]))return null;
 }
 if(spec.linked){
  const linked=skillCatalog?.[String(spec.linked.id)];
  const l=spec.linked;
  // A linked status skill is not an extra damage packet. Validate its full
  // source signature, including effects and both coefficient arrays, to
  // avoid showing a hit for an obsolete action chain.
  if(linked?.id!==l.id||linked.learnable!==false||
   linked.skillType!==l.kind||linked.branch!==l.branch||
   linked.element!==l.element||linked.powerStat!==l.stat||
   linked.damage!==null||linked.funcs?.length!==l.effects.length||
   !linked.funcs.every((fx,i)=>{
    const expected=l.effects[i];
    return fx?.ep===expected[0]&&fx.dir===expected[1]&&
     JSON.stringify(fx.fv1)===JSON.stringify(expected[2])&&
     JSON.stringify(fx.fv2)===JSON.stringify(expected[3]);
   }))return null;
  const action=skill.funcs.find(row=>row.ep==='EP_SKILL_EXEC'&&
   row.dir==='TARGET'&&row.fv1?.[3]===l.id);
  if(!action)return null;
 }
 return skill;
}
// Current OS 940110001 is a Lv20 PASSIVE of the three advanced mage
// classes. The OS effect collector adds EP_ELEMENT_DAMAGE_SCALE to the
// same elemental-damage stage as item and party effects. In this snapshot
// its 'sorcery' parent is not a trainable branch: only fv1[3]=20 applies.
// Lock the entire source signature, never silently reuse a different skill.
function sourceMagicKnowledge({skillCatalog,classes,jobKey,level,
 masteries={},branchCaps={}}={}){
 if(!['WIZARD','WARLOCK','CONJURER'].includes(jobKey))return 0;
 const skill=skillCatalog?.['940110001'],job=classes?.[jobKey];
 if(!job||job.id!==jobKey||!n(level)||level<1||level>55||
  skill?.id!==940110001||skill.learnable!==true||
  skill.skillType!=='PASSIVE'||skill.branch!=='sorcery'||
  skill.branchRaw!=='SORCERY'||skill.charLevel!==20||
  skill.element!=='NONE'||skill.powerStat!=='INT'||
  skill.damage!==null||skill.weaponUse!==null||
  skill.prereq!==null||skill.reqs?.length!==0||
  JSON.stringify(skill.classes)!==
   '{"WIZARD":1,"WARLOCK":1,"CONJURER":1}'||
  skill.classes?.[jobKey]!==1||
  skill.funcs?.length!==1||skill.funcs[0]?.ep!=='EP_ELEMENT_DAMAGE_SCALE'||
  skill.funcs[0]?.dir!=='TARGET'||
  JSON.stringify(skill.funcs[0]?.fv1)!=='[0,0,6,20]'||
  JSON.stringify(skill.funcs[0]?.fv2)!=='[0,0,0,0]'||
  Object.hasOwn(job.branchCaps||{},'sorcery')||
  Object.hasOwn(branchCaps||{},'sorcery')||
  (masteries?.sorcery??0)!==0)return null;
 return level>=20?20:0;
}
// Matches the OS public BuildCalculator's Et -> kt -> Ie -> ve -> Tt
// single elemental damage packet. A repeated or delayed subskill is NOT a
// complete cast total and is deliberately excluded from these previews.
function elementalHit(options={},spec=null){
 const {skillCatalog,classes,jobKey,level,masteries={},
  branchCaps={},stats={},equipment=[],tables={},itemForth={},unison={},
  modifiers=null}=options;
 const isTrap=!spec,isLinked=!!spec?.path,skill=isTrap?
  sourceSkill(skillCatalog,classes,jobKey,level,masteries.trap,branchCaps):
  isLinked?sourceLinkedSpell(options,spec):sourceDirectSpell(options,spec);
 if(!skill||!n(stats.int)||!Array.isArray(tables.lvModify)||
  !tables.magicPlus)return null;
 const effectSkill=isTrap?skillCatalog['240005003']:
  isLinked?skillCatalog[String(spec.path[spec.damageIndex].id)]:skill;
 // Public OS Et() maps STR, INT, DEX, AGI, VIT and SPI. Kindling Arrow
 // uses STR as its declared power stat, with a ZERO STR coefficient in
 // the current game vector: only its trained Archery and INT affect the hit.
 const powerKey={STR:'str',DEX:'dex',INT:'int',SPI:'spi'}[effectSkill.powerStat];
 // NONE/null in the OS calculator maps to attribute PHYSICAL (index 0).
 const element=effectSkill.element?.toLowerCase()||'physical';
 const masteryKey=isTrap?'trap':isLinked?spec.path[0].branch:spec.branch;
 const mastery=masteries[masteryKey]??0;
 const effect=effectSkill.funcs?.[effectSkill.damage?.slotIndex];
 // Pandora Saga OS public BuildCalculator _e indices:
 // FIRE=1 ->10%, COLD=2 ->20%, LIGHTNING=3 ->50%,
 // CHARM=5 ->0%, HOLY=7 ->25%, DARK=8 ->25%.
 const spread={physical:30,fire:10,cold:20,lightning:50,
  poison:0,charm:0,holy:25,dark:25}[element];
 if(!powerKey||!n(stats[powerKey])||!n(mastery)||!n(spread)||
  effect?.ep!=='EP_ELEMENT_DAMAGE'||effect.dir!=='TARGET'||
  !Array.isArray(effect.fv1)||effect.fv1.length!==4||
  !effect.fv1.every(n)||!Array.isArray(effect.fv2)||
  JSON.stringify(effect.fv2)!=='[0,0,0,0]'||
  !Number.isFinite(target.resists[element]))return null;
 const equipmentEffects=equippedElementalEffects({equipment,itemForth,unison});
 if(!equipmentEffects)return null;
 // The sheet must agree with the equipment damage rate: never silently
 // use forged or obsolete item bonuses.
 const knownGear=modifiers?.combat?.spellDamageEquipmentRate;
 if(!Number.isFinite(knownGear)||
  Math.abs(equipmentEffects.general-knownGear)>0.001)return null;
 const sage=modifiers?.combat?.priestSong?.sageElementDamage||0;
 const enchant=modifiers?.priestApplied?.priestEnchantment?.magicRate||0;
 const magicKnowledge=sourceMagicKnowledge(options);
 if(!Number.isFinite(sage)||!Number.isFinite(enchant)||
  magicKnowledge===null)return null;
 const bonusRate=equipmentEffects.general+
  (equipmentEffects[element]||0)+sage+enchant+magicKnowledge;
 // EP_ELEMENT_BONUS pierces FIRE/COLD/LIGHTNING, but not DARK resistance.
 const penetration=['fire','cold','lightning'].includes(element)?
  equipmentEffects.penetration:0;
 const weapon=equipment.find(x=>x?.record?.slot==='weapon'&&!x?.issue?.length);
 let magicGemRate=0,magicGemFlat=0;
 if(weapon?.gem?.type==='magical'&&weapon.gem.element===element){
  const grade=weapon.refinement??0,plus=tables.magicPlus[String(grade)];
  if(grade>0&&(!n(grade)||grade>10||
   !Number.isFinite(plus?.ratio)||!Number.isFinite(plus?.flat)))return null;
  if(grade>0){magicGemRate=plus.ratio;magicGemFlat=plus.flat;}
 }
 const fv=effect.fv1;
 const param=floor(fv[0]*stats[powerKey]/1000)+
  floor(fv[1]*level/1000)+floor(fv[2]*mastery/1000)+fv[3];
 const intStep=even(stats.int/10),powerFactor=100+
  intStep*intStep/5+trunc(stats.int/5);
 const basePower=even(powerFactor*param/100);
 const variation=trunc(basePower*spread/100);
 const sourcePoints=[basePower-variation,basePower-variation/2,basePower];
 const gap=monsterLevelModifier(level,target,tables.lvModify);
 if(!gap)return null;
 const resistanceMagic=trunc(target.resists.magic/2);
 const resistanceElement=target.resists[element]-penetration;
 const absorption=even(target.spi*0.5)+target.magicProtection+
  gap.magicProtection;
 // Reuse the EXACT OS resistance and rounding path for each marginal
 // comparison. Removing a buff at the END of the formula would misstate
 // its effect near minimum damage and level-mitigation thresholds.
 const apply=(base,damageRate,gemRate,gemFlat)=>{
  let amount=trunc(base*(100-gap.magicAc)/100);
  amount+=gemFlat+trunc(amount*(damageRate+gemRate)/100);
  amount=Math.max(1,amount);
  const effective=trunc(amount*
   (100-resistanceMagic-resistanceElement)/100)-absorption;
  return effective<0?1:effective;
 };
 const hitRange=(rate,gemRate,gemFlat)=>{
  const [normalMin,normalAvg,normalMax]=sourcePoints.map(value=>
   apply(value,rate,gemRate,gemFlat));
  let min=normalMin,average=normalAvg,max=normalMax;
  if(gap.magicDamageReduction>0){
   const fraction=gap.magicDamageReduction/100;
   const weakened=x=>Math.max(1,trunc(x/5));
   average=Math.round(average*(1-fraction)+weakened(average)*fraction);
   min=weakened(min);
  }
  if(![min,average,max].every(n)||min>max||average>max||
   average<min)return null;
  return {min,average,max};
 };
 const current=hitRange(bonusRate,magicGemRate,magicGemFlat);
 if(!current)return null;
 const {min,average,max}=current;
 // "Without" here means only that ONE rate category is disabled;
 // current skill, stats, target, gear and the other effects stay unchanged.
 const equipmentRate=equipmentEffects.general+
  (equipmentEffects[element]||0);
 const allyRate=sage+enchant;
 const withoutAllies=allyRate?
  hitRange(bonusRate-allyRate,magicGemRate,magicGemFlat):null;
 const withoutMagicKnowledge=magicKnowledge?
  hitRange(bonusRate-magicKnowledge,magicGemRate,magicGemFlat):null;
 const withoutItemDamageRate=equipmentRate?
  hitRange(bonusRate-equipmentRate,magicGemRate,magicGemFlat):null;
 const withoutMagicRefinement=(magicGemRate||magicGemFlat)?
  hitRange(bonusRate,0,0):null;
 if((allyRate&&!withoutAllies)||
  (magicKnowledge&&!withoutMagicKnowledge)||
  (equipmentRate&&!withoutItemDamageRate)||
  ((magicGemRate||magicGemFlat)&&!withoutMagicRefinement))return null;
 return {skillId:skill.id,monsterId:target.id,
  targetName:target.name,targetNameEn:target.nameEn,
  min,average,max,element,heroDex:stats.dex,heroInt:stats.int,
  trapMastery:isTrap?mastery:undefined,
  heroPowerKey:powerKey,heroPower:stats[powerKey],
  heroPowerCoefficient:fv[0],
  heroMasteryKey:masteryKey,heroMastery:mastery,
  basePower,bonusRate,magicGemRate,magicGemFlat,
  magicKnowledgeRate:magicKnowledge,
  magicKnowledgeAverageGain:withoutMagicKnowledge?
   average-withoutMagicKnowledge.average:undefined,
  // Marginal impact at the hero's CURRENT equipment/ally/target state.
  // Deltas are separate counterfactuals; they must not be added together.
  allyAverageGain:withoutAllies?
   average-withoutAllies.average:undefined,
  itemDamageAverageGain:withoutItemDamageRate?
   average-withoutItemDamageRate.average:undefined,
  refinementAverageGain:withoutMagicRefinement?
   average-withoutMagicRefinement.average:undefined,
  gearDamageRate:equipmentEffects.general,
  levelPenalty:gap.magicDamageReduction,
  // The exact OS Worm Bomb root consumes TWO traps. This result is the
  // per-explosion packet; a two-trigger same-target outcome is conditional.
  triggerCount:isTrap?2:undefined,
  hitKind:isTrap?'trap-one':(spec?.directPart||isLinked)?'direct-part':'single-hit',
  model:'Pandora Saga OS public BuildCalculator / one elemental hit'};
}
function crawlingTrap(options={}){return elementalHit(options);}
function supportedSkillHits(options={}){
 const hits=[],trap=crawlingTrap(options);
 if(trap)hits.push(trap);
 for(const spell of [...directSpells,...linkedSpells]){
  const result=elementalHit(options,spell);
  if(result)hits.push(result);
 }
 return hits;
}
root.PandoraOSTargetDamage=Object.freeze({crawlingTrap,supportedSkillHits,
 directSpells,linkedSpells,equippedElementalEffects,
 monsterLevelModifier,roundEven:even,target});
})(typeof window==='undefined'?globalThis:window);
