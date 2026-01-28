// In-memory address cache keyed by coordinates (lat,lng rounded to 4 decimals)
const addressCache = new Map<string, string>();

/**
 * Get cached address for given coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns Cached address string or null if not found
 */
export function getCachedAddress(lat: number, lng: number): string | null {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  return addressCache.get(key) || null;
}

/**
 * Cache an address for given coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @param address Address string to cache
 */
export function setCachedAddress(lat: number, lng: number, address: string): void {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  addressCache.set(key, address);
}

/**
 * Clear the address cache (useful for testing or memory management)
 */
export function clearAddressCache(): void {
  addressCache.clear();
}
