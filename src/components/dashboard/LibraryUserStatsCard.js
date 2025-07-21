// src/components/dashboard/LibraryUserStatsCard.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";

export default function LibraryUserStatsCard() {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({ taken: 0, limit: 0, loading: false });
  const [statsVisible, setStatsVisible] = useState(false);

  // Refs for managing the inactivity timer
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Function to hide stats and reset state
  const hideStats = () => {
    setStatsVisible(false);
  };

  // Function to reset the inactivity timer
  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(hideStats, 60000); // 1 minute timeout
  };

  // Effect to manage the timer and event listeners
  useEffect(() => {
    if (statsVisible) {
      resetTimer();
      const wrapper = wrapperRef.current;
      wrapper?.addEventListener("mousemove", resetTimer);
      wrapper?.addEventListener("touchstart", resetTimer);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      const wrapper = wrapperRef.current;
      wrapper?.removeEventListener("mousemove", resetTimer);
      wrapper?.removeEventListener("touchstart", resetTimer);
    };
  }, [statsVisible]);

  const fetchStats = async () => {
    if (!user || !userProfile?.libraryId) {
      setStats({ taken: 0, limit: 0, loading: false });
      return;
    }

    setStats({ ...stats, loading: true });

    try {
      const libraryRef = doc(db, "libraries", userProfile.libraryId);
      const librarySnap = await getDoc(libraryRef);
      const limit = librarySnap.exists()
        ? librarySnap.data().monthlyTestLimit || 0
        : 0;

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

      setStats({ taken, limit, loading: false });
      setStatsVisible(true);
    } catch (error) {
      console.error("Error fetching library stats:", error);
      setStats({ taken: 0, limit: 0, loading: false });
    }
  };

  const remaining = stats.limit - stats.taken;
  const usagePercentage =
    stats.limit > 0 ? (stats.taken / stats.limit) * 100 : 0;

  let progressBarColor = "bg-green-500";
  if (usagePercentage >= 90) {
    progressBarColor = "bg-red-500";
  } else if (usagePercentage >= 70) {
    progressBarColor = "bg-amber-500";
  }

  return (
    <div
      ref={wrapperRef}
      className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='bg-indigo-100 p-3 rounded-full'>
            <CalendarDays className='h-6 w-6 text-indigo-600' />
          </div>
          <h2 className='text-2xl font-bold text-slate-900'>
            Your Monthly Test Limit
          </h2>
        </div>
        {statsVisible && (
          <button
            onClick={fetchStats}
            disabled={stats.loading}
            className='p-2 rounded-full hover:bg-slate-100 text-slate-600'
          >
            <RefreshCw
              className={`h-5 w-5 ${stats.loading ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>

      {stats.loading ? (
        <div className='mt-4 animate-pulse'>
          <div className='h-10 w-3/4 bg-slate-200 rounded mb-3'></div>
          <div className='h-3 w-full bg-slate-200 rounded'></div>
        </div>
      ) : !statsVisible ? (
        <div className='mt-4 text-center'>
          <button
            onClick={fetchStats}
            className='w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700'
          >
            Show My Monthly Usage
          </button>
        </div>
      ) : stats.limit > 0 ? (
        <div className='mt-4'>
          <div className='flex justify-between items-baseline mb-2'>
            <p className='text-slate-700'>
              <span className='font-bold text-3xl text-slate-900'>
                {stats.taken}
              </span>{" "}
              / {stats.limit} tests taken
            </p>
            <p className='font-bold text-lg text-slate-800'>
              {remaining < 0 ? 0 : remaining} left
            </p>
          </div>
          <div className='w-full bg-slate-200 rounded-full h-3'>
            <div
              className={`h-3 rounded-full ${progressBarColor} transition-all duration-500`}
              style={{
                width: `${usagePercentage > 100 ? 100 : usagePercentage}%`,
              }}
            ></div>
          </div>
        </div>
      ) : (
        <div className='mt-4 text-center p-4 bg-green-50 rounded-lg'>
          <p className='font-semibold text-green-800'>
            You have unlimited tests this month!
          </p>
        </div>
      )}
    </div>
  );
}
