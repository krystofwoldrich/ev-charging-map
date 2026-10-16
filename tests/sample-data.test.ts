import assert from 'node:assert/strict';
import test from 'node:test';
import { AMSTERDAM, getSampleStations, sampleDetails } from '../api/sampleData';
import { distanceKm, priceLabel } from '../lib/stationFormat';

test('demo stays in its region and connector filter, with matching details and no network', () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Sample data must not call an API'); };
  try {
    assert.equal(getSampleStations(AMSTERDAM).length, 8);
    assert.equal(getSampleStations({ ...AMSTERDAM, latitude: 0 }).length, 0);
    for (const station of getSampleStations(AMSTERDAM, 'CCS')) {
      assert.deepEqual(station.connectorTypes, ['CCS']);
      const detail = sampleDetails.find(value => value.id === station.id)!;
      assert.equal(detail.availableConnectors, detail.connectors.filter(value => value.status === 'AVAILABLE').length);
      assert.equal(detail.totalConnectors, detail.connectors.length);
    }
  } finally { globalThis.fetch = oldFetch; }
});

test('price labels never turn unknown time units into a per-minute tariff', () => {
  assert.equal(priceLabel({ price: 3, currency: 'EUR', type: 'TIME' }), undefined);
  assert.match(priceLabel({ price: 0.49, currency: 'EUR', type: 'ENERGY' })!, /0.49\/kWh/);
});

test('distance uses geographic coordinates', () => {
  assert.equal(distanceKm(AMSTERDAM, AMSTERDAM), 0);
  assert.ok(distanceKm(AMSTERDAM, { latitude: 52.38, longitude: 4.9 }) > 1);
});
