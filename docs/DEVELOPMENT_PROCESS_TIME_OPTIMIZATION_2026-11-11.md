# Review: 27-minute UI/D1 editorial task and faster feedback loop

Reviewed 2026-11-11, for GitHub repo `bonaqu/Pandora-Saga-Build-Studio`.

## Evidence and root causes
The previous task shipped [#421](https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/421) and [#422](https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/422). It was not 27 minutes of implementing one color change: two separate releases, their PRs, verifications and postmerge live read-only checks were included.

- #421 introduced a numerator span and subtle fill colors. Previously written Node tests assumed the old one-text-node rendering, causing avoidable fixture/assertion updates.
- #422 added a real Chromium owner-editing flow on mobile. The first browser run failed because the editor disappeared after Escape. A second repeat with checkpoints revealed that the common inline-editor Escape key propagated into the **global picker-close shortcut**. Fixing that real defect improved UX, but the repeated full browser suites were a large unnecessary part of the debugging cost.
- The final #422 Chromium verification reported **46 independent flows** plus five layout viewports, with the suite taking over two minutes wall-clock. Repeating all flows for a single editor issue compounded latency.
- GitHub-only repository access without a local clone added interactive round trips for fetching code, committing, PR polling and log inspection. Prefer batching and reading only relevant chunks instead of redundant whole-file requests.

## Permanent quality-preserving changes
- `tests/browser-smoke.mjs --only=<scenario>` runs **one** validated named flow directly; it skips global startup/demo smoke, other flows, performance measurements and 4K layout captures. Unknown names fail rather than silently passing.
- `Chromium browser smoke` supports a **manual workflow_dispatch `scenario` input**. PRs never read this input and still use the impact selector; gameplay/JS changes still require the **full** browser run.
- Pair changed behavior with specific Node and Chromium regressions that exercise the **real UI**. Start diagnosis focused; keep the final full gate before merging.
- For UI-right-click fixes, use the shared equipped-item lifecycle (and test one-piece outfit projections, keyboard access and mobile clipping).
- Treat browser mocks as evidence for the client CAS flow, **not** production D1 write acceptance (#203).
- After merge, verify Pages and the existing read-only Worker/D1 workflow. Avoid duplicating the full PR suite on push.

## Expected benefit, not a measured promise
Fewer full Chromium repeats and less repository-tool chatter. Exact savings vary with the issue and CI queue, and are not guaranteed; never sacrifice correctness or skip necessary acceptance checks.
