# История ROADMAP — часть 20 из 20

- [x] Remove the remaining technical Remaked/server-verification paragraphs from public Origin buffs and the HP/MP coverage status. Keep useful explanations of gameplay requirements and values.
- [x] Restore the isolated HP/MP test's required potion-preview dependency and assert the clean accessibility label instead of the removed technical disclaimer.
- [x] A malformed saved character now shows an inline share-card error, not an uncaught exception.
- [x] Recovery code import checks that a D1 library contains an actual active saved build, not just deletion tombstones, before replacing the browser owner key.
- [ ] Need real browser/D1 E2E and the full npm test runner once the complete source workspace can be executed.


## 0.149.0 — historical snapshot round-trip and stale regression repairs

- [x] Preserve the historical runeJoEun Boolean field when opening or sharing a stored character. The source OS catalog does not identify a matching current item, so the old rune is NOT automatically added to game calculations.
- [x] Update outdated tests for clean Origin HP/MP labels, modern separate proc/target combat previews, and the distinct equipment part of natural MP regeneration.
- [x] Verify technical formula methodology is retained only for authenticated site-admin mode.
- [ ] Full npm test, browser E2E, and current server parity are still required.


## 0.150.0 — source-backed earned XP bonus

- [x] Current OS beginner cape ID 18073 grants a real +5% earned EXP via EP_VOLUME_EXP. Only equipped records can contribute; refinement bounds and per-item sources remain visible without pretending to know the full server reward formula.
- [x] The EXP branch moves to PARTIAL; inventory: **41 missing, 77 partial**, 15 base previews and 10 buff previews. SkillEXP remains missing: no confirmed matching current-game effect has been discovered.
- [x] Added regression tests for the actual published OS item ID, conditional grade gates and separate effects UI.
- [ ] Verify XP grant behavior in the live game and complete remaining Remaked branches; full Node and browser E2E still required.


## 0.151.0 — player-focused UI labels and icon messages

- [x] Remove implementation phrases embedded in plain Hero Book values (partial magic attack and healing labels, unverified rounding notes, rainbow gem debug message). Players still see the distinct conditional effects and their actual source values.
- [x] Replace local OS icon counts/import diagnostics in the public interface with useful generic loading/availability messages.
- [x] Keep technical auditing in source documentation and authenticated admin views, not in regular gameplay-facing descriptions.
- [ ] Verify responsive rendering and actual browser focus/hover flows. Complete remaining formula branches.


## 0.152.0 — corrected concise gem and image labels

- [x] Correct the special rainbow-gem label to a single readable player-facing phrase instead of the duplicate text introduced in 0.151.0.
- [x] Do not claim that every image is available when the local manifest is missing; describe the active source without overstating actual fetch success.
- [x] Extend regression tests to catch reintroduced repeated gem phrases.
- [ ] Browser render and full Node suite remain outstanding.


## 0.153.0 — protect actual current mitigation and conditional skill behavior

- [x] Update old test snapshots to recognize the newly added, independent earned-EXP preview without accidentally classifying it as a damage bonus.
- [x] An incoming physical damage-percent modifier is already modeled by the current equipment calculator; tests now assert calculated mitigation. On-hit skill procs remain conditional and must never be included in deterministic damage.
- [x] Preserve a targeted regression test for each distinction, preventing a stale fixture from forcing incorrect behavior back into production.
- [ ] Run the full Node suite and deployed Worker/browser E2E before claiming complete coverage.
