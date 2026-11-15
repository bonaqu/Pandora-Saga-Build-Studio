(function (root) {
  'use strict';

  // Administrator-only review. UI selection is never a D1 write.
  // The Worker validates the auth token and the expected active snapshot.
  async function open({request, apiBase, modal, h, afterPublish, getHero=()=>null,
    lang='ru',canEdit=false,copyLabel,editLabel,canCommit=()=>true}) {
    const tr=(ru,en)=>lang==='en'?en:ru;
    const copy=(key,ru,en)=>copyLabel?.(key,ru,en)||tr(ru,en);
    const permitMutation=()=>typeof canCommit!=='function'||canCommit();
    // Only fixed author text, never a game ID, API status or comparison value.
    const authored=(tag,attrs,key,ru,en)=>{
      const node=h(tag,{...attrs,text:copy(key,ru,en)});
      if(!canEdit||typeof editLabel!=='function')return node;
      editLabel(node,key,ru,en);
      // A separate real control supports touch, unlike a decorative
      // ::after pencil. Only this static copy receives the double-click.
      node.id||='os-sync-label-'+key;
      const pencil=h('button',{type:'button',class:'os-sync-copy-pencil',
       text:'✎',title:tr('Изменить текст','Edit text'),
       'aria-label':tr('Изменить пояснение','Edit explanation'),
       'aria-describedby':node.id});
      pencil.addEventListener('click',event=>{
       event.preventDefault();event.stopPropagation();
       node.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
      });
      return h('div',{class:'os-sync-copy-field'},[node,pencil]);
    };
    // A checkbox label must keep native checkbox semantics. Its editor is a
    // sibling OUTSIDE <label>; counts remain non-editable runtime values.
    const choiceEditor=(caption,key,ru,en)=>{
      if(!canEdit||typeof editLabel!=='function')return null;
      editLabel(caption,key,ru,en);
      const pencil=h('button',{type:'button',class:'os-sync-choice-pencil',
       text:'✎',title:tr('Изменить надпись','Edit caption'),
       'aria-label':tr('Изменить надпись','Edit caption')+': '+copy(key,ru,en)});
      pencil.addEventListener('click',event=>{
       event.preventDefault();event.stopPropagation();
       caption.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
      });
      return pencil;
    };
    // Publishing a catalog must never run when a pencil is pressed:
    // place the editor BESIDE the action, not inside its clickable button.
    const action=(button,key,ru,en)=>{
      button.textContent=copy(key,ru,en);
      if(!canEdit||typeof editLabel!=='function')return button;
      const wrap=h('span',{class:'os-sync-action-editor'});
      const host=h('span',{class:'os-sync-action-edit-host',hidden:true});
      button.id||='os-sync-copy-'+key;
      const pencil=h('button',{type:'button',class:'os-sync-owner-pencil',
        text:'✎',title:tr('Переименовать','Rename'),
        'aria-label':tr('Изменить надпись действия','Edit action caption'),
        'aria-describedby':button.id});
      editLabel(host,key,ru,en,{
        onCommitted:next=>{button.textContent=next},
        onFinished:()=>{button.hidden=false;pencil.hidden=false;host.hidden=true}
      });
      for(const [keyName,value] of Object.entries({
        ownerCopySection:'catalog-sync',ownerCopyId:key,
        ownerCopyRu:ru,ownerCopyEn:en}))button.dataset[keyName]=value;
      pencil.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        if(!button.isConnected)return;
        button.hidden=true;pencil.hidden=true;host.hidden=false;
        host.textContent=copy(key,ru,en);
        host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
      });
      wrap.append(button,pencil,host);return wrap;
    };
    // Reuse the game's hover/focus helper. All hints remain plain text;
    // owner-authored copy updates the existing tooltip, never HTML.
    const hint=(node,description)=>{
      root.PandoraGuideTooltip?.attach(node,description,{hoverDelay:420});
      return node;
    };
    const actionHint=(node,key,ru,en)=>{
      hint(node,copy(key,ru,en));
      node.dataset.guideOwnerKey=key;
      if(!canEdit||typeof editLabel!=='function')return;
      const wrap=node.closest('.os-sync-action-editor');
      if(!wrap)return;
      const host=h('span',{class:'os-sync-hint-edit-host',hidden:true});
      const pencil=h('button',{type:'button',class:'os-sync-hint-pencil',
        text:'?',title:tr('Изменить подсказку','Edit tooltip'),
        'aria-label':tr('Изменить подсказку действия','Edit action tooltip')});
      editLabel(host,key,ru,en,{
        onCommitted:next=>{node.dataset.guideHint=next},
        onFinished:()=>{
          pencil.hidden=false;host.hidden=true;
          wrap.classList.remove('editing-hint');
        }
      });
      pencil.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        if(!node.isConnected)return;
        pencil.hidden=true;host.hidden=false;
        wrap.classList.add('editing-hint');
        host.textContent=copy(key,ru,en);
        host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
      });
      wrap.append(pencil,host);
    };
    // Search and disclosure hints need a separate pencil too. Wrapping the
    // native <details>, rather than putting buttons inside <summary>, keeps
    // mouse, touch and keyboard toggling independent of editing.
    const secondaryHint=(control,key,ru,en)=>{
      const target=control.matches('details')?
        control.querySelector('summary'):control;
      hint(target,copy(key,ru,en));
      target.dataset.guideOwnerKey=key;
      const wrap=h('div',{class:'os-sync-secondary-hint'});
      wrap.append(control);
      if(!canEdit||typeof editLabel!=='function')return wrap;
      const pencil=h('button',{type:'button',class:'os-sync-secondary-pencil',
        text:'?',title:tr('Изменить подсказку','Edit tooltip'),
        'aria-label':tr('Изменить подсказку','Edit tooltip')});
      const host=h('span',{class:'os-sync-secondary-host',hidden:true});
      editLabel(host,key,ru,en,{
        onCommitted:next=>{target.dataset.guideHint=next},
        onFinished:()=>{pencil.hidden=false;host.hidden=true}
      });
      pencil.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        if(!target.isConnected)return;
        pencil.hidden=true;host.hidden=false;
        host.textContent=copy(key,ru,en);
        host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
      });
      wrap.append(pencil,host);
      return wrap;
    };
    const importer = root.PandoraCatalogImport;
    const difference = root.PandoraCatalogDiff;
    const review = root.PandoraOSCatalogReview;
    const human = root.PandoraCatalogHumanReview;
    const safety = root.PandoraCatalogSafety;
    if (!importer || !difference || !review || !human || !safety)
      throw Error('Catalog review modules are missing');

    const view = h('div', {class:'os-sync'});
    const intro = h('div',{class:'os-sync-intro'},[
      authored('strong',{},'title','Обновление игрового каталога','Game catalog updates'),
      authored('p',{},'introExplanation',
       'Проверка сравнивает открытые данные текущей игры с каталогом Build Studio. Она ничего не меняет до отдельного подтверждения и не ищет файлы на твоём компьютере. Доступные JSON не являются прямой проверкой игрового клиента.',
       'Compare the currently available public game data with the Build Studio catalog. Nothing changes until you explicitly confirm; no local files are read. Public JSON is not a direct game-client verification.')
    ]);
    const actions = h('div', {class:'os-sync-actions'});
    const live = h('button', {type:'button',class:'button-action primary os-sync-main-check',
      text:'Проверить изменения в текущей игре'});
    const archive = h('button', {type:'button',class:'button-action',
      text:'Сверить с сохранённой копией'});
    const archiveChoice=h('details',{class:'os-sync-archive-choice'},[
      h('summary',{text:copy('archiveSummary','Если сайт игры не отдаёт данные','When the game site is unavailable')}),
      authored('p',{},'archiveExplanation',
       'Архивная сверка берёт файлы из репозитория Build Studio, а не текущие данные игры. Она не проверяет свежесть игрового сервера: архив может быть старее. Не применяй изменения без отдельной проверки.',
       'Archive comparison uses a saved project snapshot, not current game data. It may be older: do not publish archived changes without verifying them.'),
      action(archive,'archiveButton','Сверить с сохранённой копией','Compare saved snapshot')
    ]);
    const acceptAll = h('button', {type:'button',class:'button-action',text:'Выбрать понятные изменения',disabled:true});
    const acceptEvery = h('button', {type:'button',class:'button-action os-sync-bulk-all',
      text:'Выбрать все найденные изменения',disabled:true});
    const declineAll = h('button', {type:'button',class:'button-action',text:'Снять весь выбор',disabled:true});
    const exportButton = h('button', {type:'button',class:'button-action',
      text:'Скачать выбранное для GitHub',disabled:true});
    const publish = h('button', {type:'button',class:'button-action primary',
      text:'Применить выбранные изменения',disabled:true});
    const testWrite = h('button',{type:'button',class:'button-action',
      text:'Проверить сохранение правок',
      disabled:false});
    const testCAS=h('button',{type:'button',class:'button-action',
      text:'Проверить конфликты правок',disabled:false});
    const github = h('button',{type:'button',class:'button-action',
      text:'Создать PR в GitHub',disabled:true});
    const search = h('input', {type:'search',class:'os-sync-search',
      placeholder:copy('searchPlaceholder',
       'Поиск по названию, описанию и связанным предметам…',
       'Search names, descriptions and linked items…'),
      'aria-label':copy('searchAria','Поиск изменений','Search changes')});
    const progress = h('progress', {class:'catalog-import-progress',max:'100',value:'0'});
    progress.hidden=true;
    const filters=h('div',{class:'os-sync-filters',role:'group',
      'aria-label':copy('filterAria','Фильтр изменений','Change filters')});
    const overview=h('div',{class:'os-sync-overview'});
    const summary = h('div', {class:'os-sync-summary',role:'status'});
    const sourceBanner=h('p',{class:'os-sync-source-banner',hidden:true});
    const status = h('p', {class:'os-sync-status',role:'status'});
    // Only fixed editor-authored messages receive a pencil. Runtime counts,
    // server diagnostics, errors and catalog values remain read-only.
    const editorialState=(target,key,ru,en)=>{
      const label=h('span',{class:'os-sync-state-caption',text:copy(key,ru,en)});
      target.replaceChildren(label);
      if(!canEdit||typeof editLabel!=='function')return;
      editLabel(label,key,ru,en);
      label.id||='os-sync-state-'+key;
      const pencil=h('button',{type:'button',class:'os-sync-state-pencil',
       text:'✎',title:tr('Изменить сообщение','Edit message'),
       'aria-label':tr('Изменить текст сообщения','Edit status text'),
       'aria-describedby':label.id});
      pencil.addEventListener('click',event=>{
       event.preventDefault();event.stopPropagation();
       label.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
      });
      target.append(pencil);
    };
    editorialState(status,'initialStatus',
     'Начни с проверки текущей игры. Если данные недоступны, используй сохранённую копию.',
     'Check the current game first. If it is unavailable, use the saved snapshot.');
    const diagnostic=h('details',{class:'os-sync-diagnostics'},[
      h('summary',{text:copy('diagnosticsSummary',
       'Технические сведения об ошибке','Technical error details')})
    ]);
    diagnostic.hidden=true;
    const diagnosticText=h('p',{class:'muted'});
    diagnostic.append(diagnosticText);
    const results = h('div', {class:'os-sync-results'});
    // The main comparison summary is the sole live status region; avoid
    // shadowing it in the accessibility tree and established review flows.
    const selectionGuidance=h('p',{class:'os-sync-selection-guidance'});
    // One concise review of what the selected changes will actually affect.
    const decisionPreview=h('div',{class:'os-sync-decision-preview',hidden:true});
    const decisionHeading=h('strong',{text:tr('Перед применением','Before publishing')});
    const decisionSummary=h('p',{class:'os-sync-decision-summary'});
    const decisionWarnings=h('p',{class:'os-sync-decision-warnings'});
    const formulaPreview=h('div',{class:'os-sync-formula-preview',hidden:true});
    const formulaTitle=h('strong',{text:tr(
      'Как обновление повлияет на персонажа','How this update affects a character')});
    const formulaStatus=h('p',{class:'os-sync-formula-status'});
    const formulaRows=h('div',{class:'os-sync-formula-rows'});
    const formulaNote=h('small',{class:'os-sync-formula-note',text:tr(
      'Сравниваются реальные модели очков, стартовых характеристик и базовых ОЗ/ОМ без снаряжения и усилений. Урон, эффекты предметов и навыков этим предварительным расчётом не проверяются.',
      'The actual points, base attributes and base HP/MP models are compared without gear or buffs. This preview does not verify damage, item effects or skill effects.')});
    formulaPreview.append(formulaTitle,formulaStatus,formulaRows,formulaNote);
    const riskApproval=h('input',{type:'checkbox',disabled:true});
    const riskApprovalLabel=h('label',{class:'os-sync-risk-approval',hidden:true},[
     riskApproval,h('span',{text:tr(
      'Я проверил спорные изменения и понимаю, что обновится каталог Build Studio.',
      'I reviewed the flagged changes and understand that the Build Studio catalog will change.')})
    ]);
    decisionPreview.append(decisionHeading,decisionSummary,decisionWarnings,formulaPreview,riskApprovalLabel);
    const reviewSteps=h('section',{class:'os-sync-review-steps'});
    reviewSteps.hidden=true;
    reviewSteps.append(
      authored('p',{},'reviewExplanation',
       'Сравни игровые значения «было → стало». Отметь только проверенные изменения. Служебные сведения и непонятные параметры не выбираются автоматически.',
       'Compare old and new game values, then select only verified changes. Unknown parameters and technical metadata are never selected automatically.'),
      h('div',{class:'os-sync-review-actions'},[
       action(acceptAll,'acceptAllButton','Выбрать понятные изменения','Select understood changes'),
       action(acceptEvery,'acceptEveryButton','Выбрать все найденные изменения','Select all found changes'),
       action(declineAll,'declineAllButton','Снять весь выбор','Clear selection'),
       action(publish,'publishButton','Применить выбранные изменения','Publish selected changes')
      ]),selectionGuidance,decisionPreview
    );
    const formattingToggle=h('input',{type:'checkbox',disabled:true,
      'aria-label':copy('formattingAria','Синхронизировать переносы игровых описаний','Synchronize game description line breaks')});
    const formattingRu='Привести переносы строк в описаниях к виду игрового сайта',
      formattingEn='Match line breaks in descriptions to the game site';
    const formattingLabel=h('span',{text:copy('formattingLabel',formattingRu,formattingEn)});
    const formattingCountLabel=h('small',{class:'os-sync-choice-count'});
    const formattingInfo=authored('p',{class:'muted os-sync-formatting-info'},
     'formattingExplanation',
     'После сверки с игровым сайтом можно восстановить оригинальные переносы. Другие поля не меняются. Понадобятся галочка и подтверждение публикации.',
     'After comparing the live game data, original line breaks can be restored. Other fields remain unchanged. This requires selecting the checkbox and confirming publication.');
    const formattingOption=h('label',{class:'os-sync-formatting-option'},
      [formattingToggle,formattingLabel,formattingCountLabel]);
    const formattingChoice=h('div',{class:'os-sync-choice-editor'},[formattingOption]);
    const formattingPencil=choiceEditor(formattingLabel,'formattingLabel',formattingRu,formattingEn);
    if(formattingPencil)formattingChoice.append(formattingPencil);
    const formattingReview=h('div',{class:'os-sync-formatting-review',hidden:true},
      [formattingChoice,formattingInfo]);
    reviewSteps.append(formattingReview);
    const russianToggle=h('input',{type:'checkbox',disabled:true,
      'aria-label':copy('russianDescriptionsAria',
       'Добавить проверенные русские описания подземелий в D1',
       'Add verified Russian dungeon descriptions to D1')});
    const russianRu='Добавить русские описания подземелий',
      russianEn='Add Russian dungeon descriptions';
    const russianLabel=h('span',{text:copy('russianDescriptionsLabel',russianRu,russianEn)});
    const russianCountLabel=h('small',{class:'os-sync-choice-count'});
    const russianInfo=authored('p',{class:'muted os-sync-formatting-info'},
     'russianDescriptionExplanation',
     'Тексты взяты из сохранённой копии Build Studio и предложены только при полном совпадении остальных полей с текущей игрой и D1. Другие переводы не заменяются.',
     'These descriptions come from the saved Build Studio snapshot and are offered only when the other fields match both the live game and D1. Other translations remain unchanged.');
    const russianList=h('div',{class:'os-sync-russian-list'});
    const russianDetails=h('details',{class:'os-sync-russian-preview'},[
      h('summary',{text:copy('russianPreviewSummary','Посмотреть русские тексты','Preview Russian texts')}),russianList
    ]);
    const russianOption=h('label',{class:'os-sync-formatting-option'},
      [russianToggle,russianLabel,russianCountLabel]);
    const russianChoice=h('div',{class:'os-sync-choice-editor'},[russianOption]);
    const russianPencil=choiceEditor(russianLabel,'russianDescriptionsLabel',russianRu,russianEn);
    if(russianPencil)russianChoice.append(russianPencil);
    const russianReview=h('div',{class:'os-sync-formatting-review',hidden:true},
      [russianChoice,russianInfo,russianDetails]);
    reviewSteps.append(russianReview);
    const metaStatus=authored('p',{class:'muted os-sync-meta-status'},'checksumExplanation',
     'Контрольные суммы игровых файлов используются для проверки происхождения и целостности данных. Это не характеристики предметов или монстров.',
     'Game file checksums verify data origin and integrity; they are not item or monster statistics.');
    // Runtime checksum evidence is separate from editable editorial copy.
    // Never replace the pencil-containing explanation wrapper with textContent.
    const metaStatusDetail=h('p',{class:'muted os-sync-meta-detail',hidden:true});
    const advanced=h('details',{class:'os-sync-advanced'},[
      h('summary',{text:copy('advancedSummary','Дополнительные инструменты','Additional tools')}),
      metaStatus,metaStatusDetail,
      authored('p',{},'advancedExplanation',
       'Проверка сохранения не обновляет данные игры. GitHub нужен для фиксации уже опубликованной версии, а скачивание — для ручной работы с данными.',
       'Testing D1 writes does not update game data. GitHub can record an already-published revision; downloads are for manual review.'),
      h('div',{class:'os-sync-advanced-actions'},[
       action(testWrite,'testWriteButton','Проверить сохранение правок','Test D1 writes'),
       action(testCAS,'testCasButton','Проверить конфликты правок','Test edit conflicts'),
       action(github,'githubButton','Создать PR в GitHub','Create GitHub PR'),
       action(exportButton,'exportButton','Скачать выбранное для GitHub','Download selected for GitHub')
      ])
    ]);
    actions.append(action(live,'liveButton','Проверить изменения в текущей игре','Check live game updates'),
     secondaryHint(archiveChoice,'hintArchiveDisclosure',
       'Открыть отдельную сверку с архивом GitHub Pages. Архивная копия не подтверждает актуальные параметры на игровом сайте.',
       'Open a comparison with the GitHub Pages archive. An archived copy cannot verify current game-server values.'),
     reviewSteps,
     secondaryHint(advanced,'hintAdvancedDisclosure',
       'Дополнительные инструменты: диагностика D1, ручной экспорт и повторное создание резервного PR при ошибке автоматической отправки.',
       'Advanced tools: D1 diagnostics, manual export, and retrying the fallback PR if automatic delivery failed.'));
    // Each action tooltip has independent RU/EN D1 copy. Its ? editor is
    // a sibling of the real action button, never part of its click target.
    for(const [node,key,ru,en] of [
      [live,'hintLive',
       'Проверить 17 разделов доступных игровых данных и показать отличия от каталога сайта. Проверка не применяет изменения и не обращается к файлам на ПК.',
       'Check 17 sections of available game data and show differences from the site catalog. This does not publish changes or access local files.'],
      [archive,'hintArchive',
       'Сравнить D1 с JSON-файлами, которые уже сохранены в GitHub Pages Build Studio. Это архив проекта, а НЕ новые данные с сайта игры. Может содержать более старые характеристики.',
       'Compare D1 with JSON already saved in GitHub Pages Build Studio. This is a project archive, NOT live game data, and may have older statistics.'],
      [acceptAll,'hintAcceptAll',
       'Выбрать только изменения, которые удалось расшифровать, исключив непонятные параметры и служебные сведения. Это не публикация.',
       'Select only explained changes, excluding unknown parameters and technical metadata. This does not publish anything.'],
      [acceptEvery,'hintAcceptEvery',
       'Выбрать все найденные изменения, включая удаления, игровые настройки, ссылки и сложные параметры. Если есть спорные записи, потребуется отдельное подтверждение. Контрольные суммы без игровых изменений не предлагаются. Переносы строк из текущей игры включаются.',
       'Select all found changes including removals, game settings, links, and complex fields. Ambiguous entries require an additional confirmation. Technical-only checksums are excluded. Source line breaks are included.'],
      [declineAll,'hintDeclineAll',
       'Снять галочки со всех изменений. Уже опубликованный каталог D1 останется прежним.',
       'Clear every selection. The published D1 catalog remains unchanged.'],
      [publish,'hintPublish',
       'После подтверждения сохранить только выбранные изменения как новую версию каталога в Cloudflare D1. Это меняет данные на сайте, но не файлы игры на ПК.',
       'After confirmation, publish only selected changes as a new Cloudflare D1 catalog version. This changes website data, never local game files.'],
      [testWrite,'hintTestWrite',
       'Проверить временную запись, чтение и удаление в Cloudflare D1. Опубликованные предметы и билды не меняются.',
       'Test temporary write, read and delete operations in Cloudflare D1. Published items and builds are unchanged.'],
      [testCAS,'hintTestCas',
       'Проверить конфликты на двух случайных временных записях. Запись только после подтверждения, без изменения игрового каталога и билдов.',
       'Check conflicts using two randomized temporary records, after confirmation, without changing the game catalog or builds.'],
      [github,'hintGithub',
       'Повторить создание резервного PR из D1. Обычно он создаётся автоматически после обновления каталога и принимается после успешных Node и Chromium проверок, если изменены только игровые JSON.',
       'Retry creating a fallback PR from published D1. Normally it is created automatically and merged after green Node and Chromium checks if only approved game JSON files changed.'],
      [exportButton,'hintExport',
       'Скачать файл с выбранными изменениями для ручного обновления GitHub. Ничего не публикует.',
       'Download selected changes for a manual GitHub update. Nothing is published.']
    ])actionHint(node,key,ru,en);
    const searchField=secondaryHint(search,'hintSearch',
       'Найти изменения по названиям игровых объектов. Поиск не меняет выбор и не публикует данные.',
       'Search changes by game-object names. Searching never changes selection or publishes data.');
    searchField.classList.add('os-sync-search-field');
    const clearSearch=h('button',{type:'button',class:'os-sync-search-clear',
     text:tr('Очистить','Clear'),disabled:true,
     'aria-label':tr('Очистить поиск по игровым изменениям','Clear game changes search'),
     onclick:()=>{search.value='';render();search.focus({preventScroll:true})}});
    searchField.insertBefore(clearSearch,
     searchField.querySelector('.os-sync-secondary-pencil'));
    view.append(intro,actions,sourceBanner,summary,status,diagnostic,progress,
      filters,overview,searchField,results);
    for(const element of [filters,overview,searchField,results])element.hidden=true;

    let baseline = null, upstream = null, legacy = null, legacyRows = null, mode = null;
    let activeSnapshot = null, changes = [], chosen = new Set(), busy = false;
    let publishing=false,riskApprovalFingerprint='',impactCache=null;
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
    const selectedFingerprint=()=>JSON.stringify([
     mode,activeSnapshot,[...chosen].sort(),formattingToggle.checked,russianToggle.checked
    ]);
    // Compare the exact selective merge, not the entire upstream snapshot.
    function selectedImpact(){
      const hero=typeof getHero==='function'?getHero():null;
      const fingerprint=JSON.stringify([selectedFingerprint(),hero]);
      if(impactCache?.fingerprint===fingerprint)return impactCache.result;
      let result;
      try{
        const selected=review.compose(baseline,upstream,chosen,importer.files,{
          syncFormatting:mode==='server'&&formattingToggle.checked&&formattingCount>0,
          syncRussianInstances:mode==='server'&&russianToggle.checked&&verifiedRussian.length>0,
          localInstances
        });
        const validation=safety.check(selected);
        // Read-only numeric replay uses the exact selected snapshot and the
        // site's existing formula modules. Missing old calculations are hard
        // blockers, not just an acknowledgement checkbox.
        const replay=typeof safety.replaySkills==='function'?
         safety.replaySkills(baseline,selected):null;
        if(replay&&!replay.ok){
          const missing=replay.samples.map(row=>
           row.name+' ('+row.job+(row.level?' · '+row.level:'')+')');
          validation.ok=false;
          validation.issues.push(...replay.errors);
          if(replay.lost)validation.issues.push(tr(
           'Пропали ранее доступные расчёты умений: ',
           'Previously supported skill calculations disappeared: ')+
           missing.slice(0,3).join(', ')+
           (replay.lost>3?' (+'+(replay.lost-3)+')':''));
        }
        result={validation,
          comparison:safety.compare(baseline,selected,hero),
          compatibility:safety.compatibility(baseline,selected),replay};
      }catch(error){
        result={validation:{ok:false,issues:[String(error.message||error)]},
          comparison:null};
      }
      impactCache={fingerprint,result};
      return result;
    }
    riskApproval.addEventListener('change',()=>{
     riskApprovalFingerprint=riskApproval.checked?selectedFingerprint():'';
     refreshActions();
    });

    const filterChoices=[
      ['all','Все','All'],['added','Новые','New'],['changed','Изменённые','Changed'],
      ['removed','Удалённые','Removed'],['accepted','Выбранные','Selected'],
      ['declined','Не выбраны','Not selected'],
      ['needsReview','Требует проверки','Needs review'],
      ['links','Игровые ссылки','Game links'],
      ['sameVisible','Текст совпадает','Same visible text'],
      ['readable','Расшифрованы','Explained']
    ];
    const filterButtons=new Map();
    for(const [id,ru,en]of filterChoices){
      const button=h('button',{type:'button',class:'os-sync-filter',
       'aria-pressed':String(id===filterKind),text:tr(ru,en)});
      button.onclick=()=>{
        if(busy)return;
        filterKind=id;render();
      };
      const tips={
        all:['Все найденные изменения.','All detected changes.'],
        added:['Объекты, добавленные в проверяемом источнике.','Entries added in the checked source.'],
        changed:['Объекты, чьи параметры отличаются.','Entries with changed parameters.'],
        removed:['Объекты, которых нет в проверяемом источнике.','Entries missing from the checked source.'],
        accepted:['Только изменения с поставленной галочкой.','Only selected changes.'],
        declined:['Изменения без галочки, не выбранные для применения.','Changes not selected for publication.'],
        needsReview:['Неоднозначные или неизвестные параметры — требуют ручного анализа.','Ambiguous or unknown fields require manual review.'],
        links:['Изменилась привязка ссылок на предметы. Такие записи нужно выбирать вручную.','Item reference links changed; review and select these manually.'],
        sameVisible:['Видимый текст одинаков, но исходные записи отличаются. Требуется ручная проверка.','Displayed text is the same, but the source differs. Review manually.'],
        readable:['Изменения, для которых доступны понятные названия и описания.','Changes with readable labels and descriptions.']
      };
      hint(button,tr(...tips[id]));
      filters.append(button);filterButtons.set(id,button);
    }
    function matchesFilter(change){
      if(filterKind==='accepted')return chosen.has(change.id);
      if(filterKind==='declined')return !chosen.has(change.id);
      if(filterKind==='needsReview')return describe(change).uncertain;
      if(filterKind==='links')return describe(change).rows.some(row=>row.linkChanged);
      if(filterKind==='sameVisible')return describe(change).rows.some(row=>row.sameVisible);
      if(filterKind==='readable')return !describe(change).unexplained;
      return filterKind==='all'||change.kind===filterKind;
    }
    function setBusy(value) {
      busy = value;
      live.disabled = value;
      archive.disabled = value;
      progress.hidden=!value;
      search.disabled = value;
      clearSearch.disabled=value||!search.value.trim();
      formattingToggle.disabled=value||!formattingCount||mode!=='server';
      russianToggle.disabled=value||!verifiedRussian.length||mode!=='server';
      for(const button of filterButtons.values())button.disabled=value;
      for(const control of results.querySelectorAll('button,input[type="checkbox"]'))
        control.disabled = value;
      riskApproval.disabled=value;
      refreshActions();
    }
    function refreshActions() {
      const selected = chosen.size;
      const syncFormatting=mode==='server'&&formattingToggle.checked&&formattingCount>0;
      const syncRussian=mode==='server'&&russianToggle.checked&&verifiedRussian.length>0;
      const ready = !busy && (selected>0||syncFormatting||syncRussian) && baseline && upstream;
      formattingToggle.disabled=busy||mode!=='server'||!formattingCount;
      russianToggle.disabled=busy||mode!=='server'||!verifiedRussian.length;
      russianCountLabel.textContent=' · '+verifiedRussian.length;
      formattingCountLabel.textContent=formattingCount?' · '+formattingCount:'';
      // Preserve editing controls and the D1-authored explanatory copy.
      // Dynamic counts live in the labels and never become editable text.
      acceptAll.disabled = busy || !changes.some(row=>safe(row)&&!chosen.has(row.id));
      acceptEvery.disabled = busy || (!changes.some(row=>!chosen.has(row.id))&&
        !(mode==='server'&&formattingCount>0&&!formattingToggle.checked));
      declineAll.disabled = busy || (!changes.length&&!formattingToggle.checked&&!russianToggle.checked);
      const selectedRows=changes.filter(row=>chosen.has(row.id));
      const deleted=selectedRows.filter(row=>row.kind==='removed').length;
      const settings=selectedRows.filter(row=>describe(row).service).length;
      const unsure=selectedRows.filter(row=>describe(row).uncertain).length;
      const links=selectedRows.filter(row=>describe(row).rows.some(field=>
       field.linkChanged||field.sameVisible)).length;
      const formulas=selectedRows.some(row=>row.dataset==='tables');
      // Check the exact selective merge, before displaying Publish as safe.
      // A changed gameplay effect needs an explicit owner acknowledgement
      // even if its JSON is syntactically valid and the diff is readable.
      const preview=ready?selectedImpact():null;
      const mechanicsReview=preview?.compatibility?.requiresMechanicReview===true;
      const risky=Boolean(deleted||settings||unsure||links||formulas||mechanicsReview||mode==='archive');
      const fingerprint=selectedFingerprint();
      if(riskApprovalFingerprint!==fingerprint)riskApproval.checked=false;
      const acknowledged=!risky||(riskApproval.checked&&riskApprovalFingerprint===fingerprint);
      decisionPreview.hidden=!ready;
      decisionSummary.textContent=tr('Будет обновлено: ','Will update: ')+selected+
       tr(' изменений из ',' changes of ')+changes.length+
       (syncFormatting?tr(' · переносы описаний',' · description line breaks'):'')+
       (syncRussian?tr(' · русские описания',' · Russian descriptions'):'')+
       tr('. Это изменит только каталог Build Studio, не саму игру.',
        '. This changes the Build Studio catalog, not the game.');
      const cautions=[];
      if(deleted)cautions.push(tr('Удаление записей: ','Record removals: ')+deleted);
      if(settings)cautions.push(tr('Настройки игры: ','Game settings: ')+settings);
      if(mechanicsReview)cautions.push(tr(
       'Изменения механик без подтверждённого расчёта: ',
       'Gameplay changes not yet proven by a calculation: ')+
       preview.compatibility.totals.needsReview);
      if(formulas){
       cautions.push(tr('Игровые формулы обновятся целым разделом',
        'Game formula tables will be replaced as a whole'));
       const oldCap=baseline?.tables?.levelCap,newCap=upstream?.tables?.levelCap;
       if(Number.isSafeInteger(oldCap)&&Number.isSafeInteger(newCap)&&oldCap!==newCap)
        cautions.push(tr('Предел уровня: ','Level cap: ')+oldCap+' → '+newCap);
      }
      if(unsure)cautions.push(tr('Нужна ручная проверка: ','Manual review needed: ')+unsure);
      if(links)cautions.push(tr('Связи и скрытые отличия: ','Links and hidden differences: ')+links);
      if(syncRussian)cautions.push(tr('Русские описания — проверенная копия проекта, не данные игры',
       'Russian descriptions are verified project text, not live game data'));
      if(mode==='archive')cautions.push(tr('Архив может быть старее текущей игры',
       'The archive may be older than the current game'));
      decisionWarnings.hidden=!cautions.length;
      decisionWarnings.textContent=cautions.join(' · ')||
       tr('Спорных изменений в выбранном наборе не обнаружено.',
        'No flagged changes in the selection.');
      riskApprovalLabel.hidden=!risky;
      riskApproval.disabled=busy||!ready;
      formulaPreview.hidden=!ready;
      formulaRows.replaceChildren();
      if(preview){
        const validation=preview.validation;
        if(!validation.ok){
          formulaStatus.textContent=tr('Публикация остановлена: ',
           'Publication blocked: ')+validation.issues.join(' · ');
          formulaPreview.classList.add('os-sync-formula-error');
        }else{
          formulaPreview.classList.remove('os-sync-formula-error');
          formulaStatus.textContent=tr(
           'Проверено: максимум планировщика ',
           'Verified: planner maximum ')+validation.plannerMax+
           tr(' · на этом уровне ', ' · at this level ')+
           validation.attributesAtMax+' / '+validation.skillsAtMax+
           tr(' очков характеристик / умений. Игровое ограничение ',
            ' attribute / skill points. Game cap ')+
           String(validation.levelCap??tr('не указано','not stated'))+
           tr(' на максимум планировщика не влияет.',
            ' does not limit the planner.');
          if(preview.replay?.changedSkills)
           formulaStatus.textContent+=tr(
            ' · Известные расчёты навыков: ', 
            ' · Known skill model samples retained: ')+
            String(preview.replay.retained)+'/'+String(preview.replay.previouslyModeled)+
            tr(' сохранено, ',' retained, ')+String(preview.replay.unmodeled)+
            tr(' без числовой модели.',' without a numeric model.');
          const comparison=preview.comparison;
          if(comparison?.warning)
            formulaRows.append(h('p',{class:'os-sync-formula-warning',
             text:comparison.warning}));
          else if(comparison?.hasHero){
            if(!comparison.changes.length)
              formulaRows.append(h('p',{text:tr(
               'У текущего героя выбранные изменения не меняют перечисленные расчётные показатели.',
               'The selected changes do not alter these modeled values for the current hero.')}));
            for(const row of comparison.changes.slice(0,10))
              formulaRows.append(h('p',{class:'os-sync-formula-row'},[
                h('span',{text:lang==='en'?row.en:row.ru}),
                h('strong',{text:String(row.before??'—')+' → '+String(row.after??'—')})
              ]));
            if(comparison.changes.length>10)
              formulaRows.append(h('small',{text:tr('Ещё изменений: ',
               'More changes: ')+(comparison.changes.length-10)}));
          }else formulaRows.append(h('p',{text:tr(
           'Выбери расу и профессию на главном экране, чтобы увидеть изменения именно своего героя.',
           'Choose a race and class on the main screen to compare your own hero.')}));
        }
      }
      publish.disabled=!ready||!acknowledged||preview?.validation?.ok!==true;
      exportButton.disabled = !ready;
      github.disabled = busy || !githubReady || !publishedSnapshot;
      testWrite.disabled = busy;
      testCAS.disabled = busy;
      const reviewing=Boolean(baseline);
      reviewSteps.hidden=!reviewing||(!changes.length&&!formattingCount&&!verifiedRussian.length);
      formattingReview.hidden=!reviewing||mode!=='server'||!formattingCount;
      russianReview.hidden=!reviewing||mode!=='server'||!verifiedRussian.length;
      for(const element of [filters,overview,searchField,results])element.hidden=!reviewing;
      const byKind={
        all:changes.length,added:changes.filter(row=>row.kind==='added').length,
        changed:changes.filter(row=>row.kind==='changed').length,
        removed:changes.filter(row=>row.kind==='removed').length,
        accepted:selected,declined:changes.length-selected,
        needsReview:changes.filter(row=>describe(row).uncertain).length,
        links:changes.filter(row=>describe(row).rows.some(field=>field.linkChanged)).length,
        sameVisible:changes.filter(row=>describe(row).rows.some(field=>field.sameVisible)).length,
        readable:changes.filter(row=>!describe(row).unexplained).length
      };
      for(const [id,ru,en]of filterChoices){
        const button=filterButtons.get(id);
        button.textContent=tr(ru,en)+' · '+byKind[id];
        button.classList.toggle('active',id===filterKind);
        button.setAttribute('aria-pressed',String(id===filterKind));
      }
      // Explain which game areas changed instead of repeating five counters
      // inside a large dashboard of decorative statistics.
      const groups=importer.files.filter(name=>changes.some(row=>row.dataset===name));
      const ordered=[...groups.filter(name=>name!=='meta'),...groups.filter(name=>name==='meta')];
      overview.textContent=ordered.length?tr('Затронутые разделы: ','Affected sections: ')+
        ordered.map(name=>(review.labels[name]||name)+' · '+
          changes.filter(row=>row.dataset===name).length).join('   •   '):'';
      overview.hidden=!reviewing||!changes.length;
      for(const panel of results.querySelectorAll('.os-sync-group')){
        const name=panel.getAttribute('data-game-dataset');
        const count=changes.filter(row=>row.dataset===name&&chosen.has(row.id)).length;
        const total=changes.filter(row=>row.dataset===name).length;
        const label=panel.querySelector('.os-sync-count');
        if(label)label.textContent=count+' / '+total+tr(' выбрано',' selected');
      }
      const service=changes.filter(row=>describe(row).service).length;
      const acceptedChanges=changes.filter(row=>chosen.has(row.id)).length;
      const remainingChanges=changes.length-acceptedChanges;
      const cautionSelected=changes.filter(row=>chosen.has(row.id)&&describe(row).uncertain).length;
      selectionGuidance.textContent=tr('Всего выбрано: ','Selected: ')+
        acceptedChanges+' / '+changes.length+
        (remainingChanges?tr(' · Осталось: ',' · Remaining: ')+remainingChanges:'')+
        (cautionSelected?tr(' · Требуют проверки: ',' · Need review: ')+cautionSelected:'')+
        (service?tr(' · Настроек игры найдено: ',' · Game settings found: ')+service:'')+
        (mode==='server'&&formattingToggle.checked?tr(' · Переносы строк включены',' · Source line breaks included'):'');
      summary.textContent = changes.length
        ? tr('Найдено изменений: ','Changes found: ')+changes.length+
          (service?tr(' · Служебных: ',' · Technical: ')+service:'')+
          tr(' · Выбрано: ',' · Selected: ')+selected+
          tr(' · Не выбрано: ',' · Not selected: ')+(changes.length-selected)+
          (byKind.needsReview?tr(' · Нужна проверка: ',' · Needs review: ')+byKind.needsReview:'')
        : baseline ? tr('Различий в игровых данных нет','No differences in game data') : '';
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
      const normalized=text.replaceAll('ё','е');
      searchCache.set(change.id,normalized);
      return normalized;
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
          'aria-label':tr('Показать связанный предмет: ','Show linked item: ')+segment.text,
          'aria-expanded':String(wasExpanded),text:segment.text});
        hint(button,tr('Ссылка на связанный игровой предмет. Нажми, чтобы посмотреть его описание и открыть карточку энциклопедии.',
         'Linked game item. Click to preview its description and open the encyclopedia entry.'));
        const preview=h('span',{class:'os-sync-reference-preview',hidden:!wasExpanded});
        preview.append(h('strong',{text:segment.text}),
          h('small',{text:tr('Связанный предмет · игровая ссылка в описании',
           'Linked item · in-game description reference')}));
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
            text:tr('Открыть в энциклопедии (новая вкладка) ↗',
             'Open encyclopedia (new tab) ↗')}));
        }else preview.append(h('small',{text:tr('Предмет пока не опубликован в энциклопедии.',
          'This item has not yet been published in the encyclopedia.')}));
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

    // Prefer the largest modeled changes across different monsters, not four
    // adjacent gems from the same loot pool. Full details stay searchable.
    function impactSamples(entries){
      const significance=e=>Math.max(...e.before.map((v,i)=>Math.abs(v-e.after[i])));
      const ranked=[...entries].sort((a,b)=>significance(b)-significance(a));
      const chosen=[],seen=new Set();
      for(const entry of ranked){
        const key=entry.mapName+'|'+entry.mobName+'|'+entry.kind;
        if(seen.has(key))continue;
        chosen.push(entry);seen.add(key);
        if(chosen.length===4)return chosen;
      }
      for(const entry of ranked)if(!chosen.includes(entry)){
        chosen.push(entry);
        if(chosen.length===4)break;
      }
      return chosen;
    }

    function fieldPreview(change,description) {
      const content=h('div',{class:'os-sync-explanation'});
      if(description.rows.length>1)content.append(h('small',{
        class:'os-sync-result-count',
        text:tr('Изменено параметров: ','Changed parameters: ')+description.rows.length}));
      content.append(h('p',{class:'os-sync-change-summary',text:description.summary}));
      // Show the game-level meaning up front, not only technical field changes.
      const impacts=description.impacts||[];
      const notable=impactSamples(impacts);
      if(impacts.length){
        const panel=h('div',{class:'os-sync-impact-preview'});
        panel.append(h('strong',{text:tr(
          'Как изменится расчётный шанс выпадения',
          'How estimated drop chances change')}));
        for(const effect of notable)
          panel.append(h('p',{class:'os-sync-impact-line',text:effect.preview}));
        if(impacts.length>4)panel.append(h('small',{class:'muted',
          text:tr('Ещё ','And ')+(impacts.length-4)+
            tr(' изменений — открой подробности ниже.',' more changes — see details below.')}));
        panel.append(h('small',{class:'muted',text:tr(
          'Соло / 4 / 8 активных участников на карте. Только этот источник дропа; не подтверждение работы игрового сервера.',
          'Solo / 4 / 8 active party members on this map. This loot source only; not verified game-server behavior.')}));
        content.append(panel);
      }
      if(description.caution)content.append(h('p',{
        class:'os-sync-change-caution',text:description.caution}));
      const details=h('details',{class:'os-sync-field-details'});
      details.open=expandedDetails.has(change.id);
      details.addEventListener('toggle',()=>{
        if(!details.isConnected)return;
        if(details.open)expandedDetails.add(change.id);
        else expandedDetails.delete(change.id);
      });
      details.append(h('summary',{
        text:tr('Посмотреть подробно · ','View details · ')+description.rows.length}));
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
            hint(delta,tr('Изменение числа относительно опубликованной версии. Знак не означает, что изменение полезно или вредно.',
           'Change relative to the published version. The sign does not imply that the change is beneficial or harmful.'));
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
            text:tr('Это параметр дополнительных слотов конкретного предмета в таблице добычи. «Не указаны» означает отсутствие поля в старом источнике, а не подтверждённый ноль.',
          'This is the extra-socket field of an individual item in the loot table. “Not specified” means the old source lacks the field, not a confirmed zero.')}));
          details.append(line);
        }
      }else details.append(h('p',{class:'muted',
        text:tr('Нет подтверждённой расшифровки. Эти изменения требуют отдельной проверки.',
          'No verified explanation is available. Review these changes separately.')}));
      const raw=h('details',{class:'os-sync-raw-details'});
      raw.append(h('summary',{text:tr('Технические сведения (для разработчика)',
        'Technical details (developers)')}));
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
      clearSearch.disabled=busy||!search.value.trim();
      results.replaceChildren();
      const query = search.value.trim().toLocaleLowerCase().replaceAll('ё','е');
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
          h('span',{class:'os-sync-count',
            text:selected+' / '+group.length+tr(' выбрано',' selected')})
        ]));
        const toolbar = h('div',{class:'os-sync-group-actions'});
        const take = h('button',{type:'button',class:'button-action',
          text:tr('Выбрать понятные изменения раздела','Select understood changes in section'),
          disabled:busy||!group.some(safe)});
        const reject = h('button',{type:'button',class:'button-action',
          text:tr('Снять выбор раздела','Clear section selection'),disabled:busy});
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
          text:tr('Выбрать найденное · ','Select matching · ')+filtered.filter(safe).length,
          disabled:busy||!filtered.some(safe)});
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
          const row = h('article',{class:'os-sync-record'+(checked(change)?' os-sync-record-selected':'')+
            (description.uncertain?' os-sync-review-caution':'')});
          const helper=h('small',{class:'os-sync-review-level',
            text:description.service?tr('Служебные данные · ручная проверка','Technical data · manual review'):
              hasLinks?tr('Игровая ссылка · требуется ручная проверка','Game link · manual review'):
              visuallySame?tr('Видимый текст совпадает · требуется ручная проверка','Same visible text · manual review'):
              description.unexplained?tr('Есть нерасшифрованные параметры','Some parameters are unexplained'):
              description.uncertain?tr('Расшифровано · требуется ручная проверка','Explained · manual approval required'):
              tr('Значения расшифрованы · проверь перед выбором','Values explained · verify before selecting')});
          if(variantTotal.get(description.title)>1)
            helper.textContent+=tr(' · Вариант ',' · Variant ')+variantOrder.get(change.id)+
              tr(' из ',' of ')+variantTotal.get(description.title)+
              tr(' с этим названием',' with this name');
          const input = h('input',{type:'checkbox',checked:checked(change),disabled:busy,
            'aria-label':tr('Выбрать изменение ','Select change ')+description.title+
              (hasLinks||visuallySame?tr(' — требуется отдельная проверка',' — requires separate review'):'')});
          input.addEventListener('change',()=>{
            setChoice(change,input.checked);
            row.classList.toggle('os-sync-record-selected',input.checked);
          });
          const indicator = change.kind==='added'?tr('Добавлено','Added'):
            change.kind==='removed'?tr('Удалено','Removed'):tr('Изменено','Changed');
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
              text:tr('Связь с предметом изменилась · проверить вручную',
               'Item link changed · review manually')
            }));
            if(visuallySame)signals.append(h('small',{
              class:'os-sync-review-signal',
              text:tr('Текст выглядит одинаково · проверить исходное отличие',
               'Text looks identical · inspect source difference')
            }));
            row.append(signals);
          }
          row.append(fieldPreview(change,description));
          list.append(row);
        }
        panel.append(list);
        if (limit<filtered.length) {
          const more=h('button',{type:'button',class:'button-action',
            text:tr('Показать остальные ','Show remaining ')+(filtered.length-limit)+
             tr(' изменений',' changes')});
          more.onclick=()=>{full.add(name);expanded.add(name);render()};
          panel.append(more);
        }
        results.append(panel);
      }
      if(!results.childElementCount&&baseline)results.append(h('p',{class:'os-sync-empty',
        text:tr('По этому фильтру изменений нет. Измени запрос или выбери «Все».',
         'No changes match this filter. Change the search or select “All”.')}));
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
      sourceBanner.dataset.source=from;
      if(from==='server')editorialState(sourceBanner,'sourceLiveNotice',
         'Сверяем доступные данные текущей игры с каталогом сайта. Изменения не применяются автоматически.',
         'Comparing available current game data with the site catalog. No changes are applied automatically.');
      else editorialState(sourceBanner,'sourceArchiveNotice',
         'Архивная сверка по данным сохранённой копии: это НЕ проверка текущего игрового сервера. Применение может вернуть старые значения.',
         'Comparing an archived snapshot, NOT the current game server. Publishing may restore older values.');
      diagnostic.hidden=true;diagnosticText.textContent='';
      baseline=null;upstream=null;legacy=null;legacyRows=null;activeSnapshot=null;
      changes=[];chosen=new Set();riskApprovalFingerprint='';riskApproval.checked=false;
      expanded=new Set();full=new Set();
      expandedDetails.clear();expandedReferences.clear();searchCache.clear();
      filterKind='all';renderedQuery='';renderedFilter='all';search.value='';
      formattingCount=0;formattingToggle.checked=false;
      verifiedRussian=[];localInstances=null;russianToggle.checked=false;
      russianDetails.open=false;russianList.replaceChildren();
      results.replaceChildren();summary.textContent='';
      progress.value=0;
      metaStatusDetail.textContent='';
      metaStatusDetail.hidden=true;
      refreshActions();
      try {
        const next={},old={};
        let readCount=0;
        await mapLimited(importer.files,async name=>{
          next[name]=await sourceFile(name,from);
          const done=++readCount;
          status.textContent=(from==='server'?
            tr('Получаю данные сайта игры','Reading live game data'):
            tr('Читаю архив Build Studio','Reading Build Studio archive'))+
            ' · '+done+tr(' из ',' of ')+importer.files.length;
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
          if(response.headers.get('x-ps-catalog')!=='d1')
            throw Error('Не подтверждён источник D1 для '+name+'. Обнови страницу и повтори сверку.');
          const snapshot=response.headers.get('x-ps-catalog-snapshot');
          if (!snapshot) throw Error('D1 не сообщает версию каталога');
          versions.add(snapshot);
          old[name]=await response.json();
          progress.value=45+Math.round(55*(++compared)/importer.files.length);
        });
        const localeResponse=await fetch(apiBase+'/api/catalog/legacyLocale.json',
          {cache:'no-store',signal:AbortSignal.timeout(15000)});
        if (!localeResponse.ok) throw Error('Не получен текущий перевод D1');
        if(localeResponse.headers.get('x-ps-catalog')!=='d1')
          throw Error('Не подтверждён источник D1 для локализации. Публикация остановлена.');
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
        metaStatusDetail.hidden=false;
        metaStatusDetail.textContent=fingerprintCount
          ?tr('Сведения об источнике: контрольные суммы ',
              'Source integrity: checksums for ')+fingerprintCount+
           tr(' файлов изменились. Это не означает изменения характеристик. Хэши используются для проверки целостности и не предлагаются к публикации как игровые данные.',
              ' files changed. This does not establish a change in game statistics. Checksums are for integrity checks and are not proposed as gameplay updates.')
          :tr('Сведения об источнике: изменения контрольных сумм не обнаружены.',
              'Source integrity: no checksum changes detected.');
        if(!onlyTechnicalMeta)
          metaStatusDetail.textContent+=tr(
           ' Есть и изменения настроек каталога — они показаны в списке отдельно и требуют ручной проверки.',
           ' Catalog configuration changes are also listed separately and require manual review.');
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
        impactCache=null;
        activeSnapshot=[...versions][0];changes=findings;
        const complete=findings.length
          ? ['comparisonFound',
             'Сверка завершена. Ни одно изменение не принято автоматически.',
             'Comparison complete. No changes were selected automatically.']
          : formattingCount&&verifiedRussian.length
           ? ['comparisonFormattingAndRussian',
              'Игровые значения совпадают. Можно отдельно сохранить переносы и добавить русские описания.',
              'Game values match. You may separately save line breaks and add Russian descriptions.']
           : formattingCount
            ? ['comparisonFormatting',
               'Игровые значения совпадают. Можно отдельно сохранить оригинальные переносы описаний.',
               'Game values match. You may separately restore the original description line breaks.']
            : verifiedRussian.length
             ? ['comparisonRussian',
                'Игровые значения совпадают. Можно отдельно добавить проверенные русские описания.',
                'Game values match. You may separately add verified Russian descriptions.']
             : ['comparisonNoChanges',
                'Данные совпадают. Публикация не требуется.',
                'Data matches. No publication is needed.'];
        editorialState(status,...complete);
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
          status.textContent=issue+tr(
           ' Каталог Build Studio не изменён. Архивную копию можно сравнить отдельно, но она может быть старее.',
           ' The Build Studio catalog is unchanged. You can compare the archived copy separately, but it may be older.');
        }else if(error.httpStatus===401){
          editorialState(status,'compareSessionExpired',
            'Сеанс администратора завершился. Войди заново, чтобы повторить проверку.',
            'The admin session ended. Sign in again to repeat the comparison.');
        }else{
          editorialState(status,'compareNotCompleted',
            'Сверка не завершена. Действующие данные остались прежними. Попробуй ещё раз или воспользуйся сохранённой копией.',
            'Comparison did not finish. Published data is unchanged. Try again or use the archived snapshot.');
        }
        diagnosticText.textContent='Этап: '+(error.sourceDataset||'не определён')+
          ' · Ответ Worker: '+(error.httpStatus??'нет HTTP-ответа')+
          ' · Причина: '+(error.reason||'не указана')+
          ' · '+String(error.message||error);
        diagnostic.hidden=false;
        baseline=null;upstream=null;changes=[];impactCache=null;
        refreshActions();
      }finally{setBusy(false)}
    }


    async function verifyPublishedForPlayers(snapshot,expected){
      await afterPublish();
      return verifyPublishedSnapshot(apiBase,snapshot,expected);
    }

    // The public release and GitHub fallback are distinct: a failed backup
    // never implies that an already-published D1 snapshot was rolled back.
    async function finalizePublication(snapshot,expected,{superseded=false,recovered=false}={}){
      let check;
      try {
        check=await verifyPublishedForPlayers(snapshot,expected);
      }catch(error){
        status.textContent=tr(
          'D1 приняла публикацию, но полная проверка каталога на сайте не пройдена: ',
          'D1 accepted publication, but the full public catalog check failed: ')+
          String(error.message||error)+tr(
          ' Проверь текущую версию перед повтором. Это не означает откат D1. Серверное задание GitHub-резерва сохранено.',
          ' Check the active version before retrying. This does not mean D1 rolled back. GitHub backup job is persisted on the server.');
        return;
      }
      status.textContent=tr(
        'Каталог обновлён. Проверены все опубликованные разделы (',
        'Catalog published. All public datasets verified (')+
        check.verifiedDatasets+'/'+importer.files.length+
        tr('), базовые очки и ОЗ/ОМ. Неизвестные новые эффекты навыков автоматически не подтверждаются.',
           '), base points and HP/MP. Unknown new skill-effect semantics are not verified automatically.');
      if(recovered)status.textContent+=tr(
        ' Ответ публикации потерялся, но действующая версия подтверждена.',
        ' The publish response was lost, but the active revision was confirmed.');
      if(superseded){
        status.textContent+=tr(
          ' Уже доступна другая версия: копию этой версии не создаём.',
          ' Another version is already active; its predecessor is not backed up.');
        return;
      }
      try {
        const integration=await request('/api/admin/catalog/github-status',null);
        if(integration.configured!==true){
          status.textContent+=tr(
            ' GitHub-копия не настроена: резервная версия ещё не подтверждена.',
            ' GitHub backup is not configured: the fallback has not been verified.');
          return;
        }
        if(integration.connected!==true||integration.writeAccess!==true){
          status.textContent+=tr(
            ' GitHub не подтвердил подключение и право записи. Резервный PR не создан.',
            ' GitHub connection or write access was not verified. No fallback PR was created.');
          return;
        }
        const current=await request('/api/admin/catalog/status',{});
        if(current.active!==snapshot){
          status.textContent+=tr(
            ' D1 изменилась в другой вкладке; резерв не создавался.',
            ' D1 changed in another session; backup was skipped.');
          return;
        }
        status.textContent+=tr(
          ' Подготавливаю PR для обновления резерва GitHub…',
          ' Preparing a GitHub fallback PR…');
        let result;
        try{
          result=await request('/api/admin/catalog/github-pr',{
            expectedActive:snapshot});
        }catch(error){
          // The GH branch may have been created before a response was lost.
          // Retry the same snapshot automatically; the Worker independently
          // verifies all 17 D1 blob hashes before reusing a stranded branch.
          // Never retry authentication, permission or CAS conflicts.
          const retryable=!error.httpStatus||error.httpStatus>=500&&
            error.httpStatus!==503;
          if(!retryable)throw error;
          const now=await request('/api/admin/catalog/status',{});
          if(now.active!==snapshot)throw error;
          status.textContent+=tr(
            ' GitHub не ответил; повторяю резервирование автоматически…',
            ' GitHub response was interrupted; retrying the backup automatically…');
          result=await request('/api/admin/catalog/github-pr',{
            expectedActive:snapshot});
        }
        if(result.unchanged){
          status.textContent+=tr(
            ' Резерв GitHub уже совпадает с D1.',
            ' GitHub fallback already matches D1.');
        }else if(/^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(result.url||'')){
          status.append(document.createTextNode(tr(
            ' Резервный PR создан; Node и Chromium запускаются автоматически, затем PR будет объединён при успехе: ',
            ' Backup PR created; Node and Chromium run automatically, followed by merge if successful: ')),
            h('a',{href:result.url,target:'_blank',rel:'noopener noreferrer',
              text:'PR #'+result.number}));
        }else throw Error('Некорректный ответ GitHub');
      }catch(error){
        const saved=await request('/api/admin/catalog/backup-status',null).catch(()=>null);
        if(saved?.snapshot===snapshot&&['pending','retry','running'].includes(saved.job?.state)){
          status.textContent+=tr(
           ' GitHub временно недоступен. Сервер повторит создание резервной копии автоматически, даже после закрытия вкладки.',
           ' GitHub is temporarily unavailable. The server will retry the backup automatically, even after the tab closes.');
        }else{
          status.textContent+=tr(
           ' Резерв GitHub требует внимания. D1 опубликована; проверь подключение: ',
           ' GitHub backup needs attention. D1 was published; check the connection: ')+String(error.message||error);
        }
      }
    }

    function prepare() {
      const syncFormatting=mode==='server'&&formattingToggle.checked&&formattingCount>0;
      const syncRussianInstances=mode==='server'&&russianToggle.checked&&verifiedRussian.length>0;
      if(!baseline||!upstream||(!chosen.size&&!syncFormatting&&!syncRussianInstances))
       throw Error('Нет выбранных изменений для публикации');
      const combined=review.compose(baseline,upstream,chosen,importer.files,
        {syncFormatting,syncRussianInstances,localInstances});
      // Full structural and count validation is required after selective merging.
      const modelCheck=safety.check(combined);
      if(!modelCheck.ok)
        throw Error('Проверка расчётов перед публикацией: '+modelCheck.issues.join(' · '));
      const compatibility=safety.compatibility(baseline,combined);
      // Recheck immediately before confirmed publication, independently
      // of the cached UI preview. Do not silently discard old numeric models.
      const replay=typeof safety.replaySkills==='function'?
       safety.replaySkills(baseline,combined):null;
      if(replay&&!replay.ok)throw Error(
       'Проверка известных расчётов навыков: '+replay.lost+
       ' прежних сценариев перестали рассчитываться. '+
       [...replay.errors,...replay.samples.map(x=>x.name+' / '+x.job+
        (x.level?' / '+x.level:''))].slice(0,4).join(' · '));
      const normalized=importer.normalize(combined,legacy);
      if(!Array.isArray(legacyRows)||legacyRows.length!==normalized.counts.legacyLocale)
        throw Error('Published D1 translation count changed during review');
      normalized.entries.legacyLocale=legacyRows; // Preserve exact IDs, payloads and source attribution.
      review.auditSelection(baseline,upstream,combined,chosen,importer.files,
        {syncRussianInstances});
      return {combined,normalized,compatibility,replay};
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
      if(busy||publish.disabled||!permitMutation())return;
      let publishingSnapshot=null;
      let staged;
      try{staged=prepare()}catch(error){status.textContent='Нельзя публиковать: '+error.message;return}
      const added=changes.filter(x=>checked(x)&&x.kind==='added').length;
      const changed=changes.filter(x=>checked(x)&&x.kind==='changed').length;
      const removed=changes.filter(x=>checked(x)&&x.kind==='removed').length;
      const uncertain=changes.filter(x=>checked(x)&&describe(x).uncertain).length;
      const notSelectedGame=changes.filter(x=>!checked(x)&&!describe(x).service).length;
      const unselectedSettings=changes.filter(x=>!checked(x)&&describe(x).service).length;
      const formatted=mode==='server'&&formattingToggle.checked?formattingCount:0;
      const ruCount=mode==='server'&&russianToggle.checked?verifiedRussian.length:0;
      const sourceWarning=mode==='archive'
        ?tr('\nИСТОЧНИК: архивная копия может быть устаревшей.',
         '\nSOURCE: the archive may be outdated.'):
         tr('\nИСТОЧНИК: доступные данные текущей игры.',
          '\nSOURCE: currently available game data.');
      const selectedChanges=changes.filter(checked);
      const selectedDescriptions=selectedChanges.map(describe);
      const selectedImpacts=selectedDescriptions.flatMap(d=>d.impacts||[]);
      const impactPreview=selectedImpacts.length?
        '\n\nРАСЧЁТНОЕ ИЗМЕНЕНИЕ ШАНСОВ В BUILD STUDIO:\n'+
        impactSamples(selectedImpacts).map(e=>'• '+e.preview).join('\n')+
        (selectedImpacts.length>4?'\n• И ещё '+(selectedImpacts.length-4)+
          ' изменений (смотри подробную сверку).':'')+
        '\nЭто расчётная оценка; фактический результат на игровом сервере не проверен.':'';
      const otherPreview=selectedDescriptions.filter(d=>!(d.impacts||[]).length)
        .slice(0,2).map(d=>'\n• '+d.title+': '+d.summary.slice(0,200)).join('');
      const atomicWarning=selectedChanges.some(e=>e.dataset==='tables')?
        '\n\nВАЖНО: выбран весь набор «Игровые формулы», не один предмет. '+
        'После подтверждения обновятся все таблицы этого раздела в D1. '+
        'Применить только одну строку внутри невозможно.':'';
      const uncertainWarning=uncertain
        ?'\nВНИМАНИЕ: '+uncertain+' выбранных изменений требуют ручной проверки.':'';
      const compatibility=staged.compatibility;
      const mechanicWarning=compatibility?.requiresMechanicReview?
       '\n\nПРОВЕРКА МЕХАНИК: '+compatibility.totals.needsReview+
       ' изменений игровых свойств и эффектов требуют проверки совместимости. '+
       'Новая формула не подтверждается одним обновлением D1. Примеры: '+
       compatibility.samples.needsReview.slice(0,3).map(x=>x.title).join('; ')+
       '. Публикация не гарантирует численные результаты неизвестных эффектов.':'';
      const verifiedNotice=compatibility?.totals.verified?
       '\nБазовые расчёты и таблицы: проверено '+compatibility.totals.verified+
       ' разделов (не полная проверка всех боевых механик).':'';
      const confirmationRu='Применить выбранные изменения в каталог Build Studio?\n'+
       'Новых: '+added+' · Изменённых: '+changed+' · Удалённых: '+removed+
       ' · Переносов: '+formatted+' · Русских описаний: '+ruCount+'.'+
       (notSelectedGame?'\nНе выбрано игровых изменений: '+notSelectedGame+'.':'')+
       (unselectedSettings?'\nНе выбрано настроек: '+unselectedSettings+'.':'')+
       sourceWarning+uncertainWarning+mechanicWarning+verifiedNotice+atomicWarning+impactPreview+otherPreview+
       '\n\nМеняется каталог Build Studio, а НЕ сама игра. Проверь выбранное перед подтверждением. '+
       'Ничего не опубликовано до этого подтверждения.';
      const confirmationEn='Publish these changes to the Build Studio catalog?\n'+
       'New: '+added+' · Changed: '+changed+' · Removed: '+removed+
       ' · Line breaks: '+formatted+' · Russian descriptions: '+ruCount+'.'+
       (notSelectedGame?'\nUnselected game changes: '+notSelectedGame+'.':'')+
       (unselectedSettings?'\nUnselected settings: '+unselectedSettings+'.':'')+
       sourceWarning+
       (compatibility?.requiresMechanicReview?
        '\nMECHANICS: '+compatibility.totals.needsReview+
        ' effect/property changes require an independent model review. '+
        'Publishing D1 does not prove unknown formulas.':'')+
       (uncertain?'\nFlagged for manual review: '+uncertain+'.':'')+
       (selectedChanges.some(x=>x.dataset==='tables')?
         '\nGame formula tables, including level caps, are replaced together.':'')+
       '\n\nOnly the Build Studio catalog changes, not the game. Review before confirming.';
      if(!confirm(tr(confirmationRu,confirmationEn)))return;
      if(!permitMutation())return;
      publishing=true;
      const closeButton=view.closest('.modal')?.querySelector('button.close');
      if(closeButton)closeButton.disabled=true;
      setBusy(true);
      try {
        // Fail BEFORE any D1 catalog write if the owner requested fully
        // automatic GitHub fallback but the real credential is unusable.
        // Merely having a named Cloudflare Secret is not proof of write scope.
        status.textContent=tr(
          'Проверяю доступ GitHub для автоматической резервной копии…',
          'Checking GitHub access for automatic backup…');
        let gitReady;
        try{gitReady=await request('/api/admin/catalog/github-status',null)}
        catch(error){
          const failure=new Error(tr(
            'Не удалось проверить подключение GitHub. Игровой каталог не изменён. '+String(error.message||error),
            'GitHub connection could not be verified. Game catalog was not changed. '+String(error.message||error)));
          failure.preflight=true;throw failure;
        }
        if(gitReady?.configured!==true||gitReady?.connected!==true||
           gitReady?.writeAccess!==true){
          const reason=gitReady?.configured!==true?
           tr('GitHub-токен не настроен.','GitHub token is not configured.'):
           gitReady?.connected!==true?
           tr('GitHub не подтвердил подключение.','GitHub connection was not verified.'):
           tr('GitHub не подтвердил право записи.','GitHub write access was not verified.');
          const failure=new Error(reason+tr(
            ' Публикация остановлена до записи в D1. Проверь интеграцию, затем повтори применение.',
            ' Publication was stopped before any D1 write. Check integration, then retry.'));
          failure.preflight=true;throw failure;
        }
        const current=await request('/api/admin/catalog/status',{});
        if (current.active!==activeSnapshot) throw Error('D1 обновлена после проверки. Сверь данные заново.');
        await request('/api/admin/catalog/initialize',{});
        const snapshot='ps-'+crypto.randomUUID().replaceAll('-','');
        publishingSnapshot=snapshot;
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
        // A read-back confirms the active version; an ambiguous response is
        // never treated as rollback or as proof of up-to-date player data.
        let confirmed=false,superseded=false;
        try{
          const observed=await request('/api/admin/catalog/status',{});
          confirmed=observed.active===result.active;
          superseded=Boolean(observed.active&&!confirmed);
        }catch{}
        publishedSnapshot=result.active;
        chosen.clear();changes=[];baseline=null;upstream=null;
        refreshActions();
        await finalizePublication(result.active,staged.combined,{superseded});
      }catch(error){
        if(error?.preflight){
          status.textContent=error.message;
          return;
        }
        // A lost publish response is ambiguous: inspect D1 before any retry.
        if(publishingSnapshot){
          try{
            const observed=await request('/api/admin/catalog/status',{});
            if(observed.active===publishingSnapshot){
              publishedSnapshot=observed.active;
              chosen.clear();changes=[];baseline=null;upstream=null;
              refreshActions();
              await finalizePublication(observed.active,staged.combined,{recovered:true});
              return;
            }
          }catch{}
        }
        status.textContent=error.httpStatus===401
          ? 'Сеанс администратора истёк. Проверь активную версию D1 после повторного входа.'
          : 'Не удалось завершить обновление: '+error.message+
             '. Данные могли остаться прежними или уже обновиться. Сначала проверь каталог заново; не применяй тот же набор вслепую.';
      }finally{
        publishing=false;
        if(closeButton?.isConnected)closeButton.disabled=false;
        setBusy(false);
      }
    };

    // A separate, authenticated server operation. No GitHub token or file
    // contents ever pass through the browser.
    testWrite.onclick=async()=>{
      if(busy||!permitMutation())return;
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
    testCAS.onclick=async()=>{
      if(busy||!permitMutation())return;
      if(!confirm('Проверить конфликты правок? Будут временно записаны и удалены только две случайные тестовые записи D1. Игровые данные и билды не меняются.'))return;
      setBusy(true);
      try{
        const result=await request('/api/admin/catalog/test-owner-cas',{});
        if(result.ok!==true||result.casVerified!==true||result.qaCleaned!==true||
           result.activeCatalogUnchanged!==true)
          throw Error('Не подтверждены конфликты, очистка и неизменность каталога');
        status.textContent='Проверка пройдена: устаревшие правки отклоняются, обе тестовые записи удалены, игровой каталог не изменился.';
      }catch(error){
        status.textContent=error.httpStatus===401
          ?'Сеанс администратора закончился. Войди заново.'
          :'Проверка конфликтов D1 не пройдена: '+error.message;
      }finally{setBusy(false)}
    };
    github.onclick=async()=>{
      if(busy||!githubReady||!publishedSnapshot||!permitMutation())return;
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
      githubReady=settings.configured===true&&settings.connected===true&&settings.writeAccess===true;
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
    acceptAll.onclick=()=>{
      if(busy)return;
      for(const item of changes.filter(safe))chosen.add(item.id);
      render();
    };
    acceptEvery.onclick=()=>{
      if(busy||!baseline)return;
      const pending=changes.filter(item=>!chosen.has(item.id));
      const uncertain=pending.filter(item=>describe(item).uncertain);
      const removals=pending.filter(item=>item.kind==='removed');
      const settings=pending.filter(item=>describe(item).service);
      if(!pending.length&&!(mode==='server'&&formattingCount&&!formattingToggle.checked))return;
      if((uncertain.length||settings.length||removals.length)&&!confirm(tr(
        'Выбрать все '+changes.length+' найденных изменений?\n'+
        'Среди ещё не выбранных: '+uncertain.length+' требуют ручной проверки, '+
        removals.length+' удалений, '+settings.length+' изменений настроек игры.\n'+
        'После выбора появится сводка последствий. Каталог пока не изменится.',
        'Select all '+changes.length+' detected changes?\n'+
        'Still unselected: '+uncertain.length+' need manual review, '+
        removals.length+' removals, '+settings.length+' game settings.\n'+
        'A consequence summary will appear. This does not publish anything.')))return;
      for(const item of changes)chosen.add(item.id);
      if(mode==='server'&&formattingCount)formattingToggle.checked=true;
      render();
      status.textContent=tr('Все найденные изменения выбраны. Проверь предупреждения, затем нажми «Применить выбранные изменения».',
        'All detected changes selected. Review warnings, then publish selected changes.');
    };
    declineAll.onclick=()=>{
      if(busy)return;
      chosen.clear();formattingToggle.checked=false;russianToggle.checked=false;render();
    };
    search.addEventListener('input',render);
    refreshActions();
    modal(copy('title','Обновление игрового каталога','Game catalog updates'),view,{
     canClose:()=>!publishing
    });
  }


  // Read-only. Each JSON value must match the reviewed selection, not merely
  // a version header, count, or two of the game's seventeen datasets.
  async function verifyPublishedSnapshot(apiBase,snapshot,expected,fetcher=fetch){
    const files=root.PandoraCatalogImport?.files;
    const review=root.PandoraOSCatalogReview;
    const safety=root.PandoraCatalogSafety;
    if(!Array.isArray(files)||!files.length||
       !review?.strictEqual||!safety?.check)
      throw Error('Не подключены модули проверки каталога');
    const received={},queue=[...files];
    async function read(name){
      const alias=name==='strings.en'?'stringsEn':name;
      const response=await fetcher(apiBase+'/api/catalog/'+alias+'.json',{
        cache:'no-store',signal:AbortSignal.timeout(15000)
      });
      if(!response.ok||response.headers.get('x-ps-catalog')!=='d1'||
         response.headers.get('x-ps-catalog-snapshot')!==snapshot)
        throw Error('Не подтверждена версия D1: '+name);
      const data=await response.json();
      if(!review.strictEqual(data,expected?.[name]))
        throw Error('Опубликованный раздел отличается от выбранного: '+name);
      return data;
    }
    let failure=null;
    await Promise.all(Array.from({length:Math.min(3,queue.length)},async()=>{
      while(queue.length&&!failure){
        const name=queue.shift();
        try{received[name]=await read(name)}
        catch(error){failure??=error;return}
      }
    }));
    if(failure)throw failure;
    // Reject a concurrent publication even when all previous reads succeeded.
    await read('meta');
    const check=safety.check(received);
    if(!check.ok)throw Error('Базовые расчёты после обновления: '+check.issues.join(' · '));
    return {...check,verifiedDatasets:files.length};
  }

  root.PandoraOSCatalogWorkbench=Object.freeze({open,verifyPublishedSnapshot});
})(typeof window === 'undefined' ? globalThis : window);
