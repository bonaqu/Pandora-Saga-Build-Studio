# История релизов · 0.699.0—0.674.0

## 0.699.0 — 2026.11.12.699 · Human-readable live OS zone loot changes and duplicate rule counts

- В проверке игрового каталога показаны конкретные данные из D1 и текущего OS источника: локации, монстры, предметы, строки правил и значения до/после.
- Исправлены повторы: для одной записи с несколькими одинаковыми копиями показывается точное количество до/после вместо «Неоднозначные правила». Живой эталон Мальдии: 257 → 172, убрано 85 правил, 48 уникальных наборов.
- Версия сайта поднята, чтобы открытые админские сеансы получили оповещение об обновлении и браузер заново загрузил JavaScript. Источники игры, D1 и расчёты персонажей не менялись.
- Обязательные Node + Chromium и проверка Pages после публикации.

## 0.698.0 — 2026.11.12.698 · Warding 26 passive source parity

- «Устойчивость» (Уклонение 26): +15 к оглушению, заморозке и падению отображается и в «Эффектах умений», и в «Защите» по одному строго проверенному источнику. CASTER не прибавляет дополнительную устойчивость.
- Точные FV1/FV2, исходная профессия, класс и порог проверяются; 250 синтетических тестов и отказ при повреждении источника.
- Без изменений D1 и сохранённых билдов. Обязательные CI и postmerge readiness.

## 0.697.0 — 2026.11.12.697 · Source coefficients for projectile and follow-up attacks

- Параметры «Двойного выстрела» из 3 отдельных исходных OS-эффектов: коэффициент второго снаряда, дальность и перенос; «Волна» — коэффициент повторного удара от Убийства. Не смешиваются с конечным уроном цели или АТК героя.
- 250 синтетических сценариев СИЛ/мастерства, источник векторов и оружие проверяются отдельно. Никаких изменений сохранений билдов или D1.
- Публикация только после полного Node/Chromium и postmerge Pages/Worker readiness.

## 0.696.0 — 2026.11.12.696 · Four additional source-scaled magical skill parameters

- В Книге героя численно отображаются значения по текущим параметрам OS для «Поглощения стихий», «Магического щита», «По следам ветра» и магической «Сосредоточенности». Сохраняются требования мастерства, профессии, варианты 50-го уровня, фиксация FV2 и округление вниз каждого слагаемого.
- Показываются параметры самих эффектов, а не неподтверждённые величины урона по конкретной цели или расхода ОМ.
- Дополнительные тесты 250 сценариев и искажённых исходников; никаких изменений D1, билдов и снаряжения.
- Публикация после обязательных Node/Chromium и postmerge Pages/Worker readiness.

## 0.695.0 — 2026.11.12.695 · Shared source-derived Skill Effects and selected buffs

- «Хладнокровие» и «Быстрое уклонение» показывают во вкладке «Эффекты умений» те же вычисленные значения, что и применяемые усиления, с округлением по исходникам Remaked/OS.
- Проверка равенства выбранного эффекта и предпросмотра на 250 дополнительных наборах мастерства и ПРВ, с сохранением исходных данных.
- Убрано «≈» из отображения уже рассчитанного периодического восстановления ОЗ/ОМ. Алгоритмы и хранилище билдов не изменялись.
- Обязательные Node/Chromium и публикационные проверки выполняются до объявления релиза.

## 0.694.0 — 2026.11.12.694 · Shared priest profile and concise skill results

- Exactly three shared external priest inputs; no skill-row duplicates. Historical saved masteries and ability gates are preserved.
- Shorter bilingual source-based skill descriptions and Dark Aura floor tier without technical model labels; no changes to mathematical outputs or D1.
- Release acceptance: Node + Chromium, then Pages + Worker/D1 read-only readiness.

## 0.693.0 — 2026.11.12.693 · Dual caster coefficient inputs on priest skill rows: SPR plus Blessing or Hymn mastery

- Dual caster coefficient inputs on priest skill rows: SPR plus Blessing or Hymn mastery. Both controls edit one shared caster profile with no new server formula assumption; responsive single-row UI and browser verification.
- Full Node/Chromium PR acceptance and postmerge Pages/Worker/D1 read-only.

## 0.692.0 — 2026.11.12.692 · Source-validated scalable Cold Blood and Quick Avoidance models replace stale flat plus ten

- Source-validated scalable Cold Blood and Quick Avoidance models replace stale flat plus ten; both model numbers are source validated but live combat parity remains unverified. Full CI + Pages/Worker readiness required.

## 0.691.0 — 2026.11.12.691 · Source-gated priest Exorcism casting requirement and exact model thresholds for Dark Aura SPI

- Source-gated priest Exorcism casting requirement and exact model thresholds for Dark Aura SPI; validates Holy casting branch requirement, preserves older default; Dark Aura models exact future source-coefficient steps without claiming observed server damage.
- Full Node/Chromium and postmerge Pages + Worker D1 read-only checks required.

## 0.690.0 — 2026.11.12.690 · Active priest defense and song bonuses use identical current OS source-gated preview vectors

- Active priest defense and song bonuses use identical current OS source-gated preview vectors. Damage model uncertainty remains explicit; all selections retain source fidelity, with no D1 changes.
- Node/Chromium PR verification and Pages/Worker readiness after merge.

## 0.689.0 — 2026.11.12.689 · Source-gated priest aura enchantment, Peaceful Hymn, Dark Aura, Poison and attack-skill models with caster controls

- Source-gated priest aura enchantment, Peaceful Hymn, Dark Aura, Poison and attack-skill models with caster controls. All new unproven combined magnitudes marked as models (≈) and no direct unconfirmed skill damage applied to actual build stats.
- 250 synthetic rank/SPR cases; mandatory full Node/Chromium and postmerge read-only Worker/D1 readiness.

## 0.688.0 — 2026.11.12.688 · Hero Book default disclosures, inline priest potency, compact guild rows, and equipment portrait return

- Hero Book default disclosures, inline priest potency, compact guild rows, and equipment portrait return. Defense recovery alone and Buffs priest + Skill Effects healing open by default; Attack unchanged. Guild/elemental/honor and all potions initially collapsed. Priest potency is displayed in native skill rows, not duplicate secondary grid.
- Slot navigation exits Hero Book to portrait, panels have consistent scroll-aware widths. Current combat formulas and D1 are not changed.
- Full Node+Chromium PR validation and post-merge Pages/Worker read-only readiness required.

## 0.687.0 — 2026.11.12.687 · Deterministic current OS formula-coverage census of all skills and effect families

- Deterministic current OS formula-coverage census of all skills and effect families; fully read-only and explicitly not a live server formula guarantee.
- Node / PR browser acceptance and live Pages/Worker readiness are required.

## 0.686.0 — 2026.11.12.686 · Source-checked preliminary INT and mastery models for six learnable elemental/dark spells

- Source-checked preliminary INT and mastery models for six learnable elemental/dark spells; read-only hypotheses only. No combat or D1 mutations.
- Full Node/Chromium PR tests and post-merge Pages/Worker readiness.

## 0.685.0 — 2026.11.12.685 · Read-only direct strike coefficient previews for source-backed learnable attack skills

- Read-only direct strike coefficient previews for source-backed learnable attack skills; no target damage, critical combat stage changes, no D1 writes.
- Mandatory Node/Chromium and published Pages/Worker readiness checks.

## 0.684.0 — 2026.11.12.684 · Source-gated OS coefficient models for 11 scalable skills, with separate unverified previews and 250 regression scenarios

- Source-gated OS coefficient models for 11 scalable skills, with separate unverified previews and 250 regression scenarios. Source-only mathematical models are explicitly not confirmed server combat output and never change the character.
- Full Node/Chromium PR verification and post-merge Pages/Worker readiness required.

## 0.683.0 — 2026.11.12.683 · Use current OS source-backed priest magnitudes in every Hero Book support preview

- Use current OS source-backed priest magnitudes in every Hero Book support preview; unverified magnitude rendered as unknown, no combat formula or D1 changes.
- Full Node/Chromium PR validation and Pages/Worker read-only release check required.

## 0.682.0 — 2026.11.12.682 · Independent item navigation and skill tooltip targets in Hero Book consumables

- Independent item navigation and skill tooltip targets in Hero Book consumables.
- Full Node/Chromium PR acceptance and post-merge Pages/Worker checks required.

## 0.681.0 — 2026.11.12.681 · Shared Path skill previews for equipment and Soul procs; legacy Divine Blessing remains independent

- Shared Path skill previews for equipment and Soul procs; legacy Divine Blessing remains independent
- Hero Book Attack/Defense item and Soul on-hit proc skill names now use the existing one-owner Path/Origin rich tooltip, with current OS icon, level/mastery requirements and description (RU/EN). Unknown source IDs remain plain text, never fabricated skill metadata.
- Preserve the 330004001 Divine Blessing alias in pre-existing saved builds when switching between the five mutually exclusive elemental resistance spells; it remains an independent ally effect. Current elemental selections are still exclusive.
- Add regression coverage and browser hover acceptance; no modifications to live damage formulas, account sessions, stored user builds or production D1 data.
- Browser acceptance and deployed Pages readiness must be verified separately.

## 0.680.0 — 2026.11.12.680 · Uniform exclusive elemental resistance buffs, numeric priest and ally summaries, and shared rich skill tooltips

- Uniform exclusive elemental resistance buffs, numeric priest and ally summaries, and shared rich skill tooltips
- Elemental resistance skills are a standalone sibling section directly after Ally Buffs, using the same Book section and checkbox components. The five target spells are mutually exclusive: selecting another clears the previous; both UI and engine reject stacking old multi-choice builds. An older Divine Blessing alias remains independent.
- Skill hover in Book effects, ally/priest buffs and consumable-triggered skill names now calls the existing Hero Path rich tooltip controller. Same original OS icon, canonical bilingual name, skill description, level and branch mastery requirements; one tooltip lifecycle and keyboard handling.
- The priest's SD/Blessing/Hymn inputs now produce source-verified per-cast numerical captions even before enabling the buff. STR/AGI/INT are shown separately; group protection, holy aura and supported song magnitudes use matching current OS vectors and Remaked floor steps. Unknown stacking remains explicitly unverified.
- Existing Remaked/OS fixed source values are shown for Blessed Repose (+90 MP recovery-speed index), Inspiration (cast time 50% of normal), and Natural Recovery (+5 MP per 2 sec); Despair shows confirmed source coefficients and labels its undetermined final character-specific damage. No automatic skill activation or additional unverified combat formula.
- Regression tests cover exclusive resistance rules, OS coefficients, rich tooltip markup, and full Chromium book interactions. No production D1 writes, no build migrations.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.679.0 — 2026.11.12.679 · Source-complete variable self-skill previews and exclusive OS level-50/green-mastery variants

- Source-complete variable self-skill previews and exclusive OS level-50/green-mastery variants
- Add source-gated information-only magnitude rows for Desperation, Double Shot, Wave, Warlock magic Concentration. Skill functions depend on trained mastery/character values but live packet magnitude is not confirmed, so each shows — with an explanation.
- Poison offers exactly one current green-mastery variant (standard at alchemy below 61 or advanced at 61+). Conjurer at level 50 gets newer OS Mana Shield and Follow the Wind variants instead of both standard and 50+ rows.
- Source ID, exact coefficient/fv2 vector, class, level and achievable branch requirements checked. No activation of skills, no new combat/damage numbers, no persisted-build or production D1 changes.
- Four regression tests for class, level, variant selection and forged coefficients.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.678.0 — 2026.11.12.678 · Current-OS Gratia (Velox): source-validated SPI and Blessing coefficient update for active priest buff

- Current-OS Gratia (Velox): source-validated SPI and Blessing coefficient update for active priest buff
- Keeps the Remaked historical floor-per-source calculation but uses current OS 320007001 TARGET [10,0,5,5] for active Gratia, matching the informational Skill Effects preview. Existing legacy formula stays available for archival comparisons only.
- Attack-speed index only; no unsupported packet damage, user-build migration, D1 write or automatic defensive skill activation.
- Regression covers 22 vs historical 20 for caster SPI 134/Blessing 90, disabled/invalid source safeguards, UI display and unchanged ATK.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.677.0 — 2026.11.12.677 · Hero Book Skill Effects: source-audited scaling-only read-only previews; fixed buffs stay in Buffs

- Hero Book Skill Effects: source-audited scaling-only read-only previews; fixed buffs stay in Buffs
- Audited 224 source player skills and 59 TARGET-coefficient candidates; separated fixed/conditional/passive and caster-vs-recipient scaling. Read-only offensive and defensive effect values use current character attributes, trained mastery, source-validated OS coefficients, proven Remaked floor rules and live equipment context — not enabled buff switches.
- Exact values are shown only for source-supported calculations. Unknown mastery-dependent server scaling is explicitly marked unknown; impossible class/branch caps are excluded. Removed static Support-skill rows and passive Incredible Strength from the informational Skill Effects page; unchanged Buffs activation, D1, build saves and permanent combat state.
- Regression suite and detailed audit: docs/HERO_BOOK_SCALING_SKILL_AUDIT_2026-11-12.md.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.676.0 — 2026.11.12.676 · Show applied Lightness and Blessed Repose speed indices in Skill effects and passive recovery

- Show applied Lightness and Blessed Repose speed indices in Skill effects and passive recovery
- A compact shared skill-effect group shows the already calculated +30 movement index and +90 allied MP recovery index, if selected, with current OS skill icons and descriptions.
- The Defense chapter also exposes Blessed Repose as an independent MP speed source alongside the total, without adding it twice or confusing it with MP per tick.
- Three focused regression cases and no formula, D1 or saved-build changes.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.675.0 — 2026.11.12.675 · Hero Book defensive skills now honor equipped shield and weapon eligibility consistently with active combat gates

- Hero Book defensive skills now honor equipped shield and weapon eligibility consistently with active combat gates
- Defensive preview now uses equipped-shield gate for Bastion, same as combat availability; Hero Book forwards actual weapon kind and shield presence from validated equipment.
- Three focused tests cover profession, level, equipped shield, and UI data routing. No combat formulas or existing saved builds changed.
- Browser acceptance and deployed Pages state must be verified separately.

## 0.674.0 — 2026.11.12.674 · Source-gated Lightness, Swift Arrow and Blessed Repose active buffs: OS coefficients, Remaked index channels and regression tests

- Source-gated Lightness, Swift Arrow and Blessed Repose active buffs: OS coefficients, Remaked index channels and regression tests
- Legacy Remaked MoveSPD explicitly adds +30 for Lightness. Swift Arrow uses the existing attack-interval index channel. Blessed Repose uses the OS MP recovery-speed index; game-client stacking remains unverified and no extra MP per tick is invented.
- Four focused test cases cover gating, numeric application and forged source coefficients. Full PR Node and Chromium acceptance remains required.
- Browser acceptance and deployed Pages state must be verified separately.
