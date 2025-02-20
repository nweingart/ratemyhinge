import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function logout() {
    try {
      await signOut(auth);
      // No need to setCurrentUser(null) as the auth state listener will handle this
    } catch (error) {
      console.error('Failed to log out:', error);
      throw error; // Propagate error to be handled by the component
    }
  }

  useEffect(() => {
    console.log('[Auth] Starting auth setup');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] State changed:', {
        hasUser: !!user,
        uid: user?.uid,
        phoneNumber: user?.phoneNumber
      });

      if (user) {
        try {
          // Log the attempt to access Firestore
          console.log('[Firestore] Attempting to access user document:', user.uid);
          
          const userRef = doc(db, 'users', user.uid);
          console.log('[Firestore] Document reference created:', userRef.path);
          
          const userSnap = await getDoc(userRef);
          console.log('[Firestore] Document snapshot retrieved:', {
            exists: userSnap.exists(),
            data: userSnap.exists() ? userSnap.data() : null
          });

          if (!userSnap.exists()) {
            console.log('[Firestore] Creating new user document');
            const userData = {
              phoneNumber: user.phoneNumber,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp()
            };
            
            await setDoc(userRef, userData);
            console.log('[Firestore] New user document created successfully');
          } else {
            console.log('[Firestore] Existing user document found:', userSnap.data());
            // Update last login
            await setDoc(userRef, {
              lastLoginAt: serverTimestamp()
            }, { merge: true });
            console.log('[Firestore] Updated lastLoginAt timestamp');
          }
        } catch (error) {
          console.error('[Firestore] Operation failed:', {
            errorCode: error.code,
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack
          });
        }
      } else {
        console.log('[Auth] No user present');
      }

      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      console.log('[Auth] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Log when provider value changes
  console.log('[Auth] Current state:', {
    hasUser: !!currentUser,
    isLoading: loading,
    userId: currentUser?.uid
  });

  const value = {
    currentUser,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 