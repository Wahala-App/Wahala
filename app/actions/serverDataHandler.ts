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

export async function storeLocationPin(incidentType, title,description, location) {
  try {
    const user = await detectLoginState();
    
    if (!user) {
      throw { type: "login", message: "No user is logged in" };
    }
    //Creates pin collection to store pins under speicifc date
     //Ensures accurate time and date
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let unformattedDate  = new Date();
    const  today= formatInTimeZone(unformattedDate, timeZone, 'yyyy-MM-dd');//'HH:mm:ss zzz');
   // console.log(today)

    const locationCollectionRef = collection(db, "users", user.uid, "location-pin");
    const q = query(locationCollectionRef);
    const querySnapshot = await getDocs(q);
    const latestDoc = querySnapshot.docs[0] //Latest doc
    
    //If no location pin document has been created for today create one
    if (querySnapshot.empty || latestDoc.id != today)
    { 
        const locationPinRef = doc(db, "users", user.uid, "location-pin", today);
        await setDoc(locationPinRef, {addedOn: serverTimestamp()}, { merge: true });
    }
    
    //Now adds location pins for today at different time stamps
    let unformattedTime  = new Date();
    const  formattedTime= formatInTimeZone(unformattedTime, timeZone, 'HH:mm:ss'); //currenttime

     //Current local time
    const pinCollection = collection(db, "users", user.uid, "location-pin",today,today);
    const pinRef = doc(db, "users", user.uid, "location-pin", today, today, formattedTime);
    await setDoc(pinRef,  
        { incidentType: incidentType,
          title: title,
          description: description,
          location: location,
          addedOn: serverTimestamp(),
       },
        { merge: true });

 
    console.log("Location pin saved successfully");
  } catch (error) {
    console.error("Failed to store supplements", error);
    throw { type: "data", message: "Failed to store supplement suggested. Try again." };
  }
}

export async function retrieveLocationPins(date: any) {
  try {
    console.log("In retrievelocationpins")
    const user = await detectLoginState();

    if (!user) {
      throw { type: "login", message: "No user is logged in" };
    }
   
    const pinCollection = collection(db, "users", user.uid, "location-pin", date, date);
    const q = query(pinCollection, orderBy("addedOn", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No pins")
      return [];
    }

    else
    {
        const pinData = querySnapshot.docs.map(pinDoc => ({doc_Id: pinDoc.id,
        ...pinDoc.data(),
        }));
        console.log(pinData)
        console.log("Location pins obtained successfully");
        return pinData 
    }

 
  } catch (error) {
    console.error("Failed to store supplements", error);
    throw { type: "data", message: "Failed to store supplement suggested. Try again." };
  }
}

export async function deleteLocationPin(idToken: string, incident) {
  const uid = await getAuthenticatedUser(idToken);

  try {
     let date = convertTimestampToDate(incident.addedOn)

    const pinDocRef = db
      .collection('users')
      .doc(uid)
      .collection('location-pin')
      .doc(date)
      .collection(date)
      .doc(incident.doc_Id);

    const docSnapshot = await pinDocRef.get();

    if (!docSnapshot.exists) {
      console.log(`No pin found for ${incident.doc_Id}`);
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