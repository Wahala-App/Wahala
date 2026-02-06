import { NextRequest, NextResponse } from "next/server";
import { getSOSEventsForCurrentUser } from "@/app/actions/sos";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No idToken provided" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const events = await getSOSEventsForCurrentUser(idToken);
    return NextResponse.json(events, { status: 200 });
  } catch (error: unknown) {
    const err = error as { type?: string; message?: string };
    if (err.type === "auth") {
      return NextResponse.json({ error: err.message ?? "Unauthorized" }, { status: 401 });
    }
    console.error("Error getting SOS events:", error);
    return NextResponse.json(
      { error: err.message ?? "Failed to get SOS events" },
      { status: 400 }
    );
  }
}
