// src/components/dashboard/LazyLibraryStats.js
"use client";

import { BarChartHorizontalBig } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LibraryUserStatsCard from "./LibraryUserStatsCard";

export default function LazyLibraryStats() {
  const [showStats, setShowStats] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Function to hide the stats and reset the state
  const hideStats = () => {
    setShowStats(false);
  };

  // Function to reset the inactivity timer
  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Set a new timer for 1 minute (60000 milliseconds)
    timerRef.current = setTimeout(hideStats, 60000);
  };

  // Effect to manage the timer and event listeners
  useEffect(() => {
    if (showStats) {
      resetTimer(); // Start the timer when stats are shown
      const wrapper = wrapperRef.current;
      // Add listeners to reset the timer on user activity
      wrapper?.addEventListener("mousemove", resetTimer);
      wrapper?.addEventListener("touchstart", resetTimer);
    }

    // Cleanup function to remove listeners and clear the timer
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      const wrapper = wrapperRef.current;
      wrapper?.removeEventListener("mousemove", resetTimer);
      wrapper?.removeEventListener("touchstart", resetTimer);
    };
  }, [showStats]);

  // If stats are shown, render the LibraryUserStatsCard component
  if (showStats) {
    return (
      <div ref={wrapperRef}>
        <LibraryUserStatsCard />
      </div>
    );
  }

  // Otherwise, show the button to load the stats
  return (
    <div className='mt-8'>
      <button
        onClick={() => setShowStats(true)}
        className='w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex justify-between items-center group'
      >
        <div>
          <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
            <BarChartHorizontalBig className='text-indigo-500' />
            Show My Monthly Usage
          </h2>
          <p className='text-slate-600 mt-1'>
            Check your test count for the current month against your library's
            limit.
          </p>
        </div>
      </button>
    </div>
  );
}
