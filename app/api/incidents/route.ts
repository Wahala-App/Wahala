import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Incident, IncidentType } from '../types';
import { deleteLocationPin } from '@/app/actions/dataHandler';
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
 
];

let incidentsCache: Incident[];

function loadIncidents(): Incident[] {

  return     defaultIncidents;
;
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
      
        const exists = incidentsCache.find(i => i.id === body.doc_Id);
        
        if (exists) {
          return NextResponse.json(exists, { status: 200 }); // Already have it, don't duplicate
        }
        
        // if (!exists)
        // {
              const newIncident: Incident = {
                ...body,
             //   id: (pinId++).toString(),
             //   location: body.location
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
