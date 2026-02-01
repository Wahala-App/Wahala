export interface Incident {
  id: string;
  incidentType: IncidentType;
  incident_type: IncidentType;
  title: string;
  description?: string;
  coordinates: Location;
  // Stored as string in Supabase, but treated as 1–10 scale
  severity?: number | string;
  // Username of the incident creator
  creator_username?: string;
  // S3 URL of uploaded evidence file
  evidence_url?: string;
  // Number of live updates
  update_count?: number;
  date_time: string;
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

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  creator_uid: string;
  creator_username?: string;
  body: string;
  severity: number;
  media_url?: string;
  created_at: string;
}
