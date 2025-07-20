// src/components/dashboard/LazyProgressChart.js
"use client";

import { BarChart2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProgressChart from "./ProgressChart";

export default function LazyProgressChart() {
  const [showChart, setShowChart] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  const hideChart = () => {
    setShowChart(false);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(hideChart, 60000); // 1 minute
  };

  useEffect(() => {
    if (showChart) {
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
  }, [showChart]);

  if (showChart) {
    return (
      <div ref={wrapperRef}>
        <ProgressChart />
      </div>
    );
  }

  return (
    <div className='mt-8'>
      <button
        onClick={() => setShowChart(true)}
        className='w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex justify-between items-center group'
      >
        <div>
          <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
            <BarChart2 className='text-indigo-500' />
            Show My Progress
          </h2>
          <p className='text-slate-600 mt-1'>
            View your performance over the last 10 tests.
          </p>
        </div>
      </button>
    </div>
  );
}
