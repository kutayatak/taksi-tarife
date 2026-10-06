# Verification — Taksi Tarife v1.3.0

- 166 source fares verified against data/source.txt, retaining every source label and price.
- 63 location IDs, 42 sourced coordinate pairs (27 POI, 15 area references), 21 unresolved pins. No invented GPS coordinates; source table and unresolved names in COORDINATES.md.
- Zero duplicate fare route combinations. 300 TL manual city fare remains separate.
- 17 automated core/GPS tests passed: filtering, Turkish normalization, price overrides, favorites, recents, reverse/custom routes, JSON import/export, coordinate edits, source/path audits, nearest-origin ambiguity/radius/accuracy, fresh device position, timeout guard and late callbacks.
- Chromium browser tests passed at / and /taksi-tarife/: direct static loading, all fares, touch layouts at four mobile sizes, night/day/system themes, navigation from device GPS, coordinate edit/save/reset/backup, import/export, offline reload, worker update.
- Six GPS sensor/error simulations passed: permission denied, unavailable, timeout, low accuracy, distant location, invalid sample. Lookup remains usable; successful retry preserves active fare/origin. All six retain visible search at 320×568.
- No production packages, backend, database, keys, geocoding requests, or external fare service. The only fetch calls are same-origin shell caching; external maps are opened on a driver action.
- Real iPhone/Android hardware GPS fixes and location permissions are controlled by the device and browser; tests simulate sensor behavior and do not certify on-road pickup pins.

Run npm test and npm run test:browser to reproduce. Node/Playwright/static test host are development tools only.
