(function(root){
'use strict';
// Exact-match English counterparts for RU-only owner edits observed in the
// publicly served D1 override snapshot on 2026-11-07. These are approved
// content translations, not a general-purpose machine translator.
// Never overwrite an explicit EN field or translate a later different RU text.
const curated=Object.freeze({
  "guideedit.book.equipment.wearable-by": {
    "title": "Экипировка · кому подходит",
    "fields": {
      "ru": {
        "ru": "Кому подходит",
        "enField": "en",
        "en": "Who can equip"
      }
    }
  },
  "guideedit.book.origin.heading": {
    "title": "Происхождение · заголовок",
    "fields": {
      "ru": {
        "ru": "Происхождение героя",
        "enField": "en",
        "en": "Hero origin"
      }
    }
  },
  "guideedit.book.origin.level-heading": {
    "title": "Происхождение · уровень",
    "fields": {
      "ru": {
        "ru": "Уровень персонажа",
        "enField": "en",
        "en": "Character level"
      }
    }
  },
  "guideedit.book.origin.progress-heading": {
    "title": "Происхождение · развитие",
    "fields": {
      "ru": {
        "ru": "Развитие персонажа",
        "enField": "en",
        "en": "Character progression"
      }
    }
  },
  "guideedit.book.origin.race-choose": {
    "title": "Происхождение · выбор",
    "fields": {
      "ru": {
        "ru": "Выбрать",
        "enField": "en",
        "en": "Select"
      }
    }
  },
  "guideedit.wiki.labels": {
    "title": "Названия разделов энциклопедии",
    "fields": {
      "honor_monthly_ru": {
        "ru": "Ежемесячные ранги",
        "enField": "honor_monthly_en",
        "en": "Monthly ranks"
      },
      "skill_filter_unknown_ru": {
        "ru": "Неуточнённые",
        "enField": "skill_filter_unknown_en",
        "en": "Unresolved"
      }
    }
  },
  "guideedit.honor.overview": {
    "title": "Честь · описание системы",
    "fields": {
      "overviewRu": {
        "ru": "Честь — PvP-ресурс.\nЗаработать честь можно за убийства в PvP-локациях и участие в войнах.\n\nРазделяется на:\n1. «Честь» — расходуемый ресурс очков чести;\n2. «Вся честь» — общий зарабатываемый запас очков чести для повышения рангов и рейтинга.",
        "enField": "overviewEn",
        "en": "Honor is a PvP resource.\nEarn Honor by defeating enemy players in PvP locations and participating in wars.\n\nThere are two types:\n1. “Honor” — spendable Honor points;\n2. “Total Honor” — the cumulative Honor earned for ranks and rankings."
      },
      "lossRu": {
        "ru": "Честь может уменьшаться после гибели от вражеского игрока, а также при смерти от монстра, если потеря опыта превышает накопленный опыт уровня.",
        "enField": "lossEn",
        "en": "Honor may decrease when defeated by an enemy player or killed by a monster if the experience lost exceeds the experience accumulated toward your current level."
      },
      "ranksRu": {
        "ru": "Повышение ранга требует ресурс «Вся честь» и игровое золото.\nНекоторые ранги выдаются по результатам прошлого месяца и действуют один месяц.",
        "enField": "ranksEn",
        "en": "Rank advancement requires Total Honor and in-game gold.\nSome ranks are awarded based on the previous month's results and last for one month."
      },
      "gainRu": {
        "ru": "Очки чести можно получить за убийство игроков вражеских наций в PvP-локациях и за участие в войнах.",
        "enField": "gainEn",
        "en": "Earn Honor by defeating players of opposing nations in PvP locations and participating in wars."
      },
      "monthlyNoteRu": {
        "ru": "Обладатели рангов Герцог, Кронпринц и Эрцгерцог в каждой нации определяются 1-го числа по результатам прошлого месяца.\n\nРанг действует месяц и не продлевается, если в следующем месяце не выполнены условия для его получения. \nВ случае, если ранг пропадает, то пропадает и плащ из инвентаря, который выдавался в награду за этот ранг.",
        "enField": "monthlyNoteEn",
        "en": "Duke, Crown Prince and Archduke ranks in each nation are assigned on the first day of each month based on the previous month's results.\n\nThe rank lasts for one month and is not renewed unless its requirements are met the following month.\nIf the rank expires, the reward cloak is also removed from the inventory."
      }
    }
  },
  "guideedit.honor.rank.0": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: Отсутствуют.",
        "enField": "benefitEn",
        "en": "Rank privileges: None."
      }
    }
  },
  "guideedit.honor.rank.1": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: Возможность создать гильдию.",
        "enField": "benefitEn",
        "en": "Rank privileges: Ability to create a guild."
      }
    }
  },
  "guideedit.honor.rank.2": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: Скидка 10% в магазинах.",
        "enField": "benefitEn",
        "en": "Rank privileges: 10% discount in shops."
      }
    }
  },
  "guideedit.honor.rank.3": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: Расширение инвентаря.",
        "enField": "benefitEn",
        "en": "Rank privileges: Increased inventory capacity."
      }
    }
  },
  "guideedit.honor.rank.4": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: Обмен чести на особые предметы.",
        "enField": "benefitEn",
        "en": "Rank privileges: Exchange Honor for special items."
      }
    }
  },
  "guideedit.honor.rank.5": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: Расширение инвентаря.",
        "enField": "benefitEn",
        "en": "Rank privileges: Increased inventory capacity."
      }
    }
  },
  "guideedit.honor.rank.6": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: Обмен чести на более ценные предметы.",
        "enField": "benefitEn",
        "en": "Rank privileges: Exchange Honor for more valuable items."
      }
    }
  },
  "guideedit.honor.rank.7": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: Расширение инвентаря и выбор пассивного умения (Луна).",
        "enField": "benefitEn",
        "en": "Rank privileges: Increased inventory capacity and choice of a passive skill (Luna)."
      }
    }
  },
  "guideedit.honor.rank.8": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: Новые предметы в обменнике предметов за честь.",
        "enField": "benefitEn",
        "en": "Rank privileges: New items available from the Honor item exchange."
      }
    }
  },
  "guideedit.honor.rank.9": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: На месяц: плащ победителя своей нации.",
        "enField": "benefitEn",
        "en": "Rank privileges: For one month, a Victor's Cloak of your nation."
      }
    }
  },
  "guideedit.honor.rank.10": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: На месяц: плащ монарха своей нации.",
        "enField": "benefitEn",
        "en": "Rank privileges: For one month, a Monarch's Cloak of your nation."
      }
    }
  },
  "guideedit.honor.rank.11": {
    "title": "Честь · привилегия ранга",
    "fields": {
      "benefitRu": {
        "ru": "Привилегии ранга: На месяц: плащ императора своей нации.",
        "enField": "benefitEn",
        "en": "Rank privileges: For one month, an Emperor's Cloak of your nation."
      }
    }
  }
});
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
function pending(values={}){
 const output=[];
 for(const [key,entry] of Object.entries(curated)){
  const before=values?.[key];
  if(typeof before!=='string')continue;
  let patch;try{patch=JSON.parse(before)}catch{continue}
  if(!plain(patch))continue;
  const fields=[],next={...patch};
  for(const [ruField,translation] of Object.entries(entry.fields)){
   const {ru,enField,en}=translation;
   if(patch[ruField]!==ru||typeof patch[enField]==='string'&&patch[enField].trim())continue;
   next[enField]=en;
   fields.push({ruField,enField,ru,en});
  }
  if(fields.length)output.push({key,title:entry.title,before,value:JSON.stringify(next),fields});
 }
 return output;
}
function view(values={}){
 const changes=pending(values);
 if(!changes.length)return values;
 const copy={...values};
 for(const edit of changes)copy[edit.key]=edit.value;
 return copy;
}
root.PandoraOwnerBilingual=Object.freeze({pending,view,curated});
})(typeof window==='undefined'?globalThis:window);
