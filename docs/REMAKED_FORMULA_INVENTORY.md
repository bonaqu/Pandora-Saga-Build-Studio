# Pandora Saga Remaked — полная матрица ветвей расчёта

Источники: [`js/calc.js` (Remaked)](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/js/calc.js), исходная ветка `bonaqu_projects`, SHA дерева `3b79ddba89244b7afa038a87325214feaad6f431`; [Build Studio `os-calculator.js`](../os-calculator.js), [книга героя](../stage-attributes.js).

Всего исходных операторов `case`: **178**; уникальных имён: **143**. Дубликаты — разные ветви или групповые случаи старого интерфейса, поэтому они сохранены в колонке строк.

**Принцип аудита:** `BASE/PREVIEW` означает, что известна базовая или обособленная формула, но НЕ гарантирует, что все баффы и эффекты подключены. `PARTIAL` — реализована хотя бы часть вычисления и отображения; `BUFF PREVIEW` — значение из оригинальной формулы рассчитывается для просмотра, но не применяется само по себе, пока не подтверждены эффект, доступность и активация на OS. `NOT YET PORTED` — полноценной отдельной формулы в Build Studio нет. Эта таблица — инвентаризация, не заявление о полной игровой эквивалентности.

## Результат аудита

- **BASE/PREVIEW:** 15 уникальных ключей
- **PARTIAL:** 77 уникальных ключей
- **NOT YET PORTED:** 41 уникальный ключ
- **BUFF PREVIEW:** 10 уникальных ключей

### Приоритет завершения

1. Оружие/экипировка и души: полные плоские и процентные эффекты, усиления, вложенные условия, наборы, два типа самоцветов и все исключения.
2. Боевое ядро: атака, защита, магическая атака, точность, уклонение, крит, скорости, дальность и условия попадания.
3. Персонаж и бой: все пассивные и активные навыки по ID, изучение, требования, проки, состояниe верхом и временныe эффекты.
4. Сопротивления, дебаффы, шанс наложения и отражение, эффекты по типу цели, урон ауры, естественное восстановление.
5. Лечение и эффекты всех зелий/умений, честь, гильдии, расовые пассивки, уровни навыков; прямое сравнение со свежими правилами OS.
6. Проверить на тестовых векторах каждую ветвь, связанный пользовательский ввод, сохранение билда, мобильный интерфейс и живой сервер.

## Все ветви исходного калькулятора

| Ключ Remaked | Исходный комментарий | Строки `calc.js` | Состояние переноса |
|---|---|---|---|
| `STA` | [  0] 体力 | 7, 31 | BASE/PREVIEW |
| `STR` | [  1] 筋力 | 10, 32 | BASE/PREVIEW |
| `AGI` | [  2] 敏捷 | 14, 33 | BASE/PREVIEW |
| `DEX` | [  3] 器用 | 18, 34 | BASE/PREVIEW |
| `SPR` | [  4] 霊感 | 21, 35 | BASE/PREVIEW |
| `INT` | [  5] 知性 | 25, 36 | BASE/PREVIEW |
| `LP` | [  6] LP | 49 | BASE/PREVIEW |
| `MP` | [  7] MP | 70 | BASE/PREVIEW |
| `POT` | [  8] ポーション回復量 | 90 | BASE/PREVIEW |
| `LPSkill` | [ 11] LP回復スキル効果量 | 103 | BASE/PREVIEW |
| `ATK` | [ 18] 攻/最大 | 113 | PARTIAL |
| `ATKFront` | [ 19] 正面からの攻撃力＋ | 186 | PARTIAL |
| `ATKBack` | [ 20] 背後からの攻撃力＋ | 194 | PARTIAL |
| `RangeMelee` | [ 40] 近接武器の射程 | 202 | PARTIAL |
| `RangeRange` | [ 41] 遠距離武器の射程 | 216 | PARTIAL |
| `MATK` | [ 42] 魔法攻撃力 | 224 | PARTIAL |
| `DEF` | [ 49] 防御力 | 270 | PARTIAL |
| `RESFront` | [ 50] 正面からの物理ダメージ | 289 | PARTIAL |
| `RESBack` | [ 51] 背後からの物理ダメージ | 296 | PARTIAL |
| `RESPhyDAM` | [ 52] 被物理ダメージ | 303 | PARTIAL |
| `RESMagDAM` | [ 60] 被魔法ダメージ | 321 | PARTIAL |
| `ACC` | [ 62] 命中                           [ 63] 正面から攻撃した時の命中 [ 64] 背後から攻撃した時の命中 | 336 | PARTIAL |
| `Dodge` | [ 65] 回避 | 369 | PARTIAL |
| `EVAMelee` | [ 66] 近接物理攻撃回避率 | 413 | PARTIAL |
| `EVARange` | [ 67] 遠距離攻撃回避率 | 421 | PARTIAL |
| `EVAMagic` | [ 68] 魔法攻撃回避率 | 430 | PARTIAL |
| `Cri` | [ 69] クリティカル発生率 | 439 | PARTIAL |
| `CriRES` | [ 70] 被クリティカル発生率 | 451 | PARTIAL |
| `CriDAM` | [ 71] クリティカルダメージ | 459 | PARTIAL |
| `CriDAMRES` | [ 72] 被クリティカルダメージ軽減率 | 467 | PARTIAL |
| `ATKSPD` | [ 73] 攻撃速度 | 476 | PARTIAL |
| `MoveSPD` | [ 74] 移動速度                       [ 75] 街での移動速度 | 499 | PARTIAL |
| `ReduceMP` | [ 76] 消費MP | 513 | PARTIAL |
| `CastSPD` | [ 77] 詠唱速度                       [ 78] 詠唱時間 | 522 | PARTIAL |
| `Cooldown` | [ 79] 再使用時間 | 539 | PARTIAL |
| `RelHorse` | [ 81] 騎乗時のステータス開放率 | 555 | PARTIAL |
| `RESFire` | [138] 火炎耐性 | 568, 635 | PARTIAL |
| `RESIce` | [139] 冷気耐性 | 576, 636 | PARTIAL |
| `RESLightning` | [140] 電撃耐性 | 584, 637 | PARTIAL |
| `RESPoison` | [141] 毒耐性                         [169] 毒の耐性段階 | 592, 638 | PARTIAL |
| `RESCharm` | [142] 魅了耐性 | 597, 639 | PARTIAL |
| `RESLight` | [143] 光耐性 | 604, 640 | PARTIAL |
| `RESDark` | [144] 闇耐性 | 609, 641 | PARTIAL |
| `RESMagic` | [145] 魔術耐性 | 616, 642 | PARTIAL |
| `RESPDebuff` | [146] 身体的異常耐性 | 622, 643 | PARTIAL |
| `RESMDebuff` | [147] 精神的異常耐性 | 628, 644 | PARTIAL |
| `WeaDAM` | [ 21] 武器による物理ダメージ | 668 | PARTIAL |
| `DAMAnimal` | [ 22] 動物類へのダメージ | 679 | NOT YET PORTED |
| `DAMInsect` | [ 23] 昆虫類へのダメージ | 686 | NOT YET PORTED |
| `DAMReptilian` | [ 24] 爬虫類へのダメージ | 693 | NOT YET PORTED |
| `DAMDevil` | [ 25] 悪魔系へのダメージ | 700 | NOT YET PORTED |
| `DAMImmortal` | [ 26] 不死系へのダメージ | 707 | NOT YET PORTED |
| `DAMGhost` | [ 27] 幽霊系へのダメージ | 714 | NOT YET PORTED |
| `DAMInanimate` | [ 28] 無生物へのダメージ | 721 | NOT YET PORTED |
| `DAMRiding` | [ 29] 騎乗キャラクターへのダメージ | 728 | NOT YET PORTED |
| `DAMKD` | [ 30] 転倒中の相手に対するダメージ | 735 | NOT YET PORTED |
| `DAMOBJ` | [ 31] オブジェクトへのダメージ | 742 | NOT YET PORTED |
| `DAMMP` | [ 32] MPダメージ量 | 749 | NOT YET PORTED |
| `DAMAura` | [ 33] オーラダメージ | 756 | PARTIAL |
| `DAMFire` | [ 34] 火炎オーラダメージ | 757 | PARTIAL |
| `DAMIce` | [ 35] 冷気オーラダメージ | 758 | PARTIAL |
| `DAMLightning` | [ 36] 電撃オーラダメージ | 759 | PARTIAL |
| `DAMPoison` | [ 37] 毒オーラダメージ | 760 | PARTIAL |
| `DAMLight` | [ 38] 光オーラダメージ | 761 | PARTIAL |
| `DAMDark` | [ 39] 闇オーラダメージ | 762 | PARTIAL |
| `MATKFire` | [ 43] 火炎属性魔法攻撃力＋ | 832, 915 | PARTIAL |
| `MATKIce` | [ 44] 冷気属性魔法攻撃力＋ | 836, 916 | PARTIAL |
| `MATKLightning` | [ 45] 電撃属性魔法攻撃力＋ | 840, 917 | PARTIAL |
| `MATKPoison` | [ 46] 毒属性魔法攻撃力＋ | 844, 918 | PARTIAL |
| `MATKLight` | [ 47] 光属性魔法攻撃力＋ | 847, 919 | PARTIAL |
| `MATKDark` | [ 48] 闇属性魔法攻撃力＋ | 850, 920 | PARTIAL |
| `Gdebuff` | [ 80] 与debuff持続時間 | 853 | PARTIAL |
| `RatePurler` | [ 85] 落馬発生確率 | 860 | NOT YET PORTED |
| `RateKB` | [ 86] ノックバック発生確率 | 867 | NOT YET PORTED |
| `RateBurn` | [ 89] 火傷発生確率 (弱)              [ 90] 火傷発生確率 (強) | 874, 926 | NOT YET PORTED |
| `RateStun` | [ 91] 気絶発生確率 (弱)              [ 92] 気絶発生確率 (強) | 877, 927 | NOT YET PORTED |
| `RateFrozen` | [ 93] 凍傷発生確率 (弱)              [ 94] 凍傷発生確率 (強) | 880, 928 | NOT YET PORTED |
| `RateKD` | [ 95] 転倒発生確率 (弱)              [ 96] 転倒発生確率 (強) | 883, 929 | NOT YET PORTED |
| `RatePoison` | [ 97] 毒発生確率 (弱)                [ 98] 毒発生確率 (強) | 886, 930 | NOT YET PORTED |
| `RateBleeding` | [ 99] 出血発生確率 (弱)              [100] 出血発生確率 (強) | 889, 931 | NOT YET PORTED |
| `RateSleep` | [103] 睡眠発生確率 (弱)              [104] 睡眠発生確率 (強) | 892, 932 | NOT YET PORTED |
| `RateMad` | [105] 乱心発生確率 (弱)              [106] 乱心発生確率 (強) | 895, 933 | NOT YET PORTED |
| `RateSilence` | [107] 沈黙発生確率 (弱)              [108] 沈黙発生確率 (強) | 898, 934 | NOT YET PORTED |
| `RateWeak` | [109] 衰弱発生確率 (弱)              [110] 衰弱発生確率 (強) | 901, 935 | NOT YET PORTED |
| `RateLP` | [119] 最大LP減少発生確率 (弱)        [120] 最大LP減少発生確率 (強) | 904, 936 | NOT YET PORTED |
| `RateDEF` | [123] 防御力低下発生確率 (弱)        [124] 防御力低下発生確率 (強) | 907, 937 | NOT YET PORTED |
| `RateSlowMove` | [129] 移動速度減少発生確率 (弱)      [130] 移動速度減少発生確率 (強) | 910, 938 | NOT YET PORTED |
| `LPRecSPD` | [  9] LP自然回復速度 | 958 | PARTIAL |
| `MPRecSPD` | [ 10] MP自然回復速度 | 972 | PARTIAL |
| `LPRec` | [ 12] LP自然回復量                   [ 14] 座っている時のLP回復量 | 987 | PARTIAL |
| `MPRec` | [ 13] MP自然回復量                   [ 15] 座っている時のMP回復量 | 998 | PARTIAL |
| `LPsec` | [ 16] 2秒毎のLP回復量 | 1009 | NOT YET PORTED |
| `MPsec` | [ 17] 2秒毎のMP回復量 | 1018 | NOT YET PORTED |
| `RESAnimal` | [ 53] 動物類からの物理ダメージ軽減率 | 1026 | PARTIAL |
| `RESInsect` | [ 54] 昆虫類からの物理ダメージ軽減率 | 1033 | NOT YET PORTED |
| `RESReptilian` | [ 55] 爬虫類からの物理ダメージ軽減率 | 1040 | PARTIAL |
| `RESDevil` | [ 56] 悪魔系からの物理ダメージ軽減率 | 1047 | PARTIAL |
| `RESImmortal` | [ 57] 不死系からの物理ダメージ軽減率 | 1054 | PARTIAL |
| `RESGhost` | [ 58] 幽霊系からの物理ダメージ軽減率 | 1061 | PARTIAL |
| `RESInanimate` | [ 59] 無生物からの物理ダメージ軽減率 | 1068 | NOT YET PORTED |
| `DAMCut` | [ 61] ダメージカット | 1075 | NOT YET PORTED |
| `EXP` | [ 82] 獲得EXP＋ | 1083 | PARTIAL |
| `SkillEXP` | [ 83] 熟練度増加量 | 1090 | NOT YET PORTED |
| `Blocking` | [133] ブロッキング解除耐性 | 1097 | PARTIAL |
| `RESCast` | [134] 詠唱妨害耐性 | 1104 | PARTIAL |
| `Reflection` | [135] 近接物理ダメージ反射率 | 1114 | PARTIAL |
| `DReflect` | [136] Debuff反射確率 | 1121 | NOT YET PORTED |
| `RESDAura` | [137] 闇オーラの反動ダメージ | 1128 | NOT YET PORTED |
| `RESBurn` | [148] 火傷耐性                       [163] 火傷の耐性段階 | 1136 | PARTIAL |
| `RESStun` | [149] 気絶耐性                       [164] 気絶の耐性段階 | 1144 | PARTIAL |
| `RESFrozen` | [150] 凍傷耐性                       [165] 凍傷の耐性段階 | 1152 | PARTIAL |
| `RESKD` | [151] 転倒耐性                       [166] 転倒の耐性段階 | 1161 | PARTIAL |
| `RESPurler` | [152] 落馬耐性                       [167] 落馬の耐性段階 | 1170 | NOT YET PORTED |
| `RESKB` | [153] ノックバック耐性               [168] ノックバックの耐性段階 | 1177 | PARTIAL |
| `RESBleeding` | [154] 出血耐性                       [170] 出血の耐性段階 | 1184 | NOT YET PORTED |
| `RESSleep` | [156] 睡眠耐性                       [172] 睡眠の耐性段階 | 1191 | PARTIAL |
| `RESMadness` | [157] 乱心耐性                       [173] 乱心の耐性段階 | 1198 | PARTIAL |
| `RESSilence` | [158] 沈黙耐性                       [174] 沈黙の耐性段階 | 1205 | PARTIAL |
| `RESCurse` | [159] 呪い耐性                       [175] 呪いの耐性段階 | 1212 | PARTIAL |
| `RESWeakening` | [160] 衰弱耐性                       [176] 衰弱の耐性段階 | 1219 | NOT YET PORTED |
| `RESDisease` | [161] 病気耐性                       [177] 病気の耐性段階 | 1226 | PARTIAL |
| `RESDebuff` | [162] 被Debuff持続時間 | 1233 | PARTIAL |
| `FirstAid` | ファーストエイド | 1253 | BASE/PREVIEW |
| `Heal` | ヒール | 1259 | BASE/PREVIEW |
| `Regenerate` | リクライム | 1265 | NOT YET PORTED |
| `HealingAura` | ヒールスウェル | 1268 | BASE/PREVIEW |
| `Sanctuary` | テンプルム | 1274 | BASE/PREVIEW |
| `Restoration` | リストレーション | 1278 | BASE/PREVIEW |
| `RecoveryBelt` | リカバリーベルト | 1281 | NOT YET PORTED |
| `CharityAmulet` | 慈愛のアミュレット | 1285 | NOT YET PORTED |
| `Velox` | グラーティア | 1289 | BUFF PREVIEW |
| `LapisMedio` | ラピスメディオ | 1295 | BUFF PREVIEW |
| `GroupBarrier` | ウィンクルム | 1302 | BUFF PREVIEW |
| `BlessWeapon` | ホーリーウェポン | 1305 | BUFF PREVIEW |
| `Gloom` | グルーミーエフェクト | 1311 | BUFF PREVIEW |
| `Enchantment` | エンハンスエンチャント | 1317 | BUFF PREVIEW |
| `MinstrelSong` | 詩人の歌 | 1326 | BUFF PREVIEW |
| `PeacefulHymn` | 平和の歌 | 1333 | NOT YET PORTED |
| `SageSong` | 魔力の歌 | 1337 | BUFF PREVIEW |
| `Toxify` | フォックスグローブ | 1346 | BUFF PREVIEW |
| `ToxicAura` | ビルトキシン | 1349 | BUFF PREVIEW |
| `POT_A` |  | 1358 | PARTIAL |
| `POT_B` |  | 1370 | PARTIAL |

Числа в этой таблице означают лишь **наличие** или **стадию переноса исходных формул**, а не эквивалентность текущему OS. Если документированные правила OS отличаются от Remaked, требуется отдельный тест и принудительное использование правил OS; если не отличаются — сохраняется логика Remaked.


### 0.127.0 · RelHorse

Из `js/calc.js:555–566` перенесены проверяемые части: профессия (Dragoon/Paladin 50, Predator 30, Calamity 40, остальные 10), зелёное врождённое/освоенное мастерство верховой езды и +10 от Honor 7. Бонусы `EquipOpt[81]` не сопоставлены с текущими OS-предметами и не прибавляются. **PARTIAL** — не утверждение о полной боевой серверной формуле.


## Update 0.136.0 — creature resistance Soul preview

Five original RES branches now show explicit OS `EP_ONDAMAGE_FDS_RACE` values by category (animal 502, devil 504, undead 505, reptilian 508, ghost 511). OS golems 512 are displayed separately and **not** presumed equal to Remaked `RESInanimate`; `RESInsect` and `RESInanimate` remain NOT YET PORTED. These are conditional signed source percentages; stacking and final incoming damage are not verified.


## 0.144.0 — сопротивления состояниям

11 ветвей получили статус PARTIAL по структурированным OS эффектам экипировки и душ: огонь/обморожение/падение с бонусами чести, устойчивость к оглушению, отбрасыванию, сну, безумию, молчанию, проклятию, болезни, снижение длительности дебаффов. Умение OS 260007001 «Устойчивость» даёт по +15 к оглушению, обморожению и падению только при валидном доступе и зеленом мастерстве warding не ниже 26. Расовая пассивка 900030001 добавляет +10 к оглушению и падению. Не установлена игровая формула фактической вероятности наложения, а отсутствующие bleed/unseat/weakening не придуманы.


## 0.150.0 — EXP

В Remaked EXP ([82]) суммирует бонусы экипировки. Текущая OS имеет подтверждённый код `EP_VOLUME_EXP`; «Плащ новичка» (ID 18073) даёт +5% к получаемому опыту. Build Studio отображает реально экипированный источник в «Книге героя → Эффекты» как отдельную условно учитываемую характеристику. Влияние на финальные награды в игре не заявлено; ветка EXP переведена только в PARTIAL. `SkillEXP` не изменён — исходный эффект не найден.
