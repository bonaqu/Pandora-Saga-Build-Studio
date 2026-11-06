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

## Hero Path visual and numeric semantics

`D` = immutable class-native green; `mastery` = additional trained green;
`P` = class potential ceiling; `points` = invested level-up skill points.
The underlying numeric formulas must not depend on CSS.

Render D with a subdued fixed green baseline, and render ONLY additional
trained mastery with a vivid green band offset from D. The bright band is
precisely `mastery - D` points long, even when the label displays
`(D + extra) / (P + allocated)`. The gold invested range and current notch
continue to refer only to invested free points. No fake maxed-out mastery.

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
