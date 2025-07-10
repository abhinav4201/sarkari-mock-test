"use client";

import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore"; // Import onSnapshot
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  // --- OLD: Your original state (UNCHANGED) ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- NEW: State to hold the user's premium status ---
  const [isPremium, setIsPremium] = useState(false);

  // --- OLD: Your original adminEmail variable (UNCHANGED) ---
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  // --- OLD: Your original googleSignIn function (UNCHANGED) ---
  const googleSignIn = useCallback(
    async (redirectUrl = "/dashboard") => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      if (loggedInUser) {
        const userRef = doc(db, "users", loggedInUser.uid);
        await setDoc(
          userRef,
          {
            uid: loggedInUser.uid,
            name: loggedInUser.displayName,
            email: loggedInUser.email,
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );
      }

      if (loggedInUser.email === adminEmail) {
        window.location.href = "/admin";
      } else {
        window.location.href = redirectUrl;
      }
    },
    [adminEmail]
  );

  // --- OLD: Your original logOut function (UNCHANGED) ---
  const logOut = useCallback(async () => {
    Cookies.remove("selectedAccessControlTest");
    await signOut(auth);
    window.location.href = "/";
  }, []);

  // --- UPDATED: This useEffect now also listens for premium status ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // --- NEW LOGIC STARTS HERE ---
        // Listen for real-time changes to the user's document in Firestore.
        // This will automatically update the premium status if it changes.
        const userDocRef = doc(db, "users", currentUser.uid);
        const userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const expires = userData.premiumAccessExpires?.toDate();
            // Check if the expiry date exists and is in the future
            if (expires && expires > new Date()) {
              setIsPremium(true);
            } else {
              setIsPremium(false);
            }
          } else {
            // User document doesn't exist, so they are not premium.
            setIsPremium(false);
          }
          setLoading(false);
        });
        // This is the cleanup function for the user document listener.
        return () => userUnsubscribe();
        // --- NEW LOGIC ENDS HERE ---
      } else {
        setUser(null);
        setIsPremium(false); // If no user, they are not premium.
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- UPDATED: The value provided by the context now includes isPremium ---
  const value = useMemo(
    () => ({
      user,
      loading,
      googleSignIn,
      logOut,
      isPremium, // The new premium status is now available to your app
    }),
    [user, loading, googleSignIn, logOut, isPremium] // Add isPremium to dependency array
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
