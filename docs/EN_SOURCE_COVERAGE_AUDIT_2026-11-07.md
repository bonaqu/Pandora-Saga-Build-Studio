# English source catalog coverage — audit of the bundled OS snapshot (2026-11-07)

This is a **read-only** audit of `data/os/strings.en.json` compared with bundled RU source objects. It does **not** prove production Cloudflare D1 contains the same gaps; the live catalog is authoritative. Do not fill missing translations by machine guesses or by matching unrelated skills.

## Findings in the static snapshot

| Catalog | RU/source entries | Existing EN name records | Missing EN name |
|---|---:|---:|---:|
| Items | 1116 | 1115 | 1 |
| Skills | 569 | 553 | 16 |
| Monsters | 702 | 666 | 36 |
| Souls | 112 | 112 | 0 |
| Classes | 28 | 28 | 0 |

Additional names in other categories are included in the machine report via `npm run locales:audit`.

- Missing item: **Хеллоуинский сундук** (`51060`).
- Missing skills: one `Четверной укол` effect row (`121703511`); eight `Огненный взрыв` variants (`500000047`–`500000054`); two `Баллиста` siege entries (`620002071`–`620002072`); five environment/automatic-battle system entries (`700000021`, `700000023`–`700000026`). **None of these 16 is confirmed to be an ordinary learnable character skill** by the current `learnable`/profession criteria.
- Missing monsters: 14 `Разлом`/`Пустота` entries (`73001`–`73012`, `73100`, `73101`), 22 entries already named with English-style internal tokens such as `Plant`, `FirePlant`, `DreamPoint1`. Do not interpret 36 missing EN fields as 36 necessarily visible untranslated monsters.
- One **existing** skill translation is suspicious: `strings.en.json.skills["700000022"].n` contains **«Запрет на скилы»** (Cyrillic) while its RU source name is **«Безопасная зона»**. This is an inconsistent source record and must be reviewed against authoritative OS data before changing. It is now detectable even though the EN ID itself exists.

## Same-name translation candidates — not automatically applied

Eleven of the sixteen missing skill names have an exact RU-name match with other source records that already contain an EN translation. They are candidates for manual review, **not proof of identical gameplay function**. The suspicious `700000022` Cyrillic name is specifically **not an English donor** even though its RU name matches `700000024`.

When official live D1 translations are fetched, verify first whether its active snapshot still contains those gaps. Do not use a historic local snapshot to overwrite newer live English content.

## Reproducible audit

Run `npm run locales:audit`. The JSON output now separates:

- `missing`, `missingIds` — missing EN fields;
- `suspiciousCyrillicNames`, `suspiciousSamples` — *present* EN fields with Cyrillic text, without claiming an automatic translation;
- `unusedEnglishRecords` — orphan EN IDs;
- `missingTotal` and `suspectEnglishNameTotal` across catalogs.

Use `node scripts/audit-os-localization.mjs --strict` only when deciding whether a fully source-verified English catalog is ready. The normal audit always exits successfully because known source gaps must not block unrelated deploys.

**No game catalog values, localization strings, production D1, item/skill functions or formulas were changed by this audit.**
