# Pandora Saga Build Studio — reusable UI and state contracts

## Equipment choices and previews

The same `PandoraStageItemUI.attachPreview` controller is used on:
- equipped character-portrait slots;
- every visible candidate row in the in-portrait equipment picker (weapon, shield,
  helm, armor, gloves, pants, boots, cloak, two rings, amulet, belt, two earrings);
- compatible Souls, including socket buttons and Soul results.

Pointer hover uses the established 650 ms dwell; keyboard focus shows the same
rich tooltip immediately. Previewing never equips an item, changes a build, nor
mutates Cloudflare D1. Native `title` tooltips are suppressed to prevent double bubbles.

## One-piece outfits that occupy armor and pants

Only source-backed pieces qualify. `PandoraUIPlanner.occupiesBodyAndLegs(record)`
currently recognizes the known Astir dress IDs 12611–12618 (body category), or a
record that explicitly declares both occupied slots. Do not infer all generic
female armor or matching item names occupy two slots.

One outfit is **stored and calculated once**, in physical armor slot 3. The
pants slot 5 receives a presentation-only `shared:true` projection with a
subtle ↔ badge, identical icon and tooltip. In the rich item card, show
"Броня + штаны · одна вещь" / "Armor + pants · one item". Never duplicate
the item, Souls, gem or refinement in saved equipment or combat formulas.

Pants remain selectable. Choosing pants removes a one-piece outfit from armor
and equips only the chosen pants. Choosing ordinary armor in place of a dress
restores the trousers displaced when the dress was equipped; swapping dress to
dress keeps the displaced trousers. Removing a dress via either visible slot
restores them. A legacy corrupt build with both a dress and physical pants must
show the dress in both slots without granting extra pant bonuses.

## Soul picker continuity

The scrollable `.stage-rich-list` owns its `scrollTop` while a Soul tab remains
active; the surrounding `.stage-rich-body` retains scroll independently.
The current Soul query remains unchanged when inserting a Soul, selecting another
socket or re-rendering the picker. A new textual search intentionally resets the
list position to the top. Choosing another equipment slot resets the remembered
Soul scroll because it is a different catalog context.

## Milestone point labels vs invested free points (0.391)

An OS skill requirement `{branch:'assassin',amount:21}` is an ABSOLUTE
branch level. The class's starting allocation counts toward this requirement;
the extra invested free points are stored separately. With SCOUT/SNIPER
Assassin starting at 3, the "Внезапный выстрел" milestone at 21 requires
18 free invested points, not 21. Its other threshold is Archery 50.
The actual rail, gold fill, thumb, and tick always use absolute 0..90
coordinates. **Never move tick 21 to slot 24 to match investment=21** or
reinterpret the underlying game requirement. Instead show the player a short
milestone note: "21 очков ветки · Старт: 3 · Вложить: 18".
"Вложено" means manually allocated free points. Do not silently count
starting points as spent budget.

## Numeric inputs and browser autofill (0.391)

Re-use `PandoraNumericField.prepare` in the existing DOM factories for Hero
Path, Origin and Hero Book. It sets `autocomplete="none"` (Yandex's
documented non-standard no-autofill hint), standard password-manager ignore
attributes and no browser autocomplete. In Yandex only, inactive numeric
inputs become read-only until explicit user pointer or keyboard interaction;
ordinary Chromium inputs remain editable, preserving Playwright `fill`,
accessibility navigation, and native number controls. Do NOT apply the guard
to credentials, passwords, checkboxes, ranges, or search. Autofill UI is owned
by the browser; this is best effort, not a guarantee. Keep gameplay and
manual changes functional even if browser autofill is globally enabled.

## 0.392 — UX labels and compact equipment controls

Hero Path group header **always** shows `mastered освоено · learned изучено · invested вложено`. Mastered is the sum of actual green mastery; learned is the sum of branchPotential (class starting points + spent); invested is the sum of manually allocated free points. Even zero manual green must not zero out learned branch points. Never combine mastery with free skill budget.

Skill thresholds remain **absolute** on the 0–90 scale. Tooltip labels: `N оч. ветки`, `Начально (оч.): D · Вложено (оч.): max(0,N-D)`. The class-side legend uses `Лимит (оч.)` and `Начально (оч.)`. Both RU/EN texts must be updated consistently.

A two-slot garment's visually mirrored pants slot is shaded/dimmed with a lock symbol, but remains an interactive **button**: clicking it lets the user replace the dress with pants and is not a disabled slot. The garment is never stored twice and never contributes double bonuses.

Each equipment candidate row displays `Уровень L · Слоты: C` using `PandoraEquipmentPlan.socketCapacity(record)` and does not infer unknown source values (show `—` when null). Weapon refinement +0…+10 is an eleven-button one-line control; on very narrow screens, horizontal scroll rather than clipping or two rows. Element icons are presentation only, mapped by canonical OS element IDs and cannot alter `assignGem` payloads.

The visible UI footer omits icon-load status and D1 technical names, but obtains counts from the loaded catalog. An archive warning persists in its dedicated notice. Project name subtitle is simply CHARACTER PLANNER.

## Hero Path visual and numeric semantics (live-game contract, 0.390)

The current live OS game indicates that root profession's starting points (D)
are already ALLOCATED branch points, NOT green mastery. For example, a
first-level Warrior starts with Cleave/Brush 5 allocated and **zero** green.
This differs from older Remaked Legacy's interpretation of Skill[i][0]; it is
an intentional parity correction for the observed live game.

Allocated branch level = class-start D + manually invested free skill points,
clamped by the class-specific cap. Caps are absolute and never grow when points
are invested. The common track spans 0..90 and never expands beyond 90.

Actual green mastery starts at 0 and ranges from zero through allocated level.
When "auto green" is checked, it previews mastery == allocated branch level.
With auto off, mastery is the user's independent manually trained value. Green
does not consume free skill points. Enabling and then disabling auto preserves
the last manually trained value. Skill unlock requirements use allocated branch
points; passive scaling and effects use real green (to avoid circularly
requiring green to unlock the skill that trains it).

Draw one gold invested bar and the existing green mastery bar from zero on the
same 0..90 rail. DO NOT introduce a split innate-green segment. Show D and the
class cap as succinct labels in the existing editor.

Both exact controls have single-step +/− buttons with press-hold repeating.
During a hold update the bar and counts in place without dropping the pressed
button; commit full stats and UI refresh on release. Keyboard input remains
available. Save-version tagging distinguishes pre-0.390 explicit additional
manual mastery from the new absolute green values.

## Origin profession steps and branch input cards

All three wizard steps share a two-row grid: step number and centered localized
name. Cards have equal height, including when "Специализация" wraps. Existing
selected/current/completed semantics and inline administrative editing remain.

Two exact branch controls use equal-width, fully responsive dark cards. Each
label stays associated with the existing numeric input and short accessible
explanation. Do not duplicate the heading inside an expanded branch row.

## Acceptance gates

Run the full Node suite and Chromium after changes to selection, Souls, classes,
skill mastery, equipment calculation or presentation. Include at least:
- four root classes + every one of 28 specializations at level 1;
- every class's innate D, class P and independent spent-point budget;
- Inspiration, Archer/Hunter technique passives, racial selection and resulting stats;
- hover of equipped slots and prospective equipment; keyboard accessibility;
- dress mirroring, replacement by pants/armor, stale two-slot saves;
- Soul insertion from a scrolled list, socket 1→2 and preservation of search.

Public GitHub Pages deployment and live game parity are separate acceptance
claims; neither is implied by tests using the bundled OS snapshot.

## Переполненные слоты душ в старом билде (0.477.0)

Каталожное значение `soulslot` — вместимость **по умолчанию**, а у экземпляра вещи может быть другое значение `socketCapacities[slot:itemId]`. При загрузке сохранения с явной привязкой `soulOwners[slot]` к **тому же предмету** не удалять валидные души, если их больше, чем позволяет каталог по умолчанию: состояние остаётся нетронутым, `socketReport` показывает предупреждение о числе сохранённых и пока неактивных душ. Боевые эффекты и активные карточки ограничены **выбранной вместимостью**; лишние души никогда не считаются активными. После выбора соответствующего количества слотов души вновь становятся доступными. Если старое сохранение вообще не содержит `soulOwners`, сохраняется прежнее строгое требование вместимости: нельзя достоверно отличить души снятого предмета от душ нынешнего. Смена самого предмета или несовместимость с типом экипировки по-прежнему очищаются защитой от stale ownership. Действующий D1/catalog, конкретные ID вещей и исторические записи пользователя не переписываются.
