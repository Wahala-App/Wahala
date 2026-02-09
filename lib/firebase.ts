import { initializeApp, getApps, getApp } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app); 
const db = getFirestore(app);

export { auth, db };


//Firebase Cloud Messaging setup (only runs in browser currently)
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Notification permission granted.");
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: "BAnFEPyxtFgPmjofYUHru4GIhSA0M8MNiV44S4C2_rQ_mXT-Yk8A4pBFhBLXEA_6i3SFRZ7JhVP9mgDrvolrnvA", // Get this from Firebase Console -> Project Settings -> Cloud Messaging
      });
      
      console.log("FCM Token:", token);
      return token;
    } else {
      console.log("Notification permission denied.");
      return null;
    }
  } catch (error) {
    console.error("Error getting notification permission:", error);
    return null;
  }
}

// Listen for foreground messages (when app is open)
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
}
