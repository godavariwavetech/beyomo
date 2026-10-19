import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lookupAddress, addressFields} from './addressLookup.js';

test('address lookup recovers when the primary provider fails', async t => {
  const urls = [];
  const feature = {properties: {name: 'Test Street', city: 'Nellore'}};
  t.mock.method(globalThis, 'fetch', async url => {
    urls.push(url);
    if (urls.length === 1) throw new TypeError('Failed to fetch');
    return {ok: true, json: async () => ({features: [feature]})};
  });
  assert.deepEqual(await lookupAddress('reverse', new URLSearchParams({lat: 14, lon: 79})), [feature]);
  assert.equal(urls.length, 2);
  assert.ok(urls[1].startsWith('https://photon.komoot.de/reverse?'));
});

test('all providers failing returns an actionable error', async t => {
  t.mock.method(globalThis, 'fetch', async () => {throw new TypeError('Failed to fetch');});
  await assert.rejects(lookupAddress('api/', new URLSearchParams({q: 'Nellore'})), /unavailable/);
});

test('Nominatim restores address detection when both Photon hosts fail', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    if (!url.startsWith('https://nominatim.openstreetmap.org/')) throw new TypeError('DNS lookup failed');
    return {ok:true, json:async()=>({osm_id:123,osm_type:'way',lat:'14.4426',lon:'79.9865',
      name:'VRC Road',category:'highway',type:'primary',
      address:{road:'VRC Road',city:'Nellore',state:'Andhra Pradesh',postcode:'524003'}})};
  });
  const features = await lookupAddress('reverse',new URLSearchParams({lat:14.4426,lon:79.9865}));
  assert.deepEqual(features[0].geometry.coordinates,[79.9865,14.4426]);
  assert.deepEqual(addressFields(features[0].properties),{
    line1:'VRC Road',line2:'',city:'Nellore',state:'Andhra Pradesh',pincode:'524003',
  });
});

test('cancelling lookup does not start a fallback request', async t => {
  const controller = new AbortController();
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    controller.abort();
    throw new DOMException('Cancelled', 'AbortError');
  });
  await assert.rejects(lookupAddress('reverse', new URLSearchParams(), controller.signal), {name: 'AbortError'});
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('city search results fill city even when provider only supplies the place name', () => {
  assert.equal(addressFields({name: 'Nellore', osm_value: 'city', state: 'Andhra Pradesh'}).city, 'Nellore');
  assert.equal(addressFields({name: 'Bus Station', city: 'Vijayawada'}).city, 'Vijayawada');
});
