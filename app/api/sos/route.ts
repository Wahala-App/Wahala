import { NextRequest, NextResponse } from "next/server";
import { createSOSEvent } from "@/app/actions/sos";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No idToken provided" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const body = await request.json();

    const latitude = typeof body.latitude === "number" ? body.latitude : parseFloat(body.latitude);
    const longitude = typeof body.longitude === "number" ? body.longitude : parseFloat(body.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    const event = await createSOSEvent(idToken, latitude, longitude);
    return NextResponse.json(event, { status: 201 });
  } catch (error: unknown) {
    const err = error as { type?: string; message?: string };
    if (err.type === "auth") {
      return NextResponse.json({ error: err.message ?? "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating SOS event:", error);
    return NextResponse.json(
      { error: err.message ?? "Failed to create SOS event" },
      { status: 400 }
    );
  }
}
