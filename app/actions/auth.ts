'use server';

// import { supabaseClient } from "@/lib/supabase";
// import type { User, Session } from "@supabase/supabase-js";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  collection,
  serverTimestamp,
  orderBy,
  limit
} from "firebase/firestore";
import {
  reload,
  updatePassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import {
  User,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";

import { Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth();
let credentials 



export async function signup(
  firstName: string,
  lastName: string,
  email: string,
  password: string
) {
  console.log("Sign up clicked"); // Add this for debugging

  try {
    let user_credentials = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = user_credentials.user;

    await sendEmailVerification(user);

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      firstName: firstName,
      lastName: lastName,
      email: user.email,
      createdAt: new Date().toISOString(),
    });

    console.log("User signed up and save: ", user);

    sessionStorage.setItem("email", email);
  } catch (err: any) {

    if (err?.code){
    if (err.code.includes("auth/invalid-email")) {
      throw { type: "email", message: "Invalid email" };
    } 
    else if (err.code.includes("auth/email-already-in-use)."))
    {
      throw { type: "email", message: "Account already exists" };

    }
    else {
      console.error("Sign up error: ", err); //throw the error make the user try again comment?
      throw err;
    }
  }
}
}

export async function checkEmailVerification() {
  try {
    const credential = getAuth().currentUser;
    if (credential) {
      await reload(credential);

      if (!credential.emailVerified) {
        console.log("email veirfied syatus:", credential);
        throw { type: "verify", message: "Please verify your email." };
      }
    }

    return true;
  } catch (err) {
    throw err;
  }
}

export async function resetPassword(email: string) {
  // Get the current user
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log("In reset password");

    // Optionally re-authenticate first (see below)

    // Update password

    await sendPasswordResetEmail(auth, email);
    console.log("✅ Password reset email sent.");
  } catch (error) {
    console.error("❌ Failed to send reset email:", error);
  }
}

export async function login(email: string, password: string) {
  try {
    console.log(email);

    let user_credentials = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    await checkEmailVerification();
    credentials = user_credentials.user;
    console.log(credentials);

  } catch (err: any) {
    console.log(err)

    if (err?.code)
    {
    if (err.code.includes("auth/invalid-email")) {
      throw { type: "email", message: "Invalid email" };
    } else if (err.code.includes("auth/missing-password")) {
      throw { type: "password", message: "Password required" };
    } else if (err.code.includes("auth/invalid-credential")) {
      throw {
        type: "password",
        message:
          "Wrong password. Try again or " +
          "click Forgot password to reset it.",
      };
    } else if (err.code.includes("auth/too-many-requests")) {
      throw {
        type: "login",
        message: "Too many login attempts. Try again later.",
      };
    }
  }
    //Sends verification email and then is caught by handlelogin in login.vue which then routes it to verify.vue to check verificatrion
    else if (err.type == "verify") {
      const credential = getAuth().currentUser;

      if (credential != null) {
        await sendEmailVerification(credential);
      }
      throw err;
    } else {
      throw { type: "general", message: "Login error occured. Try again." };
    }
  }
}

export async function logout() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw { type: "login", message: "No user is logged in" };
    }
    await signOut(auth);
    console.log("User was successfully logged out");
  } catch (err) {
    console.log("Error occured loguot function");
  }
}

export async function retrieveAuth () {
  return auth;
}

export async function detectLoginState(): Promise<User> {
  try {
    const auth = getAuth();

    return new Promise((resolve, reject) => {
      //If error wont go past if and ecerything ends if not error it continues accorlding
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe(); //stop listenign agter first trigger
        if (user) {
          console.log("User is logged in: ", user.email);
          resolve(user);
          return user;
        } else {
          console.log("No user is logged in");
          reject({ type: "login", message: "No user is logged in" });
        }
      });
    });
  } catch (err) {
    const error = err as any;

    if (error.type == "login") {
      throw error;
    } else {
      console.log("Error in detecting login state: ", err);
      throw { type: "general", message: "There was an error. Try again." };
    }
  }
}
