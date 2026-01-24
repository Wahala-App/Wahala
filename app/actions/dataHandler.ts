'use server';

import { Incident, IncidentType } from "../api/types";
import { createClient } from "@supabase/supabase-js";
import { jwtDecode } from "jwt-decode";
import { auth } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
// Helper: Verify the user's Firebase ID token and get their UID
import * as admin from 'firebase-admin';
// === Initialize Firebase Admin ===


const serviceAccount : admin.ServiceAccount = { 
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_CLIENT_EMAIL,
}


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

//const db = admin.firestore(); // ← This is how you get the DB on server


// === Initialize Supabase ===
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side operations
);

const standardUTCDate = () =>
{
  //To ensure standard logged date using UTC for pins for the day
      const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'UTC'
      });

      return today
}

async function getAuthenticatedUser(idToken: string) {
  try {
    const decodedToken = await auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Invalid or missing token:', error);
    throw { type: 'auth', message: 'Unauthorized: Invalid token' };
  }
}


export async function storeLocationPin(
  idToken: string,
  incidentType: string,
  title: string,
  description: string,
  coordinates: string,
  dateTime: string
) {
  try {
    const uid = await getAuthenticatedUser(idToken);

    // To ensure standard logged date using UTC for pins for the day
    const today = parseLocalTimestampToUTC(dateTime, 'date');

    // Use service role key to bypass RLS
    // We verify ownership manually by extracting uid from idToken
    const { data, error } = await supabase
      .from('location_pins')
      .insert([
        {
          creator_uid: uid,
          incident_type: incidentType,
          title: title,
          description: description,
          coordinates: coordinates,
          date_time: dateTime,
          date_key: today, // For quick filtering
          added_on: new Date().toISOString(),
        }
      ])
      .select();

    if (error) {
      console.error("Failed to store location pin:", error);
      throw { type: "data", message: `Failed to store location pin. Try again: ${error.message}` };
    }

    console.log("Location pin saved successfully");
    return data;
  } catch (error) {
    console.error("Failed to store location pin", error);
    throw { type: "data", message: `Failed to store location pin. Try again: ${error}` };
  }
}

export async function retrieveLocationPins(idToken: string): Promise<Incident[]> {
  try {
    // To ensure standard logged date using UTC for pins for the day
    const today = standardUTCDate();

    console.log("In retrieveLocationPins");
    const uid = await getAuthenticatedUser(idToken);

    const { data, error } = await supabase
      .from('location_pins')
      .select('*')
      .order('added_on', { ascending: false }) // Most recent first
      .returns<any[]>();

    if (error) {
      console.error("Failed to obtain location pins:", error);
      throw { type: "data", message: "Failed to obtain location pins. Try again." };
    }

    if (!data || data.length === 0) {
      console.log("No pins");
      return [];
    }

    // Map database rows to Incident type
    const pinData = data.map(pinDoc => ({
      id: pinDoc.id,
      ...pinDoc,
    } as Incident));

    //console.log("pinData:", pinData);
    console.log("Location pins obtained successfully");
    return pinData;
  } catch (error) {
    console.error("Failed to obtain location pins", error);
    throw { type: "data", message: "Failed to obtain location pins. Try again." };
  }
}

export async function deleteLocationPin(idToken: string, incidentId: string) {
  try {
    const uid = await getAuthenticatedUser(idToken);

    // First, fetch the pin to check if the user owns it
    const { data: pinData, error: fetchError } = await supabase
      .from('location_pins')
      .select('creator_uid')
      .eq('id', incidentId)
      .single();

    if (fetchError || !pinData) {
      console.log(`No pin found for ${incidentId}`);
      return false;
    }

    // Check if the user owns this pin
    if (pinData.creator_uid !== uid) {
      throw { type: 'data', message: `Failed to delete pin ${incidentId}` };
    }

    // Delete the pin
    const { error: deleteError } = await supabase
      .from('location_pins')
      .delete()
      .eq('id', incidentId);

    if (deleteError) {
      console.error('Failed to delete pin:', deleteError);
      throw { type: 'data', message: `Failed to delete pin ${incidentId}` };
    }

    console.log(`Deleted pin ${incidentId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete pin:', error);
    throw { type: 'data', message: `Failed to delete pin ${incidentId}` };
  }
}

function parseLocalTimestampToUTC(stored: string, output: string) {
  // 1. Regex to find exactly "+HH:mm" or "-HH:mm" inside the GMT parentheses
  const offsetMatch = stored.match(/GMT([+-]\d{2}:\d{2})/);
  if (!offsetMatch) throw new Error("Offset not found");
  const offset = offsetMatch[1]; 

  // 2. Format as a strict ISO string: "YYYY-MM-DDTHH:mm:ss-05:00"
  // This tells JS: "This time IS in -05:00. Convert it to UTC for me."
  const dateTimeStr = stored.split(' (')[0].replace(' ', 'T');
  const utcDate = new Date(`${dateTimeStr}${offset}`);

  if (isNaN(utcDate.getTime())) throw new Error("Invalid date result");

  // 3. Output logic
  if (output === 'date') {
    // toISOString always returns the UTC calendar date
    return utcDate.toISOString().split('T')[0]; 
  }

  return utcDate;
}

// Test: 2025-12-30 15:34:33 (GMT-05:00) 
// Result: 2025-12-30 (since UTC is 20:34 on the same day)
