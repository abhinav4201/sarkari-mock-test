// src/components/mock-tests/StartTestButton.js

"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { PlayCircle, Loader2, Crown } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useFingerprint } from "@/hooks/useFingerprint";

export default function StartTestButton({ test }) {
  const { user, googleSignIn, isPremium } = useAuth();
  const { visitorId } = useFingerprint();
  const pathname = usePathname();
  const [isPreparing, setIsPreparing] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    googleSignIn(pathname);
  };

  const handleStartDynamicTest = async () => {
    // This function now just handles the dynamic instance creation
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

    const instanceRef = await addDoc(collection(db, "dynamicTestInstances"), {
      userId: user.uid,
      originalTestId: test.id,
      testTitle: test.title,
      estimatedTime: test.estimatedTime,
      questions: finalQuestions,
      createdAt: serverTimestamp(),
    });

    return instanceRef.id;
  };

  const handleStartClick = async () => {
    if (!user) return handleLogin();
    if (isPreparing) return;

        if (!visitorId) {
          toast.error(
            "Could not identify device. Please refresh and try again."
          );
          return;
        }

    setIsPreparing(true);
    const loadingToast = toast.loading("Preparing your test...");

    try {
      // Step 1: Call the fingerprinting API (works for both test types)
      const idToken = await user.getIdToken();
      await fetch("/api/tests/start-fingerprint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ testId: test.id }),
      });

      // Step 2: Determine navigation path
      let targetPath;
      if (test.isDynamic) {
        const instanceId = await handleStartDynamicTest();
        targetPath = `/mock-tests/take/take-dynamic/${instanceId}`;
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

  // JSX for the button remains the same
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
    <button
      onClick={handleStartClick}
      disabled={isPreparing}
      className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400'
    >
      {isPreparing ? (
        <>
          <Loader2 className='animate-spin h-6 w-6 mr-3' />
          Preparing Test...
        </>
      ) : (
        <>
          <PlayCircle className='h-6 w-6 mr-3' />
          Start Test Now
        </>
      )}
    </button>
  );
}
