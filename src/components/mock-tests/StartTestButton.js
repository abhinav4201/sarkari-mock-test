"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Shield, PlayCircle, Loader2, Crown } from "lucide-react";
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
  // --- UPDATED: Now gets the isPremium status from the Auth Context ---
  const { user, googleSignIn, isPremium } = useAuth();
  const pathname = usePathname();
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    googleSignIn(pathname);
  };

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

  const handleStartClick = () => {
    if (test.isDynamic) {
      handleStartDynamicTest();
    } else {
      router.push(`/mock-tests/take/${test.id}`);
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

  // --- NEW: This is the premium check logic ---
  if (test.isPremium && !isPremium) {
    return (
      <button
        // You could link this to the dashboard or open the payment modal directly
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
      disabled={isCreating}
      className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400'
    >
      {isCreating ? (
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
