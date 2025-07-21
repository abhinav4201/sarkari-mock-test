// src/components/results/XPSummary.js

"use client";

import { useSearchParams } from "next/navigation";

export default function XPSummary() {
  const searchParams = useSearchParams();
  const xpGained = searchParams.get("xpGained");

  if (!xpGained || Number(xpGained) === 0) {
    return null;
  }

  return (
    <div className='text-center my-8 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl animate-fade-in'>
      <p className='text-lg font-semibold text-amber-800'>
        You earned{" "}
        <span className='font-extrabold text-2xl'>{xpGained} XP</span> for this
        test!
      </p>
    </div>
  );
}
