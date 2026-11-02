# Game-client HP/MP proof ledger — 2026-10-13

## Sources and precedence

The source is the **actual Pandora Saga OS game client** reported by players on
13 October 2026, recorded in the separate Remaked repository:
[INGAME_PARITY_VECTORS_2026-10-13.md](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/docs/INGAME_PARITY_VECTORS_2026-10-13.md).
The accompanying
[Modern current-vitals.js](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/modern/current-vitals.js)
already changed class HP/MP to floor of integer-cents and applies each
percentage to the *class base*, before flat gear bonuses.

**Do not replace game-client rounding with the public website's rounding.**
Remaked's
[GAME_CLIENT_PARITY_AUDIT_2026-10-12.md](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/docs/GAME_CLIENT_PARITY_AUDIT_2026-10-12.md)
verified that the public web calculator uses ties-to-even for its *unbuffed
class* numbers and did not correctly integrate all max HP/MP percentage
effects. Web output is a different reference level, not a substitute for a
captured in-game character sheet. Source coefficients are the official OS
`classes.json`, retained under `data/os/classes.json`.

### Observed client outputs (not hypothetical synthetic web builds)

| Scenario | Effective VIT / SPI | Reported game max HP / MP | Source of additional effects |
| --- | --- | --- | --- |
| Elf Warrior lv1, equipment without vital effects | 5 / 6 | 149 / 44 | Remaked §1, screenshot |
| Same Warrior + Ring with Crystal ID 19004 | 6 / 6 | 155 / 44 | Remaked §1a, two screenshots |
| Elf Cleric lv45, no HP/MP-changing equipment | 49 / 53 | 3145 / 1279 | Remaked §4 |
| Cleric with shield 17034, boots 15004 +4 and recorded mana equipment | 50 / 57 | 3402 / 1505 | Remaked §4, four final screenshots |
| Same equipped Cleric + Life Sign | 50 / 57 | 4127 / 1505 | Remaked §4 |

For the Cleric, observed base HP `floor(200+45×36.38+49×26.7)=3145`;
observed base MP `floor(255+45×10.88+53×10.1)=1279`.
For shield + boots: base HP = `floor(200+45×36.38+50×26.7)=3172`,
plus **100+130 flat HP** = 3402. Life Sign adds
`250 + floor(3172×15/100) = 725` → 4127 HP.

Recorded mana sources include +4 effective SPI (soul +1, pants +1,
wand +2), +10/+20/+50 flat MP and +8% from High Soul.
`floor(255+45×10.88+57×10.1)=1320`;
`1320+10+20+50+floor(1320×8/100)=1505`.
The source specifically distinguishes the ordinary Necklace ID 20001 from
the similarly named necklace of light. Values from equipment and buffs are
not a universal proof of class/race combinations not included above.

### Distinguish **website** baseline

The public OS web calculator's default-looking Gladiator lv45, VIT7/SPI4
showed 1643/163. Its MP follows ties-to-even:
`30+45×2.73+4×2.53=162.97 → 163`.
The **game-client** floor method would give 162, but there is **no
independent client screenshot for this Gladiator configuration**.
This is not evidence of a bug in the game's floor rule; retain the
uncertainty instead of changing all 28 classes for one web-only sample.

### Runtime policy and regression tests

1. `classBase` floors exact integer cents for HP and MP, avoiding JS float
   instability at values like 1279.9.
2. VIT/SPI flat equipment/soul bonuses modify effective attributes before
   class base. Flat max HP/MP and separately floored percentage bonuses
   then modify the base. Life Sign only affects HP.
3. `tests/actual-game-client-vitals.test.mjs` tests the directly observed
   scenarios against the real structured OS item/soul/forth snapshots;
   `tests/game-client-parameter-matrix.test.mjs` covers all 28 class
   coefficient combinations through planned lv55, but is a **mathematical
   matrix, not gameplay observation**.
4. If a structured catalog entry was updated after October 13, compare
   source identities before claiming parity, and resolve drift in an
   explicit change rather than modifying tested expectations silently.
5. All other partial combat/stat branches are tracked by
   [REMAKED_FORMULA_INVENTORY.md](REMAKED_FORMULA_INVENTORY.md).
   Neither this document nor green Node/Chromium CI claims total game
   parity, including active spells and conditional damage.

### Separately proven base attack range

The official OS item `range` field is a numeric **base** in raw game units.
Remaked's
[calculation audit](https://github.com/bonaqu/Pandora-Saga-Simulator-remaked/blob/bonaqu_projects/docs/CALCULATION_PARITY_AUDIT_2026-10-11.md)
compared original base values across 164 weapons. The Hero Book may show
the base for a presently eligible weapon. `EP_RACE_RANGE` and
`EP_BOW_RANGE` equipment bonuses remain **separate** and are not
summed with base range before actual combat-engine verification; paired
`*_CARRY` fields must not be counted as additional range.
