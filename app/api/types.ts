export interface Incident {
    id: string;
    incidentType: IncidentType;
    title: string;
    description?: string;
    location: Location;
    timestamp: Date;
}

export enum IncidentType { 
    ROBBERY = "Robbery",
    ASSAULT = "Assault",
    THEFT = "Theft",
    VANDALISM = "Vandalism",
    DRUG_OFFENSE = "Drug Offense",
    PUBLIC_INTOXICATION = "Public Intoxication",
}

export interface Location {
    latitude: number;
    longitude: number;
}