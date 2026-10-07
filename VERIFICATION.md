# Verification — Taksi Tarife v1.5.1

- 166 source fares verified against data/source.txt, retaining every source label and price.
- 64 location IDs, 43 sourced coordinate pairs (28 POI, 15 area references), 21 unresolved pins. No invented GPS coordinates; source table and unresolved names in COORDINATES.md.
- Zero duplicate fare route combinations. 300 TL manual city fare remains separate.
- 18 automated core/GPS tests passed: directional fare lookup, location search, Turkish normalization, price overrides, route history, custom routes, JSON round trips, source/path audits, flexible saved-place radii, fresh device position, timeout guard and late callbacks.
- Chromium browser tests passed at `/` and `/taksi-tarife/`: destination selection, exact directional price, explicit missing-price state, navigation-to-next-origin handoff, fresh GPS favorite saving, 1 km saved-place matching, four touch layouts, offline reload and worker update.
- Driver-loop checks passed: `POP ART → KALE İÇİ` shows 500 ₺; opening navigation makes KALE İÇİ the next origin; `KALE İÇİ → POP ART` shows no invented amount because that direction is absent; `PRIME → CITYMALL` shows 375 ₺.
- Six GPS sensor/error simulations passed: permission denied, unavailable, timeout, low accuracy, distant location and invalid sample.
- No production packages, backend, database, keys, geocoding requests, or external fare service. The only fetch calls are same-origin shell caching; external maps are opened on a driver action.
- Real iPhone/Android hardware GPS fixes and location permissions are controlled by the device and browser; tests simulate sensor behavior and do not certify on-road pickup pins.

Run npm test and npm run test:browser to reproduce. Node/Playwright/static test host are development tools only.
