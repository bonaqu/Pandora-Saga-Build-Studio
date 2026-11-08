(function (root) {
  'use strict';

  // Administrator-only review. UI selection is never a D1 write.
  // The Worker validates the auth token and the expected active snapshot.
  async function open({request, apiBase, modal, h, afterPublish}) {
    // Reuse the game's hover/focus helper. Tooltip text is static, never from D1.
    const hint=(node,description)=>{
      root.PandoraGuideTooltip?.attach(node,description,{hoverDelay:1000});
      return node;
    };
    const importer = root.PandoraCatalogImport;
    const difference = root.PandoraCatalogDiff;
    const review = root.PandoraOSCatalogReview;
    const human = root.PandoraCatalogHumanReview;
    if (!importer || !difference || !review || !human) throw Error('Catalog review modules are missing');

    const view = h('div', {class:'os-sync'});
    const intro = h('div',{class:'os-sync-intro'},[
      h('strong',{text:'Обновление игрового каталога'}),
      h('p',{text:'Проверка получает открытые JSON с сайта pandorasaga-os.com через Cloudflare Worker и сравнивает их с опубликованным каталогом Build Studio в D1. Она не ищет файлы на твоём компьютере и не подключается напрямую к игровому серверу.'})
    ]);
    const actions = h('div', {class:'os-sync-actions'});
    const live = h('button', {type:'button',class:'button-action primary os-sync-main-check',
      text:'Проверить изменения в текущей игре'});
    const archive = h('button', {type:'button',class:'button-action',
      text:'Сверить с сохранённой копией'});
    hint(live,'Получить 17 общедоступных файлов JSON с pandorasaga-os.com через Cloudflare Worker, сравнить с опубликованным каталогом Build Studio в D1. Не читает файлы на ПК, не обращается к клиенту игры и не сохраняет изменения автоматически.');
    hint(archive,'Сравнить D1 с JSON-файлами, которые уже сохранены в GitHub Pages Build Studio. Это архив проекта, а НЕ новые данные с сайта игры. Может содержать более старые характеристики.');
    const archiveChoice=h('details',{class:'os-sync-archive-choice'},[
      h('summary',{text:'Если сайт игры не отдаёт данные'}),
      h('p',{text:'Архивная сверка берёт файлы из репозитория Build Studio, а не с pandorasaga-os.com. Она не проверяет свежесть игрового сервера. Не применяй её результаты как заведомо актуальные.'}),
      archive
    ]);
    const acceptAll = h('button', {type:'button',class:'button-action',text:'Выбрать понятные изменения',disabled:true});
    const declineAll = h('button', {type:'button',class:'button-action',text:'Снять весь выбор',disabled:true});
    const exportButton = h('button', {type:'button',class:'button-action',
      text:'Скачать выбранное для GitHub',disabled:true});
    const publish = h('button', {type:'button',class:'button-action primary',
      text:'Применить выбранные изменения',disabled:true});
    const testWrite = h('button',{type:'button',class:'button-action',
      text:'Проверить сохранение правок',
      disabled:false});
    const github = h('button',{type:'button',class:'button-action',
      text:'Создать PR в GitHub',disabled:true});
    const search = h('input', {type:'search',class:'os-sync-search',
      placeholder:'Поиск по названию, описанию и связанным предметам…','aria-label':'Поиск изменений'});
    const progress = h('progress', {class:'catalog-import-progress',max:'100',value:'0'});
    progress.hidden=true;
    const filters=h('div',{class:'os-sync-filters',role:'group','aria-label':'Фильтр изменений'});
    const overview=h('div',{class:'os-sync-overview'});
    const summary = h('div', {class:'os-sync-summary',role:'status'});
    const sourceBanner=h('p',{class:'os-sync-source-banner',hidden:true});
    const status = h('p', {class:'os-sync-status',role:'status',
      text:'Начни с проверки текущей игры. Если данные недоступны, используй сохранённую копию.'});
    const diagnostic=h('details',{class:'os-sync-diagnostics'},[
      h('summary',{text:'Технические сведения об ошибке'})
    ]);
    diagnostic.hidden=true;
    const diagnosticText=h('p',{class:'muted'});
    diagnostic.append(diagnosticText);
    const results = h('div', {class:'os-sync-results'});
    const reviewSteps=h('section',{class:'os-sync-review-steps'});
    reviewSteps.hidden=true;
    reviewSteps.append(
      h('p',{text:'Сравни игровые значения «было → стало». Отметь только проверенные изменения. Служебные сведения и непонятные параметры не выбираются автоматически.'}),
      h('div',{class:'os-sync-review-actions'},[acceptAll,declineAll,publish])
    );
    const formattingToggle=h('input',{type:'checkbox',disabled:true,
      'aria-label':'Синхронизировать переносы игровых описаний'});
    const formattingLabel=h('span',{text:'Привести переносы строк в описаниях к виду игрового сайта'});
    const formattingInfo=h('p',{class:'muted os-sync-formatting-info',
      text:'Доступно после сверки с игровым сайтом. Не изменяет характеристики, названия или эффекты. Действие выполняется только после подтверждения публикации.'});
    const formattingOption=h('label',{class:'os-sync-formatting-option'},
      [formattingToggle,formattingLabel]);
    const formattingReview=h('div',{class:'os-sync-formatting-review',hidden:true},
      [formattingOption,formattingInfo]);
    reviewSteps.append(formattingReview);
    const russianToggle=h('input',{type:'checkbox',disabled:true,
      'aria-label':'Добавить проверенные русские описания подземелий в D1'});
    const russianLabel=h('span',{text:'Добавить русские описания подземелий'});
    const russianInfo=h('p',{class:'muted os-sync-formatting-info',
      text:'Тексты взяты из сохранённой копии проекта. Публикация только после отдельного подтверждения.'});
    const russianList=h('div',{class:'os-sync-russian-list'});
    const russianDetails=h('details',{class:'os-sync-russian-preview'},[
      h('summary',{text:'Посмотреть русские тексты'}),russianList
    ]);
    const russianOption=h('label',{class:'os-sync-formatting-option'},
      [russianToggle,russianLabel]);
    const russianReview=h('div',{class:'os-sync-formatting-review',hidden:true},
      [russianOption,russianInfo,russianDetails]);
    reviewSteps.append(russianReview);
    const metaStatus=h('p',{class:'muted os-sync-meta-status',
      text:'Контрольные суммы игровых файлов используются для проверки происхождения и целостности данных. Это не характеристики предметов или монстров.'});
    const advanced=h('details',{class:'os-sync-advanced'},[
      h('summary',{text:'Дополнительные инструменты'}),
      metaStatus,
      h('p',{text:'Проверка сохранения не обновляет данные игры. GitHub нужен для фиксации уже опубликованной версии, а скачивание — для ручной работы с данными.'}),
      h('div',{class:'os-sync-advanced-actions'},[testWrite,github,exportButton])
    ]);
    for(const [node,description] of [
      [acceptAll,'Выбрать только изменения, которые удалось расшифровать, исключив непонятные параметры и служебные сведения. Это не публикация.'],
      [declineAll,'Снять галочки со всех изменений. Уже опубликованный каталог D1 останется прежним.'],
      [publish,'После подтверждения сохранить только выбранные изменения как новую версию каталога в Cloudflare D1. Это меняет данные на сайте, но не файлы игры на ПК.'],
      [testWrite,'Проверить временную запись, чтение и удаление в Cloudflare D1. Опубликованные предметы и билды не меняются.'],
      [github,'Создать предложение изменений в репозитории GitHub из уже опубликованной версии D1. Автоматического принятия изменений не будет.'],
      [exportButton,'Скачать файл с выбранными изменениями для ручного обновления GitHub. Ничего не публикует.'],
      [search,'Найти изменения по названиям игровых объектов. Поиск не меняет выбор и не публикует данные.'],
      [archiveChoice.querySelector('summary'),'Открыть отдельную сверку с архивом GitHub Pages. Архивная копия не подтверждает актуальные параметры на игровом сайте.'],
      [advanced.querySelector('summary'),'Необязательные операции: тест записи D1, экспорт и предложение изменений GitHub.']
    ])hint(node,description);
    actions.append(live,archiveChoice,reviewSteps,advanced);
    view.append(intro,actions,sourceBanner,summary,status,diagnostic,progress,filters,overview,search,results);
    for(const element of [filters,overview,search,results])element.hidden=true;

    let baseline = null, upstream = null, legacy = null, legacyRows = null, mode = null;
    let activeSnapshot = null, changes = [], chosen = new Set(), busy = false;
    let formattingCount=0,verifiedRussian=[],localInstances=null;
    let expanded = new Set(), full = new Set(), expandedDetails=new Set(),
        expandedReferences=new Set(), filterKind='all';
    let renderedQuery='',renderedFilter='all';
    const searchCache=new Map();
    let githubReady = false, publishedSnapshot = null;
    const descriptions=new Map();
    const describe=change=>{
      if(!descriptions.has(change.id))descriptions.set(change.id,human.describe(change,{baseline,upstream}));
      return descriptions.get(change.id);
    };
    const safe=change=>!describe(change).uncertain && !describe(change).service;

    const filterChoices=[
      ['all','Все'],['added','Новые'],['changed','Изменённые'],
      ['removed','Удалённые'],['accepted','Выбранные'],['declined','Не выбраны'],
      ['needsReview','Требует проверки'],['links','Игровые ссылки'],
      ['sameVisible','Текст совпадает'],['readable','Расшифрованы']
    ];
    const filterButtons=new Map();
    for(const [id,label]of filterChoices){
      const button=h('button',{type:'button',class:'os-sync-filter',
       'aria-pressed':String(id===filterKind),text:label});
      button.onclick=()=>{
        if(busy)return;
        filterKind=id;render();
      };
      hint(button,({
        all:'Все найденные изменения.',
        added:'Объекты, добавленные в проверяемом источнике.',
        changed:'Объекты, чьи параметры отличаются.',
        removed:'Объекты, которых нет в проверяемом источнике.',
        accepted:'Только изменения с поставленной галочкой.',
        declined:'Изменения без галочки, не выбранные для применения.',
        needsReview:'Неоднозначные или неизвестные параметры — требуют ручного анализа.',
        links:'Изменилась привязка ссылок на предметы. Такие записи нужно выбирать вручную.',
        sameVisible:'Видимый текст одинаков, но исходные записи отличаются. Требуется ручная проверка.',
        readable:'Изменения, для которых доступны понятные названия и описания.'
      })[id]);
      filters.append(button);filterButtons.set(id,button);
    }
    function matchesFilter(change){
      if(filterKind==='accepted')return chosen.has(change.id);
      if(filterKind==='declined')return !chosen.has(change.id);
      if(filterKind==='needsReview')return describe(change).uncertain;
      if(filterKind==='links')return describe(change).rows.some(row=>row.linkChanged);
      if(filterKind==='sameVisible')return describe(change).rows.some(row=>row.sameVisible);
      if(filterKind==='readable')return !describe(change).uncertain;
      return filterKind==='all'||change.kind===filterKind;
    }
    function setBusy(value) {
      busy = value;
      live.disabled = value;
      archive.disabled = value;
      progress.hidden=!value;
      search.disabled = value;
      formattingToggle.disabled=value||!formattingCount||mode!=='server';
      russianToggle.disabled=value||!verifiedRussian.length||mode!=='server';
      for(const button of filterButtons.values())button.disabled=value;
      for(const control of results.querySelectorAll('button,input[type="checkbox"]'))
        control.disabled = value;
      refreshActions();
    }
    function refreshActions() {
      const selected = chosen.size;
      const syncFormatting=mode==='server'&&formattingToggle.checked&&formattingCount>0;
      const syncRussian=mode==='server'&&russianToggle.checked&&verifiedRussian.length>0;
      const ready = !busy && (selected>0||syncFormatting||syncRussian) && baseline && upstream;
      formattingToggle.disabled=busy||mode!=='server'||!formattingCount;
      russianToggle.disabled=busy||mode!=='server'||!verifiedRussian.length;
      russianLabel.textContent='Добавить проверенные русские описания · '+verifiedRussian.length;
      russianInfo.textContent='Тексты взяты из сохранённой копии Build Studio и предложены только при полном совпадении остальных полей с текущей игрой и D1. Другие переводы не заменяются.';
      formattingLabel.textContent='Привести переносы строк в описаниях к виду игрового сайта'+
        (formattingCount?' · '+formattingCount:'');
      formattingInfo.textContent=formattingCount
        ?'В '+formattingCount+' описаниях можно восстановить оригинальные переносы игрового текста. Другие поля не меняются. Понадобятся галочка и подтверждение публикации.'
        :'Оригинальные переносы игровых описаний уже совпадают.';
      acceptAll.disabled = busy || !changes.some(safe);
      declineAll.disabled = busy || !changes.length;
      publish.disabled = !ready;
      exportButton.disabled = !ready;
      github.disabled = busy || !githubReady || !publishedSnapshot;
      testWrite.disabled = busy;
      const reviewing=Boolean(baseline);
      reviewSteps.hidden=!reviewing||(!changes.length&&!formattingCount&&!verifiedRussian.length);
      formattingReview.hidden=!reviewing||mode!=='server'||!formattingCount;
      russianReview.hidden=!reviewing||mode!=='server'||!verifiedRussian.length;
      for(const element of [filters,overview,search,results])element.hidden=!reviewing;
      const byKind={
        all:changes.length,added:changes.filter(row=>row.kind==='added').length,
        changed:changes.filter(row=>row.kind==='changed').length,
        removed:changes.filter(row=>row.kind==='removed').length,
        accepted:selected,declined:changes.length-selected,
        needsReview:changes.filter(row=>describe(row).uncertain).length,
        links:changes.filter(row=>describe(row).rows.some(field=>field.linkChanged)).length,
        sameVisible:changes.filter(row=>describe(row).rows.some(field=>field.sameVisible)).length,
        readable:changes.filter(row=>!describe(row).uncertain).length
      };
      for(const [id,label]of filterChoices){
        const button=filterButtons.get(id);
        button.textContent=label+' · '+byKind[id];
        button.classList.toggle('active',id===filterKind);
        button.setAttribute('aria-pressed',String(id===filterKind));
      }
      // Explain which game areas changed instead of repeating five counters
      // inside a large dashboard of decorative statistics.
      const groups=importer.files.filter(name=>changes.some(row=>row.dataset===name));
      const ordered=[...groups.filter(name=>name!=='meta'),...groups.filter(name=>name==='meta')];
      overview.textContent=ordered.length?'Затронутые разделы: '+
        ordered.map(name=>(review.labels[name]||name)+' · '+
          changes.filter(row=>row.dataset===name).length).join('   •   '):'';
      overview.hidden=!reviewing||!changes.length;
      for(const panel of results.querySelectorAll('.os-sync-group')){
        const name=panel.getAttribute('data-game-dataset');
        const count=changes.filter(row=>row.dataset===name&&chosen.has(row.id)).length;
        const total=changes.filter(row=>row.dataset===name).length;
        const label=panel.querySelector('.os-sync-count');
        if(label)label.textContent=count+' / '+total+' выбрано';
      }
      const service=changes.filter(row=>describe(row).service).length;
      summary.textContent = changes.length
        ? 'Найдено изменений: '+changes.length+(service?' · Служебных: '+service:'')+
          ' · Выбрано: '+selected+' · Не выбрано: '+(changes.length-selected)+
          (byKind.needsReview?' · Нужна проверка: '+byKind.needsReview:'')
        : baseline ? 'Различий в игровых данных нет' : '';
    }
    const checked = change => chosen.has(change.id);
    // Search resolved descriptions and item names without exposing source IDs.
    // Cache once per review so typing does not reparse large catalogs.
    function searchableText(change){
      if(searchCache.has(change.id))return searchCache.get(change.id);
      const description=describe(change);
      const referenceName=id=>{
        const item=upstream?.items?.[id]||baseline?.items?.[id];
        const name=typeof item?.name==='string'?item.name:item?.name?.ru;
        return typeof name==='string'?name:'';
      };
      const readable=value=>String(value??'')
        .replace(/<item\s+([0-9]{1,12})\s*\/?>/gi,(_,id)=>referenceName(id)||' ')
        .replace(/<br\s*\/?>/gi,' ');
      const text=[
        review.labels[change.dataset]||change.dataset,
        change.title,description.title,description.summary,
        ...description.rows.flatMap(field=>[
          field.label,field.linkedItemName||'',
          field.beforeFull??field.before,field.afterFull??field.after
        ])
      ].map(readable).join(' ').toLocaleLowerCase();
      searchCache.set(change.id,text);
      return text;
    }
    function setChoice(change, value) {
      if (busy) return;
      if (value) chosen.add(change.id);
      else chosen.delete(change.id);
      if(filterKind==='accepted'||filterKind==='declined'){
        const inputs=[...results.querySelectorAll('.os-sync-record-label input[type="checkbox"]')];
        const focusIndex=inputs.indexOf(document.activeElement);
        render();
        if(focusIndex>=0){
          const remaining=[...results.querySelectorAll('.os-sync-record-label input[type="checkbox"]')];
          (remaining[Math.min(focusIndex,remaining.length-1)]||search)
            .focus({preventScroll:true});
        }
      }else refreshActions();
    }

    // Build a safe interactive preview from validated source tokens, never from HTML.
    // An item absent from published D1 can be inspected but not linked as published.
    function linkedDescription(source,language='ru',referenceContext='') {
      let occurrence=0;
      const wrap=h('span',{class:'os-sync-linked-text'});
      const names=key=>{
        const item=upstream?.items?.[key]||baseline?.items?.[key];
        if(!item)return null;
        if(language==='en')return upstream?.['strings.en']?.items?.[key]?.n||
          baseline?.['strings.en']?.items?.[key]?.n||item.name;
        return item.name?.ru||item.name;
      };
      const segments=root.PandoraItemPresentation?.descriptionSegments?.(source,names,language);
      if(!segments){wrap.textContent=String(source).replace(/<br\s*\/?>/gi,'\n');return wrap}
      for(const segment of segments){
        if(segment.type!=='item'||!segment.exists){
          wrap.append(document.createTextNode(segment.text));continue;
        }
        const reference=h('span',{class:'os-sync-reference'});
        const refKey=referenceContext?
          referenceContext+'|'+segment.id+'|'+(occurrence++):null;
        const wasExpanded=refKey?expandedReferences.has(refKey):false;
        const button=h('button',{type:'button',class:'os-sync-item-ref',
          'aria-label':'Показать связанный предмет: '+segment.text,
          'aria-expanded':String(wasExpanded),text:segment.text});
        hint(button,'Ссылка на связанный игровой предмет. Нажми, чтобы посмотреть его описание и открыть карточку энциклопедии.');
        const preview=h('span',{class:'os-sync-reference-preview',hidden:!wasExpanded});
        preview.append(h('strong',{text:segment.text}),
          h('small',{text:'Связанный предмет · игровая ссылка в описании'}));
        const record=upstream?.items?.[segment.id]||baseline?.items?.[segment.id];
        const sourceDesc=language==='en'?
          upstream?.['strings.en']?.items?.[segment.id]?.d||
          baseline?.['strings.en']?.items?.[segment.id]?.d:
          record?.desc;
        if(typeof sourceDesc==='string'&&sourceDesc.trim())
          preview.append(h('span',{class:'os-sync-reference-description',
            text:root.PandoraItemPresentation.descriptionText(
              sourceDesc,names,language).slice(0,280)}));
        if(baseline?.items?.[segment.id]){
          // A fresh tab preserves the current selection and scroll position.
          preview.append(h('a',{
            href:'#wiki/item/'+encodeURIComponent(segment.id),target:'_blank',
            rel:'noopener noreferrer',class:'os-sync-reference-open',
            text:'Открыть в энциклопедии (новая вкладка) ↗'}));
        }else preview.append(h('small',{text:'Предмет пока не опубликован в энциклопедии.'}));
        button.onclick=()=>{
          const expanded=preview.hidden;
          preview.hidden=!expanded;
          button.setAttribute('aria-expanded',String(expanded));
          if(refKey){
            if(expanded)expandedReferences.add(refKey);
            else expandedReferences.delete(refKey);
          }
        };
        reference.append(button,preview);
        wrap.append(reference);
      }
      return wrap;
    }
    function fieldPreview(change,description) {
      const content=h('div',{class:'os-sync-explanation'});
      if(description.rows.length>1)content.append(h('small',{
        class:'os-sync-result-count',text:'Изменено параметров: '+description.rows.length}));
      content.append(h('p',{class:'os-sync-change-summary',text:description.summary}));
      if(description.caution)content.append(h('p',{
        class:'os-sync-change-caution',text:description.caution}));
      const details=h('details',{class:'os-sync-field-details'});
      details.open=expandedDetails.has(change.id);
      details.addEventListener('toggle',()=>{
        if(!details.isConnected)return;
        if(details.open)expandedDetails.add(change.id);
        else expandedDetails.delete(change.id);
      });
      details.append(h('summary',{text:'Посмотреть подробно · '+description.rows.length}));
      if(description.rows.length){
        for(const field of description.rows){
          const language=change.dataset==='strings.en'?'en':'ru';
          const oldValue=h('span',{class:'os-sync-full-value os-sync-old'});
          const newValue=h('span',{class:'os-sync-full-value os-sync-new'});
          oldValue.append(field.sourceBefore!==null&&field.sourceBefore!==undefined?
            linkedDescription(field.sourceBefore,language,change.id+'|'+field.label+'|old'):
            document.createTextNode(String(field.beforeFull??field.before)));
          newValue.append(field.sourceAfter!==null&&field.sourceAfter!==undefined?
            linkedDescription(field.sourceAfter,language,change.id+'|'+field.label+'|new'):
            document.createTextNode(String(field.afterFull??field.after)));
          if(field.difference){
            const delta=h('small',{class:'os-sync-value-delta',
              text:(field.delta>0?'▲ ':'▼ ')+field.difference});
            hint(delta,'Изменение числа относительно опубликованной версии. Знак не означает, что изменение полезно или вредно.');
            newValue.append(delta);
          }
          const label=h('strong',{text:field.label});
          if(/^[0-9]{1,12}$/.test(field.linkedItemId||'')&&field.linkedItemName){
            const start=field.label.indexOf(field.linkedItemName);
            if(start>=0){
              label.replaceChildren(
                document.createTextNode(field.label.slice(0,start)),
                linkedDescription('<item '+field.linkedItemId+'>','ru',change.id+'|'+field.label+'|label'),
                document.createTextNode(field.label.slice(start+field.linkedItemName.length))
              );
            }
          }
          const line=h('div',{class:'os-sync-field os-sync-human-field'+
            (field.sourceAfter!==null&&field.sourceAfter!==undefined?' os-sync-description-field':'')},[
            label,
            oldValue,
            h('span',{class:'os-sync-field-arrow',text:'→'}),
            newValue
          ]);
          if(field.note)line.append(h('p',{class:'os-sync-field-note',text:field.note}));
          if(/Доп\. слоты$/.test(field.label))line.append(h('p',{
            class:'os-sync-field-note',
            text:'Это параметр дополнительных слотов конкретного предмета в таблице добычи. «Не указаны» означает отсутствие поля в старом источнике, а не подтверждённый ноль.'}));
          details.append(line);
        }
      }else details.append(h('p',{class:'muted',
        text:'Нет подтверждённой расшифровки. Эти изменения требуют отдельной проверки.'}));
      const raw=h('details',{class:'os-sync-raw-details'});
      raw.append(h('summary',{text:'Технические сведения (для разработчика)'}));
      raw.append(h('small',{class:'os-sync-technical-code',text:'ID: '+change.key}));
      const humanizeValue=value=>{
        const source=String(value);
        if(!/<(?:br|item)\b/i.test(source))return source;
        const locale=change.dataset==='strings.en'?'en':'ru';
        return root.PandoraItemPresentation?.descriptionText(source,key=>{
          const record=upstream?.items?.[key]||baseline?.items?.[key];
          if(!record)return null;
          return locale==='en'?upstream?.['strings.en']?.items?.[key]?.n||
            baseline?.['strings.en']?.items?.[key]?.n||record.name:record.name;
        },locale)||source.replace(/<br\s*\/?>/gi,'\n');
      };
      for(const field of difference.changedFields(change.before,change.after)){
        raw.append(h('div',{class:'os-sync-raw-field'},[
          h('code',{text:field.field}),
          h('span',{text:humanizeValue(field.before)}),h('span',{text:'→'}),
          h('span',{text:humanizeValue(field.after)})
        ]));
      }
      if(description.technical.length)
        raw.append(h('p',{class:'muted',text:description.technical.join('; ')}));
      details.append(raw);content.append(details);
      return content;
    }

    function render() {
      results.replaceChildren();
      const query = search.value.trim().toLocaleLowerCase();
      // The review uses the main modal's scrollbar, not a nested list.
      const scrollHost=view.closest('.modal')||results;
      const scrollBefore=scrollHost.scrollTop;
      const changedView=query!==renderedQuery||filterKind!==renderedFilter;
      for (const name of [...importer.files.filter(x=>x!=='meta'),'meta']) {
        const group = changes.filter(row=>row.dataset===name);
        if (!group.length) continue;
        const filtered=(query ? group.filter(row=>searchableText(row).includes(query))
          :group).filter(matchesFilter);
        if (!filtered.length) continue;
        const panel = h('details',{class:'os-sync-group'+(name==='meta'?' os-sync-service-group':''),
          'data-game-dataset':name});
        panel.open = expanded.has(name) || Boolean(query);
        panel.addEventListener('toggle',()=> {
          if(!panel.isConnected)return;
          if (panel.open) expanded.add(name);
          else expanded.delete(name);
        });
        const selected = group.filter(checked).length;
        panel.append(h('summary',{class:'os-sync-group-heading'},[
          h('strong',{text:review.labels[name]||name}),
          h('span',{class:'os-sync-count',text:selected+' / '+group.length+' выбрано'})
        ]));
        const toolbar = h('div',{class:'os-sync-group-actions'});
        const take = h('button',{type:'button',class:'button-action',text:'Выбрать понятные изменения раздела',disabled:busy||!group.some(safe)});
        const reject = h('button',{type:'button',class:'button-action',text:'Снять выбор раздела',disabled:busy});
        take.addEventListener('click',()=> {
          if (busy) return;
          for (const item of group)if(safe(item))chosen.add(item.id);
          refreshActions(); render();
        });
        reject.addEventListener('click',()=> {
          if (busy) return;
          for (const item of group) chosen.delete(item.id);
          refreshActions(); render();
        });
        const takeVisible=h('button',{type:'button',class:'button-action',
          text:'Выбрать найденное · '+filtered.filter(safe).length,disabled:busy||!filtered.some(safe)});
        takeVisible.onclick=()=>{
          if(busy)return;
          for(const item of filtered)if(safe(item))chosen.add(item.id);
          render();
        };
        toolbar.append(take,reject);
        if(query||filterKind!=='all')toolbar.append(takeVisible);
        panel.append(toolbar);
        const variantTotal=new Map(),variantIndex=new Map(),variantOrder=new Map();
        for(const entry of group){
          const title=describe(entry).title;
          variantTotal.set(title,(variantTotal.get(title)||0)+1);
          const index=(variantIndex.get(title)||0)+1;
          variantIndex.set(title,index);
          variantOrder.set(entry.id,index);
        }
        const limit = full.has(name)||query?filtered.length:Math.min(40,filtered.length);
        const list = h('div',{class:'os-sync-list'});
        for (const change of filtered.slice(0,limit)) {
          const description=describe(change);
          const hasLinks=description.rows.some(field=>field.linkChanged);
          const visuallySame=description.rows.some(field=>field.sameVisible);
          const row = h('article',{class:'os-sync-record'+(description.uncertain?' os-sync-review-caution':'')});
          const helper=h('small',{class:'os-sync-review-level',
            text:description.service?'Служебные данные · ручная проверка':
              hasLinks?'Игровая ссылка · требуется ручная проверка':
              visuallySame?'Видимый текст совпадает · требуется ручная проверка':
              description.uncertain?'Есть нерасшифрованные параметры':
              'Значения расшифрованы · проверь перед выбором'});
          if(variantTotal.get(description.title)>1)
            helper.textContent+=' · Вариант '+variantOrder.get(change.id)+
              ' из '+variantTotal.get(description.title)+' с этим названием';
          const input = h('input',{type:'checkbox',checked:checked(change),disabled:busy,
            'aria-label':'Выбрать изменение '+description.title+
              (hasLinks||visuallySame?' — требуется отдельная проверка':'')});
          input.addEventListener('change',()=>setChoice(change,input.checked));
          const indicator = change.kind==='added'?'Добавлено':
            change.kind==='removed'?'Удалено':'Изменено';
          row.append(h('label',{class:'os-sync-record-label'},[
            input,
            h('span',{class:'os-sync-record-title'},[
              h('strong',{text:description.title}),helper
            ]),
            h('span',{class:'os-sync-kind '+change.kind,text:indicator})
           ]));
          if(hasLinks||visuallySame){
            const signals=h('div',{class:'os-sync-review-signals'});
            if(hasLinks)signals.append(h('small',{
              class:'os-sync-review-signal os-sync-review-signal-link',
              text:'Связь с предметом изменилась · проверить вручную'
            }));
            if(visuallySame)signals.append(h('small',{
              class:'os-sync-review-signal',
              text:'Текст выглядит одинаково · проверить исходное отличие'
            }));
            row.append(signals);
          }
          row.append(fieldPreview(change,description));
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
      // Keep the reviewer's place after selection; only a new search or
      // category filter intentionally starts at the beginning.
      scrollHost.scrollTop=changedView?0:scrollBefore;
      renderedQuery=query;renderedFilter=filterKind;
    }

    const sourceFile = async (name, from) => {
      if (from==='server') {
        try{return await request('/api/admin/catalog/source/'+name+'.json',null)}
        catch(error){
          error.sourceDataset??=name+'.json';
          throw error;
        }
      }
      const response=await fetch('./data/os/'+name+'.json',{cache:'no-store'});
      if (!response.ok) throw Error('Архив '+name+': HTTP '+response.status);
      return response.json();
    };

    // Request only three files at a time, rather than making 35 serial HTTP
    // round-trips. A failure prevents the review from publishing anything.
    async function mapLimited(names,task,limit=3){
      let index=0,failure=null;
      await Promise.all(Array.from({length:Math.min(limit,names.length)},async()=>{
        while(index<names.length&&!failure){
          const name=names[index++];
          try{await task(name)}
          catch(error){failure??=error;return}
        }
      }));
      if(failure)throw failure;
    }

    async function compare(from) {
      setBusy(true);
      descriptions.clear();
      sourceBanner.hidden=false;
      sourceBanner.textContent=from==='server'
        ?'Проверяем открытые данные pandorasaga-os.com и опубликованный каталог Build Studio (D1). Это не прямое подключение к игровому серверу.'
        :'Архивная сверка по данным сохранённой копии: это НЕ проверка текущего игрового сервера. Применение может вернуть старые значения.';
      diagnostic.hidden=true;diagnosticText.textContent='';
      baseline=null;upstream=null;legacy=null;legacyRows=null;activeSnapshot=null;
      changes=[];chosen=new Set();expanded=new Set();full=new Set();
      expandedDetails.clear();expandedReferences.clear();searchCache.clear();
      filterKind='all';renderedQuery='';renderedFilter='all';search.value='';
      formattingCount=0;formattingToggle.checked=false;
      verifiedRussian=[];localInstances=null;russianToggle.checked=false;
      russianDetails.open=false;russianList.replaceChildren();
      results.replaceChildren();summary.textContent='';
      progress.value=0;
      metaStatus.textContent='Служебная проверка контрольных сумм будет доступна после сравнения.';
      refreshActions();
      try {
        const next={},old={};
        let readCount=0;
        await mapLimited(importer.files,async name=>{
          next[name]=await sourceFile(name,from);
          const done=++readCount;
          status.textContent=(from==='server'?'Получаю данные сайта игры':'Читаю архив Build Studio')+
            ' · '+done+' из '+importer.files.length;
          progress.value=Math.round(45*done/importer.files.length);
        });
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
        let compared=0;
        await mapLimited(importer.files,async name=>{
          const alias=name==='strings.en'?'stringsEn':name;
          const response=await fetch(apiBase+'/api/catalog/'+alias+'.json',
            {cache:'no-store',signal:AbortSignal.timeout(15000)});
          if (!response.ok) throw Error('Активная D1 '+name+': HTTP '+response.status);
          const snapshot=response.headers.get('x-ps-catalog-snapshot');
          if (!snapshot) throw Error('D1 не сообщает версию каталога');
          versions.add(snapshot);
          old[name]=await response.json();
          progress.value=45+Math.round(55*(++compared)/importer.files.length);
        });
        const localeResponse=await fetch(apiBase+'/api/catalog/legacyLocale.json',
          {cache:'no-store',signal:AbortSignal.timeout(15000)});
        if (!localeResponse.ok) throw Error('Не получен текущий перевод D1');
        const localeSnapshot=localeResponse.headers.get('x-ps-catalog-snapshot');
        if (!localeSnapshot) throw Error('Нет версии локализации D1');
        versions.add(localeSnapshot);
        if (versions.size!==1) throw Error('D1 изменилась во время проверки — повтори сверку');
        const retained=review.retainLegacyRows(await localeResponse.json());
        importer.normalize(old,retained.locales); // Validate D1 itself, not the local backup.
        const oldSha=old.meta?.sha||{},newSha=next.meta?.sha||{};
        const fingerprintCount=[...new Set([...Object.keys(oldSha),...Object.keys(newSha)])]
          .filter(key=>oldSha[key]!==newSha[key]).length;
        const onlyTechnicalMeta=review.metadataOnlyTechnical(old.meta,next.meta);
        metaStatus.textContent=fingerprintCount
          ?'Сведения об источнике: контрольные суммы '+fingerprintCount+
           ' файлов изменились. Это не означает изменения характеристик. Хэши используются для проверки целостности и не предлагаются к публикации как игровые данные.'
          :'Сведения об источнике: изменения контрольных сумм не обнаружены.';
        if(!onlyTechnicalMeta)
          metaStatus.textContent+=' Есть и изменения настроек каталога — они показаны в списке отдельно и требуют ручной проверки.';
        if(from==='server')try{
          const copy=await fetch('./data/os/instances.json',{cache:'no-store'});
          if(copy.ok)localInstances=await copy.json();
        }catch{} // The optional reviewed translation file must not block gameplay review.
        verifiedRussian=from==='server'?review.sourceMatchedRussianInstances(
          old.instances,next.instances,localInstances):[];
        russianList.replaceChildren(...verifiedRussian.map(row=>h('p',{
          class:'os-sync-russian-row'},[
          h('strong',{text:row.name+' — '}),document.createTextNode(row.blurbRu)
        ])));
        formattingCount=from==='server'?importer.files.reduce((sum,name)=>
          sum+review.formattingChanges(name,old[name],next[name]).length,0):0;
        const findings=importer.files.flatMap(name=>
          name==='meta'&&onlyTechnicalMeta?[]:review.changes(name,old[name],next[name]));
        baseline=old;upstream=next;legacy=retained.locales;legacyRows=retained.records;mode=from;
        activeSnapshot=[...versions][0];changes=findings;
        status.textContent=findings.length
          ? 'Сверка завершена. Ни одно изменение не принято автоматически.'
          : formattingCount||verifiedRussian.length
           ? 'Игровые значения совпадают. Можно отдельно обновить оформление и проверенные русские описания.'
           : 'Данные совпадают. Публикация не требуется.';
        render();
      }catch(error) {
        const unavailable=from==='server'&&(
          error.httpStatus===502||error.httpStatus===503||
          /Game data source|Source unavailable|Failed to fetch|NetworkError/i.test(String(error.message))
        );
        if(unavailable){
          archiveChoice.open=true;
          const reason=String(error.reason||'');
          const code=/^http-(\d{3})$/.exec(reason)?.[1];
          const issue=code==='403'||code==='401'
            ?'Сайт игры не разрешил запрос Cloudflare Worker (HTTP '+code+'). Даже если адрес открывается в браузере, серверные запросы могут блокироваться.'
            :code==='404'
            ?'На сайте игры не найден один из файлов игровых данных (HTTP 404).'
            :code==='429'
            ?'Сайт игры временно ограничил число запросов (HTTP 429).'
            :reason==='timeout'
            ?'Истекло время ожидания ответа сайта игры.'
            :reason==='network'
            ?'Cloudflare Worker не смог установить соединение с сайтом игры.'
            :reason==='invalid-json'||reason==='invalid-format'
            ?'Сайт игры ответил данными, которые нельзя распознать как игровой JSON.'
            :reason==='too-large'
            ?'Ответ сайта игры превысил ограничение безопасности.'
            :code?'Сайт игры ответил HTTP '+code+'.'
            :'Не удалось получить открытые игровые данные через Cloudflare Worker.';
          status.textContent=issue+' Каталог Build Studio не изменён. Архивную копию можно сравнить отдельно, но она может быть старее.';
        }else if(error.httpStatus===401){
          status.textContent='Сеанс администратора завершился. Войди заново, чтобы повторить проверку.';
        }else{
          status.textContent='Сверка не завершена. Действующие данные остались прежними. Попробуй ещё раз или воспользуйся сохранённой копией.';
        }
        diagnosticText.textContent='Этап: '+(error.sourceDataset||'не определён')+
          ' · Ответ Worker: '+(error.httpStatus??'нет HTTP-ответа')+
          ' · Причина: '+(error.reason||'не указана')+
          ' · '+String(error.message||error);
        diagnostic.hidden=false;
        baseline=null;upstream=null;changes=[];
        refreshActions();
      }finally{setBusy(false)}
    }

    function prepare() {
      const syncFormatting=mode==='server'&&formattingToggle.checked&&formattingCount>0;
      const syncRussianInstances=mode==='server'&&russianToggle.checked&&verifiedRussian.length>0;
      if(!baseline||!upstream||(!chosen.size&&!syncFormatting&&!syncRussianInstances))
       throw Error('Нет выбранных изменений для публикации');
      const combined=review.compose(baseline,upstream,chosen,importer.files,
        {syncFormatting,syncRussianInstances,localInstances});
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
      const uncertain=changes.filter(x=>checked(x)&&describe(x).uncertain).length;
      const formatted=mode==='server'&&formattingToggle.checked?formattingCount:0;
      const ruCount=mode==='server'&&russianToggle.checked?verifiedRussian.length:0;
      const sourceWarning=mode==='archive'
        ?'\nИСТОЧНИК: сохранённая копия проекта. Данные могут быть СТАРЕЕ текущей игры.':'\nИСТОЧНИК: текущая игра.';
      const uncertainWarning=uncertain
        ?'\nВНИМАНИЕ: '+uncertain+' выбранных изменений требуют ручной проверки.':'';
      if (!confirm('Применить выбранные изменения игрового каталога?\n'+
        'Новых: '+added+'; изменённых: '+changed+'; удалённых: '+removed+
        '; переносов описаний: '+formatted+'; русских описаний: '+ruCount+'.'+
        sourceWarning+(ruCount?'\nРусские описания — проверенная копия проекта, не текст игрового JSON.':'')+
        uncertainWarning+
        '\nНичего не было опубликовано до этого подтверждения.'))return;
      setBusy(true);
      try {
        const current=await request('/api/admin/catalog/status',{});
        if (current.active!==activeSnapshot) throw Error('D1 обновлена после проверки. Сверь данные заново.');
        await request('/api/admin/catalog/initialize',{});
        const snapshot='ps-'+crypto.randomUUID().replaceAll('-','');
        if(!/^[a-z0-9-]{8,64}$/.test(snapshot))
          throw Error('Не удалось подготовить новую версию каталога');
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
            status.textContent='Подготавливаю обновление · '+done+' из '+total;
          }
        }
        const result=await request('/api/admin/catalog/publish',{
          snapshot,extraCounts:prepared.extraCounts,expectedActive:activeSnapshot});
        // The server has already committed this snapshot: never report a rollback
        // if a subsequent local UI refresh fails.
        status.textContent='Данные опубликованы ('+result.active+'). '+
          (ruCount?'Проверенные русские описания добавлены. ':'')+
          'GitHub не изменён.';
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
      if(!confirm('Проверить, работают ли сохранение и удаление правок? Будут созданы и удалены две временные записи. Игровой каталог и билды не изменяются.'))return;
      setBusy(true);
      try{
        const result=await request('/api/admin/catalog/test-write',{});
        if(result.ok!==true||result.readback!==true||result.cleaned!==true||
           result.overrideReadback!==true||result.overrideCleaned!==true||
           result.activeCatalogUnchanged!==true)
          throw Error('D1 не подтвердила запись, чтение, очистку и неизменность каталога');
        status.textContent='Сохранение работает: обе пробные записи созданы, прочитаны и удалены. Игровой каталог не изменился.';
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
      github.setAttribute('aria-label',githubReady
        ? 'Создать PR в GitHub из опубликованного каталога'
        : 'Создать PR в GitHub — требуется настройка токена на сервере');
      refreshActions();
    }).catch(()=>{githubReady=false;refreshActions()});

    live.onclick=()=>{root.PandoraGuideTooltip?.dismiss();compare('server')};
    archive.onclick=()=>{root.PandoraGuideTooltip?.dismiss();compare('archive')};
    formattingToggle.addEventListener('change',refreshActions);
    russianToggle.addEventListener('change',refreshActions);
    acceptAll.onclick=()=>{chosen=new Set(changes.filter(safe).map(item=>item.id));render()};
    declineAll.onclick=()=>{chosen.clear();render()};
    search.addEventListener('input',render);
    refreshActions();
    modal('Обновление игрового каталога',view);
  }

  root.PandoraOSCatalogWorkbench=Object.freeze({open});
})(typeof window === 'undefined' ? globalThis : window);
