# Patch acceptance, November 13, 2026 — «Охота в Мальдии» / issue #616

**Primary source:** https://pandorasaga-os.com/api/news — entry ID **9**, title «Обновление „Охота в Мальдии“», published 2026-11-13 17:00 (source time). Read-only extraction via a diagnostic GitHub Actions runner, no credentials or edits to game or D1. Original PvP event screenshot immediately after the event introduction in official article: https://pandorasaga-os.com/uploads/images/f4be126de5ed488981aeeb2298255095.jpg.

## Verified against the *current* 17 local JSON game data sets

| Patch item | Actual source / IDs | Acceptance |
|---|---|---|
| Maximum game level increases to 50 | `tables.levelCap=50`; `tables.exp[45..49]` | XP: 13,306,266; 15,967,519; 19,161,023; 22,993,228; 27,591,874. Stats +14,+14,+14,+14,+16, skills +3 each; independent player planner 55 intentionally unchanged |
| Conjurer warding cap 5→10 | `classes.CONJURER.branchCaps.warding=10` | Matches |
| Wind Trail upgrade | `skills[420004001]` cast 5, `[420004002]` cast 1, level 50, prerequisite first, CONJURER; advanced resistance effect | The two source records stay distinct in encyclopedia; character skills resolve to ONE active version when requirements are met |
| Flying Blade upgrade | `420005001` cast 3.5, CD 10 → `420005002` cast 2, CD 12 at lvl50 | Linked class/level-dependent version |
| Sandstorm upgrade | `420007001` cast 7 → `420007101` cast 4 at lvl50, advanced child `420007102` | Show level-based source rank. **No invented final damage** |
| Encouragement, three songs, Silent Storm, Plague | `320006001`, `340001001`, `340003001`, `340004001`, `440009002`, `440011001` | Updated source shape present; earlier compatibility modeling PRs #604–#608. Full combat semantics beyond source are not asserted |
| Fire weapons at permanent medal merchants | trade IDs 240–253; item IDs 252,452,652,852,1052,1252,1493,1652,1862,2042,2262,2442,2652,2852; NPC 131 Oгун VIII, 232 Содан, 331 Саймон | Every recipe costs 200 Imperial Muldia medals (item 80098) + one appropriate stone (80092, 80093, 80095). **Existing dynamic NPC exchange pages consume these records; no duplicates added** |
| Permanent armour exchange in 3 capitals | NPC 423 «Обмен доспехов», map IDs 1002001,1003001,1004001; Pumpkin Cloak item 18018 trade 254 | 100,000 gold + 300 medals. Also offers capes/pants from current trade data |
| Three ancient Muldia bosses | `monsters[95120,95121,95122]` | Present in monster catalog; drop rates and location schedules not fabricated |
| Ancient King's Chest and lvl50 changes | `chests.boxes` chest item 51036 (127 entries) | Existing chest UI and server-data-backed rewards; chance and roll semantics not guessed |
| Permanent PvP Victories | Official article ID 9; `PandoraHonorGuide.pvpVictories` | New RU/EN Honor chapter with daily thresholds 50/100/200/300, weekly token exchange (50→50k gold max35; 100+1000 Honor→51036 chest max7; 100→gold hammer max3), grouping & shared account, daily Moscow midnight and weekly Monday reset, Tue/Thu double sessions at 05–07,16–18 Germany and 20–22 Moscow, source screenshot |
| Website premium items, appearance and account services | Website only | Intentionally **excluded** from game Encyclopedia. Quest XP changes are acknowledged, but no public game-quest JSON in the 17 datasets: do not create fictional quest/NPC data |

## Automated GitHub fallback chain

1. Owner reviews the game catalog delta and confirms publication once (existing workflow).
2. D1 CAS-protected active revision switches; browser reads back all 17 public sets and verifies base hero model.
3. If Worker `GITHUB_CATALOG_TOKEN` is configured and works, the same browser action asks Worker to create exactly 17 JSON fallback files as `catalog/snapshot-ps-…` PR. The token never enters the browser.
4. GitHub `quality.yml` and `browser-smoke.yml` test that PR.
5. The trusted-base `catalog-fallback-auto-merge.yml` receives both completions, confirms same commit SHA and exactly 17 safe data/os files and no additions elsewhere, merges with expected SHA. Pages updates automatically. Failed/unknown CI means **no merge**.
6. Live read-only Pages/D1 workflow confirms release and data parity after deployment. A safe catalog-only PR cannot fix unproven semantics; source changes must not be announced as verified gameplay formulas.

**Important:** We cannot read Cloudflare Worker secrets from public GitHub. The Worker `github-status` is admin-authorized. Therefore actual deployed-token permissions and an end-to-end automatic merge of a real future D1 publication remain unverified until a legitimate owner-catalog publication exercises the flow. No artificial production D1 write or unsafe CI-bypass probe is performed.

## Historical SHA integrity vs future automatic backups

Previously `scripts/check-catalog-review-2026-11-15.mjs` demanded that all *future* active `data/os` files remain byte-identical to the one-time November 15 pinned snapshot. This guaranteed every legitimate later data-only PR would fail CI, even if it exactly matched a new, reviewed D1 publication. The 0.807 process separates these concerns:

- `auditReview()` continues to verify the historical, immutable candidate (all 17 SHA-256 values, recorded changes and known relationships) independently of current production.
- `auditCurrentFallback()` validates the latest candidate's schema, record identities, full 17-file counts, English translations, level progression, item links and NPC/loot/chest relationships.
- The GitHub auto-merge gate still requires the entire normal Node + Chromium CI on exact PR head, and rejects all changes outside the 17 JSON files. Unknown semantics still fail the specific formula regressions and require deliberate work; there is no test bypass.

This change makes later **pure data refreshes** eligible for automatic CI acceptance without disabling safety rules or rewriting historical evidence.
