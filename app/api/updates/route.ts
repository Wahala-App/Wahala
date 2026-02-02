import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/app/actions/auth';
import { deleteIncidentUpdate, storeIncidentUpdate, retrieveIncidentUpdates, updateIncidentSeverity } from '@/app/actions/dataHandler';
import { auth } from 'firebase-admin';
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

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incident_id');

    if (!incidentId) {
      return NextResponse.json({ error: 'incident_id query parameter is required' }, { status: 400 });
    }

    const updates = await retrieveIncidentUpdates(idToken, incidentId);

    return NextResponse.json(updates, { status: 200 });
  } catch (error: any) {
    console.error('Error retrieving updates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve updates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { incident_id, body: updateBody, severity, media_url, kind } = body;

    // Validation
    if (!incident_id) {
      return NextResponse.json({ error: 'incident_id is required' }, { status: 400 });
    }

    if (!updateBody || typeof updateBody !== 'string' || updateBody.trim().length === 0) {
      return NextResponse.json({ error: 'body is required and must be a non-empty string' }, { status: 400 });
    }

    if (severity === undefined || severity === null) {
      return NextResponse.json({ error: 'severity is required' }, { status: 400 });
    }

    const severityNum = parseInt(severity);
    if (isNaN(severityNum) || severityNum < 1 || severityNum > 10) {
      return NextResponse.json({ error: 'severity must be a number between 1 and 10' }, { status: 400 });
    }

    const updateKind = (kind ?? 'update') as string;
    if (updateKind !== 'update' && updateKind !== 'disprove') {
      return NextResponse.json({ error: 'kind must be either update or disprove' }, { status: 400 });
    }

    // Store the update
    const update = await storeIncidentUpdate(
      idToken,
      incident_id,
      updateBody,
      severityNum,
      media_url,
      updateKind as "update" | "disprove"
    );

    // Recalculate and update incident severity
    try {
      await updateIncidentSeverity(idToken, incident_id);
    } catch (error) {
      console.error('Failed to update incident severity:', error);
      // Don't fail the request if severity update fails
    }

    return NextResponse.json(update, { status: 201 });
  } catch (error: any) {
    console.error('Error creating update:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create update' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const updateId = searchParams.get('update_id');

    if (!updateId) {
      return NextResponse.json({ error: 'update_id query parameter is required' }, { status: 400 });
    }

    const result = await deleteIncidentUpdate(idToken, updateId);

    return NextResponse.json({ ok: true, incident_id: result.incident_id }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting update:', error);
    const status = error?.type === 'auth' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to delete update' },
      { status }
    );
  }
}
