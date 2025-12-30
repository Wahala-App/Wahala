'use client';

import { auth, db } from "../../lib/firebase"
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


import { detectLoginState } from "./auth";

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

export async function deleteLocationPins(incident: any) {
  try {
    console.log("In retrievelocationpins")
    const user = await detectLoginState();

    if (!user) {
      throw { type: "login", message: "No user is logged in" };
    }
   
    let date = convertTimestampToDate(incident.addedOn)
    const pinCollection = collection(db, "users", user.uid, "location-pin", date, date);
    const q = query(pinCollection, where("id", "==", incident.doc_id));
    const querySnapshot = await getDocs(q);
    
     if (!querySnapshot.empty) {
      for (const snapshotDoc of querySnapshot.docs) {
        await deleteDoc(doc(db, "users", user.uid,"location-pin", date, date, snapshotDoc.id));
        console.log(`Deleted location with id: ${incident.doc_id}`);
      }
      return true;
    } else {
      console.log(`No location found with id: ${incident.doc_id}`);
      return false;
    }

 
  } catch (error) {
    console.error("Failed to delete location", error);
    throw { type: "data", message: "Failed to delete location data. Try again." };
  }
}


function convertTimestampToTime  (timeStamp: any): any {
  // 1. Convert seconds and nanoseconds to total milliseconds
      const totalMilliseconds = (timeStamp.seconds * 1000) + (timeStamp.nanoseconds / 1e6);

      // 2. Create a JavaScript Date object
      const dateObj = new Date(totalMilliseconds);

      // 3. Use native Intl API for simple, localized formatting
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };

      return dateObj.toLocaleString(undefined, options);
    }

function convertTimestampToDate  (timeStamp: any): any {
  // 1. Convert seconds and nanoseconds to total milliseconds
      const totalMilliseconds = (timeStamp.seconds * 1000) + (timeStamp.nanoseconds / 1e6);

      // 2. Create a JavaScript Date object
      const dateObj = new Date(totalMilliseconds);

      // 3. Use native Intl API for simple, localized formatting
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };

      return dateObj.toLocaleString(undefined, options);
    }