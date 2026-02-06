import { NextRequest, NextResponse } from "next/server";
import { getSOSRecipients, addSOSRecipient, removeSOSRecipient } from "@/app/actions/sos";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No idToken provided" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const recipients = await getSOSRecipients(idToken);
    return NextResponse.json(recipients, { status: 200 });
  } catch (error: unknown) {
    const err = error as { type?: string; message?: string };
    if (err.type === "auth") {
      return NextResponse.json({ error: err.message ?? "Unauthorized" }, { status: 401 });
    }
    console.error("Error getting SOS recipients:", error);
    return NextResponse.json(
      { error: err.message ?? "Failed to get recipients" },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No idToken provided" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const body = await request.json();
    const email = body.email?.trim();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const recipient = await addSOSRecipient(idToken, email);
    return NextResponse.json(recipient, { status: 201 });
  } catch (error: unknown) {
    const err = error as { type?: string; message?: string };
    if (err.type === "auth") {
      return NextResponse.json({ error: err.message ?? "Unauthorized" }, { status: 401 });
    }
    if (err.type === "validation") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Error adding SOS recipient:", error);
    return NextResponse.json(
      { error: err.message ?? "Failed to add recipient" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No idToken provided" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.trim();

    if (!email) {
      return NextResponse.json(
        { error: "Email query parameter is required" },
        { status: 400 }
      );
    }

    await removeSOSRecipient(idToken, email);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const err = error as { type?: string; message?: string };
    if (err.type === "auth") {
      return NextResponse.json({ error: err.message ?? "Unauthorized" }, { status: 401 });
    }
    console.error("Error removing SOS recipient:", error);
    return NextResponse.json(
      { error: err.message ?? "Failed to remove recipient" },
      { status: 400 }
    );
  }
}
