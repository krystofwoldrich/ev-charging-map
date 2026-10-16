/// <reference types="node" />
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { fetchChargingLocations } from '../api/plugsurfing';
import { fetchStationDetails } from '../api/stationDetails';

const originalFetch = globalThis.fetch;
const region = { latitude: 52.37, longitude: 4.9, latitudeDelta: 0.04, longitudeDelta: 0.02 };
afterEach(() => { globalThis.fetch = originalFetch; });

test('station-list failures remain errors so the query can retry and show an error', async () => {
  globalThis.fetch = async () => new Response('Unavailable', { status: 503 });
  await assert.rejects(fetchChargingLocations(region), /503/);
});

test('station-details failures remain errors instead of being cached as successful null data', async () => {
  globalThis.fetch = async () => new Response('Unavailable', { status: 503 });
  await assert.rejects(fetchStationDetails('station-id'), /503/);
});

test('an unexpected station-list response is not treated as an empty map', async () => {
  globalThis.fetch = async () => Response.json({ message: 'API response changed' });
  await assert.rejects(fetchChargingLocations(region), /response/i);
});

test('an empty successful station-list response is valid', async () => {
  globalThis.fetch = async () => Response.json({ locations: [] });
  assert.deepEqual(await fetchChargingLocations(region), []);
});

test('the requested connector type is sent to the API with visible map bounds', async () => {
  let body: Record<string, any> = {};
  globalThis.fetch = async (_input, init) => {
    body = JSON.parse(String(init?.body));
    return Response.json({ locations: [] });
  };
  await fetchChargingLocations(region, 'CCS');
  assert.equal(body.filterByConnectorCategories.CCS, true);
  assert.equal(body.filterByConnectorCategories.TYPE2, false);
  assert.equal(body.topLatitude, region.latitude + region.latitudeDelta / 2);
  assert.equal(body.leftLongitude, region.longitude - region.longitudeDelta / 2);
});

test('station ids are escaped as one URL path segment', async () => {
  let requested = '';
  globalThis.fetch = async (input) => {
    requested = String(input);
    return Response.json({ evses: [], address: {}, summary: {} });
  };
  await fetchStationDetails('station/with?reserved#characters');
  assert.match(requested, /station%2Fwith%3Freserved%23characters\?userPrefix=/);
});

test('network failures propagate to the query retry handler', async () => {
  globalThis.fetch = async () => { throw new Error('Network unavailable'); };
  await assert.rejects(fetchChargingLocations(region), /Network unavailable/);
  await assert.rejects(fetchStationDetails('station-id'), /Network unavailable/);
});
