import { Incident, IncidentType, IncidentUpdate } from "../api/types";
import { createClient } from "@supabase/supabase-js";
import { jwtDecode } from "jwt-decode";
import { auth } from 'firebase-admin';
import {deleteFileFromS3} from './uploadFile';
import { FieldValue } from 'firebase-admin/firestore';
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

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Server-side only
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
  dateTime: string,
  severity: string,
  areaSize: string,
  evidenceUrl: string,
) {
  try {
    const uid = await getAuthenticatedUser(idToken);
    
    console.log("date time, ", dateTime)
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
          severity: severity,
          area_size: areaSize,
          evidence_url: evidenceUrl,
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

    // Fetch usernames for all unique creator UIDs
    const creatorUids = [...new Set(data.map((pin: any) => pin.creator_uid).filter(Boolean))];
    const usernameMap: Record<string, string> = {};

    if (creatorUids.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('uid, user_name')
        .in('uid', creatorUids);

      if (!userError && userData) {
        userData.forEach((user: any) => {
          if (user.user_name) {
            usernameMap[user.uid] = user.user_name;
          }
        });
      }
    }

    // Map database rows to Incident type
    const pinData = data.map(pinDoc => ({
      id: pinDoc.id,
      ...pinDoc,
      creator_username: pinDoc.creator_uid ? usernameMap[pinDoc.creator_uid] : undefined,
    } as Incident));

    //console.log("pinData:", pinData);
    console.log("Location pins obtained successfully");
    return pinData;
  } catch (error) {
    console.error("Failed to obtain location pins", error);
    throw { type: "data", message: "Failed to obtain location pins. Try again." };
  }
}

export async function retrieveLocationPinById(
  idToken: string,
  incidentId: string
): Promise<Incident | null> {
  try {
    console.log("In retrieveLocationPinById", incidentId);
    const uid = await getAuthenticatedUser(idToken);

    const { data, error } = await supabase
      .from("location_pins")
      .select("*")
      .eq("id", incidentId)
      .maybeSingle();

    if (error) {
      console.error("Failed to obtain location pin:", error);
      throw { type: "data", message: "Failed to obtain location pin. Try again." };
    }

    if (!data) {
      console.log("No pin found for id", incidentId);
      return null;
    }

    // Fetch username for the creator
    let creatorUsername: string | undefined = undefined;
    if (data.creator_uid) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_name')
        .eq('uid', data.creator_uid)
        .maybeSingle();

      if (!userError && userData?.user_name) {
        creatorUsername = userData.user_name;
      }
    }

    const pinData = {
      id: data.id,
      ...data,
      creator_username: creatorUsername,
    } as Incident;

    return pinData;
  } catch (error) {
    console.error("Failed to obtain location pin", error);
    throw { type: "data", message: "Failed to obtain location pin. Try again." };
  }
}

export async function deleteLocationPin(idToken: string, incidentId: string) {
  try {
    const uid = await getAuthenticatedUser(idToken);

    // First, fetch the pin to check if the user owns it and get evidence URL
    const { data: pinData, error: fetchError } = await supabase
      .from('location_pins')
      .select('creator_uid, evidence_url')
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

    // ADDED: Delete the evidence file from S3 if it exists
    if (pinData.evidence_url) {
      try {
        await deleteFileFromS3(pinData.evidence_url);
        console.log(`Deleted evidence file for pin ${incidentId}`);
      } catch (deleteFileError) {
        console.error('Failed to delete evidence file from S3:', deleteFileError);
        // Continue with pin deletion even if file deletion fails
        // The file might have already been deleted or the URL might be invalid
      }
    }

    // Delete the pin from database
    const { error: deleteError } = await supabase
      .from('location_pins')
      .delete()
      .eq('id', incidentId);

    if (deleteError) {
      console.error('Failed to delete pin data:', deleteError);
      throw { type: 'data', message: `Failed to delete pin ${incidentId} data` };
    }

    console.log(`Deleted pin ${incidentId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete pin:', error);
    throw { type: 'data', message: `Failed to delete pin ${incidentId}` };
  }
}

function parseLocalTimestampToUTC(stored: string, output: string) {
  console.log(stored)
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

export async function storeIncidentUpdate(
  idToken: string,
  incidentId: string,
  body: string,
  severity: number,
  mediaUrl?: string
): Promise<IncidentUpdate> {
  try {
    const uid = await getAuthenticatedUser(idToken);
    
    // Verify incident exists
    const { data: incidentData, error: incidentError } = await supabase
      .from('location_pins')
      .select('id')
      .eq('id', incidentId)
      .maybeSingle();

    if (incidentError || !incidentData) {
      throw { type: "data", message: "Incident not found" };
    }

    // Get today's date for date_key
    const today = standardUTCDate();

    // Insert the update
    const { data, error } = await supabase
      .from('incident_updates')
      .insert([
        {
          incident_id: incidentId,
          creator_uid: uid,
          body: body.trim(),
          severity: Math.min(10, Math.max(1, severity)), // Clamp between 1-10
          media_url: mediaUrl || null,
          date_key: today,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Failed to store incident update:", error);
      throw { type: "data", message: `Failed to store update: ${error.message}` };
    }

    // Update the incident's update_count
    const { error: updateCountError } = await supabase.rpc('increment_update_count', {
      incident_id_param: incidentId
    });

    // If RPC doesn't exist, manually update
    if (updateCountError) {
      const { data: currentIncident } = await supabase
        .from('location_pins')
        .select('update_count')
        .eq('id', incidentId)
        .single();

      const newCount = (currentIncident?.update_count || 0) + 1;

      await supabase
        .from('location_pins')
        .update({ update_count: newCount })
        .eq('id', incidentId);
    }

    console.log("Incident update saved successfully");
    return data as IncidentUpdate;
  } catch (error) {
    console.error("Failed to store incident update", error);
    throw error;
  }
}

export async function retrieveIncidentUpdates(
  idToken: string,
  incidentId: string
): Promise<IncidentUpdate[]> {
  try {
    await getAuthenticatedUser(idToken); // Verify auth

    // Fetch all updates for this incident
    const { data, error } = await supabase
      .from('incident_updates')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Failed to retrieve incident updates:", error);
      throw { type: "data", message: "Failed to retrieve updates. Try again." };
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch usernames for all unique creator UIDs
    const creatorUids = [...new Set(data.map((update: any) => update.creator_uid).filter(Boolean))];
    const usernameMap: Record<string, string> = {};

    if (creatorUids.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('uid, user_name')
        .in('uid', creatorUids);

      if (!userError && userData) {
        userData.forEach((user: any) => {
          if (user.user_name) {
            usernameMap[user.uid] = user.user_name;
          }
        });
      }
    }

    // Map database rows to IncidentUpdate type with usernames
    const updates = data.map((update: any) => ({
      ...update,
      creator_username: update.creator_uid ? usernameMap[update.creator_uid] : undefined,
    } as IncidentUpdate));

    return updates;
  } catch (error) {
    console.error("Failed to retrieve incident updates", error);
    throw error;
  }
}

export async function updateIncidentSeverity(
  idToken: string,
  incidentId: string
): Promise<number> {
  try {
    await getAuthenticatedUser(idToken); // Verify auth

    // Get the original incident severity
    const { data: incidentData, error: incidentError } = await supabase
      .from('location_pins')
      .select('severity')
      .eq('id', incidentId)
      .single();

    if (incidentError || !incidentData) {
      throw { type: "data", message: "Incident not found" };
    }

    const originalSeverity = parseFloat(incidentData.severity) || 5;

    // Get all updates for this incident
    const updates = await retrieveIncidentUpdates(idToken, incidentId);

    if (updates.length === 0) {
      return originalSeverity;
    }

    // Calculate weighted average with time decay
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const sixHours = 6 * oneHour;
    const oneDay = 24 * oneHour;

    let totalWeightedSeverity = originalSeverity * 0.4; // Original gets 40% weight
    let totalWeight = 0.4;

    updates.forEach((update) => {
      const updateTime = new Date(update.created_at).getTime();
      const age = now - updateTime;

      let weight = 0.1; // Default for old updates (24+ hours)
      if (age < oneHour) {
        weight = 1.0; // Recent updates (0-1 hour) get full weight
      } else if (age < sixHours) {
        weight = 0.7; // 1-6 hours get 70% weight
      } else if (age < oneDay) {
        weight = 0.4; // 6-24 hours get 40% weight
      }

      totalWeightedSeverity += update.severity * weight;
      totalWeight += weight;
    });

    const newSeverity = Math.min(10, Math.max(1, totalWeightedSeverity / totalWeight));

    // Update the incident's severity
    const { error: updateError } = await supabase
      .from('location_pins')
      .update({ severity: newSeverity.toFixed(1) })
      .eq('id', incidentId);

    if (updateError) {
      console.error("Failed to update incident severity:", updateError);
      // Don't throw, just return the calculated value
    }

    return newSeverity;
  } catch (error) {
    console.error("Failed to update incident severity", error);
    throw error;
  }
}
