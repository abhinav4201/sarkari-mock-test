// src/components/dashboard/LazyTestHistory.js
"use client";

import { History } from "lucide-react";
import { useState } from "react";
import TestHistory from "./TestHistory";

export default function LazyTestHistory() {
  const [showHistory, setShowHistory] = useState(false);

  if (showHistory) {
    return (
      <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
        <h2 className='text-2xl font-bold text-slate-900 mb-6'>
          Your Test History
        </h2>
        <TestHistory />
      </div>
    );
  }

  return (
    <div className='mt-8'>
      <button
        onClick={() => setShowHistory(true)}
        className='w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex justify-between items-center group'
      >
        <div>
          <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
            <History className='text-indigo-500' />
            Show Test History
          </h2>
          <p className='text-slate-600 mt-1'>
            View results from all the tests you have completed.
          </p>
        </div>
      </button>
    </div>
  );
}
