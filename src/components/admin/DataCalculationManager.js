// src/components/admin/DataCalculationManager.js
"use client";

import { useAuth } from "@/context/AuthContext";
import { BarChart, TrendingUp, CalendarCheck } from "lucide-react"; // Import new icon
import { useState } from "react";
import toast from "react-hot-toast";

export default function DataCalculationManager() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async (endpoint, successMessage, loadingMessage) => {
    if (!user) return toast.error("You must be logged in as an admin.");
    setIsLoading(true);
    const loadingToast = toast.loading(loadingMessage);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message || successMessage, {
        id: loadingToast,
        duration: 5000,
      });
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='mt-8 bg-white p-6 rounded-2xl shadow-lg border'>
      <h2 className='text-xl font-semibold text-slate-900 mb-4'>
        Manual Data Processing
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <button
          onClick={() =>
            handleCalculate(
              "calculate-leaderboard",
              "Weekly Leaderboard Updated!",
              "Recalculating Leaderboard..."
            )
          }
          disabled={isLoading}
          className='p-4 bg-blue-100 text-blue-800 rounded-lg font-semibold hover:bg-blue-200 disabled:opacity-50 flex items-center gap-3'
        >
          <BarChart />
          <span>Recalculate Leaderboard</span>
        </button>
        <button
          onClick={() =>
            handleCalculate(
              "calculate-trends",
              "Platform Trends Updated!",
              "Recalculating Trends..."
            )
          }
          disabled={isLoading}
          className='p-4 bg-green-100 text-green-800 rounded-lg font-semibold hover:bg-green-200 disabled:opacity-50 flex items-center gap-3'
        >
          <TrendingUp />
          <span>Recalculate Trends</span>
        </button>
        {/* NEW BUTTON */}
        <button
          onClick={() =>
            handleCalculate(
              "generate-challenges",
              "Challenges & Plans Generated!",
              "Generating Content..."
            )
          }
          disabled={isLoading}
          className='p-4 bg-purple-100 text-purple-800 rounded-lg font-semibold hover:bg-purple-200 disabled:opacity-50 flex items-center gap-3'
        >
          <CalendarCheck />
          <span>Generate Daily Content</span>
        </button>
      </div>
    </div>
  );
}
