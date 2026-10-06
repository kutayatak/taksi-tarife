import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fares } from '../data/fares.js';
import { locations } from '../data/locations.js';
import * as c from '../core.js';
const storage = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }; };
test('All 166 supplied source fares match, including every original label and price', () => {
  let origin; const expected = [];
  for (const line of readFileSync(new URL('../data/source.txt', import.meta.url), 'utf8').trim().split('\n')) {
    if (line.startsWith('[')) origin = line.slice(1, -1);
    else { const [to, amount] = line.split('='); expected.push([origin, to, Number(amount)]); }
  }
  assert.equal(expected.length, 166);
  assert.deepEqual(fares.map(r => [r.fromName, r.toName, r.price]), expected);
  assert.equal(c.baseFares.length, 166);
  assert.equal(c.dataProblems.length, 0);
  assert.equal(new Set(fares.map(r => c.routeId(r.from, r.to))).size, 166);
  assert.equal(locations.length, 63);
  assert.equal(locations.filter(c.coordinatesExist).length, 42);
  assert.equal(locations.find(l => l.id === 'cember').lat, 35.129723);
  assert.equal(locations.find(l => l.id === 'nurol-arkasi').lng, 33.9082698);
  assert.ok(locations.filter(c.coordinatesExist).every(l => /^https:\/\//.test(l.coordinateSource) && ['poi','area'].includes(l.coordinateKind)));
  assert.ok(locations.filter(l => !c.coordinatesExist(l)).every(l => l.lat === null && l.lng === null));
  assert.equal(c.cityFare.price, 300);
});
test('Known group counts match the supplied list', () => {
  const expected = {'pop-art':40,prime:46,'salamis-otel':5,citymall:3,cember:10,'grand-aras-durak':12,grandsappire:3,'loof-beach':1,magosa:6,'merit-arkin':3,'merkez-kaliland':25,'nurol-arkasi':12};
  for (const [origin, count] of Object.entries(expected)) assert.equal(fares.filter(r => r.from === origin).length, count, origin);
});
test('Turkish normalization, aliases, route search, and origin prioritization', () => {
  assert.equal(c.normalize('Iİiı'), 'iiii');
  assert.equal(c.normalize('ÇĞÖŞÜ çğöşü'), 'cgosucgosu');
  for (const q of ['KALE İÇİ','kale ici','KALEICI','kaleiçi']) assert.ok(c.searchFares(fares, locations, q, 'pop-art').some(r => r.id === 'pop-art--kale-ici' && r.price === 500));
  for (const q of ['itu','İTÜ','i.t.u','I.T.Ü']) assert.ok(c.searchFares(fares, locations, q).some(r => r.id === 'pop-art--itu'));
  for (const q of ['k.batı','k bati','k.bati']) assert.ok(c.searchFares(fares, locations, q).some(r => r.id === 'pop-art--k-bati'));
  assert.deepEqual(c.searchFares(fares, locations, 'ercan').map(r => r.price).sort((a,b)=>a-b), [3000,3500]);
  assert.equal(c.searchFares(fares, locations, 'city', 'pop-art')[0].from, 'pop-art');
  assert.ok(c.searchFares(fares, locations, 'nurol').some(r => r.from === 'nurol-arkasi'));
  assert.ok(c.searchFares(fares, locations, 'nural').some(r => r.from === 'nurol-arkasi'));
  assert.ok(c.searchFares(fares, locations, 'zagota').some(r => r.id === 'prime--zagato'));
  assert.equal(c.searchFares(fares, locations, 'famagusta ercan')[0].price, 3000);
  assert.equal(c.searchFares(fares, locations, 'not-a-location').length, 0);
  for (const pair of [['citymall','citymall-2'],['loof-beach','loof-beach-2'],['lions','lions-2'],['beach-club','beach-club-2'],['pop-art','pop-art-gece'],['grandsaphire','grandsappire']]) assert.ok(pair.every(id => locations.some(l => l.id === id)));
});
test('Malformed and duplicate fare data is skipped without crashing', () => {
  const result = c.validateFares([fares[0],fares[0],null,{id:'a',from:'missing',to:'citymall',price:300},{...fares[1],price:'1000'},{...fares[2],price:0},{...fares[3],toName:123}], locations);
  assert.equal(result.valid.length,1); assert.equal(result.problems.length,6);
});
test('Local price overrides survive storage while original fares remain intact', () => {
  const state=c.defaultState(), store=storage(); state.overrides['pop-art--citymall']=500;
  assert.equal(c.saveState(store,state),true);
  assert.equal(c.effectiveFares(c.readState(store)).find(r=>r.id==='pop-art--citymall').price,500);
  assert.equal(fares.find(r=>r.id==='pop-art--citymall').price,450);
  delete state.overrides['pop-art--citymall']; assert.equal(c.effectiveFares(state).find(r=>r.id==='pop-art--citymall').price,450);
  assert.equal(c.saveState({setItem(){throw Error();}},state),false);
  assert.equal(c.readState({getItem(){return '{bad';}}).recents.length,0);
});
test('Favorites are route combinations; recents restore IDs with live prices, unique last ten', () => {
  const s=c.defaultState(); c.toggleFavorite(s,'pop-art--citymall'); c.toggleFavorite(s,'prime--citymall');
  assert.deepEqual(s.favorites,['pop-art--citymall','prime--citymall']);
  c.toggleFavorite(s,'prime--citymall'); assert.deepEqual(s.favorites,['pop-art--citymall']);
  fares.slice(0,12).forEach(r=>c.remember(s,r.id)); assert.equal(s.recents.length,10);
  c.remember(s,fares[5].id); assert.equal(s.recents[0],fares[5].id); assert.equal(new Set(s.recents).size,10);
});
test('Custom routes, reverse lookup, origin generation and JSON export/import', () => {
  const s=c.defaultState(); s.overrides['pop-art--citymall']=500;
  s.customRoutes.push({id:'citymall--pop-art',from:'citymall',to:'pop-art',price:520});
  s.customLocations.push({id:'custom-new',name:'YENİ DURAK',aliases:['yeni'],lat:null,lng:null,navigationText:'YENİ DURAK, North Cyprus'});
  s.customRoutes.push({id:'custom-new--citymall',from:'custom-new',to:'citymall',price:600});
  const imported=c.importInto(c.defaultState(),JSON.parse(JSON.stringify(c.modificationExport(s))));
  assert.deepEqual(imported.overrides,s.overrides); assert.deepEqual(imported.customRoutes,s.customRoutes);
  assert.ok(c.originsFor(c.effectiveFares(imported),c.allLocations(imported)).some(l=>l.id==='custom-new'));
  assert.equal(c.effectiveFares(imported).find(r=>r.from==='citymall'&&r.to==='pop-art').price,520);
  const repeat=c.importInto(imported,c.modificationExport(s)); assert.equal(repeat.customRoutes.length,2);
  s.settings.theme='system'; s.settings.navigation='google'; s.favorites=['pop-art--citymall']; s.recents=['citymall--pop-art'];
  const backup=c.importInto(c.defaultState(),{...s,kind:'taksi-tarife-backup'});
  assert.deepEqual(backup,s);
});
test('Invalid imports are rejected atomically', () => {
  const s=c.defaultState(), snapshot=JSON.stringify(s);
  for(const value of [{}, {...c.modificationExport(s),overrides:{'pop-art--citymall':-1}}, {...c.modificationExport(s),customRoutes:[fares[0]]}, {...c.modificationExport(s),customRoutes:[{id:'bad',from:'pop-art',to:'citymall',price:500}]}]) assert.throws(()=>c.importInto(s,value));
  assert.equal(JSON.stringify(s),snapshot);
});
test('GPS only uses configured numeric coordinates; navigation has text fallback', () => {
  assert.equal(c.nearestOrigin({latitude:0,longitude:0},locations.filter(l => !c.coordinatesExist(l))),null);
  // Synthetic coordinates used only in unit tests, never in shipped location data.
  assert.equal(c.nearestOrigin({latitude:0,longitude:0},[{id:'test',lat:0,lng:0}]).distance,0);
  assert.ok(c.navigationURL(locations.find(l=>l.id==='kale-ici'),'google').includes(encodeURIComponent('35.125,33.94167')));
  assert.ok(c.navigationURL(locations.find(l=>l.id==='sema-otel'),'google').includes(encodeURIComponent('35.124228,33.928364')));
  assert.ok(c.navigationURL(locations.find(l=>l.id==='tir-parki'),'google').includes(encodeURIComponent('Koruk Kafe / Tır Parkı')));
  assert.ok(c.navigationURL(locations.find(l=>l.id==='cember'),'google').includes('35.129723%2C33.9285231'));
  assert.ok(c.navigationURL({lat:0,lng:0},'apple').includes('daddr=0%2C0'));
});
test('Navigation begins at device position, independently of fare origin', () => {
  const target = locations.find(l => l.id === 'kyble-onu');
  const current = { latitude: 35.129723, longitude: 33.9285231 };
  const google = new URL(c.navigationURL(target, 'google', current));
  const apple = new URL(c.navigationURL(target, 'apple', current));
  assert.equal(google.searchParams.get('origin'), '35.129723,33.9285231');
  assert.equal(google.searchParams.get('destination'), '35.1593598,33.90279');
  assert.equal(apple.searchParams.get('saddr'), '35.129723,33.9285231');
  assert.equal(new URL(c.navigationURL(target, 'apple')).searchParams.get('saddr'), 'Current Location');
  assert.equal(new URL(c.navigationURL(target, 'google')).searchParams.has('origin'), false);
  assert.equal(new URL(c.navigationURL(target, 'google', {latitude:NaN, longitude:0})).searchParams.has('origin'), false);
});
test('Manifest and cached assets resolve inside any repository subpath', () => {
  const manifest=JSON.parse(readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));
  const base='https://username.github.io/taksi-tarife/';
  for(const path of [manifest.id,manifest.start_url,manifest.scope,...manifest.icons.map(i=>i.src)]) assert.ok(new URL(path,base).href.startsWith(base));
  const worker=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
  assert.ok(worker.includes("new URL('./', self.location.href)"));
  const assets=worker.match(/const ASSETS = \[(.*?)\]/s)[1].match(/'([^']+)'/g).map(x=>x.slice(1,-1));
  for(const path of assets) { assert.ok(new URL(path,base).href.startsWith(base)); assert.doesNotThrow(()=>readFileSync(new URL(path==='./'?'../index.html':`../${path}`,import.meta.url))); }
});

test('Only nearby precise POI origins are suggested; region centers and uncertainty do not choose fares', () => {
  const origins=c.originsFor(fares,locations);
  const at=(id,accuracy=5)=>({latitude:locations.find(l=>l.id===id).lat,longitude:locations.find(l=>l.id===id).lng,accuracy});
  assert.equal(c.suggestedOrigin(at('cember'),origins).location.id,'cember');
  assert.equal(c.suggestedOrigin(at('pop-art'),origins).location.id,'pop-art');
  assert.equal(c.suggestedOrigin(at('cember',500),origins),null);
  assert.equal(c.suggestedOrigin(at('girne'),origins),null);
  assert.equal(c.suggestedOrigin(at('magosa'),origins.filter(l=>l.id==='magosa')),null);
  assert.equal(c.nearestOrigin({latitude:NaN,longitude:33},origins),null);
  // Test fixtures, not shipped location data. Equal distance cannot decide between stands.
  assert.equal(c.suggestedOrigin({latitude:35,longitude:33,accuracy:5},[{id:'a',lat:35,lng:33},{id:'b',lat:35,lng:33}]),null);
});
test('Local coordinates round-trip, reject invalid imports atomically, and preserve earlier backups', () => {
  const s=c.defaultState();
  s.coordinateOverrides['citymall']={lat:35.125871,lng:33.920825,coordinateKind:'poi',coordinateSource:'https://mapcarta.com/W437715123',locallyEdited:true};
  const store=storage();c.saveState(store,s);assert.deepEqual(c.readState(store),s);
  assert.deepEqual(c.importInto(c.defaultState(),c.modificationExport(s)).coordinateOverrides,s.coordinateOverrides);
  assert.equal(c.allLocations(s).find(l=>l.id==='citymall').locallyEdited,true);
  const before=JSON.stringify(s);
  for (const pin of [{lat:91,lng:33,coordinateKind:'poi'},{lat:'35',lng:33,coordinateKind:'poi'},{lat:null,lng:33,coordinateKind:'poi'},{lat:35,lng:33,coordinateKind:'poi',coordinateSource:'javascript:alert(1)'}]) {
    assert.throws(()=>c.importInto(s,{...c.modificationExport(s),coordinateOverrides:{citymall:pin}}));
  }
  assert.equal(JSON.stringify(s),before);
  const old={...c.defaultState()};delete old.coordinateOverrides;
  assert.deepEqual(c.parseImport(old,true).coordinateOverrides,{});
});
