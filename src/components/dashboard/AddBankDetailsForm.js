// src/components/dashboard/AddBankDetailsForm.js

"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Landmark } from "lucide-react";

export default function AddBankDetailsForm({
  existingDetails,
  onDetailsAdded,
}) {
  const { user } = useAuth();
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill the form if existing details are provided
  useEffect(() => {
    if (existingDetails) {
      setAccountHolderName(existingDetails.accountHolderName || "");
      setAccountNumber(existingDetails.accountNumber || "");
      setIfscCode(existingDetails.ifscCode || "");
    }
  }, [existingDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountHolderName || !accountNumber || !ifscCode) {
      return toast.error("All fields are required.");
    }
    setIsSubmitting(true);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        bankDetails: {
          accountHolderName,
          accountNumber,
          ifscCode,
        },
      });
      toast.success("Bank details saved successfully!");
      if (onDetailsAdded) onDetailsAdded();
    } catch (error) {
      toast.error("Failed to save details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='p-6 bg-white rounded-xl border-2 border-dashed border-indigo-300'>
      <div className='text-center mb-6'>
        <Landmark className='mx-auto h-12 w-12 text-indigo-500' />
        <h3 className='text-xl font-bold text-slate-800 mt-2'>
          {existingDetails
            ? "Update Your Payment Details"
            : "Add Your Payment Details"}
        </h3>
        <p className='text-sm text-slate-600'>
          Please provide your bank details to receive payments.
        </p>
      </div>
      <form onSubmit={handleSubmit} className='space-y-4 max-w-md mx-auto'>
        <div>
          <label className='block text-sm font-medium text-slate-700'>
            Account Holder Name
          </label>
          <input
            type='text'
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
            className='mt-1 w-full text-slate-900 p-2 border border-slate-300 rounded-md'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-slate-700'>
            Account Number
          </label>
          <input
            type='text'
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className='mt-1 w-full p-2 text-slate-900 border border-slate-300 rounded-md'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-slate-700'>
            IFSC Code
          </label>
          <input
            type='text'
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
            required
          />
        </div>
        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
        >
          {isSubmitting ? "Saving..." : "Save Details"}
        </button>
      </form>
    </div>
  );
}
