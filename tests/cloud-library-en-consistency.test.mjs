import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load=(path)=>{
 const root={};
 Function('window',readFileSync(new URL('../'+path,import.meta.url),'utf8'))(root);
 return root;
};
const reconcile=load('pandora-studio-build-library-merge.js').PandoraBuildLibraryMerge.reconcile;
const ui=load('pandora-studio-ui-locale.js').PandoraUILocale;
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const A='a'.repeat(32),B='b'.repeat(32);
const saved=(id,level=55)=>({id,name:'My hero',at:100,data:{race:1,job:3,level}});

test('EN collisions preserve both builds and name recovered copies in English',()=>{
 const sameId=reconcile({local:[saved(A,55)],remote:[{id:A,entry:saved(A,45)}],
  newId:()=>B,activeId:A,lang:'en'});
 assert.equal(sameId.copies,1);
 assert.equal(sameId.activeId,B);
 assert.equal(sameId.merged.find(x=>x.id===A).data.level,45);
 assert.equal(sameId.merged.find(x=>x.id===B).name,'My hero · local copy');
 assert.equal(sameId.merged.find(x=>x.id===B).localOnly,true);
 assert.deepEqual(sameId.outgoing,[]);
 const deleted=reconcile({local:[saved(A)],remote:[{id:A,deleted:true}],
  newId:()=>B,lang:'en'});
 assert.equal(deleted.merged[0].name,'My hero · deleted build copy');
 assert.equal(deleted.merged[0].localOnly,true);
});

test('existing Russian names remain unchanged for RU and user original names stay intact',()=>{
 const input=saved(A);
 const result=reconcile({local:[input],remote:[{id:A,entry:saved(A,45)}],
  newId:()=>B,lang:'ru'});
 assert.equal(result.merged.find(x=>x.id===B).name,'My hero · локальная копия');
 assert.equal(input.name,'My hero');
});

test('all cloud-library statuses and warnings have explicit verified RU/EN display mappings',()=>{
 const phrases=[
  'Подключаем облачную библиотеку…',
  'Синхронизируем локальные изменения…',
  'Облачная библиотека подключена',
  'Облачная версия основная · локальные отличия сохранены отдельной копией',
  'Локальные билды доступны · облако пока недоступно',
  'В облаке другая редакция · обновите библиотеку для сохранения обеих версий',
  'Сохранено в браузере · исходный билд в облаке уже удалён',
  'Билд удалён · все его ссылки отозваны',
  'Удалено в браузере · синхронизируем позже',
  'Не удалось записать удаление для повторной отправки',
  'Обнаружены разные версии билда. Обе сохранены отдельно в библиотеке.',
  'Билд удалён. Все его ссылки больше не работают.',
  'Билд удалён локально. Ссылки перестанут работать после синхронизации с облаком.',
  'Облако недоступно. Повторное удаление не удалось поставить в очередь — пока ссылка может работать.',
  'Готово','Уведомление','Ссылка недоступна',
  'Новый пароль · от 8 символов','Пароль · минимум 8 символов'
 ];
 for(const phrase of phrases){
  assert.notEqual(ui.ui(phrase,'en'),phrase,phrase+' is untranslated');
  assert.equal(ui.ui(phrase,'ru'),phrase);
 }
});

test('cloud status is translated on updates and when reopening the Builds tab',()=>{
 const from=app.indexOf('function reportCloudStatus(');
 const to=app.indexOf('\nasync function putCloudBuild(',from);
 assert.ok(from>=0&&to>from);
 const node={textContent:''},document={querySelector:()=>node};
 const code=app.slice(from,to);
 for(const lang of ['ru','en']){
  const holder=Function('window','document','lang',
   'let cloudLibraryStatus=null;'+code+
   '\nreturn {set:reportCloudStatus,source:()=>cloudLibraryStatus}')
   ({PandoraUILocale:ui},document,lang);
  holder.set('Синхронизируем локальные изменения…');
  assert.equal(holder.source(),'Синхронизируем локальные изменения…');
  assert.equal(node.textContent,ui.ui(holder.source(),lang));
 }
 assert.match(app,/activeId:activeBuildId,newId,lang/);
 assert.match(app,/text:window.PandoraUILocale\?\.ui\(cloudLibraryStatus,lang\)/);
 assert.match(app,/window.PandoraUILocale\?\.ui\(message,lang\)/);
});
