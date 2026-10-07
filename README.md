# Taksi Tarife

A Turkish, mobile-first taxi fare PWA for Northern Cyprus. Upload these files directly to GitHub Pages: no build step, backend, database, API key, paid service, or production Node process is needed.

**166 bundled route fares, 64 canonical locations, zero duplicate routes**, plus the separate **Şehir İçi — 300 ₺** manual quick fare. All supplied source labels and prices are retained on their routes. Fare lookup and local editing work offline after the complete application shell has been cached.

## Deploy directly to GitHub Pages

1. Create a GitHub repository, for example `taksi-tarife`.
2. Upload or push the files in this directory to the repository. `index.html`, `app.js`, `styles.css`, `manifest.json`, `service-worker.js`, `core.js`, `gps.js`, `.nojekyll`, `404.html`, `data/`, and `icons/` must be at the repository root. Do not put them inside another folder. Tests and this README can be uploaded too. You do not need to upload `node_modules/`.
3. Open the repository's **Settings**.
4. Choose **Pages** in the sidebar.
5. Under **Build and deployment → Source**, select **Deploy from a branch**.
6. Select **main** and **/ (root)**.
7. Click **Save**. Wait for the Pages deployment to finish.
8. Open the generated URL, such as `https://USERNAME.github.io/taksi-tarife/`. Use the final URL with its trailing slash. The app also works on a user/organization Pages site at the domain root.
9. On iPhone, open the URL in **Safari → Share → Add to Home Screen**. On Android, use the in-app install button or **Chrome menu → Install app / Add to Home screen**.

On the first visit, keep the app open online until **Ayarlar → Konum ve uygulama** says **“Tarifeler ve uygulama çevrimdışı kullanıma hazır.”** Then verify it opens in airplane mode. HTTPS is required for service workers and geolocation; GitHub Pages provides HTTPS. Double-clicking `index.html` via `file://` does not support module loading or service workers.

All application URLs are relative. Hash tabs (`#home`, `#fares`, `#favorites`, `#settings`) avoid server-side routing. `404.html` provides a recovery link for accidental missing URLs.

## Driver workflow

- The main screen is one loop: **Nereden? → Nereye? → price → Yol tarifini aç**.
- **Nereden?** contains every registered and locally saved location. Destination search handles Turkish letters, dotted/dotless I, punctuation, and aliases.
- The app looks up the exact directional pair. If that pair exists, it shows its current effective price. If it does not exist, it explicitly says **Ücret kaydı yok** and never derives or invents a price.
- Opening a map makes the selected destination the next starting point. Returning to the app is therefore immediately ready for the next passenger or return trip.
- Pop Art, Prime, Nurol and the Çilem Market taxi stand start as frequent locations. **Burayı kaydet** records a fresh device position with a user-selected 250 m–2 km matching area and adds it to frequent locations.
- **Konumumu kullan** takes a fresh reading and chooses the nearest eligible fare origin or saved favorite inside its allowed area. GPS accuracy must be ±150 m or better for automatic matching; saving a new favorite requires ±200 m or better.
- The theme button switches between **Gece** and **Gündüz**. **Ayarlar → Tema** also offers **Sisteme göre**. Choose Apple Maps, Google Maps, or ask-every-time navigation in **Ayarlar**.

**Yol tarifini aç** always asks the map provider for directions from the device's current position; the fare-origin label is never sent as the physical navigation start. If browser GPS is unavailable, Apple Maps requests Current Location and Google Maps uses its default current-location origin.

Only navigation launches an external map. Maps are not embedded. Fare lookup never contacts an external service. Navigation may require an internet connection or offline maps configured in the selected maps app.

## Local editing and backups

In **Ayarlar → Tarifeleri düzenle**, select a route, change its price, and tap **Kaydet**. For example, `POP ART → CITYMALL` can change from 450 to 500 ₺. The bundled 450 ₺ record is untouched; **Varsayılan tarifeye dön** removes that route's override.

**Özel rota ekle** accepts existing names from the suggestions or a new location name. It rejects duplicate route combinations. New locations have null coordinates. Select an added route in the editor to change or delete it. Deleting it also removes its favorites and recents. Existing bundled routes cannot be deleted.

- **Tarife değişikliklerini dışa aktar** downloads a versioned JSON file containing price overrides, local coordinate overrides, custom routes, and custom locations. Import merges it with current local changes; incoming entries with the same ID replace their local equivalents.
- **Tüm ayarları JSON olarak yedekle** also includes favorites, recents, origin, theme, and navigation preference. Importing a full backup replaces the current local state after an explicit confirmation in the app.
- **JSON verilerini içe aktar** validates the entire file before applying anything. Invalid JSON, unknown locations, invalid prices, duplicate routes, and conflicting custom IDs are rejected. File limit: 2 MB.
- **Tüm yerel tarifeleri sıfırla** removes fare overrides and custom routes/locations after confirmation. Local coordinate edits to bundled locations are retained; each has its own reset button. It retains appearance/navigation preferences and favorites/recents pointing to bundled fares. Export first if you want to preserve edits.

Local state uses the browser's `localStorage` under `taksi-tarife:v1`. It is scoped to the hosting origin, not a cloud account. Clearing website data or removing storage can erase changes; export backups for transfer between devices. If storage is unavailable or full, the app keeps working for the session and shows a message prompting JSON backup. No external synchronization occurs.

## Fare and location files

- `data/fares.js`: route IDs, canonical `from` / `to` location IDs, numeric TL prices, and preserved `fromName` / `toName` source labels.
- `data/locations.js`: canonical IDs, display names, search aliases, optional verified coordinates, navigation text, and supplied map references.
- `data/source.txt`: verbatim transcribed fare groups used by the automated audit. It is a source fixture, not a runtime dependency.
- `gps.js`: fresh device position requests, finite timeout handling, and distinct GPS failure messages.
- `core.js`: normalization, validation, effective fares, storage/import schemas, GPS distance calculations, and map URL construction.
- `app.js`: interface and browser integrations.

The following location pairs remain separate: `CITYMALL / CITYMALL 2`, `LOOF BEACH / LOOF BEACH 2`, `LIONS / LIONS 2`, `BEACH CLUB / BEACH CLUB 2`, and `POP ART / POP ART GECE`. `I.T.Ü / İTÜ`, `KALEİÇİ / KALE İÇİ`, and `K.BATI / K BATI` use canonical identities while each route retains its source label. `GRANDSAPHIRE` and `GRANDSAPPIRE` remain **separate records** with shared search aliases pending confirmation that they refer to the same place. `ZAGOTA` is a search alias for the supplied `ZAGATO` label.

The owner's subsequent location registry corrects **NUROL ARKASI** as the canonical name/ID (`nurol-arkasi`); its 12 original fares retain the source label **NURAL ARKASI**. Both spellings are searchable.

### GPS coordinates and local editing

Edit the relevant record in `data/locations.js`, preserving its ID and replacing only `lat` and `lng` with **verified numeric decimal degrees**:

```js
{
  id: "pop-art",
  name: "POP ART",
  aliases: [],
  lat: null, // replace null with a verified latitude
  lng: null, // replace null with a verified longitude
  navigationText: "POP ART, Gazimağusa, North Cyprus"
}
```

Do not put quotes around numeric coordinates. Both values must be valid together (latitude −90…90, longitude −180…180). Leave unknown values null; the app never geocodes, guesses, or resolves short map links automatically.

**43 of 64 locations have source-backed coordinates: 28 POI records and 15 area references. 21 ambiguous or unresolved labels remain null.** See [COORDINATES.md](./COORDINATES.md) for every source, point type, matching assumptions, and the complete list of pins still needed. City/region coordinates represent an area, not a taxi stand or a specific address; they do not participate in GPS origin suggestions. The owner’s supplied ÇEMBER, KYBLE ÖNÜ, and NUROL ARKASI pins are retained exactly. The Taksi Durağı point is the Göçmen Taksi listing beside Çilem Market, not Grand Aras Durak. SEMA OTEL uses the supplied Euro Tombala reference’s mapped point; TIR PARKI still requires an explicit coordinate pair. No guessed coordinates are shipped. “2” labels remain separate pending confirmation that they are Vito fare variants.

**Ayarlar → Konum koordinatları** lets the driver select any existing/custom location, enter verified latitude/longitude, point type, and an optional HTTPS source link, then save locally. Decimal commas are accepted. **Bu noktadayım · GPS kullan** fills the fields with a fresh measurement only when accuracy is ±100 m or better; saving is a separate explicit action. Only use it while physically at the selected location. Local pins appear in backups and modification exports and can be reset per location without changing bundled data. Unknown short map links are not geocoded automatically.

**Konumumu kullan** works independently of fare-coordinate coverage. It requests a fresh high-accuracy reading, reports permission denial, unavailable position, and timeout separately, and always re-enables retry. Settings show device coordinates and accuracy, but no GPS trace/history is stored. Automatic matching uses a 1 km default area for eligible POIs and the chosen 250 m–2 km area for saved favorites; reported GPS uncertainty is included at the edge. The nearest eligible point wins, so exact pin overlap is not required. HTTPS and phone/site location permission are required.

### Change bundled fares and release an update

Edit `data/fares.js` (and `data/source.txt` if intentionally changing the reference dataset). Add registry entries for any new IDs. Startup validation skips malformed records and duplicates, logs warnings, and reports skipped record counts in Settings; valid fares remain usable.

**For every published change, increment `VERSION` in `service-worker.js`**, including changes to fare data, coordinates, HTML, CSS, JS, or icons. Update the visible app version and `package.json` version as appropriate. Then push/upload all changed files to the same Pages branch.

The worker precaches a complete shell and fare dataset. It waits before replacing an active worker. A new version displays **“Yeni sürüm hazır” → “Güncelle”**; accepting activates it, removes that deployment's older cache, and reloads. Local settings and price overrides remain. Cache-first versioned assets keep the UI and fare files consistent until the update is accepted. Update checks happen on load, on returning to the app, and on reconnecting. Separate repository paths use separate cache prefixes.

## Local preview and tests (development only)

Python can serve the files for a preview:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080/`. A local HTTP server is only a development tool and is not required in production.

Core tests require Node 20+ and no installed packages:

```sh
node --test tests/core.test.js tests/gps.test.js
```

For browser checks, install the development dependency, install Chromium, and run the test:

```sh
npm install
npx playwright install chromium
CHROMIUM_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")" npm run test:browser
```

Alternatively, point `CHROMIUM_PATH` at an existing Chromium executable. The test defaults to `/usr/bin/chromium` on Linux. Neither Node nor Playwright is shipped as a runtime dependency to users.

Tests cover all 166 source prices/labels and group counts; exact directional fare lookup; explicit missing-price behavior; Turkish normalization and aliases; local price overrides; custom routes; validated JSON import/export and backups; source-backed coordinates; flexible saved-place radii; GPS permission/timeout/unavailable/poor-accuracy/far-away/invalid-sample scenarios; mobile overflow at 320×568, 375×667, 390×844, and 412×915; direct static hosting at `/` and `/taksi-tarife/`; cached offline reloads; and the service-worker update lifecycle.

The browser tests use a local static server and simulate a newer worker in its responses without modifying repository files. Review screenshots go to `review/`; other diagnostic screenshots go to the OS temporary directory. No test server, database, or third-party network request is needed by the production app.

## Home-screen review (v1.5.0)

The latest simplified mobile workflow screenshots show the [start screen](./review/yeni-akis.png) and [directional fare result](./review/yeni-akis-sonuc.png). Review images are not loaded by the app or added to the offline shell.
