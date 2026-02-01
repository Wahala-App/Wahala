import {FALLBACK_LOCATION} from "@/app/map/mapUtils";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const api_key = process.env.REVERSE_GEOCODING_API;

    // Forward geocoding: address -> coordinates
    const address = searchParams.get("address") || searchParams.get("text");
    if (address) {
        try {
            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${api_key}`
            );
            const result = await response.json();
            
            // Return coordinates from first result
            if (result.features && result.features.length > 0) {
                const coords = result.features[0].geometry.coordinates;
                return Response.json({
                    latitude: coords[1],
                    longitude: coords[0],
                    address: result.features[0].properties.address_line1 || address,
                    fullResult: result.features[0]
                });
            }
            
            return Response.json({ error: 'No results found for address' }, { status: 404 });
        } catch (error) {
            return Response.json({ error: 'Failed to geocode address' }, { status: 500 });
        }
    }

    // Reverse geocoding: coordinates -> address
    const lat = searchParams.get("lat") || FALLBACK_LOCATION.latitude;
    const lng = searchParams.get("lng") || FALLBACK_LOCATION.longitude;

    try {
        const response = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${api_key}`
        );
        const result = await response.json();
        return Response.json(result);
    } catch (error) {
        return Response.json({ error: 'Failed to get location' }, { status: 500 });
    }
}