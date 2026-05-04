# TODO: Issue #12 - Advanced Product Filtering & Smart Search (Minimal)

## Steps:
- [x] 1. Read relevant files: api/products/route.js, models/Product.js
- [x] 2. Update src/models/Product.js: Add indexes for perf
- [x] 3. Update src/app/api/products/route.js: Server-side filters (priceMin/Max, ratingGte, inStock, brands, sortBy)
- [x] 4. Update src/app/shop/page.js: URL params sync, replace client filter with server fetch
- [x] 5. Test: npm run dev, check URL persistence, filters, perf
- [ ] 6. Commit & PR

Minimal scope: Extend existing, no new deps/UI.
