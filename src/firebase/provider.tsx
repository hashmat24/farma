'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot as onFirestoreSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication and profile
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  role: string | null;
  name: string | null;
  age: number | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  role: string | null;
  name: string | null;
  age: number | null;
  language: string;
  setLanguage: (lang: string) => void;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  role: string | null;
  name: string | null;
  age: number | null;
  language: string;
  setLanguage: (lang: string) => void;
}

// Return type for useUser()
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  role: string | null;
  name: string | null;
  age: number | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
    role: null,
    name: null,
    age: null,
  });

  const [language, setLanguage] = useState<string>('EN');

  // Effect to subscribe to Firebase auth state and profile changes
  useEffect(() => {
    if (!auth) {
      setUserAuthState(prev => ({ ...prev, isUserLoading: false, userError: new Error("Auth service not provided.") }));
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // Clean up previous profile listener
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (firebaseUser) {
          // Listen to user profile in Firestore
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          unsubscribeProfile = onFirestoreSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserAuthState({
                user: firebaseUser,
                isUserLoading: false,
                userError: null,
                role: data.role || 'user',
                name: data.name || null,
                age: data.age || null,
              });
            } else {
              // If user document doesn't exist, check if they are an admin
              const adminDocRef = doc(firestore, 'roles_admin', firebaseUser.uid);
              onFirestoreSnapshot(adminDocRef, (adminSnap) => {
                setUserAuthState({
                  user: firebaseUser,
                  isUserLoading: false,
                  userError: null,
                  role: adminSnap.exists() ? 'admin' : 'user',
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  age: null,
                });
              });
            }
          }, (error) => {
            console.error("FirebaseProvider: Profile sync error:", error);
            setUserAuthState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false }));
          });
        } else {
          setUserAuthState({ user: null, isUserLoading: false, userError: null, role: null, name: null, age: null });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState(prev => ({ ...prev, isUserLoading: false, userError: error }));
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [auth, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      role: userAuthState.role,
      name: userAuthState.name,
      age: userAuthState.age,
      language,
      setLanguage,
    };
  }, [firebaseApp, firestore, auth, userAuthState, language]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    role: context.role,
    name: context.name,
    age: context.age,
    language: context.language,
    setLanguage: context.setLanguage,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => useFirebase().auth;

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => useFirebase().firestore;

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;

/** Hook to sign out the current user. */
export const useLogout = () => {
  const { auth } = useFirebase();
  return () => signOut(auth);
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state and profile.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError, role, name, age } = useFirebase();
  return { user, isUserLoading, userError, role, name, age };
};