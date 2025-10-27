import {FALLBACK_LOCATION} from "@/app/map/mapUtils";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat") || FALLBACK_LOCATION.latitude;
    const lng = searchParams.get("lng") || FALLBACK_LOCATION.longitude;

    const api_key = process.env.REVERSE_GEOCODING_API;

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