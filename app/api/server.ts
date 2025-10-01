import { IncidentType } from "./types";

export function getNearbyIncidents() {
    return [
        {
            id: "1",
            title: "Stabbing",
            incidentType: IncidentType.ASSAULT,
            description: "A stabbing occurred at the park.",
            location: { latitude: 37.7749, longitude: -122.4194 },
            timestamp: new Date(),
        },

        {
            id: "2",
            title: "Robbery",
            incidentType: IncidentType.ROBBERY,
            description: "A robbery occurred at the store.",
            location: { latitude: 37.7749, longitude: -122.4194 },
            timestamp: new Date(),
        },

        {
            id: "3",
            title: "Assault",
            incidentType: IncidentType.ASSAULT,
            description: "An assault occurred at the park.",
            location: { latitude: 37.7749, longitude: -122.4194 },
            timestamp: new Date(),
        },

        {
            id: "4",
            title: "Theft",
            incidentType: IncidentType.THEFT,
            description: "A theft occurred at the mall.",
            location: { latitude: 37.7749, longitude: -122.4194 },
            timestamp: new Date(),
        },

        {
            id: "5",
            title: "Vandalism",
            incidentType: IncidentType.VANDALISM,
            description: "Vandalism occurred at the school.",
            location: { latitude: 37.7749, longitude: -122.4194 },
            timestamp: new Date(),
        },

        {
            id: "6",
            title: "Burglary",
            incidentType: IncidentType.THEFT,
            description: "A burglary occurred at the house.",
            location: { latitude: 37.7749, longitude: -122.4194 },
            timestamp: new Date(),
        }
    ];
}