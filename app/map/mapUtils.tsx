import { IncidentType, Location } from "../api/types";

// Default fallback location: Statesboro, GA
export const FALLBACK_LOCATION = {
  latitude: 32.4173824,
  longitude: -81.7856512,
};

export default function getCurrLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      // Fallback coordinates if geolocation is not supported
      resolve(FALLBACK_LOCATION);
      return;
    }

    const options = {
      enableHighAccuracy: true, // Use GPS if available
      timeout: 10000, // 10 second timeout
      maximumAge: 0, // Don't use cached location, always get fresh one
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        console.log("✅ Successfully got current location:", lat, long);
        console.log("Accuracy:", position.coords.accuracy, "meters");
        resolve({ latitude: lat, longitude: long });
      },
      (error) => {
        let errorMessage = "Unknown error";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "User denied the request for Geolocation. Please enable location permissions in your browser settings.";
            console.error("❌ Location error: Permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            console.error("❌ Location error: Position unavailable");
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out.";
            console.error("❌ Location error: Request timeout");
            break;
          default:
            errorMessage = "An unknown error occurred while getting location.";
            console.error("❌ Location error:", error);
            break;
        }
        
        // Still resolve with fallback, but log the error clearly
        console.warn("⚠️ Using fallback location due to error:", errorMessage);
        console.warn("⚠️ Fallback location:", FALLBACK_LOCATION);
        resolve(FALLBACK_LOCATION);
      },
      options
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

export function sosIcon(): HTMLElement {
  const container = document.createElement("div");
  container.className = "sos-marker";
  container.style.cssText = `
    width: 40px;
    height: 40px;
    background-color: #dc2626;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border: 2px solid white;
  `;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "white");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = `
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
    <path d="m5 3 2 2"/>
    <path d="m19 3 2 2"/>
    <path d="m3 9 2 2"/>
    <path d="m19 9 2 2"/>
    <path d="m3 15 2 2"/>
    <path d="m19 15 2 2"/>
  `;
  container.appendChild(svg);
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
