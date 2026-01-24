'use client';

import { auth, db } from "../../lib/firebase"
import { doc, setDoc } from "firebase/firestore";
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

import { supabase } from "@/lib/server/supabase";

let credentials
// Function to get the current user's fresh ID token
export async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in');
    return null;
  }

  try {
    const idToken = await user.getIdToken(); // Automatically refreshes if needed
    return idToken;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}
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

    // await setDoc(doc(db, "users", user.uid), {
    //   uid: user.uid,
    //   firstName: firstName,
    //   lastName: lastName,
    //   email: user.email,
    //   createdAt: new Date().toISOString(),
    // });
    // Store user profile in Supabase
    const { error: supabaseError } = await supabase
      .from('users')
      .insert([
        {
          uid: user.uid,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString(),
        }
      ]);

    if (supabaseError) {
      console.error("Supabase error:", supabaseError);
      throw { type: "data", message: "Failed to save user profile" };
    }


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
    const credential = auth.currentUser;
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

export async function resetPassword(email: string): Promise<boolean> {
  // Get the current user
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("✅ Password reset email sent.");
  } catch (error) {
    console.error("❌ Failed to send reset email:", error);
    return false;
  }
  return true
}

export async function login(email: string, password: string) {
  try {
    // console.log(email);
    await setPersistence(auth, browserSessionPersistence);
    const user_credentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    await checkEmailVerification();   

    console.log("User Credentials", user_credentials.user);

  } catch (err: any) {
    console.log("LOGIN Error", err)

    if (err?.code) {
        if (err.code.includes("auth/invalid-email")) {
            throw { type: "email", message: "Invalid email" };
        } else if (err.code.includes("auth/missing-password")) {
            throw { type: "password", message: "Password required" };
        } else if (err.code.includes("auth/invalid-credential")) {
            throw {
                type: "password",
                message:
                "Wrong email or password. Try again or " +
                "click Forgot password to reset it.",
            };
        } else if (err.code.includes("auth/too-many-requests")) {
            throw {
                type: "login",
                message: "Too many login attempts. Try again later.",
            };
        }
    } else if (err.type == "verify") {
        const credential = auth.currentUser;

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
    const user = auth.currentUser;

    if (!user) {
      throw { type: "login", message: "No user is logged in" };
    }
    await signOut(auth);
    console.log("User was successfully logged out");
  } catch (err) {
    console.log("Error occured logout function", err, auth);
  }
}

export async function retrieveAuth () {
  return auth;
}

export async function detectLoginState(): Promise<User> {
  try {
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
