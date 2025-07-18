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
} from "firebase/firestore";
import { Crown, Loader2, PlayCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import TestStartConfirmModal from "./TestStartConfirmModal";

export default function StartTestButton({ test }) {
  const { user, googleSignIn, isPremium, isLibraryUser, userProfile } =
    useAuth();
  const { visitorId } = useFingerprint();
  const pathname = usePathname();
  const [isPreparing, setIsPreparing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userTestStats, setUserTestStats] = useState(null);
  const router = useRouter();

  const handleLogin = () => {
    googleSignIn(pathname);
  };

  const proceedToStartTest = async () => {
    setIsConfirmModalOpen(false); // Close modal if open
    if (!user) return handleLogin();
    if (isPreparing) return;
    if (!visitorId) {
      toast.error("Could not identify device. Please refresh and try again.");
      return;
    }

    setIsPreparing(true);
    const loadingToast = toast.loading("Preparing your test...");

    try {
      const idToken = await user.getIdToken();
      // Permission check is still done server-side for security
      const permissionRes = await fetch("/api/library-users/start-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      const permissionData = await permissionRes.json();
      if (!permissionRes.ok || !permissionData.allowed) {
        throw new Error(
          permissionData.message || "You are not allowed to take this test."
        );
      }

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
        const { sourceCriteria, questionCount } = test;
        const q = query(
          collection(db, "questionBank"),
          where("topic", "==", sourceCriteria.topic),
          where("subject", "==", sourceCriteria.subject)
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

  const handleStartClick = async () => {
    if (!user) return handleLogin();
    if (isPreparing) return;

    if (isLibraryUser && userProfile?.libraryId) {
      setIsPreparing(true);
      const loadingToast = toast.loading("Checking your test limit...");
      try {
        const libraryRef = doc(db, "libraries", userProfile.libraryId);
        const librarySnap = await getDoc(libraryRef);
        if (!librarySnap.exists())
          throw new Error("Could not verify library membership.");
        const limit = librarySnap.data().monthlyTestLimit || 0;

        const yearMonth = `${new Date().getFullYear()}-${
          new Date().getMonth() + 1
        }`;
        const countRef = doc(
          db,
          `users/${user.uid}/monthlyTestCounts/${yearMonth}`
        );
        const countSnap = await getDoc(countRef);
        const taken = countSnap.exists() ? countSnap.data().count : 0;

        toast.dismiss(loadingToast);

        if (taken > 0 && limit > 0) {
          setUserTestStats({ taken, limit, remaining: limit - taken });
          setIsConfirmModalOpen(true);
          setIsPreparing(false);
          return;
        }

        await proceedToStartTest();
      } catch (error) {
        toast.error(error.message || "Could not check test limit.", {
          id: loadingToast,
        });
        setIsPreparing(false);
      }
    } else {
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
