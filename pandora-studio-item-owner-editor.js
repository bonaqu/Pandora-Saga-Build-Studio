(function(root){
'use strict';
// Owner edits are deliberately separate from the upstream game catalog.
// Sync updates only the base snapshot, never these approved owner overrides.
const props=['level','W','PEN','AC','atkspeed','range','soulslot'];
const allowedKinds=new Set('1H_SWORD 2H_SWORD 1H_AXE 2H_AXE 1H_BLUNT_WEAPON 2H_BLUNT_WEAPON POLE_ARM LANCE 1H_TRUMP_WEAPON 2H_TRUMP_WEAPON BOW CROSSBOW WAND STAFF HELMET TORSO CUISSES GLOVES BOOTS FOOT_SHIELD HORSE_SHIELD MANTLE RING AMULET BELT EARRING BRIDLE SADDLE STALL POTION TOY ETC RUNEGEM ARROW BOLT EGGMAKE_KIT MASTER_TALKEGG TALKEGG RECIPE BALM SOUL DECO_HELMET DECO_TORSO DECO_CUISSES DECO_GLOVES DECO_BOOTS DECO_MANTLE'.split(' '));
const names={level:'Уровень',W:'Атака',PEN:'Пробитие',AC:'Защита',
 atkspeed:'Скорость атаки',range:'Дальность',soulslot:'Гнёзда душ'};
const effects=[
 ['EP_MAXLIFE_CONST','ОЗ (единицы)'],['EP_MAXMANA_CONST','ОМ (единицы)'],
 ['EP_STRENGTH_CONST','Сила'],['EP_VITARITY_CONST','Выносливость'],
 ['EP_AGILITY_CONST','Ловкость'],['EP_DEXTERITY_CONST','Сноровка'],
 ['EP_SPIRITUAL_CONST','Дух'],['EP_INTELIGENCE_CONST','Интеллект'],
 ['EP_ARMORCLASS_CONST','Защита (единицы)'],['EP_TOHIT_CONST','Меткость'],
 ['EP_CRITICALRATE_CONST','Шанс критического удара'],['EP_DAMAGERATE_CONST','Атака (единицы)'],
 ['EP_MAXLIFE_SCALE','ОЗ (%)'],['EP_MAXMANA_SCALE','ОМ (%)'],
 ['EP_FIRE_RESISTANCE_CONST','Сопротивление огню'],
 ['EP_COLD_RESISTANCE_CONST','Сопротивление холоду'],
 ['EP_MAGIC_RESISTANCE_CONST','Сопротивление магии'],
 ['EP_ATTACKINTERVAL_SCALE','Скорость атаки (%)']
];
const extraLabels={
 EP_ABILITY_RESET:'Сброс способностей',EP_ATTACK_BACKATK_RATE:'Атака со спины',
 EP_AURADAMAGE_CONST:'Урон ауры',EP_AVOIDANCE_CONST:'Уклонение',
 EP_BADEFFECT_TIME_SCALE:'Длительность отрицательных эффектов',
 EP_BLOCK_BREAK_RESIST:'Защита от пробития блока',EP_BOW_CARRY:'Переносимый вес для лука',
 EP_BOW_RANGE:'Дальность лука',EP_CASTINGCANCEL_RESISTANCE_CONST:'Устойчивость к прерыванию заклинаний',
 EP_CAST_HEAL_LIFE_SCALE:'Сила лечения',EP_CHARM_RESISTANCE_CONST:'Сопротивление чарам',
 EP_DAMAGERATE_SCALE:'Сила атаки (%)',EP_DARK_RESISTANCE_CONST:'Сопротивление тьме',
 EP_DESTINED_POISON:'Наложение отравления',EP_DESTINE_WARDING:'Защитный показатель',
 EP_ELEMENT_DAMAGE_SCALE:'Урон стихией (%)',EP_EXPERTISE_RESET:'Сброс мастерства',
 EP_HEAL_LIFE:'Восстановление ОЗ',EP_HEAL_LIFE_RATE:'Восстановление ОЗ (%)',
 EP_HEAL_LIFE_REGENERATOR:'Регенерация ОЗ',EP_HEAL_MANA:'Восстановление ОМ',
 EP_HEAL_MANA_RATE:'Восстановление ОМ (%)',
 EP_HOLY_RESISTANCE_CONST:'Сопротивление свету',
 EP_IMMUNE_BURN:'Невосприимчивость к ожогу',
 EP_IMMUNE_CURSE:'Невосприимчивость к проклятию',
 EP_IMMUNE_DISEASE:'Невосприимчивость к болезни',
 EP_IMMUNE_EVIL:'Защита от злых чар',
 EP_IMMUNE_KNOCKBACK:'Невосприимчивость к отбрасыванию',
 EP_IMMUNE_NUMB:'Невосприимчивость к онемению',
 EP_IMMUNE_RAVING:'Невосприимчивость к помешательству',
 EP_IMMUNE_SILENCE:'Невосприимчивость к молчанию',
 EP_IMMUNE_SLEEP:'Невосприимчивость ко сну',
 EP_IMMUNE_SPI_TYPE:'Невосприимчивость (дух)',
 EP_IMMUNE_STUN:'Невосприимчивость к оглушению',
 EP_IMMUNE_TUMBLE:'Невосприимчивость к падению',
 EP_IMMUNE_VIT_TYPE:'Невосприимчивость (выносливость)',
 EP_MOVESPEED_SCALE:'Скорость передвижения (%)',
 EP_ONDAMAGE_ELEM_SKILL_EXEC:'Стихийное умение при получении урона',
 EP_ONDAMAGE_FIN_DAMAGE_SCALE:'Получаемый конечный урон (%)',
 EP_ONDAMAGE_SKILL_EXEC:'Умение при получении урона',
 EP_ONDAMAGE_SKILL_EXEC_ATTACKER:'Умение атакующему при получении урона',
 EP_ONHIT_SKILL_EXEC:'Умение при попадании',
 EP_ONHIT_SKILL_EXEC_ATTACKER:'Умение атакующему при попадании',
 EP_ONHIT_STUN:'Оглушение при попадании',
 EP_POISON_RESISTANCE_CONST:'Сопротивление яду',
 EP_RACE_CARRY:'Расовая грузоподъёмность',
 EP_RACE_MANA_COSTCUT:'Расовое снижение затрат ОМ',
 EP_RACE_RANGE:'Расовая дальность',
 EP_RANDOM_BOX:'Открытие случайного сундука',
 EP_RECOVERY_BURN:'Снятие ожога',EP_RECOVERY_CURSE:'Снятие проклятия',
 EP_RECOVERY_DISEASE:'Снятие болезни',EP_RECOVERY_NUMB:'Снятие онемения',
 EP_RECOVERY_POISON:'Снятие отравления',EP_RECOVERY_RAVING:'Снятие помешательства',
 EP_RECOVERY_SILENCE:'Снятие молчания',
 EP_RESTART:'Перезапуск',EP_RESTMAP_MOVESPEED_SCALE:'Скорость передвижения в безопасной зоне (%)',
 EP_SKILL_BENCH:'Подготовка навыка',EP_SKILL_DELAY:'Задержка навыка',
 EP_SKILL_EXEC:'Применение навыка',EP_SKILL_EXEC_BALM:'Применение лечебного средства',
 EP_SKILL_EXEC_MAPIN:'Применение навыка при входе на карту',
 EP_TOHIT_SCALE:'Меткость (%)',EP_VOLUME_EXP:'Получаемый опыт'
};
function effectOptions(items){
 const chosen=new Set(effects.map(([code])=>code));
 for(const item of Object.values(items||{}))for(const entry of item?.effects||[])
  if(/^EP_[A-Z0-9_]{2,65}$/.test(entry?.func||''))chosen.add(entry.func);
 return [...chosen].map(func=>({
  value:func,label:effects.find(row=>row[0]===func)?.[1]||extraLabels[func]||
   'Игровой эффект «'+func.replace(/^EP_/,'').toLowerCase().replaceAll('_',' ')+'»'
 })).sort((a,b)=>a.label.localeCompare(b.label,'ru'));
}
const validId=id=>/^[0-9]{1,15}$/.test(String(id));
const plain=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
function ownPatch(overrides,id){
 if(!validId(id))return {};
 try{
  const patch=JSON.parse(overrides?.['itemedit.'+id]||'{}');
  if(!plain(patch))return {};
  const selected={};
  for(const key of props)if(Object.hasOwn(patch,key)&&
    (patch[key]===null||(Number.isFinite(patch[key])&&patch[key]>=0)))
    selected[key]=patch[key];
  if(typeof patch.name==='string'&&patch.name.trim()&&patch.name.length<=240)
   selected.name=patch.name;
  if(typeof patch.desc==='string'&&patch.desc.length<=2000)
   selected.desc=patch.desc;
  if(typeof patch.kind==='string'&&allowedKinds.has(patch.kind))selected.kind=patch.kind;
  if(typeof patch.twoHanded==='boolean')selected.twoHanded=patch.twoHanded;
  if(plain(patch.classes))selected.classes=Object.fromEntries(
   Object.entries(patch.classes).filter(([key,value])=>/^[A-Z_]{2,25}$/.test(key)&&value===1));
  if(Array.isArray(patch.effects)&&patch.effects.length<=32)
   selected.effects=patch.effects.filter(effect=>plain(effect)&&
     /^EP_[A-Z0-9_]{2,65}$/.test(effect.func)&&(effect.a===null||Number.isFinite(effect.a))&&
     ['TARGET','CASTER'].includes(effect.dir)).map(effect=>({...effect}));
  if(typeof patch.sourceNote==='string'&&patch.sourceNote.length<=500)
   selected.sourceNote=patch.sourceNote;
  return selected;
 }catch{return {}}
}
function applyItems(items,overrides){
 if(!plain(items))return items;
 let next=items;
 for(const [key,value] of Object.entries(overrides||{})){
  const match=/^(itemedit|item|itemdesc|itemslots)\.([0-9]{1,15})$/.exec(key);
  if(!match||!items[match[2]])continue;
  if(next===items)next={...items};
  const id=match[2],current=next[id]===items[id]?{...items[id]}:next[id];
  next[id]=current;
  if(match[1]==='itemedit')continue;
  if(match[1]==='item'&&typeof value==='string'&&value.trim())current.name=value;
  else if(match[1]==='itemdesc'&&typeof value==='string'&&value.trim())current.desc=value;
  else if(match[1]==='itemslots'&&/^(?:[0-9]|[12][0-9]|3[0-2])$/.test(String(value)))
   current.soulslot=Number(value);
 }
 // Structured editing takes priority over previous inline text overrides,
 // regardless of the order in which Cloudflare returns override keys.
 for(const key of Object.keys(overrides||{})){
  const match=/^itemedit\.([0-9]{1,15})$/.exec(key);
  if(!match||!items[match[1]])continue;
  if(next===items)next={...items};
  const row=next[match[1]]===items[match[1]]?{...items[match[1]]}:next[match[1]];
  Object.assign(row,ownPatch(overrides,match[1]));
  next[match[1]]=row;
 }
 return next;
}
function open({id,item,base,overrides,h,modal,jobKeys,className,onSave,onReset}){
 if(!validId(id)||!item||!base)throw Error('Предмет не найден в игровом каталоге');
 const previous=ownPatch(overrides,id);
 const panel=h('div',{class:'owner-item-editor'});
 const hint=h('p',{class:'muted',text:'Изменения сохраняются отдельно от данных игрового сервера. Неизменённые поля будут обновляться вместе с каталогом.'});
 const feedback=h('p',{class:'inline-owner-error',role:'status'});
 panel.append(hint);
 const sections=h('div',{class:'owner-item-editor-sections'});
 panel.append(sections);
 const grid=h('div',{class:'owner-item-fields'});
 const inputs=new Map();
 for(const key of props){
  const field=h('label',{class:'owner-item-field'});
  field.append(h('span',{text:names[key]}));
  const value=item[key]??'';
  const input=h('input',{type:'number',step:key==='atkspeed'?'any':'any',
   min:'0',max:'100000',value:String(value),'aria-label':names[key],
   autocomplete:'off'});
  input.value=value===null?'':String(value);
  field.append(input);grid.append(field);inputs.set(key,input);
 }
 const twoHanded=h('input',{type:'checkbox',checked:item.twoHanded===true});
 const grip=h('label',{class:'owner-item-check'},[twoHanded,h('span',{text:'Двуручное оружие'})]);
 const stats=h('section',{class:'owner-item-section'},[
  h('h3',{text:'Характеристики предмета'}),grid,grip
 ]);
 sections.append(stats);
 const identity=h('section',{class:'owner-item-section'});
 const name=h('input',{type:'text',maxlength:'240',autocomplete:'off',
  'aria-label':'Название предмета',value:String(item.name??'')});
 const desc=h('textarea',{rows:5,maxlength:'2000',autocomplete:'off',
  'aria-label':'Описание предмета'});
 desc.value=String(item.desc??'');
 identity.append(h('h3',{text:'Название и описание'}),
  h('label',{class:'owner-item-field'},[h('span',{text:'Название'}),name]),
  h('label',{class:'owner-item-field'},[h('span',{text:'Описание'}),desc]));
 sections.prepend(identity);
 const classesPanel=h('section',{class:'owner-item-section'});
 const classesGrid=h('div',{class:'owner-item-classes'});
 const allowed=new Set(Object.keys(item.classes||{}).filter(key=>item.classes[key]));
 const classes=new Map();
 for(const key of jobKeys){
  const box=h('input',{type:'checkbox',checked:allowed.has(key)});
  classes.set(key,box);
  classesGrid.append(h('label',{class:'owner-item-check'},[box,
   h('span',{text:className(key)||key})]));
 }
 const allButton=h('button',{type:'button',class:'button-action',
  text:'Выбрать все',onclick:()=>{for(const input of classes.values())input.checked=true}});
 const clearButton=h('button',{type:'button',class:'button-action',
  text:'Снять все',onclick:()=>{for(const input of classes.values())input.checked=false}});
 classesPanel.append(h('h3',{text:'Доступные классы'}),
  h('div',{class:'owner-item-actions'},[allButton,clearButton]),classesGrid);
 sections.append(classesPanel);
 const effectPanel=h('section',{class:'owner-item-section'});
 const effectList=h('div',{class:'owner-item-effects'});
 const effectRows=[];
 const addEffect=(value={func:'EP_MAXLIFE_CONST',a:0,b:null,dir:'TARGET',exclusive:null})=>{
  const row=h('div',{class:'owner-item-effect'});
  const select=h('select',{'aria-label':'Тип эффекта'});
  const codes=[...effects];
  if(!codes.some(([code])=>code===value.func))
   codes.push([value.func,value.func+' (из игрового каталога)']);
  for(const [code,label]of codes){
   const option=h('option',{value:code,text:label});
   if(code===value.func)option.selected=true;
   select.append(option);
  }
  const amount=h('input',{type:'number',step:'any',value:value.a===null?'':String(value.a??0),
   'aria-label':'Значение эффекта'});
  const extra=h('input',{type:'number',step:'any',value:value.b==null?'':String(value.b),
   placeholder:'Доп. параметр','aria-label':'Дополнительный параметр'});
  const dir=h('select',{'aria-label':'Применяется к'});
  for(const [code,name]of [['TARGET','К цели'],['CASTER','К владельцу']]){
   const option=h('option',{value:code,text:name});option.selected=code===value.dir;dir.append(option)
  }
  const remove=h('button',{type:'button',class:'button-action',text:'Удалить эффект',
   onclick:()=>{row.remove();effectRows.splice(effectRows.findIndex(x=>x.row===row),1)}});
  row.append(select,amount,extra,dir,remove);effectList.append(row);
  effectRows.push({row,select,amount,extra,dir});
 };
 for(const effect of item.effects||[])addEffect(effect);
 const add=h('button',{type:'button',class:'button-action',text:'+ Добавить эффект',
  onclick:()=>addEffect()});
 effectPanel.append(h('h3',{text:'Эффекты предмета'}),effectList,add);
 sections.append(effectPanel);
 const sourcePanel=h('section',{class:'owner-item-section'});
 const sourceNote=h('textarea',{rows:3,'aria-label':'Примечание администратора об источнике',
  placeholder:'Например, конкретный NPC, обмен или способ получения…'});
 sourceNote.value=previous.sourceNote??item.sourceNote??'';
 sourcePanel.append(h('h3',{text:'Дополнительное примечание о получении'}),
  h('p',{class:'muted',text:'Это пояснение администратора, а не изменение таблиц дропа или обменов NPC.'}),
  sourceNote);
 sections.append(sourcePanel);
 const actions=h('div',{class:'owner-item-actions'});
 const save=h('button',{type:'button',class:'button-action primary',text:'Сохранить изменения'});
 const reset=h('button',{type:'button',class:'button-action',text:'Вернуть исходные данные',
  disabled:!Object.hasOwn(overrides||{},'itemedit.'+id)});
 const cancel=h('button',{type:'button',class:'button-action',text:'Закрыть'});
 const close=()=>{const rootNode=document.getElementById('modalRoot');rootNode.hidden=true;rootNode.replaceChildren()};
 cancel.onclick=close;
 const busy=value=>{save.disabled=value;reset.disabled=value;cancel.disabled=value};
 save.onclick=async()=>{
  const patch={};
  const proposedName=name.value.trim(),proposedDescription=desc.value.trim();
  if(!proposedName||proposedName.length>240){
   feedback.textContent='Название должно содержать от 1 до 240 символов.';name.focus();return;
  }
  if(proposedDescription.length>2000){
   feedback.textContent='Описание должно содержать не более 2000 символов.';desc.focus();return;
  }
  if(proposedName!==String(base.name??''))patch.name=proposedName;
  if(proposedDescription!==String(base.desc??''))patch.desc=proposedDescription;
  for(const [key,input]of inputs){
   const value=input.value.trim()===''?null:Number(input.value);
   if(value!==null&&(!Number.isFinite(value)||value<0||value>(key==='soulslot'?3:100000)||
     (key==='soulslot'&&!Number.isInteger(value)))){
    feedback.textContent='Проверь числовое поле «'+names[key]+'».';input.focus();return;
   }
   if(value!==base[key]&&!(value===null&&base[key]==null))patch[key]=value;
  }
  if(twoHanded.checked!==(base.twoHanded===true))patch.twoHanded=twoHanded.checked;
  const selected=Object.fromEntries([...classes].filter(([,input])=>input.checked).map(([key])=>[key,1]));
  if(JSON.stringify(selected)!==JSON.stringify(base.classes||{}))patch.classes=selected;
  if(effectRows.length>32){feedback.textContent='Можно указать не более 32 эффектов.';return}
  const rows=[];
  for(const entry of effectRows){
   const a=entry.amount.value.trim()===''?null:Number(entry.amount.value),b=entry.extra.value.trim()===''?null:Number(entry.extra.value);
   if((a!==null&&(!Number.isFinite(a)||Math.abs(a)>100000))||
      (b!==null&&(!Number.isFinite(b)||Math.abs(b)>100000))){
    feedback.textContent='Проверь значение эффекта.';return;
   }
   rows.push({func:entry.select.value,dir:entry.dir.value,exclusive:null,a,b});
  }
  if(JSON.stringify(rows)!==JSON.stringify(base.effects||[]))patch.effects=rows;
  const note=sourceNote.value.trim();
  if(note.length>500){feedback.textContent='Примечание: максимум 500 символов.';return}
  if(note)patch.sourceNote=note;
  if(Object.keys(patch).length===0){
   if(Object.hasOwn(overrides||{},'itemedit.'+id)){
    busy(true);try{await onReset();close()}catch(e){feedback.textContent=e.message;busy(false)}
   }else close();
   return;
  }
  busy(true);
  try{await onSave(patch);close()}
  catch(e){feedback.textContent=e.message;busy(false)}
 };
 reset.onclick=async()=>{
  if(!confirm('Вернуть исходные характеристики, классы и эффекты для этого предмета?'))return;
  busy(true);try{await onReset();close()}catch(e){feedback.textContent=e.message;busy(false)}
 };
 actions.append(save,reset,cancel);panel.append(actions,feedback);
 modal('Редактор предмета · '+String(item.name||id),panel);
}
root.PandoraStudioItemOwnerEditor=Object.freeze({open,applyItems,ownPatch,effectOptions});
})(typeof window==='undefined'?globalThis:window);
