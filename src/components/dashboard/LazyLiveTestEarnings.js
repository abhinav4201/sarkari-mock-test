"use client";

import { useState } from "react";
import LiveTestEarnings from "./LiveTestEarnings";
import { IndianRupee } from "lucide-react";

export default function LazyLiveTestEarnings() {
  const [showEarnings, setShowEarnings] = useState(false);

  if (showEarnings) {
    return <LiveTestEarnings />;
  }

  return (
    <div className='mt-8'>
      <button
        onClick={() => setShowEarnings(true)}
        className='w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex justify-between items-center group'
      >
        <div>
          <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
            <IndianRupee className='text-indigo-500' />
            Show My Live Test Earnings
          </h2>
          <p className='text-slate-600 mt-1'>
            View your winnings from live prize pool tests.
          </p>
        </div>
      </button>
    </div>
  );
}
