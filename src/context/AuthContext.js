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

  /**
   * --- THE UNIFIED SIGN-IN FUNCTION ---
   * Handles all Google Sign-In scenarios for both regular and library users.
   * @param {object} [options] - Optional parameters.
   * @param {string} [options.libraryId] - The ID of the library if it's a library sign-up.
   * @param {string} [options.redirectUrl] - The URL to redirect to for regular users.
   */
  const googleSignIn = useCallback(
    async (options = {}) => {
      const { libraryId, redirectUrl = "/dashboard" } = options;
      closeLoginPrompt();
      const provider = new GoogleAuthProvider();

      try {
        const result = await signInWithPopup(auth, provider);
        const loggedInUser = result.user;

        // If it's the admin, always redirect to the admin panel.
        if (loggedInUser.email === adminEmail) {
          window.location.href = "/admin";
          return;
        }

        const userRef = doc(db, "users", loggedInUser.uid);
        const libraryUserRef = doc(db, "libraryUsers", loggedInUser.uid);

        const [userSnap, libraryUserSnap] = await Promise.all([
          getDoc(userRef),
          getDoc(libraryUserRef),
        ]);

        // Scenario 1: User already exists as a library user.
        if (libraryUserSnap.exists()) {
          router.push("/library-dashboard");
          return;
        }

        // Scenario 2: User already exists as a regular user.
        if (userSnap.exists()) {
          // If they tried to join via a library link but are already a regular user.
          if (libraryId) {
            toast.error("This email is already registered as a regular user.", {
              duration: 5000,
            });
          }
          await setDoc(
            userRef,
            { lastLogin: serverTimestamp() },
            { merge: true }
          );
          window.location.href = redirectUrl;
          return;
        }

        // Scenario 3: This is a brand new user.
        const visitorId = await getFingerprint();

        // If a libraryId is provided, create a library user.
        if (libraryId) {
          await setDoc(libraryUserRef, {
            uid: loggedInUser.uid,
            name: loggedInUser.displayName,
            email: loggedInUser.email,
            libraryId: libraryId,
            role: "student",
            createdAt: serverTimestamp(),
            initialVisitorId: visitorId,
          });
          setUser(loggedInUser);
          setIsLibraryUser(true);
          router.push("/library-dashboard");
        } else {
          // Otherwise, create a regular user.
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
          window.location.href = redirectUrl;
        }
      } catch (error) {
        if (error.code !== "auth/popup-closed-by-user") {
          toast.error("Failed to sign in. Please try again.");
        }
      }
    },
    [adminEmail, router]
  );

  // This function is now just for context exposure, the logic is in googleSignIn.
  const googleSignInForLibrary = useCallback(
    async (libraryId) => {
      await googleSignIn({ libraryId });
    },
    [googleSignIn]
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
          setIsLibraryUser(false);
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
      googleSignInForLibrary, // Still expose this for the join page
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
