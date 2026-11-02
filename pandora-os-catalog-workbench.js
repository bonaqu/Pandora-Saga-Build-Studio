(function (root) {
  'use strict';

  // Administrator-only review. UI selection is never a D1 write.
  // The Worker validates the auth token and the expected active snapshot.
  async function open({request, apiBase, modal, h, afterPublish}) {
    const importer = root.PandoraCatalogImport;
    const difference = root.PandoraCatalogDiff;
    const review = root.PandoraOSCatalogReview;
    if (!importer || !difference || !review) throw Error('OS catalog modules are missing');

    const view = h('div', {class:'os-sync'});
    const intro = h('p', {class:'muted',
      text:'Проверяй обновления игрового каталога и выбирай изменения перед публикацией. Сохранённые переводы не перезаписываются.'});
    const actions = h('div', {class:'os-sync-actions'});
    const live = h('button', {type:'button',class:'button-action primary',
      text:'Проверить обновления игрового каталога'});
    const archive = h('button', {type:'button',class:'button-action',text:'Сравнить с архивом проекта'});
    const acceptAll = h('button', {type:'button',class:'button-action',text:'Принять все',disabled:true});
    const declineAll = h('button', {type:'button',class:'button-action',text:'Отклонить все',disabled:true});
    const exportButton = h('button', {type:'button',class:'button-action',text:'Скачать выбранное для GitHub',disabled:true});
    const publish = h('button', {type:'button',class:'button-action primary',
      text:'Применить выбранные изменения',disabled:true});
    const testWrite = h('button',{type:'button',class:'button-action',
      text:'Проверить запись в D1',title:'Безопасная временная запись и удаление',disabled:false});
    const github = h('button',{type:'button',class:'button-action',
      text:'Создать PR в GitHub',disabled:true,
      title:'Создать отдельную ветку с текущими опубликованными игровыми данными'});
    const search = h('input', {type:'search',class:'os-sync-search',
      placeholder:'Найти предмет, навык, ID или раздел…','aria-label':'Поиск изменений'});
    const progress = h('progress', {class:'catalog-import-progress',max:'100',value:'0'});
    const filters=h('div',{class:'os-sync-filters',role:'group','aria-label':'Фильтр изменений'});
    const overview=h('div',{class:'os-sync-overview'});
    const summary = h('div', {class:'os-sync-summary',role:'status'});
    const status = h('p', {class:'muted',role:'status',
      text:'Выбери проверку API или архива. Без твоего подтверждения публикации не будет.'});
    const results = h('div', {class:'os-sync-results'});
    actions.append(live,archive,acceptAll,declineAll,exportButton,publish,github,testWrite);
    view.append(intro,actions,search,filters,overview,progress,summary,status,results);

    let baseline = null, upstream = null, legacy = null, legacyRows = null, mode = null;
    let activeSnapshot = null, changes = [], chosen = new Set(), busy = false;
    let expanded = new Set(), full = new Set(), filterKind='all';
    let githubReady = false, publishedSnapshot = null;

    const filterChoices=[
      ['all','Все'],['added','Новые'],['changed','Изменённые'],
      ['removed','Удалённые'],['accepted','Принятые'],['declined','Отклонённые']
    ];
    const filterButtons=new Map();
    for(const [id,label]of filterChoices){
      const button=h('button',{type:'button',class:'os-sync-filter',
       'aria-pressed':String(id===filterKind),text:label});
      button.onclick=()=>{
        if(busy)return;
        filterKind=id;render();
      };
      filters.append(button);filterButtons.set(id,button);
    }
    function matchesFilter(change){
      if(filterKind==='accepted')return chosen.has(change.id);
      if(filterKind==='declined')return !chosen.has(change.id);
      return filterKind==='all'||change.kind===filterKind;
    }
    function setBusy(value) {
      busy = value;
      live.disabled = value;
      archive.disabled = value;
      search.disabled = value;
      for(const button of filterButtons.values())button.disabled=value;
      for(const control of results.querySelectorAll('button,input[type="checkbox"]'))
        control.disabled = value;
      refreshActions();
    }
    function refreshActions() {
      const selected = chosen.size;
      const ready = !busy && selected > 0 && baseline && upstream;
      acceptAll.disabled = busy || !changes.length;
      declineAll.disabled = busy || !changes.length;
      publish.disabled = !ready;
      exportButton.disabled = !ready;
      github.disabled = busy || !githubReady || !publishedSnapshot;
      testWrite.disabled = busy;
      const byKind={
        all:changes.length,added:changes.filter(row=>row.kind==='added').length,
        changed:changes.filter(row=>row.kind==='changed').length,
        removed:changes.filter(row=>row.kind==='removed').length,
        accepted:selected,declined:changes.length-selected
      };
      for(const [id,label]of filterChoices){
        const button=filterButtons.get(id);
        button.textContent=label+' · '+byKind[id];
        button.classList.toggle('active',id===filterKind);
        button.setAttribute('aria-pressed',String(id===filterKind));
      }
      const stat=(label,value,kind)=>h('div',{class:'os-sync-stat '+kind},[
        h('small',{text:label}),h('strong',{text:String(value)})
      ]);
      overview.replaceChildren(
       stat('Добавлено',byKind.added,'added'),
       stat('Изменено',byKind.changed,'changed'),
       stat('Удалено',byKind.removed,'removed'),
       stat('К публикации',selected,'selected')
      );
      for(const panel of results.querySelectorAll('.os-sync-group')){
        const name=panel.getAttribute('data-game-dataset');
        const count=changes.filter(row=>row.dataset===name&&chosen.has(row.id)).length;
        const total=changes.filter(row=>row.dataset===name).length;
        const label=panel.querySelector('.os-sync-count');
        if(label)label.textContent=count+' / '+total+' принято';
      }
      summary.textContent = changes.length
        ? 'Найдено изменений: ' + changes.length + ' · Принято: ' + selected +
          ' · Отклонено: ' + (changes.length - selected)
        : baseline ? 'Различий в игровых данных нет' : '';
    }
    const checked = change => chosen.has(change.id);
    function setChoice(change, value) {
      if (busy) return;
      if (value) chosen.add(change.id);
      else chosen.delete(change.id);
      if(filterKind==='accepted'||filterKind==='declined')render();
      else refreshActions();
    }

    function fieldPreview(change) {
      const details = h('details', {class:'os-sync-field-details'});
      details.append(h('summary', {text:'Что изменилось'}));
      const fields = difference.changedFields(change.before,change.after);
      const fieldsRu={name:'Название',desc:'Описание',W:'Атака',PEN:'Пробитие',
        AC:'Защита',level:'Уровень',classes:'Доступные классы',
        effects:'Эффекты',soulslot:'Гнёзда душ',meta:'Параметры каталога'};
      for (const field of fields) {
        details.append(h('div',{class:'os-sync-field'},[
          h('code',{text:fieldsRu[field.field]||field.field}),
          h('span',{text:field.before}),
          h('span',{class:'os-sync-field-arrow',text:'→'}),
          h('span',{text:field.after})
        ]));
      }
      return details;
    }

    function render() {
      results.replaceChildren();
      const query = search.value.trim().toLocaleLowerCase();
      for (const name of importer.files) {
        const group = changes.filter(row=>row.dataset===name);
        if (!group.length) continue;
        const filtered = (query ? group.filter(row=>
          (review.labels[name]||name).toLocaleLowerCase().includes(query) ||
          row.key.toLocaleLowerCase().includes(query) ||
          row.title.toLocaleLowerCase().includes(query)) : group).filter(matchesFilter);
        if (!filtered.length) continue;
        const panel = h('details',{class:'os-sync-group','data-game-dataset':name});
        panel.open = expanded.has(name) || Boolean(query);
        panel.addEventListener('toggle',()=> {
          if (panel.open) expanded.add(name);
          else expanded.delete(name);
        });
        const selected = group.filter(checked).length;
        panel.append(h('summary',{class:'os-sync-group-heading'},[
          h('strong',{text:review.labels[name]||name}),
          h('span',{class:'os-sync-count',text:selected+' / '+group.length+' принято'})
        ]));
        const toolbar = h('div',{class:'os-sync-group-actions'});
        const take = h('button',{type:'button',class:'button-action',text:'Принять весь раздел',disabled:busy});
        const reject = h('button',{type:'button',class:'button-action',text:'Отклонить весь раздел',disabled:busy});
        take.addEventListener('click',()=> {
          if (busy) return;
          for (const item of group) chosen.add(item.id);
          refreshActions(); render();
        });
        reject.addEventListener('click',()=> {
          if (busy) return;
          for (const item of group) chosen.delete(item.id);
          refreshActions(); render();
        });
        const takeVisible=h('button',{type:'button',class:'button-action',
          text:'Принять найденное · '+filtered.length,disabled:busy});
        takeVisible.onclick=()=>{
          if(busy)return;
          for(const item of filtered)chosen.add(item.id);
          render();
        };
        toolbar.append(take,reject);
        if(query||filterKind!=='all')toolbar.append(takeVisible);
        panel.append(toolbar);
        const limit = full.has(name)||query?filtered.length:Math.min(40,filtered.length);
        const list = h('div',{class:'os-sync-list'});
        for (const change of filtered.slice(0,limit)) {
          const row = h('article',{class:'os-sync-record'});
          const input = h('input',{type:'checkbox',checked:checked(change),disabled:busy,
            'aria-label':'Принять изменение '+change.key});
          input.addEventListener('change',()=>setChoice(change,input.checked));
          const indicator = change.kind==='added'?'Добавлено':
            change.kind==='removed'?'Удалено':'Изменено';
          row.append(h('label',{class:'os-sync-record-label'},[
            input,
            h('span',{class:'os-sync-record-title'},[
              h('strong',{text:String(change.title)}),
              h('small',{text:change.key})
            ]),
            h('span',{class:'os-sync-kind '+change.kind,text:indicator})
          ]),fieldPreview(change));
          list.append(row);
        }
        panel.append(list);
        if (limit<filtered.length) {
          const more=h('button',{type:'button',class:'button-action',
            text:'Показать остальные '+(filtered.length-limit)+' изменений'});
          more.onclick=()=>{full.add(name);expanded.add(name);render()};
          panel.append(more);
        }
        results.append(panel);
      }
      if(!results.childElementCount&&baseline)results.append(h('p',{class:'os-sync-empty',text:'По этому фильтру изменений нет. Измени запрос или выбери «Все».'}));
      refreshActions();
    }

    const sourceFile = async (name, from) => {
      if (from==='server') return request('/api/admin/catalog/source/'+name+'.json',null);
      const response=await fetch('./data/os/'+name+'.json',{cache:'no-store'});
      if (!response.ok) throw Error('Архив '+name+': HTTP '+response.status);
      return response.json();
    };

    async function compare(from) {
      setBusy(true);
      baseline=null;upstream=null;legacy=null;legacyRows=null;activeSnapshot=null;
      changes=[];chosen=new Set();expanded=new Set();full=new Set();filterKind='all';
      results.replaceChildren();summary.textContent='';
      progress.value=0;
      try {
        const next={},old={};
        for (const [index,name] of importer.files.entries()) {
          status.textContent='Получаю '+name+' · '+(index+1)+'/'+importer.files.length;
          next[name]=await sourceFile(name,from);
          progress.value=Math.round(45*(index+1)/importer.files.length);
        }
        // Reject mixed upstream snapshots if the server changes during 17-file retrieval.
        if(from==='server') {
          const finalMeta=await sourceFile('meta','server');
          if(!review.equal(next.meta,finalMeta))
            throw Error('Игровой каталог обновился во время проверки. Повтори сверку.');
        }
        const locales=await fetch('./data/localization/legacy-approved.v1.json',{cache:'no-store'});
        if (!locales.ok) throw Error('Утверждённый архив перевода недоступен');
        const approved=await locales.json();
        importer.normalize(next,approved); // Reject incomplete live source before review.
        const versions=new Set();
        for (const [index,name] of importer.files.entries()) {
          const alias=name==='strings.en'?'stringsEn':name;
          const response=await fetch(apiBase+'/api/catalog/'+alias+'.json',
            {cache:'no-store',signal:AbortSignal.timeout(15000)});
          if (!response.ok) throw Error('Активная D1 '+name+': HTTP '+response.status);
          const snapshot=response.headers.get('x-ps-catalog-snapshot');
          if (!snapshot) throw Error('D1 не сообщает версию каталога');
          versions.add(snapshot);
          old[name]=await response.json();
          progress.value=45+Math.round(55*(index+1)/importer.files.length);
        }
        const localeResponse=await fetch(apiBase+'/api/catalog/legacyLocale.json',
          {cache:'no-store',signal:AbortSignal.timeout(15000)});
        if (!localeResponse.ok) throw Error('Не получен текущий перевод D1');
        const localeSnapshot=localeResponse.headers.get('x-ps-catalog-snapshot');
        if (!localeSnapshot) throw Error('Нет версии локализации D1');
        versions.add(localeSnapshot);
        if (versions.size!==1) throw Error('D1 изменилась во время проверки — повтори сверку');
        const retained=review.retainLegacyRows(await localeResponse.json());
        importer.normalize(old,retained.locales); // Validate D1 itself, not the local backup.
        const findings=importer.files.flatMap(name=>
          review.changes(name,old[name],next[name]));
        baseline=old;upstream=next;legacy=retained.locales;legacyRows=retained.records;mode=from;
        activeSnapshot=[...versions][0];changes=findings;
        status.textContent=findings.length
          ? 'Сверка завершена. Ни одно изменение не принято автоматически.'
          : 'Данные совпадают. Публикация не требуется.';
        render();
      }catch(error) {
        status.textContent=error.httpStatus===401
          ? 'Для сверки требуется повторный вход администратора. D1 не изменена.'
          : 'Сверка остановлена. D1 не изменена: '+error.message;
        baseline=null;upstream=null;changes=[];
        refreshActions();
      }finally{setBusy(false)}
    }

    function prepare() {
      if (!baseline || !upstream || !chosen.size) throw Error('Нет принятых изменений');
      const combined=review.compose(baseline,upstream,chosen,importer.files);
      // Full structural and count validation is required after selective merging.
      const normalized=importer.normalize(combined,legacy);
      if(!Array.isArray(legacyRows)||legacyRows.length!==normalized.counts.legacyLocale)
        throw Error('Published D1 translation count changed during review');
      normalized.entries.legacyLocale=legacyRows; // Preserve exact IDs, payloads and source attribution.
      return {combined,normalized};
    }

    exportButton.onclick=()=>{
      try {
        const {combined}=prepare();
        const packageData={format:'pandora-studio-reviewed.v1',
          expectedActive:activeSnapshot,source:mode,datasets:combined};
        const blob=new Blob([JSON.stringify(packageData,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const anchor=document.createElement('a');
        anchor.href=url;anchor.download='pandora-studio-reviewed-catalog.json';
        document.body.append(anchor);anchor.click();anchor.remove();
        URL.revokeObjectURL(url);
        status.textContent='Выбранный снимок скачан. GitHub не изменён.';
      }catch(error){status.textContent='Экспорт не выполнен: '+error.message}
    };

    publish.onclick=async()=>{
      let staged;
      try{staged=prepare()}catch(error){status.textContent='Нельзя публиковать: '+error.message;return}
      const added=changes.filter(x=>checked(x)&&x.kind==='added').length;
      const changed=changes.filter(x=>checked(x)&&x.kind==='changed').length;
      const removed=changes.filter(x=>checked(x)&&x.kind==='removed').length;
      if (!confirm('Применить только выбранные изменения игрового каталога?\n'+
        'Новых: '+added+'; изменённых: '+changed+'; удалённых: '+removed+
        '.\nПредыдущий опубликованный снимок останется доступен в D1.'))return;
      setBusy(true);
      try {
        const current=await request('/api/admin/catalog/status',{});
        if (current.active!==activeSnapshot) throw Error('D1 обновлена после проверки. Сверь данные заново.');
        await request('/api/admin/catalog/initialize',{});
        const snapshot='ps-'+crypto.randomUUID().replaceAll('-');
        const prepared=staged.normalized;
        const total=Object.values(prepared.counts).reduce((n,count)=>n+count,0);
        let done=0;
        for (const name of prepared.datasets) {
          const rows=prepared.entries[name];
          for (let offset=0;offset<rows.length;) {
            const batch=[];let size=0;
            while (offset<rows.length && batch.length<30) {
              const entry=rows[offset],bytes=JSON.stringify(entry).length;
              if (bytes>12000) throw Error('Запись слишком велика: '+name+'/'+entry.key);
              if (batch.length && size+bytes>42000) break;
              batch.push(entry);size+=bytes;offset++;
            }
            await request('/api/admin/catalog/batch',{snapshot,dataset:name,records:batch});
            done+=batch.length;
            progress.value=Math.round(done/total*100);
            status.textContent='Подготавливаю '+name+' · '+done+'/'+total;
          }
        }
        const result=await request('/api/admin/catalog/publish',{
          snapshot,extraCounts:prepared.extraCounts,expectedActive:activeSnapshot});
        // The server has already committed this snapshot: never report a rollback
        // if a subsequent local UI refresh fails.
        status.textContent='Данные опубликованы ('+result.active+'). Переводы и GitHub не изменены.';
        publishedSnapshot=result.active;
        chosen.clear();changes=[];baseline=null;upstream=null;
        refreshActions();
        try{
          await afterPublish();
        }catch(error){
          status.textContent='Данные опубликованы, но не удалось обновить страницу: '+
            error.message+'. Обнови страницу вручную.';
        }
      }catch(error){
        status.textContent=error.httpStatus===401
          ? 'Сеанс администратора истёк. Выполни вход заново; D1 не переключена.'
          : 'Не удалось подтвердить публикацию: '+error.message+
              '. Проверь состояние D1 перед повторной попыткой.';
      }finally{setBusy(false)}
    };

    // A separate, authenticated server operation. No GitHub token or file
    // contents ever pass through the browser.
    testWrite.onclick=async()=>{
      if(busy)return;
      if(!confirm('Проверить запись в D1? Будет создана, прочитана и удалена одна временная запись; действующий каталог останется прежним.'))return;
      setBusy(true);
      try{
        const result=await request('/api/admin/catalog/test-write',{});
        if(result.ok!==true||result.readback!==true||result.cleaned!==true)
          throw Error('D1 не подтвердила полное удаление тестовой записи');
        status.textContent='Проверка D1 пройдена: запись, чтение и удаление работают. Игровой каталог не изменён.';
      }catch(error){
        status.textContent=error.httpStatus===401
          ? 'Сеанс администратора завершился. Войди заново.'
          : 'Проверка записи D1 не пройдена: '+error.message;
      }finally{setBusy(false)}
    };
    github.onclick=async()=>{
      if(busy||!githubReady||!publishedSnapshot)return;
      if(!confirm('Создать отдельный GitHub PR из текущего опубликованного игрового каталога?\n'+
        'Он не объединится с основной веткой автоматически.'))return;
      setBusy(true);
      try{
        const active=await request('/api/admin/catalog/status',{});
        if(active.active!==publishedSnapshot)
          throw Error('Каталог уже обновлён в другой вкладке. Открой его заново.');
        const result=await request('/api/admin/catalog/github-pr',{
          expectedActive:publishedSnapshot});
        if(result.unchanged){
          status.textContent='Каталог в GitHub уже совпадает с опубликованным. PR не требуется.';
        }else if(/^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(result.url||'')){
          status.replaceChildren('Проверенный каталог подготовлен. ',
            h('a',{href:result.url,target:'_blank',rel:'noopener noreferrer',
              text:'Открыть PR #'+result.number}));
        }else throw Error('Некорректный ответ интеграции GitHub');
      }catch(error){
        status.textContent=error.httpStatus===401
          ? 'Сеанс администратора завершился. Войди заново.'
          : 'Не удалось создать PR: '+error.message;
      }finally{setBusy(false)}
    };
    // Existing published snapshots can be sent to GitHub even if no new
    // game data arrived during this particular admin session.
    Promise.all([
      request('/api/admin/catalog/github-status',null),
      request('/api/admin/catalog/status',{})
    ]).then(([settings,current])=>{
      githubReady=settings.configured===true;
      publishedSnapshot=current.active||null;
      github.title=githubReady
        ? 'Подготовить PR из опубликованного каталога'
        : 'Для PR требуется секретный GitHub-токен в настройках Worker';
      refreshActions();
    }).catch(()=>{githubReady=false;refreshActions()});

    live.onclick=()=>compare('server');
    archive.onclick=()=>compare('archive');
    acceptAll.onclick=()=>{chosen=new Set(changes.map(item=>item.id));render()};
    declineAll.onclick=()=>{chosen.clear();render()};
    search.addEventListener('input',render);
    refreshActions();
    modal('Игровой каталог · проверка обновлений',view);
  }

  root.PandoraOSCatalogWorkbench=Object.freeze({open});
})(typeof window === 'undefined' ? globalThis : window);
