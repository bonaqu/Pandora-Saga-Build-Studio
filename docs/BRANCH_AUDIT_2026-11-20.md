# Аудит лишних веток · 20.11.2026

Возможная цель будущей ручной очистки — оставить единственную постоянную ветку `bonaqu_projects`. Автоматическое удаление при релизе редактора отключено.
Проверено по GitHub API: в начале было 15 веток, включая default.
Не превращать расходящиеся на сотни коммитов старые ветки #615 в прямые
слияния: исходные PR были закрыты без merge, и их изменения требуют
самостоятельного повторного анализа относительно нового кода.
Это **архивация незавершённых вариантов**, а не утверждение, что вся их
функциональность уже реализована или что их можно безопасно слить.

| Ветка | HEAD SHA до уборки | Ahead / behind относительно acc103f | Обоснование |
|---|---|---|---|
| `codex/account-public-errors-877-final` | [`30f7a7127`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/30f7a7127a2c1175c55f4e37f281b12dfa552546) | +9 / −150 | нет PR; старый прототип аккаунтных ошибок |
| `feat/615-atomic-status-833-stack` | [`03bd63283`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/03bd6328336e57625b58afa0bdbe3506216f81be) | +10 / −281 | нет PR; эксперимент #615 |
| `feat/615-model-references-831` | [`03fa44841`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/03fa448417303684f9eb9d3b38a2c5483bd6f927) | +11 / −283 | нет PR; эксперимент #615 |
| `feat/615-source-contract-registry-832-stack` | [`b871a72f8`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/b871a72f8562942659df6161ab252d1255d20318) | +11 / −282 | нет PR; эксперимент #615 |
| `fix/615-ammo-support-source-parity-844` | [`b20637283`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/b20637283b47375b55b3d5af90de75aed55c223f) | +8 / −256 | закрытый без merge PR #655 |
| `fix/615-legacy-link-metadata-842` | [`2aaeb48da`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/2aaeb48da0fc898d9685c3e7770e807014769e9d) | +6 / −238 | закрытый без merge PR #653 |
| `fix/615-replay-complete-loss-audit-843` | [`3da85adf7`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/3da85adf72bd907347fe1126292cdc79809a0164) | +6 / −256 | закрытый без merge PR #654 |
| `fix/615-specialized-situational-source-parity-845` | [`27e55575c`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/27e55575cc05785c66fc298d9e548670d73958a1) | +9 / −256 | закрытый без merge PR #656 |
| `fix/615-tactical-metadata-841` | [`e4fc5053f`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/e4fc5053fbd646c2650c4bee9f9433f4f758e818) | +1 / −261 | закрытый без merge PR #652 |
| `fix/615-wiki-gear-artwork-846` | [`9e144fa3b`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/9e144fa3b1d5460b70e1b4a83c92cf82df9a28bc) | +17 / −238 | закрытый без merge PR #657 |
| `review/archive-promotion-regression-20261115` | [`defd5ffaa`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/defd5ffaad8b9418bc0f2ee1921871efe864d5f6) | +15 / −308 | DRAFT DO NOT MERGE PR #611; архивные эксперименты |
| `work/946-direct-inline-editor-no-caption-pencils` | [`575b14193`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/575b141939b407230531516a6b570fbb4e76f12c) | +1 / −0 | дублирующий PR #802 закрыт без merge, провал CI |
| `work/946-inline-editor-no-label-pencils` | [`3d5876165`](https://github.com/bonaqu/Pandora-Saga-Build-Studio/commit/3d5876165790dc769a7e8bce9568b083fc570621) | +2 / −0 | дублирующий PR #804 закрыт без merge, провал CI |

Открытые в момент аудита три конкурирующих PR по #390:
- [#802](https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/802), SHA `575b141939b407230531516a6b570fbb4e76f12c`: закрыт как дубликат, CI красный.
- [#804](https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/804), SHA `3d5876165790dc769a7e8bce9568b083fc570621`: закрыт как дубликат, CI красный.
- [#803](https://github.com/bonaqu/Pandora-Saga-Build-Studio/pull/803): **единственный рабочий кандидат 0.946.0**; перед merge Node и Chromium обязаны быть зелёными.

При отдельном подтверждённом ручном запуске ветки удаляются только при совпадении текущего Git ref с конкретным
аудированным SHA. При несовпадении сохраняются и подлежат новому аудиту;
основная защищённая ветка не затрагивается. Все ветки либо от закрытого
необъединённого PR, либо устаревшие экспериментальные. Список не включает
`work/946-direct-inline-owner-copy` — GitHub auto-delete после merge PR.

**Не означает:** что работа по #615 выполнена. Следующие изменения #615
должны основываться на актуальном `bonaqu_projects`, новых проверках
реальных данных и отдельном согласованном PR, а не на старой ветке.

**Безопасное ограничение:** workflow `prune-audited-branches.yml` **не реагирует на push и merge**. Для удаления необходим отдельный ручной запуск из защищённой ветки с вводом `DELETE_AUDITED_BRANCHES`. До него все ветки, включая незавершённые ветки #615, остаются на месте.
