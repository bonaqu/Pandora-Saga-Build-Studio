# Pandora Saga OS — further modeled buffs and skills, 0.689.0

All numbers in this document are **current-OS-source parameter models**, not new claims of observed exact gameplay. No game client measurements are prerequisites for producing these useful previews.

## Source references

- Remaked Legacy `js/calc.js`, `Calc('DAMAura')`: aura base + shared flat + `ceil(base × sharedPercent / 100)` with distinct integer stages. `Calc('ATK')`: Desperado uses `ceil(baseATK × coefficient/100)`. `Calc('Gloom')`: historic dark tiers every 12.5 SPI; `Calc('PeacefulHymn')` had the literal unknown **???**.
- OS `data/os/skills.json` current snapshot: precise IDs and effect vectors in tests `priest-aura-peaceful-scaling-689.test.mjs`.
- 330051001 Holy Weapon `EP_AURAHOLY_CONSTANT [6,0,0,2]`: model 2+floor(SPI×.06); at 134 SPI **+10**.
- 320011001 Enhance Enchantment `EP_AURADAMAGE_SCALE [20,0,20,10]`, `EP_AURADAMAGE_CONST [5,0,10,5]`, `EP_ELEMENT_DAMAGE_SCALE [0,0,20,10]`.
   - rate=10+floor(SPI×.20)+floor(Blessing×.20)
   - flat=5+floor(SPI×.05)+floor(Blessing×.10)
   - elemental=10+floor(Blessing×.20)
   - hypothetical combined aura=base+flat+ceil(base×rate/100), only when BOTH buffs have been selected and a weapon has an actual aura. At SPI134/Blessing90 => rate +54%, flat +20, elemental magic +28%, **Holy +10 → projected Holy +36**. This precise stacking result has not been verified on live OS.
- 340003001 → 340003002 → 340003003 Peaceful Hymn, `EP_DAMAGE_CLEAR [60,0,30,10]`, modeled threshold=10+floor(SPI×.60)+floor(Hymn×.30), at SPI134/Hymn30 => **99**. Requires Benevolence61 and Hymn30 on the caster. Remaked historic formula absent, so modeling its modern vector is necessarily provisional.
- 430051001 Dark Aura `EP_AURADARK_CONSTANT [8,0,0,15]`: OS model 15+floor(SPI×.08), at SPI134 **+25**. Remaked historic stepped Gloomy Aura table applies tier floor(SPI/12.5) to `[73,82,92,103,114,125,137,150,162,177,191,206]` for tiers0–11. That older table does not replace current OS 15+.08×SPI without evidence.
- 100058001 Desperation `EP_DAMAGERATE_SCALE [0,0,35,40]`: rate=40+floor(Slash×.35); shown gain `ceil(baseATK×rate/100)`. The OS incoming damage +100% is a separate effect; final combat damage cannot be inferred.
- 213605001 Precision Shot: rate=20+floor(Archery×.30), estimated baseATK gain `ceil(baseATK×rate/100)`, and independent accuracy and range source components. 213702001 Swift Arrow: fixed `EP_ATTACKINTERVAL_SCALE [0,0,0,30]`, rendered as 30% modifier rather than claiming exact shots-per-second.
- 220001001 Poison, advanced 220001003: illustrative source model `fv1[3]+floor(level×fv1[1]/100)+floor(Alchemy×fv1[2]/100)`, where OS vectors are respectively `[0,10,5,5]` and `[0,10,15,6]`. Legacy poison function scaled by level+alchemy using different stair steps. These are explicitly estimates, not proved damage ticks.

## UI and activation

The Priest section stays expanded; each caster-dependent skill has an inline SPI/Blessing input on the right, sharing one priest source configuration with the top panel. A Benevolence mastery field gates Peaceful Hymn at 61 to avoid displaying an active skill for an impossible caster configuration. Party buff calculations that depend on **recipient** stats (Wind Assist, War Cry, Life Sign) must continue using recipient fields, not invented ally-caster inputs.

Source-validated aura enhancement only applies if explicitly selected and only to existing elemental weapon auras; it does not change physical attack or HP, does not inject an aura on an unequipped weapon and is `verified:false`.

Unresolved: effect stage ordering, elemental mitigation, aura proc trigger, poison duration, direct hit damage packets, server-specific tier mapping.
