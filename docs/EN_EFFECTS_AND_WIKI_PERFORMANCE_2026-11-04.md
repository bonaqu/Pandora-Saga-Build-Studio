# Source audit: English effects, encyclopedia responsiveness, D1 verification

Date: 2026-11-04 · baseline 0.353.0; follow-up 0.354.0

## Scope and provenance

Primary Remaked snapshot: [commit 4e6abf9](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/commit/4e6abf98c914bfa761510f7e2710b1795aab2a3a), with [Legacy English option names](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/4e6abf98c914bfa761510f7e2710b1795aab2a3a/js/option.js), [numeric effect mapping](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/4e6abf98c914bfa761510f7e2710b1795aab2a3a/modern/enhancement-effects.js) and its [current effect additions](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/4e6abf98c914bfa761510f7e2710b1795aab2a3a/scripts/lib/current-effect-conversion.mjs).

Studio's current bundled OS `items.json`, `souls.json` and `itemForth.json` include **101 distinct item-related EP_* function codes**. Every observed code is recorded in `data/localization/remaked-effect-source.v1.json` together with its Studio EN label (if defined), original Remaked English option (if mapped), numeric index and source file. **64** codes can be mapped to the Remaked English results scale. **37** do not have a direct mapping in the inspected Remaked sources and must not be described as officially verified. **Three** of those have no confirmed English label and deliberately retain their identifier in the admin effect editor: `EP_ALL_CRITICAL`, `EP_ONDAMAGE_FDS_RACE`, `EP_RACE_TOUGH_HEART`.

This is a comprehensive **inventory audit**, not proof that every translated English phrase is the exact current OS game-client label. The numeric-to-option relationship itself is primary-source verified; expanded English phrases remain editor-facing wording. Game-server changes since the bundled snapshot are not implied.

## Corrections applied

The inherited UI called several numeric resistance stats “immunity,” implying complete protection. Source options use `RES`. Their English wording is now “resistance.” The most consequential identity corrections are:

| Exact code | Native Remaked EN | Studio EN after audit |
|---|---|---|
| `EP_IMMUNE_CURSE` | Weak RES | Weakness resistance |
| `EP_IMMUNE_EVIL` | Curse RES | Curse resistance |
| `EP_IMMUNE_NUMB` | Frozen RES | Freeze resistance |
| `EP_IMMUNE_RAVING` | Madness RES | Madness resistance |
| `EP_SKILL_DELAY` | Cast SPD | Casting speed |

The other six edited labels and 14 newly added code labels are reflected in the machine-readable registry. Russian existing names, source EP identifiers, values, formulas and D1 rows are not modified by the wording changes.

## Real browser measurements

Run: `npm run test:browser` from a local checkout with Playwright installed, or examine the `Chromium browser smoke` Actions log. The timed script is `tests/browser-encyclopedia-performance.mjs` and measures actual synchronous DOM expansions and search-to-result latency. Three chapters: items, monsters and souls. All external requests are blocked; bundled game data is used to make runs reproducible.

Baseline CI run: [41738640920](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/41738640920), Linux x64, AMD EPYC 7763 (virtual CI runner; **not** the user's own computer). Expanded list sizes: 563 item rows, 514 monster rows, 112 soul rows. Recorded expansion samples (ms):
- Items: 19.4, 26.6, 31.6, 17.9, 19.5.
- Monsters: 9.8, 15.0, 21.5, 24.6, 35.2.
- Souls: 8.9 (one expansion).
Search samples include a deliberately configured 100 ms debounce and must **not** be interpreted as pure search CPU duration. Comparisons across different runners or simultaneous browser tasks are not controlled experiments. For a true end-user-device result, execute the same test on that device.

## Production D1 safety and permissions

The public live checks may verify Pages publication, Worker code capabilities, unauthenticated API rejection, GET availability of all datasets and D1 health. They **do not** prove an authenticated admin's successful production write.

The existing Admin Catalog Workbench already provides **“Проверить запись в D1”** after administrator login: it calls `POST /api/admin/catalog/test-write`. The Worker checks authorization, inserts a unique never-active `qa-` snapshot record, reads that exact record back, deletes it with a scoped query, verifies one deleted row, then reports `readback`, `cleaned` and `activeCatalogUnchanged`. No normal item or user build is touched. The admin can run this test in the authenticated UI. It requires a valid admin session; none was supplied to this audit. The result must not be represented as executed until the authenticated test actually succeeds.

An independent manual-only isolated D1 lifecycle test exists at `.github/workflows/live-d1-ephemeral.yml` for a new disposable *player build/share* identity, but it is **not** a substitute for authenticated admin catalog editing. Do not send an admin password or bearer token through workflow inputs, issue comments or chat.

## Deferred verification

- Confirm the 37 non-mapped EP codes against current OS game-client/localization data before claiming native English terminology.
- Validate an admin edit's real `POST /api/admin/override`, subsequent `GET /api/overrides` and reset only under an authenticated owner-controlled session. A rollback must preserve any existing item overrides.
- Profile CPU/DOM rendering on the owner's actual device and under its network/browser extensions; CI only captures its own virtual machine.


## Follow-up: OS item-description source corroboration

A second pass cross-checked the **37 non-Remaked-mapped codes** against the bundled original OS item effects and bilingual game descriptions. These are **not** 37 newly verified official UI strings: the numeric Remaked mapping still covers 64/101, and the game client has not been examined. Five EN editor-facing labels have direct, auditable semantic support in localized item text (`gameEvidence`, including item ID and exact fragment in `data/os/strings.en.json`):

| Effect code | Game source and literal description fragment | Updated editor label |
|---|---|---|
| `EP_RECOVERY_CURSE` | Tranquilizer `50015` — Cures Weakness, Madness, and Disease. | Remove Weakness |
| `EP_RECOVERY_NUMB` | Hepatica `50023` — Cures Freezing. | Remove Freeze |
| `EP_RECOVERY_RAVING` | Tranquilizer `50015` — Cures Weakness, Madness, and Disease. | Remove Madness |
| `EP_DESTINE_WARDING` | Dawn Veil (Myrine) `11552` — Physical Attack Evasion Chance +3% | Physical attack evasion chance (%) |
| `EP_ELEMENT_DAMAGE_SCALE_FIRE` | Scorching Dagger `1862` — Fire magic attack +1% | Fire magic attack (%) |

For the Fire code, the effect occurs in `data/os/itemForth.json` for the dagger, rather than the base item effects. For the others, the effect code occurs in the same item's `effects`. The assertions in `tests/remaked-english-effect-source.test.mjs` guard the precise relation. Three remaining effects are shown as raw codes because the English text does not establish their semantics. `EP_BOW_CARRY` and `EP_RACE_CARRY` occur alongside distinct range functions; source descriptions support the **range bonus** but do not identify the role of each paired engine function, so no independent carrying-capacity mechanic is claimed as verified. Published D1 or game-client labels are not modified.


Three further editor-facing words were checked against the same OS snapshot: `EP_EXPERTISE_RESET` is **Reset skill points** (Skill Reset Scroll, ID `90034`); `EP_RESTMAP_MOVESPEED_SCALE` is **Town movement speed (%)** (student cloak, ID `18073`); and `EP_HEAL_LIFE_REGENERATOR` is neutrally **Gradual HP change** because the known Cursed Rod, ID `2841`, has a negative periodic effect described as *Gradual HP loss*. Item descriptions support these display explanations, not official byte-for-byte client UI localization. Their independent `gameEvidence` records and tests use the exact item IDs and game-source text.


## Second pass: 10 more original-item corroborations

The source-language audit now has **18 effects with traceable game-item description evidence**: eight from the previous review plus ten newly recorded observations. The ten additional codes are `EP_ABILITY_RESET`, `EP_HEAL_LIFE`, `EP_HEAL_LIFE_RATE`, `EP_HEAL_MANA`, `EP_HEAL_MANA_RATE`, `EP_ONHIT_SKILL_EXEC`, `EP_ONDAMAGE_SKILL_EXEC_ATTACKER`, `EP_RESTART`, `EP_VOLUME_EXP` and `EP_TOHIT_SCALE`. The source registry pins an item ID, the precise English description substring, and an `item-description-only` confidence level for each one. Automated tests verify that the ID and the same effect code occur on the source item.

This **does not** turn those labels into verified exact game-client UI strings, establish proc cooldowns or damage formulas, or override data in production D1. The remaining three effects with no confirmed plain-English name remain raw identifiers. Paired `EP_BOW_CARRY` / `EP_BOW_RANGE` and `EP_RACE_CARRY` / `EP_RACE_RANGE` still require engine-side confirmation: item text alone identifies an attack-range bonus but not why two distinct effect codes appear. No numeric gameplay behavior has been inferred.
