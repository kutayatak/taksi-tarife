import { baseFares, dataProblems, cityFare, normalize, routeId, readState, saveState, allLocations, effectiveFares, originsFor, searchFares, remember, toggleFavorite, modificationExport, importInto, coordinatesExist, nearestOrigin, suggestedOrigin, navigationURL } from './core.js';
import { getDevicePosition, gpsErrorMessage } from './gps.js';
const $ = id => document.getElementById(id);
const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text !== undefined) n.textContent = text; return n; };
const icon = name => { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); const use = document.createElementNS(svg.namespaceURI, 'use'); use.setAttribute('href', `#i-${name}`); svg.append(use); svg.setAttribute('aria-hidden', 'true'); return svg; };
const price = n => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n) + ' ₺';
let toastTimer, pendingWarning;
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000); }
let storage;
try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; pendingWarning = 'Tarayıcı kayıt izni vermiyor. Değişiklikler bu oturumda kullanılabilir.'; }
let state = readState(storage, message => { pendingWarning = message; });
let rows, locations, locationMap, originChoices, selectedId = null, activePage = 'home', gpsSuggestion = null, deferredInstall = null, waitingWorker = null, registration = null;
function refreshData() { rows = effectiveFares(state); locations = allLocations(state); locationMap = new Map(locations.map(l => [l.id, l])); originChoices = originsFor(rows, locations); }
function persist() { if (!saveState(storage, state)) { toast('Kayıt yapılamadı. Değişiklikler bu oturumda kullanılabilir; JSON yedeği alın.'); return false; } return true; }
const getRoute = id => id === cityFare.id ? cityFare : rows.find(r => r.id === id);
const names = r => r.id === cityFare.id ? { from: 'MANUEL HIZLI TARİFE', to: 'ŞEHİR İÇİ' } : { from: r.fromName || locationMap.get(r.from)?.name || r.from, to: r.toName || locationMap.get(r.to)?.name || r.to };
function option(value, text) { const n = el('option', '', text); n.value = value; return n; }
function fillOrigins() {
  $('origin').replaceChildren(option('', 'Tüm başlangıçlar'), ...originChoices.map(l => option(l.id, l.name)));
  $('origin').value = state.settings.origin;
  const previous = $('all-origin').value;
  $('all-origin').replaceChildren(option('', 'Tüm başlangıçlar'), ...originChoices.map(l => option(l.id, l.name)));
  $('all-origin').value = originChoices.some(l => l.id === previous) ? previous : '';
}
function routeButton(r, quick = false) {
  const n = names(r), button = el('button', quick ? 'quick-route' : 'route-row'); button.type = 'button'; button.dataset.route = r.id;
  button.setAttribute('aria-label', `${n.from}, ${n.to}, ${price(r.price)}`);
  const info = el('span', 'route-info'); info.append(el('small', '', n.from), el('span', 'destination-name', n.to));
  button.append(info, el('strong', '', price(r.price)));
  if (!quick) button.append(icon('arrow'));
  return button;
}
function listRoutes(target, list, empty, quick = false, grouped = false) {
  const fragment = document.createDocumentFragment(); let lastOrigin;
  for (const r of list) {
    if (grouped && r.from !== lastOrigin) { fragment.append(el('h2', 'group-title', names(r).from)); lastOrigin = r.from; }
    fragment.append(routeButton(r, quick));
  }
  if (!list.length) fragment.append(el('p', 'empty-card', empty));
  target.replaceChildren(fragment);
}
function renderHome() {
  updateGPSSuggestion();
  const query = $('destination').value.trim();
  $('clear-search').hidden = !query;
  $('home-search').hidden = !query;
  $('fare-result').hidden = !!query || !selectedId;
  if (query) {
    const matches = searchFares(rows, locations, query, state.settings.origin);
    $('home-count').textContent = `${matches.length} rota${state.settings.origin ? ' · Seçili başlangıç önce gösterilir' : ''}`;
    listRoutes($('home-results'), matches, 'Bu arama için tarife bulunamadı. Başka bir ad deneyin.', false, true);
  } else if (selectedId) renderResult();
  $('frequent-section').hidden = !!selectedId || !!query;
  listRoutes($('home-recents'), state.recents.map(getRoute).filter(Boolean), 'Son baktığınız rotalar burada görünecek.');
  const current = rows.filter(r => r.from === state.settings.origin);
  const useful = [...current].sort((a, b) => Number(normalize(names(b).to).startsWith('kale')) - Number(normalize(names(a).to).startsWith('kale')) || Number(b.to === 'citymall') - Number(a.to === 'citymall') || a.price - b.price).slice(0, 6);
  const frequent = [...new Set([...state.favorites, ...state.recents, ...useful.map(r => r.id)])].map(getRoute).filter(Boolean).slice(0, 6);
  $('frequent-description').textContent = state.favorites.length || state.recents.length ? 'Favoriler + son rotalar · Kaydırın' : 'Önerilen rotalar · Kaydırın';
  const previousScroll = $('home-favorites').scrollLeft;
  listRoutes($('home-favorites'), frequent, 'Hızlı rotalar için bir başlangıç seçin veya bir rotayı favorilere ekleyin.', true);
  $('home-favorites').scrollLeft = previousScroll;
}
function action(text, className, handler, iconName) { const button = el('button', className, text); if (iconName) button.prepend(icon(iconName)); button.addEventListener('click', handler); return button; }
function renderResult() {
  const r = getRoute(selectedId); if (!r) { selectedId = null; $('fare-result').hidden = true; return; }
  const n = names(r), card = el('div', 'fare-card'), route = el('div', 'fare-route');
  route.append(el('span', 'from', n.from)); if (r.id !== cityFare.id) route.append(el('span', 'down', '↓')); route.append(el('span', '', n.to));
  const p = el('div', 'fare-price', new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(r.price)); p.append(el('span', '', ' ₺'));
  card.append(route, p, el('p', 'fare-caption', r.id === cityFare.id ? 'Manuel tarife · Listeli rota ücretlerini değiştirmez' : r.overridden || r.custom ? 'Bu cihazdaki özel tarife · TL' : 'Kayıtlı rota ücreti · TL'));
  const actions = el('div', 'fare-actions');
  if (r.id !== cityFare.id) actions.append(action('Bulunduğum Konumdan Git', 'primary-button', () => launchNavigationTo(locationMap.get(r.to), names(r).to), 'nav'));
  const starred = state.favorites.includes(r.id);
  actions.append(action(starred ? 'Favorilerden çıkar' : 'Favoriye Ekle', 'secondary-button', () => {
    if (!toggleFavorite(state, r.id)) return toast('En fazla 100 favori kaydedilebilir.');
    persist(); renderHome(); renderFavorites();
  }, 'star'));
  card.append(actions);
  if (r.id !== cityFare.id) {
    const reverse = rows.find(x => x.from === r.to && x.to === r.from);
    const tools = el('div', 'fare-tools');
    if (reverse) tools.append(action(`Ters yön · ${price(reverse.price)}`, 'secondary-button', () => selectRoute(reverse.id)));
    tools.append(action('Tarifeyi düzenle', 'secondary-button', () => { location.hash = 'settings'; renderSettings(); $('edit-route').value = r.id; renderEditor(); $('edit-route').scrollIntoView({ block: 'center' }); }));
    card.append(tools);
  }
  card.append(action('Yeni rota ara', 'text-button', () => { selectedId = null; renderHome(); $('destination').focus(); }));
  $('fare-result').replaceChildren(card);
}
function selectRoute(id) {
  const r = getRoute(id); if (!r) return;
  selectedId = id;
  if (r.from) { state.settings.origin = r.from; $('origin').value = r.from; }
  remember(state, id); persist(); $('destination').value = ''; $('destination').blur(); location.hash = 'home'; renderHome();
  $('fare-result').scrollIntoView({ block: 'start', behavior: 'instant' });
}
function renderFares() {
  const origin = $('all-origin').value;
  const matches = searchFares(origin ? rows.filter(r => r.from === origin) : rows, locations, $('all-search').value);
  $('all-count').textContent = `${matches.length} rota · Ücretler TL`;
  listRoutes($('all-results'), matches, 'Bu filtre için tarife bulunamadı.', false, !origin);
}
function renderFavorites() { listRoutes($('favorite-results'), state.favorites.map(getRoute).filter(Boolean), 'Henüz favori yok. Bir rota açıp “Favoriye Ekle” düğmesine dokunun.'); }
function renderSettings() {
  $('theme').value = state.settings.theme; $('navigation').value = state.settings.navigation;
  const previous = $('edit-route').value;
  $('edit-route').replaceChildren(...rows.map(r => { const n = names(r); return option(r.id, `${n.from} → ${n.to}`); }));
  if (rows.some(r => r.id === previous)) $('edit-route').value = previous;
  $('location-options').replaceChildren(...locations.map(l => option(l.name, l.name)));
  $('data-status').textContent = `${baseFares.length} varsayılan rota · ${state.customRoutes.length} özel rota · ${Object.keys(state.overrides).length} fiyat değişikliği${dataProblems.length ? ` · ${dataProblems.length} geçersiz kayıt atlandı` : ''}`;
  renderEditor(); renderCoordinates(); updatePermission();
}
function renderEditor() {
  const r = getRoute($('edit-route').value); if (!r) return;
  $('edit-price').value = r.price;
  const base = baseFares.find(x => x.id === r.id);
  $('original-price').textContent = base ? `Varsayılan ücret: ${price(base.price)}` : 'Bu rota yerel olarak eklendi.';
  $('reset-route').hidden = !base; $('reset-route').disabled = !r.overridden; $('delete-route').hidden = !r.custom;
}
function refreshAll() { refreshData(); fillOrigins(); fillNavigationTargets(); renderHome(); renderFares(); renderFavorites(); renderSettings(); applyTheme(); }
function showPage() {
  activePage = ['home', 'fares', 'favorites', 'settings'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  document.querySelectorAll('.page').forEach(p => { p.hidden = p.id !== `page-${activePage}`; });
  document.querySelectorAll('[data-tab]').forEach(a => { if (a.dataset.tab === activePage) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (activePage === 'fares') renderFares(); if (activePage === 'favorites') renderFavorites(); if (activePage === 'settings') renderSettings();
  if (activePage === 'home' && selectedId && !$('destination').value.trim()) $('fare-result').scrollIntoView({ block: 'start', behavior: 'instant' });
  else window.scrollTo({ top: 0, behavior: 'instant' });
}
function applyTheme() {
  const theme = state.settings.theme === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' : state.settings.theme;
  document.documentElement.dataset.theme = theme;
  const next = theme === 'dark' ? 'Gündüz' : 'Gece';
  $('theme-label').textContent = next;
  $('theme-toggle').setAttribute('aria-label', `${next} moduna geç`);
  $('theme-toggle').title = `${next} moduna geç`;
  $('theme-toggle').querySelector('use').setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#111513' : '#f4f5ee';
}
function fillNavigationTargets() {
  const previous = $('navigation-target').value;
  $('navigation-target').replaceChildren(option('', 'Hedef konum seçin'), ...[...locations].sort((a, b) => a.name.localeCompare(b.name, 'tr')).map(l => option(l.id, l.name)));
  if (locationMap.has(previous)) $('navigation-target').value = previous;
  $('navigate-current').disabled = !$('navigation-target').value;
}
let navigationRequest = 0;
function launchNavigationTo(l, label = l?.name) {
  if (!l) return;
  // Map providers use the device's current location, never the fare's origin.
  if (state.settings.navigation !== 'ask') { window.open(navigationURL(l, state.settings.navigation), '_blank', 'noopener,noreferrer'); return; }
  const request = ++navigationRequest;
  $('navigation-start').textContent = 'Başlangıç: Bulunduğum konum';
  $('navigation-destination').textContent = `Hedef: ${label}${l.coordinateKind === "area" ? " · Bölge referans noktası" : ""}`;
  const setLinks = coords => { $('apple-link').href = navigationURL(l, 'apple', coords); $('google-link').href = navigationURL(l, 'google', coords); };
  setLinks(null);
  const iPhone = /iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const first = iPhone ? $('apple-link') : $('google-link'), second = iPhone ? $('google-link') : $('apple-link');
  first.className = 'primary-button'; second.className = 'secondary-button'; $('navigation-dialog').insertBefore(first, $('navigation-dialog').querySelector('p:last-child')); $('navigation-dialog').insertBefore(second, $('navigation-dialog').querySelector('p:last-child'));
  $('navigation-dialog').showModal();
  // Refresh device GPS without waiting to open the chooser. If unavailable,
  // map links still request current-location directions in the map app.
  navigator.geolocation?.getCurrentPosition(position => {
    if ($('navigation-dialog').open && request === navigationRequest && position.coords.accuracy <= 150) setLinks(position.coords);
    updatePermission();
  }, () => { updatePermission(); }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
}
$('navigation-target').onchange = () => { $('navigate-current').disabled = !$('navigation-target').value; };
$('navigate-current').onclick = () => launchNavigationTo(locationMap.get($('navigation-target').value));
document.querySelector('[data-tab="home"]').addEventListener('click', () => { selectedId = null; $('destination').value = ''; renderHome(); showPage(); });

let confirmCallback;
function confirmAction(title, description, callback) { $('confirm-title').textContent = title; $('confirm-description').textContent = description; confirmCallback = callback; $('confirm-dialog').showModal(); }
$('confirm-cancel').onclick = () => { confirmCallback = null; $('confirm-dialog').close(); };
$('confirm-accept').onclick = () => { $('confirm-dialog').close(); const callback = confirmCallback; confirmCallback = null; callback?.(); };
document.querySelectorAll('[data-close-dialog]').forEach(b => b.onclick = () => b.closest('dialog').close());
for (const id of ['apple-link', 'google-link']) $(id).addEventListener('click', () => $('navigation-dialog').close());
document.addEventListener('click', e => { const button = e.target.closest('[data-route]'); if (button) selectRoute(button.dataset.route); });
$('origin').addEventListener('change', () => { state.settings.origin = $('origin').value; selectedId = null; persist(); renderHome(); });
$('destination').addEventListener('input', renderHome);
$('clear-search').onclick = () => { $('destination').value = ''; renderHome(); $('destination').focus(); };
$('all-search').addEventListener('input', renderFares); $('all-origin').addEventListener('change', renderFares);
$('city-fare').onclick = () => selectRoute(cityFare.id);
window.addEventListener('hashchange', showPage);
$('theme').onchange = () => { state.settings.theme = $('theme').value; persist(); applyTheme(); };
$('theme-toggle').onclick = () => { state.settings.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; persist(); applyTheme(); $('theme').value = state.settings.theme; };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (state.settings.theme === 'system') applyTheme(); });
$('navigation').onchange = () => { state.settings.navigation = $('navigation').value; persist(); };
$('edit-route').onchange = renderEditor;
$('edit-form').onsubmit = e => {
  e.preventDefault(); const r = getRoute($('edit-route').value), value = Number($('edit-price').value);
  if (!r || !Number.isFinite(value) || value <= 0 || value > 1000000) return toast('Geçerli, sıfırdan büyük bir ücret girin.');
  if (r.custom) state.customRoutes.find(x => x.id === r.id).price = value;
  else if (baseFares.find(x => x.id === r.id).price === value) delete state.overrides[r.id]; else state.overrides[r.id] = value;
  const saved = persist(); refreshAll(); if (saved) toast('Tarife bu cihazda kaydedildi.');
};
$('reset-route').onclick = () => { delete state.overrides[$('edit-route').value]; const saved = persist(); refreshAll(); if (saved) toast('Varsayılan ücret geri yüklendi.'); };
$('delete-route').onclick = () => {
  const id = $('edit-route').value;
  confirmAction('Özel rota silinsin mi?', 'Bu rota favorilerinizden ve son kullanılanlardan da kaldırılacak.', () => {
    state.customRoutes = state.customRoutes.filter(r => r.id !== id); state.favorites = state.favorites.filter(r => r !== id); state.recents = state.recents.filter(r => r !== id);
    if (selectedId === id) selectedId = null;
    if (!state.customRoutes.some(r => r.from === state.settings.origin) && !baseFares.some(r => r.from === state.settings.origin)) state.settings.origin = 'pop-art';
    persist(); refreshAll();
  });
};
function resolveLocation(name, pending) {
  const clean = name.trim(); if (!clean || clean.length > 100) throw new Error('Konum adı 1–100 karakter olmalı.');
  const all = [...locations, ...pending];
  let matches = all.filter(l => normalize(l.name) === normalize(clean));
  if (!matches.length) matches = all.filter(l => l.aliases.some(a => normalize(a) === normalize(clean)));
  if (matches.length > 1) throw new Error('Bu ad birden fazla konumla eşleşiyor. Listeden tam adı seçin.');
  if (matches.length) return matches[0];
  const id = `custom-${normalize(clean) || Date.now()}-${Date.now().toString(36)}-${pending.length}`;
  const l = { id, name: clean.toLocaleUpperCase('tr-TR'), aliases: [], lat: null, lng: null, navigationText: `${clean}, Gazimağusa, North Cyprus` }; pending.push(l); return l;
}
$('add-form').onsubmit = e => {
  e.preventDefault();
  try {
    const pending = [], from = resolveLocation($('add-from').value, pending), to = resolveLocation($('add-to').value, pending), value = Number($('add-price').value);
    if (!Number.isFinite(value) || value <= 0 || value > 1000000) throw new Error('Geçerli bir ücret girin.');
    const id = routeId(from.id, to.id); if (rows.some(r => r.from === from.id && r.to === to.id)) throw new Error('Bu rota zaten var. Tarifeleri düzenle bölümünden fiyatı değiştirin.');
    state.customLocations.push(...pending); state.customRoutes.push({ id, from: from.id, to: to.id, price: value }); const saved = persist(); refreshAll(); $('add-form').reset(); $('edit-route').value = id; renderEditor(); if (saved) toast('Özel rota eklendi.');
  } catch (err) { toast(err.message); }
};
function exportJSON(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const a = el('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
$('export-mods').onclick = () => exportJSON(modificationExport(state), 'taksi-tarife-degisiklikler.json');
$('export-backup').onclick = () => exportJSON({ ...state, kind: 'taksi-tarife-backup' }, 'taksi-tarife-yedek.json');
$('import-file').onchange = async () => {
  const file = $('import-file').files[0]; $('import-file').value = ''; if (!file) return;
  try {
    if (file.size > 2000000) throw new Error('Dosya en fazla 2 MB olmalı.');
    const value = JSON.parse(await file.text()); const next = importInto(state, value);
    confirmAction('Veriler içe aktarılsın mı?', value.kind === 'taksi-tarife-backup' ? `Tam yedek: ${next.customRoutes.length} özel rota ve ${Object.keys(next.overrides).length} fiyat değişikliği. Mevcut ayarlar, favoriler ve geçmiş bu yedekle değiştirilecek.` : `${Object.keys(value.overrides).length} fiyat değişikliği ve ${value.customRoutes.length} özel rota mevcut verilerle birleştirilecek.`, () => { state = next; selectedId = null; const saved = persist(); refreshAll(); if (saved) toast('Veriler başarıyla içe aktarıldı.'); });
  } catch (err) { toast(err instanceof SyntaxError ? 'JSON dosyası okunamadı. Verileriniz değiştirilmedi.' : err.message); }
};
$('reset-all').onclick = () => confirmAction('Varsayılan tarifelere dönülsün mü?', 'Tüm fiyat değişiklikleri ve özel rotalar silinir. Tema ve navigasyon tercihleriniz korunur. Önce JSON yedeği alabilirsiniz.', () => {
  const ids = new Set([...baseFares.map(r => r.id), cityFare.id]);
  for (const l of state.customLocations) delete state.coordinateOverrides[l.id];
  state.overrides = {}; state.customRoutes = []; state.customLocations = []; state.favorites = state.favorites.filter(id => ids.has(id)); state.recents = state.recents.filter(id => ids.has(id));
  if (!baseFares.some(r => r.from === state.settings.origin)) state.settings.origin = 'pop-art'; selectedId = null; persist(); refreshAll();
});
$('clear-recents').onclick = () => confirmAction('Son kullanılanlar temizlensin mi?', 'Son 10 rota geçmişi silinecek.', () => { state.recents = []; persist(); renderHome(); });
$('clear-favorites').onclick = () => confirmAction('Favoriler temizlensin mi?', 'Kaydettiğiniz tüm favori rotalar kaldırılacak.', () => { state.favorites = []; persist(); renderHome(); renderFavorites(); });
let permissionStatus, locating = null, latestPosition = null;
async function updatePermission() {
  if (!isSecureContext) { $('location-status').textContent = 'Konum izni: HTTPS adresi gerekli.'; return; }
  if (!navigator.geolocation) { $('location-status').textContent = 'Konum: bu tarayıcı desteklemiyor.'; return; }
  try {
    permissionStatus ||= await navigator.permissions.query({ name: 'geolocation' });
    permissionStatus.onchange = () => updatePermission();
    const labels = { granted: 'verildi', denied: 'reddedildi', prompt: 'henüz istenmedi' };
    $('location-status').textContent = `Konum izni: ${labels[permissionStatus.state]}`;
  } catch { $('location-status').textContent = 'Konum izni: tarayıcı tarafından yönetilir.'; }
}
function updateGPSSuggestion() {
  const available = !!gpsSuggestion && gpsSuggestion.location.id !== state.settings.origin;
  $('gps-suggestion').hidden = !available;
  $('origin').closest('.origin-card').classList.toggle('has-suggestion', available);
}
const distanceLabel = distance => distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
function displayPosition(position) {
  const c = position.coords;
  gpsSuggestion = suggestedOrigin(c, originChoices);
  const closest = nearestOrigin(c, locations.filter(l => l.coordinateKind !== 'area'));
  const details = `Konum alındı: ${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)} · Doğruluk ±${Math.round(c.accuracy)} m`;
  $('gps-details').textContent = details;
  if (gpsSuggestion) {
    const l = gpsSuggestion.location, distance = distanceLabel(gpsSuggestion.distance);
    $('gps-message').textContent = `${l.name} • ${distance}`;
    $('gps-suggestion').textContent = `${l.name} · ${distance} seç`;
    $('gps-suggestion').setAttribute('aria-label', `${l.name} başlangıcını seç, ${distance}`);
  } else if (c.accuracy > 150) {
    $('gps-message').textContent = 'GPS hassasiyeti düşük · Tekrar deneyin';
    $('gps-details').textContent += ' · Hassasiyet düşük; başlangıç önerilmedi.';
  } else {
    $('gps-message').textContent = 'Konum alındı · Başlangıcı elle seçin';
    $('gps-details').textContent += closest ? ` · En yakın kayıt: ${closest.location.name}, ${distanceLabel(closest.distance)}. Yakın ve kesin bir başlangıç yok.` : ' · Kayıtlı nokta koordinatı yok.';
  }
  updateGPSSuggestion();
}
function locate(automatic = false) {
  if (locating) return locating;
  gpsSuggestion = null; updateGPSSuggestion();
  for (const id of ['locate', 'settings-locate', 'coordinate-use-gps']) $(id).disabled = true;
  $('gps-message').textContent = 'Konum bulunuyor…'; $('gps-details').textContent = 'Güncel GPS ölçümü bekleniyor…';
  locating = getDevicePosition().then(position => {
    latestPosition = position; displayPosition(position); return position;
  }).catch(error => {
    latestPosition = null; gpsSuggestion = null; updateGPSSuggestion();
    $('gps-message').textContent = error.code === 1 ? 'Konum izni kapalı · Elle seçim' : 'Konum alınamadı · Tekrar deneyin';
    $('gps-details').textContent = gpsErrorMessage(error);
    if (!automatic) toast(gpsErrorMessage(error));
    return null;
  }).finally(() => {
    locating = null;
    for (const id of ['locate', 'settings-locate', 'coordinate-use-gps']) $(id).disabled = false;
    updatePermission();
  });
  return locating;
}
$('locate').onclick = () => locate(); $('settings-locate').onclick = () => locate();
$('gps-suggestion').onclick = () => {
  if (!gpsSuggestion) return;
  state.settings.origin = gpsSuggestion.location.id; $('origin').value = state.settings.origin;
  selectedId = null; persist(); renderHome();
};
function renderCoordinates() {
  const current = $('coordinate-location').value;
  const sorted = [...locations].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  $('coordinate-location').replaceChildren(...sorted.map(l => option(l.id, `${l.name}${coordinatesExist(l) ? '' : ' · Eksik'}`)));
  if (locationMap.has(current)) $('coordinate-location').value = current;
  const count = locations.filter(coordinatesExist).length;
  $('coordinate-coverage').textContent = `${count} / ${locations.length} konumda koordinat var · ${locations.length - count} eksik`;
  renderCoordinateEditor();
  if (latestPosition) displayPosition(latestPosition);
  else { gpsSuggestion = null; updateGPSSuggestion(); }
}
function renderCoordinateEditor() {
  const l = locationMap.get($('coordinate-location').value); if (!l) return;
  $('coordinate-lat').value = l.lat ?? ''; $('coordinate-lng').value = l.lng ?? '';
  $('coordinate-kind').value = l.coordinateKind || 'poi';
  $('coordinate-source').value = l.coordinateSource || l.mapsUrl || '';
  $('coordinate-reset').disabled = !state.coordinateOverrides[l.id];
  const info = $('coordinate-info');
  info.textContent = l.locallyEdited ? 'Bu cihazdaki yerel nokta.' : coordinatesExist(l) ? `${l.sourceName || l.referenceName || l.name}${l.coordinateKind === 'area' ? ' · Bölge referansı; tam durak değil.' : ' · Kayıtlı harita noktası.'}` : 'Nokta doğrulanmadı. Navigasyonda hedef adı aranır.';
  if (l.coordinateNote && !l.locallyEdited) info.append(document.createTextNode(` ${l.coordinateNote}`));
  const source = l.coordinateSource || l.mapsUrl;
  if (source && /^https:\/\//.test(source)) { const a = el('a', '', 'Kaynağı aç'); a.href = source; a.target = '_blank'; a.rel = 'noopener noreferrer'; info.append(document.createTextNode(' '), a); }
}
$('coordinate-location').onchange = renderCoordinateEditor;
$('coordinate-use-gps').onclick = async () => {
  const id = $('coordinate-location').value;
  const position = await locate();
  if (!position || $('coordinate-location').value !== id) return;
  if (position.coords.accuracy > 100) return toast('Konum hassasiyeti düşük. Kaydetmeden önce açık alanda yeniden deneyin.');
  $('coordinate-lat').value = position.coords.latitude; $('coordinate-lng').value = position.coords.longitude;
  $('coordinate-kind').value = 'poi'; $('coordinate-source').value = '';
  toast('GPS değerleri dolduruldu. Doğru noktadaysanız Kaydet düğmesine dokunun.');
};
$('coordinate-form').onsubmit = event => {
  event.preventDefault();
  const number = value => value.trim() ? Number(value.trim().replace(',', '.')) : NaN;
  const pin = { lat: number($('coordinate-lat').value), lng: number($('coordinate-lng').value), coordinateKind: $('coordinate-kind').value, coordinateSource: $('coordinate-source').value.trim(), locallyEdited: true };
  if (!coordinatesExist(pin)) return toast('Geçerli enlem (−90…90) ve boylam (−180…180) girin.');
  if (pin.coordinateSource && !/^https:\/\//.test(pin.coordinateSource)) return toast('Kaynak bağlantısı https:// ile başlamalı.');
  state.coordinateOverrides[$('coordinate-location').value] = pin; persist(); refreshAll(); toast('Koordinatlar bu cihazda kaydedildi. JSON yedeğine dahil edilir.');
};
$('coordinate-reset').onclick = () => {
  delete state.coordinateOverrides[$('coordinate-location').value]; persist(); refreshAll(); toast('Bu konumun varsayılan koordinatları geri yüklendi.');
};
function connectionStatus() { $('connection-label').textContent = navigator.onLine ? 'Hazır' : 'Çevrimdışı'; }
window.addEventListener('online', () => { connectionStatus(); registration?.update().catch(() => {}); }); window.addEventListener('offline', connectionStatus);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; $('install').textContent = 'Uygulamayı yükle'; });
window.addEventListener('appinstalled', () => { deferredInstall = null; $('install').textContent = 'Uygulama yüklendi'; });
$('install').onclick = async () => {
  if (deferredInstall) { await deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; }
  else toast(/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'Safari → Paylaş → Ana Ekrana Ekle' : 'Tarayıcı menüsü → Uygulamayı yükle / Ana ekrana ekle');
};
async function setupWorker() {
  if (!('serviceWorker' in navigator)) { $('offline-status').textContent = 'Bu tarayıcı çevrimdışı kurulumu desteklemiyor.'; return; }
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!waitingWorker || refreshing) return; refreshing = true; window.location.reload(); });
  try {
    const hadController = !!navigator.serviceWorker.controller;
    registration = await navigator.serviceWorker.register(new URL('./service-worker.js', import.meta.url), { scope: './', updateViaCache: 'none' });
    const showUpdate = () => { waitingWorker = registration.waiting; if (waitingWorker) $('update-banner').hidden = false; };
    if (registration.waiting) showUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed') { if (hadController || navigator.serviceWorker.controller) showUpdate(); else $('offline-status').textContent = 'Tarifeler çevrimdışı kullanıma hazır.'; } if (worker.state === 'redundant') $('offline-status').textContent = 'Çevrimdışı kurulum tamamlanamadı. İnternet bağlantısıyla tekrar açın.'; });
    });
    await navigator.serviceWorker.ready;
    $('offline-status').textContent = 'Tarifeler ve uygulama çevrimdışı kullanıma hazır.';
    registration.update().catch(() => {});
  } catch { $('offline-status').textContent = 'Çevrimdışı kurulum başarısız. HTTPS üzerinden tekrar açın.'; }
}
$('update-button').onclick = () => { if (waitingWorker) { $('update-button').disabled = true; waitingWorker.postMessage({ type: 'SKIP_WAITING' }); } };
document.addEventListener('visibilitychange', () => { if (!document.hidden) registration?.update().catch(() => {}); });
window.addEventListener('storage', e => { if (e.key === 'taksi-tarife:v1') { state = readState(storage, toast); refreshAll(); } });
refreshAll(); showPage(); connectionStatus();
if (originChoices.some(l => coordinatesExist(l) && l.coordinateKind !== 'area')) locate(true);
setupWorker();
if (pendingWarning) toast(pendingWarning);
