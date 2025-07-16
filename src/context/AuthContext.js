"use client";

import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import { getFingerprint } from "@guardhivefraudshield/device-fingerprint";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpires, setPremiumExpires] = useState(null);
  const [freeTrialCount, setFreeTrialCount] = useState(0);
  const [favoriteTests, setFavoriteTests] = useState([]);
  const [isLibraryUser, setIsLibraryUser] = useState(false);
  const router = useRouter();
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
        const visitorId = await getFingerprint();

        if (loggedInUser) {
          const userRef = doc(db, "users", loggedInUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(
              userRef,
              {
                uid: loggedInUser.uid,
                name: loggedInUser.displayName,
                email: loggedInUser.email,
                lastLogin: serverTimestamp(),
                initialVisitorId: visitorId,
              },
              { merge: true }
            );
          } else {
            await setDoc(
              userRef,
              {
                lastLogin: serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
        if (loggedInUser.email === adminEmail) {
          window.location.href = "/admin";
        } else {
          window.location.href = redirectUrl;
        }
      } catch (error) {
        if (error.code !== "auth/popup-closed-by-user") {
          toast.error("Failed to sign in. Please try again.");
        }
      }
    },
    [adminEmail]
  );

  const googleSignInForLibrary = useCallback(
    async (libraryId) => {
      if (!libraryId) return toast.error("Library ID is missing.");
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const loggedInUser = result.user;
        const visitorId = await getFingerprint();

        if (loggedInUser) {
          const userRef = doc(db, "libraryUsers", loggedInUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: loggedInUser.uid,
              name: loggedInUser.displayName,
              email: loggedInUser.email,
              libraryId: libraryId,
              role: "student",
              createdAt: serverTimestamp(),
              initialVisitorId: visitorId,
            });
          }
        }

        // --- THE FIX ---
        // Manually set the user state immediately after sign-up.
        // This prevents the race condition and ensures the layout knows the correct user type.
        setUser(loggedInUser);
        setIsLibraryUser(true);
        // --- END OF FIX ---

        router.push("/library-dashboard");
      } catch (error) {
        if (error.code !== "auth/popup-closed-by-user") {
          toast.error("Failed to sign in. Please try again.");
        }
      }
    },
    [router]
  );

  const logOut = useCallback(async () => {
    try {
      await signOut(auth);
      router.push("/");
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    let userSnapshotUnsubscribe = null;
    const authStateUnsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (userSnapshotUnsubscribe) {
          userSnapshotUnsubscribe();
        }

        if (currentUser) {
          const libraryUserRef = doc(db, "libraryUsers", currentUser.uid);
          const libraryUserSnap = await getDoc(libraryUserRef);

          if (libraryUserSnap.exists()) {
            setUser(currentUser);
            setIsLibraryUser(true);
            setLoading(false);
          } else {
            setUser(currentUser);
            setIsLibraryUser(false);
            const userDocRef = doc(db, "users", currentUser.uid);
            userSnapshotUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const userData = docSnap.data();
                const expires = userData.premiumAccessExpires?.toDate();
                setIsPremium(expires && expires > new Date());
                setPremiumExpires(expires || null);
                setFreeTrialCount(userData.freeTrialCount || 0);
                setFavoriteTests(userData.favoriteTests || []);
              } else {
                setIsPremium(false);
                setFreeTrialCount(0);
                setFavoriteTests([]);
              }
            });
            setLoading(false);
          }
        } else {
          setUser(null);
          setIsPremium(false);
          setFreeTrialCount(0);
          setFavoriteTests([]);
          setIsLibraryUser(false); // Reset library user status on logout
          setLoading(false);
        }
      }
    );

    return () => {
      authStateUnsubscribe();
      if (userSnapshotUnsubscribe) {
        userSnapshotUnsubscribe();
      }
    };
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
      favoriteTests,
      isLibraryUser,
      googleSignInForLibrary,
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
      favoriteTests,
      isLibraryUser,
      googleSignInForLibrary,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
