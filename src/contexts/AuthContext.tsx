'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [isLoading, setLoading] = useState(true);
  const [userState, setUserState] = useState<StateType>("Signed Out");

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user === null) {
      setUserState("Signed Out")
    } else {
      setUserState("Signed In")
    }
    setLoading(false); // Move this inside the callback
  })
  
  return unsubscribe; // Clean up the listener
}, []);
  
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
