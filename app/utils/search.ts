
export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

/**
 * Search for locations using Nominatim OSM geocoding API
 * Note: This uses the public Nominatim server with rate limits (1 req/sec)
 * For production, consider self-hosting or using a commercial provider
 */
export async function searchLocation(query: string): Promise<NominatimResult[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Wahala-App/1.0', // Required by Nominatim usage policy
        },
      }
    );

    if (!response.ok) throw new Error('Geocoding failed');
    
    const results: NominatimResult[] = await response.json();
    return results;
  } catch (error) {
    console.error('Nominatim search error:', error);
    return [];
  }
}