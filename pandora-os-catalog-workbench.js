(function (root) {
  'use strict';

  // Map nested per-record findings onto the one selectable atomic dataset
  // row. The most serious issue wins, even when it is far beyond the first
  // six preview samples.
  function statusForSelection(change,entries){
    if(!change||!Array.isArray(entries))return null;
    const dataset=change.dataset,key=change.key;
    if(typeof dataset!=='string'||typeof key!=='string')return null;
    const atomic=key==='@dataset'&&
      root.PandoraOSCatalogReview?.atomicDatasets?.has(dataset)===true;
    const prefix=dataset+':';
    // Historical source status keys for classes/skills are singular, while
    // selectable dataset IDs stay plural. Compare exact record IDs only.
    const modelPrefix=dataset==='skills'?'skill:':
      dataset==='classes'?'class:':null;
    const hits=entries.filter(row=>
      row.key===prefix+key||
      (modelPrefix&&row.key===modelPrefix+key)||
      row.key===dataset||
      (dataset==='tables'&&row.key.startsWith('table:'))||
      (atomic&&row.key.startsWith(prefix)));
    if(!hits.length)return null;
    return hits.some(row=>row.kind==='needsReview')?'needsReview':
      hits.some(row=>row.kind==='verified')?'verified':'sourceOnly';
  }

  // One pending owner click for the entire catalog dialog. A new action,
  // another caption editor, or an unrelated pointer gesture cancels it.
  // The queue owns no remote operation and never outlives its DOM target.
  function createReviewActionQueue(schedule=setTimeout,unschedule=clearTimeout){
    let pending=null;
    const cancel=()=>{
      if(!pending)return;
      unschedule(pending.timer);
      pending=null;
    };
    const cancelOutside=target=>{
      if(pending&&!pending.target.contains(target))cancel();
    };
    const defer=(target,run)=>{
      if(pending){
        const same=pending.target===target;
        cancel();
        if(same)return;
      }
      const task={target,timer:null};
      pending=task;
      task.timer=schedule(()=>{
        if(pending!==task)return;
        pending=null;
        if(target.isConnected&&!target.hidden&&!target.disabled)run();
      },500);
    };
    return {cancel,cancelOutside,defer};
  }

  // Fixed editorial captions only. Never seed values, probabilities, source
  // errors, game mechanics, risk approvals or any publish action as D1 copy.
  // The versioned staging planner extracts this same closed source registry.
  const catalogReviewDetailCopyRows=Object.freeze([
    ['decisionHeading','Перед применением','Before publishing'],
    ['formulaTitle','Как обновление повлияет на персонажа','How this update affects a character'],
    ['changedParametersLead','Изменено параметров:','Changed parameters:'],
    ['impactHeading','Как изменится расчётный шанс выпадения','How estimated drop chances change'],
    ['moreImpactsLead','Ещё','And'],
    ['moreImpactsSuffix','изменений — открой подробности ниже.','more changes — see details below.'],
    ['heroNoChange','У текущего героя выбранные изменения не меняют перечисленные расчётные показатели.',
      'The selected changes do not alter these modeled values for the current hero.'],
    ['heroMoreChangesLead','Ещё изменений:','More changes:'],
    ['heroSelectHelp','Выбери расу и профессию на главном экране, чтобы увидеть изменения именно своего героя.',
      'Choose a race and class on the main screen to compare your own hero.'],
    ['linkedReferenceContext','Связанный предмет · игровая ссылка в описании',
      'Linked item · in-game description reference'],
    ['linkedReferenceOpen','Открыть в энциклопедии (новая вкладка)',
      'Open encyclopedia (new tab)'],
    ['hintLinkedReference',
      'Ссылка на связанный игровой предмет. Нажми, чтобы посмотреть его описание и открыть карточку энциклопедии.',
      'Linked game item. Click to preview its description and open the encyclopedia entry.'],
    ['unpublishedReference','Предмет пока не опубликован в энциклопедии.',
      'This item has not yet been published in the encyclopedia.'],
    ['emptyReviewFilter','По этому фильтру изменений нет. Измени запрос или выбери «Все».',
      'No changes match this filter. Change the search or select “All”.'],
    ['githubPrepared','Проверенный каталог подготовлен.','Verified catalog prepared.'],
    ['searchClear','Очистить','Clear']
  ]);
  const catalogReviewDetailByKey=new Map(catalogReviewDetailCopyRows.map(row=>[row[0],row]));
  // Source-only accessible action words. The linked item or review title,
  // live checkbox state, caution and target URL must NEVER become D1 copy.
  // The standard owner interface editor handles dblclick/F2/CAS/Undo.
  const catalogAccessibleCopyRows=Object.freeze([
    ['linkedPreviewAria','Показать связанный предмет:','Show linked item:',
      'Предпросмотр предмета','Linked item preview'],
    ['linkedOpenAria','Открыть связанный предмет:','Open linked item:',
      'Открытие предмета','Open linked item'],
    ['reviewSelectAria','Выбрать изменение','Select change',
      'Выбор изменения','Select reviewed change'],
    ['clearSearchAriaDescription','Очистить поиск по игровым изменениям',
      'Clear game changes search','Очистка поиска','Clear search']
  ]);
  const catalogAccessibleByKey=new Map(catalogAccessibleCopyRows.map(row=>[row[0],row]));
  // These are literal display captions of native <summary> controls.
  // A visible caption belongs to D1/CAS, while any attached hover hint has
  // its own key/pencil and the native disclosure stays fully functional.
  const catalogDisclosureCopyRows=Object.freeze([
    ['archiveSummary','Если сайт игры не отдаёт данные','When the game site is unavailable'],
    ['advancedSummary','Дополнительные инструменты','Additional tools'],
    ['russianPreviewSummary','Посмотреть русские тексты','Preview Russian texts'],
    ['diagnosticsSummary','Технические сведения об ошибке','Technical error details'],
    ['fieldDetailsSummary','Посмотреть подробно','View details'],
    ['rawDetailsSummary','Технические сведения (для разработчика)','Technical details (developers)']
  ]);
  const catalogDisclosureByKey=new Map(catalogDisclosureCopyRows.map(row=>[row[0],row]));
  // The same three authorial action names recur in every dataset panel.
  // Filtered counts and selection state are NOT source-authored D1 values.
  const catalogGroupActionCopyRows=Object.freeze([
    ['groupTake','Выбрать понятные изменения раздела','Select understood changes in section'],
    ['groupReject','Снять выбор раздела','Clear section selection'],
    ['groupMatching','Выбрать найденное','Select matching'],
    ['groupMore','Показать остальные изменения','Show remaining changes']
  ]);
  const catalogGroupActionByKey=new Map(catalogGroupActionCopyRows.map(row=>[row[0],row]));
  // Dynamic review summaries have independently authored words AND immutable
  // runtime counts. This inventory is strictly authorial: no game records,
  // IDs, numbers, error diagnostics or publication approvals.
  const catalogReviewStatusCopyRows=Object.freeze([
    ['affectedSections','Затронутые разделы:','Affected sections:'],
    ['selectionTotal','Всего выбрано:','Selected:'],
    ['selectionRemaining','Осталось:','Remaining:'],
    ['selectionNeedsReview','Требуют проверки:','Need review:'],
    ['selectionSettings','Настроек игры найдено:','Game settings found:'],
    ['lineBreaksIncluded','Переносы строк включены','Source line breaks included'],
    ['foundChanges','Найдено изменений:','Changes found:'],
    ['summaryTechnical','Служебных:','Technical:'],
    ['summarySelected','Выбрано:','Selected:'],
    ['summaryUnselected','Не выбрано:','Not selected:'],
    ['summaryNeedsReview','Нужна проверка:','Needs review:'],
    ['noChanges','Различий в игровых данных нет','No differences in game data'],
    ['groupSelectedSuffix','выбрано','selected']
  ]);
  const catalogReviewStatusByKey=new Map(catalogReviewStatusCopyRows.map(row=>[row[0],row]));

  // Administrator-only review. UI selection is never a D1 write.
  // The Worker validates the auth token and the expected active snapshot.
  async function open({request, apiBase, modal, h, afterPublish, getHero=()=>null,
    lang='ru',canEdit=false,copyLabel,editLabel:bindEditor,
    bindCopy:bindAccessibleCopy,createCopyEditor,canCommit=()=>true}) {
    const tr=(ru,en)=>lang==='en'?en:ru;
    const actionQueue=createReviewActionQueue();
    const cancelPending=()=>actionQueue.cancel();
    // Every editor, including a separate hover hint, cancels any queued UI
    // action before creating its editable control. Preserve its callbacks.
    const editLabel=typeof bindEditor==='function'?(node,key,ru,en,callbacks={})=>
      bindEditor(node,key,ru,en,{...callbacks,onStarted:()=>{
        cancelPending();callbacks.onStarted?.();
      }}):null;
    // Reports only confirmed source identity and availability. A source
    // preview is NOT a verified combat result on the live game server.
    const replaySourceLabel=module=>{
      const names={
       'source-complex-spell':['Сложное заклинание','Complex spell'],
       'source-target-status':['Состояние цели','Target status'],
       'source-enemy-debuff':['Ослабление противника','Enemy debuff'],
       'source-tactical-action':['Тактическое действие','Tactical action'],
       'source-combat-technique':['Боевой приём','Combat technique'],
       'source-specialized-defense-magic':['Защитное или магическое умение','Defense or magic skill'],
       'source-support-action':['Умение поддержки','Support action'],
       'source-situational-action':['Ситуационное действие','Situational action'],
       'source-song-chain':['Песнь и её эффекты','Song effect chain'],
       'source-execution-chain':['Связанные действия навыка','Skill action chain'],
       'source-onhit-execution':['Действие при попадании','On-hit action'],
       'source-ammunition-action':['Умение со стрелами','Ammunition skill']
      };
      const entry=names[module];
      return entry?tr(entry[0],entry[1]):
       tr('Игровая связь по каталогу','Catalog source relationship');
    };
    const copy=(key,ru,en)=>copyLabel?.(key,ru,en)||tr(ru,en);
    // Reuse the application's exact semantic binding for Save and Undo.
    // Attribute-only copy does not make the source button itself editable.
    const accessible=(node,key,attribute='aria-label',suffix='',prefix='')=>{
      const row=catalogAccessibleByKey.get(key);
      if(!row)throw Error('Unreviewed catalog accessible copy: '+key);
      if(typeof bindAccessibleCopy==='function')
        bindAccessibleCopy(node,key,row[1],row[2],attribute,suffix,prefix);
      else node.setAttribute(attribute,prefix+copy(key,row[1],row[2])+suffix);
      return node;
    };
    // Direct caption dblclick/F2/blur uses the existing D1 CAS and Undo.
    // An ordinary guest only sees text; dynamic numeric values live in
    // independent siblings rather than inside a D1-edited string.
    const reviewCaption=(tag,attrs,key)=>{
      const row=catalogReviewDetailByKey.get(key);
      if(!row)throw Error('Unreviewed catalog caption: '+key);
      const node=h(tag,{...attrs,text:copy(key,row[1],row[2])});
      if(canEdit&&typeof editLabel==='function')
        editLabel(node,key,row[1],row[2]);
      return node;
    };
    const statusCaption=key=>{
      const row=catalogReviewStatusByKey.get(key);
      if(!row)throw Error('Unreviewed catalog status copy: '+key);
      const node=h('span',{class:'os-sync-status-copy',text:copy(key,row[1],row[2])});
      if(canEdit&&typeof editLabel==='function')
        editLabel(node,key,row[1],row[2]);
      return node;
    };
    const permitMutation=()=>typeof canCommit!=='function'||canCommit();
    // Only fixed author text is editable. The caption itself is the target:
    // a separate ✎ is reserved for independently authored hover tooltips.
    const authored=(tag,attrs,key,ru,en)=>{
      const node=h(tag,{...attrs,text:copy(key,ru,en)});
      if(!canEdit||typeof editLabel!=='function')return node;
      editLabel(node,key,ru,en);
      return h('div',{class:'os-sync-copy-field'},[node]);
    };
    // Native <details>/<summary> must still toggle on a real single click.
    // Owner double-click on ONLY the authored wording opens the D1 editor;
    // its first click cannot accidentally collapse a panel or hide a draft.
    const disclosureCaption=(key,{count=null}={})=>{
      const row=catalogDisclosureByKey.get(key);
      if(!row)throw Error('Unreviewed catalog disclosure: '+key);
      const caption=h('span',{class:'os-sync-disclosure-caption',
        text:copy(key,row[1],row[2])});
      const summary=h('summary',{},[caption]);
      if(count!==null)summary.append(h('span',{
        class:'os-sync-disclosure-runtime-count',text:' · '+String(count)}));
      bindDisclosureCaption(summary,caption,key,row);
      return summary;
    };
    // Shared native disclosure guard for both simple headings and the
    // independently editable suffix of a per-dataset selection count.
    const bindDisclosureCaption=(summary,caption,key,row)=>{
      if(!canEdit||typeof editLabel!=='function')return;
      editLabel(caption,key,row[1],row[2],{onStarted:cancelPending});
      summary.addEventListener('click',event=>{
        if(event.target.closest?.('.wiki-inline-input,[data-owner-text-field],[contenteditable]'))
          return;
        // Non-pointer (keyboard) activation and clicks on the native arrow
        // are kept immediate. Only the literal label needs disambiguation.
        if(!event.detail||!caption.contains(event.target)){cancelPending();return}
        event.preventDefault();event.stopPropagation();
        actionQueue.defer(summary,()=>{
          const details=summary.parentElement;
          if(details?.tagName==='DETAILS')details.open=!details.open;
        });
      });
      summary.addEventListener('keydown',event=>{
        if(event.target===summary&&event.key==='F2'){
          event.preventDefault();event.stopPropagation();
          caption.dispatchEvent(new KeyboardEvent('keydown',{
            key:'F2',bubbles:true,cancelable:true
          }));
        }
      });
    };
    // In player mode the caption stays inside a native label. In owner mode,
    // the same text is independent of a disabled checkbox, otherwise browsers
    // regard the nested editable text as disabled and block double-click.
    // Preserve a checkbox's single-click behavior while suppressing
    // both toggles from a genuine owner double-click on its written caption.
    const choiceEditor=(caption,key,ru,en)=>{
      if(!canEdit||typeof editLabel!=='function')return null;
      editLabel(caption,key,ru,en,{onStarted:cancelPending});
      caption.tabIndex=0;
      caption.setAttribute('aria-keyshortcuts','F2');
      caption.addEventListener('click',event=>{
        if(!event.detail||event.target.closest?.('.wiki-inline-input,[data-owner-text-field]'))return;
        event.preventDefault();event.stopPropagation();
        actionQueue.defer(caption,()=>{
          const box=caption.closest('.os-sync-formatting-option')?.querySelector('input[type="checkbox"]');
          if(box&&!box.disabled)box.click();
        });
      },true);
      return null; // no caption pencil
    };
    // An action's visible caption is editable even when the action is
    // disabled. The wrapper provides an F2 target in that case; ordinary
    // single clicks still execute the action after dblclick disambiguation.
    const action=(button,key,ru,en,{count=null}={})=>{
      // The count is a separate DOM child: a D1 CAS edit updates only words.
      const number=count===null?null:h('span',{
        class:'os-sync-action-runtime-number',text:' · '+String(count)});
      button.textContent=copy(key,ru,en);
      if(number)button.append(number);
      if(!canEdit||typeof editLabel!=='function')return button;
      const wrap=h('span',{class:'os-sync-action-editor',
        'aria-keyshortcuts':'F2'});
      const host=h('span',{class:'os-sync-action-edit-host',hidden:true});
      if(button.disabled)wrap.tabIndex=0;
      button.id||='os-sync-copy-'+key;
      editLabel(host,key,ru,en,{
        onCommitted:next=>{
          if(number&&button.firstChild?.nodeType===3)button.firstChild.nodeValue=next;
          else button.textContent=next;
        },
        onFinished:()=>{button.hidden=false;host.hidden=true}
      });
      for(const [keyName,value] of Object.entries({
        ownerCopySection:'catalog-sync',ownerCopyId:key,
        ownerCopyRu:ru,ownerCopyEn:en}))button.dataset[keyName]=value;
      const startEdit=event=>{
        if(!button.isConnected||!host.hidden||wrap.classList.contains('editing-hint'))return;
        cancelPending();
        event?.preventDefault?.();event?.stopPropagation?.();
        button.hidden=true;host.hidden=false;
        host.textContent=copy(key,ru,en);
        host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
      };
      button.addEventListener('click',event=>{
        if(!event.detail||number?.contains(event.target)){cancelPending();return}
        if(event.target.closest?.('.wiki-inline-input,[data-owner-text-field]'))return;
        event.preventDefault();event.stopImmediatePropagation();
        actionQueue.defer(button,()=>button.click());
      },true);
      wrap.addEventListener('dblclick',event=>{
        if(event.target.closest?.('.os-sync-hint-pencil,.os-sync-hint-edit-host,.os-sync-secondary-pencil,.os-sync-action-runtime-number,.wiki-inline-input,[data-owner-text-field]'))return;
        startEdit(event);
      });
      wrap.addEventListener('keydown',event=>{
        if(event.key==='F2'&&!event.target.closest?.(
          '.os-sync-hint-pencil,.os-sync-hint-edit-host,.wiki-inline-input,[data-owner-text-field]'))
          startEdit(event);
      });
      wrap.append(button,host);
      return wrap;
    };
    const groupAction=(button,key,dataset,options)=>{
      const row=catalogGroupActionByKey.get(key);
      if(!row)throw Error('Unreviewed catalog group action: '+key);
      // A group action is rendered once PER dataset. Do not reuse the same
      // document id for all sections; the editorial D1 key stays shared.
      if(typeof dataset!=='string'||!dataset||/\s/.test(dataset))
        throw Error('Invalid catalog group identity');
      button.id='os-sync-copy-'+key+'-'+dataset;
      return action(button,key,row[1],row[2],options);
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
        text:'✎',title:tr('Изменить подсказку','Edit tooltip'),
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
        text:'✎',title:tr('Изменить подсказку','Edit tooltip'),
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
    if(canEdit)view.addEventListener('pointerdown',event=>
      actionQueue.cancelOutside(event.target),true);
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
      disclosureCaption('archiveSummary'),
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
      text:'Проверить / повторить резерв GitHub',disabled:true});
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
    const backupBanner=h('p',{class:'os-sync-backup-banner','aria-live':'polite',hidden:true});
    // Only fixed authorial status copy is editable; dynamic progress,
    // server errors, game values and diagnostics remain untouched.
    const editorialState=(target,key,ru,en)=>{
      const label=h('span',{class:'os-sync-state-caption',text:copy(key,ru,en)});
      target.replaceChildren(label);
      if(canEdit&&typeof editLabel==='function')editLabel(label,key,ru,en);
    };
    editorialState(status,'initialStatus',
     'Начни с проверки текущей игры. Если данные недоступны, используй сохранённую копию.',
     'Check the current game first. If it is unavailable, use the saved snapshot.');
    const diagnostic=h('details',{class:'os-sync-diagnostics'},[
      disclosureCaption('diagnosticsSummary')
    ]);
    diagnostic.hidden=true;
    const diagnosticText=h('p',{class:'muted'});
    diagnostic.append(diagnosticText);
    const results = h('div', {class:'os-sync-results'});
    // The main comparison summary is the sole live status region; avoid
    // shadowing it in the accessibility tree and established review flows.
    const selectionGuidance=h('p',{class:'os-sync-selection-guidance'});
    // Mount the label nodes ONCE. A redraw of selected counts can update only
    // numeric siblings; it must never blur, overwrite or unmount an active
    // direct inline editor. Each prefix has a separate D1/CAS identity.
    const countPart=(key,separator='')=>{
      const wrap=h('span',{class:'os-sync-count-piece'});
      if(separator)wrap.append(h('span',{text:separator}));
      const value=h('span',{class:'os-sync-runtime-count',text:' 0'});
      wrap.append(statusCaption(key),value);
      return {wrap,value};
    };
    const setCountPart=(part,count,show=true)=>{
      part.wrap.hidden=!show;
      const value=' '+String(count);
      if(part.value.textContent!==value)part.value.textContent=value;
    };
    const overviewCaption=statusCaption('affectedSections');
    const overviewValues=h('span',{class:'os-sync-runtime-data'});
    overview.append(overviewCaption,overviewValues);
    const selectionParts={
      total:countPart('selectionTotal'),
      remaining:countPart('selectionRemaining',' · '),
      needsReview:countPart('selectionNeedsReview',' · '),
      settings:countPart('selectionSettings',' · ')
    };
    const selectionFormatting=h('span',{},[
      h('span',{text:' · '}),statusCaption('lineBreaksIncluded')
    ]);
    selectionGuidance.append(...Object.values(selectionParts).map(row=>row.wrap),
      selectionFormatting);
    const summaryParts={
      found:countPart('foundChanges'),
      technical:countPart('summaryTechnical',' · '),
      selected:countPart('summarySelected',' · '),
      unselected:countPart('summaryUnselected',' · '),
      needsReview:countPart('summaryNeedsReview',' · ')
    };
    const summaryEmpty=statusCaption('noChanges');
    summary.append(...Object.values(summaryParts).map(row=>row.wrap),summaryEmpty);
    for(const part of Object.values(summaryParts))part.wrap.hidden=true;
    summaryEmpty.hidden=true;
    // One concise review of what the selected changes will actually affect.
    const decisionPreview=h('div',{class:'os-sync-decision-preview',hidden:true});
    const decisionHeading=reviewCaption('strong',{},'decisionHeading');
    const decisionSummary=h('p',{class:'os-sync-decision-summary'});
    const decisionWarnings=h('p',{class:'os-sync-decision-warnings'});
    const formulaPreview=h('div',{class:'os-sync-formula-preview',hidden:true});
    const formulaTitle=reviewCaption('strong',{},'formulaTitle');
    const formulaStatus=h('p',{class:'os-sync-formula-status'});
    const formulaRows=h('div',{class:'os-sync-formula-rows'});
    const formulaNote=h('small',{class:'os-sync-formula-note',text:tr(
      'Числа очков и базовых ОЗ/ОМ проверяются отдельно от известных эффектов навыков, экипировки и связанных игровых записей. Новые и неизвестные механики не считаются рассчитанными.',
      'Point budgets and base HP/MP are checked separately from known skill effects, equipment bonuses and linked game records. New and unknown mechanics are not claimed to be calculated.')});
    formulaPreview.append(formulaTitle,formulaStatus,formulaRows,formulaNote);
    const riskApproval=h('input',{type:'checkbox',disabled:true});
    const riskApprovalLabel=h('label',{class:'os-sync-risk-approval',hidden:true},[
     riskApproval,h('span',{text:tr(
      'Я проверил спорные изменения и понимаю, что обновится каталог Build Studio.',
      'I reviewed the flagged changes and understand that the Build Studio catalog will change.')})
    ]);
    const coverageSummary=h('p',{class:'os-sync-coverage-summary',hidden:true});
    decisionPreview.append(decisionHeading,decisionSummary,coverageSummary,
      decisionWarnings,formulaPreview,riskApprovalLabel);
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
    const formattingOption=h(canEdit?'div':'label',{class:'os-sync-formatting-option'},
      [formattingToggle,formattingLabel,formattingCountLabel]);
    const formattingChoice=h('div',{class:'os-sync-choice-editor'},[formattingOption]);
    choiceEditor(formattingLabel,'formattingLabel',formattingRu,formattingEn);
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
      disclosureCaption('russianPreviewSummary'),russianList
    ]);
    const russianOption=h(canEdit?'div':'label',{class:'os-sync-formatting-option'},
      [russianToggle,russianLabel,russianCountLabel]);
    const russianChoice=h('div',{class:'os-sync-choice-editor'},[russianOption]);
    choiceEditor(russianLabel,'russianDescriptionsLabel',russianRu,russianEn);
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
      disclosureCaption('advancedSummary'),
      metaStatus,metaStatusDetail,
      authored('p',{},'advancedExplanation',
       'Проверка сохранения не обновляет данные игры. GitHub нужен для фиксации уже опубликованной версии, а скачивание — для ручной работы с данными.',
       'Testing D1 writes does not update game data. GitHub can record an already-published revision; downloads are for manual review.'),
      h('div',{class:'os-sync-advanced-actions'},[
       action(testWrite,'testWriteButton','Проверить сохранение правок','Test D1 writes'),
       action(testCAS,'testCasButton','Проверить конфликты правок','Test edit conflicts'),
       action(github,'githubButton','Проверить / повторить резерв GitHub','Check / retry GitHub backup'),
       action(exportButton,'exportButton','Скачать выбранное для GitHub','Download selected for GitHub')
      ])
    ]);
    // Shared compact owner panel; no per-item pencil, no source game edits.
    if(canEdit&&typeof createCopyEditor==='function'){
      const editor=createCopyEditor(catalogAccessibleCopyRows,
        'Доступные подписи сверки','Review accessibility labels');
      if(editor)advanced.append(editor);
    }
    actions.append(action(live,'liveButton','Проверить изменения в текущей игре','Check live game updates'),
     secondaryHint(archiveChoice,'hintArchiveDisclosure',
       'Открыть отдельную сверку с архивом GitHub Pages. Архивная копия не подтверждает актуальные параметры на игровом сайте.',
       'Open a comparison with the GitHub Pages archive. An archived copy cannot verify current game-server values.'),
     reviewSteps,
     secondaryHint(advanced,'hintAdvancedDisclosure',
       'Дополнительные инструменты: диагностика D1, ручной экспорт и повторное создание резервного PR при ошибке автоматической отправки.',
       'Advanced tools: D1 diagnostics, manual export, and retrying the fallback PR if automatic delivery failed.'));
    // Each action tooltip has independent RU/EN D1 copy. Its ✎ editor is
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
     disabled:true,
     'aria-description':tr('Очистить поиск по игровым изменениям','Clear game changes search'),
     onclick:()=>{search.value='';render();search.focus({preventScroll:true})}});
    accessible(clearSearch,'clearSearchAriaDescription','aria-description');
    const clearRow=catalogReviewDetailByKey.get('searchClear');
    const clearControl=action(clearSearch,clearRow[0],clearRow[1],clearRow[2]);
    if(clearControl!==clearSearch)clearControl.classList.add('os-sync-search-clear-editor');
    searchField.insertBefore(clearControl,
     searchField.querySelector('.os-sync-secondary-pencil'));
    view.append(intro,actions,sourceBanner,summary,status,backupBanner,diagnostic,progress,
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
          const missing=replay.samples.map(row=>{
           const role=row.module==='ally-recipient'?
            tr('Усиление союзника','Ally buff'):
            row.module==='priest-cast'?
             tr('Усиление жреца','Priest buff'):
             row.module.startsWith('source-recipe-')?
              tr('Материалы изготовления','Crafting materials'):
             row.module==='source-ammunition'?
              tr('Расход стрел','Ammunition consumption'):
             row.module==='source-support-material'?
              tr('Материалы умения','Skill materials'):
             row.module==='source-situational-material'||
             row.module==='source-special-resource'?
              tr('Особый ресурс','Special resource'):
             row.module==='source-item-skill'||
             row.module==='source-item-cure'?
              tr('Связь расходника с умением','Consumable skill link'):
             row.module.startsWith('source-')?
              replaySourceLabel(row.module):
             row.job==='target'?tr('Эффект цели','Target effect'):row.job;
           return row.name+' ('+role+(row.level?' · '+row.level:'')+')';
          });
          validation.ok=false;
          validation.issues.push(...replay.errors);
          if(replay.lost)validation.issues.push(tr(
           'Пропали ранее проверенные расчёты или сведения об игровых источниках: ',
           'Previously verified calculations or game-source details disappeared: ')+
           missing.slice(0,3).join(', ')+
           (replay.lost>3?' (+'+(replay.lost-3)+')':''));
        }
        // Every linked ID is audited, even when no old numeric model exists.
        // This catches new orphan skills/items that model replay cannot see.
        const graph=typeof safety.sourceGraphIntegrity==='function'?
         safety.sourceGraphIntegrity(baseline,selected):null;
        if(graph&&!graph.ok){
          validation.ok=false;
          const examples=graph.samples.map(x=>x.kind+' '+x.owner+
           ' · '+x.field+' → '+String(x.target??'—'));
          validation.issues.push(tr(
           'Новые или повреждённые игровые ссылки: ',
           'New or broken game references: ')+graph.newBroken+
           (examples.length?' · '+examples.slice(0,3).join('; '):''));
        }
        // Grade 0–10 source-EP replay: an unsupported replacement for a
        // previously numeric Soul/item bonus must block D1, before confirm.
        const equipment=typeof safety.replayEquipmentEffects==='function'?
         safety.replayEquipmentEffects(baseline,selected):null;
        if(equipment&&!equipment.ok){
          validation.ok=false;
          validation.issues.push(...equipment.errors);
          if(equipment.lost)validation.issues.push(tr(
           'Перестали рассчитываться прежние бонусы предметов или душ: ',
           'Existing item or Soul bonuses are no longer calculated: ')+
           equipment.samples.map(row=>row.name+' (+'+row.grade+
            ', '+row.previous+' → '+row.next+')').slice(0,3).join(', ')+
           (equipment.lost>3?' (+'+(equipment.lost-3)+')':''));
        }
        const targets=typeof safety.replayMonsterTargets==='function'?
          safety.replayMonsterTargets(baseline,selected):null;
        if(targets&&!targets.ok){
          validation.ok=false;
          validation.issues.push(...targets.errors);
          if(targets.lost)validation.issues.push(tr(
            'Пропали ранее доступные игровые цели или расчёты ударов: ',
            'Previously available targets or hit calculations disappeared: ')+
            targets.samples.slice(0,3).map(row=>row.name+' · '+row.detail).join('; ')+
            (targets.lost>3?' (+'+(targets.lost-3)+')':''));
        }
        result={validation,
          comparison:safety.compare(baseline,selected,hero),
          compatibility:safety.compatibility(baseline,selected),replay,equipment,graph,targets};
      }catch(error){
        result={validation:{ok:false,issues:[String(error.message||error)]},
          comparison:null};
      }
      impactCache={fingerprint,result};
      return result;
    }
    // Report every selected source, not only the first six summary samples.
    // Records not selected for publication have not been preflighted here.
    function selectedMechanicStatus(change){
      if(!chosen.has(change.id))return null;
      return statusForSelection(change,selectedImpact()?.compatibility?.entries||[]);
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
    // Each filter has a separate authored hover explanation; its own CAS
    // key never aliases the visible label or the calculated result count.
    // An owner pencil edits ONLY this tooltip, not the filter name.
    const filterHintRows=Object.freeze([
      ['all','Все найденные изменения.','All detected changes.'],
      ['added','Объекты, добавленные в проверяемом источнике.','Entries added in the checked source.'],
      ['changed','Объекты, чьи параметры отличаются.','Entries with changed parameters.'],
      ['removed','Объекты, которых нет в проверяемом источнике.','Entries missing from the checked source.'],
      ['accepted','Только изменения с поставленной галочкой.','Only selected changes.'],
      ['declined','Изменения без галочки, не выбранные для применения.','Changes not selected for publication.'],
      ['needsReview','Неоднозначные или неизвестные параметры — требуют ручного анализа.','Ambiguous or unknown fields require manual review.'],
      ['links','Изменилась привязка ссылок на предметы. Такие записи нужно выбирать вручную.','Item reference links changed; review and select these manually.'],
      ['sameVisible','Видимый текст одинаков, но исходные записи отличаются. Требуется ручная проверка.','Displayed text is the same, but the source differs. Review manually.'],
      ['readable','Изменения, для которых доступны понятные названия и описания.','Changes with readable labels and descriptions.']
    ]);
    const filterHintMap=new Map(filterHintRows.map(row=>[row[0],row]));
    const filterButtons=new Map();
    for(const [id,ru,en]of filterChoices){
      // Split the authorial filter word from the live category count.
      // The D1 key is stable and never contains source data or the number.
      const key='reviewFilter'+id[0].toUpperCase()+id.slice(1);
      const button=h('button',{type:'button',class:'os-sync-filter',
       'data-review-filter':id,'aria-pressed':String(id===filterKind),
       'aria-keyshortcuts':canEdit?'F2':null});
      const caption=h('span',{class:'os-sync-filter-caption',
       text:copy(key,ru,en)});
      const total=h('span',{class:'os-sync-filter-count',
       text:' · 0'});
      button.append(caption,total);
      if(canEdit&&typeof editLabel==='function')editLabel(caption,key,ru,en,{onStarted:cancelPending});
      const choose=()=>{if(busy)return;filterKind=id;render();};
      button.addEventListener('click',event=>{
        if(busy||event.target.closest?.('[data-owner-text-field],.wiki-inline-input'))
          return;
        // Owner double-click on the written caption enters the editor.
        // The first of those two clicks must not silently change the filter.
        // Guest clicks, keyboard activation, and clicks on the numeric
        // counter retain their immediate original action.
        if(!canEdit||!event.detail||!caption.contains(event.target)){
          cancelPending();choose();return;
        }
        event.preventDefault();event.stopPropagation();
        actionQueue.defer(button,choose);
      });
      button.addEventListener('keydown',event=>{
        if(canEdit&&event.target===button&&event.key==='F2'){
          event.preventDefault();event.stopPropagation();
          caption.dispatchEvent(new KeyboardEvent('keydown',{
           key:'F2',bubbles:true,cancelable:true}));
        }
      });
      const hintRow=filterHintMap.get(id);
      if(!hintRow)throw Error('Missing reviewed filter tooltip '+id);
      const wrapper=secondaryHint(button,'hintReviewFilter'+id[0].toUpperCase()+id.slice(1),
       hintRow[1],hintRow[2]);
      wrapper.classList.add('os-sync-filter-hint');
      filters.append(wrapper);filterButtons.set(id,button);
    }
    function matchesFilter(change){
      if(filterKind==='accepted')return chosen.has(change.id);
      if(filterKind==='declined')return !chosen.has(change.id);
      if(filterKind==='needsReview')return describe(change).uncertain||
        selectedMechanicStatus(change)==='needsReview';
      if(filterKind==='links')return describe(change).rows.some(row=>row.linkChanged);
      if(filterKind==='sameVisible')return describe(change).rows.some(row=>row.sameVisible);
      if(filterKind==='readable')return !describe(change).unexplained;
      return filterKind==='all'||change.kind===filterKind;
    }
    function setBusy(value) {
      if(value)cancelPending();
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
      coverageSummary.hidden=!ready||!preview?.compatibility;
      if(preview?.compatibility){
        const counts=preview.compatibility.totals;
        coverageSummary.textContent=tr(
         'Проверка выбранного каталога — рассчитано и проверено: ',
         'Selected catalog preflight — calculated and verified: ')+counts.verified+
         tr(' · только исходные сведения: ',' · source information only: ')+
         counts.sourceOnly+
         tr(' · нужна адаптация механики: ',' · mechanic adaptation needed: ')+
         counts.needsReview+
         (preview.graph?tr(' · игровые ссылки проверены: ',' · linked records inspected: ')+
          preview.graph.inspected:'')+
         (preview.graph?.newBroken?tr(' · повреждённых новых ссылок: ',
          ' · new broken links: ')+preview.graph.newBroken:'');
      }
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
       'Требуют адаптации механики; публикация не подтвердит их расчёты: ',
       'Mechanic adaptation required; publication cannot verify these calculations: ')+
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
          if(preview.equipment?.changedSources)
           formulaStatus.textContent+=tr(
            ' · Бонусы предметов/душ: ',' · Item/Soul effect checks: ')+
            String(preview.equipment.retained)+'/'+String(preview.equipment.oldModeled)+
            tr(' известных источников сохранено.',
               ' previously modeled sources retained.');
          const comparison=preview.comparison;
          if(comparison?.warning)
            formulaRows.append(h('p',{class:'os-sync-formula-warning',
             text:comparison.warning}));
          else if(comparison?.hasHero){
            if(!comparison.changes.length)
              formulaRows.append(reviewCaption('p',{},'heroNoChange'));
            for(const row of comparison.changes.slice(0,10))
              formulaRows.append(h('p',{class:'os-sync-formula-row'},[
                h('span',{text:lang==='en'?row.en:row.ru}),
                h('strong',{text:String(row.before??'—')+' → '+String(row.after??'—')})
              ]));
            if(comparison.changes.length>10)
              formulaRows.append(h('small',{},[
                reviewCaption('span',{},'heroMoreChangesLead'),
                h('span',{class:'os-sync-runtime-count',
                  text:' '+(comparison.changes.length-10)})
              ]));
          }else formulaRows.append(reviewCaption('p',{},'heroSelectHelp'));
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
        const caption=button.querySelector('.os-sync-filter-caption');
        // D1 save, re-filtering and count changes must never remove an
        // owner input that is still being edited or replace a live count.
        if(!caption.querySelector('[data-owner-text-field],.wiki-inline-input')){
          const key='reviewFilter'+id[0].toUpperCase()+id.slice(1);
          const value=copy(key,ru,en);
          if(caption.textContent!==value)caption.textContent=value;
        }
        const count=button.querySelector('.os-sync-filter-count');
        const value=' · '+byKind[id];
        if(count.textContent!==value)count.textContent=value;
        button.classList.toggle('active',id===filterKind);
        button.setAttribute('aria-pressed',String(id===filterKind));
      }
      // Explain which game areas changed instead of repeating five counters
      // inside a large dashboard of decorative statistics.
      const groups=importer.files.filter(name=>changes.some(row=>row.dataset===name));
      const ordered=[...groups.filter(name=>name!=='meta'),...groups.filter(name=>name==='meta')];
      overviewValues.textContent=ordered.length?' '+
        ordered.map(name=>(review.labels[name]||name)+' · '+
          changes.filter(row=>row.dataset===name).length).join('   •   '):'';
      overview.hidden=!reviewing||!changes.length;
      for(const panel of results.querySelectorAll('.os-sync-group')){
        const name=panel.getAttribute('data-game-dataset');
        const count=changes.filter(row=>row.dataset===name&&chosen.has(row.id)).length;
        const total=changes.filter(row=>row.dataset===name).length;
        const label=panel.querySelector('.os-sync-count > .os-sync-group-runtime-count');
        const value=count+' / '+total;
        if(label&&label.textContent!==value)label.textContent=value;
      }
      const service=changes.filter(row=>describe(row).service).length;
      const acceptedChanges=changes.filter(row=>chosen.has(row.id)).length;
      const remainingChanges=changes.length-acceptedChanges;
      const cautionSelected=changes.filter(row=>chosen.has(row.id)&&describe(row).uncertain).length;
      setCountPart(selectionParts.total,acceptedChanges+' / '+changes.length);
      setCountPart(selectionParts.remaining,remainingChanges,remainingChanges>0);
      setCountPart(selectionParts.needsReview,cautionSelected,cautionSelected>0);
      setCountPart(selectionParts.settings,service,service>0);
      selectionFormatting.hidden=!(mode==='server'&&formattingToggle.checked);
      const hasChanges=changes.length>0;
      setCountPart(summaryParts.found,changes.length,hasChanges);
      setCountPart(summaryParts.technical,service,hasChanges&&service>0);
      setCountPart(summaryParts.selected,selected,hasChanges);
      setCountPart(summaryParts.unselected,changes.length-selected,hasChanges);
      setCountPart(summaryParts.needsReview,byKind.needsReview,
        hasChanges&&byKind.needsReview>0);
      summaryEmpty.hidden=hasChanges||!baseline;
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
        change.title,description.title,description.titleEn,description.summary,description.summaryEn,
        ...description.rows.flatMap(field=>[
          field.label,field.labelEn||'',field.noteEn||'',field.linkedItemName||'',
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
        const button=accessible(h('button',{type:'button',class:'os-sync-item-ref',
          'aria-expanded':String(wasExpanded),text:segment.text}),
        'linkedPreviewAria','aria-label',' '+segment.text);
        // The tooltip is independently authored. Its editor pencil is NEVER
        // a caption pencil, and never enters the source item button's click.
        const tooltipRow=catalogReviewDetailByKey.get('hintLinkedReference');
        const [tooltipKey,tooltipRu,tooltipEn]=tooltipRow;
        hint(button,copy(tooltipKey,tooltipRu,tooltipEn));
        button.dataset.guideOwnerKey=tooltipKey;
        // Keyboard focus must encounter the source button before its help
        // pencil: a focused button reveals the adjacent pencil for next Tab.
        reference.append(button);
        if(canEdit&&typeof editLabel==='function'){
          const pencil=h('button',{type:'button',class:'os-sync-reference-hint-pencil',
            text:'✎',title:tr('Изменить подсказку','Edit tooltip'),
            'aria-label':tr('Изменить подсказку связанного предмета',
              'Edit linked item tooltip')});
          const host=h('span',{class:'os-sync-reference-hint-host',hidden:true});
          editLabel(host,tooltipKey,tooltipRu,tooltipEn,{
            onCommitted:next=>{button.dataset.guideHint=next},
            onFinished:()=>{pencil.hidden=false;host.hidden=true}
          });
          pencil.addEventListener('click',event=>{
            event.preventDefault();event.stopPropagation();
            if(!button.isConnected)return;
            pencil.hidden=true;host.hidden=false;
            host.textContent=copy(tooltipKey,tooltipRu,tooltipEn);
            host.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
          });
          reference.append(pencil,host);
        }
        const preview=h('span',{class:'os-sync-reference-preview',hidden:!wasExpanded});
        preview.append(h('strong',{text:segment.text}),
          reviewCaption('small',{},'linkedReferenceContext'));
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
          // The player retains a normal clickable label. In owner mode, an
          // editable label must not navigate on the FIRST click of dblclick:
          // keep the direct D1/CAS caption beside a separate real link.
          // Both paths preserve the same trusted, encoded in-app item URL.
          const itemHref='#wiki/item/'+encodeURIComponent(segment.id);
          const openRow=catalogReviewDetailByKey.get('linkedReferenceOpen');
          if(canEdit&&typeof editLabel==='function'){
            const opener=h('span',{class:'os-sync-reference-open-editor'});
            opener.append(
              reviewCaption('span',{class:'os-sync-reference-open-copy'},'linkedReferenceOpen'),
              accessible(h('a',{href:itemHref,target:'_blank',rel:'noopener noreferrer',
                // Preserve the original stable link selector/API; the new
                // icon class is only for the split owner-edit presentation.
                class:'os-sync-reference-open os-sync-reference-open-icon',
                text:'↗'}),'linkedOpenAria','aria-label',' '+segment.text)
            );
            preview.append(opener);
          }else{
            preview.append(h('a',{
              href:itemHref,target:'_blank',rel:'noopener noreferrer',
              class:'os-sync-reference-open',
              text:copy(openRow[0],openRow[1],openRow[2])+' ↗'}));
          }
        }else preview.append(reviewCaption('small',{},'unpublishedReference'));
        button.onclick=()=>{
          const expanded=preview.hidden;
          preview.hidden=!expanded;
          button.setAttribute('aria-expanded',String(expanded));
          if(refKey){
            if(expanded)expandedReferences.add(refKey);
            else expandedReferences.delete(refKey);
          }
        };
        reference.append(preview);
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
        class:'os-sync-result-count'},[
        reviewCaption('span',{},'changedParametersLead'),
        h('span',{class:'os-sync-runtime-count',text:' '+description.rows.length})
      ]));
      content.append(h('p',{class:'os-sync-change-summary',text:lang==='en'&&description.summaryEn?description.summaryEn:description.summary}));
      // Show the game-level meaning up front, not only technical field changes.
      const impacts=description.impacts||[];
      const notable=impactSamples(impacts);
      if(impacts.length){
        const panel=h('div',{class:'os-sync-impact-preview'});
        panel.append(reviewCaption('strong',{},'impactHeading'));
        for(const effect of notable)
          panel.append(h('p',{class:'os-sync-impact-line',text:lang==='en'?effect.previewEn||effect.preview:effect.preview}));
        if(impacts.length>4)panel.append(h('small',{class:'muted'},[
          reviewCaption('span',{},'moreImpactsLead'),
          h('span',{class:'os-sync-runtime-count',text:' '+(impacts.length-4)+' '}),
          reviewCaption('span',{},'moreImpactsSuffix')
        ]));
        panel.append(h('small',{class:'muted',text:tr(
          'Соло / 4 / 8 активных участников на карте. Только этот источник дропа; не подтверждение работы игрового сервера.',
          'Solo / 4 / 8 active party members on this map. This loot source only; not verified game-server behavior.')}));
        content.append(panel);
      }
      if(description.caution)content.append(h('p',{
        class:'os-sync-change-caution',text:lang==='en'&&description.cautionEn?description.cautionEn:description.caution}));
      const details=h('details',{class:'os-sync-field-details'});
      details.open=expandedDetails.has(change.id);
      details.addEventListener('toggle',()=>{
        if(!details.isConnected)return;
        if(details.open)expandedDetails.add(change.id);
        else expandedDetails.delete(change.id);
      });
      details.append(disclosureCaption('fieldDetailsSummary',{
        count:description.rows.length}));
      if(description.rows.length){
        for(const field of description.rows){
          const language=change.dataset==='strings.en'?'en':'ru';
          const oldValue=h('span',{class:'os-sync-full-value os-sync-old'});
          const newValue=h('span',{class:'os-sync-full-value os-sync-new'});
          oldValue.append(field.sourceBefore!==null&&field.sourceBefore!==undefined?
            linkedDescription(field.sourceBefore,language,change.id+'|'+field.label+'|old'):
            document.createTextNode(String(lang==='en'&&field.beforeEn!==null&&field.beforeEn!==undefined?
              field.beforeEn:(field.beforeFull??field.before))));
          newValue.append(field.sourceAfter!==null&&field.sourceAfter!==undefined?
            linkedDescription(field.sourceAfter,language,change.id+'|'+field.label+'|new'):
            document.createTextNode(String(lang==='en'&&field.afterEn!==null&&field.afterEn!==undefined?
              field.afterEn:(field.afterFull??field.after))));
          if(field.difference){
            const delta=h('small',{class:'os-sync-value-delta',
              text:(field.delta>0?'▲ ':'▼ ')+field.difference});
            hint(delta,tr('Изменение числа относительно опубликованной версии. Знак не означает, что изменение полезно или вредно.',
           'Change relative to the published version. The sign does not imply that the change is beneficial or harmful.'));
            newValue.append(delta);
          }
          const displayLabel=lang==='en'&&field.labelEn?field.labelEn:field.label;
          const label=h('strong',{text:displayLabel});
          if(/^[0-9]{1,12}$/.test(field.linkedItemId||'')&&field.linkedItemName){
            const start=displayLabel.indexOf(field.linkedItemName);
            if(start>=0){
              label.replaceChildren(
                document.createTextNode(displayLabel.slice(0,start)),
                linkedDescription('<item '+field.linkedItemId+'>','ru',change.id+'|'+field.label+'|label'),
                document.createTextNode(displayLabel.slice(start+field.linkedItemName.length))
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
          if(field.note)line.append(h('p',{class:'os-sync-field-note',
            text:lang==='en'&&field.noteEn?field.noteEn:field.note}));
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
      raw.append(disclosureCaption('rawDetailsSummary'));
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
      if(clearControl!==clearSearch)clearControl.tabIndex=clearSearch.disabled?0:-1;
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
        const groupStatusKey='groupSelectedSuffix';
        const groupStatusRow=catalogReviewStatusByKey.get(groupStatusKey);
        const groupCaption=h('span',{class:'os-sync-status-copy',
          text:copy(groupStatusKey,groupStatusRow[1],groupStatusRow[2])});
        const groupHeading=h('summary',{class:'os-sync-group-heading'},[
          h('strong',{text:review.labels[name]||name}),
          h('span',{class:'os-sync-count'},[
            h('span',{class:'os-sync-group-runtime-count',text:selected+' / '+group.length}),
            document.createTextNode(' '),groupCaption
          ])
        ]);
        bindDisclosureCaption(groupHeading,groupCaption,groupStatusKey,groupStatusRow);
        panel.append(groupHeading);
        const toolbar = h('div',{class:'os-sync-group-actions'});
        const take = h('button',{type:'button',class:'button-action',
          disabled:busy||!group.some(safe)});
        const reject = h('button',{type:'button',class:'button-action',disabled:busy});
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
          disabled:busy||!filtered.some(safe)});
        takeVisible.onclick=()=>{
          if(busy)return;
          for(const item of filtered)if(safe(item))chosen.add(item.id);
          render();
        };
        toolbar.append(groupAction(take,'groupTake',name),groupAction(reject,'groupReject',name));
        if(query||filterKind!=='all')toolbar.append(
          groupAction(takeVisible,'groupMatching',name,{count:filtered.filter(safe).length}));
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
          const mechanic=selectedMechanicStatus(change);
          if(mechanic)helper.textContent+=' · '+(
           mechanic==='verified'?tr('Расчёт проверен','Model checked'):
           mechanic==='sourceOnly'?tr('Только сведения из игры','Game data only'):
           tr('Нужна адаптация механики','Mechanic adaptation required'));
          if(variantTotal.get(description.title)>1)
            helper.textContent+=tr(' · Вариант ',' · Variant ')+variantOrder.get(change.id)+
              tr(' из ',' of ')+variantTotal.get(description.title)+
              tr(' с этим названием',' with this name');
          const visibleTitle=lang==='en'?description.titleEn||description.title:description.title;
          const input = accessible(h('input',{type:'checkbox',checked:checked(change),
            disabled:busy}),'reviewSelectAria','aria-label',' '+visibleTitle+
              (hasLinks||visuallySame?tr(' — требуется отдельная проверка',
                ' — requires separate review'):''));
          input.addEventListener('change',()=>{
            setChoice(change,input.checked);
            row.classList.toggle('os-sync-record-selected',input.checked);
          });
          const indicator = change.kind==='added'?tr('Добавлено','Added'):
            change.kind==='removed'?tr('Удалено','Removed'):tr('Изменено','Changed');
          row.append(h('label',{class:'os-sync-record-label'},[
            input,
            h('span',{class:'os-sync-record-title'},[
              h('strong',{text:visibleTitle}),helper
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
          const more=h('button',{type:'button',class:'button-action'});
          more.onclick=()=>{full.add(name);expanded.add(name);render()};
          panel.append(groupAction(more,'groupMore',name,{
            count:filtered.length-limit}));
        }
        results.append(panel);
      }
      if(!results.childElementCount&&baseline)
        results.append(reviewCaption('p',{class:'os-sync-empty'},'emptyReviewFilter'));
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
      if (!response.ok) throw Error(tr('Архив ','Archive ')+name+': HTTP '+response.status);
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
      results.replaceChildren();
      for(const part of Object.values(summaryParts))part.wrap.hidden=true;
      summaryEmpty.hidden=true;
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
            throw Error(tr('Игровой каталог обновился во время проверки. Повтори сверку.','Game data changed during comparison. Run the check again.'));
        }
        const locales=await fetch('./data/localization/legacy-approved.v1.json',{cache:'no-store'});
        if (!locales.ok) throw Error(tr('Утверждённый архив перевода недоступен','The approved translation archive is unavailable'));
        const approved=await locales.json();
        importer.normalize(next,approved); // Reject incomplete live source before review.
        const versions=new Set();
        let compared=0;
        await mapLimited(importer.files,async name=>{
          const alias=name==='strings.en'?'stringsEn':name;
          const response=await fetch(apiBase+'/api/catalog/'+alias+'.json',
            {cache:'no-store',signal:AbortSignal.timeout(15000)});
          if (!response.ok) throw Error(tr('Активная D1 ','Active D1 ')+name+': HTTP '+response.status);
          if(response.headers.get('x-ps-catalog')!=='d1')
            throw Error(tr('Не подтверждён источник D1 для ','D1 source was not verified for ')+name+tr('. Обнови страницу и повтори сверку.','. Refresh the page and compare again.'));
          const snapshot=response.headers.get('x-ps-catalog-snapshot');
          if (!snapshot) throw Error(tr('D1 не сообщает версию каталога','D1 did not report a catalog revision'));
          versions.add(snapshot);
          old[name]=await response.json();
          progress.value=45+Math.round(55*(++compared)/importer.files.length);
        });
        const localeResponse=await fetch(apiBase+'/api/catalog/legacyLocale.json',
          {cache:'no-store',signal:AbortSignal.timeout(15000)});
        if (!localeResponse.ok) throw Error(tr('Не получен текущий перевод D1','Could not retrieve the active D1 translation'));
        if(localeResponse.headers.get('x-ps-catalog')!=='d1')
          throw Error(tr('Не подтверждён источник D1 для локализации. Публикация остановлена.','D1 translation source was not verified. Publishing is blocked.'));
        const localeSnapshot=localeResponse.headers.get('x-ps-catalog-snapshot');
        if (!localeSnapshot) throw Error(tr('Нет версии локализации D1','D1 translation revision is missing'));
        versions.add(localeSnapshot);
        if (versions.size!==1) throw Error(tr('D1 изменилась во время проверки — повтори сверку','D1 changed during comparison — run the check again'));
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
          // The Worker's reason, source path and HTTP status are raw diagnostics.
          // Only this fixed explanation is translated; it cannot edit D1.
          const issue=code==='403'||code==='401'
           ?tr('Сайт игры не разрешил запрос Cloudflare Worker (HTTP ',
               'The game site rejected the Cloudflare Worker request (HTTP ')+code+
            tr('). Даже если адрес открывается в браузере, серверные запросы могут блокироваться.',
               '). Server-side requests can be blocked even if the site opens in your browser.')
           :code==='404'
           ?tr('На сайте игры не найден один из файлов игровых данных (HTTP 404).',
               'A game-data file was not found on the game site (HTTP 404).')
           :code==='429'
           ?tr('Сайт игры временно ограничил число запросов (HTTP 429).',
               'The game site temporarily rate-limited requests (HTTP 429).')
           :reason==='timeout'
           ?tr('Истекло время ожидания ответа сайта игры.',
               'The game site did not respond before the timeout.')
           :reason==='network'
           ?tr('Cloudflare Worker не смог установить соединение с сайтом игры.',
               'Cloudflare Worker could not connect to the game site.')
           :reason==='invalid-json'||reason==='invalid-format'
           ?tr('Сайт игры ответил данными, которые нельзя распознать как игровой JSON.',
               'The game site returned data that could not be parsed as game JSON.')
           :reason==='too-large'
           ?tr('Ответ сайта игры превысил ограничение безопасности.',
               'The game site response exceeded the safety size limit.')
           :code?tr('Сайт игры ответил HTTP ','The game site returned HTTP ')+code+'.'
           :tr('Не удалось получить открытые игровые данные через Cloudflare Worker.',
               'Public game data could not be retrieved through Cloudflare Worker.');
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
        diagnosticText.textContent=tr('Этап: ','Stage: ')+
          (error.sourceDataset||tr('не определён','unknown'))+
          tr(' · Ответ Worker: ',' · Worker response: ')+
          (error.httpStatus??tr('нет HTTP-ответа','no HTTP response'))+
          tr(' · Причина: ',' · Reason: ')+
          (error.reason||tr('не указана','not provided'))+
          ' · '+String(error.message||error);
        diagnostic.hidden=false;
        baseline=null;upstream=null;changes=[];impactCache=null;
        refreshActions();
      }finally{setBusy(false)}
    }


    // Read-only status of the durable GitHub backup, independent of live D1.
    // Stop polling when the modal is closed; a server Cron owns retry delivery.
    let backupPollSequence=0;
    function startBackupTracking(snapshot){
      if(!snapshot)return;
      const generation=++backupPollSequence;
      const tick=async(n=0)=>{
        if(!view.isConnected||generation!==backupPollSequence)return;
        let stage='unavailable',url=null;
        try{
          const response=await request('/api/admin/catalog/backup-status',null);
          if(!view.isConnected||generation!==backupPollSequence)return;
          stage=response?.snapshot===snapshot?
            response?.backup?.state||'unavailable':'superseded';
          url=response?.backup?.url;
        }catch{}
        const copyByState={
          not_started:tr('Резервная копия ещё не создана.','Backup not created yet.'),
          working:tr('Каталог обновлён. Резервная копия создаётся автоматически; окно можно закрыть.',
                     'Catalog updated. Backup is prepared automatically; you may close this window.'),
          checking:tr('Каталог обновлён. Резервная копия проверяется; окно можно закрыть.',
                      'Catalog updated. Backup is being verified; you may close this window.'),
          synced:tr('Готово: каталог обновлён, резервная копия сохранена.',
                    'Done: catalog updated and backup saved.'),
          attention:tr('Каталог обновлён, но резервная копия требует внимания. Данные не откатывались.',
                       'Catalog updated, but the backup needs attention. Data was not rolled back.'),
          superseded:tr('Уже опубликована другая версия каталога.',
                        'A newer catalog snapshot has already been published.'),
          unavailable:tr('Каталог обновлён. Статус копии пока недоступен; проверка повторится автоматически.',
                         'Catalog updated. Backup status is unavailable; a retry will run automatically.')
        };
        backupBanner.replaceChildren(document.createTextNode(
          copyByState[stage]||copyByState.unavailable));
        if(/^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(url||'')){
          backupBanner.append(document.createTextNode(' '),
            h('a',{href:url,target:'_blank',rel:'noopener noreferrer',
              text:tr('Подробнее','Details')}));
        }
        backupBanner.hidden=false;
        if(!['synced','attention','superseded'].includes(stage)&&n<30)
          setTimeout(()=>tick(n+1),8000);
      };
      void tick();
    }

    async function verifyPublishedForPlayers(snapshot,expected){
      await afterPublish();
      return verifyPublishedSnapshot(apiBase,snapshot,expected,fetch,lang);
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
      // One simple success; the durable GitHub backup has independent status.
      status.textContent=tr('✓ Каталог обновлён. Проверено разделов: ',
       '✓ Catalog updated. Datasets verified: ')+
       check.verifiedDatasets+'/'+importer.files.length+'.';
      if(recovered)status.textContent+=tr(
       ' Ответ сервера задержался, но публикация подтверждена.',
       ' Server response was delayed, but publication was verified.');
      if(superseded){
       status.textContent+=tr(' Уже опубликована следующая версия.',
        ' A newer revision is already published.');
       return;
      }
      startBackupTracking(snapshot);
    }

    function prepare() {
      const syncFormatting=mode==='server'&&formattingToggle.checked&&formattingCount>0;
      const syncRussianInstances=mode==='server'&&russianToggle.checked&&verifiedRussian.length>0;
      if(!baseline||!upstream||(!chosen.size&&!syncFormatting&&!syncRussianInstances))
       throw Error(tr('Нет выбранных изменений для публикации','No changes selected for publication'));
      const combined=review.compose(baseline,upstream,chosen,importer.files,
        {syncFormatting,syncRussianInstances,localInstances});
      // Full structural and count validation is required after selective merging.
      const modelCheck=safety.check(combined);
      if(!modelCheck.ok)
        throw Error(tr('Проверка расчётов перед публикацией: ','Pre-publication calculation check: ')+modelCheck.issues.join(' · '));
      const compatibility=safety.compatibility(baseline,combined);
      // Recheck immediately before confirmed publication, independently
      // of the cached UI preview. Do not silently discard old numeric models.
      const replay=typeof safety.replaySkills==='function'?
       safety.replaySkills(baseline,combined):null;
      const lossSummary=Object.entries(replay?.lostByModule||{})
       .sort((a,b)=>b[1]-a[1]).slice(0,3)
       .map(([group,count])=>replaySourceLabel(group)+' · '+count);
      if(replay&&!replay.ok)throw Error(
       tr('Проверка расчётов и источниковых связей: ','Calculation and source-link check: ')+replay.lost+
       tr(' ранее проверенных сценариев перестали подтверждаться. ',' previously verified scenarios can no longer be confirmed. ')+
       (lossSummary.length?tr('Основные разделы: ','Main sections: ')+lossSummary.join(' · ')+'. ':'')+
       [...replay.errors,...replay.samples.map(x=>x.name+' / '+
        (x.module==='source-access-notice'?tr('доступность навыка','skill availability'):
         x.module==='ally-recipient'?tr('усиление союзника','ally buff'):
         x.module==='priest-cast'?tr('усиление жреца','priest buff'):
         x.module.startsWith('source-recipe-')?tr('рецепт','recipe'):
         x.module==='source-ammunition'?tr('расход стрел','ammunition use'):
         x.module==='source-support-material'?tr('материалы умения','skill materials'):
         x.module==='source-special-resource'||
         x.module==='source-situational-material'?tr('особый ресурс','special resource'):
         x.module==='source-item-skill'||
         x.module==='source-item-cure'?tr('связь расходника','consumable link'):
         x.module.startsWith('source-')?replaySourceLabel(x.module):
         x.job==='target'?tr('эффект цели','target effect'):x.job)+
        (x.level?' / '+x.level:''))].slice(0,4).join(' · '));
      const graph=typeof safety.sourceGraphIntegrity==='function'?
       safety.sourceGraphIntegrity(baseline,combined):null;
      if(graph&&!graph.ok)throw Error(
       tr('Проверка связей: обнаружено новых повреждённых ссылок: ','Game links: new broken references found: ')+
       graph.newBroken+' · '+graph.samples.map(x=>x.kind+' '+x.owner+
        ' / '+x.field+' → '+String(x.target??'—')).slice(0,4).join(' · '));
      const equipment=typeof safety.replayEquipmentEffects==='function'?
       safety.replayEquipmentEffects(baseline,combined):null;
      if(equipment&&!equipment.ok)throw Error(
       tr('Проверка бонусов предметов и душ: ','Item and Soul bonus check: ')+equipment.lost+
       tr(' известных числовых действий перестали рассчитываться. ',' known numeric effects are no longer calculated. ')+
       [...equipment.errors,...equipment.samples.map(x=>x.name+' / +'+
        x.grade+' / '+x.previous+' → '+x.next)].slice(0,4).join(' · '));
      const targets=typeof safety.replayMonsterTargets==='function'?
        safety.replayMonsterTargets(baseline,combined):null;
      if(targets&&!targets.ok)throw Error(
        tr('Проверка игровых целей и разницы уровней: ','Target and level-difference check: ')+
        targets.lost+tr(' ранее доступных целей или расчётов перестали подтверждаться. ',' previously available targets or calculations can no longer be confirmed. ')+
        [...targets.errors,...targets.samples.map(row=>
         row.name+' / '+row.detail)].slice(0,4).join(' · '));
      const normalized=importer.normalize(combined,legacy);
      if(!Array.isArray(legacyRows)||legacyRows.length!==normalized.counts.legacyLocale)
        throw Error(tr('Количество записей перевода D1 изменилось во время сверки','Published D1 translation count changed during review'));
      normalized.entries.legacyLocale=legacyRows; // Preserve exact IDs, payloads and source attribution.
      review.auditSelection(baseline,upstream,combined,chosen,importer.files,
        {syncRussianInstances});
      return {combined,normalized,compatibility,replay,equipment,graph,targets};
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
        editorialState(status,'exportDownloaded',
         'Выбранный снимок скачан. GitHub не изменён.',
         'Selected snapshot downloaded. GitHub was not changed.');
      }catch(error){status.textContent=tr('Экспорт не выполнен: ','Export failed: ')+error.message}
    };

    publish.onclick=async()=>{
      if(busy||publish.disabled||!permitMutation())return;
      let publishingSnapshot=null;
      let staged;
      try{staged=prepare()}catch(error){status.textContent=tr('Нельзя публиковать: ','Cannot publish: ')+error.message;return}
      const added=changes.filter(x=>checked(x)&&x.kind==='added').length;
      const changed=changes.filter(x=>checked(x)&&x.kind==='changed').length;
      const removed=changes.filter(x=>checked(x)&&x.kind==='removed').length;
      const uncertain=changes.filter(x=>checked(x)&&describe(x).uncertain).length;
      const notSelectedGame=changes.filter(x=>!checked(x)&&!describe(x).service).length;
      const unselectedSettings=changes.filter(x=>!checked(x)&&describe(x).service).length;
      const formatted=mode==='server'&&formattingToggle.checked?formattingCount:0;
      const ruCount=mode==='server'&&russianToggle.checked?verifiedRussian.length:0;
      // A single confirmation path preserves all irreversible safety evidence
      // across languages. Source-authored titles and estimates stay read-only.
      const sourceWarning=mode==='archive'
       ?tr('\nИСТОЧНИК: архивная копия может быть устаревшей.',
           '\nSOURCE: the archive may be outdated.')
       :tr('\nИСТОЧНИК: доступные данные текущей игры.',
           '\nSOURCE: currently available game data.');
      const selectedChanges=changes.filter(checked);
      const selectedDescriptions=selectedChanges.map(describe);
      const selectedImpacts=selectedDescriptions.flatMap(d=>d.impacts||[]);
      const impactPreview=selectedImpacts.length?
       tr('\n\nРАСЧЁТНОЕ ИЗМЕНЕНИЕ ШАНСОВ В BUILD STUDIO:\n',
          '\n\nESTIMATED CHANCE CHANGES IN BUILD STUDIO:\n')+
       impactSamples(selectedImpacts).map(e=>'• '+(lang==='en'?e.previewEn||e.preview:e.preview)).join('\n')+
       (selectedImpacts.length>4?
        tr('\n• И ещё ','\n• And ')+(selectedImpacts.length-4)+
        tr(' изменений (смотри подробную сверку).',' more changes (see detailed comparison).'):'')+
       tr('\nЭто расчётная оценка; фактический результат на игровом сервере не проверен.',
          '\nThese are estimates; actual game-server results have not been verified.'):'';
      const otherPreview=selectedDescriptions.filter(d=>!(d.impacts||[]).length)
       .slice(0,2).map(d=>'\n• '+(lang==='en'?d.titleEn||d.title:d.title)+
     ': '+(lang==='en'&&d.summaryEn?d.summaryEn:d.summary).slice(0,200)).join('');
      const atomicWarning=selectedChanges.some(e=>e.dataset==='tables')?
       tr('\n\nВАЖНО: выбран весь набор «Игровые формулы», не один предмет. '+
          'После подтверждения обновятся все таблицы этого раздела в D1. '+
          'Применить только одну строку внутри невозможно.',
          '\n\nIMPORTANT: the entire game-formula table group was selected, not one item. '+
          'Confirming replaces all tables in this D1 section. '+
          'An individual row cannot be published separately.'):'';
      const uncertainWarning=uncertain?
       tr('\nВНИМАНИЕ: ','\nWARNING: ')+uncertain+
       tr(' выбранных изменений требуют ручной проверки.',
          ' selected changes require manual review.'):'';
      const compatibility=staged.compatibility;
      const mechanicWarning=compatibility?.requiresMechanicReview?
       tr('\n\nПРОВЕРКА МЕХАНИК: ','\n\nMECHANICS REVIEW: ')+
       compatibility.totals.needsReview+
       tr(' изменений игровых свойств и эффектов требуют проверки совместимости. '+
          'Новая формула не подтверждается одним обновлением D1. Примеры: ',
          ' gameplay properties or effects need compatibility review. '+
          'Publishing D1 alone does not validate a new formula. Examples: ')+
       compatibility.samples.needsReview.slice(0,3).map(x=>x.title).join('; ')+
       tr('. Публикация не гарантирует численные результаты неизвестных эффектов.',
          '. Publishing does not guarantee numeric results for unknown effects.'):'';
      const verifiedNotice=compatibility?.totals.verified?
       tr('\nБазовые расчёты и таблицы: проверено ',
          '\nBase calculations and tables: verified ')+compatibility.totals.verified+
       tr(' разделов (не полная проверка всех боевых механик).',
          ' sections (not a complete check of every combat mechanic).'):'';
      const confirmation=tr('Применить выбранные изменения в каталог Build Studio?\n',
                            'Publish these changes to the Build Studio catalog?\n')+
       tr('Новых: ','New: ')+added+
       tr(' · Изменённых: ',' · Changed: ')+changed+
       tr(' · Удалённых: ',' · Removed: ')+removed+
       tr(' · Переносов: ',' · Line breaks: ')+formatted+
       tr(' · Русских описаний: ',' · Russian descriptions: ')+ruCount+'.'+
       (notSelectedGame?
        tr('\nНе выбрано игровых изменений: ','\nUnselected game changes: ')+notSelectedGame+'.':'')+
       (unselectedSettings?
        tr('\nНе выбрано настроек: ','\nUnselected settings: ')+unselectedSettings+'.':'')+
       sourceWarning+uncertainWarning+mechanicWarning+verifiedNotice+
       atomicWarning+impactPreview+otherPreview+
       tr('\n\nМеняется каталог Build Studio, а НЕ сама игра. Проверь выбранное перед подтверждением. '+
          'Ничего не опубликовано до этого подтверждения.',
          '\n\nOnly the Build Studio catalog changes, NOT the game. Review before confirming. '+
          'Nothing is published before you confirm.');
      if(!confirm(confirmation))return;
      if(!permitMutation())return;
      publishing=true;
      const closeButton=view.closest('.modal')?.querySelector('button.close');
      if(closeButton)closeButton.disabled=true;
      setBusy(true);
      try {
        // The reviewed D1 update is independent of the external GitHub
        // connection. The Worker commits a durable backup job atomically,
        // with background retries if GitHub is unavailable.
        const current=await request('/api/admin/catalog/status',{});
        if (current.active!==activeSnapshot) throw Error(tr('D1 обновлена после проверки. Сверь данные заново.','D1 changed after comparison. Run the comparison again.'));
        await request('/api/admin/catalog/initialize',{});
        const snapshot='ps-'+crypto.randomUUID().replaceAll('-','');
        publishingSnapshot=snapshot;
        if(!/^[a-z0-9-]{8,64}$/.test(snapshot))
          throw Error(tr('Не удалось подготовить новую версию каталога','Could not prepare a new catalog revision'));
        const prepared=staged.normalized;
        const total=Object.values(prepared.counts).reduce((n,count)=>n+count,0);
        let done=0;
        for (const name of prepared.datasets) {
          const rows=prepared.entries[name];
          for (let offset=0;offset<rows.length;) {
            const batch=[];let size=0;
            while (offset<rows.length && batch.length<30) {
              const entry=rows[offset],bytes=JSON.stringify(entry).length;
              if (bytes>12000) throw Error(tr('Запись слишком велика: ','Record exceeds size limit: ')+name+'/'+entry.key);
              if (batch.length && size+bytes>42000) break;
              batch.push(entry);size+=bytes;offset++;
            }
            await request('/api/admin/catalog/batch',{snapshot,dataset:name,records:batch});
            done+=batch.length;
            progress.value=Math.round(done/total*100);
            status.textContent=tr('Подготавливаю обновление · ','Preparing update · ')+
              done+tr(' из ',' of ')+total;
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
          ?tr('Сеанс администратора истёк. Проверь активную версию D1 после повторного входа.',
              'The admin session expired. After signing in again, check the active D1 revision.')
          :tr('Не удалось завершить обновление: ','Could not complete the update: ')+error.message+
            tr('. Данные могли остаться прежними или уже обновиться. Сначала проверь каталог заново; не применяй тот же набор вслепую.',
               '. Data may be unchanged or already published. Check the active catalog before retrying; never apply the same selection blindly.');
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
      if(!confirm(tr(
       'Проверить, работают ли сохранение и удаление правок? Будут созданы и удалены две временные записи. Игровой каталог и билды не изменяются.',
       'Verify that saving and deleting edits works? Two temporary records will be created and deleted. The game catalog and builds will not change.')))return;
      setBusy(true);
      try{
        const result=await request('/api/admin/catalog/test-write',{});
        if(result.ok!==true||result.readback!==true||result.cleaned!==true||
           result.overrideReadback!==true||result.overrideCleaned!==true||
           result.activeCatalogUnchanged!==true)
          throw Error('D1 не подтвердила запись, чтение, очистку и неизменность каталога');
        editorialState(status,'testWriteSuccess',
         'Сохранение работает: обе пробные записи созданы, прочитаны и удалены. Игровой каталог не изменился.',
         'Saving works: both test records were created, read, and deleted. The game catalog is unchanged.');
      }catch(error){
        status.textContent=error.httpStatus===401
          ? tr('Сеанс администратора завершился. Войди заново.',
              'The admin session ended. Sign in again.')
          : tr('Проверка записи D1 не пройдена: ','D1 write verification failed: ')+
            error.message;
      }finally{setBusy(false)}
    };
    testCAS.onclick=async()=>{
      if(busy||!permitMutation())return;
      if(!confirm(tr(
       'Проверить конфликты правок? Будут временно записаны и удалены только две случайные тестовые записи D1. Игровые данные и билды не меняются.',
       'Check edit conflicts? Only two random temporary D1 test records will be written and deleted. Game data and builds will not change.')))return;
      setBusy(true);
      try{
        const result=await request('/api/admin/catalog/test-owner-cas',{});
        if(result.ok!==true||result.casVerified!==true||result.qaCleaned!==true||
           result.activeCatalogUnchanged!==true)
          throw Error('Не подтверждены конфликты, очистка и неизменность каталога');
        editorialState(status,'testCasSuccess',
         'Проверка пройдена: устаревшие правки отклоняются, обе тестовые записи удалены, игровой каталог не изменился.',
         'Check passed: stale edits are rejected, both test records were removed, and the game catalog is unchanged.');
      }catch(error){
        status.textContent=error.httpStatus===401
          ?tr('Сеанс администратора закончился. Войди заново.',
              'The admin session ended. Sign in again.')
          :tr('Проверка конфликтов D1 не пройдена: ','D1 conflict check failed: ')+
            error.message;
      }finally{setBusy(false)}
    };
    github.onclick=async()=>{
      if(busy||!githubReady||!publishedSnapshot||!permitMutation())return;
      setBusy(true);
      try{
        const active=await request('/api/admin/catalog/status',{});
        if(active.active!==publishedSnapshot)
          throw Error('Каталог уже обновлён в другой вкладке. Открой его заново.');
        const result=await request('/api/admin/catalog/github-pr',{
          expectedActive:publishedSnapshot});
        if(result.unchanged){
          editorialState(status,'githubNoChanges',
           'Каталог в GitHub уже совпадает с опубликованным. PR не требуется.',
           'The GitHub catalog already matches the published catalog. No PR is needed.');
        }else if(/^https:\/\/github\.com\/bonaqu\/Pandora-Saga-Build-Studio\/pull\/\d+$/.test(result.url||'')){
          status.replaceChildren(reviewCaption('span',{},'githubPrepared'),
            document.createTextNode(' '),
            h('a',{href:result.url,target:'_blank',rel:'noopener noreferrer',
              text:tr('Открыть PR #','Open PR #')+result.number}));
        }else throw Error('Некорректный ответ интеграции GitHub');
      }catch(error){
        status.textContent=error.httpStatus===401
          ? tr('Сеанс администратора завершился. Войди заново.',
              'The admin session ended. Sign in again.')
          : tr('Не удалось создать PR: ','Could not create PR: ')+error.message;
      }finally{setBusy(false)}
      startBackupTracking(publishedSnapshot);
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
        ? tr('Проверить / повторить резерв GitHub',
             'Check / retry GitHub backup')
        : tr('Резерв GitHub недоступен: требуется подключение',
             'GitHub backup unavailable: connection required'));
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
    // Reopening the admin panel restores real status of the active snapshot.
    request('/api/admin/catalog/backup-status',null).then(data=>{
      if(view.isConnected&&data?.snapshot)startBackupTracking(data.snapshot);
    }).catch(()=>{});
  }


  // Read-only. Each JSON value must match the reviewed selection, not merely
  // a version header, count, or two of the game's seventeen datasets.
  async function verifyPublishedSnapshot(apiBase,snapshot,expected,fetcher=fetch,lang='ru'){
    const tr=(ru,en)=>lang==='en'?en:ru;
    const files=root.PandoraCatalogImport?.files;
    const review=root.PandoraOSCatalogReview;
    const safety=root.PandoraCatalogSafety;
    if(!Array.isArray(files)||!files.length||
       !review?.strictEqual||!safety?.check)
      throw Error(tr('Не подключены модули проверки каталога','Catalog verification modules are unavailable'));
    const received={},queue=[...files];
    async function read(name){
      const alias=name==='strings.en'?'stringsEn':name;
      const response=await fetcher(apiBase+'/api/catalog/'+alias+'.json',{
        cache:'no-store',signal:AbortSignal.timeout(15000)
      });
      if(!response.ok||response.headers.get('x-ps-catalog')!=='d1'||
         response.headers.get('x-ps-catalog-snapshot')!==snapshot)
        throw Error(tr('Не подтверждена версия D1: ','Published D1 revision not verified: ')+name);
      const data=await response.json();
      if(!review.strictEqual(data,expected?.[name]))
        throw Error(tr('Опубликованный раздел отличается от выбранного: ','Published dataset differs from selection: ')+name);
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
    if(!check.ok)throw Error(tr('Базовые расчёты после обновления: ','Base calculations after publication: ')+check.issues.join(' · '));
    return {...check,verifiedDatasets:files.length};
  }

  root.PandoraOSCatalogWorkbench=Object.freeze({open,verifyPublishedSnapshot,statusForSelection,createReviewActionQueue});
})(typeof window === 'undefined' ? globalThis : window);
