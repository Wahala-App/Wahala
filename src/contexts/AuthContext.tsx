'use client';

// import { createContext, useContext, useState, ReactNode } from 'react';

// import { initializeApp } from "firebase/app";
// import {
//   getFirestore,
//   doc,
//   setDoc,
//   addDoc,
//   updateDoc,
//   getDoc,
//   getDocs,
//   deleteDoc,
//   query,
//   where,
//   collection,
//   serverTimestamp,
//   orderBy,
//   limit
// } from "firebase/firestore";
// import {
//   reload,
//   updatePassword,
//   sendPasswordResetEmail,
//   sendEmailVerification,
//   signOut,
// } from "firebase/auth";
// import {
//   User,
//   getAuth,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   onAuthStateChanged,
// } from "firebase/auth";

// export type ErrorType =
//   | "general"
//   | "fill"
//   | "email"
//   | "password"
//   | "login"
//   | "signup"
//   | "quiz"
//   | "data"
//   | "product"
//   | "verify"
//   | "database";

// export type ErrorState = Record<ErrorType, string>;

// const initialError: ErrorState = {
//   general: "", fill: "", email: "", password: "", signup: "",
//   login: "",   quiz: "", data: "", product: "", verify: "", database: ""
// };// 1. The object that holds every error message

//   const [errors, setErrors] = useState<ErrorState>(initialError);

//   // 2. The key of the *last* error that was set 
//   const [pastErrorType, setPastErrorType] = useState<ErrorType>("general");

// export async function useErrorStore() {

//   const clearError = useCallback(() => {
//     console.log("Past error is ", pastErrorType);               // DEBUG
//     setErrors(prev => ({
//       ...prev,
//       [pastErrorType]: ""                                      // ← clears only that field
//     }));
//   }, [pastErrorType]);                                         // ← re-create only if key changes

//   // 4. Helper to set an error (so the key is remembered)
//   const setError = (type: ErrorType, message: string) => {
//     setErrors(prev => ({ ...prev, [type]: message }));
//     setPastErrorType(type);   // remember which field we just wrote to
//   };

//   return { errors, pastErrorType, clearError, setError };
// }

// type LoadingContextType = {
//   isLoading: boolean;
//   setLoading: (loading: boolean) => void;
// };


// const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// export function LoadingProvider({ children }: { children: ReactNode }) {
//   const [isLoading, setLoading] = useState(false);
//   return (
//     <LoadingContext.Provider value={{ isLoading, setLoading }}>
//       {children}
//     </LoadingContext.Provider>
//   );
// }

// export function useLoading() {
//   const context = useContext(LoadingContext);
//   if (!context) throw new Error('useLoading must be used within LoadingProvider');
//   return context;
// }

// type AuthContextType = {
//   isLoading: boolean;
//   setLoading: (loading: boolean) => void;
// };

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [isLoading, setLoading] = useState(false);
//   return (
//     <AuthContext.Provider value={{ isLoading, setLoading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// app/contexts/AuthContext.tsx


import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

export type ErrorType =
  | "general"
  | "fill"
  | "email"
  | "password"
  | "login"
  | "signup"
  | "quiz"
  | "data"
  | "product"
  | "verify"
  | "database";

  export type StateType =
  | "Signed Out"
  | "Signed In";

export type ErrorState = Record<ErrorType, string>;
export type UserState = Record<StateType, string>;

const initialError: ErrorState = {
  general: "", fill: "", email: "", password: "", signup: "",
  login: "", quiz: "", data: "", product: "", verify: "", database: ""
};

type AuthContextValue = {
  errors: ErrorState;
  pastErrorType: ErrorType;
  setError: (type: ErrorType, message: string) => void;
  clearError: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  userState:  StateType;
  setUserState: (state: StateType) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // All hooks MUST be inside this component
  const [errors, setErrors] = useState<ErrorState>(initialError);
  const [pastErrorType, setPastErrorType] = useState<ErrorType>("general");
  const [isLoading, setLoading] = useState(false);
  const [userState, setUserState] = useState<StateType>("Signed Out");
  
  const setError = useCallback((type: ErrorType, message: string) => {
    setErrors(prev => ({ ...prev, [type]: message }));
    setPastErrorType(type);
  }, []);

  const clearError = useCallback(() => {
    setErrors(prev => ({ ...prev, [pastErrorType]: "" }));
  }, [pastErrorType]);

  return (
    <AuthContext.Provider value={{
      errors,
      pastErrorType,
      setError,
      clearError,
      isLoading,
      setLoading,
      setUserState,
      userState
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// Optional: separate loading hook
export function useLoading() {
  const { isLoading, setLoading } = useAuth();
  return { isLoading, setLoading };
}

export function handleUserState()
{

   const { userState, setUserState }  = useAuth();
   return  { userState, setUserState}
}
