export interface Incident {
  id: string;
  incidentType: IncidentType;
  incident_type: IncidentType;
  title: string;
  description?: string;
  coordinates: Location;
  // Stored as string in Supabase, but treated as 1–10 scale
  severity?: number | string;
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
