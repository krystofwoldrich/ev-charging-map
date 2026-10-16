/// <reference types="node" />
import assert from 'node:assert/strict';
import { fetchChargingLocations } from '../api/plugsurfing';
import { convertPlugsurfingToChargingStation } from '../api/converters';
import { fetchStationDetails, processStationDetails } from '../api/stationDetails';

async function main() {
  const locations = await fetchChargingLocations({
    latitude: 52.3698,
    longitude: 4.9009,
    latitudeDelta: 0.04,
    longitudeDelta: 0.02,
  }, 'TYPE2');
  assert.ok(locations.length > 0, 'No stations returned for central Amsterdam');
  const stations = convertPlugsurfingToChargingStation(locations);
  const response = await fetchStationDetails(stations[0].id);
  assert.ok(response, 'No station details returned');
  const station = processStationDetails(response);
  assert.ok(station.connectors.length > 0, 'No connectors in station details');
  console.log(JSON.stringify({
    stations: stations.length,
    sample: station.name,
    connectors: station.connectors.length,
    availableConnectors: station.availableConnectors,
    lowestPrice: station.lowestPrice ?? 'Not supplied by API',
  }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
