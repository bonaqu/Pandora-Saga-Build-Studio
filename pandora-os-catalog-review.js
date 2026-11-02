(function (root) {
  'use strict';

  // A review changes records, never live D1 rows. The active snapshot stays
  // untouched until the separate authenticated publish transaction succeeds.
  const atomicDatasets = new Set(['instances', 'trades', 'tables', 'expertise', 'chests']);
  const labels = Object.freeze({
    classes: 'Классы', skills: 'Умения', items: 'Предметы',
    souls: 'Души', monsters: 'Монстры', drops: 'Добыча',
    maps: 'Карты', instances: 'Подземелья', racialPassives: 'Расовые способности',
    itemForth: 'Усиления предметов', unison: 'Комплекты',
    trades: 'Обмены NPC', tables: 'Игровые формулы',
    expertise: 'Мастерство', chests: 'Сундуки', 'strings.en': 'Английский перевод'
  });
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const plain = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));

  function stable(value) {
    if (Array.isArray(value)) return value.map(stable);
    if (plain(value)) {
      return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
    }
    return value;
  }
  const equal = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));
  const id = (dataset, key) => dataset + '\u0000' + key;

  function entries(dataset, value) {
    if (atomicDatasets.has(dataset)) return {'@dataset': value};
    if (dataset === 'strings.en') {
      const result = {};
      for (const [section, group] of Object.entries(value || {})) {
        if (section === 'locale') continue;
        if (!plain(group)) {
          result[section] = group;
          continue;
        }
        for (const [key, row] of Object.entries(group)) result[section + '/' + key] = row;
      }
      return result;
    }
    return plain(value) ? value : {};
  }

  function changes(dataset, previous, current) {
    if (dataset === 'meta') return [];
    const oldRecords = entries(dataset, previous);
    const newRecords = entries(dataset, current);
    const result = [];
    for (const key of new Set([...Object.keys(oldRecords), ...Object.keys(newRecords)])) {
      if (equal(oldRecords[key], newRecords[key])) continue;
      const kind = !Object.hasOwn(oldRecords, key) ? 'added' :
        !Object.hasOwn(newRecords, key) ? 'removed' : 'changed';
      const value = newRecords[key] ?? oldRecords[key];
      const title = value?.name?.ru || value?.name || value?.n || value?.title || key;
      result.push({dataset, key, id: id(dataset, key), kind,
        title: typeof title === 'string' ? title : key,
        before: oldRecords[key], after: newRecords[key]});
    }
    return result;
  }

  function count(dataset, value) {
    if (dataset === 'instances') return Array.isArray(value) ? value.length : 0;
    if (dataset === 'trades') return Array.isArray(value?.trades) ? value.trades.length : 0;
    return plain(value) ? Object.keys(value).length : 0;
  }

  function putRecord(snapshot, change) {
    const {dataset, key, after} = change;
    if (atomicDatasets.has(dataset)) {
      snapshot[dataset] = clone(after);
    } else if (dataset === 'strings.en') {
      const [section, ...rest] = key.split('/');
      if (!rest.length) {
        if (after === undefined) delete snapshot[dataset][section];
        else snapshot[dataset][section] = clone(after);
      } else {
        const entryKey = rest.join('/');
        if (!plain(snapshot[dataset][section])) snapshot[dataset][section] = {};
        if (after === undefined) delete snapshot[dataset][section][entryKey];
        else snapshot[dataset][section][entryKey] = clone(after);
      }
    } else {
      if (after === undefined) delete snapshot[dataset][key];
      else snapshot[dataset][key] = clone(after);
    }
  }

  function compose(previous, current, accepted, sourceFiles) {
    if (!plain(previous?.meta) || !plain(current?.meta) || !Array.isArray(sourceFiles)) {
      throw Error('Incomplete OS catalog sources');
    }
    if (previous['strings.en']?.locale !== 'en' || current['strings.en']?.locale !== 'en') {
      throw Error('Invalid English locale');
    }
    const output = clone(previous);
    for (const dataset of sourceFiles) {
      if (dataset === 'meta') continue;
      if (!Object.hasOwn(previous, dataset) || !Object.hasOwn(current, dataset)) {
        throw Error('Missing reviewed dataset: ' + dataset);
      }
      for (const change of changes(dataset, previous[dataset], current[dataset])) {
        if (accepted.has(change.id)) putRecord(output, change);
      }
    }
    // Official CSV hashes describe a WHOLE OS export, not a curated mixture.
    // Never falsely claim server parity for partially accepted updates.
    const identicalToSource = sourceFiles.filter(name => name !== 'meta')
      .every(name => equal(output[name], current[name]));
    output.meta = clone(identicalToSource ? current.meta : previous.meta);
    if (!identicalToSource) {
      delete output.meta.sha;
      output.meta.curated = true;
    }
    output.meta.counts = {...output.meta.counts};
    for (const dataset of sourceFiles) {
      if (dataset === 'meta' || dataset === 'strings.en' ||
          dataset === 'tables' || dataset === 'expertise' || dataset === 'chests') continue;
      output.meta.counts[dataset] = count(dataset, output[dataset]);
    }
    output.meta.localeCounts = {...output.meta.localeCounts,
      en: {...output.meta.localeCounts?.en}};
    for (const section of ['items', 'skills', 'monsters', 'souls', 'classes']) {
      output.meta.localeCounts.en[section] =
        Object.keys(output['strings.en'][section] || {}).length;
    }
    return output;
  }

  root.PandoraOSCatalogReview = Object.freeze({
    atomicDatasets, labels, id, changes, compose
  });
})(typeof window === 'undefined' ? globalThis : window);
