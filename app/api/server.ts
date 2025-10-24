import { IncidentType, Incident } from "./types";

const FALLBACK_LOCATION = { latitude: 32.4173824, longitude: -81.7856512 };

function getRandomLocationNearby() {
  const mileToLat = 1 / 69;
  const mileToLng =
    1 / (69 * Math.cos((FALLBACK_LOCATION.latitude * Math.PI) / 180));

  const radius = 0.5;
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radius;

  return {
    latitude:
      FALLBACK_LOCATION.latitude + Math.cos(angle) * distance * mileToLat,
    longitude:
      FALLBACK_LOCATION.longitude + Math.sin(angle) * distance * mileToLng,
  };
}

let incidents: Incident[] = [
  {
    id: "1",
    title: "Stabbing",
    incidentType: IncidentType.ASSAULT,
    description: "A stabbing occurred at the park.",
    location: getRandomLocationNearby(),
    timestamp: new Date(),
  },
  {
    id: "2",
    title: "Robbery",
    incidentType: IncidentType.ROBBERY,
    description: "A robbery occurred at the store.",
    location: getRandomLocationNearby(),
    timestamp: new Date(),
  },
  {
    id: "3",
    title: "Assault",
    incidentType: IncidentType.ASSAULT,
    description: "An assault occurred at the park.",
    location: getRandomLocationNearby(),
    timestamp: new Date(),
  },
  {
    id: "4",
    title: "Theft",
    incidentType: IncidentType.THEFT,
    description: "A theft occurred at the mall.",
    location: getRandomLocationNearby(),
    timestamp: new Date(),
  },
  {
    id: "5",
    title: "Vandalism",
    incidentType: IncidentType.VANDALISM,
    description: "Vandalism occurred at the school.",
    location: getRandomLocationNearby(),
    timestamp: new Date(),
  },
  {
    id: "6",
    title: "Burglary",
    incidentType: IncidentType.THEFT,
    description: "A burglary occurred at the house.",
    location: getRandomLocationNearby(),
    timestamp: new Date(),
  },
];

export function getNearbyIncidents(): Incident[] {
  return incidents;
}

export function createIncident(
  incidentData: Omit<Incident, "id" | "timestamp">,
): Incident {
  const newIncident: Incident = {
    ...incidentData,
    id: (incidents.length + 1).toString(),
    timestamp: new Date(),
  };

  incidents.push(newIncident);
  console.log("New incident created:", newIncident);

  return newIncident;
}
