(function(root){
'use strict';
// A tiny account surface. Passwords and recovery codes are never written to storage.
const KEY='ps-account-session.v1';
let session=null,options=null,trigger=null,panel=null,mode='login',errorLine=null;
let bootstrapPhase='guest';
const setBootstrapPhase=value=>{
 bootstrapPhase=value;
 trigger?.setAttribute('data-account-bootstrap',value);
};
let pendingRecoveryCode=null;
// Feedback survives same-account form remounts (bootstrap/locale) without
// persisting passwords or messages in localStorage. It must never leak into
// another account, another form mode, or a guest session.
let feedbackSource=null,feedbackToken=null,feedbackMode=null;
const resetFeedback=()=>{feedbackSource=null;feedbackToken=null;feedbackMode=null};
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
const USERNAME=/^[a-z][a-z0-9_]{2,19}$/;
const validName=value=>typeof value==='string'&&USERNAME.test(value.toLowerCase())?
 value.toLowerCase():null;
const validSession=value=>value&&typeof value==='object'&&!Array.isArray(value)&&
 TOKEN.test(value.token||'')&&validName(value.username)&&
 Number.isSafeInteger(value.expires)&&value.expires>Date.now();
try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(validSession(raw))session={token:raw.token,expires:raw.expires,
  username:validName(raw.username)};
}catch{}
bootstrapPhase=session?'pending':'guest';
// A tab may stay open beyond the server-issued expiry. Stop using the old
// owner identity before any cloud request or account-dependent UI lookup.
function activeSession(){
 if(!session)return false;
 if(validSession(session))return true;
 clearSession();
 options?.onLogout?.({expired:true});
 return false;
}
function token(){return activeSession()?session.token:null}
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
function info(message){
 feedbackSource=String(message);
 feedbackToken=session?.token||null;
 feedbackMode=mode;
 if(errorLine){
  errorLine.textContent=tr(feedbackSource);
  errorLine.dataset.sourceMessage=feedbackSource;
 }
}
async function request(kind,data=null,auth=token()){
 // Bound account checks: a temporary network timeout is not revocation.
 const signal=typeof AbortSignal!=='undefined'&&
  typeof AbortSignal.timeout==='function'?
  AbortSignal.timeout(kind==='me'?12000:20000):null;
 const response=await fetch(options.baseUrl+'/api/account/'+kind,{
  ...(signal?{signal}:{}),
  method:data===null?'GET':'POST',
  headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},
  ...(data===null?{}:{body:JSON.stringify(data)})
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(result.error||'Ошибка сервера');error.httpStatus=response.status;throw error;}
 return result;
}
function setSession(result){
 const next={token:result?.token,expires:result?.expires,
  username:validName(result?.account?.username)};
 if(!validSession(next))throw Error('Некорректный ответ авторизации');
 // A rejected/malformed successful response must not overwrite the current
 // session, active owner scope or recovery code.
 const recovery=typeof result.recoveryCode==='string'&&TOKEN.test(result.recoveryCode)?
  result.recoveryCode:null;
 localStorage.setItem(KEY,JSON.stringify(next));
 session=next;
 setBootstrapPhase('verified');
 pendingRecoveryCode=recovery;
 resetFeedback();
}
function clearSession(){
 const previousToken=session?.token||null;
 session=null;pendingRecoveryCode=null;
 setBootstrapPhase('guest');
 resetFeedback();
 // Another tab may have signed in as a different account since this tab
 // started. Never erase that other account's active persisted session.
 if(previousToken){
  try{
   const saved=JSON.parse(localStorage.getItem(KEY)||'null');
   if(saved?.token===previousToken)localStorage.removeItem(KEY);
  }catch{}
 }
}
function render(){
 if(!panel||!trigger)return;
 activeSession();
 panel.replaceChildren();
 trigger.classList.toggle('active',Boolean(session));
 trigger.setAttribute('data-account-bootstrap',bootstrapPhase);
 // The saved owner may edit the profile while its /me check is in flight.
 // Only its verification hint is transient; never discard same-owner inputs.
 if(bootstrapPhase==='pending'&&session)
  panel.append(node('p','account-lead account-bootstrap-pending',
   'Проверяем учётную запись…'));
 trigger.title=session?tr('Профиль')+' · '+session.username:tr('Войти или зарегистрироваться');
 trigger.setAttribute('aria-label',trigger.title);
 const title=node('h3','account-title',session?'Профиль':'Аккаунт');
 panel.append(title);
 const sub=node('p','account-lead',session?'Сохранённые билды доступны после входа на другом устройстве.':
  'Логин и пароль — для доступа к сохранённым облачным билдам.');
 panel.append(sub);
 errorLine=node('p','account-feedback');errorLine.setAttribute('role','status');
 if(feedbackSource!==null&&feedbackToken===(session?.token||null)&&
  feedbackMode===mode){
  errorLine.textContent=tr(feedbackSource);
  errorLine.dataset.sourceMessage=feedbackSource;
 }else resetFeedback();
 if(session){
  const identity=node('div','account-identity');
  const avatar=node('span','account-avatar');avatar.setAttribute('aria-hidden','true');
  const account=node('div','account-identity-meta');
  account.append(node('small','','УЧЁТНАЯ ЗАПИСЬ'),
   node('p','account-user','@'+session.username));
  identity.append(avatar,account);
  panel.append(identity);
  const benefits=node('div','account-session-note');
  benefits.append(node('span','','✓'),node('span','','Облачные билды привязаны к вашему профилю'));
  panel.append(benefits);
  if(pendingRecoveryCode){
   const code=pendingRecoveryCode;
   const card=node('div','account-recovery');
   card.append(node('b','','Сохраните резервный код вне браузера'),
    node('p','','Без пароля или этого кода вернуть доступ к аккаунту нельзя.'),
    node('p','','Код доступен до обновления страницы или подтверждения сохранения.'));
   const input=field('','text','off',43);
   input.value=code;input.readOnly=true;
   card.append(input,button('Скопировать код',async()=>{
    try{await navigator.clipboard.writeText(code);info('Код скопирован')}
    catch{input.focus();input.select();info('Скопируйте выделенный код')}
   }));
   card.append(button('Я сохранил код',()=>{
    pendingRecoveryCode=null;card.remove();info('Резервный код скрыт.');
   }));
   panel.append(card);
  }
  const details=node('details','account-password-details');
  const summary=node('summary','account-password-toggle','Изменить пароль');
  details.append(summary);
   const old=field('Текущий пароль','password','current-password'),
    fresh=field('Новый пароль · от 8 символов','password','new-password'),
    confirmFresh=field('Повторите новый пароль','password','new-password');
  old.required=true;fresh.required=true;confirmFresh.required=true;
  fresh.minLength=8;confirmFresh.minLength=8;
  const form=node('form','account-form');
   form.append(old,fresh,confirmFresh);
  const update=button('Изменить пароль',async()=>{
   if(fresh.value!==confirmFresh.value){info('Пароли не совпадают.');return}
   // The action is type=button: unlike Enter/form submission, a direct
   // click does not run native required/minLength validation automatically.
   if(!form.reportValidity())return;
   const owner=session?.token;
   if(!owner)return;
   update.disabled=true;info('Изменяем пароль…');
   try{await request('password',{currentPassword:old.value,password:fresh.value},owner);
    // A slow password response from account A must not mutate forms,
    // feedback or identity after the user signed out or switched accounts.
    if(session?.token!==owner)return;
    old.value='';fresh.value='';confirmFresh.value='';
    details.open=false;
    info('Пароль обновлён. Другие сеансы завершены.');
   }catch(e){if(session?.token===owner)info(e.message)}
   finally{update.disabled=false}
  },'primary');
   form.append(update);
   form.addEventListener('submit',e=>{e.preventDefault();update.click()});
   details.append(form);
  panel.append(details);
  const footer=node('div','account-profile-footer');
  footer.append(button('Выйти из аккаунта',async()=>{
   const owner=session?.token;
   if(!owner)return;
   try{await request('logout',{},owner)}catch{}
   // Do not sign out a new account whose login finished during a delayed
   // logout response from a previous session.
   if(session?.token!==owner)return;
   clearSession();options.onLogout?.();render();
  },'account-signout'));
  panel.append(footer,errorLine);return;
 }
 const tabs=node('div','account-tabs');
 tabs.append(button('Войти',()=>{resetFeedback();mode='login';render()},mode==='login'?'selected':''),
  button('Регистрация',()=>{resetFeedback();mode='register';render()},mode==='register'?'selected':''),
  button('Восстановить',()=>{resetFeedback();mode='recover';render()},mode==='recover'?'selected':''));
 panel.append(tabs);
 const form=node('form','account-form'),username=field('Логин (3–20, a-z, 0-9, _)','text','username',20);
 username.minLength=3;username.required=true;username.spellcheck=false;
 const pass=field(mode==='recover'?'Новый пароль · от 8 символов':
  'Пароль · минимум 8 символов','password',mode==='login'?'current-password':'new-password',128);
 pass.minLength=mode==='login'?1:8;pass.required=true;
 form.append(username,pass);
 let confirm=null,recovery=null;
 if(mode==='register'||mode==='recover'){
  confirm=field('Повторите пароль','password','new-password',128);
  confirm.required=true;confirm.minLength=8;form.append(confirm);
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
   render();
   if(pendingRecoveryCode)info('Сохраните код: после обновления страницы его нельзя будет повторно показать.');
   await options.onLogin?.({register:current==='register',bootstrap:false});
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
 setBootstrapPhase(session?'pending':'guest');
 render();
 // A logout in another tab revokes this tab too when both use the SAME
 // token. Switching to a DIFFERENT account in another tab must never
 // silently switch or sign out the current tab's independent owner.
 root.addEventListener('storage',event=>{
  if(event.key!==KEY||event.newValue!==null||!session)return;
  let previous;
  try{previous=JSON.parse(event.oldValue||'null')}catch{return}
  if(previous?.token!==session.token)return;
  clearSession();
  options?.onLogout?.({otherTab:true});
  render();
 });
 trigger.addEventListener('click',()=>{
  const previous=session?.token||null;
  activeSession();
  panel.hidden=!panel.hidden;
  // Closing/reopening the popover does not mean the owner wanted to discard
  // password edits. Refresh only when its identity changed or no UI exists.
  if(!panel.hidden&&((session?.token||null)!==previous||!panel.hasChildNodes?.()))
   render();
 });
 document.addEventListener('pointerdown',event=>{
  if(!panel.hidden&&!panel.contains(event.target)&&!trigger.contains(event.target))
   panel.hidden=true;
 });
 // An open password/account form must survive a late /me response.
 // Invalid/revoked identities still require an immediate forced rerender.
 let forceBootstrapRender=false;
 const finishBootstrap=()=>{
  // A verified /me reply does not change the account. Do not discard edits
  // merely because the popover was temporarily hidden while it was pending.
  // Revoked/mismatched sessions still force a fresh guest panel.
  // Remove the temporary hint without replacing live password inputs.
  panel.querySelector?.('.account-bootstrap-pending')?.remove();
  if(forceBootstrapRender||!panel.hasChildNodes?.())render();
 };
 if(session){
  const bootstrapToken=session.token,expectedName=session.username;
  try{
   const data=await request('me',null,bootstrapToken);
   // A login or logout may complete while a previous /me is in flight.
   // Never allow its late answer to switch or clear the new account.
   if(session?.token!==bootstrapToken){finishBootstrap();return}
   const verified=validName(data?.account?.username);
   if(!verified||verified!==expectedName){
    const invalid=new Error('Некорректный владелец аккаунта');
    invalid.httpStatus=403;throw invalid;
   }
   session.username=verified;
   setBootstrapPhase('verified');
   options.onLogin?.({register:false,bootstrap:true});
  }catch(error){
   if(session?.token!==bootstrapToken){finishBootstrap();return}
   if(error?.httpStatus===401||error?.httpStatus===403){
    clearSession();
    forceBootstrapRender=true;
    options.onLogout?.({bootstrap:true});
   }else{
    setBootstrapPhase('offline');
    // Keep an unexpired account session on temporary network / Worker outages.
    // A failed availability check is not evidence of revoked credentials.
    options.onLogin?.({register:false,bootstrap:true});
   }
  }
 }else options.onGuest?.();
 finishBootstrap();
}
// A header RU/EN switch re-renders the profile even if its popover was
// closed by the outside-click handler. Keep edits in the current form and its
// validation message in memory, but never carry them across account changes.
function refresh(){
 const identity=session?.token||null,formMode=mode;
 const inputs=Array.from(panel?.querySelectorAll?.('.account-form input')||[]);
 const values=inputs.map(input=>input.value);
 const expanded=panel?.querySelector?.('.account-password-details')?.open;
 const message=errorLine?.dataset?.sourceMessage??null;
 render();
 if((session?.token||null)!==identity||mode!==formMode||!panel)return;
 const restored=Array.from(panel.querySelectorAll?.('.account-form input')||[]);
 if(restored.length!==values.length)return;
 for(let i=0;i<restored.length;i++)restored[i].value=values[i];
 const details=panel.querySelector?.('.account-password-details');
 if(details&&expanded!==undefined)details.open=expanded;
 if(message!==null)info(message);
}
root.PandoraAccountUI=Object.freeze({init,token,
 username:()=>activeSession()?session.username:null,
 refresh,isLoggedIn:()=>activeSession()});
})(typeof window==='undefined'?globalThis:window);
