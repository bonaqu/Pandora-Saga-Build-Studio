## Status-resistance UX, D1 and formula boundaries (2026-11-13)
- Current OS `itemForth` is **cumulative by breakpoint** (not an effect only at that exact grade). Look up the highest validated threshold ≤ grade; do not sum snapshots and do not parse historical narrative if a canonical Forth record already exists. Tests must cover +0…+10, including sparse between-threshold examples and known OS item IDs. Preserve canonical ID validation, D1 overrides and item state lifecycle.

- In **Результаты расчёта**, body/mind resistance rows use the existing label tooltip; do **not** reintroduce a large or separate ⓘ warning. Real line breaks only; legacy literal `\\n` must be displayed as newlines, never HTML.
- Defense's body/mind explanation shares the existing `guideedit.book.summary.40/.41` RU/EN D1 records, not independent hardcoded copy. All twelve individual resistances have short `defense.resistStatus:<channel>` RU/EN hints stored through `guideedit.book.*`. Use the unified multiline editor for hints and preserve D1 CAS behavior.
- Item/Soul `EP_IMMUNE_*` and grouped `EP_IMMUNE_VIT_TYPE/SPI_TYPE` are separate inputs. Keep the source-backed honor/racial/Warding contributions isolated; **do not treat group resistance or historical elemental dependencies as a verified individual 2026 OS status-roll formula**. The `verified:false` source limitation stays visible in code/audits until independently supported.
- Preferred RU status is `Немота` / EN `Silence` (not improvised `Молчание`); existing OS label IDs and historical sources take priority over loose translation.

## Canonical game labels and missing translations (2026-11-13, 0.704.0)
- The **same OS skill ID** must render its current RU `data/os/skills.json[id].name` and EN `data/os/strings.en.json.skills[id].n`. Never auto-translate, transliterate, or insert a guessed English alias. Current snapshot: 569 skill IDs, only 553 with official EN; for the other 16, show **canonical RU** until a verified EN entry exists.
- Generic UI captions may share a Russian word with a skill but have another meaning. Examples: section `Восстановление → Recovery` versus skill ID 310022001 `Восстановление → Restoration`; element `Яд → Poison` versus skill 220001001 `Яд → Toxify`; status `Падение → Knockdown` versus skill 500000015 `Падение → Tripped`. Do not globally replace these strings. Route game skill labels through `gameSkillName(id, ...)`, editorial captions through UI translation tables.
- OS-verified EN self/party buff names: `100052001 Яростная атака / Raging Soul`, `260006001 Помощь ветра / Speedy Gale`, `320004001 Благословение ветра / Accelerate`, `320005001 Знак жизни / Divine Aid`; avoid historical convenient names like Rage Attack, Wind Assist, Wind Blessing, Sign of Life. Verify the current ID and source on every future naming change.
- Regression `tests/os-canonical-ui-names-704.test.mjs` checks the 569 skill identities, missing EN fallback and ambiguous UI label pairs. Any new source labels need the same proof.

## Shared priest UI and numerical display (2026-11-12)
- In the external priest section edit SPR (СД), Blessing and Hymn **once each**; do not duplicate caster input fields alongside priest skills. Keep persisted legacy Benevolence/Exorcism values and original requirements intact.
- Only add contextual input fields for allied skills when OS/Remaked source evidence proves an independent caster dependency. Natural Recovery presently has a fixed source effect vector, so no speculative extra field.
- Avoid long internal formula-confidence labels in player-facing descriptions when a numeric source-derived value is available. Record technical provenance and unresolved game mechanics in issues and code; never present a bare coefficient as guaranteed final damage.
- Preserve individually established floor/ceil calculation stages; do not globally replace arithmetic.

## Source-only formula restoration strategy (owner direction, 2026-11-13)
- Do not request, block on or require comparison with the live Pandora Saga game client. Reconstruct as much as possible from the complete Remaked UI source formulas, current Pandora Saga OS source files and published OS/D1 catalogs. Where the sources disagree, preserve the Remaked mathematical stages only when applicable to the OS vector and replace obsolete coefficients with the actual OS parameters.
- For every new effect family, audit **every current OS skill ID**, direction (CASTER/TARGET), mastery/level/class eligibility, root/upgrade prerequisites and FV1/FV2 roles. Use RU/EN from the same OS ID; never infer names. Record unproven stacking, timing, resist rolls and final target calculations separately, but do not turn lack of client testing into a development blocker.
- Formula coverage census MUST inspect actual cross-module models: `scalingSkillPreview`, `healingSpellsPreview` at theoretical levels 45/55, `periodicRecoveryPreview`, `songSkillPreview` and `resistanceSkillChoices`. Preserve unique skill ID counts, `sourceModules`, separate `source-parameter` from `coefficient-model`, and flag enemy TARGET spells as `targetSideOnly`. Theoretical levels are for auditing, not a live server cap.
- Current OS elemental resistance casts (six learnable source IDs): five `ENEMY` spells are **TARGET-side** signed effects, not own passives; `330004001` Providence is a separate `PARTY_ALL` +25 Magic Resistance. Validate *all* recognized resistance EP rows together: zero FV1[0..2], exact 4-value zero FV2, TARGET direction, unique EP/stat; reject the **whole** skill when any row changes. Never silently omit a changed negative penalty. `EP_PROTECTION_*` toggles are separate from `EP_IMMUNE_*` persistent status resistance; source learnability alone does not override class mastery caps.
- Current OS movement source family: nine learnable `EP_MOVESPEED_SCALE` records, including the singular `prereq:0` sentinel for `260003001`. `+200` boost vectors, enemy `-50` and caster toggles `-20` are source **effect parameters**, not a verified final MoveSPD percent or unconditional buff. Only the older `+30` and `+40` additions have a preserved Remaked MoveSPD formula; keep them isolated from unverified stacking.

## OS-skill coefficient staging (2026-11-12)
- Completed *source-scaled effect parameters* may appear as normal compact numeric results (without technical model disclaimers); **they are not automatically final combat target damage, mana consumption or absorption**. Preserve internal modelOnly/uncertain metadata and fail closed on mismatched OS vectors.
- Current source-projected families: `EP_ABSOLUTE_MAGIC`, `EP_MANA_SHIELD`, `EP_CASTINGCANCEL_RESISTANCE_CONST` and `EP_ELEMENT_DAMAGE_SCALE`. Float arithmetic is floored *per attribute/mastery component*, following the supported Remaked coefficient pattern, not by rounding the combined value. Respect FV2 and the source skill variant chain.

## Multi-hit and projectile effects (2026-11-12)
- `EP_DOUBLE_MISSILE` together with `EP_ATTACKRANGE_CONST`/`EP_ATTACKCARRY_CONST`, and `EP_INCREASE_ATTACK`, produce independent source-scaled coefficients. Display them as **parameters**, not final hit damage or true distance. Source vectors, class, weapon and mastery cap must pass before projection. Never merge these channels into base physical ATK without source proof.

## Warding 26 source validation (2026-11-12)
- Passive 260007001 adds +15 TARGET stun/numb/tumble. Its additional CASTER numb is not an extra bonus. Use the same strict FV1/FV2, class and requirement validation in the read-only Skill Effects and applied Defense calculation. No double-counting.

## Purify chain and remaining skill coefficient locale (2026-11-12)
- OS Purify root 310014001 triggers internal 310014002: once the IDs, learnable flags, requirements and FV1/FV2 match, display independent +100 body/mind **source parameters** read-only. Never add them to a character's permanent resistances or invent duration, real cure success, mitigation or target-roll results.
- Both `directStrikeCoefficientPreview` and `elementalSpellCoefficientPreview` must receive the RU `meta.branchLabels` and EN `strings.en.branches` in addition to `scalingSkillPreview`. Never expose raw internal branch keys when approved current OS labels exist.

## Attack reach and plain-language player guidance (2026-11-13, 0.719.0)
- OS `weapon.range` is the weapon base distance; direct item `EP_RACE_RANGE` adds to melee/ranged and `EP_BOW_RANGE` to bow/crossbow. Elf racial passive ID 900020002 is RU «Зоркость» / official EN «Eagle Eye» and adds +500 to bow/crossbow only. The paired `EP_RACE_CARRY` and `EP_BOW_CARRY` are not extra bonuses.
- Show source-derived estimated totals in calculation results and base/gear/race/total separately in Attack. Keep `verified:false`; unverified temporary skill modifiers and full live combat stacking excluded.
- Use readable player-facing explanations without raw effect names, vectors, IDs, or internal system abbreviations.

## Saboteur level-50 trap variant (2026-11-13, 0.720.0)
- Current game class DISTURBANCE is «Загонщик» / Saboteur. Learnable Plant Mine 240002001 triggers 240002050; nonlearnable, class-only, level-50 record 240002002 requires 240002001 and triggers 240002051 while cancelling 240002050. Both cost one item 65007. Enhanced elemental vector [450,100,300,50] differs from basic [350,100,70,50]; knockback vector is unchanged.
- The source alone does NOT confirm when the game switches to the upgraded effect, or the final damage. Strictly validate the second root and its child and show a conditional source explanation only. Do not silently change the normal trap's calculation or its requirements.

## Skill-specific attack reach (2026-11-13, 0.721.0)
- Current OS 213605001 «Точная стрельба» / Sniper Nest belongs to SNIPER «Стрелок» Lv45, weapon BOW/CROSSBOW, TOGGLE; 213703001 «Двойной выстрел» / Arrow Fusillade belongs to PREDATOR «Охотник» Lv50, weapon CROSSBOW, MYSELF. Validate complete ordered source effects including paired ATTACKRANGE and ATTACKCARRY vectors; carry is a mirror, not twice the bonus.
- Only model `FV1[3]+floor(archery*FV1[2]/100)` as the effect coefficient. It is **not** proven final skill range, cannot be added to permanent attack reach, and is not automatically active even when eligibility is met. Report activation and requirements in ordinary RU/EN text.
- Apply source changes to both Skill Effects and Attack consistently and keep the 43-field Summary matrix unchanged.

## Tooltip and owner-editor Escape priority (2026-11-13, 0.721.0)
- An active inline text editor owns Escape. A pending/visible guide tooltip must dismiss itself without intercepting that key; otherwise failed CAS edits cannot be cancelled reliably.
- The isolated Chromium ui-content-inline flow arms a pending tooltip before editor Escape, verifies cancellation and preserves normal tooltip dismissal elsewhere.

## Human-readable skill effect models and range breakdown (2026-11-13, 0.722.0)
- Render individual skill-range terms as source constant and independently floored Ranged mastery contribution, never as automatically applied permanent attack distance or proven full active-skill reach. Use official bilingual mastery name and existing skill icon/hover tooltip in Attack.
- Both range-bearing skills in Skill Effects must pass the same full ordered OS source proof as the Attack skill-range panel. The paired ATTACKCARRY vector must be checked but not listed as a second source of increased range.
- Owner-editable new UI titles/help reuse standard RU/EN D1 guideLabel keys. Player descriptions must never say raw OS/Remaked/FV/EP internals or use unexplained developer coefficient labels; retain exact data and evidence in code and tests.

## Four enemy debuff sources (2026-11-13, 0.723.0)
- Source IDs 440001001 «Немощь» / Weakness, 440007001 «Слабость» / Weaken, 260004001 «Путающая рука» / Tangled Fingers, 440005001 «Мысленный удар» / Psionic Blast are **TARGET-side only**. Validate skill/class/branch/mastery/power stat and complete ordered FV1/FV2 vectors. Original RU and EN names must remain canonical by ID.
- An enemy's final Attack/Defense/Accuracy/MP change, resistance, duration and negative scaling stages are not proven. Show effects only as descriptive source previews with eligibility, never insert them in the hero's own stats or invent final numbers. Treat the different ATTACK and ARMORCLASS CONST/SCALE channels independently and do not sum them as an assured target result.
- Update the cross-module formula-coverage audit and tests whenever new roots become source-modeled; ensure one classification per learnable root.

## Fast, safe verification
1. Identify the affected UI handler and existing related test before coding. Reuse current equipment open/replace/unequip paths instead of duplicating mutations.
2. Fetch related files in batches; make one coherent patch, with a focused Node regression and an isolated Chromium scenario before a PR.
3. If local dependencies are available, run `node --test tests/<affected>.test.mjs` first. For a single browser scenario run `node scripts/dev-server.mjs` and `node tests/browser-smoke.mjs --only=<scenario>`. This mode skips the global desktop baseline and all unrelated flows.
4. On GitHub Actions, `Chromium browser smoke` → **Run workflow** → select the branch and optional `scenario` input. **This is manual diagnostic feedback only.** PR validation still requires the full Node suite and the impact-classified (full for gameplay JS) Chromium suite before merge.
5. When a full browser run fails, inspect the failed job logs for the **first failing scenario**. Repair and run **that scenario** before repeating the full run. Do not trigger full 46+ scenario suites for each one-line test adjustment if the targeted diagnosis is available.
