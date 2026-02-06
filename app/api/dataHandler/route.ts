import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import {
  deleteLocationPin,
  storeLocationPin,
  retrieveLocationPins,
  retrieveLocationPinById,
} from '@/app/actions/dataHandler';
const DATA_FILE = path.join(process.cwd(), 'data', 'incidents.json');



export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No idToken provided" }), {
        status: 401,
      });
    }

    const idToken = authHeader.split("Bearer ")[1];

    const url = new URL(request.url);
    const incidentId = url.searchParams.get("id");

    if (incidentId) {
      const pin = await retrieveLocationPinById(idToken, incidentId);

      if (!pin) {
        return NextResponse.json(
          { error: "Incident not found" },
          { status: 404 }
        );
      }

      console.log("Retrieved single incident");
      return NextResponse.json(pin, { status: 200 });
    }

    const pins = await retrieveLocationPins(idToken);

    console.log("Retrieved incidents");

    return NextResponse.json(pins, { status: 200 });
  } catch (error) {
    console.error("Error retrieveing incident:", error);
    return NextResponse.json(
      { error: `Error retrieveing incident: ${error}` },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No idToken provided' }), { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // No file handling needed - we already have the S3 URL
    await storeLocationPin(
      idToken,
      body.incidentType,
      body.title,
      body.description,
      body.coordinates,
      body.dateTime,
      body.severity,
      body.areaSize,
      body.evidenceUrl || null // Just pass the URL
    );

    console.log("Successfully stored incident");
    return NextResponse.json("Success", { status: 200 });
  } catch (error) {
    const err = error as { type?: string; message?: string };
    if (err.type === "rate_limit") {
      return NextResponse.json(
        { error: err.message ?? "Rate limit exceeded. Please wait before posting again." },
        { status: 429 }
      );
    }
    console.error('Error storing incident:', error);
    return NextResponse.json({ error: error }, { status: 400 });
  }
}
      
 export async function PUT() { //Update but not delete

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
        
        await deleteLocationPin(idToken, incidentId);
        
        console.log("Successfully deleted incident")

        return NextResponse.json(incidentId, { status: 200 });
    } catch (error) {
        console.error('Error deleting incident:', error);
        return NextResponse.json(
            { error: `Failed to delete incident ${error}`, },
            { status: 400 }
        );
    }
}
