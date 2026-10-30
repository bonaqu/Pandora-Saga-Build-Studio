# Language sources for Build Studio

- `legacy-approved.v1.json` is an unmodified copy of the user's own `bonaqu/Pandora-Saga-Simulator-remaked/localization/approved-translations.v1.json`, checked at the `bonaqu_projects` branch on 2026-10-30.
- It contains approved **Legacy simulator** terminology and UI strings for RU, EN, JP and TW. The Legacy term keys are not Pandora Saga OS item IDs, so they **must not be automatically joined** to the current-server catalog by array order, similar-looking names or assumptions.
- Current server `meta.json` declares `baseLocale: ru` and `locales: [ru,en]`, but queries to `items.json?lang=en` and `skills.json?lang=en` still returned Russian names as observed on 2026-10-30. Do not label those names as authoritative English translations.
- Only a verified item/skill ID mapping may promote a term to a translated OS record. Absent or uncertain translations should fall back to source language with a visible locale indicator.
