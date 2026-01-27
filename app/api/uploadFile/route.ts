import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/app/actions/uploadFile';
import { getToken } from '@/app/actions/auth';
import { auth } from 'firebase-admin';

// Initialize Firebase Admin if needed (copy from dataHandler)
import * as admin from 'firebase-admin';

const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No idToken provided' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify user is authenticated
    try {
      await auth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
    }

    // Generate presigned URL
    const { uploadUrl, fileUrl, fileKey } = await generatePresignedUploadUrl(
      fileName,
      fileType,
      'evidence'
    );

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      fileKey,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}