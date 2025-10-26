import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Incident, IncidentType } from '../types';

const DATA_FILE = path.join(process.cwd(), 'data', 'incidents.json');

const FALLBACK_LOCATION = { latitude: 32.4173824, longitude: -81.7856512 };

function getRandomLocationNearby() {
  const mileToLat = 1 / 69;
  const mileToLng = 1 / (69 * Math.cos((FALLBACK_LOCATION.latitude * Math.PI) / 180));
  const radius = 0.5;
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radius;

  return {
    latitude: FALLBACK_LOCATION.latitude + Math.cos(angle) * distance * mileToLat,
    longitude: FALLBACK_LOCATION.longitude + Math.sin(angle) * distance * mileToLng,
  };
}

const defaultIncidents: Incident[] = [
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

function loadIncidents(): Incident[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return defaultIncidents;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data).map((incident: any) => ({
      ...incident,
      location: getRandomLocationNearby(),
      timestamp: new Date(incident.timestamp)
    }));
  } catch {
    return defaultIncidents;
  }
}

function saveIncidents(incidents: Incident[]): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(incidents, null, 2));
  } catch (error) {
    console.error('Failed to save incidents:', error);
  }
}

export async function GET() {
  const incidents = loadIncidents();
  return NextResponse.json(incidents);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incidents = loadIncidents();
    
    const newIncident: Incident = {
      ...body,
      id: (Math.max(...incidents.map(i => parseInt(i.id)), 0) + 1).toString(),
      location: getRandomLocationNearby(),
      timestamp: new Date(),
    };

    incidents.push(newIncident);
    saveIncidents(incidents);
    
    return NextResponse.json(newIncident, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 400 }
    );
  }
}
