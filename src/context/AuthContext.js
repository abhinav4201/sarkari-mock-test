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

  // THIS IS THE FIX: The function now accepts a 'redirectUrl' parameter.
  const googleSignIn = useCallback(
    async (redirectUrl = "/dashboard") => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Admin redirect always takes priority
      if (result.user.email === adminEmail) {
        window.location.href = "/admin";
      } else {
        // Otherwise, go to the URL that was provided, or the dashboard as a fallback.
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
