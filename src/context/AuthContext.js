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

  const router = useRouter();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const openLoginPrompt = () => setIsLoginPromptOpen(true);
  const closeLoginPrompt = () => setIsLoginPromptOpen(false);

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
        const libraryUserRef = doc(db, "libraryUsers", loggedInUser.uid);

        const [userSnap, libraryUserSnap] = await Promise.all([
          getDoc(userRef),
          getDoc(libraryUserRef),
        ]);

        const visitorId = await getFingerprint();

        if (ownerJoinCode) {
          const librariesQuery = query(
            collection(db, "libraries"),
            where("ownerJoinCode", "==", ownerJoinCode),
            limit(1)
          );
          const librarySnapshot = await getDocs(librariesQuery);

          if (!librarySnapshot.empty) {
            const libraryDoc = librarySnapshot.docs[0];
            const libraryData = libraryDoc.data();
            const libraryIdToOwn = libraryDoc.id;

            await setDoc(
              userRef,
              {
                uid: loggedInUser.uid,
                name: loggedInUser.displayName,
                email: loggedInUser.email,
                lastLogin: serverTimestamp(),
                initialVisitorId: visitorId,
                libraryOwnerOf: arrayUnion(libraryIdToOwn),
              },
              { merge: true }
            );

            await updateDoc(libraryDoc.ref, {
              ownerId: loggedInUser.uid,
            });

            // --- THIS IS THE FIX ---
            // Set owner state immediately after successful sign-in
            setUser(loggedInUser);
            setIsLibraryOwner(true);
            setOwnedLibraryIds((prev) => [...new Set([...prev, libraryIdToOwn])]);
            // --- END OF FIX ---

            toast.success(
              `Welcome, Library Owner of ${libraryData.libraryName}!`
            );
            router.push(`/library-owner/${libraryIdToOwn}`); // Correct redirect
            return;
          } else {
            toast.error("Invalid owner join code.");
            await signOut(auth);
            return;
          }
        }

        if (libraryUserSnap.exists()) {
          router.push("/library-dashboard");
          return;
        }

        if (userSnap.exists()) {
          if (joinLibraryId) {
            toast.error(
              "This email is already registered as a regular user and cannot be added as a student to a library. Please use a different email or sign in normally.",
              {
                duration: 8000,
              }
            );
            await signOut(auth);
            return;
          }
          await setDoc(
            userRef,
            { lastLogin: serverTimestamp() },
            { merge: true }
          );
          window.location.href = redirectUrl;
          return;
        }

        if (joinLibraryId) {
          await setDoc(libraryUserRef, {
            uid: loggedInUser.uid,
            name: loggedInUser.displayName,
            email: loggedInUser.email,
            libraryId: joinLibraryId,
            role: "student",
            createdAt: serverTimestamp(),
            initialVisitorId: visitorId,
          });
          setUser(loggedInUser);
          setIsLibraryUser(true);
          setLibraryId(joinLibraryId);
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
        if (error.code !== "auth/popup-closed-by-user") {
          toast.error("Failed to sign in. Please try again.");
        }
        console.error("Google Sign-In Error:", error);
      }
    },
    [adminEmail, router]
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
      router.push("/");
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    let userSnapshotUnsubscribe = null;
    let libraryUserSnapshotUnsubscribe = null;

    const authStateUnsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (userSnapshotUnsubscribe) {
          userSnapshotUnsubscribe();
        }
        if (libraryUserSnapshotUnsubscribe) {
          libraryUserSnapshotUnsubscribe();
        }

        if (currentUser) {
          if (currentUser.email === adminEmail) {
            setUser(currentUser);
            setIsLibraryUser(false);
            setIsLibraryOwner(false);
            setOwnedLibraryIds([]);
            setLibraryId(null);
            setLoading(false);
            return;
          }

          const libraryUserRef = doc(db, "libraryUsers", currentUser.uid);
          libraryUserSnapshotUnsubscribe = onSnapshot(
            libraryUserRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const libraryUserData = docSnap.data();
                setUser(currentUser);
                setIsLibraryUser(true);
                setIsLibraryOwner(false);
                setOwnedLibraryIds([]);
                setLibraryId(libraryUserData.libraryId);
                setLoading(false);
              } else {
                const userDocRef = doc(db, "users", currentUser.uid);
                userSnapshotUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
                  if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const expires = userData.premiumAccessExpires?.toDate();
                    setIsPremium(expires && expires > new Date());
                    setPremiumExpires(expires || null);
                    setFreeTrialCount(userData.freeTrialCount || 0);
                    setFavoriteTests(userData.favoriteTests || []);

                    const ownedLibs = userData.libraryOwnerOf || [];
                    setIsLibraryOwner(ownedLibs.length > 0);
                    setOwnedLibraryIds(ownedLibs);

                    setUser(currentUser);
                    setIsLibraryUser(false);
                    setLibraryId(null);
                    setLoading(false);
                  } else {
                    setUser(null);
                    setIsPremium(false);
                    setFreeTrialCount(0);
                    setFavoriteTests([]);
                    setIsLibraryUser(false);
                    setIsLibraryOwner(false);
                    setOwnedLibraryIds([]);
                    setLibraryId(null);
                    setLoading(false);
                  }
                });
              }
            }
          );
        } else {
          setUser(null);
          setIsPremium(false);
          setFreeTrialCount(0);
          setFavoriteTests([]);
          setIsLibraryUser(false);
          setIsLibraryOwner(false);
          setOwnedLibraryIds([]);
          setLibraryId(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authStateUnsubscribe();
      if (userSnapshotUnsubscribe) {
        userSnapshotUnsubscribe();
      }
      if (libraryUserSnapshotUnsubscribe) {
        libraryUserSnapshotUnsubscribe();
      }
    };
  }, [adminEmail]);

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
      libraryId,
      googleSignInForLibrary,
      isLibraryOwner,
      ownedLibraryIds,
      googleSignInForLibraryOwner,
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
      libraryId,
      googleSignInForLibrary,
      isLibraryOwner,
      ownedLibraryIds,
      googleSignInForLibraryOwner,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
