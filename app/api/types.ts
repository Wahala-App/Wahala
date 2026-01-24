export interface Incident {
  id: string;
  incidentType: IncidentType;
  incident_type: IncidentType;
  title: string;
  description?: string;
  coordinates: Location;
}

export enum IncidentType {
  NONE = "",
  ROBBERY = "Robbery",
  ASSAULT = "Assault",
  THEFT = "Theft",
  VANDALISM = "Vandalism",
  DRUG_OFFENSE = "Drug Offense",
  PUBLIC_INTOXICATION = "Public Intoxication",
  OTHER = "Other",
}

export interface Location {
  latitude: number;
  longitude: number;
}
