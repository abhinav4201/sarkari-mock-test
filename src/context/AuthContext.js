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
  const [isLibraryUser, setIsLibraryUser] = useState(false);
  const [isLibraryOwner, setIsLibraryOwner] = useState(false);
  const [ownedLibraryIds, setOwnedLibraryIds] = useState([]);
  const [libraryId, setLibraryId] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
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
        const visitorId = await getFingerprint();

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

          // Perform all database writes before redirecting
          await updateDoc(libraryDoc.ref, { ownerId: loggedInUser.uid });
          await setDoc(
            userRef,
            {
              uid: loggedInUser.uid,
              name: loggedInUser.displayName,
              email: loggedInUser.email,
              libraryOwnerOf: arrayUnion(libraryIdToOwn),
            },
            { merge: true }
          );

          toast.success(`Welcome, Owner of ${libraryDoc.data().libraryName}!`);
          router.push(`/library-owner/${libraryIdToOwn}`);
          return;
        }

        const libraryUserRef = doc(db, "libraryUsers", loggedInUser.uid);
        const [userSnap, libraryUserSnap] = await Promise.all([
          getDoc(userRef),
          getDoc(libraryUserRef),
        ]);

        if (libraryUserSnap.exists()) {
          router.push("/library-dashboard");
          return;
        }

        if (userSnap.exists()) {
          if (joinLibraryId) {
            toast.error("This email is already registered as a regular user.", {
              duration: 8000,
            });
            await signOut(auth);
            return;
          }
          await updateDoc(userRef, { lastLogin: serverTimestamp() });
          window.location.href = redirectUrl;
          return;
        }

        if (joinLibraryId) {
          const libraryRef = doc(db, "libraries", joinLibraryId);
          const libSnap = await getDoc(libraryRef);
          if (!libSnap.exists() || !libSnap.data().ownerId) {
            toast.error("This library is not yet claimed by an owner.", {
              duration: 6000,
            });
            await signOut(auth);
            return;
          }
          const libraryOwnerId = libSnap.data().ownerId;
          await setDoc(libraryUserRef, {
            uid: loggedInUser.uid,
            name: loggedInUser.displayName,
            email: loggedInUser.email,
            libraryId: joinLibraryId,
            ownerId: libraryOwnerId,
            role: "student",
            createdAt: serverTimestamp(),
            initialVisitorId: visitorId,
          });
          router.push("/library-dashboard");
        } else {
          await setDoc(
            userRef,
            {
              uid: loggedInUser.uid,
              name: loggedInUser.displayName,
              email: loggedInUser.email,
              lastLogin: serverTimestamp(),
              initialVisitorId: visitorId,
              libraryOwnerOf: [],
            },
            { merge: true }
          );
          window.location.href = redirectUrl;
        }
      } catch (error) {
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
    router.push("/");
  } catch (error) {
    toast.error("Logout failed. Please try again.");
  }
}, [router]);

  useEffect(() => {
    const authStateUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      let userUnsubscribe = () => {};
      let libraryUserUnsubscribe = () => {};
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser(currentUser);
            const expires = userData.premiumAccessExpires?.toDate();
            setIsPremium(expires && expires > new Date());
            setPremiumExpires(expires || null);
            setFreeTrialCount(userData.freeTrialCount || 0);
            setFavoriteTests(userData.favoriteTests || []);
            const ownedLibs = userData.libraryOwnerOf || [];
            setIsLibraryOwner(ownedLibs.length > 0);
            setOwnedLibraryIds(ownedLibs);
            setIsLibraryUser(false);
            setLibraryId(null);
            setOwnerId(null);
            setLoading(false);
          } else {
            const libraryUserDocRef = doc(db, "libraryUsers", currentUser.uid);
            libraryUserUnsubscribe = onSnapshot(
              libraryUserDocRef,
              (libUserDoc) => {
                if (libUserDoc.exists()) {
                  const libraryUserData = libUserDoc.data();
                  setUser(currentUser);
                  setIsLibraryUser(true);
                  setLibraryId(libraryUserData.libraryId);
                  setIsLibraryOwner(false);
                  setOwnedLibraryIds([]);
                  setOwnerId(libraryUserData.ownerId);
                }
                setLoading(false);
              }
            );
          }
        });
      } else {
        setUser(null);
        setIsPremium(false);
        setPremiumExpires(null);
        setFreeTrialCount(0);
        setFavoriteTests([]);
        setIsLibraryUser(false);
        setIsLibraryOwner(false);
        setOwnedLibraryIds([]);
        setLibraryId(null);
        setLoading(false);
      }
      return () => {
        userUnsubscribe();
        libraryUserUnsubscribe();
      };
    });
    return () => authStateUnsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isPremium,
      premiumExpires,
      freeTrialCount,
      favoriteTests,
      isLibraryOwner,
      ownedLibraryIds,
      isLibraryUser,
      libraryId,
      googleSignIn,
      logOut,
      googleSignInForLibrary,
      googleSignInForLibraryOwner,
      openLoginPrompt,
      closeLoginPrompt,
      isLoginPromptOpen,
      ownerId,
    }),
    [
      user,
      loading,
      isPremium,
      premiumExpires,
      freeTrialCount,
      favoriteTests,
      isLibraryOwner,
      ownedLibraryIds,
      isLibraryUser,
      libraryId,
      googleSignIn,
      logOut,
      googleSignInForLibrary,
      googleSignInForLibraryOwner,
      isLoginPromptOpen,
      ownerId,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
