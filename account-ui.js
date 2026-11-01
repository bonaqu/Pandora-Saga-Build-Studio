(function(root){
'use strict';
// A tiny account surface. Passwords and recovery codes are never written to storage.
const KEY='ps-account-session.v1';
let session=null,options=null,trigger=null,panel=null,mode='login',errorLine=null;
try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(raw&&/^[A-Za-z0-9_-]{43}$/.test(raw.token||'')&&
  Number(raw.expires)>Date.now())session=raw;
}catch{}
function token(){return session?.token||null}
const tr=value=>root.PandoraUILocale?.ui(value,document.documentElement.lang)||value;
function node(tag,cls='',text=''){
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text)el.textContent=tr(text);
 return el;
}
function button(text,action,cls=''){
 const b=node('button','account-action '+cls,text);b.type='button';
 b.addEventListener('click',action);return b;
}
function field(placeholder,type='text',auto='off',max=128){
 const input=node('input','account-input');
 input.type=type;input.placeholder=tr(placeholder);input.maxLength=max;
 input.setAttribute('aria-label',tr(placeholder));
 input.autocomplete=auto;return input;
}
function info(message){if(errorLine)errorLine.textContent=tr(message)}
async function request(kind,data=null,auth=token()){
 const response=await fetch(options.baseUrl+'/api/account/'+kind,{
  method:data===null?'GET':'POST',
  headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},
  ...(data===null?{}:{body:JSON.stringify(data)})
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(result.error||'Ошибка сервера');error.httpStatus=response.status;throw error;}
 return result;
}
function setSession(result){
 session={token:result.token,expires:result.expires,username:result.account.username};
 localStorage.setItem(KEY,JSON.stringify(session));
}
function clearSession(){session=null;localStorage.removeItem(KEY)}
function render(){
 if(!panel||!trigger)return;
 panel.replaceChildren();
 trigger.classList.toggle('active',Boolean(session));
 trigger.title=session?tr('Профиль')+' · '+session.username:tr('Войти или зарегистрироваться');
 trigger.setAttribute('aria-label',trigger.title);
 const title=node('h3','account-title',session?'Профиль':'Аккаунт');
 panel.append(title);
 const sub=node('p','account-lead',session?'Сохранённые билды доступны после входа на другом устройстве.':
  'Логин и пароль — для доступа к сохранённым облачным билдам.');
 panel.append(sub);
 errorLine=node('p','account-feedback');errorLine.setAttribute('role','status');
 if(session){
  panel.append(node('p','account-user','@'+session.username));
  const old=field('Текущий пароль','password','current-password'),
    fresh=field('Новый пароль · от 15 символов','password','new-password'),
    confirmFresh=field('Повторите новый пароль','password','new-password');
  old.required=true;fresh.required=true;confirmFresh.required=true;
  fresh.minLength=15;confirmFresh.minLength=15;
  const form=node('form','account-form');
  form.append(old,fresh,confirmFresh);
  const update=button('Изменить пароль',async()=>{
   if(fresh.value!==confirmFresh.value){info('Пароли не совпадают.');return}
   update.disabled=true;info('Изменяем пароль…');
   try{await request('password',{currentPassword:old.value,password:fresh.value});
    old.value='';fresh.value='';confirmFresh.value='';
    info('Пароль обновлён. Другие сеансы завершены.');
   }catch(e){info(e.message)}finally{update.disabled=false}
  },'primary');
  form.append(update);
  form.addEventListener('submit',e=>{e.preventDefault();update.click()});
  panel.append(form);
  panel.append(button('Выйти',async()=>{
   try{await request('logout',{},session.token)}catch{}
   clearSession();options.onLogout?.();render();
  }));panel.append(errorLine);return;
 }
 const tabs=node('div','account-tabs');
 tabs.append(button('Войти',()=>{mode='login';render()},mode==='login'?'selected':''),
  button('Регистрация',()=>{mode='register';render()},mode==='register'?'selected':''),
  button('Восстановить',()=>{mode='recover';render()},mode==='recover'?'selected':''));
 panel.append(tabs);
 const form=node('form','account-form'),username=field('Логин (3–20, a-z, 0-9, _)','text','username',20);
 username.minLength=3;username.required=true;username.spellcheck=false;
 const pass=field(mode==='recover'?'Новый пароль · от 15 символов':
  'Пароль · минимум 15 символов','password',mode==='login'?'current-password':'new-password',128);
 pass.minLength=mode==='login'?1:15;pass.required=true;
 form.append(username,pass);
 let confirm=null,recovery=null;
 if(mode==='register'||mode==='recover'){
  confirm=field('Повторите пароль','password','new-password',128);
  confirm.required=true;confirm.minLength=15;form.append(confirm);
 }
 if(mode==='recover'){
  recovery=field('Резервный код восстановления','text','off',43);
  recovery.required=true;form.append(recovery);
 }
 const submit=node('button','account-action primary',mode==='register'?'Создать аккаунт':
  mode==='recover'?'Восстановить пароль':'Войти');
 submit.type='submit';form.append(submit);
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  if((mode==='register'||mode==='recover')&&pass.value!==confirm.value){
   info('Пароли не совпадают.');return;
  }
  submit.disabled=true;info('Проверяем…');
  try{
   const current=mode;
   const result=await request(current,current==='register'?
    {username:username.value,password:pass.value,legacyKey:options.legacyKey?.()}:
    current==='recover'?{username:username.value,password:pass.value,
     recoveryCode:recovery.value.trim()}:
    {username:username.value,password:pass.value},null);
   setSession(result);
   const code=result.recoveryCode;
   await options.onLogin?.({register:current==='register',bootstrap:false});
   render();
   if(code){
    // Recovery code is displayed once and must be explicitly copied by the owner.
    const card=node('div','account-recovery');
    card.append(node('b','','Сохраните резервный код вне браузера'),
     node('p','','Без пароля или этого кода вернуть доступ к аккаунту нельзя.'));
    const input=field('','text','off',43);input.value=code;input.readOnly=true;
    card.append(input,button('Скопировать код',async()=>{
     try{await navigator.clipboard.writeText(code);info('Код скопирован')}
     catch{input.focus();input.select();info('Скопируйте выделенный код')}
    }));
    panel.insertBefore(card,errorLine);
    info('Код показан только сейчас. Сохраните его перед закрытием профиля.');
   }
  }catch(ex){info(ex.message)}
  finally{submit.disabled=false}
 });
 panel.append(form,errorLine);
 panel.append(node('p','account-small','Без электронной почты и СМС. После регистрации сохраните резервный код.'));
}
async function init(config){
 options=config;
 trigger=document.getElementById('profileTrigger');
 panel=document.getElementById('accountPanel');
 if(!trigger||!panel)throw Error('Missing account UI elements');
 trigger.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)render()});
 document.addEventListener('pointerdown',event=>{
  if(!panel.hidden&&!panel.contains(event.target)&&!trigger.contains(event.target))
   panel.hidden=true;
 });
 if(session){
  try{
   const data=await request('me',null,session.token);
   session.username=data.account.username;
   options.onLogin?.({register:false,bootstrap:true});
  }catch(error){
   if(error?.httpStatus===401||error?.httpStatus===403){
    clearSession();
    options.onLogout?.({bootstrap:true});
   }else{
    // Keep an unexpired account session on temporary network / Worker outages.
    // A failed availability check is not evidence of revoked credentials.
    options.onLogin?.({register:false,bootstrap:true});
   }
  }
 }else options.onGuest?.();
 render();
}
root.PandoraAccountUI=Object.freeze({init,token,refresh:render,isLoggedIn:()=>Boolean(session)});
})(typeof window==='undefined'?globalThis:window);
