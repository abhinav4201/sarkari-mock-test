"use client";

import { useAuth } from "@/context/AuthContext";
import { useFingerprint } from "@/hooks/useFingerprint";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { Crown, Loader2, PlayCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation"; // Correctly import useSearchParams
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import TestStartConfirmModal from "./TestStartConfirmModal";
import Cookies from "js-cookie";

export default function StartTestButton({ test }) {
  const { user, googleSignIn, isPremium, isLibraryUser, userProfile } =
    useAuth();
  const { visitorId } = useFingerprint();
  const pathname = usePathname();
  const [isPreparing, setIsPreparing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userTestStats, setUserTestStats] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams(); // Correctly use the hook

  const handleLogin = () => {
    googleSignIn({ redirectUrl: pathname });
  };

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      Cookies.set("referral_code", refCode, { expires: 7 });
    }
  }, [searchParams]);

  // This function contains the logic to actually start the test,
  // and is only called after all checks and confirmations are complete.
  const proceedToStartTest = async () => {
    setIsConfirmModalOpen(false); // Ensure modal is closed
    if (isPreparing) return;
    setIsPreparing(true);
    const loadingToast = toast.loading("Preparing your test...");

    try {
      const idToken = await user.getIdToken();

      if (test.isPremium && !isPremium && userProfile?.premiumCredits > 0) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          premiumCredits: increment(-1),
        });
        toast.success("Free premium test credit used!");
      }

      // The API call now only increments the counter, as the check is done client-side
      await fetch("/api/library-users/start-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      await fetch("/api/tests/start-fingerprint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ testId: test.id, visitorId }),
      });

      let targetPath;
      if (test.isDynamic) {
        // Dynamic test instance creation logic...
        const { sourceCriteria, questionCount } = test;
        const q = query(
          collection(db, "questionBank"),
          where("topic", "==", sourceCriteria.topic),
          where("subject", "==", sourceCriteria.subject),
          ...(test.isPremium ? [where("isPremium", "==", true)] : [])
        );
        const bankSnapshot = await getDocs(q);
        let potentialQuestions = bankSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        potentialQuestions.sort(() => 0.5 - Math.random());
        const finalQuestions = potentialQuestions.slice(0, questionCount);

        if (finalQuestions.length < questionCount) {
          throw new Error("Not enough questions in the bank for this topic.");
        }

        const instanceRef = await addDoc(
          collection(db, "dynamicTestInstances"),
          {
            userId: user.uid,
            originalTestId: test.id,
            testTitle: test.title,
            estimatedTime: test.estimatedTime,
            questions: finalQuestions,
            createdAt: serverTimestamp(),
          }
        );
        targetPath = `/mock-tests/take/take-dynamic/${instanceRef.id}`;
      } else {
        targetPath = `/mock-tests/take/${test.id}`;
      }

      router.push(targetPath);
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.error(error.message || "Could not start the test.", {
        id: loadingToast,
      });
      setIsPreparing(false);
    }
  };

  // This is the main function called on button click
  const handleStartClick = async () => {
    if (!user) return handleLogin();
    if (isPreparing) return;

    if (isLibraryUser && userProfile?.libraryId) {
      setIsPreparing(true);
      const loadingToast = toast.loading("Checking your test limit...");

      try {
        // 1. Get library limit
        const libraryRef = doc(db, "libraries", userProfile.libraryId);
        const librarySnap = await getDoc(libraryRef);
        if (!librarySnap.exists()) {
          throw new Error("Could not verify library membership.");
        }
        const limit = librarySnap.data().monthlyTestLimit || 0;

        // 2. Get the accurate, up-to-date count of tests taken this month
        const now = new Date();
        const startOfMonth = Timestamp.fromDate(
          new Date(now.getFullYear(), now.getMonth(), 1)
        );
        const endOfMonth = Timestamp.fromDate(
          new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        );

        const resultsQuery = query(
          collection(db, "mockTestResults"),
          where("userId", "==", user.uid),
          where("libraryId", "==", userProfile.libraryId),
          where("completedAt", ">=", startOfMonth),
          where("completedAt", "<=", endOfMonth)
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const taken = resultsSnapshot.size;

        toast.dismiss(loadingToast);

        // 3. Check conditions to show the modal
        if (limit > 0) {
          // Only check if a limit is actually set
          if (taken >= limit) {
            toast.error(
              `You have reached your monthly limit of ${limit} tests.`
            );
            setIsPreparing(false);
            return;
          }
          if (taken > 0) {
            // Show modal only if it's not the first test
            setUserTestStats({ taken, limit, remaining: limit - taken });
            setIsConfirmModalOpen(true);
            setIsPreparing(false);
            return; // Stop here and wait for user confirmation
          }
        }

        // If it's the first test or unlimited, proceed directly
        await proceedToStartTest();
      } catch (error) {
        toast.error(error.message || "Could not check test limit.", {
          id: loadingToast,
        });
        setIsPreparing(false);
      }
    } else {
      // For non-library users, start the test directly
      await proceedToStartTest();
    }
  };

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 bg-indigo-600 text-white rounded-lg text-lg font-bold hover:bg-indigo-700'
      >
        Login to Start Test
      </button>
    );
  }

  if (test.isPremium && !isPremium && userProfile?.premiumCredits > 0) {
    return (
      <button
        onClick={handleStartClick}
        disabled={isPreparing}
        className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-teal-400'
      >
        {isPreparing
          ? "Starting..."
          : `Use 1 Free Credit (${userProfile.premiumCredits} left)`}
      </button>
    );
  }

  if (test.isPremium && !isPremium) {
    return (
      <button
        onClick={() => router.push("/dashboard")}
        className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 bg-amber-500 text-white rounded-lg text-lg font-bold cursor-pointer hover:bg-amber-600'
      >
        <Crown className='mr-2 h-5 w-5' /> Upgrade to Start
      </button>
    );
  }

  return (
    <>
      <TestStartConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={proceedToStartTest}
        isLoading={isPreparing}
        stats={userTestStats}
      />
      <button
        onClick={handleStartClick}
        disabled={isPreparing}
        className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400'
      >
        {isPreparing ? (
          <>
            <Loader2 className='animate-spin h-6 w-6 mr-3' />
            Preparing...
          </>
        ) : (
          <>
            <PlayCircle className='h-6 w-6 mr-3' />
            Start Test Now
          </>
        )}
      </button>
    </>
  );
}
