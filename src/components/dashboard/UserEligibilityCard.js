// src/components/dashboard/UserEligibilityCard.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import toast from "react-hot-toast";

export default function UserEligibilityCard({ userStats, onApply }) {
  const { user } = useAuth();
  const testsCreated = userStats.testsCreated || 0;
  const uniqueTakers = userStats.totalUniqueTakers || 0;

  const isEligible = testsCreated >= 100 && uniqueTakers >= 1000;

  const handleApplyClick = async () => {
    if (!user) return toast.error("Please log in.");
    const confirmation = window.confirm(
      "Are you sure you want to submit your profile for monetization review?"
    );
    if (confirmation) {
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, { monetizationStatus: "requested" });
        toast.success("Your application has been submitted for review!");
        onApply(); // This will refresh the parent component's state
      } catch (error) {
        toast.error("Failed to submit application. Please try again.");
      }
    }
  };

  if (userStats.monetizationStatus === "approved") {
    return (
      <div className='p-6 bg-green-100 border-2 border-green-200 rounded-xl text-center'>
        <h3 className='text-xl font-bold text-green-800'>Congratulations!</h3>
        <p className='text-green-700 mt-1'>
          Your creator account is approved for monetization.
        </p>
      </div>
    );
  }

  if (userStats.monetizationStatus === "requested") {
    return (
      <div className='p-6 bg-blue-100 border-2 border-blue-200 rounded-xl text-center'>
        <h3 className='text-xl font-bold text-blue-800'>
          Application Submitted
        </h3>
        <p className='text-blue-700 mt-1'>
          Your application is currently under review by our team.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-xl border-2 ${
        isEligible
          ? "bg-green-50 border-green-200"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <h3 className='text-xl font-bold text-slate-900'>
        Monetization Eligibility
      </h3>
      <p className='text-slate-600 mt-2'>
        To be eligible to apply for monetization, you must meet certain
        criteria.
        <Link
          href='/dashboard/monetization/policy'
          className='text-indigo-600 font-semibold hover:underline ml-1'
        >
          Read our policy
        </Link>
        .
      </p>
      <div className='mt-4 grid grid-cols-2 gap-4 text-center'>
        <div>
          <p className='font-bold text-2xl text-slate-800'>
            {testsCreated} / 100
          </p>
          <p className='text-sm text-slate-600'>Tests Created</p>
        </div>
        <div>
          <p className='font-bold text-2xl text-slate-800'>
            {uniqueTakers} / 1000
          </p>
          <p className='text-sm text-slate-600'>Total Unique Takers</p>
        </div>
      </div>
      {isEligible && (
        <button
          onClick={handleApplyClick}
          className='w-full mt-6 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700'
        >
          Apply for Monetization
        </button>
      )}
    </div>
  );
}
