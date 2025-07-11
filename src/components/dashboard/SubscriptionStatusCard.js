"use client";

import { useAuth } from "@/context/AuthContext";
import { Crown, ShieldCheck } from "lucide-react";

export default function SubscriptionStatusCard({ onUpgradeClick }) {
  const { isPremium, premiumExpires, loading } = useAuth();

  if (loading) {
    // Show a placeholder while the user's status is being checked
    return (
      <div className='mt-8 bg-slate-200 p-8 rounded-2xl animate-pulse h-[116px]'></div>
    );
  }

  // --- UI for a user WITH an active premium subscription ---
  if (isPremium && premiumExpires) {
    const remainingDays = Math.ceil(
      (premiumExpires - new Date()) / (1000 * 60 * 60 * 24)
    );
    return (
      <div className='mt-8 bg-gradient-to-r from-green-500 to-teal-500 p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold flex items-center gap-2'>
            <ShieldCheck /> Premium Access Active
          </h2>
          <p className='mt-1 opacity-90'>
            Your subscription is active for{" "}
            {remainingDays > 0 ? `another ${remainingDays} day(s)` : "today"}.
          </p>
        </div>
        <button
          onClick={onUpgradeClick}
          className='mt-4 md:mt-0 px-8 py-3 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-all'
        >
          Manage Subscription
        </button>
      </div>
    );
  }

  // --- UI for a user WITHOUT a premium subscription ---
  return (
    <div className='mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-center'>
      <div>
        <h2 className='text-2xl font-bold flex items-center gap-2'>
          <Crown /> Unlock Premium Access
        </h2>
        <p className='mt-1 opacity-80'>
          Get access to all exclusive premium content.
        </p>
      </div>
      <button
        onClick={onUpgradeClick}
        className='mt-4 md:mt-0 px-8 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-slate-100 transition-all'
      >
        Go Premium
      </button>
    </div>
  );
}
