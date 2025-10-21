import { IncidentType } from "../api/types";

// Default fallback location: Statesboro, GA
export const FALLBACK_LOCATION = { latitude: 32.4173824, longitude: -81.7856512 };

export default function getCurrLocation(): Promise<{latitude: number, longitude: number}> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            // Fallback coordinates if geolocation is not supported
            resolve(FALLBACK_LOCATION);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const long = position.coords.longitude;
                console.log('Current location:', lat, long);
                resolve({ latitude: lat, longitude: long });
            },
            (error) => {
                console.error('Error getting location:', error);
                // Fallback coordinates if geolocation fails
                resolve(FALLBACK_LOCATION);
            }
        );
    });
}

export function incidentToIcon(incidentType: IncidentType): string {
    switch (incidentType) {
        case IncidentType.ASSAULT:
            return '/crimeSpecialization/assault.svg';
        case IncidentType.VANDALISM:
            return '/crimeSpecialization/vandalism.svg';
        case IncidentType.THEFT:
            return '/crimeSpecialization/theft.svg';
        case IncidentType.DRUG_OFFENSE:
            return '/crimeSpecialization/drug.svg';
        case IncidentType.ROBBERY:
            return '/crimeSpecialization/robbery.svg';
        case IncidentType.PUBLIC_INTOXICATION:
            return '/crimeSpecialization/alcohol.svg';
        default:
            return '/crimeSpecialization/default.svg';
    }
}
