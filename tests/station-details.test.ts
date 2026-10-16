import assert from 'node:assert/strict';
import test from 'node:test';
import { processStationDetails, type StationApiResponse } from '../api/stationDetails';

function station(): StationApiResponse {
  return {
    id: 'example', name: 'Example', address: { city: 'Amsterdam', street: 'Example', postalCode: '', countryIsoCode: 'NL' },
    latitude: 52, longitude: 4, external: false, isGreenEnergy: false, operatorDisplayName: 'Example', operatorId: 'example',
    summary: { connectorsStatuses: [], aggregatedStatus: 'AVAILABLE' },
    evses: [{ id: 'one', connectors: [{
      id: 'one', category: 'CCS', power: 100, name: 'CCS', quick: true, status: 'AVAILABLE', powerType: 'DC',
      priceProfile: { id: 'price', organizationId: 'example', name: 'Tariff', description: '', currency: 'EUR', taxation: 0,
        content: JSON.stringify({ segments: [{ price_components: [{ type: 'FLAT', price: 0.1, step_size: 1 }, { type: 'ENERGY', price: 0.5, step_size: 1 }] }] }) },
    }] }],
  };
}

test('missing hours remain unknown, while a supplied schedule is preserved', () => {
  const input = station();
  assert.equal(processStationDetails(input).openingTimes, undefined);
  input.extraProperties = { openingHours: { monday: '08:00–18:00' } };
  assert.deepEqual(processStationDetails(input).openingTimes, [{ day: 'Monday', hours: '08:00–18:00' }]);
});

test('summary and connector prices prefer energy over a lower numeric session fee', () => {
  const result = processStationDetails(station());
  assert.deepEqual(result.lowestPrice, { price: 0.5, currency: 'EUR', type: 'ENERGY' });
  assert.equal(result.connectors[0].priceInfo?.type, 'ENERGY');
  assert.equal(result.availableConnectors, 1);
});
