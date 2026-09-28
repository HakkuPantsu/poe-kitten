# Deferred specs

These test suites cover modules from the **old widget-tree UI** that the beta
rebuild deletes. Every one of them fails on a missing import:

| Spec | Wants |
|---|---|
| `item-check.test.ts` | `@/web/item-check/hotkeyable-actions` |
| `libraryChaos.test.ts` | `@/web/library/widget` |
| `create-item-filters.test.ts` | `@/web/price-check/filters/create-item-filters` |
| `skillGem.test.ts` | `@/web/price-check/filters/create-item-filters` |
| `create-stat-filters.test.ts` | `@/web/price-check/filters/create-stat-filters` |
| `missing-fracture-rules.test.ts` | `@/web/price-check/filters/interfaces` |
| `pseudo/index.test.ts` | `@/web/price-check/filters/pseudo` |
| `pathofexile-trade.test.ts` | `@/web/price-check/trade/pathofexile-trade` |
| `useTradeApi.test.ts` | `@/web/price-check/trade/trade-api` |
| `prices.test.ts` | old widget-tree config shape |
| `client-log.test.ts` | old log-event wiring |

They were **parked, not deleted**, because they encode real behaviour —
trade-query construction, filter rules, log parsing — that the new
implementations must reproduce. When each feature is rebuilt on beta, port the
spec back out of this folder.

Test runner config lives in `vitest.config.ts`, which currently only picks up
`specs/**`. Suites in this folder are intentionally excluded until ported.
