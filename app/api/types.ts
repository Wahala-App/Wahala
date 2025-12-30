export interface Incident {
  doc_Id: any;
  id: string;
  incidentType: IncidentType;
  title: string;
  description?: string;
  location: Location;
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
