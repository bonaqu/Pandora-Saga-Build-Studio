# 0.973.0 · Current OS five-effect Painlessness

Issue #476 — correct game source coefficients without inventing combat-server formulas.

Official `skills.json` record `100057001` **Безболезненность** is a `TOGGLE` requiring overall **MELEE** group mastery 100, learnable by eligible classes. Its FIVE TARGET effect vectors are:
1. `EP_PROTECTION_NUMB [0,0,0,100]`;
2. `EP_PROTECTION_TUMBLE [0,0,0,100]`;
3. `EP_DAMAGERATE_SCALE [0,0,0,-50]`;
4. `EP_PROTECTION_MOVEBAN [0,0,0,0]`;
5. `EP_TOGGLE [0,0,0,0]`.

Build Studio no longer freezes the third coefficient to `-50`: a supported signed `fv1[3]` update replays directly, while changes to any other existing field, direction, FV2 or introduced EP suppress the calculated preview for manual mechanics review. The previous Remaked modeled negative attack stage `floor(base ATK × rate / 100)` is retained; only the **current exported OS numeric coefficient** is source-confirmed. Protection channels are not promoted to confirmed immunity probabilities, and the toggle is not automatically applied to the player. Group source gate follows the existing sum of five trained green branches and real source requirement 100.

Regression: `tests/os-painlessness-source-fv-973.test.mjs`: all 5 linked effects, four signed model updates, unknown channels, class/req access, 99 vs 100 pooled mastery, invalid train rank. No changes to D1, Worker, CAS, game catalogs or saved builds.
