"use client";

import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import Cookies from "js-cookie";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpires, setPremiumExpires] = useState(null);
  const [freeTrialCount, setFreeTrialCount] = useState(0);

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const openLoginPrompt = () => setIsLoginPromptOpen(true);
  const closeLoginPrompt = () => setIsLoginPromptOpen(false);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const googleSignIn = useCallback(
    async (redirectUrl = "/dashboard") => {
      closeLoginPrompt();
      const provider = new GoogleAuthProvider();
      try {
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
      } catch (error) {
        if (error.code !== "auth/popup-closed-by-user") {
          console.error("Google Sign-In Error:", error);
          toast.error("Failed to sign in. Please try again.");
        }
      }
    },
    [adminEmail]
  );

  // --- UPDATED: Logout function with better error handling ---
  const logOut = useCallback(async () => {
    try {
      Cookies.remove("selectedAccessControlTest");
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      // This will now log the actual Firebase error to your console for debugging
      // and show a clear message to the user.
      console.error("Logout Error:", error);
      toast.error("Logout failed. Please try again.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const expires = userData.premiumAccessExpires?.toDate();
            setIsPremium(expires && expires > new Date());
            setPremiumExpires(expires || null);
            setFreeTrialCount(userData.freeTrialCount || 0);
          } else {
            setIsPremium(false);
            setFreeTrialCount(0);
            setPremiumExpires(null);
          }
          setLoading(false);
        });
        return () => userUnsubscribe();
      } else {
        setUser(null);
        setIsPremium(false);
        setFreeTrialCount(0);
        setPremiumExpires(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      googleSignIn,
      logOut,
      isPremium,
      freeTrialCount,
      premiumExpires,
      isLoginPromptOpen,
      openLoginPrompt,
      closeLoginPrompt,
    }),
    [
      user,
      loading,
      googleSignIn,
      logOut,
      isPremium,
      freeTrialCount,
      premiumExpires,
      isLoginPromptOpen,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
