// src/components/dashboard/CreatorPayouts.js

"use client";

import { useState } from "react";
import AddBankDetailsForm from "./AddBankDetailsForm";
import { Banknote } from "lucide-react";

const EarningsSummary = ({ earnings, onEditClick }) => (
  <div className='p-6 bg-white rounded-xl border'>
    <div className='flex justify-between items-center mb-4'>
      <h3 className='text-xl font-bold text-slate-800'>Earnings Summary</h3>
      <button
        onClick={onEditClick}
        className='text-sm font-semibold text-indigo-600 hover:underline'
      >
        Edit Bank Details
      </button>
    </div>
    <div className='grid grid-cols-2 gap-4'>
      <div className='p-4 bg-slate-50 rounded-lg'>
        <p className='text-sm text-slate-600'>Lifetime Earnings</p>
        <p className='text-2xl font-bold text-green-600'>
          ₹{earnings.totalEarnings?.toLocaleString() || 0}
        </p>
      </div>
      <div className='p-4 bg-slate-50 rounded-lg'>
        <p className='text-sm text-slate-600'>Pending Payout</p>
        <p className='text-2xl font-bold text-amber-600'>
          ₹{earnings.pendingAmount?.toLocaleString() || 0}
        </p>
      </div>
    </div>
  </div>
);

export default function CreatorPayouts({ userProfile, earnings, onUpdate }) {
  // State to control whether the form or summary is visible
  const [isEditing, setIsEditing] = useState(false);

  if (!userProfile) return null;

  const hasBankDetails = !!userProfile.bankDetails;

  // If the user has details and is not in edit mode, show the summary.
  if (hasBankDetails && !isEditing) {
    return (
      <EarningsSummary
        earnings={earnings}
        onEditClick={() => setIsEditing(true)}
      />
    );
  }

  // In all other cases (no details OR is in edit mode), show the form.
  return (
    <AddBankDetailsForm
      existingDetails={userProfile.bankDetails}
      onDetailsAdded={() => {
        setIsEditing(false); // Exit edit mode on successful save
        onUpdate();
      }}
    />
  );
}
