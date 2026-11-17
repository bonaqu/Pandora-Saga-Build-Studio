# История ROADMAP — часть 6 из 20

## Source update 0.369.0 — integrated scroll-to-top footer

- [x] Change the scroll-top action from an overlay obscuring item rows to a compact footer directly below the left encyclopedia list, with matching panel borders and no absolute positioning.
- [x] Show it only after significant list scrolling; preserve current article, list selection and browser history. Respect reduced-motion preferences and the English language.
- [x] Browser regression asserts footer geometry: the action cannot overlap list items, and it scrolls the independent list rather than the article.
- [ ] Continue full live formula parity, verified NPC/drop relationships, and production authenticated D1 writes as separate evidence-backed tasks.

## Source update 0.368.0 — clear chest contents and useful wiki list navigation

- [x] Replace the redundant «К списку» card button with a context-sensitive «↑ Наверх» control on the independent left list scroller; only show it after substantial scrolling, without changing article URL or selection.
- [x] Hide roll group indices from the player, display «Возможные награды», show the number of options, keep exact source groups and editing indices for owners.
- [x] Remove player-facing game-source commentary from chest pages; simplify colored chest notices to «Категория наград» and «Сведения о содержимом отсутствуют».
- [x] Polish reusable wiki controls (list selected/focus, chapter selection, keyboard focus and responsive list button).
- [x] Replace a few more technical descriptions in item source and unknown-effect panels with concise UI labels.
- [x] Validate checked-in OS snapshots: monster drop keys, drop items, NPC trades and their item/NPC dependencies, chest rewards and bounded chances; this is not proof of production D1 contents.
- [ ] Game chest roll probability interpretation still requires gameplay verification. Current source percentages remain unchanged.
- [ ] Source-backed formula parity, authenticated production D1 writes, complete owner relation editing, original icons and remaining locale coverage remain independent open milestones.

## Source update 0.367.0 — better wiki navigation and chest display

- [x] Replace the isolated Back button with an in-game navigation strip and a deliberate «К списку» action that remembers browser history.
- [x] Make chapter switching clear the previous entity URL without discarding the ability to navigate Back/Forward.
- [x] Present independent 100%-listed chest rolls together in read-only mode; keep each original roll separate for editing and for multi-option prize groups.
- [x] Mark nested chests with linked navigation and preserve source probabilities, original group indices and unknown values (not zero).
- [x] Give item/chest editor numeric fields a no-op on leaving an untouched blank field.
- [x] Improve visual response on reward, chapter mode and navigation controls with keyboard and reduced-motion support.
- [ ] Verify any actual guarantee semantics or chest opening mechanics with live game output before describing table-based 100% entries as unconditional rewards.
- [ ] Confirm combat formulas against client outputs, finish full D1 relation editor validation and original game art; these are not silently considered complete.

## Source update 0.309.0 — discoverable encyclopedia editing

- [x] Add explicit editor controls beside racial passive skill names, encyclopedia item/skill headings and item/skill descriptions, without relying on undiscoverable double clicks.
- [x] Add name and description fields to the same structured item editor as stats, effects and available classes; save them in the owner override without mutating imported source JSON.
- [x] Keep previously edited inline title/description backward compatible, with a deterministic precedence rule for structured edits.
- [x] Protect encyclopedia and NPC exchange search inputs from automatic username autofill by locking them until focus.
- [x] Add server-side input validation for bounded owner titles/descriptions.
- [ ] Build full visual NPC trading and monster/drop acquisition edits, including cross-referenced Wiki source updates and source-safe persistence.
- [ ] Continue examining all encyclopedia chapter types for owner edit coverage.
- [x] 0.366.0: browser Back/Forward returns from wiki links to the previous open tab, preserves the source encyclopedia selection, and shows an explicit in-card return button only when in-site history exists.

## Source update 0.308.0 — graphical owner sync review

- [x] Add comparison summary cards for added, changed, deleted and accepted game data records.
- [x] Add interactive status filters: all, new, changed, deleted, accepted and declined.
- [x] Make group actions explicitly apply to the **entire** section, while a separate action accepts **only displayed/filtered** records.
- [x] Keep default-deny selection, review snapshot leases, independent translations and manual publication.
- [x] Widen the existing in-game modal for readable before/after comparisons; preserve responsive mobile layout.
- [ ] Finish dedicated interactive NPC trade/loot source editing and record relation changes without risking D1 published snapshots.

## Source update 0.307.0 — usable item editor, trustworthy data overlay, current owner setup

- [x] Replace obsolete first-run Cloudflare guide with steps for the **existing** D1 and Worker, limited GitHub token and Cloudflare Secret.
- [x] Give administrators an encyclopedia item editor for level, physical/defense stats, sockets, two-handed flag, permitted classes and structured effects; allow independent field resets.
- [x] Preserve changes outside the server-synced catalog in D1 owner override rows, not by changing the canonical `data/os/*.json` snapshot.
- [x] Apply owner item overrides to hero equipment and encyclopedia calculations; reload the encyclopedia index after changes.
- [x] Enable double-click name/description edits in RU encyclopedia and racial passives; validate requests on the Worker.
- [x] Exclude the encyclopedia search field from common password-manager autofill hints.
- [ ] Interactive source relations (monster loot, NPC trade recipes, quest/drop chances) require an explicit relational editor, reversible transactions and independent integrity validation; current owner note is not a replacement.
- [ ] Further wiki sections (NPC, monsters, maps, chests, souls) need individual structured editors and bilingual edit flows.
- [ ] Verify active Cloudflare Worker deployment and authenticated production admin writes with the owner; no real credentials embedded.

## Source update 0.306.0 — server-only GitHub PR and isolated D1 write check

- [x] Add fixed-scope GitHub PR integration guarded by a Cloudflare Secret and the same authenticated admin token; never handle the token in the browser.
- [x] Read 17 JSON files from a single active D1 snapshot; create only `data/os/*.json` blobs in a new review branch, and require explicit human approval before merge.
- [x] Reject stale D1/GitHub revisions and avoid a duplicate PR for the same published snapshot.
- [x] Add a safe one-click admin D1 **write/read/delete** check isolated from `catalog_current` and player accounts.
- [x] Add Worker and Chromium mocks for authentication, fixed source paths and UI interactions.
- [ ] Cloudflare Worker must be deployed with optional `GITHUB_CATALOG_TOKEN` for genuine GitHub PR creation; production credentials are unavailable in CI.
- [ ] Run the real production D1 diagnostic with the owner admin session. Full live active-snapshot switching remains a separate, higher-risk validation.
- [ ] Confirm full HP/MP, magical enhancement and final defense against independent current game client outputs before changing uncertain formulas.

## Source update 0.305.0 — safe reviewed game-data update for GitHub

- [x] The administrator export is named for Pandora Studio rather than an upstream host; older downloaded files remain importable through the compatibility format.
- [x] Rename the local catalog utility to `scripts/apply-reviewed-pandora-catalog.mjs` and keep `npm run catalog:review` unchanged.
- [x] Refuse `--write` if tracked or untracked game-data changes exist, so an older export cannot silently overwrite local work.
- [x] Stage all JSON replacements to unique temporary files first; restore already renamed files on ordinary errors.
- [x] Continue to verify the 17 source datasets before touching files and never write to D1 from this tool.
- [ ] Direct secure GitHub PR publishing from the website and real-game formula parity remain separate tasks.

## Source update 0.304.0 — safe game-catalog admin refresh and neutral copy

- [x] Neutral game-data wording in administrator UI, source comments and maintained project documentation, without changing actual source hostname, JSON IDs or D1 routing.
- [x] Read upstream `meta` again after loading all 17 source datasets. Refuse to compare a mixed source revision.
- [x] On 401 clear **only** the expired administrator login. The separate normal player account and local build drafts stay untouched.
- [x] Disable per-record and per-group approval during staging. If D1 has already published, a failed follow-up page refresh never claims a rollback.
- [x] Update the Cloudflare owner guide to the current selective-review interface and maintain a player-facing wording test.
- [ ] Confirm production authenticated catalog import with a safe isolated write test. Existing read-only green checks do not prove authenticated publishing.
- [ ] Verify HP/MP, magic refinement and final defense against actual current game-client results before altering uncertain coefficients.

## Source update 0.303.0 — Preserve published D1 Legacy localization

- [x] Read the currently published D1 `legacyLocale` namespace under the same snapshot ID as other OS data.
- [x] Validate 1000–10000 locale rows, names and uniqueness; fail closed rather than silently replacing published records with the repository Legacy archive.
- [x] Stage the exact existing locale keys, text and source metadata alongside the reviewed OS data — only server-game records are changed when selected.
- [x] Extend Node tests and browser admin mocks to enforce the preservation behavior.
- [ ] Separate locale-review UI and authenticated live publish test, plus current OS final formulas parity.

## Source update 0.301.0 — source-safe OS catalog review and branded modules

- [x] Extract administrator OS catalog UI from pandora-studio-app.js into `pandora-os-catalog-workbench.js` and dedicated CSS; enable searchable, record-level accept/reject and dataset-level decisions, with default-deny.
- [x] Keep atomic approvals for trades, instances, formulas, expertise and chests. Recompute curated metadata and English locale counts without claiming official server CSV hashes.
- [x] Validate whole candidate and reviewed selections before creating D1 staging entries. Apply an atomic expected-active lease when switching the published D1 snapshot.
- [x] Add reviewed JSON export and a dry-run-first `catalog:review` CLI for separate GitHub source-file updating. No client-side GitHub write credential or D1 migration.
- [x] Rename catalog-import/diff modules with current game server-specific identity and update the loader, tests, documentation and release keys.
- [ ] Full real-server OS calculator and magic/defense parity; production Worker deploy, D1 mutation acceptance and GitHub publishing automation remain unverified or not implemented.

## Source update 0.300.0 — canonical item names, OS forge attack and left-aligned restrictions

- [x] Show the localized source name plus grade only; elemental choices remain in separate tooltip fields.
- [x] Physical gemstone weapon tooltips show source W plus the numeric improvement from the OS weaponPlus table; they do not confuse the grade with increased attack. The equipped hover and editor use the same table.
- [x] Align race and gender eligibility chips to the left. Extend existing tests, without proliferating separate test runners.
- [x] Keep Remaked defense rounding, Blessing 90 -> Encouragement +9, 1–55 planning and D1 account data untouched.
- [ ] Final server parity of HP/MP, magic gem coefficients and forge/defense rounding requires a verified live OS calculator or real game-client measurement.

## Source update 0.260.0 — safe source skill level parsing and no synthetic zeroes

- [x] Use one strict, nonnegative safe-integer validation for character-level requirements and supplementary skill requirements. Reject malformed values (empty string, arrays, objects, hex/exponent text, booleans and unsafe integers) instead of coercing them to zero or to fake requirements.
- [x] Preserve legitimate official zero/positive source values and decimal-text legacy imports without altering skills, source records, future planning 50–55, or any character build.
- [x] Extend existing source-skill regression suite; retain full Node and Chromium acceptance and independently check published Pages / Worker read-only state.
- [ ] Formula parity and authenticated production D1 write lifecycle still require source-backed controlled acceptance, and original game assets remain open.

## Source update 0.259.0 — single source of truth for class permission throughout Hero Path

- [x] Extract one strict class-entitlement predicate shared by growth branch indexing, full skill gallery, and recursive prerequisites. Remove three separate/mismatched checks of job membership, which previously let truthy invalid source flags (e.g. string "false") leak into the gallery despite being blocked in readiness.
- [x] Preserve approved OS membership values (1/true), stable source order, 28-class coverage, filtered gallery behavior and all actual game data. Corrupted class permissions are rejected consistently and cannot appear as learnable skills or skill markers.
- [x] Extend existing branch/source test files instead of adding another test file; check invalid permission fixtures, source-level call-site reuse and current catalog parity.
- [ ] Game mechanics parity, authentic icons, UI responsive refinements, and controlled production D1 write acceptance remain separate.

## Source update 0.258.0 — source skill gates and marker validation aligned

