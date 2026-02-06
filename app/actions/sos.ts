"use server";

import { createClient } from "@supabase/supabase-js";
import * as admin from "firebase-admin";
import { auth } from "firebase-admin";
import { SOSEvent } from "../api/types";

const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  ),
  clientEmail: process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(idToken: string) {
  try {
    const decodedToken = await auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid, email: decodedToken.email as string };
  } catch (error) {
    console.error("Invalid or missing token:", error);
    throw { type: "auth", message: "Unauthorized: Invalid token" };
  }
}

export async function createSOSEvent(
  idToken: string,
  latitude: number,
  longitude: number
) {
  const { uid } = await getAuthenticatedUser(idToken);

  const { data, error } = await supabase
    .from("sos_events")
    .insert({
      sender_uid: uid,
      latitude,
      longitude,
      description: "SOS",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create SOS event:", error);
    throw { type: "data", message: error.message };
  }

  // Fetch recipient emails for future push notification hook
  const { data: recipients } = await supabase
    .from("sos_recipients")
    .select("recipient_email")
    .eq("user_uid", uid);
  const emails = (recipients ?? []).map((r) => r.recipient_email);
  const { notifySOSRecipients } = await import("../utils/sosNotifier");
  notifySOSRecipients(data.id, emails).catch(() => {});

  return data;
}

export async function getSOSRecipients(idToken: string) {
  const { uid } = await getAuthenticatedUser(idToken);

  const { data, error } = await supabase
    .from("sos_recipients")
    .select("*")
    .eq("user_uid", uid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to get SOS recipients:", error);
    throw { type: "data", message: error.message };
  }

  return data ?? [];
}

export async function addSOSRecipient(idToken: string, recipientEmail: string) {
  const { uid } = await getAuthenticatedUser(idToken);

  const email = recipientEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw { type: "validation", message: "Invalid email address" };
  }

  const { data, error } = await supabase
    .from("sos_recipients")
    .upsert(
      { user_uid: uid, recipient_email: email },
      { onConflict: "user_uid,recipient_email" }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to add SOS recipient:", error);
    throw { type: "data", message: error.message };
  }

  return data;
}

export async function removeSOSRecipient(idToken: string, recipientEmail: string) {
  const { uid } = await getAuthenticatedUser(idToken);

  const email = recipientEmail.trim().toLowerCase();
  if (!email) {
    throw { type: "validation", message: "Invalid email" };
  }

  const { error } = await supabase
    .from("sos_recipients")
    .delete()
    .eq("user_uid", uid)
    .eq("recipient_email", email);

  if (error) {
    console.error("Failed to remove SOS recipient:", error);
    throw { type: "data", message: error.message };
  }
}

export async function getSOSEventsForCurrentUser(idToken: string): Promise<SOSEvent[]> {
  const { email } = await getAuthenticatedUser(idToken);
  if (!email) return [];

  const { data: recipients, error: recErr } = await supabase
    .from("sos_recipients")
    .select("user_uid")
    .eq("recipient_email", email.toLowerCase());

  if (recErr || !recipients?.length) return [];

  const senderUids = [...new Set(recipients.map((r) => r.user_uid))];

  const { data: events, error } = await supabase
    .from("sos_events")
    .select("*")
    .in("sender_uid", senderUids)
    .order("created_at", { ascending: false });

  if (error || !events) return [];

  const creatorUids = [...new Set(events.map((e: { sender_uid: string }) => e.sender_uid))];
  const { data: userData } = await supabase
    .from("users")
    .select("uid, user_name")
    .in("uid", creatorUids);

  const usernameMap: Record<string, string> = {};
  (userData ?? []).forEach((u: { uid: string; user_name?: string }) => {
    if (u.user_name) usernameMap[u.uid] = u.user_name;
  });

  return events.map((e: Record<string, unknown>) => ({
    id: e.id,
    sender_uid: e.sender_uid,
    latitude: e.latitude,
    longitude: e.longitude,
    description: e.description ?? "SOS",
    created_at: e.created_at,
    sender_username: usernameMap[e.sender_uid as string],
  })) as SOSEvent[];
}
