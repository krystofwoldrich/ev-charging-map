export function connectorName(type: string) {
  return ({ TYPE2: 'Type 2', TYPE1: 'Type 1', CHADEMO: 'CHAdeMO', CCS: 'CCS' } as Record<string, string>)[type] ?? type;
}

export function priceLabel(price?: { price: number; currency: string; type: string }) {
  if (!price) return undefined;
  // Time tariff units depend on the provider's price profile; don't invent a unit.
  if (price.type !== 'ENERGY' && price.type !== 'FLAT') return undefined;
  const amount = new Intl.NumberFormat(undefined, { style: 'currency', currency: price.currency }).format(price.price);
  return `${amount}${price.type === 'ENERGY' ? '/kWh' : '/session'}`;
}

export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radians = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * radians;
  const dLon = (b.longitude - a.longitude) * radians;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(dLon / 2) ** 2));
}

export function distanceLabel(distance: number) {
  return distance < 1 ? `${Math.round(distance * 1000 / 50) * 50} m` : `${distance.toFixed(1)} km`;
}
