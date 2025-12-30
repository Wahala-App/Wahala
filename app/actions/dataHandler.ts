'use server';

//import { auth, db } from "../../lib/firebase"
import { doc, setDoc, addDoc, where, getDocs,deleteDoc, query, collection, orderBy, limit, serverTimestamp} from "firebase/firestore";
import {
  reload,
  updatePassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { formatInTimeZone, format } from 'date-fns-tz';

import { auth } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
// Helper: Verify the user's Firebase ID token and get their UID
import * as admin from 'firebase-admin';
// === Initialize Firebase Admin ===
const serviceAccount = JSON.parse(
  process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_KEY as string
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const standardUTCDate = () =>
{
  //To ensure standard logged date using UTC for pins for the day
      const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'UTC'
      });

      return today
}
const db = admin.firestore(); // ← This is how you get the DB on server

async function getAuthenticatedUser(idToken: string) {
  try {
    const decodedToken = await auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Invalid or missing token:', error);
    throw { type: 'auth', message: 'Unauthorized: Invalid token' };
  }
}

export async function storeLocationPin(idToken, incidentType, title, description, location, dateTime) {
  try {
      const uid = await getAuthenticatedUser(idToken);

      //To ensure standard logged date using UTC for pins for the day
      const today = parseLocalTimestampToUTC(dateTime, 'date')
      const pinCollectionRef = db
        .collection("location-pins")

      pinCollectionRef.add({ 
            creatorUid: uid,
            incidentType: incidentType,
            title: title,
            description: description,
            location: location,
            dateTime: dateTime,
            dateKey: today, //For quick filtering
            addedOn: FieldValue.serverTimestamp()
        })
        
      console.log("Location pin saved successfully");
    } catch (error) {
      console.error("Failed to store location pub", error);
      throw { type: "data", message: `Failed to store location pin. Try again: ${error}` };
    }
  }

export async function retrieveLocationPins(idToken: any) {
    try {
      //To ensure standard logged date using UTC for pins for the day
      const today = standardUTCDate()

      console.log("In retrievelocationpins")
      const uid = await getAuthenticatedUser(idToken);
      
      const pinCollectionRef = db
        .collection('location-pins')
    
      const querySnapshot = await pinCollectionRef
         .where("dateKey", "==", today) // 1. Filter by the specific date
         .orderBy('addedOn', 'desc')   // 2. order by most recent first
         .get();

      const latestDoc = querySnapshot.empty ? null : querySnapshot.docs[0];

      if (!latestDoc) {
        console.log("No pins")
        return [];
      }

      else
      {
          const pinData = querySnapshot.docs.map(pinDoc => ({doc_Id: pinDoc.id,
          ...pinDoc.data(),
          }));
       //   console.log(pinData)
          console.log("Location pins obtained successfully");
          return pinData 
      }

 
  } catch (error) {
    console.error("Failed to obtain location pin", error);
    throw { type: "data", message: "Failed to obtain location pins. Try again." };
  }
}

export async function deleteLocationPin(idToken: string, incident) {
  try {
     const uid = await getAuthenticatedUser(idToken);
   
    const pinDocRef = db
      .collection('location-pins')
      .doc(incident.doc_Id);

     const docSnapshot = await pinDocRef.get();

    if (!docSnapshot.exists) {
      console.log(`No pin found for ${incident.doc_Id}`);
      return false;
    }

    //Does not have permission to delete 
    if (docSnapshot.data().creatorUid !== uid) {
      return false;
    }

    await pinDocRef.delete();
    console.log(`Deleted pin ${incident.doc_Id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete pin: ', error);
   throw { type: 'data', message: `Failed to delete pin ${incident}` };
  }
}



function convertTimestampToDate(timestamp: any) {
  
  const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6);
  return date.toLocaleDateString('en-CA');
}

function parseLocalTimestampToUTC(stored, output) {
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
