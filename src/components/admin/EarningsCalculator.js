// src/components/admin/EarningsCalculator.js

"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Calculator } from "lucide-react";
import CalculateEarningsModal from "./CalculateEarningsModal"; // Import the new modal

export default function EarningsCalculator() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control the modal

  const handleCalculate = async () => {
    setIsModalOpen(false); // Close the modal first
    setIsLoading(true);
    const loadingToast = toast.loading(
      "Calculating earnings for all creators..."
    );

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/calculate-earnings", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message, { id: loadingToast, duration: 5000 });
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmationModal = () => {
    if (!user) return toast.error("You must be logged in as an admin.");
    setIsModalOpen(true);
  };

  return (
    <>
      <CalculateEarningsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCalculate}
        isLoading={isLoading}
      />
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-indigo-200 mt-8'>
        <h3 className='text-xl font-bold text-slate-900'>
          Financial Management
        </h3>
        <p className='text-slate-600 mt-1 mb-4'>
          Run the calculation script to update the latest earnings and pending
          payouts for all monetized creators.
        </p>
        <button
          onClick={openConfirmationModal}
          disabled={isLoading}
          className='w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center gap-2'
        >
          <Calculator size={18} />
          {isLoading ? "Calculating..." : "Calculate All Earnings"}
        </button>
      </div>
    </>
  );
}
