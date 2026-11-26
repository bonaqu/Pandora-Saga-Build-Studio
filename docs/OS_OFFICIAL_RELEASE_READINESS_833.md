# Production release → current official OS API (release checks, no cron)

Every merged Build Studio release already checks GitHub Pages, Worker readiness, owner defaults and the **16 D1 datasets**. Issue #476 adds a **separate read-only external game-source comparison** immediately after the 16/16 D1 test.

Workflow: `.github/workflows/live-readonly.yml`, step `npm run os:source:live`. The command checks all 17 official `gamedata/*.json` datasets and fails on a changed source number, `EP`, `fv1/fv2`, skill/class requirement, record count or any other non-editorial field. Compare output names the changed datasets and field paths without automatically overwriting source code, D1 or player builds. Exact editor-owned exceptions: HTML-only `<br>` formatting of item/Soul descriptions, local `blurbRu` for instances, and curated meta layer.

**Separation of concerns:** Official OS API is authoritative for **published values**. GitHub Pages release should not fail or roll back merely because `pandorasaga-os.com` is temporarily unreachable. Accordingly, the external-source step has `continue-on-error: true` and a 3-minute ceiling. Its failure is still visible as a **warning** in the production check; it is **NOT** a green source-data parity result. The ordinary D1 source verification, 16/16 live checks and authentication probes **remain blocking**. No scheduled background GitHub jobs; the comparison runs on real releases and manual readiness invocations only.

The main Build Studio code still treats Remaked as the **algorithmic model** and the published OS vectors as the current values. Successful official data parity alone doesn't prove hidden server hit/stacking/rounding algorithms.
