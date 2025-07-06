"use client";

import { auth, db } from "@/lib/firebase"; // NEW: Import 'db' from your firebase config
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore"; // NEW: Import firestore functions
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const googleSignIn = useCallback(
    async (redirectUrl = "/dashboard") => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      // --- NEW LOGIC STARTS HERE ---
      // After successful sign-in, create or merge a document in the 'users' collection
      if (loggedInUser) {
        const userRef = doc(db, "users", loggedInUser.uid);
        await setDoc(
          userRef,
          {
            uid: loggedInUser.uid,
            name: loggedInUser.displayName,
            email: loggedInUser.email,
            lastLogin: serverTimestamp(), // Track the last login time
          },
          { merge: true } // This creates the doc if it doesn't exist, or merges data if it does
        );
      }
      // --- NEW LOGIC ENDS HERE ---

      // Your existing redirect logic remains unchanged
      if (loggedInUser.email === adminEmail) {
        window.location.href = "/admin";
      } else {
        window.location.href = redirectUrl;
      }
    },
    [adminEmail]
  );

  const logOut = useCallback(async () => {
    await signOut(auth);
    window.location.href = "/";
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      googleSignIn,
      logOut,
    }),
    [user, loading, googleSignIn, logOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
