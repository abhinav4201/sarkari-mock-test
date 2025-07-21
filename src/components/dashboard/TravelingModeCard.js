// src/components/dashboard/TravelingModeCard.js
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cacheTests } from "@/lib/indexedDb";
import toast from "react-hot-toast";
import { Plane, DownloadCloud, WifiOff } from "lucide-react";

export default function TravelingModeCard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    if (!user) return toast.error("Please log in to use Traveling Mode.");
    setIsLoading(true);
    const loadingToast = toast.loading("Preparing offline tests...");

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/tests/for-offline", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) throw new Error("Could not fetch tests for offline use.");

      const { tests, questions } = await res.json();

      if (tests.length === 0) {
        toast.success("You're all caught up! No new tests to download.", {
          id: loadingToast,
        });
        return;
      }

      // Combine tests with their respective questions
      const testsToCache = tests.map((test) => ({
        ...test,
        questions: questions.filter((q) => q.testId === test.id),
      }));

      await cacheTests(testsToCache);

      toast.success(`${tests.length} tests are now available offline!`, {
        id: loadingToast,
        duration: 4000,
      });
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='mt-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
      <div className='flex items-center gap-3'>
        <div className='bg-sky-100 p-3 rounded-full'>
          <Plane className='h-6 w-6 text-sky-600' />
        </div>
        <div>
          <h2 className='text-2xl font-bold text-slate-900'>Traveling Mode</h2>
          <p className='text-slate-600'>No internet? No problem.</p>
        </div>
      </div>
      <p className='mt-4 text-slate-700'>
        Download a batch of recommended tests to continue your preparation
        anywhere, even on a plane or train. Your results will sync automatically
        when you're back online.
      </p>
      <button
        onClick={handleActivate}
        disabled={isLoading}
        className='w-full mt-6 px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center gap-2'
      >
        {isLoading ? (
          <>
            <DownloadCloud className='animate-pulse h-5 w-5' />
            Preparing Offline Content...
          </>
        ) : (
          <>
            <WifiOff className='h-5 w-5' />
            Activate Traveling Mode
          </>
        )}
      </button>
    </div>
  );
}
