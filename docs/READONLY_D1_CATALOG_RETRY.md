# Bounded read-only D1 catalog retry (#4)

This check is used only by `npm run connection:check:full` /
`npm run connection:check` for published `/api/catalog/*.json` GETs.

- Up to **3 requests** per dataset (the initial attempt plus two bounded
  retries, with 350 ms and 700 ms pauses).
- Retries network fetch failures and temporary HTTP 408/429/500/502/503/504.
- Never retries or rewrites malformed JSON, invalid D1 provenance/CORS,
  missing records, authorization denials or other 4xx responses.
- Any persistent error remains a blocking diagnostic failure; a later success
  is reported as `GET attempt 2/3` or `3/3`, without hiding the retry.
- No authenticated API calls, production writes, gameplay formula changes,
  speculative source values or changed published catalog.

Motivation: Release 0.854.0 published successfully; the first read-only
acceptance run [#43988184235](https://github.com/bonaqu/Pandora-Saga-Build-Studio/actions/runs/43988184235)
failed only on a single `items.json` fetch, while attempt 2 passed. The
retries reduce false negatives, not the standards required for correctness.
