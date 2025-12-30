import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Incident, IncidentType } from '../types';
import { deleteLocationPin } from '@/app/actions/serverDataHandler';
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
  // {
  //   id: "0",
  //   title: "Stabbing",
  //   incidentType: IncidentType.ASSAULT,
  //   description: "A stabbing occurred at the park.",
  //   location: getRandomLocationNearby(),
  //   doc_Id: "0",
  // },
  // {
  //   id: "1",
  //   title: "Stabbing",
  //   incidentType: IncidentType.ASSAULT,
  //   description: "A stabbing occurred at the park.",
  //   location: getRandomLocationNearby(),
  //   doc_Id: "2",
  // },
  // {
  //   id: "2",
  //   title: "Robbery",
  //   incidentType: IncidentType.ROBBERY,
  //   description: "A robbery occurred at the store.",
  //   location: getRandomLocationNearby(),
  //   doc_Id: "3",
  // },
  // {
  //   id: "3",
  //   title: "Assault",
  //   incidentType: IncidentType.ASSAULT,
  //   description: "An assault occurred at the park.",
  //   location: getRandomLocationNearby(),
  //   doc_Id: "4",
  // },
  // {
  //   id: "4",
  //   title: "Theft",
  //   incidentType: IncidentType.THEFT,
  //   description: "A theft occurred at the mall.",
  //   location: getRandomLocationNearby(),
  //   doc_Id: "5"
  // },
  // {
  //   id: "5",
  //   title: "Vandalism",
  //   incidentType: IncidentType.VANDALISM,
  //   description: "Vandalism occurred at the school.",
  //   location: getRandomLocationNearby(),
  //   doc_Id: "6",
  // },
  // {
  //   id: "6",
  //   title: "Burglary",
  //   incidentType: IncidentType.THEFT,
  //   description: "A burglary occurred at the house.",
  //   location: getRandomLocationNearby(),
  //   doc_Id: "8",
  // },
];

//Oriekaose: Conflicts with database incident population
//Let it only load default incidents
// // In-memory storage for Vercel (will reset on each deployment)

let incidentsCache: Incident[];

function loadIncidents(): Incident[] {
  // // Try to use cache first
  // if (incidentsCache) {
  //   return incidentsCache;
  // }

  // try {
  //   if (fs.existsSync(DATA_FILE)) {
  //     const data = fs.readFileSync(DATA_FILE, 'utf8');
  //     const incidents = JSON.parse(data).map((incident: any) => ({
  //       ...incident,
  //       timestamp: new Date(incident.timestamp)
  //     }));
  //     incidentsCache = incidents;
  //     return incidents;
  //   }
  // } catch (error) {
  //   console.warn('Failed to read incidents file:', error);
  // }

  // Fallback to default incidents
  return     defaultIncidents;
;
}
    //Modified to temprorarily store per session not cache for longer periods
function saveIncidents(incidents: Incident[]): void {
  // Update cache
  incidentsCache = incidents;
  
  // // Try to save to file (will work in development, fail silently in production)
  // try {
  //   const dir = path.dirname(DATA_FILE);
  //   if (!fs.existsSync(dir)) {
  //     fs.mkdirSync(dir, { recursive: true });
  //   }
  //   fs.writeFileSync(DATA_FILE, JSON.stringify(incidents, null, 2));
  // } catch (error) {
  //   console.warn('Failed to save incidents to file (expected in production):', error);
  //   // In production, we rely on the cache which will persist for the duration of the serverless function
  // }
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

let pinId= 0;

export async function POST(request: NextRequest) {
  //Force this request to wait for the previous one to finish
  console.log("Pin Id", pinId);
      try {
        const body = await request.json();
      
        const exists = incidentsCache.find(i => i.doc_Id === body.doc_Id);
        
        if (exists) {
          return NextResponse.json(exists, { status: 200 }); // Already have it, don't duplicate
        }
        
        // if (!exists)
        // {
              const newIncident: Incident = {
                ...body,
                id: (pinId++).toString(),
                location: body.location
              };
              
              incidentsCache = [...incidentsCache, newIncident];
              //saveIncidents(updatedIncidents);
              
              return NextResponse.json(newIncident, { status: 201 });
       // }
      
      }catch (error) {
      console.error('Error creating incident:', error);
      return NextResponse.json(
        { error: error },
        { status: 400 });
 } }
      
 export async function PUT() {
  pinId = 0;
  incidentsCache =[]; // Clear the array if you want a full reset
  return NextResponse.json({ message: "Reset successful" });
}

export async function DELETE(request: NextRequest) {
    try {
         
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No idToken provided' }), { status: 401 });
    }

      const idToken = authHeader.split('Bearer ')[1];

      // 3. Get the incidentId from the query parameter
      const url = new URL(request.url);
      const incidentId = url.searchParams.get('id');
      if (!incidentId) {
          return new Response(JSON.stringify({ error: 'Missing incident id' }), { status: 400 });
        }
        
        const incidents = incidentsCache;

        const incidentToDelete = incidents.filter( incident => incident.id == incidentId)[0];

        const updatedIncidents = incidents.filter(incident => incident.id != incidentId);
       
        await deleteLocationPin(idToken, incidentToDelete);
        
        console.log("Successfully deleted incident")

        return NextResponse.json(incidentToDelete, { status: 200 });
    } catch (error) {
        console.error('Error deleting incident:', error);
        return NextResponse.json(
            { error: `Failed to delete incident ${error}`, },
            { status: 400 }
        );
    }
}
