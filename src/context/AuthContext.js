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
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  limit,
  getDocs,
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

  const [userProfile, setUserProfile] = useState(null);

  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const openLoginPrompt = () => setIsLoginPromptOpen(true);
  const closeLoginPrompt = () => setIsLoginPromptOpen(false);

  const router = useRouter();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const googleSignIn = useCallback(
    async (options = {}) => {
      const {
        libraryId: joinLibraryId,
        ownerJoinCode,
        redirectUrl = "/dashboard",
      } = options;
      closeLoginPrompt();
      const provider = new GoogleAuthProvider();

      try {
        const result = await signInWithPopup(auth, provider);
        const loggedInUser = result.user;

        if (loggedInUser.email === adminEmail) {
          window.location.href = "/admin";
          return;
        }

        const userRef = doc(db, "users", loggedInUser.uid);
        const userSnap = await getDoc(userRef);
        const visitorId = await getFingerprint();

        // 1. Owner Join Flow
        if (ownerJoinCode) {
          const librariesQuery = query(
            collection(db, "libraries"),
            where("ownerJoinCode", "==", ownerJoinCode),
            limit(1)
          );
          const librarySnapshot = await getDocs(librariesQuery);

          if (librarySnapshot.empty) {
            toast.error("Invalid owner join code.");
            await signOut(auth);
            return;
          }
          const libraryDoc = librarySnapshot.docs[0];
          const libraryIdToOwn = libraryDoc.id;

          await setDoc(
            userRef,
            {
              uid: loggedInUser.uid,
              name: loggedInUser.displayName,
              email: loggedInUser.email,
              role: "library-owner",
              libraryOwnerOf: arrayUnion(libraryIdToOwn),
              lastLogin: serverTimestamp(),
            },
            { merge: true }
          );
          await updateDoc(libraryDoc.ref, { ownerId: loggedInUser.uid });

          toast.success(`Welcome, Owner of ${libraryDoc.data().libraryName}!`);
          router.push(`/library-owner/${libraryIdToOwn}`);
          return;
        }

        // 2. Student Join Flow
        if (joinLibraryId) {
          if (
            userSnap.exists() &&
            userSnap.data().role &&
            userSnap.data().role !== "library-student"
          ) {
            toast.error("This email is already registered as a regular user.", {
              duration: 8000,
            });
            await signOut(auth);
            return;
          }

          const libraryRef = doc(db, "libraries", joinLibraryId);
          const libSnap = await getDoc(libraryRef);
          if (!libSnap.exists() || !libSnap.data().ownerId) {
            toast.error("This library has not yet been claimed by an owner.", {
              duration: 6000,
            });
            await signOut(auth);
            return;
          }
          await setDoc(
            userRef,
            {
              uid: loggedInUser.uid,
              name: loggedInUser.displayName,
              email: loggedInUser.email,
              role: "library-student",
              libraryId: joinLibraryId,
              ownerId: libSnap.data().ownerId,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              initialVisitorId: visitorId,
            },
            { merge: true }
          );
          router.push("/library-dashboard");
          return;
        }

        // 3. Regular Sign-in / Sign-up Flow
        if (userSnap.exists()) {
          const userData = userSnap.data();
          await updateDoc(userRef, { lastLogin: serverTimestamp() });

          // --- THIS IS THE ROBUST FIX ---
          // Check for role OR for the legacy libraryOwnerOf array
          const isOwner =
            userData.role === "library-owner" ||
            (Array.isArray(userData.libraryOwnerOf) &&
              userData.libraryOwnerOf.length > 0);

          if (isOwner) {
            router.push(`/library-owner/${userData.libraryOwnerOf[0]}`);
          } else if (userData.role === "library-student") {
            router.push("/library-dashboard");
          } else {
            router.push(redirectUrl);
          }
        } else {
          // Handle new regular user sign-up
          await setDoc(userRef, {
            uid: loggedInUser.uid,
            name: loggedInUser.displayName,
            email: loggedInUser.email,
            role: "regular",
            lastLogin: serverTimestamp(),
            initialVisitorId: visitorId,
            libraryOwnerOf: [],
          });
          router.push(redirectUrl);
        }
      } catch (error) {
        console.error("Sign-in Error:", error);
        if (error.code !== "auth/popup-closed-by-user")
          toast.error("Sign-in failed. Please try again.");
      }
    },
    [router, adminEmail]
  );

  const googleSignInForLibrary = useCallback(
    async (libraryId) => {
      await googleSignIn({ libraryId });
    },
    [googleSignIn]
  );

  const googleSignInForLibraryOwner = useCallback(
    async (ownerJoinCode) => {
      await googleSignIn({ ownerJoinCode });
    },
    [googleSignIn]
  );

  const logOut = useCallback(async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully.");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed. Please try again.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const unsub = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUser(currentUser);
            setUserProfile(userData);

            const expires = userData.premiumAccessExpires?.toDate();
            setIsPremium(expires && expires > new Date());
            setPremiumExpires(expires || null);
            setFreeTrialCount(userData.freeTrialCount || 0);
            setFavoriteTests(userData.favoriteTests || []);
          }
          setLoading(false);
        });
        return () => unsub();
      } else {
        setUser(null);
        setUserProfile(null);
        setIsPremium(false);
        setPremiumExpires(null);
        setFreeTrialCount(0);
        setFavoriteTests([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      isPremium,
      premiumExpires,
      freeTrialCount,
      favoriteTests,
      isLibraryUser: userProfile?.role === "library-student",
      isLibraryOwner: userProfile?.role === "library-owner",
      ownedLibraryIds: userProfile?.libraryOwnerOf || [],
      libraryId: userProfile?.libraryId || null,
      googleSignIn,
      logOut,
      googleSignInForLibrary,
      googleSignInForLibraryOwner,
      openLoginPrompt,
      closeLoginPrompt,
      isLoginPromptOpen,
    }),
    [
      user,
      userProfile,
      loading,
      isPremium,
      premiumExpires,
      freeTrialCount,
      favoriteTests,
      googleSignIn,
      logOut,
      googleSignInForLibrary,
      googleSignInForLibraryOwner,
      isLoginPromptOpen,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
