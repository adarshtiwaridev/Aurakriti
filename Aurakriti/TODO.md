# TODO - Issue #49 follow-up

- [x] Add/adjust missing sample data required by repo owner (carousel): added scripts/seed-carousel.mjs + seed:carousel

- [ ] Locate failing route/UI from Issue #49 description and previous PR changes (carousel/seed/admin/AI pages likely missing sample Mongo data)

- [x] Implement data insertion or safer fallback so the “some data” requirement is met deterministically (carousel seeded)

- [ ] Ensure seed scripts exist/run cleanly (seed:products already present)
- [ ] Update any affected JSON/static data (e.g., src/app/data/products.json)
- [ ] Run lint/build/tests (npm run lint, npm run build) and seed scripts if needed

