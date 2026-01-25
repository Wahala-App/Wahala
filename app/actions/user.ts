'use server';

import { Incident, IncidentType } from "../api/types";
import { createClient } from "@supabase/supabase-js";
import { jwtDecode } from "jwt-decode";
import { auth } from 'firebase-admin';
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


async function getAuthenticatedUser(idToken: string) {
  try {
    const decodedToken = await auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Invalid or missing token:', error);
    throw { type: 'auth', message: 'Unauthorized: Invalid token' };
  }
}



export async function retrieveUserInfo(idToken: string) {
  try {

    const uid = await getAuthenticatedUser(idToken);

    // First, fetch the pin to check if the user owns it
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .maybeSingle(); // Returns null instead of throwing error if not found();

    if (fetchError || !userData) {
      console.log(`No user found with id ${uid}`);
      console.log(`Error: ${fetchError}`);
      return false;
    }

    console.log(`Found user ${uid}`);
    return userData;

  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    throw { type: 'data', message: `Failed to retrieve user data` };
  }
}


//SQL
// -- Create a function to create user profile
// CREATE OR REPLACE FUNCTION create_user_profile(
//   p_uid TEXT,
//   p_email TEXT,
//   p_first_name TEXT,
//   p_last_name TEXT
// )
// RETURNS json
// LANGUAGE plpgsql
// SECURITY DEFINER  -- ✅ Runs with elevated privileges, bypasses RLS
// AS $$
// DECLARE
//   v_result json;
// BEGIN
//   -- Validate: Check if user already exists
//   IF EXISTS (SELECT 1 FROM users WHERE uid = p_uid) THEN
//     RAISE EXCEPTION 'User already exists';
//   END IF;

//   -- Insert the user
//   INSERT INTO users (uid, email, first_name, last_name, created_at)
//   VALUES (p_uid, p_email, p_first_name, p_last_name, NOW())
//   RETURNING json_build_object(
//     'uid', uid,
//     'email', email,
//     'first_name', first_name,
//     'last_name', last_name
//   ) INTO v_result;

//   RETURN v_result;
// END;
// $$;

// -- Grant execute permission to anon users
// GRANT EXECUTE ON FUNCTION create_user_profile TO anon, authenticated;

// -- Keep RLS enabled
// ALTER TABLE users ENABLE ROW LEVEL SECURITY;

// -- Drop all policies
// DROP POLICY IF EXISTS "Allow user creation" ON users;
// DROP POLICY IF EXISTS "Users can insert own profile" ON users;
// DROP POLICY IF EXISTS "Users can read own profile" ON users;

// -- No direct client access
// CREATE POLICY "Deny direct client access"
// ON users TO anon, authenticated
// USING (false);