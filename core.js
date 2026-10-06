import { fares as rawFares, cityFare } from './data/fares.js';
import { locations as bundledLocations } from './data/locations.js';
export { cityFare };
export const STORAGE_KEY = 'taksi-tarife:v1';
export const normalize = value => String(value ?? '').replace(/[ıİI]/g, 'i').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
export const routeId = (from, to) => `${from}--${to}`;
export function validateFares(rows, locations) {
  const valid = [], problems = [], seen = new Set(), ids = new Set();
  const known = new Set(locations.map(l => l.id));
  if (!Array.isArray(rows)) return { valid, problems: ['Tarife listesi geçersiz.'] };
  rows.forEach((r, index) => {
    const key = r && routeId(r.from, r.to);
    if (!r || typeof r.id !== 'string' || !r.id || !known.has(r.from) || !known.has(r.to) || typeof r.price !== 'number' || !Number.isFinite(r.price) || r.price <= 0 || r.price > 1000000 || (r.fromName !== undefined && typeof r.fromName !== 'string') || (r.toName !== undefined && typeof r.toName !== 'string')) problems.push(`Geçersiz tarife: ${index + 1}`);
    else if (seen.has(key) || ids.has(r.id)) problems.push(`Tekrarlanan tarife: ${key}`);
    else { seen.add(key); ids.add(r.id); valid.push({ ...r }); }
  });
  return { valid, problems };
}
const checked = validateFares(rawFares, bundledLocations);
export const baseFares = checked.valid;
export const dataProblems = checked.problems;
if (dataProblems.length) console.warn('Tarife doğrulama:', dataProblems);
export const defaultState = () => ({ schemaVersion: 1, overrides: {}, coordinateOverrides: {}, customRoutes: [], customLocations: [], favorites: [], recents: [], settings: { theme: 'dark', navigation: 'ask', origin: 'pop-art' } });
const isObject = o => o !== null && typeof o === 'object' && !Array.isArray(o);
const validPrice = n => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 1000000;
export function parseImport(value, backup = false) {
  if (!isObject(value) || value.schemaVersion !== 1) throw new Error('Desteklenen biçim: sürüm 1 Taksi Tarife JSON.');
  const result = defaultState();
  if (!isObject(value.overrides) || !Array.isArray(value.customRoutes) || !Array.isArray(value.customLocations)) throw new Error('Tarife dosyasının yapısı geçersiz.');
  if (value.customRoutes.length > 5000 || value.customLocations.length > 1000) throw new Error('Dosya çok fazla kayıt içeriyor.');
  const known = new Set(bundledLocations.map(l => l.id));
  result.customLocations = value.customLocations.map(l => {
    if (!isObject(l) || typeof l.id !== 'string' || !/^custom-[a-z0-9-]+$/.test(l.id) || known.has(l.id) || typeof l.name !== 'string' || !l.name.trim() || l.name.length > 100 || !Array.isArray(l.aliases) || l.aliases.some(a => typeof a !== 'string' || a.length > 100) || l.aliases.length > 30) throw new Error('Özel konum geçersiz veya tekrarlanıyor.');
    const coords = l.lat == null && l.lng == null || typeof l.lat === 'number' && typeof l.lng === 'number' && Number.isFinite(l.lat) && Number.isFinite(l.lng) && Math.abs(l.lat) <= 90 && Math.abs(l.lng) <= 180;
    if (!coords) throw new Error('Konum koordinatları geçersiz.');
    known.add(l.id);
    return { id: l.id, name: l.name.trim(), aliases: l.aliases, lat: l.lat ?? null, lng: l.lng ?? null, navigationText: typeof l.navigationText === 'string' ? l.navigationText.slice(0, 250) : `${l.name}, North Cyprus` };
  });
  const locations = [...bundledLocations, ...result.customLocations];
  if (value.coordinateOverrides !== undefined) {
    if (!isObject(value.coordinateOverrides)) throw new Error('Konum değişiklikleri geçersiz.');
    for (const [id, pin] of Object.entries(value.coordinateOverrides)) {
      if (!known.has(id) || !isObject(pin) || !coordinatesExist(pin) || !['poi', 'area'].includes(pin.coordinateKind)) throw new Error('Konum değişikliği geçersiz veya konum bilinmiyor.');
      if (pin.coordinateSource && (typeof pin.coordinateSource !== 'string' || pin.coordinateSource.length > 500 || !/^https:\/\//.test(pin.coordinateSource))) throw new Error('Konum kaynağı HTTPS bağlantısı olmalı.');
      result.coordinateOverrides[id] = { lat: pin.lat, lng: pin.lng, coordinateKind: pin.coordinateKind, coordinateSource: pin.coordinateSource || '', locallyEdited: true };
    }
  }
  const custom = validateFares(value.customRoutes, locations);
  if (custom.problems.length) throw new Error(custom.problems[0]);
  const baseIds = new Set(baseFares.map(r => r.id));
  const baseKeys = new Set(baseFares.map(r => routeId(r.from, r.to)));
  result.customRoutes = custom.valid.map(r => {
    if (r.id !== routeId(r.from, r.to) || baseIds.has(r.id) || baseKeys.has(routeId(r.from, r.to))) throw new Error('Özel rota varsayılan bir tarifeyle çakışıyor.');
    return { id: r.id, from: r.from, to: r.to, price: r.price };
  });
  for (const [id, price] of Object.entries(value.overrides)) {
    if (!baseIds.has(id) || !validPrice(price)) throw new Error('Yerel fiyat değişikliği geçersiz.');
    result.overrides[id] = price;
  }
  if (backup) {
    if (!isObject(value.settings) || !['dark', 'light', 'system'].includes(value.settings.theme) || !['apple', 'google', 'ask'].includes(value.settings.navigation) || typeof value.settings.origin !== 'string' || (value.settings.origin && !known.has(value.settings.origin))) throw new Error('Yedek ayarları geçersiz.');
    result.settings = { theme: value.settings.theme, navigation: value.settings.navigation, origin: value.settings.origin };
    const ids = new Set([...baseIds, ...result.customRoutes.map(r => r.id), cityFare.id]);
    for (const [field, limit] of [['favorites', 100], ['recents', 10]]) {
      if (!Array.isArray(value[field]) || value[field].some(id => typeof id !== 'string')) throw new Error('Yedek rota listesi geçersiz.');
      result[field] = [...new Set(value[field].filter(id => ids.has(id)))].slice(0, limit);
    }
  }
  return result;
}
export function readState(storage, onError = () => {}) {
  try { const value = storage.getItem(STORAGE_KEY); return value ? parseImport(JSON.parse(value), true) : defaultState(); }
  catch { onError('Kayıtlı veriler okunamadı. Varsayılan tarifeler açıldı; önceki kayıt otomatik olarak silinmedi.'); return defaultState(); }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export const allLocations = state => [...bundledLocations, ...state.customLocations].map(l => ({ ...l, ...(state.coordinateOverrides?.[l.id] || {}) }));
export const effectiveFares = state => [...baseFares.map(r => ({ ...r, price: state.overrides[r.id] ?? r.price, overridden: Object.hasOwn(state.overrides, r.id) })), ...state.customRoutes.map(r => ({ ...r, custom: true }))];
export function originsFor(rows, locations) {
  const counts = new Map(); rows.forEach(r => counts.set(r.from, (counts.get(r.from) || 0) + 1));
  return locations.filter(l => counts.has(l.id)).sort((a, b) => counts.get(b.id) - counts.get(a.id) || a.name.localeCompare(b.name, 'tr'));
}
export function searchFares(rows, locations, query, origin = '') {
  const terms = String(query).trim().split(/\s+/).map(normalize).filter(Boolean);
  const names = new Map(locations.map(l => [l.id, [l.name, ...l.aliases].map(normalize).join(' ')]));
  return rows.filter(r => terms.every(q => `${names.get(r.from)} ${names.get(r.to)} ${normalize(r.fromName)} ${normalize(r.toName)}`.includes(q)))
    .sort((a, b) => Number(b.from === origin) - Number(a.from === origin) || a.from.localeCompare(b.from, 'tr') || (a.toName || names.get(a.to)).localeCompare(b.toName || names.get(b.to), 'tr'));
}
export function remember(state, id) { state.recents = [id, ...state.recents.filter(r => r !== id)].slice(0, 10); }
export function toggleFavorite(state, id) {
  if (state.favorites.includes(id)) state.favorites = state.favorites.filter(r => r !== id);
  else { if (state.favorites.length >= 100) return false; state.favorites.push(id); } return true;
}
export function modificationExport(state) { return { schemaVersion: 1, kind: 'taksi-tarife-modifications', overrides: { ...state.overrides }, coordinateOverrides: { ...state.coordinateOverrides }, customRoutes: state.customRoutes, customLocations: state.customLocations }; }
export function importInto(state, value) {
  if (value.kind === 'taksi-tarife-backup') return parseImport(value, true);
  const incoming = parseImport(value);
  const next = { ...state, overrides: { ...state.overrides, ...incoming.overrides }, coordinateOverrides: { ...state.coordinateOverrides, ...incoming.coordinateOverrides }, customRoutes: [...state.customRoutes], customLocations: [...state.customLocations] };
  for (const key of ['customLocations', 'customRoutes']) {
    const map = new Map(next[key].map(r => [r.id, r])); incoming[key].forEach(r => map.set(r.id, r)); next[key] = [...map.values()];
  }
  return parseImport(next, true);
}
export function coordinatesExist(l) { return typeof l.lat === 'number' && typeof l.lng === 'number' && Number.isFinite(l.lat) && Number.isFinite(l.lng) && Math.abs(l.lat) <= 90 && Math.abs(l.lng) <= 180; }
export function nearestOrigin(coords, origins) {
  if (!coords || !coordinatesExist({ lat: coords.latitude, lng: coords.longitude })) return null;
  const rad = n => n * Math.PI / 180;
  return origins.filter(coordinatesExist).map(l => {
    const dLat = rad(l.lat - coords.latitude), dLng = rad(l.lng - coords.longitude);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(coords.latitude)) * Math.cos(rad(l.lat)) * Math.sin(dLng / 2) ** 2;
    return { location: l, distance: 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) };
  }).sort((a, b) => a.distance - b.distance)[0] || null;
}
export function suggestedOrigin(coords, origins) {
  if (!coords || !Number.isFinite(coords.accuracy) || coords.accuracy > 150) return null;
  const candidates = origins.filter(l => l.coordinateKind !== 'area');
  const nearest = nearestOrigin(coords, candidates);
  if (!nearest || nearest.distance > 750) return null;
  const second = nearestOrigin(coords, candidates.filter(l => l.id !== nearest.location.id));
  // Do not guess between neighboring origins when GPS uncertainty overlaps them.
  if (second && second.distance - nearest.distance <= 2 * coords.accuracy) return null;
  return nearest;
}
export function navigationURL(location, provider, currentPosition = null) {
  const dest = coordinatesExist(location) ? `${location.lat},${location.lng}` : location.navigationText || `${location.name}, Gazimağusa, North Cyprus`;
  const start = currentPosition && coordinatesExist({ lat: currentPosition.latitude, lng: currentPosition.longitude }) ? `${currentPosition.latitude},${currentPosition.longitude}` : null;
  if (provider === 'apple') return `https://maps.apple.com/?saddr=${encodeURIComponent(start || 'Current Location')}&daddr=${encodeURIComponent(dest)}&dirflg=d`;
  // Omitting Google Maps origin explicitly lets the map app use current location.
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving${start ? `&origin=${encodeURIComponent(start)}` : ''}`;
}
