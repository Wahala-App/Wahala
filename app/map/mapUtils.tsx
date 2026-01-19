import { IncidentType, Location } from "../api/types";

// Default fallback location: Statesboro, GA
export const FALLBACK_LOCATION = {
  latitude: 32.4173824,
  longitude: -81.7856512,
};

export default function getCurrLocation(): Promise<Location> {
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
        console.log("Current location:", lat, long);
        resolve({ latitude: lat, longitude: long });
      },
      (error) => {
        console.error("Error getting location:", error);
        // Fallback coordinates if geolocation fails
        resolve(FALLBACK_LOCATION);
      },
    );
  });
}

export function incidentToIcon(incidentType: IncidentType): string {
  console.log(incidentType)
  switch (incidentType) {
    case IncidentType.ASSAULT:
      return "/crimeSpecialization/assault.svg";
    case IncidentType.VANDALISM:
      return "/crimeSpecialization/vandalism.svg";
    case IncidentType.THEFT:
      return "/crimeSpecialization/theft.svg";
    case IncidentType.DRUG_OFFENSE:
      return "/crimeSpecialization/drug.svg";
    case IncidentType.ROBBERY:
      return "/crimeSpecialization/robbery.svg";
    case IncidentType.PUBLIC_INTOXICATION:
      return "/crimeSpecialization/alcohol.svg";
    default:
      return "/crimeSpecialization/default.svg";
  }
}
export function incidentIcon(incidentType: IncidentType): HTMLElement {
  const iconPath = incidentToIcon(incidentType);
  const backgroundColor = getIncidentColor(incidentType);
  
  const container = document.createElement("div");
  container.className = "incident-marker";
  container.style.cssText = `
    width: 40px;
    height: 40px;
    background-color: ${backgroundColor};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border: 2px solid white;
  `;
  
  const icon = document.createElement("img");
  icon.src = iconPath;
  icon.style.cssText = `
    width: 24px;
    height: 24px;
    filter: brightness(0) invert(1);
  `;
  
  container.appendChild(icon);
  return container;
}

function getIncidentColor(incidentType: IncidentType): string {
  switch (incidentType) {
    case IncidentType.ASSAULT:
      return "#dc2626"; // red-600
    case IncidentType.VANDALISM:
      return "#ea580c"; // orange-600
    case IncidentType.THEFT:
      return "#7c3aed"; // violet-600
    case IncidentType.DRUG_OFFENSE:
      return "#059669"; // emerald-600
    case IncidentType.ROBBERY:
      return "#b91c1c"; // red-700
    case IncidentType.PUBLIC_INTOXICATION:
      return "#0891b2"; // cyan-600
    default:
      return "#6b7280"; // gray-500
  }
}
