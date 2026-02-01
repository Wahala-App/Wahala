import { NextRequest, NextResponse } from "next/server";
import { generatePresignedViewUrl } from "@/app/actions/uploadFile";
import { getToken } from "@/app/actions/auth";
import { auth } from "firebase-admin";

// Initialize Firebase Admin if needed
import * as admin from "firebase-admin";

const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No idToken provided" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Verify user is authenticated
    try {
      await auth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing file URL parameter" }, { status: 400 });
    }

    // Generate presigned URL (valid for 1 hour)
    const presignedUrl = await generatePresignedViewUrl(fileUrl, 3600);

    return NextResponse.json({ url: presignedUrl }, { status: 200 });
  } catch (error) {
    console.error("Error generating presigned view URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned view URL" },
      { status: 500 }
    );
  }
}
