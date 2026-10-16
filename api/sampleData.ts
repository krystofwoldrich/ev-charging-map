import type { Region } from 'react-native-maps';
import type { ChargingStation } from './converters';
import type { ConnectorType } from './plugsurfing';
import type { DetailedStation } from './stationDetails';

export const AMSTERDAM: Region = {
  latitude: 52.3702, longitude: 4.8945, latitudeDelta: 0.046, longitudeDelta: 0.046,
};

// Fictional stations at real Amsterdam neighborhoods. Never mix these IDs with live API IDs.
const places = [
  { name: 'Canal House', street: 'Keizersgracht 365', lat: 52.3677, lon: 4.8848, power: 22, type: 'TYPE2', available: 3, total: 4, price: 0.39 },
  { name: 'Museum Quarter', street: 'Museumplein 10', lat: 52.3579, lon: 4.8804, power: 150, type: 'CCS', available: 2, total: 4, price: 0.59 },
  { name: 'Jordaan', street: 'Westerstraat 48', lat: 52.3795, lon: 4.8839, power: 22, type: 'TYPE2', available: 1, total: 2, price: 0.42 },
  { name: 'Amstel Riverside', street: 'Amstel 115', lat: 52.3654, lon: 4.8995, power: 50, type: 'CCS', available: 2, total: 2, price: 0.49 },
  { name: 'Central Station', street: 'De Ruijterkade 35', lat: 52.3803, lon: 4.9001, power: 175, type: 'CCS', available: 4, total: 6, price: 0.65 },
  { name: 'Oosterdok', street: 'Oosterdokskade 143', lat: 52.3744, lon: 4.9072, power: 22, type: 'TYPE2', available: 0, total: 2, price: 0.38 },
  { name: 'De Pijp', street: 'Ferdinand Bolstraat 54', lat: 52.3559, lon: 4.8916, power: 11, type: 'TYPE2', available: 2, total: 4, price: 0.35 },
  { name: 'Plantage', street: 'Plantage Middenlaan 24', lat: 52.3666, lon: 4.9112, power: 100, type: 'CCS', available: 0, total: 2, price: 0.54 },
] as const;

export const sampleDetails: DetailedStation[] = places.map((place, index) => ({
  id: `sample-${index + 1}`,
  name: place.name,
  address: { city: 'Amsterdam', street: place.street, countryIsoCode: 'NL', postalCode: '', fullAddress: `${place.street}, Amsterdam` },
  coordinates: { latitude: place.lat, longitude: place.lon },
  operator: { id: 'sample', name: 'Sample Charging' },
  isGreenEnergy: true,
  connectors: Array.from({ length: place.total }, (_, connector) => ({
    id: `sample-${index + 1}-${connector + 1}`, type: place.type, power: place.power,
    status: connector < place.available ? 'AVAILABLE' : 'OCCUPIED',
    powerType: place.type === 'CCS' ? 'DC' : 'AC', isQuickCharge: place.type === 'CCS',
    priceInfo: { price: place.price, currency: 'EUR', type: 'ENERGY' },
  })),
  status: place.available > 0 ? 'AVAILABLE' : 'OCCUPIED',
  availableConnectors: place.available, totalConnectors: place.total,
  lastUpdated: 0,
  openingTimes: [{ day: 'Every day', hours: 'Open 24 hours' }],
  lowestPrice: { price: place.price, currency: 'EUR', type: 'ENERGY' },
}));

export const sampleStations: ChargingStation[] = sampleDetails.map(station => ({
  id: station.id, title: station.name, coordinates: station.coordinates,
  connectorTypes: [...new Set(station.connectors.map(connector => connector.type))],
  availability: `${station.availableConnectors} of ${station.totalConnectors} available`,
  availableConnectors: station.availableConnectors, totalConnectors: station.totalConnectors,
  power: `${station.connectors[0].power} kW`,
  price: station.lowestPrice!.price, currency: 'EUR', priceType: 'ENERGY', unit: 'kWh',
  address: station.address.fullAddress,
}));

export function getSampleStations(region: Region, connector?: ConnectorType | null) {
  return sampleStations.filter(station =>
    Math.abs(station.coordinates.latitude - region.latitude) <= region.latitudeDelta / 2 &&
    Math.abs(station.coordinates.longitude - region.longitude) <= region.longitudeDelta / 2 &&
    (!connector || station.connectorTypes.includes(connector)),
  );
}
