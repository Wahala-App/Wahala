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

// In-memory storage for Vercel (will reset on each deployment)
let incidentsCache: Incident[] | null = null;

function loadIncidents(): Incident[] {
  // Try to use cache first
  if (incidentsCache) {
    return incidentsCache;
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const incidents = JSON.parse(data).map((incident: any) => ({
        ...incident,
        timestamp: new Date(incident.timestamp)
      }));
      incidentsCache = incidents;
      return incidents;
    }
  } catch (error) {
    console.warn('Failed to read incidents file:', error);
  }

  // Fallback to default incidents
  incidentsCache = defaultIncidents;
  return defaultIncidents;
}

function saveIncidents(incidents: Incident[]): void {
  // Update cache
  incidentsCache = incidents;
  
  // Try to save to file (will work in development, fail silently in production)
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(incidents, null, 2));
  } catch (error) {
    console.warn('Failed to save incidents to file (expected in production):', error);
    // In production, we rely on the cache which will persist for the duration of the serverless function
  }
}

export async function GET() {
  try {
    const incidents = loadIncidents();
    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error loading incidents:', error);
    return NextResponse.json(defaultIncidents);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incidents = loadIncidents();
    
    const newIncident: Incident = {
      ...body,
      id: (Math.max(...incidents.map(i => parseInt(i.id)), 0) + 1).toString(),
      location: body.location || getRandomLocationNearby(),
      timestamp: new Date(),
    };

    const updatedIncidents = [...incidents, newIncident];
    saveIncidents(updatedIncidents);
    
    return NextResponse.json(newIncident, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const incidents = loadIncidents();

        const incidentToDelete: Incident = incidents.filter((incident, idx) => incident.id === body.id)[0];

        const updatedIncidents = incidents.filter((incident, idx) => incident.id != body.id);
        saveIncidents(updatedIncidents);

        return NextResponse.json(incidentToDelete, { status: 200 });
    } catch (error) {
        console.error('Error deleting incident:', error);
        return NextResponse.json(
            { error: 'Failed to delete incident' },
            { status: 400 }
        );
    }
}
