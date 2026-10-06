import test from 'node:test';
import assert from 'node:assert/strict';
import { getDevicePosition, gpsErrorMessage } from '../gps.js';

const fixture = { coords: { latitude: 35, longitude: 33, accuracy: 10 } };
test('GPS asks for a fresh accurate reading and returns the device position', async () => {
  let options;
  const device = { geolocation: { getCurrentPosition(ok, fail, value) { options = value; ok(fixture); } } };
  assert.equal(await getDevicePosition(device, true), fixture);
  assert.deepEqual(options, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
});
test('Permission, unavailable, timeout, secure-context, and unsupported errors remain distinct', async () => {
  for (const code of [1,2,3]) {
    const device = { geolocation: { getCurrentPosition(ok, fail) { fail({ code }); } } };
    await assert.rejects(getDevicePosition(device, true), e => e.code === code);
    assert.ok(gpsErrorMessage({ code }).length > 20);
  }
  await assert.rejects(getDevicePosition({}, false), e => e.code === 'https');
  await assert.rejects(getDevicePosition({}, true), e => e.code === 'unsupported');
});
test('Invalid GPS samples and browser exceptions release the request', async () => {
  for (const coords of [{latitude:NaN,longitude:33,accuracy:10},{latitude:35,longitude:200,accuracy:10},{latitude:35,longitude:33,accuracy:-1}]) {
    await assert.rejects(getDevicePosition({geolocation:{getCurrentPosition(ok){ok({coords});}}}, true),e=>e.code===2);
  }
  await assert.rejects(getDevicePosition({geolocation:{getCurrentPosition(){throw Error('device failure');}}}, true),e=>e.code===2);
});
test('A stalled browser request times out; late responses cannot resolve it afterward', async () => {
  let callback;
  const request=getDevicePosition({geolocation:{getCurrentPosition(ok){callback=ok;}}}, true, 1);
  await assert.rejects(request,e=>e.code===3);
  callback(fixture);
  await assert.rejects(request,e=>e.code===3);
});
