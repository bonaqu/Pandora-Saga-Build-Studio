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
// OS ID-keyed approved Remaked Russian names; leave imported raw data unchanged.
const approvedRacialSkillNames=Object.freeze({
 "900010001": "Бойцовский дух",
 "900010002": "Приспособляемость",
 "900010003": "Знахарство",
 "900020001": "Гармония",
 "900020002": "Зоркость",
 "900020003": "Стойкость разума",
 "900030001": "Упрямое сердце",
 "900030002": "Дух цверга",
 "900030003": "Стальная воля",
 "900040001": "Охотничье чутьё",
 "900040002": "Подавление гнева",
 "900040003": "Интуиция",
 "900050001": "Каменная кожа",
 "900050002": "Сильные руки",
 "900050003": "Дух энкиду",
 "900060001": "Антимагия",
 "900060002": "Всплеск магии",
 "900060003": "Дух кролля"
});
const branchGroup=key=>groups.find(group=>group.branches.includes(key))||null;
const racePassiveIds=(racialPassives,raceIndex)=>{
 const key=raceKeys[raceIndex];const row=racialPassives?.[key];
 return Array.isArray(row?.skills)?row.skills:[];
};
const selectionValid=(racialPassives,raceIndex,skillId)=>racePassiveIds(racialPassives,raceIndex).some(id=>String(id)===String(skillId));
root.PandoraGameNavigation=Object.freeze({groups,all,raceKeys,branchGroup,racePassiveIds,selectionValid,approvedRacialSkillNames});
})(typeof window==="undefined"?globalThis:window);
