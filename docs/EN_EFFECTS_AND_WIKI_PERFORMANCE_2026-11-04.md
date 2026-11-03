# Source audit: English effects, encyclopedia responsiveness, D1 verification

Date: 2026-11-04 · Studio 0.353.0

## Scope and provenance

Primary Remaked snapshot: [commit 4e6abf9](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/commit/4e6abf98c914bfa761510f7e2710b1795aab2a3a), with [Legacy English option names](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/4e6abf98c914bfa761510f7e2710b1795aab2a3a/js/option.js), [numeric effect mapping](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/4e6abf98c914bfa761510f7e2710b1795aab2a3a/modern/enhancement-effects.js) and its [current effect additions](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/4e6abf98c914bfa761510f7e2710b1795aab2a3a/scripts/lib/current-effect-conversion.mjs).

Studio's current bundled OS `items.json`, `souls.json` and `itemForth.json` include **101 distinct item-related EP_* function codes**. Every observed code is recorded in `data/localization/remaked-effect-source.v1.json` together with its Studio EN label (if defined), original Remaked English option (if mapped), numeric index and source file. **64** codes can be mapped to the Remaked English results scale. **37** do not have a direct mapping in the inspected Remaked sources and must not be described as officially verified. **Four** of those have no confirmed English label and deliberately retain their identifier in the admin effect editor: `EP_ALL_CRITICAL`, `EP_ELEMENT_DAMAGE_SCALE_FIRE`, `EP_ONDAMAGE_FDS_RACE`, `EP_RACE_TOUGH_HEART`.

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
