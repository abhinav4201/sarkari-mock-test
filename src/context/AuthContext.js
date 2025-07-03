"use client";

import {
  useContext,
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const googleSignIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    if (result.user.email === adminEmail) {
      window.location.href = "/admin";
    } else {
      window.location.href = "/dashboard";
    }
  }, [adminEmail]);

  const logOut = useCallback(async () => {
    await signOut(auth);
    window.location.href = "/";
  }, []);

  useEffect(() => {
    console.log("AuthContext: Setting up Firebase auth state listener...");

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // THIS IS THE CRUCIAL PART. If you don't see this message, Firebase isn't connecting properly.
      console.log("AuthContext: Auth state changed. User:", currentUser);

      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      console.log("AuthContext: Cleaning up auth state listener.");
      unsubscribe();
    };
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
