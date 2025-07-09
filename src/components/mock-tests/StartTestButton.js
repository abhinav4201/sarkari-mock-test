"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Shield, PlayCircle, Loader2 } from "lucide-react";
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

export default function StartTestButton({ test }) {
  // --- OLD: Your original hooks (UNCHANGED) ---
  const { user, googleSignIn } = useAuth();
  const pathname = usePathname();

  // --- NEW: Add state for loading and router for navigation ---
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // --- OLD: Your original login handler (UNCHANGED) ---
  const handleLogin = () => {
    googleSignIn(pathname);
  };

  // --- NEW: Logic to handle starting a DYNAMIC test ---
  const handleStartDynamicTest = async () => {
    setIsCreating(true);
    const loadingToast = toast.loading("Preparing your unique test...");

    try {
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

      toast.success("Your test is ready!", { id: loadingToast });
      router.push(`/mock-tests/take/take-dynamic/${instanceRef.id}`);
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
      setIsCreating(false);
    }
  };

  // --- NEW: A single handler that decides what to do on click ---
  const handleStartClick = () => {
    if (test.isDynamic) {
      handleStartDynamicTest();
    } else {
      router.push(`/mock-tests/take/${test.id}`);
    }
  };

  // --- OLD: Your original login check logic (UNCHANGED) ---
  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 bg-indigo-600 text-white rounded-lg text-lg font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
      >
        Login to Start Test
      </button>
    );
  }

  // --- OLD: Your original premium check logic (UNCHANGED) ---
  if (test.isPremium) {
    return (
      <button
        disabled
        className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 bg-slate-400 text-white rounded-lg text-lg font-bold cursor-not-allowed'
      >
        <Shield className='mr-2 h-5 w-5' /> Upgrade to Start
      </button>
    );
  }

  // --- UPDATED: The final button now uses the smart click handler ---
  return (
    <button
      onClick={handleStartClick}
      disabled={isCreating}
      className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-lg hover:shadow-xl disabled:bg-green-400 disabled:cursor-not-allowed'
    >
      {isCreating ? (
        <>
          <Loader2 className='animate-spin h-6 w-6 mr-3' />
          <span>Preparing Test...</span>
        </>
      ) : (
        <>
          <PlayCircle className='h-6 w-6 mr-3' />
          <span>Start Test Now</span>
        </>
      )}
    </button>
  );
}
