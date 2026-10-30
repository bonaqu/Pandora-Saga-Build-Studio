(function(root){
"use strict";
// Exactly the branches visible in the supplied Pandora Saga client screenshots.
// Additional upstream branches remain in archived game data, not in the user's allocation tree.
const groups=[
{id:"melee",ru:"Ближний бой",en:"Melee",branches:["slash","thrust","brush","blow","defense"]},
{id:"tactics",ru:"Тактика",en:"Tactics",branches:["archery","alchemy","assassin","trap","warding"]},
{id:"prayer",ru:"Молитва",en:"Prayer",branches:["benevolence","blessing","exorcism","hymn"]},
{id:"magic",ru:"Магия",en:"Magic",branches:["element","embody","darkness","charm"]},
{id:"special",ru:"Особые",en:"Special",branches:["race","riding"]}
];
const all=new Set(groups.flatMap(group=>group.branches));
const raceKeys=["HUMAN","ELF","DWARF","MYLIN","ENKIDU","RAPIN"];
const branchGroup=key=>groups.find(group=>group.branches.includes(key))||null;
const racePassiveIds=(racialPassives,raceIndex)=>{
 const key=raceKeys[raceIndex];const row=racialPassives?.[key];
 return Array.isArray(row?.skills)?row.skills:[];
};
const selectionValid=(racialPassives,raceIndex,skillId)=>racePassiveIds(racialPassives,raceIndex).some(id=>String(id)===String(skillId));
root.PandoraGameNavigation=Object.freeze({groups,all,raceKeys,branchGroup,racePassiveIds,selectionValid});
})(typeof window==="undefined"?globalThis:window);
